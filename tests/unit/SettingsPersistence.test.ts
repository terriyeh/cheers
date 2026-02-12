/**
 * Settings Persistence Tests
 * Tests loading and saving settings with defaults
 */

import { DEFAULT_SETTINGS } from '../../src/types/settings';
import type { ObsidianPetsSettings } from '../../src/types/settings';

describe('Settings Persistence', () => {
	describe('Default Settings Structure', () => {
		it('provides complete default settings', () => {
			expect(DEFAULT_SETTINGS).toBeDefined();
			expect(DEFAULT_SETTINGS.petName).toBe('Kit');
			expect(DEFAULT_SETTINGS.userName).toBe('');
			expect(DEFAULT_SETTINGS.hasCompletedWelcome).toBe(false);
		});

		it('default pet name passes validation', () => {
			const petName = DEFAULT_SETTINGS.petName;
			expect(petName.length).toBeGreaterThanOrEqual(1);
			expect(petName.length).toBeLessThanOrEqual(30);
			expect(/^[a-zA-Z0-9 ]+$/.test(petName)).toBe(true);
		});

		it('default user name passes validation', () => {
			const userName = DEFAULT_SETTINGS.userName;
			expect(userName.length).toBeGreaterThanOrEqual(0);
			expect(userName.length).toBeLessThanOrEqual(30);
			expect(/^[a-zA-Z0-9 ]*$/.test(userName)).toBe(true);
		});
	});

	describe('Settings Merging Logic', () => {
		it('merges empty loaded data with defaults', () => {
			const loadedData = {};
			const merged = Object.assign({}, DEFAULT_SETTINGS, loadedData);

			expect(merged.petName).toBe('Kit');
			expect(merged.userName).toBe('');
			expect(merged.hasCompletedWelcome).toBe(false);
		});

		it('overrides defaults with loaded data', () => {
			const loadedData = {
				petName: 'Buddy',
				userName: 'Alice',
				hasCompletedWelcome: true,
			};
			const merged = Object.assign({}, DEFAULT_SETTINGS, loadedData);

			expect(merged.petName).toBe('Buddy');
			expect(merged.userName).toBe('Alice');
			expect(merged.hasCompletedWelcome).toBe(true);
		});

		it('merges partial loaded data with defaults', () => {
			const loadedData = {
				petName: 'Luna',
			};
			const merged = Object.assign(
				{},
				DEFAULT_SETTINGS,
				loadedData
			) as ObsidianPetsSettings;

			expect(merged.petName).toBe('Luna');
			expect(merged.userName).toBe(''); // From defaults
			expect(merged.hasCompletedWelcome).toBe(false); // From defaults
		});

		it('handles welcome flag independently', () => {
			const loadedData = {
				hasCompletedWelcome: true,
			};
			const merged = Object.assign(
				{},
				DEFAULT_SETTINGS,
				loadedData
			) as ObsidianPetsSettings;

			expect(merged.petName).toBe('Kit'); // From defaults
			expect(merged.userName).toBe(''); // From defaults
			expect(merged.hasCompletedWelcome).toBe(true); // From loaded
		});
	});

	describe('Settings Data Integrity', () => {
		it('preserves all settings fields after merge', () => {
			const loadedData = {
				petName: 'Max',
				userName: 'Bob',
				hasCompletedWelcome: true,
			};
			const merged = Object.assign({}, DEFAULT_SETTINGS, loadedData);

			// Verify all expected fields exist
			expect(merged).toHaveProperty('petName');
			expect(merged).toHaveProperty('userName');
			expect(merged).toHaveProperty('hasCompletedWelcome');
			expect(merged).toHaveProperty('movementSpeed');

			// Verify no unexpected fields
			const expectedKeys = ['petName', 'userName', 'hasCompletedWelcome', 'movementSpeed'];
			const actualKeys = Object.keys(merged);
			expect(actualKeys.sort()).toEqual(expectedKeys.sort());
		});

		it('handles null values safely', () => {
			const loadedData = {
				petName: null as any,
				userName: null as any,
			};
			const merged = Object.assign({}, DEFAULT_SETTINGS, loadedData);

			// Null values override defaults
			expect(merged.petName).toBe(null);
			expect(merged.userName).toBe(null);
		});

		it('handles undefined values safely', () => {
			const loadedData = {
				petName: undefined,
				userName: undefined,
			};
			const merged = Object.assign({}, DEFAULT_SETTINGS, loadedData);

			// Object.assign sets properties to undefined if explicitly present
			expect(merged.petName).toBe(undefined);
			expect(merged.userName).toBe(undefined);
		});
	});

	describe('First-Run Detection', () => {
		it('detects first run with default settings', () => {
			const settings = { ...DEFAULT_SETTINGS };
			expect(settings.hasCompletedWelcome).toBe(false);
		});

		it('detects completed welcome', () => {
			const settings = {
				...DEFAULT_SETTINGS,
				hasCompletedWelcome: true,
			};
			expect(settings.hasCompletedWelcome).toBe(true);
		});

		it('detects first run even with custom names', () => {
			const settings = {
				...DEFAULT_SETTINGS,
				petName: 'Custom',
				userName: 'User',
			};
			expect(settings.hasCompletedWelcome).toBe(false);
		});
	});

	describe('Settings Validation Scenarios', () => {
		it('creates valid settings object for save', () => {
			const settings: ObsidianPetsSettings = {
				petName: 'Fluffy',
				userName: 'Charlie',
				hasCompletedWelcome: true,
			};

			// Verify structure matches interface
			expect(typeof settings.petName).toBe('string');
			expect(typeof settings.userName).toBe('string');
			expect(typeof settings.hasCompletedWelcome).toBe('boolean');
		});

		it('handles empty user name correctly', () => {
			const settings: ObsidianPetsSettings = {
				petName: 'Solo',
				userName: '',
				hasCompletedWelcome: true,
			};

			expect(settings.userName).toBe('');
			expect(settings.userName.length).toBe(0);
		});

		it('preserves exact string values', () => {
			const testName = 'Test Name 123';
			const settings: ObsidianPetsSettings = {
				petName: testName,
				userName: testName,
				hasCompletedWelcome: false,
			};

			expect(settings.petName).toBe(testName);
			expect(settings.userName).toBe(testName);
			// Verify no trimming or transformation
			expect(settings.petName.length).toBe(testName.length);
		});
	});

	describe('Settings Update Scenarios', () => {
		let settings: ObsidianPetsSettings;

		beforeEach(() => {
			settings = { ...DEFAULT_SETTINGS };
		});

		it('updates pet name while preserving other fields', () => {
			settings.petName = 'NewName';

			expect(settings.petName).toBe('NewName');
			expect(settings.userName).toBe('');
			expect(settings.hasCompletedWelcome).toBe(false);
		});

		it('updates user name while preserving other fields', () => {
			settings.userName = 'NewUser';

			expect(settings.petName).toBe('Kit');
			expect(settings.userName).toBe('NewUser');
			expect(settings.hasCompletedWelcome).toBe(false);
		});

		it('marks welcome as completed', () => {
			settings.hasCompletedWelcome = true;

			expect(settings.petName).toBe('Kit');
			expect(settings.userName).toBe('');
			expect(settings.hasCompletedWelcome).toBe(true);
		});

		it('updates all fields simultaneously', () => {
			settings.petName = 'Rover';
			settings.userName = 'David';
			settings.hasCompletedWelcome = true;

			expect(settings.petName).toBe('Rover');
			expect(settings.userName).toBe('David');
			expect(settings.hasCompletedWelcome).toBe(true);
		});
	});
});
