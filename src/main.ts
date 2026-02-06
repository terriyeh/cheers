import { Plugin } from 'obsidian';
import { PetView, VIEW_TYPE_PET } from './views/PetView';
import type { PetState } from './types/pet';

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
	async onload() {
		console.log('🦊 Vault Pal loading...');

		// Register the pet view
		this.registerView(
			VIEW_TYPE_PET,
			(leaf) => new PetView(leaf)
		);

		// Add ribbon icon to open pet view
		// Using 'cat' icon - Lucide doesn't have fox, cat is closest
		this.addRibbonIcon('cat', 'Open Vault Pal', () => {
			this.activatePetView();
		});

		// Add command to open pet view
		this.addCommand({
			id: 'open-vault-pal',
			name: 'Open Vault Pal',
			callback: () => {
				this.activatePetView();
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
	 * Activate the pet view in right sidebar
	 */
	async activatePetView() {
		const { workspace } = this.app;

		// Check if view is already open
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_PET);

		if (leaves.length > 0) {
			// View already exists, just reveal it
			workspace.revealLeaf(leaves[0]);
		} else {
			// Get the right sidebar leaf
			const leaf = workspace.getRightLeaf(false);

			if (leaf) {
				await leaf.setViewState({
					type: VIEW_TYPE_PET,
					active: true,
				});

				// Reveal the leaf and show the sidebar
				workspace.revealLeaf(leaf);
			}
		}
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
}