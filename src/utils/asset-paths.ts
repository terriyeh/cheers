/**
 * Asset constants — GIFs are inlined as base64 data URLs by esbuild at build time.
 * No filesystem access is required at runtime.
 */

import walkingGif     from '../../assets/cat-walking-6fps.gif';
import pettingGif     from '../../assets/cat-petting-6fps.gif';
import celebratingGif from '../../assets/cat-celebrating-6fps.gif';
import dayBgGif       from '../../assets/backgrounds/background-day-8fps.gif';
import nightBgGif     from '../../assets/backgrounds/background-night-8fps.gif';

/**
 * Pet sprite data URLs (base64-inlined by esbuild).
 */
export const PET_SPRITES = {
	/** Walking animation GIF (continuous loop) */
	WALKING: walkingGif,
	/** Petting reaction animation GIF */
	PETTING: pettingGif,
	/** Celebration animation GIF */
	CELEBRATING: celebratingGif,
} as const;

/**
 * A background scene entry. All scene-specific values travel together
 * so they can never get out of sync when adding new themes.
 */
export type Background = {
	readonly src: string;
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
 * Each entry bundles the data URL with the sky color that fills the container
 * above the tiled image, keeping the scene seamless at any panel height.
 */
export const BACKGROUNDS = {
	/** Daytime scene (6am–6pm) */
	DAY: {
		src: dayBgGif,
		skyColor: '#98BAFF',
		displayWidth: 400,
		displayHeight: 270,
		petBottom: 10,
	},
	/** Nighttime scene (6pm–6am) */
	NIGHT: {
		src: nightBgGif,
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
