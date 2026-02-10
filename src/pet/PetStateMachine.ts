import type {
  PetState,
  PetStateConfigMap,
  StateChangeEvent,
  StateChangeListener,
} from '../types/pet';

/**
 * Pet State Machine
 * Manages state transitions and behaviors for the pet companion
 */
export class PetStateMachine {
  private currentState: PetState = 'walking';
  private listeners: StateChangeListener[] = [];
  private transitionTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly stateConfigs: PetStateConfigMap;

  constructor() {
    this.stateConfigs = this.initializeStateConfigs();
  }

  /**
   * Initialize state configurations
   * - Walking/running are continuous until interrupted (duration: 0)
   * - Temporary states return to walking after their duration
   */
  private initializeStateConfigs(): PetStateConfigMap {
    return {
      walking: {
        duration: 0, // Continuous until interrupted
        returnsToIdle: false,
      },
      running: {
        duration: 0, // Continuous until interrupted
        returnsToIdle: false,
      },
      greeting: {
        duration: 2000, // 2 seconds
        returnsToIdle: true, // Returns to walking
      },
      celebration: {
        duration: 3000, // 3 seconds
        returnsToIdle: true, // Returns to walking
      },
      petting: {
        duration: 2000, // 2 seconds (reduced from 5s - less awkward pause)
        returnsToIdle: true, // Returns to walking
      },
      sleeping: {
        duration: 2000, // 2 seconds
        returnsToIdle: true, // Returns to walking
      },
    };
  }

  /**
   * Get the current pet state
   */
  getCurrentState(): PetState {
    return this.currentState;
  }

  /**
   * Validate that a state is a valid PetState
   * @param state - The state to validate
   * @returns true if state is valid
   */
  private isValidState(state: string): state is PetState {
    return state in this.stateConfigs;
  }

  /**
   * Transition to a new state
   * @param newState - The state to transition to
   * @param returnTarget - Optional state to return to after duration (defaults to 'idle')
   * @returns true if transition occurred, false if already in that state
   * @throws Error if state is invalid
   */
  transition(newState: PetState, returnTarget?: PetState): boolean {
    // Validate state at runtime
    if (!this.isValidState(newState)) {
      console.error(`Invalid pet state: ${newState}`);
      return false;
    }

    if (newState === this.currentState) {
      return false;
    }

    const previousState = this.currentState;
    this.currentState = newState;

    // Clear any existing timer
    this.clearTransitionTimer();

    // Notify listeners
    this.notifyListeners({
      previousState,
      newState,
      timestamp: Date.now(),
    });

    // If state has a duration and returns to walking, schedule return
    const config = this.stateConfigs[newState];
    if (config.duration > 0 && config.returnsToIdle) {
      const target = returnTarget || 'walking';
      this.scheduleReturnTo(config.duration, target);
    }

    return true;
  }

  /**
   * Schedule automatic return to target state after duration
   * @param duration - Duration in milliseconds before returning
   * @param targetState - State to return to after duration (usually 'idle')
   */
  private scheduleReturnTo(duration: number, targetState: PetState): void {
    this.transitionTimer = setTimeout(() => {
      this.transition(targetState);
    }, duration);
  }

  /**
   * Clear the transition timer
   */
  private clearTransitionTimer(): void {
    if (this.transitionTimer !== null) {
      clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }
  }

  /**
   * Add a state change listener
   */
  addListener(listener: StateChangeListener): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a state change listener
   */
  removeListener(listener: StateChangeListener): void {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  /**
   * Notify all listeners of a state change
   */
  private notifyListeners(event: StateChangeEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in state change listener:', error);
      }
    }
  }

  /**
   * Clean up resources and stop all timers
   */
  cleanup(): void {
    this.clearTransitionTimer();
    this.listeners = [];
  }

  /**
   * Reset to walking state
   */
  reset(): void {
    this.transition('walking');
  }
}
