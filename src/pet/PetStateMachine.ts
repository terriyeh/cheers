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
  private currentState: PetState = 'idle';
  private listeners: StateChangeListener[] = [];
  private transitionTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly stateConfigs: PetStateConfigMap;

  constructor() {
    this.stateConfigs = this.initializeStateConfigs();
  }

  /**
   * Initialize state configurations
   * - Idle loops indefinitely (duration: 0)
   * - Temporary states return to idle after their duration
   */
  private initializeStateConfigs(): PetStateConfigMap {
    return {
      idle: {
        duration: 0, // Loops indefinitely until triggered
        returnsToIdle: false,
      },
      greeting: {
        duration: 2000, // 2 seconds
        returnsToIdle: true,
      },
      talking: {
        duration: 0, // Stays until user responds
        returnsToIdle: false,
      },
      listening: {
        duration: 0, // Stays while user is typing
        returnsToIdle: false,
      },
      'small-celebration': {
        duration: 3000, // 3 seconds
        returnsToIdle: true,
      },
      'big-celebration': {
        duration: 5000, // 5 seconds
        returnsToIdle: true,
      },
      petting: {
        duration: 2000, // 2 seconds
        returnsToIdle: true,
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
   * @returns true if transition occurred, false if already in that state
   * @throws Error if state is invalid
   */
  transition(newState: PetState): boolean {
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

    // If state has a duration and returns to idle, schedule return
    const config = this.stateConfigs[newState];
    if (config.duration > 0 && config.returnsToIdle) {
      this.scheduleReturnToIdle(config.duration);
    }

    return true;
  }

  /**
   * Schedule automatic return to idle state after duration
   */
  private scheduleReturnToIdle(duration: number): void {
    this.transitionTimer = setTimeout(() => {
      this.transition('idle');
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
   * Reset to idle state
   */
  reset(): void {
    this.transition('idle');
  }
}
