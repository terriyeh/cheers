/**
 * CelebrationService
 *
 * Monitors user activity in Obsidian and triggers celebration animations when certain
 * achievements occur (note creation, task completion, link creation, word goals).
 *
 * Features:
 * - Event-based celebration triggers (note creation, editor changes, metadata cache)
 * - Debounced editor change handling (100ms)
 * - Race condition prevention (blocks overlapping celebrations)
 * - Per-file word count tracking for delta accumulation and crossing detection
 * - Daily word goal with midnight reset and persistence
 * - Per-note word goal read from frontmatter
 * - Link detection for files not open in any editor (via metadataCache 'changed' event)
 */

import type { TFile, TAbstractFile, Editor, EventRef, MarkdownFileInfo, MarkdownView, CachedMetadata } from 'obsidian';
import type CheersPlugin from '../main';
import { CELEBRATION_OVERLAY_CONSTANTS, STATUS_BAR_NOTIFICATION_DURATION_MS } from '../utils/celebration-constants';

/**
 * Celebration event types for logging / future toast differentiation
 */
type CelebrationEventType = 'note-create' | 'task-complete' | 'link-create' | 'word-goal';

/**
 * CelebrationService manages celebration triggers and cooldowns
 */
export class CelebrationService {
	// Constants for timing and limits
	private static readonly EDITOR_DEBOUNCE_MS = 100;
	private static readonly MAX_CONTENT_LENGTH = 1000000; // 1MB of text (~500 pages)
	/** Maximum value stored in any daily activity counter. Prevents inflated stats from large files. */
	private static readonly MAX_DAILY_COUNTER = 100_000;
	// Note: Celebration duration uses CELEBRATION_OVERLAY_CONSTANTS.CELEBRATION_DURATION_MS (5000ms)

	private plugin: CheersPlugin;

	// Event references for cleanup
	private eventRefs: EventRef[] = [];

	// Handler functions (stored for cleanup)
	private noteCreationHandler: ((file: TAbstractFile) => void) | null = null;
	private editorChangeHandler: ((editor: Editor, info: MarkdownView | MarkdownFileInfo) => void) | null = null;
	private metadataCacheHandler: ((file: TFile, data: string, cache: CachedMetadata) => void) | null = null;

	// Debounce timer for editor changes
	private editorChangeTimeout: number | undefined;

	// Per-file task/link counts — baselines set on first observation of each file,
	// preventing spurious increments when switching to a file with pre-existing content.
	private fileTaskCounts: Map<string, number> = new Map();
	private fileLinkCounts: Map<string, number> = new Map();

	// Per-file word counts (in-memory, resets on restart).
	// Initialised from the saved file content on first edit (see preloadFileWordCount).
	// Falls back to current editor count if the vault read fails.
	private fileWordCounts: Map<string, number> = new Map();

	// Preloaded saved-file word counts — set by preloadFileWordCount() before the first
	// debounce fires so checkWordGoals can detect crossings in the initial edit burst.
	private fileWordCountBaselines: Map<string, number> = new Map();

	// Files whose per-note goal was celebrated this session (prevents repeat within one session).
	// Intentionally not persisted: per-note goal celebrations reset on vault restart.
	// This means a user who closes and reopens Obsidian after crossing a per-note goal may
	// see one additional celebration on their next edit. Accepted behaviour for MVP.
	private perNoteGoalCelebrated: Set<string> = new Set();

	// Race condition prevention (replaces cooldown system)
	private isCelebrating: boolean = false;
	private celebrationTimeout: number | undefined;

	// Status bar notification
	private statusBarItem: HTMLElement | null = null;
	private statusBarClearTimeout: number | undefined;
	private static getStatusBarMessage(eventType: CelebrationEventType, petName: string): string {
		const messages: Record<CelebrationEventType, string> = {
			'note-create':   `✨ ${petName} is energized by a fresh new note`,
			'task-complete': `✅ Hooray! ${petName} is doing a happy dance`,
			'link-create':   `🔗 ${petName} loves a fresh new link`,
			'word-goal':     `🏆 Woohoo! ${petName} is celebrating your writing goal!`,
		};
		return messages[eventType];
	}

