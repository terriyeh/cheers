import { App, PluginSettingTab, Setting } from 'obsidian';
import type ObsidianPetsPlugin from '../main';

export class ObsidianPetsSettingTab extends PluginSettingTab {
	plugin: ObsidianPetsPlugin;

	constructor(app: App, plugin: ObsidianPetsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// Pet Name
		new Setting(containerEl)
			.setName('Pet name')
			.setDesc('What should we call your pet?')
			.addText((text) =>
				text
					.setPlaceholder('Kit')
					.setValue(this.plugin.settings.petName)
					.onChange(async (value) => {
						this.plugin.settings.petName = value;
						await this.plugin.saveSettings();
					})
			);

		// Movement Speed
		new Setting(containerEl)
			.setName('Movement speed')
			.setDesc('How fast your pet moves (0-60: walking, 61-100: running)')
			.addSlider((slider) =>
				slider
					.setLimits(0, 100, 1)
					.setValue(this.plugin.settings.movementSpeed)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.movementSpeed = value;
						await this.plugin.saveSettings();
						// Update pet if view is open
						if (this.plugin.petView?.petComponent) {
							this.plugin.petView.petComponent.$set({ movementSpeed: value });
						}
					})
			);

		// Celebrations Section
		containerEl.createEl('h3', { text: 'Celebrations' });
		containerEl.createEl('p', {
			text: 'Choose what vault event you want to celebrate.',
			cls: 'setting-item-description',
		});

		// Note Creation
		new Setting(containerEl)
			.setName('Note creation')
			.setDesc('Celebrate when you create any new note')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.celebrations.onNoteCreate)
					.onChange(async (value) => {
						this.plugin.settings.celebrations.onNoteCreate = value;
						await this.plugin.saveSettings();
					})
			);

		// Task Completion
		new Setting(containerEl)
			.setName('Task completion')
			.setDesc('Celebrate when you check off a checkbox')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.celebrations.onTaskComplete)
					.onChange(async (value) => {
						this.plugin.settings.celebrations.onTaskComplete = value;
						await this.plugin.saveSettings();
					})
			);

		// Link Creation
		new Setting(containerEl)
			.setName('Link creation')
			.setDesc('Celebrate when you create a new link')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.celebrations.onLinkCreate)
					.onChange(async (value) => {
						this.plugin.settings.celebrations.onLinkCreate = value;
						await this.plugin.saveSettings();
					})
			);

		// Word Count Goals
		new Setting(containerEl)
			.setName('Word count goals')
			.setDesc('Celebrate when you reach your writing goals')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.celebrations.onWordGoal)
					.onChange(async (value) => {
						this.plugin.settings.celebrations.onWordGoal = value;
						await this.plugin.saveSettings();
						this.display();
					})
			);

		if (this.plugin.settings.celebrations.onWordGoal) {
			// Daily word goal input
			new Setting(containerEl)
				.setName('Daily word goal')
				.setDesc('Words written today across your vault (resets at midnight). Leave blank to use per-note goals only.')
				.addText((text) =>
					text
						.setPlaceholder('e.g. 500')
						.setValue(this.plugin.settings.celebrations.dailyWordGoal?.toString() ?? '')
						.onChange(async (value) => {
							const num = parseInt(value.trim(), 10);
							this.plugin.settings.celebrations.dailyWordGoal =
								Number.isFinite(num) && num > 0 && num <= 100_000 ? num : null;
							await this.plugin.saveSettings();
						})
				);

			// Per-note goal hint
			containerEl.createEl('p', {
				text: "To add a note-specific word goal, add the word-goal file property and enter a numerical value as the word target for that file. For example, word-goal: 500 sets a word target of 500 for that file.",
				cls: 'setting-item-description',
			});

			// Warning when no goal type is configured
			if (this.plugin.settings.celebrations.dailyWordGoal === null) {
				containerEl.createEl('p', {
					text: '⚠ At least one goal type must be configured: set a daily goal above, or add word-goal to a note\'s frontmatter.',
					cls: 'setting-item-description',
				});
			}
		}
	}
}
