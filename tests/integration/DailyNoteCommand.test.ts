/**
 * Integration tests for Daily Note Command
 * Tests command registration, execution, and interaction with PetView
 *
 * Test Coverage:
 * - Command registration with correct ID and name
 * - Command execution from Command Palette
 * - Command behavior with Pet View open/closed
 * - View action button integration
 * - Error handling when Daily Notes plugin disabled
 */

import { vi } from 'vitest';
import VaultPalPlugin from '../../src/main';
import { PetView, VIEW_TYPE_PET } from '../../src/views/PetView';
import type { WorkspaceLeaf, Command } from 'obsidian';

// Mock the obsidian-daily-notes-interface library
vi.mock('obsidian-daily-notes-interface', () => ({
  appHasDailyNotesPluginLoaded: vi.fn(),
  createDailyNote: vi.fn(),
  getDailyNote: vi.fn(),
  getAllDailyNotes: vi.fn(),
  getDailyNoteSettings: vi.fn(),
}));

// Mock Notice
vi.mock('obsidian', async () => {
  const actual = await vi.importActual<typeof import('../mocks/obsidian')>('../mocks/obsidian');
  return {
    ...actual,
    Notice: vi.fn(),
    Plugin: class Plugin {
      app: any;
      manifest: any;

      constructor() {
        this.app = {
          workspace: {
            detachLeavesOfType: vi.fn(),
            getLeavesOfType: vi.fn().mockReturnValue([]),
            getRightLeaf: vi.fn(),
            revealLeaf: vi.fn(),
          },
          plugins: {
            manifests: {
              'vault-pal': { dir: '.obsidian/plugins/vault-pal' },
            },
          },
          vault: {
            adapter: {
              getResourcePath: (path: string) => `app://local/${path}`,
            },
          },
        };
        this.manifest = {
          id: 'vault-pal',
          name: 'Vault Pal',
          version: '0.0.1',
        };
      }

      addCommand(command: Command): void {}
      addRibbonIcon(icon: string, title: string, callback: () => void): void {}
      registerView(type: string, viewCreator: (leaf: WorkspaceLeaf) => any): void {}
      registerMarkdownCodeBlockProcessor(language: string, handler: (source: string, el: HTMLElement, ctx: any) => void): void {}
      loadData(): Promise<any> { return Promise.resolve({}); }
      saveData(data: any): Promise<void> { return Promise.resolve(); }
    },
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

describe('Daily Note Command Integration', () => {
  let plugin: VaultPalPlugin;
  let registeredCommands: Command[];
  let mockAddCommand: any;
  let mockTFile: any;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();

    // Track registered commands
    registeredCommands = [];
    mockAddCommand = vi.fn((command: Command) => {
      registeredCommands.push(command);
    });

    // Create mock TFile
    mockTFile = {
      path: '2026-02-06.md',
      name: '2026-02-06.md',
      basename: '2026-02-06',
      extension: 'md',
    };

    // Create plugin instance
    plugin = new VaultPalPlugin();
    plugin.addCommand = mockAddCommand;

    // Setup workspace mocks
    plugin.app.workspace.getLeaf = vi.fn().mockReturnValue({
      openFile: vi.fn().mockResolvedValue(undefined),
    });

    // Load plugin
    await plugin.onload();
  });

  afterEach(() => {
    plugin.onunload();
    vi.restoreAllMocks();
  });

  describe('Command Registration', () => {
    it('should register open-daily-note command with correct ID', () => {
      // Assert: Command is registered
      const dailyNoteCommand = registeredCommands.find(
        (cmd) => cmd.id === 'open-daily-note'
      );
      expect(dailyNoteCommand).toBeDefined();
    });

    it('should register command with correct name', () => {
      // Assert: Command has user-friendly name (sentence case per Obsidian convention)
      const dailyNoteCommand = registeredCommands.find(
        (cmd) => cmd.id === 'open-daily-note'
      );
      expect(dailyNoteCommand?.name).toBe('Open today\'s daily note');
    });

    it('should register command with callback function', () => {
      // Assert: Command has a callback
      const dailyNoteCommand = registeredCommands.find(
        (cmd) => cmd.id === 'open-daily-note'
      );
      expect(typeof dailyNoteCommand?.callback).toBe('function');
    });

    it('should register command during plugin initialization', async () => {
      // Assert: Command was registered during onload
      expect(mockAddCommand).toHaveBeenCalled();
      const commandIds = registeredCommands.map((cmd) => cmd.id);
      expect(commandIds).toContain('open-daily-note');
    });
  });

  describe('Command Execution from Command Palette', () => {
    it('should be callable from Command Palette', async () => {
      // Arrange
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(createDailyNote).mockResolvedValue(mockTFile);

      const dailyNoteCommand = registeredCommands.find(
        (cmd) => cmd.id === 'open-daily-note'
      );

      // Act: Execute command as if from Command Palette
      await dailyNoteCommand?.callback?.();

      // Assert: Command executed without error
      expect(appHasDailyNotesPluginLoaded).toHaveBeenCalled();
    });

    it('should create daily note when executed from Command Palette', async () => {
      // Arrange
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(createDailyNote).mockResolvedValue(mockTFile);

      const dailyNoteCommand = registeredCommands.find(
        (cmd) => cmd.id === 'open-daily-note'
      );

      // Act
      await dailyNoteCommand?.callback?.();

      // Assert: createDailyNote was called
      expect(createDailyNote).toHaveBeenCalledTimes(1);
    });

    it('should open daily note in workspace when executed', async () => {
      // Arrange
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(createDailyNote).mockResolvedValue(mockTFile);

      const dailyNoteCommand = registeredCommands.find(
        (cmd) => cmd.id === 'open-daily-note'
      );

      // Act
      await dailyNoteCommand?.callback?.();

      // Assert: Note was opened in workspace
      expect(plugin.app.workspace.getLeaf).toHaveBeenCalled();
    });
  });

  describe('Command with Pet View Open', () => {
    let petView: PetView;
    let mockLeaf: WorkspaceLeaf;

    beforeEach(async () => {
      // Create and open Pet View
      mockLeaf = {
        view: null,
      } as WorkspaceLeaf;

      petView = new PetView(mockLeaf);
      mockLeaf.view = petView;

      // Mock workspace to return the active Pet View
      plugin.app.workspace.getLeavesOfType = vi.fn().mockReturnValue([mockLeaf]);

      await petView.onOpen();
    });

    afterEach(async () => {
      if (petView) {
        await petView.onClose();
      }
    });

    it('should execute command successfully when Pet View is open', async () => {
      // Arrange
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(createDailyNote).mockResolvedValue(mockTFile);

      const dailyNoteCommand = registeredCommands.find(
        (cmd) => cmd.id === 'open-daily-note'
      );

      // Act
      await dailyNoteCommand?.callback?.();

      // Assert: Command executed successfully
      expect(createDailyNote).toHaveBeenCalled();
      expect(Notice).not.toHaveBeenCalled();
    });

    it('should call PetView.openDailyNote() when Pet View is active', async () => {
      // Arrange
      const openDailyNoteSpy = vi.spyOn(petView, 'openDailyNote');
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(createDailyNote).mockResolvedValue(mockTFile);

      const dailyNoteCommand = registeredCommands.find(
        (cmd) => cmd.id === 'open-daily-note'
      );

      // Act
      await dailyNoteCommand?.callback?.();

      // Assert: PetView's method was called
      expect(openDailyNoteSpy).toHaveBeenCalledTimes(1);
    });

    it('should work with Pet View in any workspace location', async () => {
      // Arrange: Pet View could be in right sidebar, left sidebar, or main area
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(createDailyNote).mockResolvedValue(mockTFile);

      const dailyNoteCommand = registeredCommands.find(
        (cmd) => cmd.id === 'open-daily-note'
      );

      // Act
      await dailyNoteCommand?.callback?.();

      // Assert: Command works regardless of Pet View location
      expect(createDailyNote).toHaveBeenCalled();
    });
  });

  describe('Command with Pet View NOT Open', () => {
    it('should work when Pet View is not open (fallback behavior)', async () => {
      // Arrange: No Pet View is open
      plugin.app.workspace.getLeavesOfType = vi.fn().mockReturnValue([]);
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(createDailyNote).mockResolvedValue(mockTFile);

      const dailyNoteCommand = registeredCommands.find(
        (cmd) => cmd.id === 'open-daily-note'
      );

      // Act
      await dailyNoteCommand?.callback?.();

      // Assert: Command still works via fallback
      expect(createDailyNote).toHaveBeenCalled();
    });

    it('should create and open daily note even without Pet View', async () => {
      // Arrange: Pet View closed
      plugin.app.workspace.getLeavesOfType = vi.fn().mockReturnValue([]);
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(createDailyNote).mockResolvedValue(mockTFile);

      const dailyNoteCommand = registeredCommands.find(
        (cmd) => cmd.id === 'open-daily-note'
      );

      // Act
      await dailyNoteCommand?.callback?.();

      // Assert: Daily note operations still work
      expect(createDailyNote).toHaveBeenCalledTimes(1);
      expect(plugin.app.workspace.getLeaf).toHaveBeenCalled();
    });

    it('should not throw error when Pet View is closed', async () => {
      // Arrange
      plugin.app.workspace.getLeavesOfType = vi.fn().mockReturnValue([]);
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyNotes).mockReturnValue({});
      vi.mocked(getDailyNote).mockReturnValue(null);
      vi.mocked(createDailyNote).mockResolvedValue(mockTFile);

      const dailyNoteCommand = registeredCommands.find(
        (cmd) => cmd.id === 'open-daily-note'
      );

      // Act & Assert: Should not throw
      await expect(dailyNoteCommand?.callback?.()).resolves.not.toThrow();
    });
  });

  describe('Command Error Handling - Daily Notes Plugin Disabled', () => {
    it('should show error notice when Daily Notes plugin is disabled', async () => {
      // Arrange: Daily Notes plugin not loaded
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(false);

      const dailyNoteCommand = registeredCommands.find(
        (cmd) => cmd.id === 'open-daily-note'
      );

      // Act
      await dailyNoteCommand?.callback?.();

      // Assert: Error notice shown
      expect(Notice).toHaveBeenCalledWith(
        'Daily Notes plugin is not enabled. Please enable it in Settings → Core Plugins.'
      );
    });

    it('should not attempt to create note when plugin is disabled', async () => {
      // Arrange
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(false);

      const dailyNoteCommand = registeredCommands.find(
        (cmd) => cmd.id === 'open-daily-note'
      );

      // Act
      await dailyNoteCommand?.callback?.();

      // Assert: No note creation attempted
      expect(createDailyNote).not.toHaveBeenCalled();
      expect(getDailyNote).not.toHaveBeenCalled();
    });

    it('should fail gracefully when Daily Notes plugin is disabled', async () => {
      // Arrange
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(false);

      const dailyNoteCommand = registeredCommands.find(
        (cmd) => cmd.id === 'open-daily-note'
      );

      // Act & Assert: Should not throw
      await expect(dailyNoteCommand?.callback?.()).resolves.not.toThrow();
    });
  });

  describe('View Action Button Integration', () => {
    let petView: PetView;
    let mockLeaf: WorkspaceLeaf;
    let mockActionButtons: any[];

    beforeEach(async () => {
      // Track action buttons added to view
      mockActionButtons = [];

      // Create Pet View with mocked addAction
      mockLeaf = {
        view: null,
      } as WorkspaceLeaf;

      petView = new PetView(mockLeaf);
      mockLeaf.view = petView;

      // Mock addAction to track button creation
      petView.addAction = vi.fn((icon: string, title: string, callback: () => void) => {
        mockActionButtons.push({ icon, title, callback });
        return document.createElement('div');
      });

      await petView.onOpen();
    });

    afterEach(async () => {
      if (petView) {
        await petView.onClose();
      }
    });

    it('should add daily note button to view header after onOpen', () => {
      // Assert: addAction was called
      expect(petView.addAction).toHaveBeenCalled();
    });

    it('should add button with calendar-plus icon', () => {
      // Assert: Button has correct icon
      const dailyNoteButton = mockActionButtons.find(
        (btn) => btn.icon === 'calendar-plus'
      );
      expect(dailyNoteButton).toBeDefined();
    });

    it('should add button with correct tooltip text', () => {
      // Assert: Button has tooltip
      const dailyNoteButton = mockActionButtons.find(
        (btn) => btn.icon === 'calendar-plus'
      );
      expect(dailyNoteButton?.title).toBe('Daily Note');
    });

    it('should call handleDailyNoteButton when button is clicked', async () => {
      // Arrange
      const handleButtonSpy = vi.spyOn(petView, 'handleDailyNoteButton').mockResolvedValue();

      const dailyNoteButton = mockActionButtons.find(
        (btn) => btn.icon === 'calendar-plus'
      );

      // Act: Click the button
      await dailyNoteButton?.callback();

      // Assert: handleDailyNoteButton was called
      expect(handleButtonSpy).toHaveBeenCalledTimes(1);
    });

    it('should use handleDailyNoteButton for validation', () => {
      // Arrange
      const dailyNoteButton = mockActionButtons.find(
        (btn) => btn.icon === 'calendar-plus'
      );

      // Assert: Button uses handleDailyNoteButton (Issue #47 validation logic)
      // This is tested in detail in PetViewDailyNoteButton.test.ts
      expect(dailyNoteButton?.callback).toBeDefined();
      expect(typeof dailyNoteButton?.callback).toBe('function');
    });

    it('should show error notice if button clicked when plugin disabled', async () => {
      // Arrange
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(false);

      const dailyNoteButton = mockActionButtons.find(
        (btn) => btn.icon === 'calendar-plus'
      );

      // Act
      await dailyNoteButton?.callback();

      // Assert: Error shown (with 8 second duration from Issue #47)
      expect(Notice).toHaveBeenCalledWith(
        expect.stringContaining('Daily Notes plugin is not enabled'),
        8000
      );
    });

    it('should place button in top-right corner of view header', () => {
      // Assert: addAction creates button in header (Obsidian API behavior)
      // The button appears in the view's action bar
      expect(petView.addAction).toHaveBeenCalledWith(
        'calendar-plus',
        expect.any(String),
        expect.any(Function)
      );
    });
  });

  describe('Command and Button Consistency', () => {
    let petView: PetView;
    let mockLeaf: WorkspaceLeaf;
    let mockActionButtons: any[];

    beforeEach(async () => {
      mockActionButtons = [];
      mockLeaf = { view: null } as WorkspaceLeaf;
      petView = new PetView(mockLeaf);
      mockLeaf.view = petView;

      petView.addAction = vi.fn((icon: string, title: string, callback: () => void) => {
        mockActionButtons.push({ icon, title, callback });
        return document.createElement('div');
      });

      await petView.onOpen();
      plugin.app.workspace.getLeavesOfType = vi.fn().mockReturnValue([mockLeaf]);
    });

    afterEach(async () => {
      if (petView) {
        await petView.onClose();
      }
    });

    it('should have different names for command and button', () => {
      // Arrange
      const dailyNoteCommand = registeredCommands.find(
        (cmd) => cmd.id === 'open-daily-note'
      );
      const dailyNoteButton = mockActionButtons.find(
        (btn) => btn.icon === 'calendar-plus'
      );

      // Assert: Command has descriptive name (sentence case), button has shorter tooltip
      expect(dailyNoteCommand?.name).toBe('Open today\'s daily note');
      expect(dailyNoteButton?.title).toBe('Daily Note');
    });

    it('should execute different logic for command and button', () => {
      // Arrange
      const dailyNoteCommand = registeredCommands.find(
        (cmd) => cmd.id === 'open-daily-note'
      );
      const dailyNoteButton = mockActionButtons.find(
        (btn) => btn.icon === 'calendar-plus'
      );

      // Assert: Command uses openDailyNote, button uses handleDailyNoteButton
      // Command: Simple create/open (no validation)
      // Button: Validates prerequisites first (Issue #47)
      expect(dailyNoteCommand?.callback).toBeDefined();
      expect(dailyNoteButton?.callback).toBeDefined();

      // They are different functions
      expect(dailyNoteCommand?.callback).not.toBe(dailyNoteButton?.callback);
    });

    it('should show same error messages for command and button', async () => {
      // Arrange
      vi.mocked(appHasDailyNotesPluginLoaded).mockReturnValue(false);

      const dailyNoteCommand = registeredCommands.find(
        (cmd) => cmd.id === 'open-daily-note'
      );
      const dailyNoteButton = mockActionButtons.find(
        (btn) => btn.icon === 'calendar-plus'
      );

      // Act & Assert: Both show same error
      await dailyNoteCommand?.callback?.();
      const commandNoticeCall = vi.mocked(Notice).mock.calls[0][0];

      vi.clearAllMocks();

      await dailyNoteButton?.callback();
      const buttonNoticeCall = vi.mocked(Notice).mock.calls[0][0];

      expect(commandNoticeCall).toBe(buttonNoticeCall);
    });
  });

  describe('Command Lifecycle', () => {
    it('should register command only once during plugin load', () => {
      // Assert: Command registered exactly once
      const dailyNoteCommands = registeredCommands.filter(
        (cmd) => cmd.id === 'open-daily-note'
      );
      expect(dailyNoteCommands).toHaveLength(1);
    });

    it('should not unregister command when Pet View is closed', async () => {
      // Arrange
      const mockLeaf = { view: null } as WorkspaceLeaf;
      const petView = new PetView(mockLeaf);
      await petView.onOpen();

      const commandCountBefore = registeredCommands.filter(
        (cmd) => cmd.id === 'open-daily-note'
      ).length;

      // Act: Close Pet View
      await petView.onClose();

      const commandCountAfter = registeredCommands.filter(
        (cmd) => cmd.id === 'open-daily-note'
      ).length;

      // Assert: Command still registered
      expect(commandCountAfter).toBe(commandCountBefore);
    });

    it('should remain available after plugin reload', async () => {
      // Arrange: Unload and reload plugin
      plugin.onunload();

      // Reset tracking
      registeredCommands = [];
      plugin.addCommand = mockAddCommand;

      // Act: Reload
      await plugin.onload();

      // Assert: Command re-registered
      const dailyNoteCommand = registeredCommands.find(
        (cmd) => cmd.id === 'open-daily-note'
      );
      expect(dailyNoteCommand).toBeDefined();
    });
  });
});