	constructor(plugin: CheersPlugin, statusBarItem: HTMLElement | null = null) {
		this.plugin = plugin;
		this.statusBarItem = statusBarItem;

		// Register event listeners (individual celebration types check their own toggles)
		this.registerEventListeners();
	}

	/**
	 * Asynchronously read the saved file content and store its word count as a baseline.
	 * Called (fire-and-forget) from handleEditorChange on first encounter of a file.
	 * The 100ms debounce window gives this read enough time to complete before
	 * processEditorChange runs, so checkWordGoals can detect goal crossings that happen
	 * entirely within the first edit burst of a session.
	 */
	private async preloadFileWordCount(file: TFile): Promise<void> {
		try {
			const savedContent = await this.plugin.app.vault.cachedRead(file);
			// Only set if the debounce hasn't fired yet (fileWordCounts would have the key otherwise)
			if (!this.fileWordCounts.has(file.path)) {
				this.fileWordCountBaselines.set(file.path, CelebrationService.countWords(savedContent));
			}
		} catch {
			// File not yet on disk or vault read unavailable — checkWordGoals falls back to current count
		}
	}

	/**
	 * Register Obsidian event listeners
	 */
	private registerEventListeners(): void {
		const { vault, workspace } = this.plugin.app;
		const metadataCache = this.plugin.app.metadataCache;

		// Create bound handlers
		this.noteCreationHandler = this.handleNoteCreation.bind(this);
		this.editorChangeHandler = this.handleEditorChange.bind(this);
		this.metadataCacheHandler = this.handleMetadataCacheChange.bind(this);

		try {
			// Delay 'create' and 'changed' listeners until after vault initialisation to avoid
			// counting all existing notes/links as "created today" on plugin load.
			workspace.onLayoutReady(() => {
				const createRef = vault.on('create', this.noteCreationHandler!);
				if (createRef) {
					this.eventRefs.push(createRef);
				} else {
					console.warn('[CelebrationService] Vault event registration returned null');
				}

				const metadataCacheRef = metadataCache.on('changed', this.metadataCacheHandler!);
				if (metadataCacheRef) {
					this.eventRefs.push(metadataCacheRef);
				} else {
					console.warn('[CelebrationService] MetadataCache event registration returned null');
				}

				// Pre-populate link count baselines from the current cache state.
				// Without this, the first metadataCache:changed event for any file would be
				// treated as a "first observation" and set the baseline instead of detecting
				// a delta — causing Unlinked Mentions "Link" clicks to never celebrate.
				for (const file of vault.getMarkdownFiles()) {
					const cache = metadataCache.getFileCache(file);
					const linkCount = (cache?.links?.length ?? 0) + (cache?.embeds?.length ?? 0);
					this.fileLinkCounts.set(file.path, linkCount);
				}
			});

			// Listen for editor changes (debounced) — not deferred so typing responsiveness is immediate
			const editorChangeRef = workspace.on('editor-change', this.editorChangeHandler);
			if (editorChangeRef) {
				this.eventRefs.push(editorChangeRef);
			} else {
				console.warn('[CelebrationService] Workspace event registration returned null');
			}
		} catch (error) {
			console.error('[CelebrationService] Failed to register event listeners:', error);
		}
	}

	/**
	 * Handle note creation event
	 * @param file - The file that was created
	 */
	private handleNoteCreation(file: TAbstractFile): void {
		// Only process markdown files
		if (!file.path.endsWith('.md')) {
			return;
		}

		// Reset daily stats if the date has rolled over (midnight reset).
		// Placed AFTER the isMarkdown guard so non-markdown files don't trigger a reset.
		this.resetDailyStatsIfNeeded();

		// Increment note creation counter unconditionally (capped to avoid inflated stats)
		this.plugin.dailyWordData.notesCreatedToday = Math.min(
			this.plugin.dailyWordData.notesCreatedToday + 1,
			CelebrationService.MAX_DAILY_COUNTER
		);
		this.persistActivityUpdate();

		// Check if note creation celebrations are enabled
		if (!this.plugin.settings.celebrations.onNoteCreate) {
			return;
		}

		// Trigger celebration with cooldown check
		this.celebrate('note-create');
	}

