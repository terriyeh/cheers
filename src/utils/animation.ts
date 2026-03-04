/**
 * Animation utilities and constants
 * Centralized animation configuration for pet movement and speed calculations
 */

/**
 * Movement speed constants for linear scaling
 * These define the duration range for full traversal across the reference container width
 */
export const ANIMATION_CONSTANTS = {
  /** Slowest speed (0%) - 33 seconds for full traversal */
  MAX_DURATION: 33,
  /** Fastest speed (100%) - 6 seconds for full traversal */
  MIN_DURATION: 6,
  /** Reference container width for speed calibration (pixels) */
  REFERENCE_CONTAINER_WIDTH: 800,
  /** Default pet width (pixels) - used as fallback before GIF loads */
  DEFAULT_PET_WIDTH: 100,
  /** Fixed display size for pet sprites (pixels) - all pet GIFs render at this size */
  PET_DISPLAY_SIZE: 100,
  /** Fixed display size for celebration overlay elements (pixels) */
  CELEBRATION_DISPLAY_SIZE: 128,
} as const;

/**
 * GIF animation duration constants
 * Note: GIF frame animation is handled by the browser
 */
export const GIF_ANIMATION_CONSTANTS = {
  /** Slowest GIF playback (0% speed) - 2 seconds per cycle */
  MAX_DURATION: 2,
  /** Fastest GIF playback (100% speed) - 1 second per cycle */
  MIN_DURATION: 1,
} as const;

/**
 * Clamp movement speed to valid range (0-100)
 * @param speed - Raw movement speed value
 * @returns Clamped speed between 0 and 100
 */
export function clampMovementSpeed(speed: number): number {
  return Math.max(0, Math.min(100, speed));
}

/**
 * Calculate animation duration for GIF playback based on movement speed
 * Linear scaling: 0% = 2s (slowest), 100% = 1s (fastest)
 * Note: GIF animation is handled by the browser, this is for CSS animation-duration
 * @param speed - Movement speed (0-100)
 * @returns Animation duration in seconds
 */
export function calculateGifAnimationDuration(speed: number): number {
  const clampedSpeed = clampMovementSpeed(speed);
  const { MAX_DURATION, MIN_DURATION } = GIF_ANIMATION_CONSTANTS;
  return MAX_DURATION - (clampedSpeed / 100) * (MAX_DURATION - MIN_DURATION);
}

/**
 * Calculate base movement speed in pixels per second
 * Uses reference container width to ensure consistent speed regardless of actual container size
 * @param speed - Movement speed (0-100)
 * @param petWidth - Width of the pet sprite in pixels
 * @returns Speed in pixels per second
 */
export function calculateSpeedInPixelsPerSecond(speed: number, petWidth: number = ANIMATION_CONSTANTS.DEFAULT_PET_WIDTH): number {
  const clampedSpeed = clampMovementSpeed(speed);
  const { MAX_DURATION, MIN_DURATION, REFERENCE_CONTAINER_WIDTH } = ANIMATION_CONSTANTS;

  // Calculate reference duration at reference container width
  const referenceDuration = MAX_DURATION - (clampedSpeed / 100) * (MAX_DURATION - MIN_DURATION);

  // Calculate distance at reference width
  const referenceDistance = REFERENCE_CONTAINER_WIDTH - petWidth;

  // Return speed in px/s
  return referenceDistance / referenceDuration;
}

/**
 * Calculate movement duration for a specific container width
 * Maintains constant px/s speed across different container widths
 * @param speed - Movement speed (0-100)
 * @param containerWidth - Container width in pixels
 * @param petWidth - Width of the pet sprite in pixels
 * @returns Movement duration in seconds
 */
export function calculateMovementDuration(
  speed: number,
  containerWidth: number,
  petWidth: number = ANIMATION_CONSTANTS.DEFAULT_PET_WIDTH
): number {
  const speedInPixelsPerSecond = calculateSpeedInPixelsPerSecond(speed, petWidth);
  const actualDistance = containerWidth - petWidth;

  // Prevent division by zero - fallback to slowest speed
  if (speedInPixelsPerSecond <= 0 || actualDistance <= 0) {
    return ANIMATION_CONSTANTS.MAX_DURATION;
  }

  return actualDistance / speedInPixelsPerSecond;
}
