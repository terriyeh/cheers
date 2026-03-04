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
 * A background scene entry: the GIF filename and its matching sky fill color.
 * Adding a new season/theme is a single entry here — file and skyColor travel together
 * so they can never get out of sync.
 */
export type Background = {
	readonly file: string;
	readonly skyColor: string;
};

/**
 * Background scene definitions.
 * Each entry bundles the GIF filename with the sky color that fills the container
 * above the tiled image, keeping the scene seamless at any panel height.
 */
export const BACKGROUNDS = {
	/** Daytime scene (6am–6pm) */
	DAY: {
		file: 'background-day-8fps.gif',
		skyColor: '#98BAFF',
	},
	/** Nighttime scene (6pm–6am) */
	NIGHT: {
		file: 'background-night-8fps.gif',
		skyColor: '#4c4f85',
	},
} as const satisfies Record<string, Background>;

/**
 * Returns the background entry (file + skyColor) for the current (or provided) hour.
 * Day = 6am–6pm (hours 6–17), Night = everything else.
 */
export function getTimeOfDayBackground(hour: number = new Date().getHours()): Background {
	return (hour >= 6 && hour < 18) ? BACKGROUNDS.DAY : BACKGROUNDS.NIGHT;
}

/**
 * Asset subdirectories within assets/
 */
export const ASSET_DIRECTORIES = {
	/** Root assets directory (pet sprites) */
	ROOT: '',
	/** Backgrounds subdirectory (scenes) */
	BACKGROUNDS: 'backgrounds',
} as const;
