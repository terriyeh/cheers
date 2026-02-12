import { Modal, Setting } from 'obsidian';
import type ObsidianPetsPlugin from '../main';
import { VALIDATION_RULES } from '../types/settings';
import { VIEW_TYPE_PET, PetView } from '../views/PetView';

/**
 * Welcome Modal shown on first run
 * Collects pet name and user name from the user
 */
export class WelcomeModal extends Modal {
	private plugin: ObsidianPetsPlugin;
	private petNameInput: HTMLInputElement | null = null;
	private userNameInput: HTMLInputElement | null = null;
	private petNameError: HTMLElement | null = null;
	private userNameError: HTMLElement | null = null;

	constructor(plugin: ObsidianPetsPlugin) {
		super(plugin.app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('obsidian-pets-welcome-modal');

		// Header
		contentEl.createEl('h2', { text: '🦊 Welcome to Obsidian Pets!' });

		contentEl.createEl('p', {
			text: 'Let\'s get your companion set up!',
			cls: 'obsidian-pets-welcome-subtitle',
		});

		// Pet Name Setting
		new Setting(contentEl)
			.setName('Your pet\'s name')
			.setDesc('What should we call your companion?')
			.addText((text) => {
				this.petNameInput = text.inputEl;
				text
					.setPlaceholder('Kit')
					.setValue(this.plugin.settings.petName)
					.onChange((value) => this.validatePetName(value));
			});

		// Pet name error message container
		this.petNameError = contentEl.createDiv({
			cls: 'obsidian-pets-error-message setting-item-description',
		});
		this.petNameError.style.display = 'none';

		// User Name Setting
		new Setting(contentEl)
			.setName('Your name')
			.setDesc('What should your pet call you? (optional)')
			.addText((text) => {
				this.userNameInput = text.inputEl;
				text
					.setPlaceholder('Leave empty if you prefer')
					.setValue(this.plugin.settings.userName)
					.onChange((value) => this.validateUserName(value));
			});

		// User name error message container
		this.userNameError = contentEl.createDiv({
			cls: 'obsidian-pets-error-message setting-item-description',
		});
		this.userNameError.style.display = 'none';

		// Movement Speed Setting
		new Setting(contentEl)
			.setName('Movement speed')
			.setDesc('Control how fast your pet moves (0 = slowest walk, 100 = fastest run)')
			.addSlider((slider) =>
				slider
					.setLimits(0, 100, 1)
					.setValue(this.plugin.settings.movementSpeed)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.movementSpeed = value;
						await this.plugin.saveSettings();

						// Update live pet if view is open
						const leaves = this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE_PET);
						if (leaves.length > 0) {
							const view = leaves[0].view as PetView;
							if (view.petComponent) {
								view.petComponent.$set({ movementSpeed: value });
							}
						}
					})
			);

		// Buttons
		const buttonContainer = contentEl.createDiv({
			cls: 'obsidian-pets-button-container',
		});

		// Skip button
		buttonContainer.createEl('button', {
			text: 'Skip',
			cls: 'mod-muted',
		}).addEventListener('click', () => {
			this.close();
		});

		// Save button
		const saveButton = buttonContainer.createEl('button', {
			text: 'Let\'s Go!',
			cls: 'mod-cta',
		});
		saveButton.addEventListener('click', () => this.handleSave());
	}

	/**
	 * Validate pet name input
	 */
	private validatePetName(value: string): boolean {
		const trimmed = value.trim();
		const rules = VALIDATION_RULES.petName;

		if (!this.petNameError) return false;

		// Check length
		if (trimmed.length < rules.minLength || trimmed.length > rules.maxLength) {
			this.petNameError.textContent = rules.errorMessage;
			this.petNameError.style.display = 'block';
			this.petNameError.style.color = 'var(--text-error)';
			return false;
		}

		// Check pattern
		if (!rules.pattern.test(trimmed)) {
			this.petNameError.textContent = rules.errorMessage;
			this.petNameError.style.display = 'block';
			this.petNameError.style.color = 'var(--text-error)';
			return false;
		}

		// Valid
		this.petNameError.style.display = 'none';
		return true;
	}

	/**
	 * Validate user name input
	 */
	private validateUserName(value: string): boolean {
		const trimmed = value.trim();
		const rules = VALIDATION_RULES.userName;

		if (!this.userNameError) return false;

		// Empty is allowed
		if (trimmed.length === 0) {
			this.userNameError.style.display = 'none';
			return true;
		}

		// Check length
		if (trimmed.length > rules.maxLength) {
			this.userNameError.textContent = rules.errorMessage;
			this.userNameError.style.display = 'block';
			this.userNameError.style.color = 'var(--text-error)';
			return false;
		}

		// Check pattern
		if (!rules.pattern.test(trimmed)) {
			this.userNameError.textContent = rules.errorMessage;
			this.userNameError.style.display = 'block';
			this.userNameError.style.color = 'var(--text-error)';
			return false;
		}

		// Valid
		this.userNameError.style.display = 'none';
		return true;
	}

	/**
	 * Handle save button click
	 */
	private async handleSave() {
		const petName = this.petNameInput?.value.trim() || 'Kit';
		const userName = this.userNameInput?.value.trim() || '';

		// Validate both inputs
		const petNameValid = this.validatePetName(petName);
		const userNameValid = this.validateUserName(userName);

		if (!petNameValid || !userNameValid) {
			return; // Don't save if validation fails
		}

		// Update settings
		this.plugin.settings.petName = petName;
		this.plugin.settings.userName = userName;
		this.plugin.settings.hasCompletedWelcome = true;

		// Save to disk
		await this.plugin.saveSettings();

		// Close modal
		this.close();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
