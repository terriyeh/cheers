/**
 * Pet state types and interfaces for Vault Pal
 */

/**
 * All possible states for the pet companion
 *
 * States are triggered by user actions:
 * - idle: Default breathing animation (loops indefinitely)
 * - greeting: When user opens daily note
 * - talking: When pet asks a question
 * - listening: When user is typing/answering
 * - small-celebration: When user completes daily note (3s duration)
 * - big-celebration: When user hits milestone streak (5s duration)
 * - petting: When user clicks the pet (2s duration)
 */
export type PetState =
  | 'idle'
  | 'greeting'
  | 'talking'
  | 'listening'
  | 'small-celebration'
  | 'big-celebration'
  | 'petting';

/**
 * Configuration for pet state machine behavior
 */
export interface PetStateConfig {
  /** Duration in ms (0 = infinite loop until triggered) */
  duration: number;
  /** Whether this state auto-returns to idle after duration */
  returnsToIdle: boolean;
}

/**
 * Map of state configurations
 */
export type PetStateConfigMap = Record<PetState, PetStateConfig>;

/**
 * Event data for state change callbacks
 */
export interface StateChangeEvent {
  previousState: PetState;
  newState: PetState;
  timestamp: number;
}

/**
 * Callback function type for state change listeners
 */
export type StateChangeListener = (event: StateChangeEvent) => void;
