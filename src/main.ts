import { Plugin, Notice } from 'obsidian';
import type { WorkspaceLeaf } from 'obsidian';
import { PetView, VIEW_TYPE_PET } from './views/PetView';
import type { PetState } from './types/pet';
import type { VaultPalSettings } from './types/settings';
import { DEFAULT_SETTINGS } from './types/settings';
import { WelcomeModal } from './modals/WelcomeModal';

// Build-time constant injected by esbuild
declare const __DEV__: boolean;

/**
 * Debug interface for manual state testing (development only)
 */
interface VaultPalDebug {
	transitionState: (state: PetState) => void;
	getCurrentState: () => PetState | null;
	reset: () => void;
	setSpeed: (speed: number) => void;
	help: () => void;
}

declare global {
	interface Window {
		vaultPalDebug?: VaultPalDebug;
	}
}

export default class VaultPalPlugin extends Plugin {
	settings: VaultPalSettings = DEFAULT_SETTINGS;

	async onload() {
		console.log('🦊 Vault Pal loading...');

		// Load settings
		await this.loadSettings();

		// Register the pet view
		this.registerView(
			VIEW_TYPE_PET,
			(leaf) => new PetView(leaf)
		);

		// Initialize the view in the left sidebar (creates tab icon for switching)
		this.initializePetView();

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

		// Expose debug commands for manual state testing (development only)
		// This code is completely removed in production builds via tree-shaking
		if (__DEV__) {
			window.vaultPalDebug = {
				transitionState: (state: PetState) => {
					const view = this.getActivePetView();
					if (view) {
						view.transitionState(state);
						console.log(`🦊 Transitioned to: ${state}`);
					} else {
						console.error('🦊 No active pet view. Open Vault Pal first.');
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
						console.error('🦊 No active pet view. Open Vault Pal first.');
					}
				},
				setSpeed: (speed: number) => {
					const view = this.getActivePetView();
					if (view?.petComponent) {
						view.petComponent.$set({ movementSpeed: speed });
						console.log(`🦊 Movement speed set to: ${speed}%`);
					} else {
						console.error('🦊 No active pet view. Open Vault Pal first.');
					}
				},
				help: () => {
					console.log(`
🦊 Vault Pal Debug Commands:
  vaultPalDebug.transitionState('state') - Transition to a state
  vaultPalDebug.getCurrentState()        - Get current state
  vaultPalDebug.reset()                  - Reset to walking
  vaultPalDebug.setSpeed(50)             - Set movement speed (0-100)
  vaultPalDebug.help()                   - Show this help

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

			console.log('🦊 Debug commands available: window.vaultPalDebug.help()');
		}
	}

	onunload() {
		console.log('🦊 Vault Pal unloaded');

		// Clean up debug interface (development only)
		if (__DEV__ && window.vaultPalDebug) {
			delete window.vaultPalDebug;
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
	 * Load settings from disk
	 */
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	/**
	 * Save settings to disk
	 */
	async saveSettings() {
		await this.saveData(this.settings);
	}
}