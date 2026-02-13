/**
 * CelebrationService
 *
 * Monitors user activity in Obsidian and triggers celebration animations when certain
 * achievements occur (note creation, task completion, link creation, word milestones).
 *
 * Features:
 * - Event-based celebration triggers (note creation, editor changes)
 * - Debounced editor change handling (500ms)
 * - Cooldown system to prevent spam (per event type)
 * - State tracking to detect increases only (no celebration on decreases)
 * - Integration with PetView for celebration animations
 */

import type { TFile, Editor, EventRef } from 'obsidian';
import type ObsidianPetsPlugin from '../main';

/**
 * Celebration event types for cooldown tracking
 */
type CelebrationEventType = 'note-create' | 'task-complete' | 'link-create' | 'word-milestone';

/**
 * CelebrationService manages celebration triggers and cooldowns
 */
export class CelebrationService {
	// Constants for timing and limits (must match CSS animation duration)
	private static readonly EDITOR_DEBOUNCE_MS = 500;
	private static readonly CELEBRATION_DURATION_MS = 1800; // Must match CSS animation
	private static readonly MAX_CONTENT_LENGTH = 1000000; // 1MB of text (~500 pages)

	private plugin: ObsidianPetsPlugin;

	// Event references for cleanup
	private eventRefs: EventRef[] = [];

	// Handler functions (stored for cleanup)
	private noteCreationHandler: ((file: TFile) => void) | null = null;
	private editorChangeHandler: ((editor: Editor) => void) | null = null;

	// Debounce timer for editor changes
	private editorChangeTimeout: number | undefined;

	// State tracking for detecting increases
	private previousTaskCount: number = 0;
	private previousLinkCount: number = 0;
	private previousWordCount: number = 0;
	private wordMilestonesReached: Set<number> = new Set();

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
	 * Handle editor change event (debounced to 500ms)
	 * @param editor - The editor instance
	 */
	private handleEditorChange(editor: Editor): void {
		// Clear previous timeout
		if (this.editorChangeTimeout !== undefined) {
			window.clearTimeout(this.editorChangeTimeout);
		}

		// Set new timeout for debounced processing
		this.editorChangeTimeout = window.setTimeout(() => {
			this.processEditorChange(editor);
		}, CelebrationService.EDITOR_DEBOUNCE_MS);
	}

	/**
	 * Process editor change after debounce period
	 * Checks for task completion, link creation, and word milestones in a single pass
	 * @param editor - The editor instance
	 */
	private processEditorChange(editor: Editor): void {
		const content = editor.getValue();

		// Guard: Reject excessively large content to prevent ReDoS attacks
		if (content.length > CelebrationService.MAX_CONTENT_LENGTH) {
			console.warn('[CelebrationService] Content too large for celebration processing');
			return;
		}

		// Check all celebration types in a single pass
		this.checkTaskCompletion(content);
		this.checkLinkCreation(content);
		this.checkWordMilestones(content);
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
		const wikiLinkPattern = /\[\[.+?\]\]/g;
		const markdownLinkPattern = /\[.+?\]\(.+?\)/g;

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
	 * Check for word count milestones
	 * @param content - Editor content
	 */
	private checkWordMilestones(content: string): void {
		if (!this.plugin.settings.celebrations.onWordMilestone) {
			return;
		}

		// Count words (split by whitespace and filter empty strings)
		const words = content.split(/\s+/).filter(word => word.length > 0);
		const currentWordCount = words.length;

		// Check if we've crossed any new milestones
		const milestones = this.plugin.settings.celebrations.wordMilestones;

		// Only check milestones we haven't reached yet
		for (const milestone of milestones) {
			// Skip milestones already reached
			if (this.wordMilestonesReached.has(milestone)) {
				continue;
			}

			// Check if we've crossed this milestone (previous < milestone <= current)
			if (this.previousWordCount < milestone && currentWordCount >= milestone) {
				this.wordMilestonesReached.add(milestone);
				this.celebrate('word-milestone');
				break; // Only celebrate one milestone at a time
			}
		}

		// Update tracked count
		this.previousWordCount = currentWordCount;
	}

	/**
	 * Trigger a celebration animation
	 * @param eventType - Type of celebration event (for logging only)
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
			this.celebrationTimeout = window.setTimeout(() => {
				this.isCelebrating = false;
				this.celebrationTimeout = undefined;
			}, CelebrationService.CELEBRATION_DURATION_MS);

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
		this.previousWordCount = 0;
		this.wordMilestonesReached.clear();
	}
}
