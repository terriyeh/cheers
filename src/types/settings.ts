/**
 * VaultPal Plugin Settings
 */
export interface VaultPalSettings {
	/** Name of the pet companion */
	petName: string;
	/** Name of the user (what pet calls them) */
	userName: string;
	/** Whether the welcome modal has been shown */
	hasCompletedWelcome: boolean;
	/** Movement speed (0-100%): 0-60 = walking, 61-100 = running */
	movementSpeed: number;
}

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS: VaultPalSettings = {
	petName: 'Kit',
	userName: '',
	hasCompletedWelcome: false,
	movementSpeed: 50,
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
