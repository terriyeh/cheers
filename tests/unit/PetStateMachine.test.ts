/**
 * Unit tests for PetStateMachine
 * Tests state transitions, timer management, event listeners, and cleanup
 */

import { vi } from 'vitest';
import { PetStateMachine } from '../../src/pet/PetStateMachine';
import type { PetState, StateChangeEvent } from '../../src/types/pet';

describe('PetStateMachine', () => {
  let stateMachine: PetStateMachine;

  beforeEach(() => {
    vi.useFakeTimers();
    stateMachine = new PetStateMachine();
  });

  afterEach(() => {
    stateMachine.cleanup();
    vi.restoreAllMocks();
    vi.clearAllTimers();
  });

  describe('initialization', () => {
    it('should initialize in idle state', () => {
      expect(stateMachine.getCurrentState()).toBe('idle');
    });

    it('should have no listeners on initialization', () => {
      const listener = vi.fn();
      stateMachine.addListener(listener);
      stateMachine.removeListener(listener);
      stateMachine.transition('greeting');
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('state transitions', () => {
    it('should transition from idle to greeting', () => {
      const result = stateMachine.transition('greeting');
      expect(result).toBe(true);
      expect(stateMachine.getCurrentState()).toBe('greeting');
    });

    it('should transition through all valid states', () => {
      const states: PetState[] = [
        'greeting',
        'talking',
        'listening',
        'small-celebration',
        'big-celebration',
        'petting',
        'idle',
      ];

      states.forEach((state) => {
        const result = stateMachine.transition(state);
        expect(result).toBe(true);
        expect(stateMachine.getCurrentState()).toBe(state);
      });
    });

    it('should return false when transitioning to the same state', () => {
      expect(stateMachine.getCurrentState()).toBe('idle');
      const result = stateMachine.transition('idle');
      expect(result).toBe(false);
      expect(stateMachine.getCurrentState()).toBe('idle');
    });

    it('should handle rapid state transitions correctly', () => {
      stateMachine.transition('greeting');
      stateMachine.transition('talking');
      stateMachine.transition('listening');
      expect(stateMachine.getCurrentState()).toBe('listening');
    });

    it('should clear previous timer when transitioning to a new state', () => {
      stateMachine.transition('greeting');
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

      stateMachine.transition('petting');

      expect(clearTimeoutSpy).toHaveBeenCalled();
      expect(stateMachine.getCurrentState()).toBe('petting');
    });
  });

  describe('automatic return to idle', () => {
    it('should return to idle after greeting duration (2s)', () => {
      stateMachine.transition('greeting');
      expect(stateMachine.getCurrentState()).toBe('greeting');

      vi.advanceTimersByTime(2000);

      expect(stateMachine.getCurrentState()).toBe('idle');
    });

    it('should return to idle after small-celebration duration (3s)', () => {
      stateMachine.transition('small-celebration');
      expect(stateMachine.getCurrentState()).toBe('small-celebration');

      vi.advanceTimersByTime(3000);

      expect(stateMachine.getCurrentState()).toBe('idle');
    });

    it('should return to idle after big-celebration duration (5s)', () => {
      stateMachine.transition('big-celebration');
      expect(stateMachine.getCurrentState()).toBe('big-celebration');

      vi.advanceTimersByTime(5000);

      expect(stateMachine.getCurrentState()).toBe('idle');
    });

    it('should return to idle after petting duration (2s)', () => {
      stateMachine.transition('petting');
      expect(stateMachine.getCurrentState()).toBe('petting');

      vi.advanceTimersByTime(2000);

      expect(stateMachine.getCurrentState()).toBe('idle');
    });

    it('should NOT return to idle from talking state (duration 0)', () => {
      stateMachine.transition('talking');
      expect(stateMachine.getCurrentState()).toBe('talking');

      vi.advanceTimersByTime(10000);

      expect(stateMachine.getCurrentState()).toBe('talking');
    });

    it('should NOT return to idle from listening state (duration 0)', () => {
      stateMachine.transition('listening');
      expect(stateMachine.getCurrentState()).toBe('listening');

      vi.advanceTimersByTime(10000);

      expect(stateMachine.getCurrentState()).toBe('listening');
    });

    it('should NOT return to idle from idle state', () => {
      expect(stateMachine.getCurrentState()).toBe('idle');

      vi.advanceTimersByTime(10000);

      expect(stateMachine.getCurrentState()).toBe('idle');
    });

    it('should cancel scheduled idle transition when transitioning to new state', () => {
      stateMachine.transition('greeting');
      expect(stateMachine.getCurrentState()).toBe('greeting');

      // Transition before timer completes
      vi.advanceTimersByTime(1000);
      stateMachine.transition('talking');

      // Wait for what would have been the greeting timeout
      vi.advanceTimersByTime(2000);

      // Should still be in talking state, not idle
      expect(stateMachine.getCurrentState()).toBe('talking');
    });
  });

  describe('event listeners', () => {
    it('should notify listener on state change', () => {
      const listener = vi.fn();
      stateMachine.addListener(listener);

      stateMachine.transition('greeting');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({
        previousState: 'idle',
        newState: 'greeting',
        timestamp: expect.any(Number),
      });
    });

    it('should notify multiple listeners on state change', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      stateMachine.addListener(listener1);
      stateMachine.addListener(listener2);
      stateMachine.addListener(listener3);

      stateMachine.transition('talking');

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(listener3).toHaveBeenCalledTimes(1);
    });

    it('should not notify listener after removal', () => {
      const listener = vi.fn();
      stateMachine.addListener(listener);
      stateMachine.transition('greeting');

      expect(listener).toHaveBeenCalledTimes(1);

      stateMachine.removeListener(listener);
      stateMachine.transition('talking');

      expect(listener).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = vi.fn();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      stateMachine.addListener(errorListener);
      stateMachine.addListener(goodListener);

      stateMachine.transition('greeting');

      expect(errorListener).toHaveBeenCalled();
      expect(goodListener).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in state change listener:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should include correct timestamp in event', () => {
      const listener = vi.fn();
      const beforeTime = Date.now();

      stateMachine.addListener(listener);
      stateMachine.transition('greeting');

      const afterTime = Date.now();
      const event: StateChangeEvent = listener.mock.calls[0][0];

      expect(event.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(event.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should notify listener when auto-transitioning to idle', () => {
      const listener = vi.fn();
      stateMachine.addListener(listener);

      stateMachine.transition('greeting');
      expect(listener).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(2000);

      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenNthCalledWith(2, {
        previousState: 'greeting',
        newState: 'idle',
        timestamp: expect.any(Number),
      });
    });

    it('should not notify listener when transitioning to same state', () => {
      const listener = vi.fn();
      stateMachine.addListener(listener);

      stateMachine.transition('idle');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should clear all timers on cleanup', () => {
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

      stateMachine.transition('greeting');
      stateMachine.cleanup();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should prevent timer from firing after cleanup', () => {
      stateMachine.transition('greeting');
      expect(stateMachine.getCurrentState()).toBe('greeting');

      stateMachine.cleanup();
      vi.advanceTimersByTime(2000);

      // Should still be greeting, not idle, because timer was cleared
      expect(stateMachine.getCurrentState()).toBe('greeting');
    });

    it('should remove all listeners on cleanup', () => {
      const listener = vi.fn();
      stateMachine.addListener(listener);

      stateMachine.cleanup();
      stateMachine.transition('talking');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should be safe to call cleanup multiple times', () => {
      stateMachine.cleanup();
      stateMachine.cleanup();

      expect(() => stateMachine.cleanup()).not.toThrow();
    });

    it('should not throw when transitioning after cleanup', () => {
      stateMachine.cleanup();

      expect(() => stateMachine.transition('talking')).not.toThrow();
    });
  });

  describe('reset', () => {
    it('should reset state to idle', () => {
      stateMachine.transition('talking');
      expect(stateMachine.getCurrentState()).toBe('talking');

      stateMachine.reset();

      expect(stateMachine.getCurrentState()).toBe('idle');
    });

    it('should clear any scheduled timers when resetting', () => {
      stateMachine.transition('greeting');
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

      stateMachine.reset();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should notify listeners when resetting to idle from another state', () => {
      const listener = vi.fn();
      stateMachine.addListener(listener);
      stateMachine.transition('talking');

      listener.mockClear();
      stateMachine.reset();

      expect(listener).toHaveBeenCalledWith({
        previousState: 'talking',
        newState: 'idle',
        timestamp: expect.any(Number),
      });
    });

    it('should not notify listeners when already in idle state', () => {
      const listener = vi.fn();
      stateMachine.addListener(listener);

      stateMachine.reset();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle rapid transitions before timer expires', () => {
      const listener = vi.fn();
      stateMachine.addListener(listener);

      // Transition through multiple states rapidly
      stateMachine.transition('greeting');
      vi.advanceTimersByTime(500);
      stateMachine.transition('petting');
      vi.advanceTimersByTime(500);
      stateMachine.transition('small-celebration');

      // Wait for small-celebration to complete
      vi.advanceTimersByTime(3000);

      expect(stateMachine.getCurrentState()).toBe('idle');
      // Should have 4 transitions: idle->greeting, greeting->petting, petting->small-celebration, small-celebration->idle
      expect(listener).toHaveBeenCalledTimes(4);
    });

    it('should handle adding same listener multiple times', () => {
      const listener = vi.fn();
      stateMachine.addListener(listener);
      stateMachine.addListener(listener);

      stateMachine.transition('greeting');

      // Listener is added twice, so should be called twice
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('should handle removing non-existent listener', () => {
      const listener = vi.fn();
      expect(() => stateMachine.removeListener(listener)).not.toThrow();
    });

    it('should maintain state when timer expires but already in idle', () => {
      stateMachine.transition('greeting');
      vi.advanceTimersByTime(2000);

      expect(stateMachine.getCurrentState()).toBe('idle');

      // Try to advance more time
      vi.advanceTimersByTime(5000);

      expect(stateMachine.getCurrentState()).toBe('idle');
    });

    it('should handle state transitions during listener execution', () => {
      let nestedTransitionComplete = false;

      const listener = vi.fn((event: StateChangeEvent) => {
        if (event.newState === 'greeting' && !nestedTransitionComplete) {
          nestedTransitionComplete = true;
          // This transition happens during the listener callback
          stateMachine.transition('talking');
        }
      });

      stateMachine.addListener(listener);
      stateMachine.transition('greeting');

      // Should end up in talking state
      expect(stateMachine.getCurrentState()).toBe('talking');
      // Listener should be called twice: once for greeting, once for talking
      expect(listener).toHaveBeenCalledTimes(2);
    });
  });

  describe('state configuration verification', () => {
    it('should have correct duration for greeting state', () => {
      stateMachine.transition('greeting');
      vi.advanceTimersByTime(1999);
      expect(stateMachine.getCurrentState()).toBe('greeting');

      vi.advanceTimersByTime(1);
      expect(stateMachine.getCurrentState()).toBe('idle');
    });

    it('should have correct duration for small-celebration state', () => {
      stateMachine.transition('small-celebration');
      vi.advanceTimersByTime(2999);
      expect(stateMachine.getCurrentState()).toBe('small-celebration');

      vi.advanceTimersByTime(1);
      expect(stateMachine.getCurrentState()).toBe('idle');
    });

    it('should have correct duration for big-celebration state', () => {
      stateMachine.transition('big-celebration');
      vi.advanceTimersByTime(4999);
      expect(stateMachine.getCurrentState()).toBe('big-celebration');

      vi.advanceTimersByTime(1);
      expect(stateMachine.getCurrentState()).toBe('idle');
    });

    it('should have correct duration for petting state', () => {
      stateMachine.transition('petting');
      vi.advanceTimersByTime(1999);
      expect(stateMachine.getCurrentState()).toBe('petting');

      vi.advanceTimersByTime(1);
      expect(stateMachine.getCurrentState()).toBe('idle');
    });

    it('should not have auto-transition for talking state', () => {
      stateMachine.transition('talking');
      vi.advanceTimersByTime(30000);
      expect(stateMachine.getCurrentState()).toBe('talking');
    });

    it('should not have auto-transition for listening state', () => {
      stateMachine.transition('listening');
      vi.advanceTimersByTime(30000);
      expect(stateMachine.getCurrentState()).toBe('listening');
    });

    it('should not have auto-transition for idle state', () => {
      vi.advanceTimersByTime(30000);
      expect(stateMachine.getCurrentState()).toBe('idle');
    });
  });
});
