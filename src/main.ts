import { Plugin, Notice } from 'obsidian';
import type { WorkspaceLeaf } from 'obsidian';
import { PetView, VIEW_TYPE_PET } from './views/PetView';
import type { PetState } from './types/pet';
import type { ObsidianPetsSettings, DailyWordData } from './types/settings';
import { DEFAULT_SETTINGS, VALIDATION_RULES } from './types/settings';
import { WelcomeModal } from './modals/WelcomeModal';
import { CelebrationService } from './celebrations/CelebrationService';
import { ObsidianPetsSettingTab } from './settings/SettingsTab';

// Build-time constant injected by esbuild
declare const __DEV__: boolean;

/**
 * Debug interface for manual state testing (development only)
 */
interface ObsidianPetsDebug {
	transitionState: (state: PetState) => void;
	getCurrentState: () => PetState | null;
	reset: () => void;
	setSpeed: (speed: number) => void;
	help: () => void;
}

declare global {
	interface Window {
		obsidianPetsDebug?: ObsidianPetsDebug;
	}
}

export default class ObsidianPetsPlugin extends Plugin {
	settings: ObsidianPetsSettings = DEFAULT_SETTINGS;
	petView?: PetView;
	dailyWordData: DailyWordData = this.getDefaultDailyData();
	private celebrationService?: CelebrationService;

	async onload() {
		console.log('🦊 Obsidian Pets loading...');

		// Load settings
		await this.loadSettings();

		// Register the pet view
		this.registerView(
			VIEW_TYPE_PET,
			(leaf) => {
				const view = new PetView(leaf);
				this.petView = view;
				return view;
			}
		);

		// Initialize the view in the left sidebar (creates tab icon for switching)
		this.initializePetView();

		// Add settings tab
		this.addSettingTab(new ObsidianPetsSettingTab(this.app, this));

		// Add command to open pet view (for command palette)
		this.addCommand({
			id: 'open-obsidian-pets',
			name: 'Open Obsidian Pets',
			callback: () => {
				this.activatePetView();
			},
		});

		// Add command to edit pet settings
		this.addCommand({
			id: 'edit-pet-settings',
			name: 'Edit pet settings',
			callback: () => {
				new WelcomeModal(this).open();
			},
		});

		// Don't auto-open on startup - let user open manually via ribbon/command

		// Initialize celebration service
		this.celebrationService = new CelebrationService(this);

		// Expose debug commands for manual state testing (development only)
		// This code is completely removed in production builds via tree-shaking
		if (__DEV__) {
			window.obsidianPetsDebug = {
				transitionState: (state: PetState) => {
					const view = this.getActivePetView();
					if (view) {
						view.transitionState(state);
						console.log(`🦊 Transitioned to: ${state}`);
					} else {
						console.error('🦊 No active pet view. Open Obsidian Pets first.');
					}
				},
				getCurrentState: () => {
					const view = this.getActivePetView();
					const state = view?.getCurrentState() ?? null;
					console.log(`🦊 Current state: ${state ?? 'no view'}`);
					return state;
				},
				reset: () => {
					const view = this.getActivePetView();
					if (view) {
						view.transitionState('walking');
						console.log('🦊 Reset to walking');
					} else {
						console.error('🦊 No active pet view. Open Obsidian Pets first.');
					}
				},
				setSpeed: (speed: number) => {
					const view = this.getActivePetView();
					if (view?.petComponent) {
						view.petComponent.$set({ movementSpeed: speed });
						console.log(`🦊 Movement speed set to: ${speed}%`);
					} else {
						console.error('🦊 No active pet view. Open Obsidian Pets first.');
					}
				},
				help: () => {
					console.log(`
🦊 Obsidian Pets Debug Commands:
  obsidianPetsDebug.transitionState('state') - Transition to a state
  obsidianPetsDebug.getCurrentState()        - Get current state
  obsidianPetsDebug.reset()                  - Reset to walking
  obsidianPetsDebug.setSpeed(50)             - Set movement speed (0-100)
  obsidianPetsDebug.help()                   - Show this help

Available states:
  - walking
  - running
  - greeting
  - celebration
  - petting
  - sleeping
					`);
				}
			};

			console.log('🦊 Debug commands available: window.obsidianPetsDebug.help()');
		}
	}

