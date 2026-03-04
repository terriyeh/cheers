/**
 * Pet state types and interfaces for Cheers!
 */

/**
 * All possible states for the pet companion
 *
 * Movement state (continuous):
 * - walking: Default state with neutral expression, continuous movement
 *
 * Interaction states (temporary, return to walking):
 * - celebration: Happy expression when celebrating vault activities (confetti rain)
 * - petting: Content expression when user interacts with pet (hearts overlay)
 *
 * Note: Movement speed (0-100%) is controlled by CSS animation-duration,
 * not by separate states. All states use the same walking animation at different speeds.
 */
export type PetState =
  | 'walking'
  | 'celebration'
  | 'petting';

/**
 * Movement speed percentage (0-100)
 * Controls horizontal translation speed via CSS animation-duration
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