	/**
	 * Handle editor change event (debounced to 100ms).
	 * Captures info.file at event time — avoids stale active-file lookup after debounce fires.
	 * @param editor - The editor instance
	 * @param info - Editor info containing the file associated with this editor
	 */
	private handleEditorChange(editor: Editor, info: MarkdownView | MarkdownFileInfo): void {
		// Clear previous timeout
		if (this.editorChangeTimeout !== undefined) {
			window.clearTimeout(this.editorChangeTimeout);
		}

		// Capture file NOW before the debounce fires (active file may change during that window)
		const file = info?.file ?? null;

		// On first encounter of a file with word goals enabled, preload its saved content
		// so checkWordGoals can compare against the on-disk baseline rather than the
		// current editor state (fixes goal crossings in the first debounce window).
		if (
			file &&
			this.plugin.settings.celebrations.onWordGoal &&
			!this.fileWordCounts.has(file.path) &&
			!this.fileWordCountBaselines.has(file.path)
		) {
			void this.preloadFileWordCount(file);
		}

		// Set new timeout for debounced processing
		this.editorChangeTimeout = window.setTimeout(() => {
			this.processEditorChange(editor, file);
		}, CelebrationService.EDITOR_DEBOUNCE_MS);
	}

	/**
	 * Handle metadataCache 'changed' event — detects links created in files that are
	 * not currently open in any editor (e.g. via Unlinked Mentions panel).
	 *
	 * Files open in an editor leaf are skipped here; the `editor-change` path handles
	 * those with cursor-exclusion for a more responsive, mid-type-safe experience.
	 *
	 * Link count = cache.links (wiki + markdown) + cache.embeds (![[...]] + ![alt](...))
	 * so the baseline matches what the regex-based editor-change path counts.
	 */
	private handleMetadataCacheChange(file: TFile, _data: string, cache: CachedMetadata): void {
		// Skip files open in any markdown editor leaf — editor-change handles those
		const isOpenInEditor = this.plugin.app.workspace
			.getLeavesOfType('markdown')
			.some((leaf) => (leaf.view as { file?: TFile }).file?.path === file.path);
		if (isOpenInEditor) return;

		const currentLinkCount = (cache.links?.length ?? 0) + (cache.embeds?.length ?? 0);
		const filePath = file.path;

		if (!this.fileLinkCounts.has(filePath)) {
			// First observation — set baseline without counting
			this.fileLinkCounts.set(filePath, currentLinkCount);
			return;
		}

		const prevCount = this.fileLinkCounts.get(filePath)!;
		const delta = Math.max(currentLinkCount - prevCount, 0);
		this.fileLinkCounts.set(filePath, currentLinkCount);

		if (delta > 0) {
			this.resetDailyStatsIfNeeded();
			this.plugin.dailyWordData.linksCreatedToday = Math.min(
				this.plugin.dailyWordData.linksCreatedToday + delta,
				CelebrationService.MAX_DAILY_COUNTER
			);
			this.persistActivityUpdate();

			if (this.plugin.settings.celebrations.onLinkCreate) {
				this.celebrate('link-create');
			}
		}
	}

	/**
	 * Process editor change after debounce period
	 * @param editor - The editor instance
	 * @param file - The file associated with this editor at the time of the event
	 */
	private processEditorChange(editor: Editor, file: TFile | null): void {
		const content = editor.getValue();

		// Guard: Reject excessively large content to prevent ReDoS attacks
		if (content.length > CelebrationService.MAX_CONTENT_LENGTH) {
			console.warn('[CelebrationService] Content too large for celebration processing');
			return;
		}

		// Reset daily stats if the date has rolled over (midnight reset)
		this.resetDailyStatsIfNeeded();

		// Check all celebration types
		this.checkTaskCompletion(content, file);
		this.checkLinkCreation(content, editor, file);
		this.checkWordGoals(content, file);
	}