	onunload() {
		console.log('🦊 Obsidian Pets unloaded');

		// Clean up celebration service
		this.celebrationService?.cleanup();

		// Clean up debug interface (development only)
		if (__DEV__ && window.obsidianPetsDebug) {
			delete window.obsidianPetsDebug;
		}

		// Detach all pet views
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_PET);
	}

	/**
	 * Initialize the pet view in left sidebar on plugin load
	 * Creates the tab icon but doesn't activate the view
	 */
	async initializePetView() {
		await this.ensurePetViewExists(false);
	}

	/**
	 * Activate the pet view in left sidebar
	 * Recreates the view if it has been closed
	 */
	async activatePetView() {
		const { workspace } = this.app;
		const leaf = await this.ensurePetViewExists(true);

		// Reveal the view (either existing or newly created)
		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	/**
	 * Ensure pet view exists in the left sidebar
	 * @param active - Whether to activate the view when creating/finding it
	 * @returns The leaf containing the pet view, or null if creation failed
	 */
	private async ensurePetViewExists(active: boolean): Promise<WorkspaceLeaf | null> {
		const { workspace } = this.app;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_PET);

		if (leaves.length > 0) {
			// View already exists, return the first one
			return leaves[0];
		}

		// View doesn't exist - create it
		const leaf = workspace.getLeftLeaf(false);
		if (leaf) {
			await leaf.setViewState({
				type: VIEW_TYPE_PET,
				active: active,
			});
			return leaf;
		}

		return null;
	}

	/**
	 * Get the currently active PetView instance
	 */
	private getActivePetView(): PetView | null {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_PET);
		if (leaves.length > 0) {
			return leaves[0].view as PetView;
		}
		return null;
	}

	/**
	 * Validate loaded settings against validation rules
	 * @param settings - Settings object to validate
	 * @returns Validated settings with invalid values replaced by defaults
	 */
	private validateSettings(settings: ObsidianPetsSettings): ObsidianPetsSettings {
		const validated = { ...settings };

		// Validate petName
		if (
			typeof validated.petName !== 'string' ||
			validated.petName.length < VALIDATION_RULES.petName.minLength ||
			validated.petName.length > VALIDATION_RULES.petName.maxLength ||
			!VALIDATION_RULES.petName.pattern.test(validated.petName)
		) {
			console.warn(`Invalid petName loaded, using default: ${DEFAULT_SETTINGS.petName}`);
			validated.petName = DEFAULT_SETTINGS.petName;
		}

		// Validate userName
		if (
			typeof validated.userName !== 'string' ||
			validated.userName.length > VALIDATION_RULES.userName.maxLength ||
			!VALIDATION_RULES.userName.pattern.test(validated.userName)
		) {
			console.warn(`Invalid userName loaded, using default: ${DEFAULT_SETTINGS.userName}`);
			validated.userName = DEFAULT_SETTINGS.userName;
		}

		// Validate movementSpeed
		if (
			typeof validated.movementSpeed !== 'number' ||
			validated.movementSpeed < VALIDATION_RULES.movementSpeed.min ||
			validated.movementSpeed > VALIDATION_RULES.movementSpeed.max
		) {
			console.warn(`Invalid movementSpeed loaded, using default: ${DEFAULT_SETTINGS.movementSpeed}`);
			validated.movementSpeed = DEFAULT_SETTINGS.movementSpeed;
		}

		// Validate hasCompletedWelcome
		if (typeof validated.hasCompletedWelcome !== 'boolean') {
			validated.hasCompletedWelcome = DEFAULT_SETTINGS.hasCompletedWelcome;
		}

		// Validate celebrations sub-object exists
		if (typeof validated.celebrations !== 'object' || validated.celebrations === null) {
			validated.celebrations = { ...DEFAULT_SETTINGS.celebrations };
		} else {
			// Validate dailyWordGoal: must be null or a finite positive integer ≤ 100,000
			const { dailyWordGoal } = validated.celebrations;
			if (
				dailyWordGoal !== null &&
				(typeof dailyWordGoal !== 'number' ||
					!Number.isFinite(dailyWordGoal) ||
					!Number.isInteger(dailyWordGoal) ||
					dailyWordGoal <= 0 ||
					dailyWordGoal > 100_000)
			) {
				validated.celebrations.dailyWordGoal = DEFAULT_SETTINGS.celebrations.dailyWordGoal;
			}
		}

		return validated;
	}

	/**
	 * Load settings from disk with validation
	 */
	async loadSettings() {
		const loadedData = await this.loadData();
		const { daily, ...settingsData } = (loadedData ?? {}) as any;
		const mergedSettings = Object.assign({}, DEFAULT_SETTINGS, settingsData);
		this.settings = this.validateSettings(mergedSettings);
		this.dailyWordData = this.loadDailyWordData(daily);
	}

	/**
	 * Save settings and daily word data to disk
	 */
	async saveSettings() {
		await this.saveData({ ...this.settings, daily: this.dailyWordData });
	}

	getLocalDateString(): string {
		const d = new Date();
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}

	private getDefaultDailyData(): DailyWordData {
		return {
			date: this.getLocalDateString(),
			wordsAddedToday: 0,
			goalCelebrated: false,
		};
	}

	private loadDailyWordData(stored: unknown): DailyWordData {
		const today = this.getLocalDateString();
		if (!stored || typeof stored !== 'object' || (stored as any).date !== today) {
			return this.getDefaultDailyData();
		}
		return {
			date: today,
			wordsAddedToday: typeof (stored as any).wordsAddedToday === 'number'
				? Math.max(0, Math.floor((stored as any).wordsAddedToday))
				: 0,
			goalCelebrated: (stored as any).goalCelebrated === true,
		};
	}
}