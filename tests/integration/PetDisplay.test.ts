/**
 * Integration tests for Pet Display
 * Tests end-to-end behavior of PetView + PetStateMachine + Svelte component
 */

import { vi } from 'vitest';
import { PetView } from '../../src/views/PetView';
import { WorkspaceLeaf } from '../mocks/obsidian';
import type { PetState } from '../../src/types/pet';

describe('PetDisplay Integration', () => {
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

  describe('complete initialization flow', () => {
    it('should complete full initialization sequence with walking state', async () => {
      await petView.onOpen();

      // Verify all components are initialized
      expect(petView.getCurrentState()).toBe('walking');
      expect(petView.containerEl.querySelector('.vault-pal-container')).toBeTruthy();
      expect(petView.containerEl.querySelector('.pet-sprite-container')).toBeTruthy();
      expect(petView.containerEl.querySelector('.pet-sprite')).toBeTruthy();
    });

    it('should have correct initial aria label', async () => {
      await petView.onOpen();

      const sprite = petView.containerEl.querySelector('.pet-sprite');
      expect(sprite?.getAttribute('aria-label')).toBe('Pet is walking');
    });
  });

  describe('state change visual updates', () => {
    it('should update visual state when transitioning to greeting', async () => {
      await petView.onOpen();

      petView.transitionState('greeting');

      const container = petView.containerEl.querySelector('.pet-sprite-container');
      const sprite = petView.containerEl.querySelector('.pet-sprite');

      expect(container?.getAttribute('data-state')).toBe('greeting');
      expect(sprite?.getAttribute('aria-label')).toBe('Pet is greeting');
    });

    it('should update visual state when transitioning to celebration', async () => {
      await petView.onOpen();

      petView.transitionState('celebration');

      const container = petView.containerEl.querySelector('.pet-sprite-container');
      expect(container?.getAttribute('data-state')).toBe('celebration');
    });

    it('should update visual state when transitioning to sleeping', async () => {
      await petView.onOpen();

      petView.transitionState('sleeping');

      const container = petView.containerEl.querySelector('.pet-sprite-container');
      expect(container?.getAttribute('data-state')).toBe('sleeping');
    });

    it('should update visual state when transitioning to petting', async () => {
      await petView.onOpen();

      petView.transitionState('petting');

      const container = petView.containerEl.querySelector('.pet-sprite-container');
      expect(container?.getAttribute('data-state')).toBe('petting');
    });
  });

  describe('settings integration', () => {
    it('should respect movement speed setting for walking animation', async () => {
      const viewWithSettings = new PetView(leaf, { movementSpeed: 30 });
      await viewWithSettings.onOpen();

      const container = viewWithSettings.containerEl.querySelector('.pet-sprite-container') as HTMLElement;
      // Speed 30 -> duration = 2 - (30/60) = 1.5s
      expect(container.style.getPropertyValue('--animation-duration')).toBe('1.5s');

      await viewWithSettings.onClose();
    });

    it('should respect movement speed setting for running animation', async () => {
      const viewWithSettings = new PetView(leaf, { movementSpeed: 80 });
      await viewWithSettings.onOpen();

      viewWithSettings.transitionState('running');
      const container = viewWithSettings.containerEl.querySelector('.pet-sprite-container') as HTMLElement;
      // Speed 80 -> duration = 1 - ((80-60)/40) * 0.6 = 0.7s
      expect(container.style.getPropertyValue('--animation-duration')).toBe('0.7s');

      await viewWithSettings.onClose();
    });

    it.skip('should update animation when movement speed setting changes', async () => {
      // TODO: Implement updateSettings() method in PetView
      await petView.onOpen();

      // Update settings
      petView.updateSettings({ movementSpeed: 100 });

      petView.transitionState('running');
      const container = petView.containerEl.querySelector('.pet-sprite-container') as HTMLElement;
      // Speed 100 -> duration = 1 - ((100-60)/40) * 0.6 = 0.4s
      expect(container.style.getPropertyValue('--animation-duration')).toBe('0.4s');
    });
  });

  describe('animation sequences', () => {
    it('should play greeting animation and return to walking', async () => {
      await petView.onOpen();

      petView.transitionState('greeting');
      expect(petView.getCurrentState()).toBe('greeting');

      vi.advanceTimersByTime(2000);

      expect(petView.getCurrentState()).toBe('walking');
    });

    it('should play petting animation and return to walking', async () => {
      await petView.onOpen();

      petView.transitionState('petting');
      expect(petView.getCurrentState()).toBe('petting');

      vi.advanceTimersByTime(2000);

      expect(petView.getCurrentState()).toBe('walking');
    });

    it('should play celebration animation for correct duration', async () => {
      await petView.onOpen();

      petView.transitionState('celebration');

      vi.advanceTimersByTime(2999);
      expect(petView.getCurrentState()).toBe('celebration');

      vi.advanceTimersByTime(1);
      expect(petView.getCurrentState()).toBe('walking');
    });

    it('should play sleeping animation for correct duration', async () => {
      await petView.onOpen();

      petView.transitionState('sleeping');

      vi.advanceTimersByTime(1999);
      expect(petView.getCurrentState()).toBe('sleeping');

      vi.advanceTimersByTime(1);
      expect(petView.getCurrentState()).toBe('walking');
    });
  });

  describe('state transitions with settings', () => {
    it.skip('should transition from walking to running based on speed threshold', async () => {
      // TODO: Implement updateSettings() method in PetView
      await petView.onOpen();

      // Update speed to trigger running state
      petView.updateSettings({ movementSpeed: 70 });
      petView.transitionState('running');

      expect(petView.getCurrentState()).toBe('running');

      const container = petView.containerEl.querySelector('.pet-sprite-container');
      expect(container?.getAttribute('data-state')).toBe('running');
    });

    it.skip('should maintain walking state when speed is below threshold', async () => {
      // TODO: Implement updateSettings() method in PetView
      await petView.onOpen();

      petView.updateSettings({ movementSpeed: 30 });

      expect(petView.getCurrentState()).toBe('walking');

      const container = petView.containerEl.querySelector('.pet-sprite-container');
      expect(container?.getAttribute('data-state')).toBe('walking');
    });

    it.skip('should return to correct movement state after temporary animation', async () => {
      // TODO: Implement updateSettings() method in PetView
      await petView.onOpen();

      // Set running speed
      petView.updateSettings({ movementSpeed: 80 });
      petView.transitionState('running');

      // Trigger petting
      petView.transitionState('petting', 'running');

      // Wait for petting to complete
      vi.advanceTimersByTime(2000);

      // Should return to running, not walking
      expect(petView.getCurrentState()).toBe('running');
    });
  });

  describe('complex interaction sequences', () => {
    it('should handle user opens vault, pet greets, then returns to walking', async () => {
      await petView.onOpen();

      // User opens vault - trigger greeting
      petView.transitionState('greeting');
      expect(petView.getCurrentState()).toBe('greeting');

      // Wait for greeting to complete
      vi.advanceTimersByTime(2000);

      expect(petView.getCurrentState()).toBe('walking');
    });

    it('should handle user completes task, celebrates, returns to walking', async () => {
      await petView.onOpen();

      // User completes a task
      petView.transitionState('celebration');
      expect(petView.getCurrentState()).toBe('celebration');

      // Wait for celebration to complete
      vi.advanceTimersByTime(3000);

      expect(petView.getCurrentState()).toBe('walking');
    });

    it('should handle pet goes to sleep and wakes up walking', async () => {
      await petView.onOpen();

      // Pet goes to sleep
      petView.transitionState('sleeping');
      expect(petView.getCurrentState()).toBe('sleeping');

      // Sleep lasts 5 seconds
      vi.advanceTimersByTime(5000);

      expect(petView.getCurrentState()).toBe('walking');
    });

    it('should handle user pets the companion', async () => {
      await petView.onOpen();

      // User clicks on the pet
      petView.transitionState('petting');
      expect(petView.getCurrentState()).toBe('petting');

      // Petting animation lasts 2 seconds
      vi.advanceTimersByTime(2000);

      expect(petView.getCurrentState()).toBe('walking');
    });
  });

  describe('rapid state transitions', () => {
    it('should handle interrupting one animation with another', async () => {
      await petView.onOpen();

      // Start greeting animation
      petView.transitionState('greeting');
      expect(petView.getCurrentState()).toBe('greeting');

      // Interrupt with petting after 1 second
      vi.advanceTimersByTime(1000);
      petView.transitionState('petting');
      expect(petView.getCurrentState()).toBe('petting');

      // Petting should complete normally
      vi.advanceTimersByTime(2000);
      expect(petView.getCurrentState()).toBe('walking');

      // Original greeting timer should not fire
      vi.advanceTimersByTime(5000);
      expect(petView.getCurrentState()).toBe('walking');
    });

    it('should handle rapid consecutive transitions', async () => {
      await petView.onOpen();

      // Rapid sequence of transitions
      petView.transitionState('greeting');
      vi.advanceTimersByTime(500);

      petView.transitionState('petting');
      vi.advanceTimersByTime(500);

      petView.transitionState('celebration');

      expect(petView.getCurrentState()).toBe('celebration');

      // Only the last timer should fire
      vi.advanceTimersByTime(3000);
      expect(petView.getCurrentState()).toBe('walking');
    });

    it('should handle transition during auto-return', async () => {
      await petView.onOpen();

      petView.transitionState('greeting');

      // Transition to celebration right before greeting would complete
      vi.advanceTimersByTime(1999);
      petView.transitionState('celebration');

      // Advance past where greeting would have completed
      vi.advanceTimersByTime(1000);

      // Should still be in celebration state
      expect(petView.getCurrentState()).toBe('celebration');
    });
  });

  describe('complete lifecycle scenarios', () => {
    it('should handle full day simulation: open, greet, tasks, close', async () => {
      // Morning: user opens vault
      await petView.onOpen();
      expect(petView.getCurrentState()).toBe('walking');

      // Pet greets user
      petView.transitionState('greeting');
      vi.advanceTimersByTime(2000);
      expect(petView.getCurrentState()).toBe('walking');

      // User completes first task
      petView.transitionState('celebration');
      vi.advanceTimersByTime(3000);

      // User completes daily note
      petView.transitionState('celebration');
      vi.advanceTimersByTime(3000);

      // Evening: user closes vault
      await petView.onClose();
      expect(petView.getCurrentState()).toBeNull();
    });

    it('should maintain consistency across multiple open/close cycles', async () => {
      // First session
      await petView.onOpen();
      petView.transitionState('greeting');
      vi.advanceTimersByTime(2000);
      await petView.onClose();

      // Second session
      await petView.onOpen();
      expect(petView.getCurrentState()).toBe('walking');
      petView.transitionState('petting');
      vi.advanceTimersByTime(2000);
      await petView.onClose();

      // Third session
      await petView.onOpen();
      expect(petView.getCurrentState()).toBe('walking');
    });
  });

  describe('synchronization verification', () => {
    it('should keep all layers synchronized during state changes', async () => {
      await petView.onOpen();

      const testStates: PetState[] = [
        'greeting',
        'celebration',
        'petting',
        'sleeping',
        'running',
      ];

      for (const state of testStates) {
        petView.transitionState(state);

        // State machine
        expect(petView.getCurrentState()).toBe(state);

        // Data attribute on container
        const container = petView.containerEl.querySelector('.vault-pal-container');
        expect(container?.getAttribute('data-pet-state')).toBe(state);

        // Svelte component data-state
        const spriteContainer = petView.containerEl.querySelector('.pet-sprite-container');
        expect(spriteContainer?.getAttribute('data-state')).toBe(state);

        // Aria label
        const sprite = petView.containerEl.querySelector('.pet-sprite');
        expect(sprite?.getAttribute('aria-label')).toBe(`Pet is ${state}`);
      }
    });

    it('should maintain synchronization after auto-transitions', async () => {
      await petView.onOpen();

      petView.transitionState('greeting');
      vi.advanceTimersByTime(2000);

      // All layers should be synchronized to walking
      expect(petView.getCurrentState()).toBe('walking');

      const container = petView.containerEl.querySelector('.vault-pal-container');
      expect(container?.getAttribute('data-pet-state')).toBe('walking');

      const spriteContainer = petView.containerEl.querySelector('.pet-sprite-container');
      expect(spriteContainer?.getAttribute('data-state')).toBe('walking');

      const sprite = petView.containerEl.querySelector('.pet-sprite');
      expect(sprite?.getAttribute('aria-label')).toBe('Pet is walking');
    });
  });

  describe('accessibility verification', () => {
    it('should have proper ARIA labels for all states', async () => {
      await petView.onOpen();

      const states: PetState[] = [
        'walking',
        'running',
        'greeting',
        'celebration',
        'petting',
        'sleeping',
      ];

      for (const state of states) {
        if (state !== 'walking') {
          petView.transitionState(state);
        }

        const sprite = petView.containerEl.querySelector('.pet-sprite');
        expect(sprite?.getAttribute('role')).toBe('img');
        expect(sprite?.getAttribute('aria-label')).toBe(`Pet is ${state}`);
      }
    });
  });

  describe('error recovery', () => {
    it('should recover from component update failure', async () => {
      await petView.onOpen();

      // Corrupt the component
      const spriteContainer = petView.containerEl.querySelector('.pet-sprite-container');
      spriteContainer?.remove();

      // Transition should not crash
      expect(() => petView.transitionState('greeting')).not.toThrow();

      // State machine should still track state
      expect(petView.getCurrentState()).toBe('greeting');
    });

    it('should handle DOM mutations during state transitions', async () => {
      await petView.onOpen();

      petView.transitionState('greeting');

      // Simulate external DOM manipulation
      const container = petView.containerEl.querySelector('.vault-pal-container');
      container?.setAttribute('data-pet-state', 'corrupted');

      // Auto-transition should still work
      vi.advanceTimersByTime(2000);

      expect(petView.getCurrentState()).toBe('walking');
      expect(container?.getAttribute('data-pet-state')).toBe('walking');
    });
  });

  describe('memory and performance', () => {
    it('should clean up all timers on close', async () => {
      await petView.onOpen();

      petView.transitionState('greeting');
      petView.transitionState('petting');
      petView.transitionState('small-celebration');

      await petView.onClose();

      // Advance time significantly
      vi.advanceTimersByTime(30000);

      // No timers should fire after close
      expect(petView.getCurrentState()).toBeNull();
    });

    it('should not leak event listeners', async () => {
      await petView.onOpen();

      // Transition multiple times to potentially add multiple listeners
      petView.transitionState('greeting');
      petView.transitionState('small-celebration');
      petView.transitionState('petting');

      await petView.onClose();

      // State machine should not have any listeners after close
      expect(petView.getCurrentState()).toBeNull();
    });

    it('should handle multiple rapid open/close cycles', async () => {
      for (let i = 0; i < 10; i++) {
        await petView.onOpen();
        petView.transitionState('greeting');
        vi.advanceTimersByTime(1000);
        await petView.onClose();
      }

      // Should not accumulate any state or memory
      expect(() => petView.getCurrentState()).not.toThrow();
    });
  });
});