	/**
	 * Check for task completion (increase in checked tasks).
	 * First observation of each file sets a baseline without counting — prevents
	 * pre-existing checked tasks from inflating today's count on file open.
	 * Counter tracking is unconditional; celebration requires the toggle.
	 */
	private checkTaskCompletion(content: string, file: TFile | null): void {
		if (!file) return;
		const taskPattern = /- \[x\]/gi;
		const matches = content.match(taskPattern);
		const currentTaskCount = matches ? matches.length : 0;

		const filePath = file.path;
		if (!this.fileTaskCounts.has(filePath)) {
			this.fileTaskCounts.set(filePath, currentTaskCount);
			return;
		}

		const prevCount = this.fileTaskCounts.get(filePath)!;
		const delta = Math.max(currentTaskCount - prevCount, 0);
		this.fileTaskCounts.set(filePath, currentTaskCount);

		if (delta > 0) {
			this.plugin.dailyWordData.tasksCompletedToday = Math.min(
				this.plugin.dailyWordData.tasksCompletedToday + delta,
				CelebrationService.MAX_DAILY_COUNTER
			);
			this.persistActivityUpdate();

			if (this.plugin.settings.celebrations.onTaskComplete) {
				this.celebrate('task-complete');
			}
		}
	}

	/**
	 * Check for link creation (increase in wiki or markdown links) in the active editor.
	 * First observation of each file sets a baseline without counting — prevents
	 * pre-existing links from inflating today's count on file open.
	 * Counter tracking is unconditional; celebration requires the toggle.
	 *
	 * Links created in files not open in any editor are detected by handleMetadataCacheChange.
	 */
	/**
	 * Count regex matches in `content` that do not contain `cursorOffset`.
	 * Cursor exclusion prevents mid-type false positives (e.g. CM6 auto-pairs [[|]]).
	 * Pass cursorOffset = -1 to count all matches unconditionally.
	 */
	private static countNonCursorMatches(pattern: RegExp, content: string, cursorOffset: number): number {
		let count = 0;
		let m: RegExpExecArray | null;
		pattern.lastIndex = 0;
		while ((m = pattern.exec(content)) !== null) {
			if (cursorOffset < m.index || cursorOffset >= m.index + m[0].length) {
				count++;
			}
		}
		return count;
	}

	private checkLinkCreation(content: string, editor: Editor, file: TFile | null): void {
		if (!file) return;
		// Require at least 1 character inside brackets to avoid celebrating on [[]] or []()
		// Length bounds prevent O(n*m) backtracking on files with many unclosed [[
		const wikiLinkPattern = /\[\[.{1,500}?\]\]/g;
		const markdownLinkPattern = /\[.{1,500}?\]\(.{1,2000}?\)/g;

		// Cursor offset: exclude any link whose range contains the cursor so we don't
		// fire mid-type (e.g. CM6 auto-pairing inserts [[|]] the moment [[ is typed).
		// Falls back to -1 if the editor doesn't expose position methods (e.g. in tests),
		// which is always outside any link so all completed links are counted normally.
		const cursorOffset = (typeof editor.getCursor === 'function' && typeof editor.posToOffset === 'function')
			? editor.posToOffset(editor.getCursor())
			: -1;

		const currentLinkCount =
			CelebrationService.countNonCursorMatches(wikiLinkPattern, content, cursorOffset) +
			CelebrationService.countNonCursorMatches(markdownLinkPattern, content, cursorOffset);

		const filePath = file.path;
		if (!this.fileLinkCounts.has(filePath)) {
			this.fileLinkCounts.set(filePath, currentLinkCount);
			return;
		}

		const prevCount = this.fileLinkCounts.get(filePath)!;
		const delta = Math.max(currentLinkCount - prevCount, 0);
		this.fileLinkCounts.set(filePath, currentLinkCount);

		if (delta > 0) {
			this.plugin.dailyWordData.linksCreatedToday = Math.min(
				this.plugin.dailyWordData.linksCreatedToday + delta,
				CelebrationService.MAX_DAILY_COUNTER
			);
			this.persistActivityUpdate();

			if (this.plugin.settings.celebrations.onLinkCreate) {
				this.celebrate('link-create');
			}
		}
	}

