import { App, PluginSettingTab, Setting } from 'obsidian';
import type CheersPlugin from '../main';

export class CheersSettingTab extends PluginSettingTab {
	plugin: CheersPlugin;

	constructor(app: App, plugin: CheersPlugin) {
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
			.addText((text) => {
				text.inputEl.maxLength = 30;
				return text
					.setPlaceholder('Mochi')
					.setValue(this.plugin.settings.petName)
					.onChange(async (value) => {
						this.plugin.settings.petName = value;
						await this.plugin.saveSettings();
					});
			});

		// Movement Speed
		new Setting(containerEl)
			.setName('Movement speed')
			.setDesc('How fast your pet moves')
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
		new Setting(containerEl).setName('Celebrations').setHeading();
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
						this.plugin.petView?.updateStatsComponent();
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
						this.plugin.petView?.updateStatsComponent();
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
						this.plugin.petView?.updateStatsComponent();
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
						wordGoalSubSettings.classList.toggle('cheers-hidden', !value);
						this.plugin.petView?.updateStatsComponent();
					})
			);

		// Sub-settings for word goals — always created, shown/hidden to avoid scroll reset
		const wordGoalSubSettings = containerEl.createDiv();
		wordGoalSubSettings.classList.toggle('cheers-hidden', !this.plugin.settings.celebrations.onWordGoal);

		new Setting(wordGoalSubSettings)
				.setName('Daily word goal')
				.setDesc('Words written today across your vault (resets at midnight).')
				.addText((text) =>
					text
						.setPlaceholder('e.g. 1667')
						.setValue(this.plugin.settings.celebrations.dailyWordGoal?.toString() ?? '')
						.onChange(async (value) => {
							const num = parseInt(value.trim(), 10);
							const errorEl = wordGoalSubSettings.querySelector<HTMLElement>('.cheers-word-goal-error');
							if (Number.isFinite(num) && num > 0 && num <= 100_000) {
								this.plugin.settings.celebrations.dailyWordGoal = num;
								await this.plugin.saveSettings();
								errorEl?.classList.add('cheers-hidden');
								this.plugin.petView?.updateStatsComponent();
							} else {
								errorEl?.classList.remove('cheers-hidden');
							}
						})
				);

		// Error appears below the input (correct visual order)
		const wordGoalError = wordGoalSubSettings.createEl('p', {
			text: 'Daily word goal is required when word count celebrations are enabled.',
			cls: 'setting-item-description cheers-word-goal-error',
		});
		wordGoalError.classList.toggle(
			'cheers-hidden',
			this.plugin.settings.celebrations.dailyWordGoal !== null
		);

		// Per-note goal hint
		wordGoalSubSettings.createEl('p', {
			text: "To add a note-specific word goal, add the word-goal file property and enter a numerical value as the word target for that file. For example, word-goal: 500 sets a word target of 500 for that file.",
			cls: 'setting-item-description',
		});

		// Appearance Section
		new Setting(containerEl).setName('Appearance').setHeading();

		new Setting(containerEl)
			.setName('Pet view background')
			.setDesc('Scene shown behind your pet')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('day', 'Day')
					.addOption('night', 'Night')
					.setValue(this.plugin.settings.backgroundTheme)
					.onChange(async (value: string) => {
						if (value === 'day' || value === 'night') {
							this.plugin.settings.backgroundTheme = value;
							await this.plugin.saveSettings();
							this.plugin.petView?.applyBackground();
						}
					})
			);

		new Setting(containerEl)
			.setName('Stats dashboard color palette')
			.setDesc('Tally column colors shown in the Stats tab')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('warm', 'Warm — pink / yellow / orange')
					.addOption('cool', 'Cool — blue / cyan / green')
					.setValue(this.plugin.settings.dashboardColorMode)
					.onChange(async (value: string) => {
						if (value === 'warm' || value === 'cool') {
							this.plugin.settings.dashboardColorMode = value;
							await this.plugin.saveSettings();
							this.plugin.petView?.updateStatsComponent();
						}
					})
			);

	}
}
