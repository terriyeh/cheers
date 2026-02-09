/**
 * Unit tests for PetView Daily Note Button (Issue #47)
 * Tests button validation and routing logic for daily note functionality
 *
 * Test Coverage:
 * - Prerequisite validation (12 tests)
 * - Button handler routing (8 tests)
 * - Conversation starter stub (3 tests)
 * - Integration tests (4 tests)
 * - Edge cases (5 tests)
 *
 * Total: 32 comprehensive tests
 */

import { vi } from 'vitest';
import { PetView } from '../../../src/views/PetView';
import { WorkspaceLeaf } from '../../mocks/obsidian';
import type { TFile, App, Vault, Workspace, Notice as NoticeType } from 'obsidian';
import { parseTemplate } from '../../../src/template/parser';

// Mock the obsidian-daily-notes-interface library
vi.mock('obsidian-daily-notes-interface', () => ({
  appHasDailyNotesPluginLoaded: vi.fn(),
  createDailyNote: vi.fn(),
  getDailyNote: vi.fn(),
  getAllDailyNotes: vi.fn(),
  getDailyNoteSettings: vi.fn(),
}));

// Mock Notice for error message testing
vi.mock('obsidian', async () => {
  const actual = await vi.importActual<typeof import('../../mocks/obsidian')>('../../mocks/obsidian');
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
  getDailyNoteSettings,
} from 'obsidian-daily-notes-interface';
import { Notice } from 'obsidian';

// Test data fixtures
const VALID_TEMPLATE = `# Daily Note Template
## Morning Reflection

\`\`\`vaultpal
journal What are you grateful for today?
\`\`\`

## Evening Reflection

\`\`\`vaultpal
journal What went well today?
\`\`\`
`;

const TEMPLATE_NO_BLOCKS = `# Daily Note Template
Just regular markdown content.
No VaultPal blocks here.
`;

const TEMPLATE_INVALID_BLOCKS = `# Daily Note Template

\`\`\`vaultpal
invalid syntax here
\`\`\`
`;

const TEMPLATE_SINGLE_BLOCK = `# Daily Note

\`\`\`vaultpal
journal What's on your mind?
\`\`\`
`;

const TEMPLATE_EMPTY = '';

describe('PetView - Daily Note Button (Issue #47)', () => {
  let petView: PetView;
  let leaf: WorkspaceLeaf;
  let mockTFile: TFile;
  let mockWorkspace: any;
  let mockVault: any;
  let mockApp: App;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Setup default mock return values
    vi.mocked(getDailyNoteSettings).mockReturnValue({
      folder: '',
      format: 'YYYY-MM-DD',
      template: 'templates/daily.md',
    });

    // Create mock TFile
    mockTFile = {
      path: '2026-02-07.md',
      name: '2026-02-07.md',
      basename: '2026-02-07',
      extension: 'md',
      vault: null as any,
      parent: null,
      stat: {
        ctime: Date.now(),
        mtime: Date.now(),
        size: 1024,
      },
    } as TFile;

    // Create mock workspace
    mockWorkspace = {
      getLeaf: vi.fn().mockReturnValue({
        openFile: vi.fn().mockResolvedValue(undefined),
      }),
    };

    // Create mock vault
    mockVault = {
      getAbstractFileByPath: vi.fn(),
      read: vi.fn(),
      adapter: {
        getResourcePath: (path: string) => `app://local/${path}`,
      },
    };

    // Create PetView instance
    leaf = new WorkspaceLeaf();
    petView = new PetView(leaf);

    // Mock the app object
    mockApp = petView.app;
    mockApp.workspace = mockWorkspace;
    mockApp.vault = mockVault as unknown as Vault;

    // Mock internal config object for daily notes
    (mockApp as any).internalPlugins = {
      plugins: {
        'daily-notes': {
          instance: {
            options: {
              template: 'templates/daily-note.md',
              folder: 'Daily Notes',
              format: 'YYYY-MM-DD',
            },
          },
        },
      },
    };
  });

  afterEach(async () => {
    await petView.onClose();
    vi.restoreAllMocks();
  });

  describe('1. Prerequisite Validation (12 tests)', () => {
    describe('Valid scenarios', () => {
      it('should return valid when all prerequisites are met', async () => {
        // Arrange: Daily Notes plugin enabled, template exists with vaultpal blocks
        vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
        vi.mocked(mockVault.getAbstractFileByPath).mockReturnValue(mockTFile);
        vi.mocked(mockVault.read).mockResolvedValue(VALID_TEMPLATE);

        // Act
        const result = await petView.validatePrerequisites();

        // Assert
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should return valid for template with 1 vaultpal block', async () => {
        // Arrange
        vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
        vi.mocked(mockVault.getAbstractFileByPath).mockReturnValue(mockTFile);
        vi.mocked(mockVault.read).mockResolvedValue(TEMPLATE_SINGLE_BLOCK);

        // Act
        const result = await petView.validatePrerequisites();

        // Assert
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should return valid for template with multiple vaultpal blocks', async () => {
        // Arrange
        vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
        vi.mocked(mockVault.getAbstractFileByPath).mockReturnValue(mockTFile);
        vi.mocked(mockVault.read).mockResolvedValue(VALID_TEMPLATE);

        // Act
        const result = await petView.validatePrerequisites();

        // Assert
        expect(result.valid).toBe(true);
        // Verify that the template parser found multiple blocks
        const parseResult = parseTemplate(VALID_TEMPLATE);
        expect(parseResult.questions.length).toBe(2);
      });
    });

    describe('Daily Notes plugin', () => {
      it('should return error when Daily Notes plugin is disabled', async () => {
        // Arrange
        vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(false);

        // Act
        const result = await petView.validatePrerequisites();

        // Assert
        expect(result.valid).toBe(false);
        expect(result.error).toBe(
          'Daily Notes plugin is not enabled. Please enable it in Settings → Core Plugins.'
        );
      });

      it('should proceed to next check when plugin is enabled', async () => {
        // Arrange
        vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
        // No template configured
        vi.mocked(getDailyNoteSettings).mockReturnValue({
          folder: '',
          format: 'YYYY-MM-DD',
          template: '',
        });

        // Act
        const result = await petView.validatePrerequisites();

        // Assert: Should fail on template check, not plugin check
        expect(result.valid).toBe(false);
        expect(result.error).toContain('No template configured');
      });
    });

    describe('Template configuration', () => {
      it('should return error when no template is configured', async () => {
        // Arrange
        vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
        vi.mocked(getDailyNoteSettings).mockReturnValue({
          folder: '',
          format: 'YYYY-MM-DD',
          template: '',
        });

        // Act
        const result = await petView.validatePrerequisites();

        // Assert
        expect(result.valid).toBe(false);
        expect(result.error).toBe(
          'No template configured. Please set a template in Settings → Core Plugins → Daily Notes.'
        );
      });

      it('should return error when template path is empty string', async () => {
        // Arrange
        vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
        vi.mocked(getDailyNoteSettings).mockReturnValue({
          folder: '',
          format: 'YYYY-MM-DD',
          template: '',
        });

        // Act
        const result = await petView.validatePrerequisites();

        // Assert
        expect(result.valid).toBe(false);
        expect(result.error).toContain('No template configured');
      });

      it('should return error when template path is only whitespace', async () => {
        // Arrange
        vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
        vi.mocked(getDailyNoteSettings).mockReturnValue({
          folder: '',
          format: 'YYYY-MM-DD',
          template: '   ',
        });

        // Act
        const result = await petView.validatePrerequisites();

        // Assert
        expect(result.valid).toBe(false);
        expect(result.error).toContain('No template configured');
      });
    });

    describe('Template path security', () => {
      it('should reject path traversal attempts', async () => {
        // Arrange
        vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
        vi.mocked(getDailyNoteSettings).mockReturnValue({
          folder: '',
          format: 'YYYY-MM-DD',
          template: '../../etc/passwd',
        });

        // Act
        const result = await petView.validatePrerequisites();

        // Assert
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid template path. Template must be within the vault.');
      });

      it('should reject absolute Unix paths', async () => {
        // Arrange
        vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
        vi.mocked(getDailyNoteSettings).mockReturnValue({
          folder: '',
          format: 'YYYY-MM-DD',
          template: '/absolute/path/file',
        });

        // Act
        const result = await petView.validatePrerequisites();

        // Assert
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid template path. Template must be within the vault.');
      });

      it('should reject Windows absolute paths', async () => {
        // Arrange
        vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
        vi.mocked(getDailyNoteSettings).mockReturnValue({
          folder: '',
          format: 'YYYY-MM-DD',
          template: 'C:\\Windows\\file',
        });

        // Act
        const result = await petView.validatePrerequisites();

        // Assert
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid template path. Template must be within the vault.');
      });

      it('should reject Windows drive letter paths', async () => {
        // Arrange
        vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
        vi.mocked(getDailyNoteSettings).mockReturnValue({
          folder: '',
          format: 'YYYY-MM-DD',
          template: 'D:file',
        });

        // Act
        const result = await petView.validatePrerequisites();

        // Assert
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid template path. Template must be within the vault.');
      });

      it('should accept valid vault-relative paths', async () => {
        // Arrange
        vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
        vi.mocked(getDailyNoteSettings).mockReturnValue({
          folder: '',
          format: 'YYYY-MM-DD',
          template: 'templates/subfolder/daily',
        });
        vi.mocked(mockVault.getAbstractFileByPath).mockReturnValue(mockTFile);
        vi.mocked(mockVault.read).mockResolvedValue(VALID_TEMPLATE);

        // Act
        const result = await petView.validatePrerequisites();

        // Assert
        expect(result.valid).toBe(true);
      });
    });

    describe('Template file', () => {
      it('should return error when template file does not exist', async () => {
        // Arrange
        vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
        vi.mocked(mockVault.getAbstractFileByPath).mockReturnValue(null);

        // Act
        const result = await petView.validatePrerequisites();

        // Assert
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Template file not found. Please check your Daily Notes template settings.');
      });

      it('should return error when template file is null', async () => {
        // Arrange
        vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
        vi.mocked(mockVault.getAbstractFileByPath).mockReturnValue(null);

        // Act
        const result = await petView.validatePrerequisites();

        // Assert
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Template file not found');
      });

      it('should handle template path with .md extension already present', async () => {
        // Arrange: Obsidian sometimes stores template with .md, sometimes without
        vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
        vi.mocked(getDailyNoteSettings).mockReturnValue({
          folder: '',
          format: 'YYYY-MM-DD',
          template: 'templates/daily.md', // Already has .md extension
        });
        vi.mocked(mockVault.getAbstractFileByPath).mockReturnValue(mockTFile);
        vi.mocked(mockVault.read).mockResolvedValue(VALID_TEMPLATE);

        // Act
        const result = await petView.validatePrerequisites();

        // Assert: Should pass validation and not double .md extension
        expect(result.valid).toBe(true);
        expect(mockVault.getAbstractFileByPath).toHaveBeenCalledWith('templates/daily.md');
      });

      it('should add .md extension when template path lacks it', async () => {
        // Arrange: Obsidian typically stores template paths WITHOUT .md extension
        vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
        vi.mocked(getDailyNoteSettings).mockReturnValue({
          folder: '',
          format: 'YYYY-MM-DD',
          template: 'templates/daily', // No .md extension
        });
        vi.mocked(mockVault.getAbstractFileByPath).mockReturnValue(mockTFile);
        vi.mocked(mockVault.read).mockResolvedValue(VALID_TEMPLATE);

        // Act
        const result = await petView.validatePrerequisites();

        // Assert: Should add .md extension and pass validation
        expect(result.valid).toBe(true);
        expect(mockVault.getAbstractFileByPath).toHaveBeenCalledWith('templates/daily.md');
      });
    });

    describe('VaultPal blocks', () => {
      it('should return error when template has no vaultpal blocks', async () => {
        // Arrange
        vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
        vi.mocked(mockVault.getAbstractFileByPath).mockReturnValue(mockTFile);
        vi.mocked(mockVault.read).mockResolvedValue(TEMPLATE_NO_BLOCKS);

        // Act
        const result = await petView.validatePrerequisites();

        // Assert
        expect(result.valid).toBe(false);
        expect(result.error).toBe(
          'Template has no vaultpal blocks. Add ```vaultpal blocks to your template.'
        );
      });

      it('should return error when template parsing fails', async () => {
        // Arrange
        vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
        vi.mocked(mockVault.getAbstractFileByPath).mockReturnValue(mockTFile);
        vi.mocked(mockVault.read).mockRejectedValue(new Error('Failed to read file'));

        // Act
        const result = await petView.validatePrerequisites();

        // Assert
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Failed to read template');
      });
    });
  });

  describe('2. Button Handler Routing (8 tests)', () => {
    describe('Valid + note exists', () => {
      it('should open existing note in workspace', async () => {
        // Arrange: Valid prerequisites
        vi.spyOn(petView, 'validatePrerequisites').mockResolvedValue({ valid: true });

        // Mock: Note exists
        const existingNote = { ...mockTFile };
        vi.mocked(getDailyNote).mockReturnValue(existingNote);
        vi.mocked(getAllDailyNotes).mockReturnValue({ '2026-02-07': existingNote });

        // Mock: Workspace
        const mockLeaf = { openFile: vi.fn().mockResolvedValue(undefined) };
        vi.mocked(mockWorkspace.getLeaf).mockReturnValue(mockLeaf);

        // Act
        await petView.handleDailyNoteButton();

        // Assert
        expect(mockLeaf.openFile).toHaveBeenCalledWith(existingNote);
      });

      it('should NOT call startConversation when note exists', async () => {
        // Arrange
        vi.spyOn(petView, 'validatePrerequisites').mockResolvedValue({ valid: true });
        vi.spyOn(petView, 'startConversation').mockResolvedValue();

        const existingNote = { ...mockTFile };
        vi.mocked(getDailyNote).mockReturnValue(existingNote);
        vi.mocked(getAllDailyNotes).mockReturnValue({ '2026-02-07': existingNote });

        const mockLeaf = { openFile: vi.fn().mockResolvedValue(undefined) };
        vi.mocked(mockWorkspace.getLeaf).mockReturnValue(mockLeaf);

        // Act
        await petView.handleDailyNoteButton();

        // Assert
        expect(petView.startConversation).not.toHaveBeenCalled();
      });
    });

    describe('Valid + note does not exist', () => {
      it('should create new daily note', async () => {
        // Arrange: Valid prerequisites
        vi.spyOn(petView, 'validatePrerequisites').mockResolvedValue({ valid: true });

        // Mock: Note doesn't exist
        vi.mocked(getDailyNote).mockReturnValue(null);
        vi.mocked(getAllDailyNotes).mockReturnValue({});
        vi.mocked(createDailyNote).mockResolvedValue(mockTFile);

        // Mock: startConversation
        vi.spyOn(petView, 'startConversation').mockResolvedValue();

        // Act
        await petView.handleDailyNoteButton();

        // Assert
        expect(createDailyNote).toHaveBeenCalledTimes(1);
        expect(createDailyNote).toHaveBeenCalledWith(expect.any(Object));
      });

      it('should call startConversation with created note', async () => {
        // Arrange
        vi.spyOn(petView, 'validatePrerequisites').mockResolvedValue({ valid: true });

        vi.mocked(getDailyNote).mockReturnValue(null);
        vi.mocked(getAllDailyNotes).mockReturnValue({});
        vi.mocked(createDailyNote).mockResolvedValue(mockTFile);

        const startConversationSpy = vi
          .spyOn(petView, 'startConversation')
          .mockResolvedValue();

        // Act
        await petView.handleDailyNoteButton();

        // Assert
        expect(startConversationSpy).toHaveBeenCalledTimes(1);
        expect(startConversationSpy).toHaveBeenCalledWith(mockTFile);
      });

      it('should NOT open note directly when starting conversation', async () => {
        // Arrange
        vi.spyOn(petView, 'validatePrerequisites').mockResolvedValue({ valid: true });

        vi.mocked(getDailyNote).mockReturnValue(null);
        vi.mocked(getAllDailyNotes).mockReturnValue({});
        vi.mocked(createDailyNote).mockResolvedValue(mockTFile);

        vi.spyOn(petView, 'startConversation').mockResolvedValue();

        const mockLeaf = { openFile: vi.fn().mockResolvedValue(undefined) };
        vi.mocked(mockWorkspace.getLeaf).mockReturnValue(mockLeaf);

        // Act
        await petView.handleDailyNoteButton();

        // Assert: openFile should not be called directly (startConversation handles opening)
        expect(mockLeaf.openFile).not.toHaveBeenCalled();
      });
    });

    describe('Invalid prerequisites', () => {
      it('should show Notice with validation error', async () => {
        // Arrange
        const errorMessage = 'Daily Notes plugin is not enabled. Please enable it in Settings → Core Plugins.';
        vi.spyOn(petView, 'validatePrerequisites').mockResolvedValue({
          valid: false,
          error: errorMessage,
        });

        // Act
        await petView.handleDailyNoteButton();

        // Assert
        expect(Notice).toHaveBeenCalledTimes(1);
        expect(Notice).toHaveBeenCalledWith(errorMessage, 8000);
      });

      it('should NOT create note or start conversation when invalid', async () => {
        // Arrange
        vi.spyOn(petView, 'validatePrerequisites').mockResolvedValue({
          valid: false,
          error: 'No template configured. Please set a template in Settings → Core Plugins → Daily Notes.',
        });

        vi.spyOn(petView, 'startConversation').mockResolvedValue();

        // Act
        await petView.handleDailyNoteButton();

        // Assert
        expect(createDailyNote).not.toHaveBeenCalled();
        expect(petView.startConversation).not.toHaveBeenCalled();
      });
    });

    describe('Error handling', () => {
      it('should catch exceptions and show generic error Notice', async () => {
        // Arrange: Throw unexpected error
        vi.spyOn(petView, 'validatePrerequisites').mockRejectedValue(
          new Error('Unexpected error')
        );

        // Act
        await petView.handleDailyNoteButton();

        // Assert
        expect(Notice).toHaveBeenCalledTimes(1);
        expect(Notice).toHaveBeenCalledWith(
          expect.stringContaining('Failed to open daily note'),
          8000
        );
      });
    });
  });

  describe('3. Conversation Starter Stub (3 tests)', () => {
    beforeEach(async () => {
      // Initialize PetView so we have a state machine
      await petView.onOpen();
    });

    it('should open the provided daily note', async () => {
      // Arrange
      const mockLeaf = { openFile: vi.fn().mockResolvedValue(undefined) };
      vi.mocked(mockWorkspace.getLeaf).mockReturnValue(mockLeaf);

      // Act
      await petView.startConversation(mockTFile);

      // Assert
      expect(mockWorkspace.getLeaf).toHaveBeenCalledWith(false);
      expect(mockLeaf.openFile).toHaveBeenCalledWith(mockTFile);
    });

    it('should show "Conversation mode coming soon!" Notice', async () => {
      // Arrange
      const mockLeaf = { openFile: vi.fn().mockResolvedValue(undefined) };
      vi.mocked(mockWorkspace.getLeaf).mockReturnValue(mockLeaf);

      // Act
      await petView.startConversation(mockTFile);

      // Assert
      expect(Notice).toHaveBeenCalledWith(
        'Conversation mode coming soon! (Issue #12)',
        5000
      );
    });

    it('should trigger greeting → talking animation sequence', async () => {
      // Arrange
      const mockLeaf = { openFile: vi.fn().mockResolvedValue(undefined) };
      vi.mocked(mockWorkspace.getLeaf).mockReturnValue(mockLeaf);

      // Act
      await petView.startConversation(mockTFile);

      // Assert: Pet should start with 'greeting' state
      expect(petView.getCurrentState()).toBe('greeting');

      // Wait for transition to 'talking' (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2100));

      // Assert: Pet should now be in 'talking' state
      expect(petView.getCurrentState()).toBe('talking');
    });
  });

  describe('4. Integration Tests (4 tests)', () => {
    it('should complete full flow: Valid, no note → conversation starts', async () => {
      // Arrange: Initialize view
      await petView.onOpen();

      // Valid prerequisites
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(mockVault.getAbstractFileByPath).mockReturnValue(mockTFile);
      vi.mocked(mockVault.read).mockResolvedValue(VALID_TEMPLATE);

      // Note doesn't exist
      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(createDailyNote).mockResolvedValue(mockTFile);

      // Mock workspace
      const mockLeaf = { openFile: vi.fn().mockResolvedValue(undefined) };
      vi.mocked(mockWorkspace.getLeaf).mockReturnValue(mockLeaf);

      // Act
      await petView.handleDailyNoteButton();

      // Assert: Full conversation flow executed
      expect(createDailyNote).toHaveBeenCalled();
      expect(mockLeaf.openFile).toHaveBeenCalledWith(mockTFile);
      expect(Notice).toHaveBeenCalledWith(
        expect.stringContaining('Conversation mode coming soon'),
        5000
      );
      // Pet should start with greeting animation
      expect(petView.getCurrentState()).toBe('greeting');
    });

    it('should complete full flow: Valid, existing note → opens note', async () => {
      // Arrange: Initialize view
      await petView.onOpen();

      // Valid prerequisites
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(mockVault.getAbstractFileByPath).mockReturnValue(mockTFile);
      vi.mocked(mockVault.read).mockResolvedValue(VALID_TEMPLATE);

      // Note exists
      const existingNote = { ...mockTFile };
      vi.mocked(getDailyNote).mockReturnValue(existingNote);
      vi.mocked(getAllDailyNotes).mockReturnValue({ '2026-02-07': existingNote });

      // Mock workspace
      const mockLeaf = { openFile: vi.fn().mockResolvedValue(undefined) };
      vi.mocked(mockWorkspace.getLeaf).mockReturnValue(mockLeaf);

      // Act
      await petView.handleDailyNoteButton();

      // Assert: Only opens note, no conversation
      expect(createDailyNote).not.toHaveBeenCalled();
      expect(mockLeaf.openFile).toHaveBeenCalledWith(existingNote);
      expect(Notice).not.toHaveBeenCalled();
    });

    it('should complete full flow: Invalid plugin → shows error', async () => {
      // Arrange: Plugin disabled
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(false);

      // Act
      await petView.handleDailyNoteButton();

      // Assert: Error shown, no further action
      expect(Notice).toHaveBeenCalledWith(
        'Daily Notes plugin is not enabled. Please enable it in Settings → Core Plugins.',
        8000
      );
      expect(createDailyNote).not.toHaveBeenCalled();
      expect(getDailyNote).not.toHaveBeenCalled();
    });

    it('should complete full flow: Invalid template → shows error', async () => {
      // Arrange: Valid plugin, invalid template
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(mockVault.getAbstractFileByPath).mockReturnValue(mockTFile);
      vi.mocked(mockVault.read).mockResolvedValue(TEMPLATE_NO_BLOCKS);

      // Act
      await petView.handleDailyNoteButton();

      // Assert: Error shown
      expect(Notice).toHaveBeenCalledWith(
        'Template has no vaultpal blocks. Add ```vaultpal blocks to your template.',
        8000
      );
      expect(createDailyNote).not.toHaveBeenCalled();
    });
  });

  describe('5. Edge Cases (5 tests)', () => {
    it('should return error when template file exists but is empty', async () => {
      // Arrange
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(mockVault.getAbstractFileByPath).mockReturnValue(mockTFile);
      vi.mocked(mockVault.read).mockResolvedValue(TEMPLATE_EMPTY);

      // Act
      const result = await petView.validatePrerequisites();

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Template has no vaultpal blocks');
    });

    it('should return error when template has only invalid vaultpal blocks', async () => {
      // Arrange
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(mockVault.getAbstractFileByPath).mockReturnValue(mockTFile);
      vi.mocked(mockVault.read).mockResolvedValue(TEMPLATE_INVALID_BLOCKS);

      // Act
      const result = await petView.validatePrerequisites();

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Template has no vaultpal blocks');
    });

    it('should show error when daily note creation fails', async () => {
      // Arrange
      vi.spyOn(petView, 'validatePrerequisites').mockResolvedValue({ valid: true });

      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(createDailyNote).mockRejectedValue(new Error('Failed to create note'));

      // Act
      await petView.handleDailyNoteButton();

      // Assert
      expect(Notice).toHaveBeenCalledWith(
        expect.stringContaining('Failed to open daily note'),
        8000
      );
    });

    it('should show error when workspace.getLeaf() returns null for existing note', async () => {
      // Arrange: Initialize view
      await petView.onOpen();

      vi.spyOn(petView, 'validatePrerequisites').mockResolvedValue({ valid: true });

      // Mock: Existing note (so it goes through open path, not create path)
      vi.mocked(getDailyNote).mockReturnValue(mockTFile);
      vi.mocked(getAllDailyNotes).mockReturnValue({});

      // Mock: getLeaf returns null
      vi.mocked(mockWorkspace.getLeaf).mockReturnValue(null);

      // Act
      await petView.handleDailyNoteButton();

      // Assert: Should show specific error message about workspace leaf
      expect(Notice).toHaveBeenCalledWith(
        'Failed to open daily note: Could not get workspace leaf',
        8000
      );
    });

    it('should handle multiple rapid button clicks gracefully', async () => {
      // Arrange: Initialize view
      await petView.onOpen();

      vi.spyOn(petView, 'validatePrerequisites').mockResolvedValue({ valid: true });

      const existingNote = { ...mockTFile };
      vi.mocked(getDailyNote).mockReturnValue(existingNote);
      vi.mocked(getAllDailyNotes).mockReturnValue({ '2026-02-07': existingNote });

      const mockLeaf = { openFile: vi.fn().mockResolvedValue(undefined) };
      vi.mocked(mockWorkspace.getLeaf).mockReturnValue(mockLeaf);

      // Act: Multiple rapid clicks
      await Promise.all([
        petView.handleDailyNoteButton(),
        petView.handleDailyNoteButton(),
        petView.handleDailyNoteButton(),
      ]);

      // Assert: Should not crash, may open multiple times
      expect(mockLeaf.openFile).toHaveBeenCalled();
      // Note: Exact call count depends on implementation (could be 3 or 1 with debouncing)
    });
  });
});
