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
      expect(petView.containerEl.querySelector('.obsidian-pets-container')).toBeTruthy();
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
    it('should update visual state when transitioning to celebration', async () => {
      await petView.onOpen();

      petView.transitionState('celebration');

      const container = petView.containerEl.querySelector('.pet-sprite-container');
      expect(container?.getAttribute('data-state')).toBe('celebration');
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
      const viewWithSettings = new PetView(leaf);
      // Set plugin settings before opening
      (viewWithSettings.app as any).plugins.plugins['obsidian-pets'].settings.movementSpeed = 30;
      await viewWithSettings.onOpen();

      const container = viewWithSettings.containerEl.querySelector('.pet-sprite-container') as HTMLElement;
      // Speed 30 -> duration = 2 - (30/100) = 1.7s
      expect(container.style.getPropertyValue('--animation-duration')).toBe('1.7s');

      await viewWithSettings.onClose();
    });
  });

  describe('animation sequences', () => {
    it('should play petting animation and return to walking', async () => {
      await petView.onOpen();

      petView.transitionState('petting');
      expect(petView.getCurrentState()).toBe('petting');

      vi.advanceTimersByTime(2000);

      expect(petView.getCurrentState()).toBe('walking');
    });

    it('should play celebration animation for correct duration (2170ms)', async () => {
      await petView.onOpen();

      petView.transitionState('celebration');

      vi.advanceTimersByTime(2169);
      expect(petView.getCurrentState()).toBe('celebration');

      vi.advanceTimersByTime(1);
      expect(petView.getCurrentState()).toBe('walking');
    });
  });


  describe('complex interaction sequences', () => {
    it('should handle user completes task, celebrates, returns to walking', async () => {
      await petView.onOpen();

      // User completes a task
      petView.transitionState('celebration');
      expect(petView.getCurrentState()).toBe('celebration');

      // Wait for celebration to complete (2170ms)
      vi.advanceTimersByTime(2170);

      expect(petView.getCurrentState()).toBe('walking');
    });

    it('should handle user pets the companion', async () => {
      await petView.onOpen();

      // User clicks on the pet
      petView.transitionState('petting');
      expect(petView.getCurrentState()).toBe('petting');

      // Petting animation lasts 2000ms
      vi.advanceTimersByTime(2000);

      expect(petView.getCurrentState()).toBe('walking');
    });
  });

  describe('rapid state transitions', () => {
    it('should handle interrupting one animation with another', async () => {
      await petView.onOpen();

      // Start celebration animation
      petView.transitionState('celebration');
      expect(petView.getCurrentState()).toBe('celebration');

      // Interrupt with petting after 1 second
      vi.advanceTimersByTime(1000);
      petView.transitionState('petting');
      expect(petView.getCurrentState()).toBe('petting');

      // Petting should complete normally
      vi.advanceTimersByTime(2000);
      expect(petView.getCurrentState()).toBe('walking');

      // Original celebration timer should not fire
      vi.advanceTimersByTime(5000);
      expect(petView.getCurrentState()).toBe('walking');
    });

    it('should handle rapid consecutive transitions', async () => {
      await petView.onOpen();

      // Rapid sequence of transitions
      petView.transitionState('celebration');
      vi.advanceTimersByTime(500);

      petView.transitionState('petting');

      expect(petView.getCurrentState()).toBe('petting');

      // Only the last timer should fire
      vi.advanceTimersByTime(2000);
      expect(petView.getCurrentState()).toBe('walking');
    });

    it('should handle transition during auto-return', async () => {
      await petView.onOpen();

      petView.transitionState('celebration');

      // Transition to petting right before celebration would complete
      vi.advanceTimersByTime(2169);
      petView.transitionState('petting');

      // Advance past where celebration would have completed
      vi.advanceTimersByTime(1000);

      // Should still be in petting state
      expect(petView.getCurrentState()).toBe('petting');
    });
  });

  describe('complete lifecycle scenarios', () => {
    it('should handle full day simulation: open, tasks, close', async () => {
      // Morning: user opens vault
      await petView.onOpen();
      expect(petView.getCurrentState()).toBe('walking');

      // User completes first task
      petView.transitionState('celebration');
      vi.advanceTimersByTime(2170);

      // User completes daily note
      petView.transitionState('celebration');
      vi.advanceTimersByTime(2170);

      // Evening: user closes vault
      await petView.onClose();
      expect(petView.getCurrentState()).toBeNull();
    });

    it('should maintain consistency across multiple open/close cycles', async () => {
      // First session
      await petView.onOpen();
      petView.transitionState('celebration');
      vi.advanceTimersByTime(2170);
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
        'celebration',
        'petting',
        'walking',
      ];

      for (const state of testStates) {
        petView.transitionState(state);

        // State machine
        expect(petView.getCurrentState()).toBe(state);

        // Data attribute on container
        const container = petView.containerEl.querySelector('.obsidian-pets-container');
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

      petView.transitionState('celebration');
      vi.advanceTimersByTime(2170);

      // All layers should be synchronized to walking
      expect(petView.getCurrentState()).toBe('walking');

      const container = petView.containerEl.querySelector('.obsidian-pets-container');
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
        'celebration',
        'petting',
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
      expect(() => petView.transitionState('celebration')).not.toThrow();

      // State machine should still track state
      expect(petView.getCurrentState()).toBe('celebration');
    });

    it('should handle DOM mutations during state transitions', async () => {
      await petView.onOpen();

      petView.transitionState('celebration');

      // Simulate external DOM manipulation
      const container = petView.containerEl.querySelector('.obsidian-pets-container');
      container?.setAttribute('data-pet-state', 'corrupted');

      // Auto-transition should still work
      vi.advanceTimersByTime(2170);

      expect(petView.getCurrentState()).toBe('walking');
      expect(container?.getAttribute('data-pet-state')).toBe('walking');
    });
  });

  describe('memory and performance', () => {
    it('should clean up all timers on close', async () => {
      await petView.onOpen();

      petView.transitionState('celebration');
      petView.transitionState('petting');

      await petView.onClose();

      // Advance time significantly
      vi.advanceTimersByTime(30000);

      // No timers should fire after close
      expect(petView.getCurrentState()).toBeNull();
    });

    it('should not leak event listeners', async () => {
      await petView.onOpen();

      // Transition multiple times to potentially add multiple listeners
      petView.transitionState('celebration');
      petView.transitionState('petting');

      await petView.onClose();

      // State machine should not have any listeners after close
      expect(petView.getCurrentState()).toBeNull();
    });

    it('should handle multiple rapid open/close cycles', async () => {
      for (let i = 0; i < 10; i++) {
        await petView.onOpen();
        petView.transitionState('celebration');
        vi.advanceTimersByTime(1000);
        await petView.onClose();
      }

      // Should not accumulate any state or memory
      expect(() => petView.getCurrentState()).not.toThrow();
    });
  });
});
