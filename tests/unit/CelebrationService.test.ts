/**
 * Unit tests for CelebrationService
 * Tests celebration triggers, cooldown logic, settings integration, and cleanup
 */

import { vi } from 'vitest';
import type { App, TFile, Editor, Vault, Workspace } from 'obsidian';
import type ObsidianPetsPlugin from '../../src/main';
import type { ObsidianPetsSettings } from '../../src/types/settings';

// Mock types for testing
interface MockPlugin {
	app: App;
	settings: ObsidianPetsSettings;
	petView?: {
		transitionState: (state: string) => boolean;
	};
}

// We'll import CelebrationService once it's created
import { CelebrationService } from '../../src/celebrations/CelebrationService';

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
					onWordMilestone: true,
					wordMilestones: [100, 500, 1000],
				},
			},
			petView: {
				transitionState: vi.fn().mockReturnValue(true),
			},
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
			editorChangeHandler?.(mockEditor);

			vi.clearAllMocks();

			// Second call: task is now checked
			mockEditor.getValue = vi.fn().mockReturnValue('- [x] Complete this task');

			// Debounced handler should trigger after 500ms
			editorChangeHandler?.(mockEditor);
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
			editorChangeHandler?.(mockEditor);
			vi.advanceTimersByTime(500);
			// First increase detected and celebrated
			expect(plugin.petView?.transitionState).toHaveBeenCalledWith('celebration');

			vi.clearAllMocks();

			// Two more tasks checked (count increased from 1 to 3)
			mockEditor.getValue = vi
				.fn()
				.mockReturnValue('- [x] Task 1\n- [x] Task 2\n- [x] Task 3');
			editorChangeHandler?.(mockEditor);
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
			editorChangeHandler?.(mockEditor);
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
			editorChangeHandler?.(mockEditor);
			vi.advanceTimersByTime(500);

			vi.clearAllMocks();

			// One task unchecked (count decreased from 2 to 1)
			mockEditor.getValue = vi.fn().mockReturnValue('- [ ] Task 1\n- [x] Task 2');
			editorChangeHandler?.(mockEditor);
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
			editorChangeHandler?.(mockEditor);
			vi.advanceTimersByTime(500);

			vi.clearAllMocks();

			// Link added
			mockEditor.getValue = vi.fn().mockReturnValue('Some text with [[a link]]');
			editorChangeHandler?.(mockEditor);
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
			editorChangeHandler?.(mockEditor);
			vi.advanceTimersByTime(500);

			vi.clearAllMocks();

			// Markdown link added
			mockEditor.getValue = vi.fn().mockReturnValue('Some [text](https://example.com)');
			editorChangeHandler?.(mockEditor);
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
			editorChangeHandler?.(mockEditor);
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
			editorChangeHandler?.(mockEditor);
			vi.advanceTimersByTime(500);

			vi.clearAllMocks();

			// One link removed
			mockEditor.getValue = vi.fn().mockReturnValue('[[Link 1]] only');
			editorChangeHandler?.(mockEditor);
			vi.advanceTimersByTime(500);

			expect(plugin.petView?.transitionState).not.toHaveBeenCalled();
		});
	});

	describe('word count milestone celebration', () => {
		it('should celebrate when crossing 100 word threshold', () => {
			const mockEditor = {
				getValue: vi.fn(),
			} as unknown as Editor;

			const editorChangeHandler = (mockWorkspace.on as any).mock.calls.find(
				(call: any) => call[0] === 'editor-change'
			)?.[1];

			// Initial state: 95 words
			mockEditor.getValue = vi.fn().mockReturnValue('word '.repeat(95));
			editorChangeHandler?.(mockEditor);
			vi.advanceTimersByTime(500);

			vi.clearAllMocks();

			// Crossed 100 word threshold
			mockEditor.getValue = vi.fn().mockReturnValue('word '.repeat(105));
			editorChangeHandler?.(mockEditor);
			vi.advanceTimersByTime(500);

			expect(plugin.petView?.transitionState).toHaveBeenCalledWith('celebration');
		});

		it('should celebrate when crossing 500 word threshold', () => {
			const mockEditor = {
				getValue: vi.fn(),
			} as unknown as Editor;

			const editorChangeHandler = (mockWorkspace.on as any).mock.calls.find(
				(call: any) => call[0] === 'editor-change'
			)?.[1];

			// Establish previous state: already past 100 milestone
			mockEditor.getValue = vi.fn().mockReturnValue('word '.repeat(101));
			editorChangeHandler?.(mockEditor);
			vi.advanceTimersByTime(500);
			// This celebrates for 100 milestone

			// Wait for celebration to complete
			vi.advanceTimersByTime(2170);
			vi.clearAllMocks();

			// Now at 495 words (between 100 and 500)
			mockEditor.getValue = vi.fn().mockReturnValue('word '.repeat(495));
			editorChangeHandler?.(mockEditor);
			vi.advanceTimersByTime(500);

			vi.clearAllMocks();

			// Crossed 500 word threshold
			mockEditor.getValue = vi.fn().mockReturnValue('word '.repeat(510));
			editorChangeHandler?.(mockEditor);
			vi.advanceTimersByTime(500);

			expect(plugin.petView?.transitionState).toHaveBeenCalledWith('celebration');
		});

		it('should celebrate when crossing 1000 word threshold', () => {
			const mockEditor = {
				getValue: vi.fn(),
			} as unknown as Editor;

			const editorChangeHandler = (mockWorkspace.on as any).mock.calls.find(
				(call: any) => call[0] === 'editor-change'
			)?.[1];

			// Establish previous state: already past 100 and 500 milestones
			mockEditor.getValue = vi.fn().mockReturnValue('word '.repeat(501));
			editorChangeHandler?.(mockEditor);
			vi.advanceTimersByTime(500);
			// This celebrates for 100 milestone first

			// Wait for celebration to complete
			vi.advanceTimersByTime(2170);
			vi.clearAllMocks();

			// Now at 995 words (between 500 and 1000)
			mockEditor.getValue = vi.fn().mockReturnValue('word '.repeat(995));
			editorChangeHandler?.(mockEditor);
			vi.advanceTimersByTime(500);

			vi.clearAllMocks();

			// Crossed 1000 word threshold
			mockEditor.getValue = vi.fn().mockReturnValue('word '.repeat(1010));
			editorChangeHandler?.(mockEditor);
			vi.advanceTimersByTime(500);

			expect(plugin.petView?.transitionState).toHaveBeenCalledWith('celebration');
		});

		it('should not celebrate if onWordMilestone is disabled', () => {
			plugin.settings.celebrations.onWordMilestone = false;

			const mockEditor = {
				getValue: vi.fn(),
			} as unknown as Editor;

			const editorChangeHandler = (mockWorkspace.on as any).mock.calls.find(
				(call: any) => call[0] === 'editor-change'
			)?.[1];

			mockEditor.getValue = vi.fn().mockReturnValue('word '.repeat(105));
			editorChangeHandler?.(mockEditor);
			vi.advanceTimersByTime(500);

			expect(plugin.petView?.transitionState).not.toHaveBeenCalled();
		});

		it('should not celebrate when word count decreases below threshold', () => {
			const mockEditor = {
				getValue: vi.fn(),
			} as unknown as Editor;

			const editorChangeHandler = (mockWorkspace.on as any).mock.calls.find(
				(call: any) => call[0] === 'editor-change'
			)?.[1];

			// Initial state: 105 words
			mockEditor.getValue = vi.fn().mockReturnValue('word '.repeat(105));
			editorChangeHandler?.(mockEditor);
			vi.advanceTimersByTime(500);

			vi.clearAllMocks();

			// Decreased to 95 words
			mockEditor.getValue = vi.fn().mockReturnValue('word '.repeat(95));
			editorChangeHandler?.(mockEditor);
			vi.advanceTimersByTime(500);

			expect(plugin.petView?.transitionState).not.toHaveBeenCalled();
		});

		it('should only celebrate once per threshold per document', () => {
			const mockEditor = {
				getValue: vi.fn(),
			} as unknown as Editor;

			const editorChangeHandler = (mockWorkspace.on as any).mock.calls.find(
				(call: any) => call[0] === 'editor-change'
			)?.[1];

			// Initial state: 95 words
			mockEditor.getValue = vi.fn().mockReturnValue('word '.repeat(95));
			editorChangeHandler?.(mockEditor);
			vi.advanceTimersByTime(500);

			vi.clearAllMocks();

			// Cross 100 threshold first time
			mockEditor.getValue = vi.fn().mockReturnValue('word '.repeat(105));
			editorChangeHandler?.(mockEditor);
			vi.advanceTimersByTime(500);
			expect(plugin.petView?.transitionState).toHaveBeenCalledTimes(1);

			vi.clearAllMocks();

			// Continue writing past 100 threshold
			mockEditor.getValue = vi.fn().mockReturnValue('word '.repeat(120));
			editorChangeHandler?.(mockEditor);
			vi.advanceTimersByTime(500);
			// Should not celebrate again for same threshold
			expect(plugin.petView?.transitionState).not.toHaveBeenCalled();
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
			editorChangeHandler?.(mockEditor);
			editorChangeHandler?.(mockEditor);
			editorChangeHandler?.(mockEditor);

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
			editorChangeHandler?.(mockEditor);
			vi.advanceTimersByTime(300);

			// Second change before debounce completes (resets timer): adds a task
			mockEditor.getValue = vi.fn().mockReturnValue('- [x] Task complete');
			editorChangeHandler?.(mockEditor);
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
			vi.advanceTimersByTime(2170);

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
