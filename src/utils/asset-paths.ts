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
 * A background scene entry. All scene-specific values travel together
 * so they can never get out of sync when adding new themes.
 */
export type Background = {
	readonly file: string;
	/** Sky fill color — fills the container above the tiled GIF for seamless extension */
	readonly skyColor: string;
	/** Display width of one background tile (px) */
	readonly displayWidth: number;
	/** Display height of one background tile (px) */
	readonly displayHeight: number;
	/** CSS bottom offset (px) aligning the pet sprite with the walking path */
	readonly petBottom: number;
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
		displayWidth: 400,
		displayHeight: 270,
		petBottom: 10,
	},
	/** Nighttime scene (6pm–6am) */
	NIGHT: {
		file: 'background-night-8fps.gif',
		skyColor: '#4c4f85',
		displayWidth: 400,
		displayHeight: 270,
		petBottom: 10,
	},
} as const satisfies Record<string, Background>;

/** Maps theme string keys to their Background entries. */
const BACKGROUND_FOR_THEME: Record<'day' | 'night', Background> = {
	day: BACKGROUNDS.DAY,
	night: BACKGROUNDS.NIGHT,
};

/**
 * Returns the background entry for the given theme.
 * Adding a new theme requires only a new entry in BACKGROUNDS and BACKGROUND_FOR_THEME.
 */
export function getBackgroundForTheme(theme: 'day' | 'night'): Background {
	return BACKGROUND_FOR_THEME[theme];
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
