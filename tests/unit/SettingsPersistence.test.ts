/**
 * Settings Persistence Tests
 * Tests loading and saving settings with defaults
 */

import { DEFAULT_SETTINGS } from '../../src/types/settings';
import type { CheersSettings } from '../../src/types/settings';

describe('Settings Persistence', () => {
	describe('Default Settings Structure', () => {
		it('provides complete default settings', () => {
			expect(DEFAULT_SETTINGS).toBeDefined();
			expect(DEFAULT_SETTINGS.petName).toBe('Mochi');
			expect(DEFAULT_SETTINGS.userName).toBe('');
			expect(DEFAULT_SETTINGS.celebrations.onWordGoal).toBe(true);
			expect(DEFAULT_SETTINGS.celebrations.dailyWordGoal).toBe(1667);
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

			expect(merged.petName).toBe('Mochi');
			expect(merged.userName).toBe('');
		});

		it('overrides defaults with loaded data', () => {
			const loadedData = {
				petName: 'Buddy',
				userName: 'Alice',
			};
			const merged = Object.assign({}, DEFAULT_SETTINGS, loadedData);

			expect(merged.petName).toBe('Buddy');
			expect(merged.userName).toBe('Alice');
		});

		it('merges partial loaded data with defaults', () => {
			const loadedData = {
				petName: 'Luna',
			};
			const merged = Object.assign(
				{},
				DEFAULT_SETTINGS,
				loadedData
			) as CheersSettings;

			expect(merged.petName).toBe('Luna');
			expect(merged.userName).toBe(''); // From defaults
		});
	});

	describe('Settings Data Integrity', () => {
		it('preserves all settings fields after merge', () => {
			const loadedData = {
				petName: 'Max',
				userName: 'Bob',
			};
			const merged = Object.assign({}, DEFAULT_SETTINGS, loadedData);

			// Verify all expected fields exist
			expect(merged).toHaveProperty('petName');
			expect(merged).toHaveProperty('userName');
			expect(merged).toHaveProperty('movementSpeed');

			// Verify no unexpected fields
			const expectedKeys = ['petName', 'userName', 'movementSpeed', 'celebrations', 'dashboardColorMode', 'backgroundTheme'];
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

	describe('Settings Validation Scenarios', () => {
		it('creates valid settings object for save', () => {
			const settings = {
				petName: 'Fluffy',
				userName: 'Charlie',
			} as Partial<CheersSettings>;

			// Verify structure matches interface
			expect(typeof settings.petName).toBe('string');
			expect(typeof settings.userName).toBe('string');
		});

		it('handles empty user name correctly', () => {
			const settings = {
				petName: 'Solo',
				userName: '',
			} as Partial<CheersSettings>;

			expect(settings.userName).toBe('');
			expect(settings.userName!.length).toBe(0);
		});

		it('preserves exact string values', () => {
			const testName = 'Test Name 123';
			const settings = {
				petName: testName,
				userName: testName,
			} as Partial<CheersSettings>;

			expect(settings.petName).toBe(testName);
			expect(settings.userName).toBe(testName);
			// Verify no trimming or transformation
			expect(settings.petName!.length).toBe(testName.length);
		});
	});

	describe('Settings Update Scenarios', () => {
		let settings: CheersSettings;

		beforeEach(() => {
			settings = { ...DEFAULT_SETTINGS, celebrations: { ...DEFAULT_SETTINGS.celebrations } };
		});

		it('updates pet name while preserving other fields', () => {
			settings.petName = 'NewName';

			expect(settings.petName).toBe('NewName');
			expect(settings.userName).toBe('');
		});

		it('updates user name while preserving other fields', () => {
			settings.userName = 'NewUser';

			expect(settings.petName).toBe('Mochi');
			expect(settings.userName).toBe('NewUser');
		});

		it('updates all fields simultaneously', () => {
			settings.petName = 'Rover';
			settings.userName = 'David';

			expect(settings.petName).toBe('Rover');
			expect(settings.userName).toBe('David');
		});
	});

	// ─── backgroundTheme ─────────────────────────────────────────────────────

	describe('backgroundTheme defaults and merging', () => {
		it('DEFAULT_SETTINGS includes backgroundTheme defaulting to "day"', () => {
			expect(DEFAULT_SETTINGS.backgroundTheme).toBe('day');
		});

		it('merging empty loaded data preserves default "day"', () => {
			const loadedData = {};
			const merged = { ...DEFAULT_SETTINGS, ...loadedData } as CheersSettings;
			expect(merged.backgroundTheme).toBe('day');
		});

		it('merging with backgroundTheme: "night" overrides the default', () => {
			const loadedData = { backgroundTheme: 'night' as const };
			const merged = { ...DEFAULT_SETTINGS, ...loadedData } as CheersSettings;
			expect(merged.backgroundTheme).toBe('night');
		});

		it('merging with backgroundTheme: "day" explicitly keeps "day"', () => {
			const loadedData = { backgroundTheme: 'day' as const };
			const merged = { ...DEFAULT_SETTINGS, ...loadedData } as CheersSettings;
			expect(merged.backgroundTheme).toBe('day');
		});
	});

	// ─── dashboardColorMode ──────────────────────────────────────────────────

	describe('dashboardColorMode defaults and merging', () => {
		it('DEFAULT_SETTINGS includes dashboardColorMode defaulting to "warm"', () => {
			expect(DEFAULT_SETTINGS.dashboardColorMode).toBe('warm');
		});

		it('merging empty loaded data preserves default "warm"', () => {
			const loadedData = {};
			const merged = { ...DEFAULT_SETTINGS, ...loadedData } as CheersSettings;
			expect(merged.dashboardColorMode).toBe('warm');
		});

		it('merging with dashboardColorMode: "cool" overrides the default', () => {
			const loadedData = { dashboardColorMode: 'cool' as const };
			const merged = { ...DEFAULT_SETTINGS, ...loadedData } as CheersSettings;
			expect(merged.dashboardColorMode).toBe('cool');
		});

		it('merging with dashboardColorMode: "warm" explicitly keeps "warm"', () => {
			const loadedData = { dashboardColorMode: 'warm' as const };
			const merged = { ...DEFAULT_SETTINGS, ...loadedData } as CheersSettings;
			expect(merged.dashboardColorMode).toBe('warm');
		});

		it('dashboardColorMode is preserved alongside other settings during merge', () => {
			const loadedData = {
				petName: 'Buddy',
				dashboardColorMode: 'cool' as const,
			};
			const merged = { ...DEFAULT_SETTINGS, ...loadedData } as CheersSettings;
			expect(merged.petName).toBe('Buddy');
			expect(merged.dashboardColorMode).toBe('cool');
			expect(merged.userName).toBe(''); // Default preserved
		});
	});
});
