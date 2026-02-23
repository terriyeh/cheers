/**
 * Unit tests for CelebrationService
 * Tests celebration triggers, cooldown logic, settings integration, and cleanup
 */

import { vi } from 'vitest';
import type { App, TFile, Editor, Vault, Workspace } from 'obsidian';
import type ObsidianPetsPlugin from '../../src/main';
import type { ObsidianPetsSettings, DailyWordData } from '../../src/types/settings';
import { CELEBRATION_OVERLAY_CONSTANTS } from '../../src/utils/celebration-constants';

// Mock types for testing
interface MockPlugin {
	app: App;
	settings: ObsidianPetsSettings;
	petView?: {
		transitionState: (state: string) => boolean;
	};
	dailyWordData: DailyWordData;
	saveSettings: () => Promise<void>;
	getLocalDateString: () => string;
}

// We'll import CelebrationService once it's created
import { CelebrationService } from '../../src/celebrations/CelebrationService';

function localDateString(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

describe('CelebrationService', () => {
	let plugin: MockPlugin;
	let mockVault: Partial<Vault>;
	let mockWorkspace: Partial<Workspace>;
	let service: CelebrationService;

	beforeEach(() => {
		vi.useFakeTimers();

		// Mock Vault with event registration (returns EventRef-like object)
		mockVault = {
			on: vi.fn().mockReturnValue({} as any),
			off: vi.fn(),
			offref: vi.fn(),
		};

		// Mock Workspace with event registration (returns EventRef-like object)
		mockWorkspace = {
			on: vi.fn().mockReturnValue({} as any),
			off: vi.fn(),
		};

		// Mock Plugin with default settings
		plugin = {
			app: {
				vault: mockVault,
				workspace: mockWorkspace,
				metadataCache: {
					getFileCache: vi.fn().mockReturnValue(null),
				},
			} as unknown as App,
			settings: {
				petName: 'Kit',
				userName: '',
				hasCompletedWelcome: true,
				movementSpeed: 50,
				celebrations: {
					onNoteCreate: true,
					onTaskComplete: true,
					onLinkCreate: true,
					onWordGoal: false,
					dailyWordGoal: null,
				},
			},
			petView: {
				transitionState: vi.fn().mockReturnValue(true),
			},
			dailyWordData: {
				date: localDateString(),
				wordsAddedToday: 0,
				goalCelebrated: false,
			},
			saveSettings: vi.fn().mockResolvedValue(undefined),
			getLocalDateString: vi.fn().mockImplementation(localDateString),
		};

		service = new CelebrationService(plugin as unknown as ObsidianPetsPlugin);
	});

	afterEach(() => {
		service?.cleanup();
		vi.restoreAllMocks();
		vi.clearAllTimers();
	});

	describe('initialization and cleanup', () => {
		it('should register vault event listeners on initialization', () => {
			// service should call vault.on('create', handler)
			expect(mockVault.on).toHaveBeenCalledWith('create', expect.any(Function));
		});

		it('should register workspace event listeners on initialization', () => {
			// service should call workspace.on('editor-change', handler)
			expect(mockWorkspace.on).toHaveBeenCalledWith('editor-change', expect.any(Function));
		});

		it('should unregister all event listeners on cleanup', () => {
			service.cleanup();

			// offref should be called twice (once for each registered event)
			expect(mockVault.offref).toHaveBeenCalledTimes(2);
		});

		it('should clear celebration timeout on cleanup', () => {
			const mockFile = { path: 'test.md', basename: 'test' } as TFile;
			const createHandler = (mockVault.on as any).mock.calls.find(
				(call: any) => call[0] === 'create'
			)?.[1];

			// Trigger a celebration to start timeout
			createHandler?.(mockFile);

			// Cleanup should clear the timeout and reset flag
			service.cleanup();

			// Verify flag is reset by triggering another celebration
			vi.clearAllMocks();
			createHandler?.(mockFile);
			expect(plugin.petView?.transitionState).toHaveBeenCalled();
		});
	});

	describe('note creation celebration', () => {
		it('should celebrate when a new note is created', () => {
			const mockFile = {
				path: 'daily/2024-01-15.md',
				basename: '2024-01-15',
				extension: 'md',
			} as TFile;

			// Get the registered handler and call it
			const createHandler = (mockVault.on as any).mock.calls.find(
				(call: any) => call[0] === 'create'
			)?.[1];
			createHandler?.(mockFile);

			expect(plugin.petView?.transitionState).toHaveBeenCalledWith('celebration');
		});

		it('should not celebrate if onNoteCreate is disabled', () => {
			plugin.settings.celebrations.onNoteCreate = false;

			const mockFile = { path: 'test.md', basename: 'test' } as TFile;
			const createHandler = (mockVault.on as any).mock.calls.find(
				(call: any) => call[0] === 'create'
			)?.[1];
			createHandler?.(mockFile);

			expect(plugin.petView?.transitionState).not.toHaveBeenCalled();
		});

		it('should ignore non-markdown files', () => {
			const mockFile = {
				path: 'image.png',
				basename: 'image',
				extension: 'png',
			} as TFile;

			const createHandler = (mockVault.on as any).mock.calls.find(
				(call: any) => call[0] === 'create'
			)?.[1];
			createHandler?.(mockFile);

			expect(plugin.petView?.transitionState).not.toHaveBeenCalled();
		});

	});

	describe('task completion celebration', () => {
		it('should celebrate when a task is checked off', () => {
			const mockEditor = {
				getValue: vi.fn().mockReturnValue('- [x] Complete this task'),
			} as unknown as Editor;

			// Simulate initial state (no tasks checked)
			const editorChangeHandler = (mockWorkspace.on as any).mock.calls.find(
				(call: any) => call[0] === 'editor-change'
			)?.[1];

			// First call: no checked tasks
			mockEditor.getValue = vi.fn().mockReturnValue('- [ ] Complete this task');
			editorChangeHandler?.(mockEditor, { file: null });

			vi.clearAllMocks();

			// Second call: task is now checked
			mockEditor.getValue = vi.fn().mockReturnValue('- [x] Complete this task');

			// Debounced handler should trigger after 500ms
			editorChangeHandler?.(mockEditor, { file: null });
			vi.advanceTimersByTime(500);

			expect(plugin.petView?.transitionState).toHaveBeenCalledWith('celebration');
		});

		it('should count multiple task completions correctly', () => {
			const mockEditor = {
				getValue: vi.fn(),
			} as unknown as Editor;

			const editorChangeHandler = (mockWorkspace.on as any).mock.calls.find(
				(call: any) => call[0] === 'editor-change'
			)?.[1];

			// Initial state: 1 task checked
			mockEditor.getValue = vi.fn().mockReturnValue('- [x] Task 1\n- [ ] Task 2\n- [ ] Task 3');
			editorChangeHandler?.(mockEditor, { file: null });
			vi.advanceTimersByTime(500);
			// First increase detected and celebrated
			expect(plugin.petView?.transitionState).toHaveBeenCalledWith('celebration');

			vi.clearAllMocks();

			// Two more tasks checked (count increased from 1 to 3)
			mockEditor.getValue = vi
				.fn()
				.mockReturnValue('- [x] Task 1\n- [x] Task 2\n- [x] Task 3');
			editorChangeHandler?.(mockEditor, { file: null });
			vi.advanceTimersByTime(500);

			// Second celebration blocked while celebrating (by design)
			expect(plugin.petView?.transitionState).not.toHaveBeenCalled();
		});

		it('should not celebrate if onTaskComplete is disabled', () => {
			plugin.settings.celebrations.onTaskComplete = false;

			const mockEditor = {
				getValue: vi.fn().mockReturnValue('- [x] Complete this task'),
			} as unknown as Editor;

			const editorChangeHandler = (mockWorkspace.on as any).mock.calls.find(
				(call: any) => call[0] === 'editor-change'
			)?.[1];
			editorChangeHandler?.(mockEditor, { file: null });
			vi.advanceTimersByTime(500);

			expect(plugin.petView?.transitionState).not.toHaveBeenCalled();
		});

		it('should ignore unchecking tasks (count decrease)', () => {
			const mockEditor = {
				getValue: vi.fn(),
			} as unknown as Editor;

			const editorChangeHandler = (mockWorkspace.on as any).mock.calls.find(
				(call: any) => call[0] === 'editor-change'
			)?.[1];

			// Initial state: 2 tasks checked
			mockEditor.getValue = vi.fn().mockReturnValue('- [x] Task 1\n- [x] Task 2');
			editorChangeHandler?.(mockEditor, { file: null });
			vi.advanceTimersByTime(500);

			vi.clearAllMocks();

			// One task unchecked (count decreased from 2 to 1)
			mockEditor.getValue = vi.fn().mockReturnValue('- [ ] Task 1\n- [x] Task 2');
			editorChangeHandler?.(mockEditor, { file: null });
			vi.advanceTimersByTime(500);

			expect(plugin.petView?.transitionState).not.toHaveBeenCalled();
		});
	});

	describe('link creation celebration', () => {
		it('should celebrate when a wiki link is created', () => {
			const mockEditor = {
				getValue: vi.fn(),
			} as unknown as Editor;

			const editorChangeHandler = (mockWorkspace.on as any).mock.calls.find(
				(call: any) => call[0] === 'editor-change'
			)?.[1];

			// Initial state: no links
			mockEditor.getValue = vi.fn().mockReturnValue('Some text without links');
			editorChangeHandler?.(mockEditor, { file: null });
			vi.advanceTimersByTime(500);

			vi.clearAllMocks();

			// Link added
			mockEditor.getValue = vi.fn().mockReturnValue('Some text with [[a link]]');
			editorChangeHandler?.(mockEditor, { file: null });
			vi.advanceTimersByTime(500);

			expect(plugin.petView?.transitionState).toHaveBeenCalledWith('celebration');
		});

		it('should celebrate when a markdown link is created', () => {
			const mockEditor = {
				getValue: vi.fn(),
			} as unknown as Editor;

			const editorChangeHandler = (mockWorkspace.on as any).mock.calls.find(
				(call: any) => call[0] === 'editor-change'
			)?.[1];

			// Initial state: no links
			mockEditor.getValue = vi.fn().mockReturnValue('Some text');
			editorChangeHandler?.(mockEditor, { file: null });
			vi.advanceTimersByTime(500);

			vi.clearAllMocks();

			// Markdown link added
			mockEditor.getValue = vi.fn().mockReturnValue('Some [text](https://example.com)');
			editorChangeHandler?.(mockEditor, { file: null });
			vi.advanceTimersByTime(500);

			expect(plugin.petView?.transitionState).toHaveBeenCalledWith('celebration');
		});

		it('should not celebrate if onLinkCreate is disabled', () => {
			plugin.settings.celebrations.onLinkCreate = false;

			const mockEditor = {
				getValue: vi.fn(),
			} as unknown as Editor;

			const editorChangeHandler = (mockWorkspace.on as any).mock.calls.find(
				(call: any) => call[0] === 'editor-change'
			)?.[1];

			mockEditor.getValue = vi.fn().mockReturnValue('Text with [[link]]');
			editorChangeHandler?.(mockEditor, { file: null });
			vi.advanceTimersByTime(500);

			expect(plugin.petView?.transitionState).not.toHaveBeenCalled();
		});

		it('should ignore link removal (count decrease)', () => {
			const mockEditor = {
				getValue: vi.fn(),
			} as unknown as Editor;

			const editorChangeHandler = (mockWorkspace.on as any).mock.calls.find(
				(call: any) => call[0] === 'editor-change'
			)?.[1];

			// Initial state: 2 links
			mockEditor.getValue = vi.fn().mockReturnValue('[[Link 1]] and [[Link 2]]');
			editorChangeHandler?.(mockEditor, { file: null });
			vi.advanceTimersByTime(500);

			vi.clearAllMocks();

			// One link removed
			mockEditor.getValue = vi.fn().mockReturnValue('[[Link 1]] only');
			editorChangeHandler?.(mockEditor, { file: null });
			vi.advanceTimersByTime(500);

			expect(plugin.petView?.transitionState).not.toHaveBeenCalled();
		});
	});

	describe('word count goal celebration', () => {
		// Helper to get the editor-change handler
		function getEditorChangeHandler() {
			return (mockWorkspace.on as any).mock.calls.find(
				(call: any) => call[0] === 'editor-change'
			)?.[1];
		}

		function makeEditor(content: string): Editor {
			return { getValue: vi.fn().mockReturnValue(content) } as unknown as Editor;
		}

		describe('per-day goal', () => {
			it('first edit of a file initialises baseline without celebrating or saving', () => {
				plugin.settings.celebrations.onWordGoal = true;
				plugin.settings.celebrations.dailyWordGoal = 5;

				const mockFile = { path: 'test.md' } as TFile;
				const handler = getEditorChangeHandler();

				// First edit — word count already at 6 (above goal), but it's the baseline
				handler?.(makeEditor('one two three four five six'), { file: mockFile });
				vi.advanceTimersByTime(500);

				expect(plugin.petView?.transitionState).not.toHaveBeenCalled();
				expect(plugin.saveSettings).not.toHaveBeenCalled();
			});

			it('celebrates when cumulative words written today crosses daily goal', () => {
				plugin.settings.celebrations.onWordGoal = true;
				plugin.settings.celebrations.dailyWordGoal = 5;

				const mockFile = { path: 'test.md' } as TFile;
				const handler = getEditorChangeHandler();

				// Establish baseline at 3 words
				handler?.(makeEditor('one two three'), { file: mockFile });
				vi.advanceTimersByTime(500);

				// Add 2 words (delta=2, total=2 — below goal)
				handler?.(makeEditor('one two three four five'), { file: mockFile });
				vi.advanceTimersByTime(500);
				expect(plugin.petView?.transitionState).not.toHaveBeenCalled();

				// Add 3 more words (delta=3, total=5 — crosses goal)
				handler?.(makeEditor('one two three four five six seven eight'), { file: mockFile });
				vi.advanceTimersByTime(500);

				expect(plugin.petView?.transitionState).toHaveBeenCalledWith('celebration');
			});

			it('calls saveSettings when daily goal is crossed', () => {
				plugin.settings.celebrations.onWordGoal = true;
				plugin.settings.celebrations.dailyWordGoal = 3;

				const mockFile = { path: 'test.md' } as TFile;
				const handler = getEditorChangeHandler();

				handler?.(makeEditor(''), { file: mockFile });
				vi.advanceTimersByTime(500);

				handler?.(makeEditor('one two three'), { file: mockFile });
				vi.advanceTimersByTime(500);

				expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
			});

			it('does not celebrate daily goal when dailyWordGoal is null', () => {
				plugin.settings.celebrations.onWordGoal = true;
				plugin.settings.celebrations.dailyWordGoal = null;

				const mockFile = { path: 'test.md' } as TFile;
				const handler = getEditorChangeHandler();

				handler?.(makeEditor(''), { file: mockFile });
				vi.advanceTimersByTime(500);

				handler?.(makeEditor('word '.repeat(1000).trim()), { file: mockFile });
				vi.advanceTimersByTime(500);

				expect(plugin.petView?.transitionState).not.toHaveBeenCalled();
			});

			it('does not check goals when onWordGoal is false', () => {
				plugin.settings.celebrations.onWordGoal = false;
				plugin.settings.celebrations.dailyWordGoal = 5;

				const mockFile = { path: 'test.md' } as TFile;
				const handler = getEditorChangeHandler();

				handler?.(makeEditor(''), { file: mockFile });
				vi.advanceTimersByTime(500);

				handler?.(makeEditor('one two three four five six'), { file: mockFile });
				vi.advanceTimersByTime(500);

				expect(plugin.petView?.transitionState).not.toHaveBeenCalled();
			});

			it('does not re-celebrate daily goal once goalCelebrated is true', () => {
				plugin.settings.celebrations.onWordGoal = true;
				plugin.settings.celebrations.dailyWordGoal = 5;

				const mockFile = { path: 'test.md' } as TFile;
				const handler = getEditorChangeHandler();

				// Baseline
				handler?.(makeEditor(''), { file: mockFile });
				vi.advanceTimersByTime(500);

				// Cross goal
				handler?.(makeEditor('one two three four five'), { file: mockFile });
				vi.advanceTimersByTime(500);
				expect(plugin.petView?.transitionState).toHaveBeenCalledWith('celebration');
				vi.advanceTimersByTime(CELEBRATION_OVERLAY_CONSTANTS.CELEBRATION_DURATION_MS);
				vi.clearAllMocks();

				// Add more words — should NOT celebrate again
				handler?.(makeEditor('one two three four five six seven'), { file: mockFile });
				vi.advanceTimersByTime(500);

				expect(plugin.petView?.transitionState).not.toHaveBeenCalled();
			});

			it('resets daily word count when date has changed (midnight rollover)', () => {
				plugin.settings.celebrations.onWordGoal = true;
				plugin.settings.celebrations.dailyWordGoal = 5;
				// Stale date with nearly-full count
				plugin.dailyWordData.date = '2020-01-01';
				plugin.dailyWordData.wordsAddedToday = 4;

				const mockFile = { path: 'test.md' } as TFile;
				const handler = getEditorChangeHandler();

				// Baseline
				handler?.(makeEditor(''), { file: mockFile });
				vi.advanceTimersByTime(500);

				// Add 4 words. Without reset: 4+4=8 >= 5 → would celebrate.
				// With midnight reset: 0+4=4 < 5 → no celebration.
				handler?.(makeEditor('one two three four'), { file: mockFile });
				vi.advanceTimersByTime(500);

				expect(plugin.petView?.transitionState).not.toHaveBeenCalled();
			});

			it('skips word goal checks entirely when file context is null', () => {
				plugin.settings.celebrations.onWordGoal = true;
				plugin.settings.celebrations.dailyWordGoal = 5;

				const handler = getEditorChangeHandler();

				handler?.(makeEditor(''), { file: null });
				vi.advanceTimersByTime(500);

				handler?.(makeEditor('one two three four five six'), { file: null });
				vi.advanceTimersByTime(500);

				expect(plugin.petView?.transitionState).not.toHaveBeenCalled();
				expect(plugin.saveSettings).not.toHaveBeenCalled();
			});
		});

		describe('per-note goal', () => {
			it('celebrates when note body word count crosses word-goal frontmatter value', () => {
				plugin.settings.celebrations.onWordGoal = true;
				(plugin.app.metadataCache.getFileCache as any).mockReturnValue({
					frontmatter: { 'word-goal': 5 },
				});

				const mockFile = { path: 'test.md' } as TFile;
				const handler = getEditorChangeHandler();

				// Baseline: 3 words
				handler?.(makeEditor('one two three'), { file: mockFile });
				vi.advanceTimersByTime(500);
				vi.clearAllMocks();

				// Cross goal: prev=3 < goal=5, current=6 >= goal=5
				handler?.(makeEditor('one two three four five six'), { file: mockFile });
				vi.advanceTimersByTime(500);

				expect(plugin.petView?.transitionState).toHaveBeenCalledWith('celebration');
			});

			it('does not celebrate if prevCount was already at or above goal (no crossing)', () => {
				plugin.settings.celebrations.onWordGoal = true;
				(plugin.app.metadataCache.getFileCache as any).mockReturnValue({
					frontmatter: { 'word-goal': 5 },
				});

				const mockFile = { path: 'test.md' } as TFile;
				const handler = getEditorChangeHandler();

				// Baseline: already 7 words (above goal)
				handler?.(makeEditor('one two three four five six seven'), { file: mockFile });
				vi.advanceTimersByTime(500);
				vi.clearAllMocks();

				// Edit to 8 words — prev=7 >= goal=5, no crossing
				handler?.(makeEditor('one two three four five six seven eight'), { file: mockFile });
				vi.advanceTimersByTime(500);

				expect(plugin.petView?.transitionState).not.toHaveBeenCalled();
			});

			it('does not celebrate per-note goal when no word-goal frontmatter present', () => {
				plugin.settings.celebrations.onWordGoal = true;
				// metadataCache.getFileCache returns null — default mock setup

				const mockFile = { path: 'test.md' } as TFile;
				const handler = getEditorChangeHandler();

				handler?.(makeEditor(''), { file: mockFile });
				vi.advanceTimersByTime(500);

				handler?.(makeEditor('one two three four five six'), { file: mockFile });
				vi.advanceTimersByTime(500);

				expect(plugin.petView?.transitionState).not.toHaveBeenCalled();
			});

			it('does not celebrate per-note goal on first observation of file (baseline init)', () => {
				plugin.settings.celebrations.onWordGoal = true;
				(plugin.app.metadataCache.getFileCache as any).mockReturnValue({
					frontmatter: { 'word-goal': 5 },
				});

				const mockFile = { path: 'test.md' } as TFile;
				const handler = getEditorChangeHandler();

				// First edit: count already above goal — should NOT celebrate
				handler?.(makeEditor('one two three four five six'), { file: mockFile });
				vi.advanceTimersByTime(500);

				expect(plugin.petView?.transitionState).not.toHaveBeenCalled();
			});

			it('excludes YAML frontmatter text from body word count', () => {
				plugin.settings.celebrations.onWordGoal = true;
				plugin.settings.celebrations.dailyWordGoal = 3;

				const mockFile = { path: 'test.md' } as TFile;
				const handler = getEditorChangeHandler();

				// Baseline: frontmatter-only note (no body words)
				const frontmatterOnly = '---\nword-goal: 500\ntitle: My Note\ntags: [writing]\n---\n';
				handler?.(makeEditor(frontmatterOnly), { file: mockFile });
				vi.advanceTimersByTime(500);
				vi.clearAllMocks();

				// Add 2 body words. Frontmatter words must NOT count.
				// delta = 2, wordsAddedToday = 2 < goal = 3 → no celebration
				const withTwoBodyWords = '---\nword-goal: 500\ntitle: My Note\ntags: [writing]\n---\none two';
				handler?.(makeEditor(withTwoBodyWords), { file: mockFile });
				vi.advanceTimersByTime(500);

				expect(plugin.petView?.transitionState).not.toHaveBeenCalled();
			});
		});

		describe('cleanup', () => {
			it('cleanup() clears fileWordCounts and perNoteGoalCelebrated', () => {
				plugin.settings.celebrations.onWordGoal = true;
				plugin.settings.celebrations.dailyWordGoal = 100; // high — won't trigger
				(plugin.app.metadataCache.getFileCache as any).mockReturnValue({
					frontmatter: { 'word-goal': 5 },
				});

				const mockFile = { path: 'test.md' } as TFile;
				const handler = getEditorChangeHandler();

				// Baseline
				handler?.(makeEditor('one two three'), { file: mockFile });
				vi.advanceTimersByTime(500);

				// Cross per-note goal → perNoteGoalCelebrated now has 'test.md'
				handler?.(makeEditor('one two three four five six'), { file: mockFile });
				vi.advanceTimersByTime(500);
				expect(plugin.petView?.transitionState).toHaveBeenCalledWith('celebration');

				vi.advanceTimersByTime(CELEBRATION_OVERLAY_CONSTANTS.CELEBRATION_DURATION_MS);
				service.cleanup();
				vi.clearAllMocks();

				// After cleanup: fileWordCounts and perNoteGoalCelebrated are empty.
				// First edit re-initialises baseline (no celebration).
				handler?.(makeEditor('one'), { file: mockFile });
				vi.advanceTimersByTime(500);
				expect(plugin.petView?.transitionState).not.toHaveBeenCalled();

				// Second edit crosses goal again — should celebrate (Set was cleared)
				handler?.(makeEditor('one two three four five six'), { file: mockFile });
				vi.advanceTimersByTime(500);

				expect(plugin.petView?.transitionState).toHaveBeenCalledWith('celebration');
			});
		});
	});

	describe('editor-change debouncing', () => {
		it('should debounce editor-change events to 500ms', () => {
			const mockEditor = {
				getValue: vi.fn().mockReturnValue('- [x] Task'),
			} as unknown as Editor;

			const editorChangeHandler = (mockWorkspace.on as any).mock.calls.find(
				(call: any) => call[0] === 'editor-change'
			)?.[1];

			// Trigger multiple rapid changes
			editorChangeHandler?.(mockEditor, { file: null });
			editorChangeHandler?.(mockEditor, { file: null });
			editorChangeHandler?.(mockEditor, { file: null });

			// Should not trigger yet
			expect(plugin.petView?.transitionState).not.toHaveBeenCalled();

			// After 500ms, should process once
			vi.advanceTimersByTime(500);
			expect(plugin.petView?.transitionState).toHaveBeenCalledTimes(1);
		});

		it('should reset debounce timer on each editor change', () => {
			const mockEditor = {
				getValue: vi.fn(),
			} as unknown as Editor;

			const editorChangeHandler = (mockWorkspace.on as any).mock.calls.find(
				(call: any) => call[0] === 'editor-change'
			)?.[1];

			// First change: no content (establishes baseline)
			mockEditor.getValue = vi.fn().mockReturnValue('');
			editorChangeHandler?.(mockEditor, { file: null });
			vi.advanceTimersByTime(300);

			// Second change before debounce completes (resets timer): adds a task
			mockEditor.getValue = vi.fn().mockReturnValue('- [x] Task complete');
			editorChangeHandler?.(mockEditor, { file: null });
			vi.advanceTimersByTime(300);

			// Still shouldn't have triggered (debounce not complete)
			expect(plugin.petView?.transitionState).not.toHaveBeenCalled();

			// Complete the debounce period (total 500ms from second change)
			vi.advanceTimersByTime(200);
			// Now celebration should trigger for task completion
			expect(plugin.petView?.transitionState).toHaveBeenCalledTimes(1);
		});
	});

	describe('race condition prevention', () => {
		it('should block celebration while already celebrating', () => {
			const mockFile1 = { path: 'note1.md', basename: 'note1' } as TFile;
			const mockFile2 = { path: 'note2.md', basename: 'note2' } as TFile;

			const createHandler = (mockVault.on as any).mock.calls.find(
				(call: any) => call[0] === 'create'
			)?.[1];

			// First celebration
			createHandler?.(mockFile1);
			expect(plugin.petView?.transitionState).toHaveBeenCalledTimes(1);

			vi.clearAllMocks();

			// Second celebration immediately after should be blocked
			createHandler?.(mockFile2);
			expect(plugin.petView?.transitionState).not.toHaveBeenCalled();
		});

		it('should allow celebration after 2.17 seconds', () => {
			const mockFile1 = { path: 'note1.md', basename: 'note1' } as TFile;
			const mockFile2 = { path: 'note2.md', basename: 'note2' } as TFile;

			const createHandler = (mockVault.on as any).mock.calls.find(
				(call: any) => call[0] === 'create'
			)?.[1];

			// First celebration
			createHandler?.(mockFile1);
			expect(plugin.petView?.transitionState).toHaveBeenCalledTimes(1);

			vi.clearAllMocks();

			// After 2.17 seconds
			vi.advanceTimersByTime(CELEBRATION_OVERLAY_CONSTANTS.CELEBRATION_DURATION_MS);

			// Second celebration should work
			createHandler?.(mockFile2);
			expect(plugin.petView?.transitionState).toHaveBeenCalledTimes(1);
		});

		it('should reset celebration flag on cleanup', () => {
			const mockFile = { path: 'test.md', basename: 'test' } as TFile;
			const createHandler = (mockVault.on as any).mock.calls.find(
				(call: any) => call[0] === 'create'
			)?.[1];

			// Start celebration
			createHandler?.(mockFile);

			// Cleanup
			service.cleanup();

			// Flag should be reset
			vi.clearAllMocks();
			createHandler?.(mockFile);
			expect(plugin.petView?.transitionState).toHaveBeenCalled();
		});
	});

	describe('integration with PetView', () => {
		it('should trigger celebration state transition in PetView', () => {
			const mockFile = { path: 'test.md', basename: 'test' } as TFile;
			const createHandler = (mockVault.on as any).mock.calls.find(
				(call: any) => call[0] === 'create'
			)?.[1];

			createHandler?.(mockFile);

			expect(plugin.petView?.transitionState).toHaveBeenCalledWith('celebration');
		});

		it('should handle missing PetView gracefully', () => {
			plugin.petView = undefined;

			const mockFile = { path: 'test.md', basename: 'test' } as TFile;
			const createHandler = (mockVault.on as any).mock.calls.find(
				(call: any) => call[0] === 'create'
			)?.[1];

			// Should not throw error when PetView is unavailable
			expect(() => createHandler?.(mockFile)).not.toThrow();
		});

		it('should log warning if PetView state transition fails', () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			plugin.petView!.transitionState = vi.fn().mockReturnValue(false);

			const mockFile = { path: 'test.md', basename: 'test' } as TFile;
			const createHandler = (mockVault.on as any).mock.calls.find(
				(call: any) => call[0] === 'create'
			)?.[1];

			createHandler?.(mockFile);

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Failed to trigger celebration')
			);

			consoleSpy.mockRestore();
		});
	});
});