	/**
	 * Count words in raw editor content using Obsidian's approach:
	 * strip non-prose content, then count whitespace-separated tokens.
	 *
	 * ReDoS defence — two layers:
	 *   1. Callers must gate on MAX_CONTENT_LENGTH before calling (see processEditorChange).
	 *   2. Each regex uses a bounded quantifier ({0,N}) so the worst-case match
	 *      work per pattern is O(N), not exponential.
	 */
	static countWords(content: string): number {
		// Strip YAML frontmatter. Bounded to 5 000 chars — prevents runaway on unclosed delimiters.
		let body = content.replace(/^---\r?\n[\s\S]{0,5000}?\r?\n---\r?\n?/, '');
		// Strip fenced code blocks. Bounded to 20 000 chars per block.
		body = body.replace(/```[\s\S]{0,20000}?```/g, '');
		// Strip inline code. [^`\n]* is already linear (no nested quantifiers).
		body = body.replace(/`[^`\n]*`/g, '');
		// Strip Obsidian comment blocks (%% ... %%). Bounded to 10 000 chars per block.
		body = body.replace(/%%[\s\S]{0,10000}?%%/g, '');
		// Count whitespace-separated tokens — matches Obsidian's built-in word count algorithm.
		return (body.match(/\S+/g) || []).length;
	}

	/**
	 * Check for word count goals (daily and per-note)
	 * @param content - Raw editor content (frontmatter included)
	 * @param file - The file being edited, or null if unknown
	 */
	private checkWordGoals(content: string, file: TFile | null): void {
		if (!this.plugin.settings.celebrations.onWordGoal) return;
		if (!file) return; // No file context — skip entirely to avoid polluting shared state

		// Count body words using the same approach as Obsidian's built-in word count:
		// strip non-prose content, then split on whitespace.
		const currentWordCount = CelebrationService.countWords(content);
		const filePath = file.path;

		// First observation of this file this session → establish baseline and check for
		// goal crossings that happened in this initial edit burst.
		// Uses the preloaded saved-file word count if available; falls back to current count
		// (which suppresses false celebrations for files already past their goal on open).
		if (!this.fileWordCounts.has(filePath)) {
			const savedWordCount = this.fileWordCountBaselines.get(filePath) ?? currentWordCount;
			this.fileWordCountBaselines.delete(filePath);
			this.fileWordCounts.set(filePath, savedWordCount);

			if (savedWordCount !== currentWordCount) {
				const delta = currentWordCount - savedWordCount;
				if (delta !== 0) this.checkDailyGoal(delta);
				if (delta > 0) this.checkPerNoteGoal(file, savedWordCount, currentWordCount);
			}
			return;
		}

		const prevWordCount = this.fileWordCounts.get(filePath)!;
		const delta = currentWordCount - prevWordCount; // negative when words are deleted

		// Update baseline for next comparison
		this.fileWordCounts.set(filePath, currentWordCount);

		if (delta !== 0) {
			this.checkDailyGoal(delta);
		}
		if (delta > 0) {
			this.checkPerNoteGoal(file, prevWordCount, currentWordCount);
		}
	}

	/**
	 * Accumulate daily word delta and celebrate when the daily goal is crossed
	 */
	private checkDailyGoal(delta: number): void {
		const { dailyWordGoal } = this.plugin.settings.celebrations;
		if (!dailyWordGoal || dailyWordGoal <= 0) return;

		const daily = this.plugin.dailyWordData;

		// Precondition: caller (processEditorChange) has already called resetDailyStatsIfNeeded().

		// Always track net word change — deletions shrink the count, additions grow it.
		// Clamped to [0, MAX_DAILY_COUNTER]. goalCelebrated only gates the celebration.
		daily.wordsAddedToday = Math.max(0, Math.min(
			daily.wordsAddedToday + delta,
			CelebrationService.MAX_DAILY_COUNTER
		));

		// Update the stats panel immediately so the ring fills in real time.
		// No disk write here — saving only at goal-crossing keeps writes minimal.
		this.plugin.petView?.updateStatsComponent();

		if (daily.goalCelebrated) return; // already celebrated today — counter still runs above

		if (daily.wordsAddedToday >= dailyWordGoal) {
			daily.goalCelebrated = true;
			// Persist immediately. `goalCelebrated` is set synchronously above so this
			// can only fire once per session — no risk of concurrent saves.
			// If the save fails, the in-memory flag still blocks re-celebration this session;
			// on restart the flag resets and the user may see one extra celebration, which
			// is acceptable. Using void+catch keeps the call chain synchronous so the
			// isCelebrating guard in celebrate() works correctly.
			void this.plugin.saveSettings().catch(err =>
				console.error('[CelebrationService] Failed to persist daily word data:', err)
			);
			this.celebrate('word-goal');
		}
	}

	/**
	 * Check if the note's body word count has crossed the word-goal frontmatter threshold.
	 *
	 * Known limitation: metadataCache is updated asynchronously by Obsidian and may lag
	 * behind live editor content by one cache cycle. If a user adds `word-goal` to frontmatter
	 * and immediately starts typing, the cache may return null on the first few debounce ticks.
	 * Once the cache updates, the crossing is detected on the next edit. This is inherent to
	 * Obsidian's architecture; a full fix would require subscribing to `metadataCache:changed`.
	 */
	private checkPerNoteGoal(file: TFile, prevCount: number, currentCount: number): void {
		const cache = this.plugin.app.metadataCache.getFileCache(file);
		const raw = cache?.frontmatter?.['word-goal'];
		// Handle both numeric YAML values (word-goal: 500) and string values
		const perNoteGoal = typeof raw === 'number' ? raw : parseInt(raw, 10);

		if (!Number.isFinite(perNoteGoal) || !Number.isInteger(perNoteGoal) || perNoteGoal <= 0 || perNoteGoal > CelebrationService.MAX_DAILY_COUNTER) return;
		if (this.perNoteGoalCelebrated.has(file.path)) return; // already celebrated this session

		// Crossing detection: previous was below goal, current is at or above goal
		if (prevCount < perNoteGoal && currentCount >= perNoteGoal) {
			this.perNoteGoalCelebrated.add(file.path);
			this.celebrate('word-goal');
		}
	}

	/**
	 * Reset daily stats if the calendar date has changed (midnight rollover).
	 * Idempotent: safe to call multiple times per event; subsequent calls in the same
	 * day are no-ops because `daily.date` is already set to today.
	 */
	private resetDailyStatsIfNeeded(): void {
		const today = this.plugin.getLocalDateString();
		const daily = this.plugin.dailyWordData;
		if (daily.date !== today) {
			daily.date = today;
			daily.wordsAddedToday = 0;
			daily.goalCelebrated = false;
			daily.notesCreatedToday = 0;
			daily.tasksCompletedToday = 0;
			daily.linksCreatedToday = 0;
			// Per-file baselines are only valid within the same day — clear them so the
			// first edit of each file tomorrow sets a fresh baseline (not yesterday's).
			this.fileTaskCounts.clear();
			this.fileLinkCounts.clear();
			// Persist the reset immediately so a crash before the next counter write
			// doesn't leave stale data on disk.
			void this.plugin.saveSettings().catch(err =>
				console.error('[CelebrationService] Failed to persist midnight reset:', err)
			);
		}
	}

	/**
	 * Trigger a celebration animation
	 * @param eventType - Type of celebration event (for logging)
	 */
	private celebrate(eventType: CelebrationEventType): void {
		// Status bar fires whenever the trigger fires — tied to the trigger toggle, not a separate setting
		if (this.statusBarItem) {
			if (this.statusBarClearTimeout !== undefined) {
				window.clearTimeout(this.statusBarClearTimeout);
				this.statusBarClearTimeout = undefined;
			}
			this.statusBarItem.setText(CelebrationService.getStatusBarMessage(eventType, this.plugin.settings.petName));
			this.statusBarItem.show();
			this.statusBarClearTimeout = window.setTimeout(() => {
				this.statusBarItem?.setText('');
				this.statusBarItem?.hide();
				this.statusBarClearTimeout = undefined;
			}, STATUS_BAR_NOTIFICATION_DURATION_MS);
		}

		// Race condition prevention - block if already celebrating
		if (this.isCelebrating) {
			console.debug('[CelebrationService] Skipping celebration - already celebrating');
			return;
		}

		// Guard: Ensure petView exists
		if (!this.plugin.petView) {
			console.warn('[CelebrationService] Cannot celebrate - petView not initialized');
			return;
		}

		// Set flag BEFORE attempting transition
		this.isCelebrating = true;

		try {
			const success = this.plugin.petView.transitionState('celebration');

			if (!success) {
				// Transition failed - reset flag immediately
				this.isCelebrating = false;
				console.warn('[CelebrationService] Failed to trigger celebration');
				return;
			}

			// Success - schedule flag reset after celebration animation completes
			// Uses canonical celebration duration (5000ms / 5 seconds)
			this.celebrationTimeout = window.setTimeout(() => {
				this.isCelebrating = false;
				this.celebrationTimeout = undefined;
			}, CELEBRATION_OVERLAY_CONSTANTS.CELEBRATION_DURATION_MS);

			console.debug(`[CelebrationService] Celebration triggered for ${eventType}`);
		} catch (error) {
			// Error occurred - reset flag FIRST to ensure consistency
			this.isCelebrating = false;

			// Then clean up timeout if it exists
			if (this.celebrationTimeout !== undefined) {
				window.clearTimeout(this.celebrationTimeout);
				this.celebrationTimeout = undefined;
			}

			console.warn('[CelebrationService] Error triggering celebration:', error);
		}
	}

	/**
	 * Persist an activity counter change: refresh the stats panel and save to disk.
	 * Called after incrementing any daily counter (notes, tasks, links).
	 */
	private persistActivityUpdate(): void {
		this.plugin.petView?.updateStatsComponent();
		void this.plugin.saveSettings().catch(err =>
			console.error('[CelebrationService] Failed to save activity stats:', err)
		);
	}

	/**
	 * Clear all per-file tracking state.
	 * Called by the dev reset button and by cleanup(). Allows testing and manual resets
	 * to re-trigger celebrations that were already fired this session.
	 */
	clearFileBaselines(): void {
		this.fileTaskCounts.clear();
		this.fileLinkCounts.clear();
		this.fileWordCounts.clear();
		this.fileWordCountBaselines.clear();
		this.perNoteGoalCelebrated.clear();
	}

	/**
	 * Clean up event listeners and timers
	 */
	cleanup(): void {
		// Unregister event listeners using EventRefs
		this.eventRefs.forEach(ref => this.plugin.app.vault.offref(ref));
		this.eventRefs = [];

		// Clear handler references
		this.noteCreationHandler = null;
		this.editorChangeHandler = null;
		this.metadataCacheHandler = null;

		// Clear status bar hide timeout and ensure element is hidden
		if (this.statusBarClearTimeout !== undefined) {
			window.clearTimeout(this.statusBarClearTimeout);
			this.statusBarClearTimeout = undefined;
		}
		if (this.statusBarItem) {
			this.statusBarItem.setText('');
			this.statusBarItem.hide();
		}

		// Clear debounce timeout
		if (this.editorChangeTimeout !== undefined) {
			window.clearTimeout(this.editorChangeTimeout);
			this.editorChangeTimeout = undefined;
		}

		// Clear celebration timeout
		if (this.celebrationTimeout !== undefined) {
			window.clearTimeout(this.celebrationTimeout);
			this.celebrationTimeout = undefined;
		}

		// Reset celebration flag
		this.isCelebrating = false;

		// Reset state tracking
		this.fileTaskCounts.clear();
		this.fileLinkCounts.clear();
		this.fileWordCounts.clear();
		this.fileWordCountBaselines.clear();
		this.perNoteGoalCelebrated.clear();
	}
}
