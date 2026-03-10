/**
 * Animation utilities and constants
 * Centralized animation configuration for pet movement and speed calculations
 */

/**
 * Movement speed constants for the px/s speed model.
 * Speed is defined in pixels per second; duration = maxLeft / speedPxPerS.
 * This keeps the cat's apparent speed constant regardless of panel width —
 * a wider panel simply takes proportionally longer to traverse.
 *
 * The speed curve is linear: speedPxPerS = MIN + (slider/100) * (MAX - MIN)
 * The narrow range keeps the whole spectrum in "stroll" territory:
 *   0%  → 15 px/s (slow stroll)
 *  50%  → 30 px/s (comfortable midpoint)
 * 100%  → 45 px/s (brisk walk)
 */
export const ANIMATION_CONSTANTS = {
  /** Slowest speed (slider at 0%) in pixels per second */
  MIN_SPEED_PX_PER_S: 15,
  /** Fastest speed (slider at 100%) in pixels per second */
  MAX_SPEED_PX_PER_S: 45,
  /** Fixed display size for pet sprites (pixels) - all pet GIFs render at this size */
  PET_DISPLAY_SIZE: 75,
  /** Fixed display size for celebration overlay elements (pixels) */
  CELEBRATION_DISPLAY_SIZE: 128,
} as const;

/**
 * Clamp movement speed to valid range (0-100)
 * @param speed - Raw movement speed value
 * @returns Clamped speed between 0 and 100
 */
export function clampMovementSpeed(speed: number): number {
  return Math.max(0, Math.min(100, speed));
}
