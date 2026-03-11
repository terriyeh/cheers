/**
 * Unit tests for PetStateMachine
 * Tests state transitions, timer management, event listeners, and cleanup
 */

import { vi } from 'vitest';
import { PetStateMachine } from '../../src/pet/PetStateMachine';
import type { PetState, StateChangeEvent } from '../../src/types/pet';
import { CELEBRATION_OVERLAY_CONSTANTS } from '../../src/utils/celebration-constants';

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
    it('should initialize in walking state by default', () => {
      expect(stateMachine.getCurrentState()).toBe('walking');
    });

    it('should have no listeners on initialization', () => {
      const listener = vi.fn();
      stateMachine.addListener(listener);
      stateMachine.removeListener(listener);
      stateMachine.transition('celebration');
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('state transitions', () => {
    it('should transition from walking to celebration', () => {
      const result = stateMachine.transition('celebration');
      expect(result).toBe(true);
      expect(stateMachine.getCurrentState()).toBe('celebration');
    });

    it('should transition through all valid states', () => {
      const states: PetState[] = [
        'celebration',
        'petting',
        'walking',
      ];

      states.forEach((state) => {
        const result = stateMachine.transition(state);
        expect(result).toBe(true);
        expect(stateMachine.getCurrentState()).toBe(state);
      });
    });

    it('should return false when transitioning to the same state', () => {
      expect(stateMachine.getCurrentState()).toBe('walking');
      const result = stateMachine.transition('walking');
      expect(result).toBe(false);
      expect(stateMachine.getCurrentState()).toBe('walking');
    });

    it('should handle rapid state transitions correctly', () => {
      stateMachine.transition('celebration');
      stateMachine.transition('petting');
      expect(stateMachine.getCurrentState()).toBe('petting');
    });

    it('should clear previous timer when transitioning to a new state', () => {
      stateMachine.transition('celebration');
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

      stateMachine.transition('petting');

      expect(clearTimeoutSpy).toHaveBeenCalled();
      expect(stateMachine.getCurrentState()).toBe('petting');
    });
  });

  describe('automatic return to walking', () => {
    it('should return to walking after celebration duration (CELEBRATION_OVERLAY_CONSTANTS.CELEBRATION_DURATION_MSms)', () => {
      stateMachine.transition('celebration');
      expect(stateMachine.getCurrentState()).toBe('celebration');

      vi.advanceTimersByTime(CELEBRATION_OVERLAY_CONSTANTS.CELEBRATION_DURATION_MS);

      expect(stateMachine.getCurrentState()).toBe('walking');
    });

    it('should return to walking after petting duration (2000ms)', () => {
      stateMachine.transition('petting');
      expect(stateMachine.getCurrentState()).toBe('petting');

      vi.advanceTimersByTime(2000);

      expect(stateMachine.getCurrentState()).toBe('walking');
    });

    it('should NOT auto-return from walking state', () => {
      expect(stateMachine.getCurrentState()).toBe('walking');

      vi.advanceTimersByTime(10000);

      expect(stateMachine.getCurrentState()).toBe('walking');
    });

    it('should cancel scheduled walking transition when transitioning to new state', () => {
      stateMachine.transition('celebration');
      expect(stateMachine.getCurrentState()).toBe('celebration');

      // Transition before timer completes
      vi.advanceTimersByTime(1000);
      stateMachine.transition('petting');

      // Wait for petting duration (2000ms)
      vi.advanceTimersByTime(2000);

      // Should have returned to walking after petting duration
      expect(stateMachine.getCurrentState()).toBe('walking');
    });
  });

  describe('event listeners', () => {
    it('should notify listener on state change', () => {
      const listener = vi.fn();
      stateMachine.addListener(listener);

      stateMachine.transition('celebration');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({
        previousState: 'walking',
        newState: 'celebration',
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

      stateMachine.transition('petting');

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(listener3).toHaveBeenCalledTimes(1);
    });

    it('should not notify listener after removal', () => {
      const listener = vi.fn();
      stateMachine.addListener(listener);
      stateMachine.transition('celebration');

      expect(listener).toHaveBeenCalledTimes(1);

      stateMachine.removeListener(listener);
      stateMachine.transition('petting');

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

      stateMachine.transition('celebration');

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
      stateMachine.transition('celebration');

      const afterTime = Date.now();
      const event: StateChangeEvent = listener.mock.calls[0][0];

      expect(event.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(event.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should notify listener when auto-transitioning to walking', () => {
      const listener = vi.fn();
      stateMachine.addListener(listener);

      stateMachine.transition('celebration');
      expect(listener).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(CELEBRATION_OVERLAY_CONSTANTS.CELEBRATION_DURATION_MS);

      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenNthCalledWith(2, {
        previousState: 'celebration',
        newState: 'walking',
        timestamp: expect.any(Number),
      });
    });

    it('should not notify listener when transitioning to same state', () => {
      const listener = vi.fn();
      stateMachine.addListener(listener);

      stateMachine.transition('walking');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should clear all timers on cleanup', () => {
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

      stateMachine.transition('celebration');
      stateMachine.cleanup();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should prevent timer from firing after cleanup', () => {
      stateMachine.transition('celebration');
      expect(stateMachine.getCurrentState()).toBe('celebration');

      stateMachine.cleanup();
      vi.advanceTimersByTime(CELEBRATION_OVERLAY_CONSTANTS.CELEBRATION_DURATION_MS);

      // Should still be celebration, not walking, because timer was cleared
      expect(stateMachine.getCurrentState()).toBe('celebration');
    });

    it('should remove all listeners on cleanup', () => {
      const listener = vi.fn();
      stateMachine.addListener(listener);

      stateMachine.cleanup();
      stateMachine.transition('petting');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should be safe to call cleanup multiple times', () => {
      stateMachine.cleanup();
      stateMachine.cleanup();

      expect(() => stateMachine.cleanup()).not.toThrow();
    });

    it('should not throw when transitioning after cleanup', () => {
      stateMachine.cleanup();

      expect(() => stateMachine.transition('petting')).not.toThrow();
    });
  });

  describe('reset', () => {
    it('should reset state to walking', () => {
      stateMachine.transition('petting');
      expect(stateMachine.getCurrentState()).toBe('petting');

      stateMachine.reset();

      expect(stateMachine.getCurrentState()).toBe('walking');
    });

    it('should clear any scheduled timers when resetting', () => {
      stateMachine.transition('celebration');
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

      stateMachine.reset();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should notify listeners when resetting to walking from another state', () => {
      const listener = vi.fn();
      stateMachine.addListener(listener);
      stateMachine.transition('petting');

      listener.mockClear();
      stateMachine.reset();

      expect(listener).toHaveBeenCalledWith({
        previousState: 'petting',
        newState: 'walking',
        timestamp: expect.any(Number),
      });
    });

    it('should not notify listeners when already in walking state', () => {
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
      stateMachine.transition('celebration');
      vi.advanceTimersByTime(500);
      stateMachine.transition('petting');

      // Wait for petting to complete
      vi.advanceTimersByTime(2000);

      expect(stateMachine.getCurrentState()).toBe('walking');
      // Should have 3 transitions: walking->celebration, celebration->petting, petting->walking
      expect(listener).toHaveBeenCalledTimes(3);
    });

    it('should handle adding same listener multiple times', () => {
      const listener = vi.fn();
      stateMachine.addListener(listener);
      stateMachine.addListener(listener);

      stateMachine.transition('celebration');

      // Listener is added twice, so should be called twice
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('should handle removing non-existent listener', () => {
      const listener = vi.fn();
      expect(() => stateMachine.removeListener(listener)).not.toThrow();
    });

    it('should maintain state when timer expires but already in walking', () => {
      stateMachine.transition('celebration');
      vi.advanceTimersByTime(CELEBRATION_OVERLAY_CONSTANTS.CELEBRATION_DURATION_MS);

      expect(stateMachine.getCurrentState()).toBe('walking');

      // Try to advance more time
      vi.advanceTimersByTime(5000);

      expect(stateMachine.getCurrentState()).toBe('walking');
    });

    it('should handle state transitions during listener execution', () => {
      let nestedTransitionComplete = false;

      const listener = vi.fn((event: StateChangeEvent) => {
        if (event.newState === 'celebration' && !nestedTransitionComplete) {
          nestedTransitionComplete = true;
          // This transition happens during the listener callback
          stateMachine.transition('petting');
        }
      });

      stateMachine.addListener(listener);
      stateMachine.transition('celebration');

      // Should end up in petting state
      expect(stateMachine.getCurrentState()).toBe('petting');
      // Listener should be called twice: once for celebration, once for petting
      expect(listener).toHaveBeenCalledTimes(2);
    });
  });

  describe('state configuration verification', () => {
    it('should have correct duration for celebration state (CELEBRATION_OVERLAY_CONSTANTS.CELEBRATION_DURATION_MSms)', () => {
      stateMachine.transition('celebration');
      vi.advanceTimersByTime(CELEBRATION_OVERLAY_CONSTANTS.CELEBRATION_DURATION_MS - 1);
      expect(stateMachine.getCurrentState()).toBe('celebration');

      vi.advanceTimersByTime(1);
      expect(stateMachine.getCurrentState()).toBe('walking');
    });

    it('should have correct duration for petting state (2000ms)', () => {
      stateMachine.transition('petting');
      vi.advanceTimersByTime(1999);
      expect(stateMachine.getCurrentState()).toBe('petting');

      vi.advanceTimersByTime(1);
      expect(stateMachine.getCurrentState()).toBe('walking');
    });

    it('should not have auto-transition for walking state', () => {
      vi.advanceTimersByTime(30000);
      expect(stateMachine.getCurrentState()).toBe('walking');
    });
  });

  describe('returnTarget parameter', () => {
    it('should default to walking when returnTarget is not specified', () => {
      stateMachine.transition('celebration');
      expect(stateMachine.getCurrentState()).toBe('celebration');

      // Transition to petting without returnTarget
      stateMachine.transition('petting');
      expect(stateMachine.getCurrentState()).toBe('petting');

      // After petting duration (2000ms), should return to 'walking' (default)
      vi.advanceTimersByTime(2000);
      expect(stateMachine.getCurrentState()).toBe('walking');
    });

    it('should clear previous returnTarget when transitioning manually', () => {
      // Set up petting with returnTarget = 'walking'
      stateMachine.transition('petting', 'walking');
      expect(stateMachine.getCurrentState()).toBe('petting');

      // Manually transition before timer expires
      vi.advanceTimersByTime(1000);
      stateMachine.transition('celebration');
      expect(stateMachine.getCurrentState()).toBe('celebration');

      // Wait for celebration to complete (CELEBRATION_OVERLAY_CONSTANTS.CELEBRATION_DURATION_MSms)
      vi.advanceTimersByTime(CELEBRATION_OVERLAY_CONSTANTS.CELEBRATION_DURATION_MS);

      // Should have returned to walking after celebration completed
      expect(stateMachine.getCurrentState()).toBe('walking');
    });
  });

  describe('negative cases', () => {
    it('should handle invalid state gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = stateMachine.transition('invalid-state' as PetState);

      expect(result).toBe(false);
      expect(stateMachine.getCurrentState()).toBe('walking');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid pet state: invalid-state');

      consoleErrorSpy.mockRestore();
    });

    it('should reject transition to empty string state', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = stateMachine.transition('' as PetState);

      expect(result).toBe(false);
      expect(stateMachine.getCurrentState()).toBe('walking');

      consoleErrorSpy.mockRestore();
    });

    it('should reject transition to null/undefined state', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = stateMachine.transition(null as unknown as PetState);

      expect(result).toBe(false);
      expect(stateMachine.getCurrentState()).toBe('walking');

      consoleErrorSpy.mockRestore();
    });
  });
});
