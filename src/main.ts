import { Plugin } from 'obsidian';
import { PetView, VIEW_TYPE_PET } from './views/PetView';

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
	}

	onunload() {
		console.log('🦊 Vault Pal unloaded');

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
}