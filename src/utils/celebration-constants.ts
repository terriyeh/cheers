/**
 * Celebration animation constants
 *
 * Confetti rain plays for CELEBRATION_DURATION_MS, then particles are removed.
 *
 * @see src/components/Pet.svelte - spawnConfettiRain() implementation
 * @see src/pet/PetStateMachine.ts - State duration configuration
 */
export const CELEBRATION_OVERLAY_CONSTANTS = {
  /** Number of confetti particles to spawn per celebration */
  CONFETTI_COUNT: 35,
  /** Extra ms after CELEBRATION_DURATION_MS before removing confetti DOM nodes */
  CONFETTI_CLEANUP_GRACE_MS: 500,
  /**
   * Total celebration duration in milliseconds.
   * 5 seconds (confetti rain celebration duration)
   *
   * @see src/pet/PetStateMachine.ts - State machine uses this duration
   * @see tests/fixtures/petStates.ts - Test fixtures reference this value
   */
  CELEBRATION_DURATION_MS: 5000,
} as const;

/**
 * How long the status bar notification remains visible after a celebration trigger (ms).
 * Exported so tests can reference the canonical value without duplicating it.
 */
export const STATUS_BAR_NOTIFICATION_DURATION_MS = 5000;
