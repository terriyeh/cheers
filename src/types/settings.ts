/**
 * Persisted daily writing progress.
 * Stored as the `daily` key in data.json alongside settings fields.
 */
export interface DailyWordData {
	/** ISO date string (e.g. "2026-02-23") — resets counter when date changes */
	date: string;
	/** Accumulated word delta written today across all files */
	wordsAddedToday: number;
	/** Whether the daily goal celebration has already fired today */
	goalCelebrated: boolean;
	/** Number of markdown notes created today */
	notesCreatedToday: number;
	/** Number of tasks completed (checked off) today */
	tasksCompletedToday: number;
	/** Number of links created today */
	linksCreatedToday: number;
}

/**
 * Cheers Plugin Settings
 */
export interface CheersSettings {
	/** Name of the pet companion */
	petName: string;
	/** Name of the user (what the pet calls them) — reserved for future personalised speech; no UI yet */
	userName: string;
	/** Movement speed (0-100%) */
	movementSpeed: number;
	/** Celebration settings */
	celebrations: {
		/** Celebrate when a new note is created */
		onNoteCreate: boolean;
		/** Celebrate when a task is completed */
		onTaskComplete: boolean;
		/** Celebrate when a link is created */
		onLinkCreate: boolean;
		/** Celebrate when word count goals are reached (daily or per-note) */
		onWordGoal: boolean;
		/** Daily word goal: words to write today across vault. null = not set. */
		dailyWordGoal: number | null;
	};
	/** Dashboard color theme: 'warm' (amber/orange) or 'cool' (blue/teal) */
	dashboardColorMode: 'warm' | 'cool';
	/** Background scene: 'day' or 'night' */
	backgroundTheme: 'day' | 'night';
}

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS: CheersSettings = {
	petName: 'Mochi',
	userName: '',
	movementSpeed: 50,
	celebrations: {
		onNoteCreate: true,
		onTaskComplete: true,
		onLinkCreate: true,
		onWordGoal: true,
		dailyWordGoal: 1667,
	},
	dashboardColorMode: 'warm',
	backgroundTheme: 'day',
};

/**
 * Validation rules for settings
 */
export const VALIDATION_RULES = {
	petName: {
		minLength: 1,
		maxLength: 30,
		pattern: /^[a-zA-Z0-9 ]+$/, // Alphanumeric + spaces only
		errorMessage: 'Pet name must be 1-30 characters (letters, numbers, spaces only)',
	},
	userName: {
		minLength: 0, // Can be empty
		maxLength: 30,
		pattern: /^[a-zA-Z0-9 ]*$/, // Alphanumeric + spaces only (optional)
		errorMessage: 'Your name must be 0-30 characters (letters, numbers, spaces only)',
	},
	movementSpeed: {
		min: 0,
		max: 100,
		errorMessage: 'Movement speed must be between 0 and 100',
	},
} as const;
