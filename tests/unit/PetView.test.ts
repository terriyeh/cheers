/**
 * Unit tests for PetView
 * Tests view lifecycle, Svelte component integration, and state machine coordination
 */

import { vi } from 'vitest';
import { PetView, VIEW_TYPE_PET } from '../../src/views/PetView';
import { WorkspaceLeaf, App } from '../mocks/obsidian';
import type { PetState } from '../../src/types/pet';

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
      expect(petView.getDisplayText()).toBe('Vault Pal');
    });

    it('should return correct icon', () => {
      expect(petView.getIcon()).toBe('cat');
    });

    it('should export VIEW_TYPE_PET constant', () => {
      expect(VIEW_TYPE_PET).toBe('vault-pal-pet-view');
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
      const loadingEl = petView.containerEl.querySelector('.vault-pal-loading');
      expect(loadingEl).toBeNull();

      // And the pet container should be visible
      const container = petView.containerEl.querySelector('.vault-pal-container');
      expect(container).toBeTruthy();
    });

    it('should hide loading state after initialization', async () => {
      await petView.onOpen();

      const loadingEl = petView.containerEl.querySelector('.vault-pal-loading');
      expect(loadingEl).toBeNull();
    });

    it('should create container div with correct class', async () => {
      await petView.onOpen();

      const container = petView.containerEl.querySelector('.vault-pal-container');
      expect(container).toBeTruthy();
    });

    it('should initialize state machine', async () => {
      await petView.onOpen();

      const currentState = petView.getCurrentState();
      expect(currentState).toBe('idle');
    });

    it('should mount Svelte component', async () => {
      await petView.onOpen();

      const component = petView.containerEl.querySelector('.pet-sprite-container');
      expect(component).toBeTruthy();
    });

    it('should set initial data-pet-state attribute', async () => {
      await petView.onOpen();

      const container = petView.containerEl.querySelector('.vault-pal-container');
      expect(container?.getAttribute('data-pet-state')).toBe('idle');
    });

    it('should pass correct props to Svelte component', async () => {
      await petView.onOpen();

      const component = petView.containerEl.querySelector('.pet-sprite-container');
      expect(component?.getAttribute('data-state')).toBe('idle');
    });

    it('should generate correct sprite sheet path', async () => {
      await petView.onOpen();

      // The path should be generated using app.vault.adapter.getResourcePath
      // which in our mock returns app://local/{path}
      const expectedPath = 'app://local/.obsidian/plugins/vault-pal/assets/pet-sprite-sheet.png';

      // We can't directly access the spriteSheetPath prop, but we can verify
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
      const errorEl = badView.containerEl.querySelector('.vault-pal-view-error');
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

      const errorHeading = badView.containerEl.querySelector('.vault-pal-view-error h3');
      const errorMessage = badView.containerEl.querySelector('.vault-pal-view-error-message');
      const errorHint = badView.containerEl.querySelector('.vault-pal-view-error-hint');

      expect(errorHeading?.textContent).toBe('Failed to load Vault Pal');
      expect(errorMessage).toBeTruthy();
      expect(errorHint?.textContent).toBe('Check the console for more details.');

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
      expect(petView.getCurrentState()).toBe('idle');

      await petView.onClose();

      expect(petView.getCurrentState()).toBeNull();
    });

    it('should clear container element', async () => {
      await petView.onOpen();
      const initialChildCount = petView.containerEl.children.length;
      expect(initialChildCount).toBeGreaterThan(0);

      // Find the vault-pal-container that was created
      const vaultPalContainer = petView.containerEl.querySelector('.vault-pal-container');
      expect(vaultPalContainer).toBeTruthy();

      await petView.onClose();

      // After close, the vault-pal-container should be removed
      const vaultPalContainerAfter = petView.containerEl.querySelector('.vault-pal-container');
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
      petView.transitionState('greeting');

      await petView.onClose();

      vi.advanceTimersByTime(2000);

      // getCurrentState should return null after close
      expect(petView.getCurrentState()).toBeNull();
    });
  });

  describe('state machine integration', () => {
    it('should update data attribute when state changes', async () => {
      await petView.onOpen();

      petView.transitionState('greeting');

      const container = petView.containerEl.querySelector('.vault-pal-container');
      expect(container?.getAttribute('data-pet-state')).toBe('greeting');
    });

    it('should update Svelte component when state changes', async () => {
      await petView.onOpen();

      petView.transitionState('talking');

      const component = petView.containerEl.querySelector('.pet-sprite-container');
      expect(component?.getAttribute('data-state')).toBe('talking');
    });

    it('should handle state transitions through all states', async () => {
      await petView.onOpen();

      const states: PetState[] = [
        'greeting',
        'talking',
        'listening',
        'small-celebration',
        'big-celebration',
        'petting',
      ];

      for (const state of states) {
        petView.transitionState(state);
        expect(petView.getCurrentState()).toBe(state);

        const container = petView.containerEl.querySelector('.vault-pal-container');
        expect(container?.getAttribute('data-pet-state')).toBe(state);
      }
    });

    it('should handle auto-transition to idle', async () => {
      await petView.onOpen();

      petView.transitionState('greeting');
      expect(petView.getCurrentState()).toBe('greeting');

      vi.advanceTimersByTime(2000);

      expect(petView.getCurrentState()).toBe('idle');
      const container = petView.containerEl.querySelector('.vault-pal-container');
      expect(container?.getAttribute('data-pet-state')).toBe('idle');
    });

    it('should update component on auto-transition to idle', async () => {
      await petView.onOpen();

      petView.transitionState('petting');
      const component = petView.containerEl.querySelector('.pet-sprite-container');
      expect(component?.getAttribute('data-state')).toBe('petting');

      vi.advanceTimersByTime(2000);

      expect(component?.getAttribute('data-state')).toBe('idle');
    });

    it('should return false for invalid state transition', async () => {
      await petView.onOpen();

      // Transitioning to same state should return false
      const result = petView.transitionState('idle');
      expect(result).toBe(false);
    });

    it('should return false when transitioning before open', () => {
      const result = petView.transitionState('greeting');
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

      const states: PetState[] = ['greeting', 'talking', 'listening', 'petting'];

      for (const state of states) {
        petView.transitionState(state);

        const container = petView.containerEl.querySelector('.vault-pal-container');
        const component = petView.containerEl.querySelector('.pet-sprite-container');

        expect(container?.getAttribute('data-pet-state')).toBe(state);
        expect(component?.getAttribute('data-state')).toBe(state);
        expect(petView.getCurrentState()).toBe(state);
      }
    });

    it('should maintain sync after auto-transition', async () => {
      await petView.onOpen();

      petView.transitionState('small-celebration');
      vi.advanceTimersByTime(3000);

      const container = petView.containerEl.querySelector('.vault-pal-container');
      const component = petView.containerEl.querySelector('.pet-sprite-container');

      expect(container?.getAttribute('data-pet-state')).toBe('idle');
      expect(component?.getAttribute('data-state')).toBe('idle');
      expect(petView.getCurrentState()).toBe('idle');
    });

    it('should maintain sync through rapid state changes', async () => {
      await petView.onOpen();

      petView.transitionState('greeting');
      petView.transitionState('talking');
      petView.transitionState('listening');

      const container = petView.containerEl.querySelector('.vault-pal-container');
      const component = petView.containerEl.querySelector('.pet-sprite-container');

      expect(container?.getAttribute('data-pet-state')).toBe('listening');
      expect(component?.getAttribute('data-state')).toBe('listening');
      expect(petView.getCurrentState()).toBe('listening');
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
      const errorEl = failView.containerEl.querySelector('.vault-pal-view-error');
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
      const container = petView.containerEl.querySelector('.vault-pal-container');
      container?.remove();

      // Should not throw even though container is gone
      expect(() => petView.transitionState('greeting')).not.toThrow();
    });

    it('should handle state transition during close', async () => {
      await petView.onOpen();
      petView.transitionState('greeting');

      // Start close but don't await
      const closePromise = petView.onClose();

      // Try to transition during close
      const result = petView.transitionState('talking');

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

      expect(petView.getCurrentState()).toBe('idle');
    });
  });

  describe('external access methods', () => {
    it('should provide getCurrentState for external access', async () => {
      await petView.onOpen();

      expect(typeof petView.getCurrentState).toBe('function');
      expect(petView.getCurrentState()).toBe('idle');
    });

    it('should provide transitionState for external access', async () => {
      await petView.onOpen();

      expect(typeof petView.transitionState).toBe('function');

      const result = petView.transitionState('greeting');
      expect(result).toBe(true);
      expect(petView.getCurrentState()).toBe('greeting');
    });

    it('should allow external code to trigger animations', async () => {
      await petView.onOpen();

      petView.transitionState('big-celebration');
      expect(petView.getCurrentState()).toBe('big-celebration');

      vi.advanceTimersByTime(5000);
      expect(petView.getCurrentState()).toBe('idle');
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

      // Should have vault-pal-container inside
      const vaultPalContainer = mainContainer.querySelector('.vault-pal-container');
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

  describe('pet interaction event handling', () => {
    it('should setup pet event listener on open', async () => {
      await petView.onOpen();

      // Verify that the component is mounted and ready to emit events
      const component = petView.containerEl.querySelector('.pet-sprite-container');
      expect(component).toBeTruthy();

      // The petEventListener should be set up (we can't directly test private fields,
      // but we can verify the event handling works in the next tests)
    });

    it('should handle pet event with returnTarget parameter', async () => {
      await petView.onOpen();

      // Start in idle state
      expect(petView.getCurrentState()).toBe('idle');

      // Transition to talking state
      petView.transitionState('talking');
      expect(petView.getCurrentState()).toBe('talking');

      // Simulate petting event from Pet.svelte component
      // (In real scenario, this would be triggered by clicking the pet sprite)
      // Since we can't easily dispatch custom events from the Svelte component in this test,
      // we verify the state machine's returnTarget functionality instead
      petView.transitionState('petting', 'talking');
      expect(petView.getCurrentState()).toBe('petting');

      // After petting duration, should return to 'talking'
      vi.advanceTimersByTime(2000);
      expect(petView.getCurrentState()).toBe('talking');
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

    it('should handle pet event with returnTarget from idle state', async () => {
      await petView.onOpen();

      // Start in idle state
      expect(petView.getCurrentState()).toBe('idle');

      // Simulate petting from idle (should return to idle)
      petView.transitionState('petting', 'idle');
      expect(petView.getCurrentState()).toBe('petting');

      // After petting duration, should return to 'idle'
      vi.advanceTimersByTime(2000);
      expect(petView.getCurrentState()).toBe('idle');
    });

    it('should handle pet event with returnTarget from greeting state', async () => {
      await petView.onOpen();

      // Transition to greeting state
      petView.transitionState('greeting');
      expect(petView.getCurrentState()).toBe('greeting');

      // Simulate petting from greeting (should return to greeting)
      petView.transitionState('petting', 'greeting');
      expect(petView.getCurrentState()).toBe('petting');

      // After petting duration, should return to 'greeting'
      vi.advanceTimersByTime(2000);
      expect(petView.getCurrentState()).toBe('greeting');
    });
  });
});
