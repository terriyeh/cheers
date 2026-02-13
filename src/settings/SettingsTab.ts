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
			.setDesc('Checking off a checkbox')
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
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.celebrations.onLinkCreate)
					.onChange(async (value) => {
						this.plugin.settings.celebrations.onLinkCreate = value;
						await this.plugin.saveSettings();
					})
			);

		// Word Count Milestones
		const wordMilestoneSetting = new Setting(containerEl)
			.setName('Word count milestones')
			.setDesc('Reaching a certain number of words written that day')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.celebrations.onWordMilestone)
					.onChange(async (value) => {
						this.plugin.settings.celebrations.onWordMilestone = value;
						await this.plugin.saveSettings();
						// Refresh display to show/hide milestone input
						this.display();
					})
			);

		// Word Count Milestones Input (only show if word milestones are enabled)
		if (this.plugin.settings.celebrations.onWordMilestone) {
			new Setting(containerEl)
				.setName('Milestone thresholds')
				.setDesc('Comma-separated numbers (e.g., 100, 500, 1000). Max value: 10,000,000 words.')
				.addText((text) =>
					text
						.setPlaceholder('100, 500, 1000, 3500, 5000')
						.setValue(this.plugin.settings.celebrations.wordMilestones.join(', '))
						.onChange(async (value) => {
							const MAX_MILESTONE = 10000000; // 10 million words
							const MAX_MILESTONE_COUNT = 50; // Limit array size

							// Parse and validate
							const milestones = value
								.split(',')
								.map((s) => parseInt(s.trim()))
								.filter((n) => !isNaN(n) && n > 0 && n <= MAX_MILESTONE)
								.slice(0, MAX_MILESTONE_COUNT);

							// Remove duplicates and sort
							const unique = [...new Set(milestones)].sort((a, b) => a - b);

							this.plugin.settings.celebrations.wordMilestones =
								unique.length > 0 ? unique : [100, 500, 1000, 3500, 5000]; // Default if empty

							await this.plugin.saveSettings();

							// Update display with cleaned value
							text.setValue(this.plugin.settings.celebrations.wordMilestones.join(', '));
						})
				);
		}
	}
}
