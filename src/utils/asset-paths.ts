/**
 * Asset path constants
 * Centralized location for all asset file paths to maintain single source of truth
 */

/**
 * Pet sprite GIF filenames
 * Each pet state has its own animated GIF file
 */
export const PET_SPRITES = {
	/** Walking animation GIF (continuous loop) */
	WALKING: 'cat-walking-6fps.gif',
	/** Petting reaction animation GIF */
	PETTING: 'cat-petting-6fps.gif',
	/** Celebration animation GIF */
	CELEBRATING: 'cat-celebrating-6fps.gif',
} as const;

/**
 * Effect sprite filenames (overlays and particles)
 */
export const EFFECT_SPRITES = {
	/** Fireworks overlay for celebrations (3-firework display pattern) */
	FIREWORKS: 'fireworks.gif',
	/** Legacy heart overlay (unused, kept for backwards compatibility) */
	HEART: 'heart.png',
} as const;

/**
 * Background scene filenames
 */
export const BACKGROUNDS = {
	/** Default garden scene with path */
	DEFAULT: 'Background_reg.png',
	/** Alternative moon world scene */
	MOON_WORLD: 'moon-world.gif',
} as const;

/**
 * Asset subdirectories within assets/
 */
export const ASSET_DIRECTORIES = {
	/** Root assets directory (pet sprites) */
	ROOT: '',
	/** Effects subdirectory (fireworks, particles) */
	EFFECTS: 'effects',
	/** Backgrounds subdirectory (scenes) */
	BACKGROUNDS: 'backgrounds',
} as const;
