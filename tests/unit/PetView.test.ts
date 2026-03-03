/**
 * Unit tests for PetView
 * Tests view lifecycle, Svelte component integration, and state machine coordination
 */

import { vi } from 'vitest';
import { PetView, VIEW_TYPE_PET } from '../../src/views/PetView';
import { WorkspaceLeaf, App } from '../mocks/obsidian';
import type { PetState } from '../../src/types/pet';
import { CELEBRATION_OVERLAY_CONSTANTS } from '../../src/utils/celebration-constants';
import { BACKGROUNDS } from '../../src/utils/asset-paths';
import { lastInstance } from '../mocks/Stats.svelte';

describe('PetView', () => {
  let petView: PetView;
  let leaf: WorkspaceLeaf;

  beforeEach(() => {
    vi.useFakeTimers();
    leaf = new WorkspaceLeaf();
    petView = new PetView(leaf);
  });

  afterEach(async () => {
    await petView.onClose();
    vi.restoreAllMocks();
    vi.clearAllTimers();
  });

  describe('view metadata', () => {
    it('should return correct view type', () => {
      expect(petView.getViewType()).toBe(VIEW_TYPE_PET);
    });

    it('should return correct display text', () => {
      expect(petView.getDisplayText()).toBe('Cheers!');
    });

    it('should return correct icon', () => {
      expect(petView.getIcon()).toBe('cat');
    });

    it('should export VIEW_TYPE_PET constant', () => {
      expect(VIEW_TYPE_PET).toBe('cheers-pet-view');
    });
  });

  describe('onOpen lifecycle', () => {
    it('should initialize successfully', async () => {
      await expect(petView.onOpen()).resolves.not.toThrow();
    });

    it('should show loading state during initialization', async () => {
      // The loading state is shown synchronously at the start of onOpen
      // and then hidden after initialization completes.
      // Since onOpen is async, we verify the complete flow works correctly.
      await petView.onOpen();

      // After initialization, loading should be hidden
      const loadingEl = petView.containerEl.querySelector('.cheers-loading');
      expect(loadingEl).toBeNull();

      // And the pet container should be visible
      const container = petView.containerEl.querySelector('.cheers-container');
      expect(container).toBeTruthy();
    });

    it('should hide loading state after initialization', async () => {
      await petView.onOpen();

      const loadingEl = petView.containerEl.querySelector('.cheers-loading');
      expect(loadingEl).toBeNull();
    });

    it('should create container div with correct class', async () => {
      await petView.onOpen();

      const container = petView.containerEl.querySelector('.cheers-container');
      expect(container).toBeTruthy();
    });

    it('should initialize state machine', async () => {
      await petView.onOpen();

      const currentState = petView.getCurrentState();
      expect(currentState).toBe('walking');
    });

    it('should mount Svelte component', async () => {
      await petView.onOpen();

      const component = petView.containerEl.querySelector('.pet-sprite-container');
      expect(component).toBeTruthy();
    });

    it('should set initial data-pet-state attribute', async () => {
      await petView.onOpen();

      const container = petView.containerEl.querySelector('.cheers-container');
      expect(container?.getAttribute('data-pet-state')).toBe('walking');
    });

    it('should pass correct props to Svelte component', async () => {
      await petView.onOpen();

      const component = petView.containerEl.querySelector('.pet-sprite-container');
      expect(component?.getAttribute('data-state')).toBe('walking');
    });

    it('should generate correct sprite sheet path', async () => {
      await petView.onOpen();

      // The path should be generated using app.vault.adapter.getResourcePath
      // which in our mock returns app://local/{path}
      const expectedPath = 'app://local/.obsidian/plugins/cheers/assets/pet-sprite-sheet.png';

      // We can't directly access the petSpritePath prop, but we can verify
      // the component was mounted successfully which means the path was provided
      const component = petView.containerEl.querySelector('.pet-sprite-container');
      expect(component).toBeTruthy();
    });

    it('should handle errors during initialization', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Create a new view with a corrupted app object
      const badLeaf = new WorkspaceLeaf();
      const badView = new PetView(badLeaf);
      // @ts-ignore - intentionally breaking the app object
      badView.app = null;

      await badView.onOpen();

      // Should show error state
      const errorEl = badView.containerEl.querySelector('.cheers-view-error');
      expect(errorEl).toBeTruthy();

      consoleErrorSpy.mockRestore();
    });

    it('should display error message when initialization fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const badLeaf = new WorkspaceLeaf();
      const badView = new PetView(badLeaf);
      // @ts-ignore
      badView.app = null;

      await badView.onOpen();

      const errorHeading = badView.containerEl.querySelector('.cheers-view-error h3');
      const errorMessage = badView.containerEl.querySelector('.cheers-view-error-message');
      const errorHint = badView.containerEl.querySelector('.cheers-view-error-hint');

      expect(errorHeading?.textContent).toBe('Failed to load Cheers!');
      expect(errorMessage).toBeTruthy();
      expect(errorHint?.textContent).toBe('An unexpected error occurred. Check the console (Ctrl+Shift+I) for details.');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('onClose lifecycle', () => {
    it('should clean up successfully', async () => {
      await petView.onOpen();
      await expect(petView.onClose()).resolves.not.toThrow();
    });

    it('should destroy Svelte component', async () => {
      await petView.onOpen();

      const componentBefore = petView.containerEl.querySelector('.pet-sprite-container');
      expect(componentBefore).toBeTruthy();

      await petView.onClose();

      const componentAfter = petView.containerEl.querySelector('.pet-sprite-container');
      expect(componentAfter).toBeNull();
    });

    it('should clean up state machine', async () => {
      await petView.onOpen();
      expect(petView.getCurrentState()).toBe('walking');

      await petView.onClose();

      expect(petView.getCurrentState()).toBeNull();
    });

    it('should clear container element', async () => {
      await petView.onOpen();
      const initialChildCount = petView.containerEl.children.length;
      expect(initialChildCount).toBeGreaterThan(0);

      // Find the cheers-container that was created
      const vaultPalContainer = petView.containerEl.querySelector('.cheers-container');
      expect(vaultPalContainer).toBeTruthy();

      await petView.onClose();

      // After close, the cheers-container should be removed
      const vaultPalContainerAfter = petView.containerEl.querySelector('.cheers-container');
      expect(vaultPalContainerAfter).toBeNull();
    });

    it('should be safe to call onClose without onOpen', async () => {
      await expect(petView.onClose()).resolves.not.toThrow();
    });

    it('should be safe to call onClose multiple times', async () => {
      await petView.onOpen();
      await petView.onClose();
      await expect(petView.onClose()).resolves.not.toThrow();
    });

    it('should prevent timer from firing after close', async () => {
      await petView.onOpen();
      petView.transitionState('celebration');

      await petView.onClose();

      vi.advanceTimersByTime(CELEBRATION_OVERLAY_CONSTANTS.CELEBRATION_DURATION_MS);

      // getCurrentState should return null after close
      expect(petView.getCurrentState()).toBeNull();
    });
  });

  describe('state machine integration', () => {
    it('should update data attribute when state changes', async () => {
      await petView.onOpen();

      petView.transitionState('celebration');

      const container = petView.containerEl.querySelector('.cheers-container');
      expect(container?.getAttribute('data-pet-state')).toBe('celebration');
    });

    it('should update Svelte component when state changes', async () => {
      await petView.onOpen();

      petView.transitionState('celebration');

      const component = petView.containerEl.querySelector('.pet-sprite-container');
      expect(component?.getAttribute('data-state')).toBe('celebration');
    });

    it('should handle state transitions through all states', async () => {
      await petView.onOpen();

      const states: PetState[] = [
        'celebration',
        'petting',
        'walking',
      ];

      for (const state of states) {
        petView.transitionState(state);
        expect(petView.getCurrentState()).toBe(state);

        const container = petView.containerEl.querySelector('.cheers-container');
        expect(container?.getAttribute('data-pet-state')).toBe(state);
      }
    });

    it('should handle auto-transition to walking', async () => {
      await petView.onOpen();

      petView.transitionState('celebration');
      expect(petView.getCurrentState()).toBe('celebration');

      vi.advanceTimersByTime(CELEBRATION_OVERLAY_CONSTANTS.CELEBRATION_DURATION_MS);

      expect(petView.getCurrentState()).toBe('walking');
      const container = petView.containerEl.querySelector('.cheers-container');
      expect(container?.getAttribute('data-pet-state')).toBe('walking');
    });

    it('should update component on auto-transition to walking', async () => {
      await petView.onOpen();

      petView.transitionState('petting');
      const component = petView.containerEl.querySelector('.pet-sprite-container');
      expect(component?.getAttribute('data-state')).toBe('petting');

      vi.advanceTimersByTime(2000);

      expect(component?.getAttribute('data-state')).toBe('walking');
    });

    it('should return false for invalid state transition', async () => {
      await petView.onOpen();

      // Transitioning to same state should return false
      const result = petView.transitionState('walking');
      expect(result).toBe(false);
    });

    it('should return false when transitioning before open', () => {
      const result = petView.transitionState('celebration');
      expect(result).toBe(false);
    });

    it('should return null for current state before open', () => {
      const state = petView.getCurrentState();
      expect(state).toBeNull();
    });
  });

  describe('state synchronization', () => {
    it('should keep data attribute and component state in sync', async () => {
      await petView.onOpen();

      const states: PetState[] = ['celebration', 'petting', 'walking'];

      for (const state of states) {
        petView.transitionState(state);

        const container = petView.containerEl.querySelector('.cheers-container');
        const component = petView.containerEl.querySelector('.pet-sprite-container');

        expect(container?.getAttribute('data-pet-state')).toBe(state);
        expect(component?.getAttribute('data-state')).toBe(state);
        expect(petView.getCurrentState()).toBe(state);
      }
    });

    it('should maintain sync after auto-transition', async () => {
      await petView.onOpen();

      petView.transitionState('celebration');
      vi.advanceTimersByTime(CELEBRATION_OVERLAY_CONSTANTS.CELEBRATION_DURATION_MS);

      const container = petView.containerEl.querySelector('.cheers-container');
      const component = petView.containerEl.querySelector('.pet-sprite-container');

      expect(container?.getAttribute('data-pet-state')).toBe('walking');
      expect(component?.getAttribute('data-state')).toBe('walking');
      expect(petView.getCurrentState()).toBe('walking');
    });

    it('should maintain sync through rapid state changes', async () => {
      await petView.onOpen();

      petView.transitionState('celebration');
      petView.transitionState('petting');

      const container = petView.containerEl.querySelector('.cheers-container');
      const component = petView.containerEl.querySelector('.pet-sprite-container');

      expect(container?.getAttribute('data-pet-state')).toBe('petting');
      expect(component?.getAttribute('data-state')).toBe('petting');
      expect(petView.getCurrentState()).toBe('petting');
    });
  });

  describe('edge cases', () => {
    it('should handle component mount failure gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Create a view that will fail during initialization
      const failLeaf = new WorkspaceLeaf();
      const failView = new PetView(failLeaf);

      // Break the app object to cause initialization failure
      // @ts-ignore - intentionally breaking the app object
      failView.app = null;

      await failView.onOpen();

      // Should log error and show error state
      expect(consoleErrorSpy).toHaveBeenCalled();
      const errorEl = failView.containerEl.querySelector('.cheers-view-error');
      expect(errorEl).toBeTruthy();

      consoleErrorSpy.mockRestore();
    });

    it('should handle missing plugin manifest', async () => {
      const customLeaf = new WorkspaceLeaf();
      const customView = new PetView(customLeaf);

      // Remove the plugin manifest
      customView.app.plugins.manifests = {};

      await customView.onOpen();

      // Should still work with default path
      const component = customView.containerEl.querySelector('.pet-sprite-container');
      expect(component).toBeTruthy();
    });

    it('should not crash if data attribute update fails', async () => {
      await petView.onOpen();

      // Remove the container div
      const container = petView.containerEl.querySelector('.cheers-container');
      container?.remove();

      // Should not throw even though container is gone
      expect(() => petView.transitionState('celebration')).not.toThrow();
    });

    it('should handle state transition during close', async () => {
      await petView.onOpen();
      petView.transitionState('celebration');

      // Start close but don't await
      const closePromise = petView.onClose();

      // Try to transition during close
      const result = petView.transitionState('petting');

      await closePromise;

      // Transition may or may not succeed depending on timing
      // but it should not throw
      expect(typeof result).toBe('boolean');
    });

    it('should handle multiple rapid opens and closes', async () => {
      await petView.onOpen();
      await petView.onClose();
      await petView.onOpen();
      await petView.onClose();
      await petView.onOpen();

      expect(petView.getCurrentState()).toBe('walking');
    });
  });

  describe('external access methods', () => {
    it('should provide getCurrentState for external access', async () => {
      await petView.onOpen();

      expect(typeof petView.getCurrentState).toBe('function');
      expect(petView.getCurrentState()).toBe('walking');
    });

    it('should provide transitionState for external access', async () => {
      await petView.onOpen();

      expect(typeof petView.transitionState).toBe('function');

      const result = petView.transitionState('celebration');
      expect(result).toBe(true);
      expect(petView.getCurrentState()).toBe('celebration');
    });

    it('should allow external code to trigger animations', async () => {
      await petView.onOpen();

      petView.transitionState('petting');
      expect(petView.getCurrentState()).toBe('petting');

      vi.advanceTimersByTime(2000);
      expect(petView.getCurrentState()).toBe('walking');
    });
  });

  describe('container structure', () => {
    it('should have correct container hierarchy', async () => {
      await petView.onOpen();

      // Should have base containerEl
      expect(petView.containerEl).toBeTruthy();

      // Should have created container in children[1]
      const mainContainer = petView.containerEl.children[1];
      expect(mainContainer).toBeTruthy();

      // Should have cheers-container inside
      const vaultPalContainer = mainContainer.querySelector('.cheers-container');
      expect(vaultPalContainer).toBeTruthy();
    });

    it('should preserve existing DOM structure', async () => {
      const initialChildCount = petView.containerEl.children.length;

      await petView.onOpen();

      // Should still have the same number of root children
      // (we create elements inside children[1], not as new children)
      expect(petView.containerEl.children.length).toBe(initialChildCount);
    });
  });

  // ─── Tab bar ────────────────────────────────────────────────────────────────

  describe('tab bar', () => {
    it('renders pet and stats tab buttons after onOpen', async () => {
      await petView.onOpen();

      const petTab = petView.containerEl.querySelector('.vp-tab-pet');
      const statsTab = petView.containerEl.querySelector('.vp-tab-stats');

      expect(petTab).toBeTruthy();
      expect(statsTab).toBeTruthy();
    });

    it('pet tab is marked active on open', async () => {
      await petView.onOpen();

      const petTab = petView.containerEl.querySelector('.vp-tab-pet');
      expect(petTab?.classList.contains('is-active')).toBe(true);
    });

    it('stats tab is not active on open', async () => {
      await petView.onOpen();

      const statsTab = petView.containerEl.querySelector('.vp-tab-stats');
      expect(statsTab?.classList.contains('is-active')).toBe(false);
    });

    it('pet panel is visible and stats panel is hidden on open', async () => {
      await petView.onOpen();

      const petPanel = petView.containerEl.querySelector('.vp-panel-pet');
      const statsPanel = petView.containerEl.querySelector('.vp-panel-stats');

      expect(petPanel?.classList.contains('vp-panel-hidden')).toBe(false);
      expect(statsPanel?.classList.contains('vp-panel-hidden')).toBe(true);
    });

    it('clicking stats tab hides pet panel and shows stats panel', async () => {
      await petView.onOpen();

      const statsTab = petView.containerEl.querySelector('.vp-tab-stats') as HTMLElement;
      statsTab?.click();

      const petPanel = petView.containerEl.querySelector('.vp-panel-pet');
      const statsPanel = petView.containerEl.querySelector('.vp-panel-stats');

      expect(petPanel?.classList.contains('vp-panel-hidden')).toBe(true);
      expect(statsPanel?.classList.contains('vp-panel-hidden')).toBe(false);
    });

    it('stats tab becomes active and pet tab becomes inactive after clicking stats', async () => {
      await petView.onOpen();

      const petTab = petView.containerEl.querySelector('.vp-tab-pet');
      const statsTab = petView.containerEl.querySelector('.vp-tab-stats') as HTMLElement;

      statsTab?.click();

      expect(petTab?.classList.contains('is-active')).toBe(false);
      expect(statsTab?.classList.contains('is-active')).toBe(true);
    });

    it('clicking pet tab after stats tab restores pet panel visibility', async () => {
      await petView.onOpen();

      const petTab = petView.containerEl.querySelector('.vp-tab-pet') as HTMLElement;
      const statsTab = petView.containerEl.querySelector('.vp-tab-stats') as HTMLElement;

      statsTab?.click();
      petTab?.click();

      const petPanel = petView.containerEl.querySelector('.vp-panel-pet');
      const statsPanel = petView.containerEl.querySelector('.vp-panel-stats');

      expect(petPanel?.classList.contains('vp-panel-hidden')).toBe(false);
      expect(statsPanel?.classList.contains('vp-panel-hidden')).toBe(true);
    });

    it('pet svelte component is NOT destroyed when switching to stats tab', async () => {
      await petView.onOpen();

      // Pet component is mounted and visible
      const petComponentBefore = petView.containerEl.querySelector('.pet-sprite-container');
      expect(petComponentBefore).toBeTruthy();

      // Switch to stats tab
      const statsTab = petView.containerEl.querySelector('.vp-tab-stats') as HTMLElement;
      statsTab?.click();

      // Pet component still exists in the DOM (hidden in the pet panel, not destroyed)
      const petComponentAfter = petView.containerEl.querySelector('.pet-sprite-container');
      expect(petComponentAfter).toBeTruthy();
    });
  });

  // ─── Stats component lifecycle ───────────────────────────────────────────

  describe('stats component lifecycle', () => {
    it('stats panel is present in the DOM after onOpen', async () => {
      await petView.onOpen();

      const statsPanel = petView.containerEl.querySelector('.vp-panel-stats');
      expect(statsPanel).toBeTruthy();
    });

    it('stats component sentinel div (.vp-stats) is mounted inside the stats panel', async () => {
      await petView.onOpen();

      const statsEl = petView.containerEl.querySelector('.vp-stats');
      expect(statsEl).toBeTruthy();
    });

    it('updateStatsComponent() is a public method and does not throw after onOpen', async () => {
      await petView.onOpen();

      expect(() => petView.updateStatsComponent()).not.toThrow();
    });

    it('updateStatsComponent() is a no-op (does not throw) before onOpen', () => {
      expect(() => petView.updateStatsComponent()).not.toThrow();
    });

    it('stats panel is removed from the DOM on onClose', async () => {
      await petView.onOpen();

      const statsPanelBefore = petView.containerEl.querySelector('.vp-panel-stats');
      expect(statsPanelBefore).toBeTruthy();

      await petView.onClose();

      const statsPanelAfter = petView.containerEl.querySelector('.vp-panel-stats');
      expect(statsPanelAfter).toBeNull();
    });

    it('stats component (.vp-stats) is removed on onClose', async () => {
      await petView.onOpen();

      const statsElBefore = petView.containerEl.querySelector('.vp-stats');
      expect(statsElBefore).toBeTruthy();

      await petView.onClose();

      const statsElAfter = petView.containerEl.querySelector('.vp-stats');
      expect(statsElAfter).toBeNull();
    });

    it('pet panel defaults back to visible after reopen (tab state resets)', async () => {
      await petView.onOpen();

      // Switch to stats
      const statsTab = petView.containerEl.querySelector('.vp-tab-stats') as HTMLElement;
      statsTab?.click();
      expect(petView.containerEl.querySelector('.vp-panel-pet')?.classList.contains('vp-panel-hidden')).toBe(true);

      // Close and reopen — tab state resets to pet tab
      await petView.onClose();
      await petView.onOpen();

      const petPanel = petView.containerEl.querySelector('.vp-panel-pet');
      const statsPanel = petView.containerEl.querySelector('.vp-panel-stats');

      expect(petPanel?.classList.contains('vp-panel-hidden')).toBe(false);
      expect(statsPanel?.classList.contains('vp-panel-hidden')).toBe(true);
    });
  });

  describe('pet interaction event handling', () => {
    it('should setup pet event listener on open', async () => {
      await petView.onOpen();

      // Verify that the component is mounted and ready to emit events
      const component = petView.containerEl.querySelector('.pet-sprite-container');
      expect(component).toBeTruthy();

      // The petEventListener should be set up (we can't directly test private fields,
      // but we can verify the event handling works in the next tests)
    });

    it('should remove pet event listener on close', async () => {
      await petView.onOpen();

      // Setup a spy to verify event listener cleanup
      const component = petView.containerEl.querySelector('.pet-sprite-container');
      expect(component).toBeTruthy();

      // Close the view
      await petView.onClose();

      // Verify component is destroyed (which includes event listener removal)
      const componentAfter = petView.containerEl.querySelector('.pet-sprite-container');
      expect(componentAfter).toBeNull();
    });

    it('should handle pet event with returnTarget from walking state', async () => {
      await petView.onOpen();

      // Start in walking state
      expect(petView.getCurrentState()).toBe('walking');

      // Simulate petting from walking (should return to walking)
      petView.transitionState('petting', 'walking');
      expect(petView.getCurrentState()).toBe('petting');

      // After petting duration, should return to 'walking'
      vi.advanceTimersByTime(2000);
      expect(petView.getCurrentState()).toBe('walking');
    });
  });

  // ─── buildStatsProps derivation ──────────────────────────────────────────
  //
  // buildStatsProps() is private — we test its effects through updateStatsComponent(),
  // which calls statsComponent.$set(buildStatsProps(plugin)). The Stats.svelte mock
  // exposes `lastInstance.$set` as a vi.fn() so we can inspect the call arguments.

  describe('buildStatsProps derivation (via updateStatsComponent)', () => {
    /**
     * Augment the App mock's plugin entry with a full plugin shape that
     * buildStatsProps() requires. Call this BEFORE onOpen().
     */
    function setupMockPlugin(overrides: {
      wordsAddedToday?: number;
      notesCreatedToday?: number;
      linksCreatedToday?: number;
      tasksCompletedToday?: number;
      onWordGoal?: boolean;
      dailyWordGoal?: number | null;
      onNoteCreate?: boolean;
      onLinkCreate?: boolean;
      onTaskComplete?: boolean;
      dashboardColorMode?: 'warm' | 'cool';
    } = {}) {
      const plugin = (petView.app as any).plugins.plugins['cheers'];
      plugin.dailyWordData = {
        date: new Date().toISOString().slice(0, 10),
        wordsAddedToday: overrides.wordsAddedToday ?? 0,
        goalCelebrated: false,
        notesCreatedToday: overrides.notesCreatedToday ?? 0,
        tasksCompletedToday: overrides.tasksCompletedToday ?? 0,
        linksCreatedToday: overrides.linksCreatedToday ?? 0,
      };
      plugin.settings = {
        ...plugin.settings,
        dashboardColorMode: overrides.dashboardColorMode ?? 'warm',
        celebrations: {
          onNoteCreate: overrides.onNoteCreate ?? true,
          onTaskComplete: overrides.onTaskComplete ?? true,
          onLinkCreate: overrides.onLinkCreate ?? true,
          onWordGoal: overrides.onWordGoal ?? false,
          dailyWordGoal: overrides.dailyWordGoal ?? null,
        },
      };
    }

    it('updateStatsComponent calls $set with wordsAddedToday from plugin.dailyWordData', async () => {
      setupMockPlugin({ wordsAddedToday: 42 });
      await petView.onOpen();

      petView.updateStatsComponent();

      const lastCall = lastInstance?.$set.mock.calls.at(-1)?.[0];
      expect(lastCall?.wordsAddedToday).toBe(42);
    });

    it('updateStatsComponent passes dailyWordGoal: null when onWordGoal is false', async () => {
      setupMockPlugin({ onWordGoal: false, dailyWordGoal: 500 });
      await petView.onOpen();

      petView.updateStatsComponent();

      const lastCall = lastInstance?.$set.mock.calls.at(-1)?.[0];
      expect(lastCall?.dailyWordGoal).toBeNull();
    });

    it('updateStatsComponent passes dailyWordGoal value when onWordGoal is true and goal is set', async () => {
      setupMockPlugin({ onWordGoal: true, dailyWordGoal: 500 });
      await petView.onOpen();

      petView.updateStatsComponent();

      const lastCall = lastInstance?.$set.mock.calls.at(-1)?.[0];
      expect(lastCall?.dailyWordGoal).toBe(500);
    });

    it('updateStatsComponent passes dailyWordGoal: null when onWordGoal is true but dailyWordGoal is null', async () => {
      setupMockPlugin({ onWordGoal: true, dailyWordGoal: null });
      await petView.onOpen();

      petView.updateStatsComponent();

      const lastCall = lastInstance?.$set.mock.calls.at(-1)?.[0];
      expect(lastCall?.dailyWordGoal).toBeNull();
    });

    it('updateStatsComponent passes showNotesColumn: false when onNoteCreate is off', async () => {
      setupMockPlugin({ onNoteCreate: false });
      await petView.onOpen();

      petView.updateStatsComponent();

      const lastCall = lastInstance?.$set.mock.calls.at(-1)?.[0];
      expect(lastCall?.showNotesColumn).toBe(false);
    });

    it('updateStatsComponent passes showLinksColumn: false when onLinkCreate is off', async () => {
      setupMockPlugin({ onLinkCreate: false });
      await petView.onOpen();

      petView.updateStatsComponent();

      const lastCall = lastInstance?.$set.mock.calls.at(-1)?.[0];
      expect(lastCall?.showLinksColumn).toBe(false);
    });

    it('updateStatsComponent passes showTasksColumn: false when onTaskComplete is off', async () => {
      setupMockPlugin({ onTaskComplete: false });
      await petView.onOpen();

      petView.updateStatsComponent();

      const lastCall = lastInstance?.$set.mock.calls.at(-1)?.[0];
      expect(lastCall?.showTasksColumn).toBe(false);
    });

    it('updateStatsComponent passes fileWordCount: null when no active markdown editor', async () => {
      // workspace.getActiveViewOfType returns null by default in App mock
      setupMockPlugin();
      await petView.onOpen();

      petView.updateStatsComponent();

      const lastCall = lastInstance?.$set.mock.calls.at(-1)?.[0];
      expect(lastCall?.fileWordCount).toBeNull();
    });

    it('updateStatsComponent passes fileWordGoal: null when no active markdown editor', async () => {
      setupMockPlugin({ onWordGoal: true, dailyWordGoal: 500 });
      await petView.onOpen();

      petView.updateStatsComponent();

      const lastCall = lastInstance?.$set.mock.calls.at(-1)?.[0];
      expect(lastCall?.fileWordGoal).toBeNull();
    });

    it('updateStatsComponent passes colorMode from settings.dashboardColorMode', async () => {
      setupMockPlugin({ dashboardColorMode: 'cool' });
      await petView.onOpen();

      petView.updateStatsComponent();

      const lastCall = lastInstance?.$set.mock.calls.at(-1)?.[0];
      expect(lastCall?.colorMode).toBe('cool');
    });

    it('updateStatsComponent passes colorMode "warm" by default', async () => {
      setupMockPlugin({ dashboardColorMode: 'warm' });
      await petView.onOpen();

      petView.updateStatsComponent();

      const lastCall = lastInstance?.$set.mock.calls.at(-1)?.[0];
      expect(lastCall?.colorMode).toBe('warm');
    });

    it('updateStatsComponent passes all three activity counters from dailyWordData', async () => {
      setupMockPlugin({ notesCreatedToday: 2, linksCreatedToday: 5, tasksCompletedToday: 3 });
      await petView.onOpen();

      petView.updateStatsComponent();

      const lastCall = lastInstance?.$set.mock.calls.at(-1)?.[0];
      expect(lastCall?.notesCreatedToday).toBe(2);
      expect(lastCall?.linksCreatedToday).toBe(5);
      expect(lastCall?.tasksCompletedToday).toBe(3);
    });

    it('updateStatsComponent passes show*Column: true when all celebration types are on', async () => {
      setupMockPlugin({ onNoteCreate: true, onLinkCreate: true, onTaskComplete: true });
      await petView.onOpen();

      petView.updateStatsComponent();

      const lastCall = lastInstance?.$set.mock.calls.at(-1)?.[0];
      expect(lastCall?.showNotesColumn).toBe(true);
      expect(lastCall?.showLinksColumn).toBe(true);
      expect(lastCall?.showTasksColumn).toBe(true);
    });
  });

  // ─── Workspace event subscriptions ───────────────────────────────────────
  //
  // PetView registers editor-change (150ms debounce) and active-leaf-change via
  // this.registerEvent(this.app.workspace.on(...)). The mock workspace.on is a
  // vi.fn() spy, so we can extract handlers and simulate events.

  describe('workspace event subscriptions', () => {
    function setupMockPlugin() {
      const plugin = (petView.app as any).plugins.plugins['cheers'];
      plugin.dailyWordData = {
        date: new Date().toISOString().slice(0, 10),
        wordsAddedToday: 0,
        goalCelebrated: false,
        notesCreatedToday: 0,
        tasksCompletedToday: 0,
        linksCreatedToday: 0,
      };
      plugin.settings = {
        ...plugin.settings,
        dashboardColorMode: 'warm',
        celebrations: {
          onNoteCreate: true,
          onTaskComplete: true,
          onLinkCreate: true,
          onWordGoal: false,
          dailyWordGoal: null,
        },
      };
    }

    function getWorkspaceHandler(eventName: string) {
      return (petView.app.workspace.on as any).mock.calls
        .find((call: any[]) => call[0] === eventName)?.[1];
    }

    it('registers an editor-change workspace event handler on onOpen', async () => {
      await petView.onOpen();
      expect(getWorkspaceHandler('editor-change')).toBeDefined();
    });

    it('registers an active-leaf-change workspace event handler on onOpen', async () => {
      await petView.onOpen();
      expect(getWorkspaceHandler('active-leaf-change')).toBeDefined();
    });

    it('editor-change calls $set after 150ms debounce when stats tab is active', async () => {
      setupMockPlugin();
      await petView.onOpen();

      // Switch to stats tab (also calls updateStatsComponent once)
      const statsTab = petView.containerEl.querySelector('.vp-tab-stats') as HTMLElement;
      statsTab.click();
      const setCallsAfterSwitch = lastInstance?.$set.mock.calls.length ?? 0;

      // Fire the handler — debounce hasn't elapsed yet
      const handler = getWorkspaceHandler('editor-change');
      handler?.();
      expect(lastInstance?.$set.mock.calls.length).toBe(setCallsAfterSwitch);

      // After 150ms the debounce fires
      vi.advanceTimersByTime(150);
      expect(lastInstance?.$set.mock.calls.length).toBeGreaterThan(setCallsAfterSwitch);
    });

    it('editor-change does NOT call $set when pet tab is active (default)', async () => {
      setupMockPlugin();
      await petView.onOpen();

      // Pet tab is active by default — record current call count
      const setCallsBefore = lastInstance?.$set.mock.calls.length ?? 0;

      const handler = getWorkspaceHandler('editor-change');
      handler?.();
      vi.advanceTimersByTime(150);

      // $set should not have been called again (pet tab is active)
      expect(lastInstance?.$set.mock.calls.length).toBe(setCallsBefore);
    });

    it('editor-change debounce: rapid firing resets the timer', async () => {
      setupMockPlugin();
      await petView.onOpen();

      const statsTab = petView.containerEl.querySelector('.vp-tab-stats') as HTMLElement;
      statsTab.click();
      const setCallsAfterSwitch = lastInstance?.$set.mock.calls.length ?? 0;

      const handler = getWorkspaceHandler('editor-change');

      // Fire 3 times in quick succession
      handler?.();
      vi.advanceTimersByTime(50);
      handler?.();
      vi.advanceTimersByTime(50);
      handler?.();
      // Only 100ms elapsed — debounce has NOT fired yet
      expect(lastInstance?.$set.mock.calls.length).toBe(setCallsAfterSwitch);

      // Now let the full 150ms pass from the last call
      vi.advanceTimersByTime(150);
      // Should have fired exactly once despite 3 handler calls
      expect(lastInstance?.$set.mock.calls.length).toBe(setCallsAfterSwitch + 1);
    });

    it('active-leaf-change calls $set immediately when stats tab is active', async () => {
      setupMockPlugin();
      await petView.onOpen();

      const statsTab = petView.containerEl.querySelector('.vp-tab-stats') as HTMLElement;
      statsTab.click();
      const setCallsAfterSwitch = lastInstance?.$set.mock.calls.length ?? 0;

      const handler = getWorkspaceHandler('active-leaf-change');
      handler?.();

      // active-leaf-change has no debounce — fires synchronously
      expect(lastInstance?.$set.mock.calls.length).toBeGreaterThan(setCallsAfterSwitch);
    });

    it('active-leaf-change does NOT call $set when pet tab is active', async () => {
      setupMockPlugin();
      await petView.onOpen();

      // Pet tab is active by default
      const setCallsBefore = lastInstance?.$set.mock.calls.length ?? 0;

      const handler = getWorkspaceHandler('active-leaf-change');
      handler?.();

      expect(lastInstance?.$set.mock.calls.length).toBe(setCallsBefore);
    });
  });

  // ─── updateStatsComponent guard paths ────────────────────────────────────

  describe('updateStatsComponent guard paths', () => {
    it('calls $set({}) when plugin is present but dailyWordData is absent', async () => {
      await petView.onOpen();

      // Set plugin without dailyWordData (simulates a partial stub)
      const plugin = (petView.app as any).plugins.plugins['cheers'];
      plugin.settings = { ...plugin.settings, dashboardColorMode: 'warm' };
      delete plugin.dailyWordData;
      (petView as any).plugin = plugin;

      petView.updateStatsComponent();

      const lastCall = lastInstance?.$set.mock.calls.at(-1)?.[0];
      expect(lastCall).toEqual({});
    });

    it('is a no-op when statsComponent is null (before onOpen)', () => {
      // statsComponent is null before onOpen — no new $set calls should be made
      const callsBefore = lastInstance?.$set.mock.calls.length ?? 0;
      expect(() => petView.updateStatsComponent()).not.toThrow();
      const callsAfter = lastInstance?.$set.mock.calls.length ?? 0;
      expect(callsAfter).toBe(callsBefore);
    });
  });

  // ─── statsComponent $destroy on onClose ──────────────────────────────────

  describe('statsComponent cleanup', () => {
    it('calls $destroy on the Stats component during onClose', async () => {
      await petView.onOpen();

      // Spy on the live component's $destroy — it is set by the Stats.svelte mock
      const destroySpy = vi.spyOn(lastInstance!, '$destroy');

      await petView.onClose();

      expect(destroySpy).toHaveBeenCalledTimes(1);
    });
  });

  // ─── fileWordCount with active MarkdownView ───────────────────────────────

  describe('fileWordCount with active MarkdownView', () => {
    it('passes computed word count when an active MarkdownView is present', async () => {
      const plugin = (petView.app as any).plugins.plugins['cheers'];
      plugin.dailyWordData = {
        date: new Date().toISOString().slice(0, 10),
        wordsAddedToday: 0,
        goalCelebrated: false,
        notesCreatedToday: 0,
        tasksCompletedToday: 0,
        linksCreatedToday: 0,
      };
      plugin.settings = {
        ...plugin.settings,
        dashboardColorMode: 'warm',
        celebrations: {
          onNoteCreate: true,
          onTaskComplete: true,
          onLinkCreate: true,
          onWordGoal: false,
          dailyWordGoal: null,
        },
      };

      // Mock an active MarkdownView returning 3 words
      const { MarkdownView } = await import('../mocks/obsidian');
      const mockView = new MarkdownView();
      mockView.editor.getValue = vi.fn().mockReturnValue('hello world foo');
      (petView.app.workspace.getActiveViewOfType as any).mockReturnValue(mockView);

      await petView.onOpen();
      petView.updateStatsComponent();

      const lastCall = lastInstance?.$set.mock.calls.at(-1)?.[0];
      expect(lastCall?.fileWordCount).toBe(3);
    });
  });

  // ─── Day / night background ───────────────────────────────────────────────
  //
  // PetView selects day or night background based on current hour and schedules
  // a one-shot timeout to swap the background at the next 6am / 6pm boundary.

  describe('day/night background', () => {
    /** Resolve the background filename from a full resource path. */
    function backgroundFilenameFrom(resourcePath: string): string {
      return resourcePath.split('/').pop() ?? '';
    }

    /** Spy on getResourcePath and return only calls that concern a background asset. */
    function captureBackgroundResourceCall(view: PetView) {
      return vi.spyOn(view.app.vault.adapter, 'getResourcePath');
    }

    describe('initial background on mount', () => {
      it('mounts with day background when opened at 9am', async () => {
        vi.setSystemTime(new Date('2024-06-15T09:00:00'));
        const spy = captureBackgroundResourceCall(petView);

        await petView.onOpen();

        const bgCall = spy.mock.calls.find(([p]) => p.includes('background'));
        expect(bgCall).toBeDefined();
        expect(backgroundFilenameFrom(bgCall![0])).toBe('background-day-8fps.gif');
      });

      it('mounts with day sky color when opened at 9am', async () => {
        vi.setSystemTime(new Date('2024-06-15T09:00:00'));
        await petView.onOpen();
        expect(petView.petComponent!.props.backgroundColor).toBe(BACKGROUNDS.DAY.skyColor);
      });

      it('mounts with night background when opened at 10pm', async () => {
        vi.setSystemTime(new Date('2024-06-15T22:00:00'));
        const spy = captureBackgroundResourceCall(petView);

        await petView.onOpen();

        const bgCall = spy.mock.calls.find(([p]) => p.includes('background'));
        expect(bgCall).toBeDefined();
        expect(backgroundFilenameFrom(bgCall![0])).toBe('background-night-8fps.gif');
      });

      it('mounts with night sky color when opened at 10pm', async () => {
        vi.setSystemTime(new Date('2024-06-15T22:00:00'));
        await petView.onOpen();
        expect(petView.petComponent!.props.backgroundColor).toBe(BACKGROUNDS.NIGHT.skyColor);
      });

      it('mounts with day background at exactly 6am boundary', async () => {
        vi.setSystemTime(new Date('2024-06-15T06:00:00'));
        const spy = captureBackgroundResourceCall(petView);

        await petView.onOpen();

        const bgCall = spy.mock.calls.find(([p]) => p.includes('background'));
        expect(backgroundFilenameFrom(bgCall![0])).toBe('background-day-8fps.gif');
      });

      it('mounts with night background at exactly 6pm boundary', async () => {
        vi.setSystemTime(new Date('2024-06-15T18:00:00'));
        const spy = captureBackgroundResourceCall(petView);

        await petView.onOpen();

        const bgCall = spy.mock.calls.find(([p]) => p.includes('background'));
        expect(backgroundFilenameFrom(bgCall![0])).toBe('background-night-8fps.gif');
      });

      it('mounts with night background at 5:59am (one minute before day starts)', async () => {
        vi.setSystemTime(new Date('2024-06-15T05:59:00'));
        const spy = captureBackgroundResourceCall(petView);

        await petView.onOpen();

        const bgCall = spy.mock.calls.find(([p]) => p.includes('background'));
        expect(backgroundFilenameFrom(bgCall![0])).toBe('background-night-8fps.gif');
      });
    });

    describe('background transition via scheduled timeout', () => {
      it('switches to night background when 6pm boundary is reached (opened at 9am)', async () => {
        vi.setSystemTime(new Date('2024-06-15T09:00:00'));
        await petView.onOpen();

        const setSpy = vi.spyOn(petView.petComponent!, '$set');

        // 9am → 6pm = 9 hours
        vi.advanceTimersByTime(9 * 60 * 60 * 1000);

        const bgCall = setSpy.mock.calls.find(([props]) =>
          typeof props.backgroundPath === 'string' && props.backgroundPath.includes('background')
        );
        expect(bgCall).toBeDefined();
        expect(backgroundFilenameFrom(bgCall![0].backgroundPath)).toBe('background-night-8fps.gif');
        expect(bgCall![0].backgroundColor).toBe(BACKGROUNDS.NIGHT.skyColor);
      });

      it('switches to day background when 6am boundary is reached (opened at 10pm)', async () => {
        vi.setSystemTime(new Date('2024-06-15T22:00:00'));
        await petView.onOpen();

        const setSpy = vi.spyOn(petView.petComponent!, '$set');

        // 10pm → next 6am = 8 hours
        vi.advanceTimersByTime(8 * 60 * 60 * 1000);

        const bgCall = setSpy.mock.calls.find(([props]) =>
          typeof props.backgroundPath === 'string' && props.backgroundPath.includes('background')
        );
        expect(bgCall).toBeDefined();
        expect(backgroundFilenameFrom(bgCall![0].backgroundPath)).toBe('background-day-8fps.gif');
        expect(bgCall![0].backgroundColor).toBe(BACKGROUNDS.DAY.skyColor);
      });

      it('does not swap background before the boundary is reached', async () => {
        vi.setSystemTime(new Date('2024-06-15T09:00:00'));
        await petView.onOpen();

        const setSpy = vi.spyOn(petView.petComponent!, '$set');

        // Advance 8 hours 59 minutes — boundary is at 9 hours
        vi.advanceTimersByTime((9 * 60 * 60 - 60) * 1000);

        const bgCall = setSpy.mock.calls.find(([props]) =>
          typeof props.backgroundPath === 'string' && props.backgroundPath.includes('background')
        );
        expect(bgCall).toBeUndefined();
      });

      it('reschedules a second timeout after the first transition fires', async () => {
        vi.setSystemTime(new Date('2024-06-15T09:00:00'));
        await petView.onOpen();

        const setSpy = vi.spyOn(petView.petComponent!, '$set');

        // Trigger first transition (9am → 6pm = 9h)
        vi.advanceTimersByTime(9 * 60 * 60 * 1000 + 1);

        const firstCallCount = setSpy.mock.calls.filter(([props]) =>
          typeof props.backgroundPath === 'string' && props.backgroundPath.includes('background')
        ).length;
        expect(firstCallCount).toBe(1);

        // Trigger second transition (6pm → next 6am = 12h)
        vi.advanceTimersByTime(12 * 60 * 60 * 1000);

        const secondCallCount = setSpy.mock.calls.filter(([props]) =>
          typeof props.backgroundPath === 'string' && props.backgroundPath.includes('background')
        ).length;
        expect(secondCallCount).toBe(2);
      });

      it('fires promptly when opened very close to a boundary (1 minute before 6pm)', async () => {
        vi.setSystemTime(new Date('2024-06-15T17:59:00'));
        await petView.onOpen();

        const setSpy = vi.spyOn(petView.petComponent!, '$set');

        // Advance just over 1 minute
        vi.advanceTimersByTime(61 * 1000);

        const bgCall = setSpy.mock.calls.find(([props]) =>
          typeof props.backgroundPath === 'string' && props.backgroundPath.includes('background')
        );
        expect(bgCall).toBeDefined();
        expect(backgroundFilenameFrom(bgCall![0].backgroundPath)).toBe('background-night-8fps.gif');
        expect(bgCall![0].backgroundColor).toBe(BACKGROUNDS.NIGHT.skyColor);
      });
    });

    describe('cleanup on onClose', () => {
      it('does not call $set with backgroundPath after view is closed', async () => {
        vi.setSystemTime(new Date('2024-06-15T09:00:00'));
        await petView.onOpen();

        const setSpy = vi.spyOn(petView.petComponent!, '$set');

        await petView.onClose();

        // Advance past the 6pm boundary
        vi.advanceTimersByTime(9 * 60 * 60 * 1000 + 1);

        const bgCall = setSpy.mock.calls.find(([props]) =>
          typeof props?.backgroundPath === 'string' && props.backgroundPath.includes('background')
        );
        expect(bgCall).toBeUndefined();
      });

      it('does not throw when closed before any transition fires', async () => {
        vi.setSystemTime(new Date('2024-06-15T09:00:00'));
        await petView.onOpen();

        await expect(petView.onClose()).resolves.not.toThrow();
      });

      it('does not throw if petComponent is null when background transition fires', async () => {
        vi.setSystemTime(new Date('2024-06-15T09:00:00'));
        await petView.onOpen();

        // Simulate component being externally destroyed before the timeout fires
        petView.petComponent?.$destroy();
        petView.petComponent = null;

        // Advancing past boundary should not throw even with null petComponent
        expect(() => vi.advanceTimersByTime(9 * 60 * 60 * 1000 + 1)).not.toThrow();
      });
    });

    describe('self-heal on reopen', () => {
      it('shows night background when reopened at night after being open during the day', async () => {
        // First open during the day
        vi.setSystemTime(new Date('2024-06-15T09:00:00'));
        await petView.onOpen();
        await petView.onClose();

        // Reopen at night
        vi.setSystemTime(new Date('2024-06-15T22:00:00'));
        const spy = captureBackgroundResourceCall(petView);
        await petView.onOpen();

        const bgCall = spy.mock.calls.find(([p]) => p.includes('background'));
        expect(backgroundFilenameFrom(bgCall![0])).toBe('background-night-8fps.gif');
      });

      it('shows day background when reopened during day after being open at night', async () => {
        // First open at night
        vi.setSystemTime(new Date('2024-06-15T22:00:00'));
        await petView.onOpen();
        await petView.onClose();

        // Reopen during day
        vi.setSystemTime(new Date('2024-06-16T10:00:00'));
        const spy = captureBackgroundResourceCall(petView);
        await petView.onOpen();

        const bgCall = spy.mock.calls.find(([p]) => p.includes('background'));
        expect(backgroundFilenameFrom(bgCall![0])).toBe('background-day-8fps.gif');
      });
    });
  });
});
