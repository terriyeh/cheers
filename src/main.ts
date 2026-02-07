import { Plugin, Notice, WorkspaceLeaf } from 'obsidian';
import { PetView, VIEW_TYPE_PET } from './views/PetView';
import type { PetState } from './types/pet';
import type { VaultPalSettings } from './types/settings';
import { DEFAULT_SETTINGS } from './types/settings';
import { WelcomeModal } from './modals/WelcomeModal';
import { processVaultPalBlock } from './template';

// Build-time constant injected by esbuild
declare const __DEV__: boolean;

/**
 * Debug interface for manual state testing (development only)
 */
interface VaultPalDebug {
	transitionState: (state: PetState) => void;
	getCurrentState: () => PetState | null;
	reset: () => void;
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

		// Register vaultpal code block processor for inline validation
		this.registerMarkdownCodeBlockProcessor('vaultpal', processVaultPalBlock);

		// Initialize the view in the left sidebar (creates tab icon for switching)
		this.initializePetView();

		// Add command to open pet view (for command palette)
		this.addCommand({
			id: 'open-vault-pal',
			name: 'Open Vault Pal',
			callback: () => {
				this.activatePetView();
			},
		});

		// Add command to edit pet settings
		this.addCommand({
			id: 'edit-pet-settings',
			name: 'Edit Pet Settings',
			callback: () => {
				new WelcomeModal(this).open();
			},
		});

		// Command: Open today's daily note
		this.addCommand({
			id: 'open-daily-note',
			name: 'Open Today\'s Daily Note',
			callback: async () => {
				const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_PET);
				const petViewLeaf = leaves.length > 0 ? leaves[0] : null;

				if (petViewLeaf?.view && petViewLeaf.view instanceof PetView) {
					// Pet View is open - use its method
					await (petViewLeaf.view as PetView).openDailyNote();
				} else {
					// Fallback: Open note without Pet View
					const {
						createDailyNote,
						getDailyNote,
						getAllDailyNotes,
						appHasDailyNotesPluginLoaded
					} = await import('obsidian-daily-notes-interface');

					if (!appHasDailyNotesPluginLoaded()) {
						new Notice('Daily Notes plugin is not enabled. Please enable it in Settings → Core Plugins.');
						return;
					}

					const today = window.moment();
					let note = getDailyNote(today, getAllDailyNotes());
					if (!note) {
						note = await createDailyNote(today);
					}
					await this.app.workspace.getLeaf(false).openFile(note);
				}
			}
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
						view.transitionState('idle');
						console.log('🦊 Reset to idle');
					} else {
						console.error('🦊 No active pet view. Open Vault Pal first.');
					}
				},
				help: () => {
					console.log(`
🦊 Vault Pal Debug Commands:
  vaultPalDebug.transitionState('state') - Transition to a state
  vaultPalDebug.getCurrentState()        - Get current state
  vaultPalDebug.reset()                  - Reset to idle
  vaultPalDebug.help()                   - Show this help

Available states:
  - idle
  - greeting
  - talking
  - listening
  - small-celebration
  - big-celebration
  - petting
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