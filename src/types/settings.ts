/**
 * VaultPal Plugin Settings
 */
export interface ObsidianPetsSettings {
	/** Name of the pet companion */
	petName: string;
	/** Name of the user (what pet calls them) */
	userName: string;
	/** Whether the welcome modal has been shown */
	hasCompletedWelcome: boolean;
	/** Movement speed (0-100%): 0-60 = walking, 61-100 = running */
	movementSpeed: number;
	/** Celebration settings */
	celebrations: {
		/** Celebrate when a new note is created */
		onNoteCreate: boolean;
		/** Celebrate when a task is completed */
		onTaskComplete: boolean;
		/** Celebrate when a link is created */
		onLinkCreate: boolean;
		/** Celebrate when word count milestones are reached */
		onWordMilestone: boolean;
		/** Word count thresholds for celebrations */
		wordMilestones: number[];
	};
}

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS: ObsidianPetsSettings = {
	petName: 'Kit',
	userName: '',
	hasCompletedWelcome: false,
	movementSpeed: 50,
	celebrations: {
		onNoteCreate: true,
		onTaskComplete: true,
		onLinkCreate: true,
		onWordMilestone: true,
		wordMilestones: [100, 500, 1000, 3500, 5000],
	},
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
