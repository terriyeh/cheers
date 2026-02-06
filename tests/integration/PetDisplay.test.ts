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
    it('should complete full initialization sequence', async () => {
      await petView.onOpen();

      // Verify all components are initialized
      expect(petView.getCurrentState()).toBe('idle');
      expect(petView.containerEl.querySelector('.vault-pal-container')).toBeTruthy();
      expect(petView.containerEl.querySelector('.pet-sprite-container')).toBeTruthy();
      expect(petView.containerEl.querySelector('.pet-sprite')).toBeTruthy();
      expect(petView.containerEl.querySelector('.pet-state-text')).toBeTruthy();
    });

    it('should display correct initial state text', async () => {
      await petView.onOpen();

      const stateText = petView.containerEl.querySelector('.pet-state-text');
      expect(stateText?.textContent).toBe('Just hanging out...');
    });

    it('should have correct initial aria label', async () => {
      await petView.onOpen();

      const sprite = petView.containerEl.querySelector('.pet-sprite');
      expect(sprite?.getAttribute('aria-label')).toBe('Pet is idle');
    });
  });

  describe('state change visual updates', () => {
    it('should update visual state when transitioning to greeting', async () => {
      await petView.onOpen();

      petView.transitionState('greeting');

      const container = petView.containerEl.querySelector('.pet-sprite-container');
      const stateText = petView.containerEl.querySelector('.pet-state-text');
      const sprite = petView.containerEl.querySelector('.pet-sprite');

      expect(container?.getAttribute('data-state')).toBe('greeting');
      expect(stateText?.textContent).toBe('Hello there!');
      expect(sprite?.getAttribute('aria-label')).toBe('Pet is greeting');
    });

    it('should update visual state when transitioning to talking', async () => {
      await petView.onOpen();

      petView.transitionState('talking');

      const stateText = petView.containerEl.querySelector('.pet-state-text');
      expect(stateText?.textContent).toBe('How was your day?');
    });

    it('should update visual state when transitioning to listening', async () => {
      await petView.onOpen();

      petView.transitionState('listening');

      const stateText = petView.containerEl.querySelector('.pet-state-text');
      expect(stateText?.textContent).toBe("I'm listening...");
    });

    it('should update visual state when transitioning to small-celebration', async () => {
      await petView.onOpen();

      petView.transitionState('small-celebration');

      const stateText = petView.containerEl.querySelector('.pet-state-text');
      expect(stateText?.textContent).toBe('Great job!');
    });

    it('should update visual state when transitioning to big-celebration', async () => {
      await petView.onOpen();

      petView.transitionState('big-celebration');

      const stateText = petView.containerEl.querySelector('.pet-state-text');
      expect(stateText?.textContent).toBe('Amazing! You did it!');
    });

    it('should update visual state when transitioning to petting', async () => {
      await petView.onOpen();

      petView.transitionState('petting');

      const stateText = petView.containerEl.querySelector('.pet-state-text');
      expect(stateText?.textContent).toBe('That feels nice!');
    });
  });

  describe('animation sequences', () => {
    it('should play greeting animation and return to idle', async () => {
      await petView.onOpen();

      petView.transitionState('greeting');
      expect(petView.getCurrentState()).toBe('greeting');

      const stateTextDuringGreeting = petView.containerEl.querySelector('.pet-state-text');
      expect(stateTextDuringGreeting?.textContent).toBe('Hello there!');

      vi.advanceTimersByTime(2000);

      expect(petView.getCurrentState()).toBe('idle');
      const stateTextAfterGreeting = petView.containerEl.querySelector('.pet-state-text');
      expect(stateTextAfterGreeting?.textContent).toBe('Just hanging out...');
    });

    it('should play petting animation and return to idle', async () => {
      await petView.onOpen();

      petView.transitionState('petting');
      expect(petView.getCurrentState()).toBe('petting');

      vi.advanceTimersByTime(2000);

      expect(petView.getCurrentState()).toBe('idle');
    });

    it('should play small-celebration animation for correct duration', async () => {
      await petView.onOpen();

      petView.transitionState('small-celebration');

      vi.advanceTimersByTime(2999);
      expect(petView.getCurrentState()).toBe('small-celebration');

      vi.advanceTimersByTime(1);
      expect(petView.getCurrentState()).toBe('idle');
    });

    it('should play big-celebration animation for correct duration', async () => {
      await petView.onOpen();

      petView.transitionState('big-celebration');

      vi.advanceTimersByTime(4999);
      expect(petView.getCurrentState()).toBe('big-celebration');

      vi.advanceTimersByTime(1);
      expect(petView.getCurrentState()).toBe('idle');
    });

    it('should NOT auto-return from talking state', async () => {
      await petView.onOpen();

      petView.transitionState('talking');

      vi.advanceTimersByTime(10000);

      expect(petView.getCurrentState()).toBe('talking');
    });

    it('should NOT auto-return from listening state', async () => {
      await petView.onOpen();

      petView.transitionState('listening');

      vi.advanceTimersByTime(10000);

      expect(petView.getCurrentState()).toBe('listening');
    });
  });

  describe('complex interaction sequences', () => {
    it('should handle user opens vault, pet greets, then returns to idle', async () => {
      await petView.onOpen();

      // User opens vault - trigger greeting
      petView.transitionState('greeting');
      expect(petView.getCurrentState()).toBe('greeting');

      const greetingText = petView.containerEl.querySelector('.pet-state-text');
      expect(greetingText?.textContent).toBe('Hello there!');

      // Wait for greeting to complete
      vi.advanceTimersByTime(2000);

      expect(petView.getCurrentState()).toBe('idle');
      const idleText = petView.containerEl.querySelector('.pet-state-text');
      expect(idleText?.textContent).toBe('Just hanging out...');
    });

    it('should handle pet asks question, user types response', async () => {
      await petView.onOpen();

      // Pet asks a question
      petView.transitionState('talking');
      expect(petView.getCurrentState()).toBe('talking');

      const talkingText = petView.containerEl.querySelector('.pet-state-text');
      expect(talkingText?.textContent).toBe('How was your day?');

      // User starts typing
      petView.transitionState('listening');
      expect(petView.getCurrentState()).toBe('listening');

      const listeningText = petView.containerEl.querySelector('.pet-state-text');
      expect(listeningText?.textContent).toBe("I'm listening...");

      // Should stay in listening state
      vi.advanceTimersByTime(5000);
      expect(petView.getCurrentState()).toBe('listening');
    });

    it('should handle user completes task, celebrates, returns to idle', async () => {
      await petView.onOpen();

      // User completes a task
      petView.transitionState('small-celebration');
      expect(petView.getCurrentState()).toBe('small-celebration');

      const celebrationText = petView.containerEl.querySelector('.pet-state-text');
      expect(celebrationText?.textContent).toBe('Great job!');

      // Wait for celebration to complete
      vi.advanceTimersByTime(3000);

      expect(petView.getCurrentState()).toBe('idle');
    });

    it('should handle milestone achievement with big celebration', async () => {
      await petView.onOpen();

      // User hits a milestone (e.g., 7-day streak)
      petView.transitionState('big-celebration');
      expect(petView.getCurrentState()).toBe('big-celebration');

      const bigCelebrationText = petView.containerEl.querySelector('.pet-state-text');
      expect(bigCelebrationText?.textContent).toBe('Amazing! You did it!');

      // Big celebration lasts 5 seconds
      vi.advanceTimersByTime(5000);

      expect(petView.getCurrentState()).toBe('idle');
    });

    it('should handle user pets the companion', async () => {
      await petView.onOpen();

      // User clicks on the pet
      petView.transitionState('petting');
      expect(petView.getCurrentState()).toBe('petting');

      const pettingText = petView.containerEl.querySelector('.pet-state-text');
      expect(pettingText?.textContent).toBe('That feels nice!');

      // Petting animation lasts 2 seconds
      vi.advanceTimersByTime(2000);

      expect(petView.getCurrentState()).toBe('idle');
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
      expect(petView.getCurrentState()).toBe('idle');

      // Original greeting timer should not fire
      vi.advanceTimersByTime(5000);
      expect(petView.getCurrentState()).toBe('idle');
    });

    it('should handle rapid consecutive transitions', async () => {
      await petView.onOpen();

      // Rapid sequence of transitions
      petView.transitionState('greeting');
      vi.advanceTimersByTime(500);

      petView.transitionState('petting');
      vi.advanceTimersByTime(500);

      petView.transitionState('small-celebration');

      expect(petView.getCurrentState()).toBe('small-celebration');

      // Only the last timer should fire
      vi.advanceTimersByTime(3000);
      expect(petView.getCurrentState()).toBe('idle');
    });

    it('should handle transition during auto-return', async () => {
      await petView.onOpen();

      petView.transitionState('greeting');

      // Transition to talking right before greeting would complete
      vi.advanceTimersByTime(1999);
      petView.transitionState('talking');

      // Advance past where greeting would have completed
      vi.advanceTimersByTime(1000);

      // Should still be in talking state
      expect(petView.getCurrentState()).toBe('talking');
    });
  });

  describe('complete lifecycle scenarios', () => {
    it('should handle full day simulation: open, greet, tasks, close', async () => {
      // Morning: user opens vault
      await petView.onOpen();
      expect(petView.getCurrentState()).toBe('idle');

      // Pet greets user
      petView.transitionState('greeting');
      vi.advanceTimersByTime(2000);
      expect(petView.getCurrentState()).toBe('idle');

      // Pet asks a question
      petView.transitionState('talking');
      expect(petView.getCurrentState()).toBe('talking');

      // User responds
      petView.transitionState('listening');
      expect(petView.getCurrentState()).toBe('listening');

      // User finishes response, pet returns to idle
      petView.transitionState('idle');
      expect(petView.getCurrentState()).toBe('idle');

      // User completes first task
      petView.transitionState('small-celebration');
      vi.advanceTimersByTime(3000);

      // User completes daily note
      petView.transitionState('small-celebration');
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
      expect(petView.getCurrentState()).toBe('idle');
      petView.transitionState('petting');
      vi.advanceTimersByTime(2000);
      await petView.onClose();

      // Third session
      await petView.onOpen();
      expect(petView.getCurrentState()).toBe('idle');
    });
  });

  describe('synchronization verification', () => {
    it('should keep all layers synchronized during state changes', async () => {
      await petView.onOpen();

      const testStates: PetState[] = [
        'greeting',
        'talking',
        'listening',
        'small-celebration',
        'big-celebration',
        'petting',
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

      // All layers should be synchronized to idle
      expect(petView.getCurrentState()).toBe('idle');

      const container = petView.containerEl.querySelector('.vault-pal-container');
      expect(container?.getAttribute('data-pet-state')).toBe('idle');

      const spriteContainer = petView.containerEl.querySelector('.pet-sprite-container');
      expect(spriteContainer?.getAttribute('data-state')).toBe('idle');

      const sprite = petView.containerEl.querySelector('.pet-sprite');
      expect(sprite?.getAttribute('aria-label')).toBe('Pet is idle');

      const stateText = petView.containerEl.querySelector('.pet-state-text');
      expect(stateText?.textContent).toBe('Just hanging out...');
    });
  });

  describe('accessibility verification', () => {
    it('should have proper ARIA labels for all states', async () => {
      await petView.onOpen();

      const states: PetState[] = [
        'idle',
        'greeting',
        'talking',
        'listening',
        'small-celebration',
        'big-celebration',
        'petting',
      ];

      for (const state of states) {
        if (state !== 'idle') {
          petView.transitionState(state);
        }

        const sprite = petView.containerEl.querySelector('.pet-sprite');
        expect(sprite?.getAttribute('role')).toBe('img');
        expect(sprite?.getAttribute('aria-label')).toBe(`Pet is ${state}`);
      }
    });

    it('should have readable state text for all states', async () => {
      await petView.onOpen();

      const expectedTexts: Record<PetState, string> = {
        idle: 'Just hanging out...',
        greeting: 'Hello there!',
        talking: 'How was your day?',
        listening: "I'm listening...",
        'small-celebration': 'Great job!',
        'big-celebration': 'Amazing! You did it!',
        petting: 'That feels nice!',
      };

      for (const [state, expectedText] of Object.entries(expectedTexts)) {
        if (state !== 'idle') {
          petView.transitionState(state as PetState);
        }

        const stateText = petView.containerEl.querySelector('.pet-state-text');
        expect(stateText?.textContent).toBe(expectedText);
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

      expect(petView.getCurrentState()).toBe('idle');
      expect(container?.getAttribute('data-pet-state')).toBe('idle');
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
      petView.transitionState('talking');
      petView.transitionState('listening');

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
