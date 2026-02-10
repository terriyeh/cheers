/**
 * Pet state types and interfaces for Vault Pal
 */

/**
 * All possible states for the pet companion
 *
 * Movement states (continuous):
 * - walking: Default state, continuous movement (speed 0-60%)
 * - running: High-speed movement (speed 61-100%)
 *
 * Interaction states (temporary, return to walking):
 * - greeting: When pet view opens (2s duration)
 * - celebration: When celebrating vault activities (3s duration)
 * - petting: When celebrating major milestones (5s duration)
 * - sleeping: When user clicks/taps the pet (2s duration)
 */
export type PetState =
  | 'walking'
  | 'running'
  | 'greeting'
  | 'celebration'
  | 'petting'
  | 'sleeping';

/**
 * Movement speed percentage (0-100)
 * - 0-60: Walking speed (Row 3 sprite)
 * - 61-100: Running speed (Row 4 sprite)
 */
export type MovementSpeed = number;

/**
 * Configuration for pet state machine behavior
 */
export interface PetStateConfig {
  /** Duration in ms (0 = continuous until interrupted) */
  duration: number;
  /** Whether this state auto-returns to walking after duration */
  returnsToWalking: boolean;
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
