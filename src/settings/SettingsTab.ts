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
			.addText((text) =>
				text
					.setPlaceholder('Mochi')
					.setValue(this.plugin.settings.petName)
					.onChange(async (value) => {
						this.plugin.settings.petName = value;
						await this.plugin.saveSettings();
					})
			);

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
						this.display();
						this.plugin.petView?.updateStatsComponent();
					})
			);

		if (this.plugin.settings.celebrations.onWordGoal) {
			new Setting(containerEl)
				.setName('Daily word goal')
				.setDesc('Words written today across your vault (resets at midnight).')
				.addText((text) =>
					text
						.setPlaceholder('e.g. 1667')
						.setValue(this.plugin.settings.celebrations.dailyWordGoal?.toString() ?? '')
						.onChange(async (value) => {
							const num = parseInt(value.trim(), 10);
							const errorEl = containerEl.querySelector<HTMLElement>('.cheers-word-goal-error');
							if (Number.isFinite(num) && num > 0 && num <= 100_000) {
								this.plugin.settings.celebrations.dailyWordGoal = num;
								await this.plugin.saveSettings();
								if (errorEl) errorEl.style.display = 'none';
								this.plugin.petView?.updateStatsComponent();
							} else {
								if (errorEl) errorEl.style.display = 'block';
							}
						})
				);

			// Error appears below the input (correct visual order)
			const wordGoalError = containerEl.createEl('p', {
				text: 'Daily word goal is required when word count celebrations are enabled.',
				cls: 'setting-item-description cheers-word-goal-error',
			});
			wordGoalError.style.color = 'var(--text-error)';
			wordGoalError.style.display =
				this.plugin.settings.celebrations.dailyWordGoal === null ? 'block' : 'none';

			// Per-note goal hint
			containerEl.createEl('p', {
				text: "To add a note-specific word goal, add the word-goal file property and enter a numerical value as the word target for that file. For example, word-goal: 500 sets a word target of 500 for that file.",
				cls: 'setting-item-description',
			});
		}

		containerEl.createEl('h3', { text: 'Dashboard' });

		new Setting(containerEl)
			.setName('Color palette')
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

		new Setting(containerEl)
			.setName('Background')
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

	}
}
