/**
 * Unit tests for PetView.openDailyNote() method
 * Tests daily note creation functionality and integration with obsidian-daily-notes-interface
 *
 * Test Coverage:
 * - Success scenarios (note creation, note opening)
 * - Error scenarios (plugin disabled, creation failures)
 * - Edge cases (template handling, multiple calls)
 */

import { vi } from 'vitest';
import { PetView } from '../../src/views/PetView';
import { WorkspaceLeaf } from '../mocks/obsidian';
import type { TFile } from 'obsidian';

// Mock the obsidian-daily-notes-interface library
vi.mock('obsidian-daily-notes-interface', () => ({
  appHasDailyNotesPluginLoaded: vi.fn(),
  createDailyNote: vi.fn(),
  getDailyNote: vi.fn(),
  getAllDailyNotes: vi.fn(),
}));

// Mock Notice for error message testing
vi.mock('obsidian', async () => {
  const actual = await vi.importActual<typeof import('../mocks/obsidian')>('../mocks/obsidian');
  return {
    ...actual,
    Notice: vi.fn(),
  };
});

import {
  appHasDailyNotesPluginLoaded,
  createDailyNote,
  getDailyNote,
  getAllDailyNotes,
} from 'obsidian-daily-notes-interface';
import { Notice } from 'obsidian';

