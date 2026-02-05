import { Plugin } from 'obsidian';

export default class VaultPalPlugin extends Plugin {
	async onload() {
		console.log('🦊 Vault Pal loading...');
	}

	onunload() {
		console.log('🦊 Vault Pal unloaded');
	}
}