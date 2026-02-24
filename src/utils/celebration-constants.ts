/**
 * Celebration overlay animation constants
 *
 * These values define the 3-firework display pattern used during celebration state.
 * The celebration overlay appears when the user completes vault activities (tasks, notes, etc.)
 * and shows three staggered fireworks in a triangular layout.
 *
 * @see src/components/Pet.svelte - Visual implementation
 * @see src/pet/PetStateMachine.ts - State duration configuration
 */

/**
 * Celebration overlay positioning and animation constants
 *
 * Visual Layout:
 * - Center firework: Top position, horizontally centered
 * - Left firework: Lower position, 200px left of center
 * - Right firework: Lower position, 200px right of center
 *
 * Animation Sequence:
 * 1. Center firework fades in immediately (0s)
 * 2. Left firework fades in 0.5s later
 * 3. Right firework fades in 1.0s later (0.5s after left)
 *
 * Design Rationale:
 * - 80px/120px vertical positions: Creates visual depth (40px offset)
 * - 200px horizontal spacing: Prevents overlap on typical viewport widths (600px+)
 * - 0.5s stagger interval: Fast enough to feel connected, slow enough to register individually
 * - 0.3s fade duration: Quick reveal without abruptness
 */
export const CELEBRATION_OVERLAY_CONSTANTS = {
  // Firework sprite dimensions
  /** Actual GIF width (native asset size) */
  FIREWORK_GIF_WIDTH: 256,
  /** Actual GIF height (native asset size) */
  FIREWORK_GIF_HEIGHT: 256,
  /** Display width in CSS (scaled down from 256px for better layout) */
  FIREWORK_DISPLAY_WIDTH: 128,
  /** Display height in CSS (scaled down from 256px for better layout) */
  FIREWORK_DISPLAY_HEIGHT: 128,
  /** Half display width - used for centering calculations (128 / 2) */
  HALF_DISPLAY_WIDTH: 64,

  // Vertical positioning (creates visual hierarchy with depth)
  /** Top position for center firework - upper third of typical viewport */
  CENTER_FIREWORK_TOP_PX: 80,
  /** Top position for left/right fireworks - middle third (40px creates depth) */
  SIDE_FIREWORK_TOP_PX: 120,
  /** Vertical offset between center and side fireworks (120 - 80) */
  VERTICAL_OFFSET_PX: 40,

  // Horizontal positioning (prevents overlap, maintains visibility)
  /** Distance from viewport center to side fireworks - prevents overlap on 600px+ screens */
  HORIZONTAL_SPACING_PX: 200,

  // Animation timing (staggered reveal for visual impact)
  /** Fade-in animation duration for each firework */
  FADE_IN_DURATION_S: 0.3,
  /** Delay interval between each firework appearance */
  STAGGER_INTERVAL_S: 0.5,
  /** Center firework appears immediately */
  CENTER_DELAY_S: 0,
  /** Left firework delay (0 + stagger) */
  LEFT_DELAY_S: 0.5,
  /** Right firework delay (0 + 2 × stagger) */
  RIGHT_DELAY_S: 1.0,

  // Total celebration duration
  /**
   * Total celebration animation duration in milliseconds
   * Matches the fireworks GIF loop duration (4.32 seconds)
   *
   * @see src/pet/PetStateMachine.ts - State machine uses this duration
   * @see tests/fixtures/petStates.ts - Test fixtures reference this value
   */
  CELEBRATION_DURATION_MS: 4320,
} as const;

/**
 * Type-safe access to celebration constants
 */
export type CelebrationOverlayConstants = typeof CELEBRATION_OVERLAY_CONSTANTS;

/**
 * How long the status bar notification remains visible after a celebration trigger (ms).
 * Exported so tests can reference the canonical value without duplicating it.
 */
export const STATUS_BAR_NOTIFICATION_DURATION_MS = 3000;
