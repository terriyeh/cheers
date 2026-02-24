/**
 * CelebrationService
 *
 * Monitors user activity in Obsidian and triggers celebration animations when certain
 * achievements occur (note creation, task completion, link creation, word goals).
 *
 * Features:
 * - Event-based celebration triggers (note creation, editor changes)
 * - Debounced editor change handling (500ms)
 * - Race condition prevention (blocks overlapping celebrations)
 * - Per-file word count tracking for delta accumulation and crossing detection
 * - Daily word goal with midnight reset and persistence
 * - Per-note word goal read from frontmatter
 */

import type { TFile, Editor, EventRef, MarkdownFileInfo, MarkdownView } from 'obsidian';
import type ObsidianPetsPlugin from '../main';
import { CELEBRATION_OVERLAY_CONSTANTS } from '../utils/celebration-constants';

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
	// Note: Celebration duration uses CELEBRATION_OVERLAY_CONSTANTS.CELEBRATION_DURATION_MS (4320ms)

	private plugin: ObsidianPetsPlugin;

	// Event references for cleanup
	private eventRefs: EventRef[] = [];

	// Handler functions (stored for cleanup)
	private noteCreationHandler: ((file: TFile) => void) | null = null;
	private editorChangeHandler: ((editor: Editor, info: MarkdownView | MarkdownFileInfo) => void) | null = null;

	// Debounce timer for editor changes
	private editorChangeTimeout: number | undefined;

	// State tracking for detecting increases
	private previousTaskCount: number = 0;
	private previousLinkCount: number = 0;

	// Per-file word counts (in-memory, resets on restart).
	// Initialised to current count on first edit — prevents false goal triggers on session start.
	private fileWordCounts: Map<string, number> = new Map();

	// Files whose per-note goal was celebrated this session (prevents repeat within one session).
	// Intentionally not persisted: per-note goal celebrations reset on vault restart.
	// This means a user who closes and reopens Obsidian after crossing a per-note goal may
	// see one additional celebration on their next edit. Accepted behaviour for MVP.
	private perNoteGoalCelebrated: Set<string> = new Set();

	// Race condition prevention (replaces cooldown system)
	private isCelebrating: boolean = false;
	private celebrationTimeout: number | undefined;

	constructor(plugin: ObsidianPetsPlugin) {
		this.plugin = plugin;

		// Register event listeners (individual celebration types check their own toggles)
		this.registerEventListeners();
	}

	/**
	 * Register Obsidian event listeners
	 */
	private registerEventListeners(): void {
		const { vault, workspace } = this.plugin.app;

		// Create bound handlers
		this.noteCreationHandler = this.handleNoteCreation.bind(this);
		this.editorChangeHandler = this.handleEditorChange.bind(this);

		try {
			// Listen for note creation (using type assertion as event exists but isn't in types)
			// Validate that registration method exists
			if (typeof (vault as any).on === 'function') {
				const createRef = (vault as any).on('create', this.noteCreationHandler);
				if (createRef) {
					this.eventRefs.push(createRef);
				} else {
					console.warn('[CelebrationService] Vault event registration returned null');
				}
			} else {
				console.warn('[CelebrationService] Vault event registration unavailable');
			}

			// Listen for editor changes (debounced)
			if (typeof (workspace as any).on === 'function') {
				const editorChangeRef = (workspace as any).on('editor-change', this.editorChangeHandler);
				if (editorChangeRef) {
					this.eventRefs.push(editorChangeRef);
				} else {
					console.warn('[CelebrationService] Workspace event registration returned null');
				}
			} else {
				console.warn('[CelebrationService] Workspace event registration unavailable');
			}
		} catch (error) {
			console.error('[CelebrationService] Failed to register event listeners:', error);
		}
	}

	/**
	 * Handle note creation event
	 * @param file - The file that was created
	 */
	private handleNoteCreation(file: TFile): void {
		// Only celebrate for markdown files
		// Check extension property first, fall back to path check for test mocks
		const isMarkdown = file.extension === 'md' || file.path.endsWith('.md');
		if (!isMarkdown) {
			return;
		}

		// Check if note creation celebrations are enabled
		if (!this.plugin.settings.celebrations.onNoteCreate) {
			return;
		}

		// Trigger celebration with cooldown check
		this.celebrate('note-create');
	}

	/**
	 * Handle editor change event (debounced to 500ms).
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

		// Set new timeout for debounced processing
		this.editorChangeTimeout = window.setTimeout(() => {
			this.processEditorChange(editor, file);
		}, CelebrationService.EDITOR_DEBOUNCE_MS);
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

		// Check all celebration types
		this.checkTaskCompletion(content);
		this.checkLinkCreation(content);
		this.checkWordGoals(content, file);
	}

	/**
	 * Check for task completion (increase in checked tasks)
	 * @param content - Editor content
	 */
	private checkTaskCompletion(content: string): void {
		if (!this.plugin.settings.celebrations.onTaskComplete) {
			return;
		}

		// Count completed tasks: - [x]
		const taskPattern = /- \[x\]/gi;
		const matches = content.match(taskPattern);
		const currentTaskCount = matches ? matches.length : 0;

		// Only celebrate on increase
		if (currentTaskCount > this.previousTaskCount) {
			this.celebrate('task-complete');
		}

		// Update tracked count
		this.previousTaskCount = currentTaskCount;
	}

	/**
	 * Check for link creation (increase in wiki or markdown links)
	 * @param content - Editor content
	 */
	private checkLinkCreation(content: string): void {
		if (!this.plugin.settings.celebrations.onLinkCreate) {
			return;
		}

		// Count both wiki links [[link]] and markdown links [text](url)
		// Require at least 1 character inside brackets to avoid celebrating on [[]] or []()
		// Length bounds prevent O(n*m) backtracking on files with many unclosed [[
		const wikiLinkPattern = /\[\[.{1,500}?\]\]/g;
		const markdownLinkPattern = /\[.{1,500}?\]\(.{1,2000}?\)/g;

		const wikiLinks = content.match(wikiLinkPattern) || [];
		const markdownLinks = content.match(markdownLinkPattern) || [];
		const currentLinkCount = wikiLinks.length + markdownLinks.length;

		// Only celebrate on increase
		if (currentLinkCount > this.previousLinkCount) {
			this.celebrate('link-create');
		}

		// Update tracked count
		this.previousLinkCount = currentLinkCount;
	}

	/**
	 * Check for word count goals (daily and per-note)
	 * @param content - Raw editor content (frontmatter included)
	 * @param file - The file being edited, or null if unknown
	 */
	private checkWordGoals(content: string, file: TFile | null): void {
		if (!this.plugin.settings.celebrations.onWordGoal) return;
		if (!file) return; // No file context — skip entirely to avoid polluting shared state

		// Strip YAML frontmatter before counting to prevent frontmatter keys/values
		// (including the word-goal field itself) from inflating the body word count.
		// \r?\n handles both Unix and Windows line endings. {0,5000} caps the match
		// to prevent a linear scan on large files with unclosed frontmatter delimiters.
		const withoutFrontmatter = content.replace(/^---\r?\n[\s\S]{0,5000}?\r?\n---\r?\n?/, '');
		// Strip Obsidian %% comment %% blocks — users don't consider these "written words".
		// {0,10000} caps the match on unclosed comment delimiters.
		const bodyContent = withoutFrontmatter.replace(/%%[\s\S]{0,10000}?%%/g, '');
		// Match-based counting: treats hyphenated words (well-known) and numbers (1,000)
		// as single tokens, consistent with user intuition.
		const currentWordCount = (bodyContent.match(/(?:[0-9]+(?:(?:,|\.)[0-9]+)*|[-A-Za-z\u00C0-\u024F\u0370-\u03FF])+/g) || []).length;
		const filePath = file.path;

		// First observation of this file this session → set baseline, skip goal checks.
		// Prevents celebrating goals the user already crossed in a previous session.
		if (!this.fileWordCounts.has(filePath)) {
			this.fileWordCounts.set(filePath, currentWordCount);
			return;
		}

		const prevWordCount = this.fileWordCounts.get(filePath)!;
		const delta = Math.max(currentWordCount - prevWordCount, 0);

		// Update baseline for next comparison
		this.fileWordCounts.set(filePath, currentWordCount);

		if (delta > 0) {
			this.checkDailyGoal(delta);
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

		// Midnight reset: use local date so reset happens at the user's midnight, not UTC midnight
		const today = this.plugin.getLocalDateString();
		if (daily.date !== today) {
			daily.date = today;
			daily.wordsAddedToday = 0;
			daily.goalCelebrated = false;
		}

		if (daily.goalCelebrated) return; // already celebrated today

		daily.wordsAddedToday += delta;

		// Partial progress (wordsAddedToday < dailyWordGoal) is intentionally not persisted
		// on every edit — saving only at goal-crossing keeps disk writes minimal.
		// A crash before the goal fires will lose the session's partial word count.
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

		if (!Number.isFinite(perNoteGoal) || perNoteGoal <= 0) return;
		if (this.perNoteGoalCelebrated.has(file.path)) return; // already celebrated this session

		// Crossing detection: previous was below goal, current is at or above goal
		if (prevCount < perNoteGoal && currentCount >= perNoteGoal) {
			this.perNoteGoalCelebrated.add(file.path);
			this.celebrate('word-goal');
		}
	}

	/**
	 * Trigger a celebration animation
	 * @param eventType - Type of celebration event (for logging)
	 */
	private celebrate(eventType: CelebrationEventType): void {
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
			// Uses canonical celebration duration (4320ms / 4.32 seconds)
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
				clearTimeout(this.celebrationTimeout);
				this.celebrationTimeout = undefined;
			}

			console.warn('[CelebrationService] Error triggering celebration:', error);
		}
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

		// Clear debounce timeout
		if (this.editorChangeTimeout !== undefined) {
			window.clearTimeout(this.editorChangeTimeout);
			this.editorChangeTimeout = undefined;
		}

		// Clear celebration timeout
		if (this.celebrationTimeout !== undefined) {
			clearTimeout(this.celebrationTimeout);
			this.celebrationTimeout = undefined;
		}

		// Reset celebration flag
		this.isCelebrating = false;

		// Reset state tracking
		this.previousTaskCount = 0;
		this.previousLinkCount = 0;
		this.fileWordCounts.clear();
		this.perNoteGoalCelebrated.clear();
	}
}