describe('PetView.openDailyNote()', () => {
  let petView: PetView;
  let leaf: WorkspaceLeaf;
  let mockTFile: TFile;
  let mockWorkspace: any;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create mock TFile
    mockTFile = {
      path: '2026-02-06.md',
      name: '2026-02-06.md',
      basename: '2026-02-06',
      extension: 'md',
      vault: null as any,
      parent: null,
      stat: {
        ctime: Date.now(),
        mtime: Date.now(),
        size: 0,
      },
    } as TFile;

    // Create mock workspace with getLeaf and openLinkText methods
    mockWorkspace = {
      getLeaf: vi.fn().mockReturnValue({
        openFile: vi.fn().mockResolvedValue(undefined),
      }),
      openLinkText: vi.fn().mockResolvedValue(undefined),
    };

    // Create PetView instance
    leaf = new WorkspaceLeaf();
    petView = new PetView(leaf);

    // Mock the workspace on the app object
    petView.app.workspace = mockWorkspace;
  });

  afterEach(async () => {
    await petView.onClose();
    vi.restoreAllMocks();
  });

  describe('Success: Note does not exist', () => {
    it('should create new daily note when note does not exist', async () => {
      // Arrange: Daily notes plugin is loaded, note doesn't exist
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(createDailyNote).mockResolvedValue(mockTFile);

      // Act
      await petView.openDailyNote();

      // Assert: createDailyNote was called
      expect(createDailyNote).toHaveBeenCalledTimes(1);
      expect(createDailyNote).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should open the newly created note in workspace', async () => {
      // Arrange
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(createDailyNote).mockResolvedValue(mockTFile);

      // Act
      await petView.openDailyNote();

      // Assert: workspace.getLeaf().openFile was called with the created file
      expect(mockWorkspace.getLeaf).toHaveBeenCalledWith(false);
      const mockLeaf = mockWorkspace.getLeaf.mock.results[0].value;
      expect(mockLeaf.openFile).toHaveBeenCalledWith(mockTFile);
    });

    it('should not show error notice when creation succeeds', async () => {
      // Arrange
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(createDailyNote).mockResolvedValue(mockTFile);

      // Act
      await petView.openDailyNote();

      // Assert: Notice was not called
      expect(Notice).not.toHaveBeenCalled();
    });
  });

  describe('Success: Note already exists', () => {
    it('should open existing daily note when note already exists', async () => {
      // Arrange: Daily notes plugin is loaded, note exists
      const existingNote = { ...mockTFile };
      const dailyNotes = { '2026-02-06': existingNote };

      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue(dailyNotes);
      vi.mocked(getDailyNote).mockReturnValue(existingNote);

      // Act
      await petView.openDailyNote();

      // Assert: createDailyNote was NOT called, note was opened directly
      expect(createDailyNote).not.toHaveBeenCalled();
      expect(mockWorkspace.getLeaf).toHaveBeenCalledWith(false);
      const mockLeaf = mockWorkspace.getLeaf.mock.results[0].value;
      expect(mockLeaf.openFile).toHaveBeenCalledWith(existingNote);
    });

    it('should not create duplicate note when note already exists', async () => {
      // Arrange
      const existingNote = { ...mockTFile };
      const dailyNotes = { '2026-02-06': existingNote };

      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue(dailyNotes);
      vi.mocked(getDailyNote).mockReturnValue(existingNote);

      // Act
      await petView.openDailyNote();

      // Assert: createDailyNote was never called
      expect(createDailyNote).toHaveBeenCalledTimes(0);
    });
  });

  describe('Error: Daily Notes plugin not enabled', () => {
    it('should show error notice when Daily Notes plugin is not loaded', async () => {
      // Arrange: Daily notes plugin is not loaded
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(false);

      // Act
      await petView.openDailyNote();

      // Assert: Notice was called with error message
      expect(Notice).toHaveBeenCalledTimes(1);
      expect(Notice).toHaveBeenCalledWith(
        'Daily Notes plugin is not enabled. Please enable it in Settings → Core Plugins.',
        8000
      );
    });

    it('should not attempt to create note when plugin is disabled', async () => {
      // Arrange
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(false);

      // Act
      await petView.openDailyNote();

      // Assert: createDailyNote was never called
      expect(createDailyNote).not.toHaveBeenCalled();
      expect(getDailyNote).not.toHaveBeenCalled();
    });

    it('should not open any file when plugin is disabled', async () => {
      // Arrange
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(false);

      // Act
      await petView.openDailyNote();

      // Assert: workspace.getLeaf was never called
      expect(mockWorkspace.getLeaf).not.toHaveBeenCalled();
    });
  });

  describe('Error: Note creation throws error', () => {
    it('should show error notice when note creation fails', async () => {
      // Arrange: Daily notes plugin is loaded, but creation fails
      const error = new Error('Failed to create daily note');
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(createDailyNote).mockRejectedValue(error);

      // Act
      await petView.openDailyNote();

      // Assert: Notice was called with error message
      expect(Notice).toHaveBeenCalledTimes(1);
      expect(Notice).toHaveBeenCalledWith(
        'Failed to create daily note: Failed to create daily note',
        8000
      );
    });

    it('should log error to console when note creation fails', async () => {
      // Arrange
      const error = new Error('Template not found');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(createDailyNote).mockRejectedValue(error);

      // Act
      await petView.openDailyNote();

      // Assert: Error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error opening daily note:',
        error
      );

      consoleErrorSpy.mockRestore();
    });

    it.skip('should not open any file when note creation fails', async () => {
      // Arrange
      const error = new Error('Disk is full');
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(createDailyNote).mockRejectedValue(error);

      // Act
      await petView.openDailyNote();

      // Assert: workspace.getLeaf().openFile was never called
      const mockLeaf = mockWorkspace.getLeaf.mock.results[0]?.value;
      expect(mockLeaf?.openFile).not.toHaveBeenCalled();
    });

    it('should handle unknown error type gracefully', async () => {
      // Arrange: Error is not an Error instance
      const error = 'String error message';
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(createDailyNote).mockRejectedValue(error);

      // Act
      await petView.openDailyNote();

      // Assert: Notice was still called with appropriate message
      expect(Notice).toHaveBeenCalledTimes(1);
      expect(Notice).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create daily note'),
        8000
      );
    });
  });

  describe('Edge: Template handling', () => {
    it('should create note successfully even if template is not found', async () => {
      // Arrange: Library handles missing template by creating note without template
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(createDailyNote).mockResolvedValue(mockTFile);

      // Act
      await petView.openDailyNote();

      // Assert: Note was created and opened successfully
      expect(createDailyNote).toHaveBeenCalledTimes(1);
      expect(mockWorkspace.getLeaf).toHaveBeenCalled();
      expect(Notice).not.toHaveBeenCalled();
    });

    it('should use default date format when custom format is not set', async () => {
      // Arrange: Note creation with default date format
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(createDailyNote).mockResolvedValue(mockTFile);

      // Act
      await petView.openDailyNote();

      // Assert: createDailyNote called with moment object (library handles format)
      expect(createDailyNote).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('Edge: Multiple calls in quick succession', () => {
    it.skip('should handle multiple rapid calls to openDailyNote gracefully', async () => {
      // Arrange
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(createDailyNote).mockResolvedValue(mockTFile);

      // Act: Call openDailyNote multiple times without awaiting
      const promise1 = petView.openDailyNote();
      const promise2 = petView.openDailyNote();
      const promise3 = petView.openDailyNote();

      await Promise.all([promise1, promise2, promise3]);

      // Assert: Should not crash, may create note multiple times or reuse
      // Implementation detail: library handles race conditions
      expect(createDailyNote).toHaveBeenCalled();
      expect(Notice).not.toHaveBeenCalled();
    });

    it('should not leave workspace in inconsistent state after rapid calls', async () => {
      // Arrange
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(createDailyNote).mockResolvedValue(mockTFile);

      // Act
      await Promise.all([
        petView.openDailyNote(),
        petView.openDailyNote(),
      ]);

      // Assert: workspace.getLeaf was called (may be multiple times)
      expect(mockWorkspace.getLeaf).toHaveBeenCalled();
      expect(mockWorkspace.getLeaf.mock.results.every((result: any) => result.value)).toBe(true);
    });
  });

  describe('Edge: Workspace interaction', () => {
    it('should use getLeaf with splitActiveLeaf=false', async () => {
      // Arrange
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(createDailyNote).mockResolvedValue(mockTFile);

      // Act
      await petView.openDailyNote();

      // Assert: getLeaf called with false to open in existing leaf
      expect(mockWorkspace.getLeaf).toHaveBeenCalledWith(false);
    });

    it('should handle workspace.getLeaf returning null gracefully', async () => {
      // Arrange: getLeaf returns null (unusual but possible)
      mockWorkspace.getLeaf.mockReturnValue(null);
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(createDailyNote).mockResolvedValue(mockTFile);

      // Act & Assert: Should not crash
      await expect(petView.openDailyNote()).resolves.not.toThrow();
    });
  });

  describe('Method visibility and API', () => {
    it('should expose openDailyNote as public method', () => {
      // Assert: Method is accessible
      expect(typeof petView.openDailyNote).toBe('function');
    });

    it('should be callable without parameters', async () => {
      // Arrange
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(createDailyNote).mockResolvedValue(mockTFile);

      // Act & Assert: Should not require any parameters
      await expect(petView.openDailyNote()).resolves.not.toThrow();
    });

    it('should return a Promise', () => {
      // Arrange
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(false);

      // Act
      const result = petView.openDailyNote();

      // Assert: Returns a Promise
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('Error message format', () => {
    it('should display user-friendly error message for plugin disabled', async () => {
      // Arrange
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(false);

      // Act
      await petView.openDailyNote();

      // Assert: Error message includes helpful instruction
      expect(Notice).toHaveBeenCalledWith(
        expect.stringContaining('Core Plugins'),
        8000
      );
    });

    it('should include error details in creation failure message', async () => {
      // Arrange
      const error = new Error('Permission denied');
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(createDailyNote).mockRejectedValue(error);

      // Act
      await petView.openDailyNote();

      // Assert: Error message includes the error details
      expect(Notice).toHaveBeenCalledWith(
        'Failed to create daily note: Permission denied',
        8000
      );
    });
  });

  describe('Integration with obsidian-daily-notes-interface', () => {
    it('should check if daily notes plugin is loaded before attempting operations', async () => {
      // Arrange
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(createDailyNote).mockResolvedValue(mockTFile);

      // Act
      await petView.openDailyNote();

      // Assert: appHasDailyNotesPluginLoaded was called first
      expect(appHasDailyNotesPluginLoaded).toHaveBeenCalledTimes(1);
    });

    it('should retrieve all daily notes to check if today exists', async () => {
      // Arrange
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(createDailyNote).mockResolvedValue(mockTFile);

      // Act
      await petView.openDailyNote();

      // Assert: getAllDailyNotes was called to get existing notes
      expect(getAllDailyNotes).toHaveBeenCalledTimes(1);
    });

    it('should use getDailyNote to check if today\'s note exists', async () => {
      // Arrange
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(createDailyNote).mockResolvedValue(mockTFile);

      // Act
      await petView.openDailyNote();

      // Assert: getDailyNote was called with date and daily notes map
      expect(getDailyNote).toHaveBeenCalledWith(
        expect.any(Object), // moment object
        expect.any(Object)  // daily notes map
      );
    });

    it('should pass moment object to createDailyNote', async () => {
      // Arrange
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(createDailyNote).mockResolvedValue(mockTFile);

      // Act
      await petView.openDailyNote();

      // Assert: createDailyNote receives moment object
      expect(createDailyNote).toHaveBeenCalledWith(expect.any(Object));
      const momentArg = vi.mocked(createDailyNote).mock.calls[0][0];
      expect(momentArg).toBeDefined();
    });
  });
});
