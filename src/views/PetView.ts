import { ItemView, type WorkspaceLeaf, Notice } from 'obsidian';
import type { PetState, StateChangeListener } from '../types/pet';
import { PetStateMachine } from '../pet/PetStateMachine';
import PetComponent from '../components/Pet.svelte';
import type VaultPalPlugin from '../main';
import { WelcomeModal } from '../modals/WelcomeModal';

/**
 * View type identifier for the pet view
 */
export const VIEW_TYPE_PET = 'vault-pal-pet-view';

/**
 * Pet View - Main ItemView for displaying the pet companion
 */
export class PetView extends ItemView {
  private petComponent: PetComponent | null = null;
  private stateMachine: PetStateMachine | null = null;
  private containerDiv: HTMLDivElement | null = null;
  private stateChangeListener: StateChangeListener | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  /**
   * Get the view type identifier
   */
  getViewType(): string {
    return VIEW_TYPE_PET;
  }

  /**
   * Get the display text for the view
   */
  getDisplayText(): string {
    return 'Vault Pal';
  }

  /**
   * Get the icon for the view tab
   */
  getIcon(): string {
    return 'cat';
  }

  /**
   * Called when the view is opened
   */
  async onOpen(): Promise<void> {
    try {
      // Show welcome modal on first run
      // @ts-expect-error - accessing internal plugin registry
      const plugin = this.app.plugins.plugins['vault-pal'] as VaultPalPlugin;
      if (plugin && !plugin.settings.hasCompletedWelcome) {
        new WelcomeModal(plugin).open();
      }

      // Show loading state
      this.showLoading();

      // Initialize state machine
      this.stateMachine = new PetStateMachine();

      // Create container for pet component
      const contentContainer = this.getContentContainer();
      this.containerDiv = contentContainer.createDiv({
        cls: 'vault-pal-container',
      });

      // Set initial data attribute
      this.updateDataAttribute(this.stateMachine.getCurrentState());

      // Listen to state changes - store listener for cleanup
      this.stateChangeListener = (event) => {
        this.updateDataAttribute(event.newState);

        // Update Svelte component if it exists
        if (this.petComponent) {
          this.petComponent.$set({ state: event.newState });
        }
      };
      this.stateMachine.addListener(this.stateChangeListener);

      // Get the sprite sheet path with validation
      const spriteSheetPath = this.getSpriteSheetPath();

      // Get plugin settings for pet name and user name (reuse plugin variable from above)
      const petName = plugin?.settings?.petName ?? 'Kit';
      const userName = plugin?.settings?.userName ?? '';

      // Mount Svelte component with asset path and settings
      this.petComponent = new PetComponent({
        target: this.containerDiv,
        props: {
          state: this.stateMachine.getCurrentState(),
          spriteSheetPath: spriteSheetPath,
          petName: petName,
          userName: userName,
        },
      });

      // Hide loading state
      this.hideLoading();

      // Add top-right corner action button (matches Graph view pattern)
      this.addAction(
        'calendar-plus',
        'Open Today\'s Daily Note',
        () => this.openDailyNote()
      );
    } catch (error) {
      console.error('Failed to mount Pet View:', error);

      // Cleanup any partially initialized resources
      if (this.stateMachine && this.stateChangeListener) {
        this.stateMachine.removeListener(this.stateChangeListener);
        this.stateChangeListener = null;
      }
      if (this.stateMachine) {
        this.stateMachine.cleanup();
        this.stateMachine = null;
      }
      if (this.petComponent) {
        this.petComponent.$destroy();
        this.petComponent = null;
      }

      this.showError(error);
    }
  }

  /**
   * Called when the view is closed
   */
  async onClose(): Promise<void> {
    // Remove state change listener before cleanup
    if (this.stateMachine && this.stateChangeListener) {
      this.stateMachine.removeListener(this.stateChangeListener);
      this.stateChangeListener = null;
    }

    // Destroy Svelte component
    if (this.petComponent) {
      this.petComponent.$destroy();
      this.petComponent = null;
    }

    // Clean up state machine
    if (this.stateMachine) {
      this.stateMachine.cleanup();
      this.stateMachine = null;
    }

    // Clear container
    this.containerEl.empty();
    this.containerDiv = null;
  }

  /**
   * Update the data-pet-state attribute on the container
   */
  private updateDataAttribute(state: PetState): void {
    if (this.containerDiv) {
      this.containerDiv.dataset.petState = state;
    }
  }

  /**
   * Show loading state in the view
   */
  private showLoading(): void {
    try {
      const container = this.getContentContainer();
      container.empty();
      container.createDiv({
        cls: 'vault-pal-loading',
        text: 'Loading Vault Pal...',
      });
    } catch (error) {
      console.error('Failed to show loading state:', error);
    }
  }

  /**
   * Hide loading state
   */
  private hideLoading(): void {
    const loadingEl = this.containerEl.querySelector('.vault-pal-loading');
    if (loadingEl) {
      loadingEl.remove();
    }
  }

  /**
   * Show error state in the view
   */
  private showError(error: unknown): void {
    try {
      const container = this.getContentContainer();
      container.empty();

      const errorDiv = container.createDiv({
        cls: 'vault-pal-error',
      });

      errorDiv.createEl('h3', {
        text: 'Failed to load Vault Pal',
      });

      errorDiv.createEl('p', {
        text: error instanceof Error ? error.message : 'Unknown error',
        cls: 'vault-pal-error-message',
      });

      errorDiv.createEl('p', {
        text: 'Check the console for more details.',
        cls: 'vault-pal-error-hint',
      });
    } catch (containerError) {
      console.error('Failed to show error state:', containerError);
      console.error('Original error:', error);
    }
  }

  /**
   * Get the current pet state (for external access)
   */
  getCurrentState(): PetState | null {
    return this.stateMachine?.getCurrentState() ?? null;
  }

  /**
   * Manually trigger a state transition (for external access)
   */
  transitionState(newState: PetState): boolean {
    return this.stateMachine?.transition(newState) ?? false;
  }

  /**
   * Get the content container safely with bounds checking
   * @throws Error if container element not found
   */
  private getContentContainer(): HTMLElement {
    const container = this.containerEl.children[1];
    if (!container) {
      throw new Error(
        'Pet view container element not found. Obsidian DOM structure may have changed.'
      );
    }
    return container as HTMLElement;
  }

  /**
   * Get the path to the pet sprite sheet asset with validation
   * @returns The resource path to the sprite sheet
   */
  private getSpriteSheetPath(): string {
    // @ts-expect-error - accessing plugin manifest
    const manifest = this.app.plugins.manifests['vault-pal'];

    if (!manifest) {
      console.warn('Vault Pal manifest not found, using fallback path');
    }

    const pluginDir = manifest?.dir || '.obsidian/plugins/vault-pal';

    // Validate path doesn't contain traversal sequences
    if (
      pluginDir.includes('..') ||
      pluginDir.includes('~') ||
      pluginDir.startsWith('/') ||
      /^[a-zA-Z]:/.test(pluginDir.substring(1))
    ) {
      throw new Error('Invalid plugin directory path detected');
    }

    // Normalize path and construct resource path
    const normalizedDir = pluginDir.replace(/\\/g, '/').replace(/\/\//g, '/');
    const relativePath = `${normalizedDir}/assets/pet-sprite-sheet.png`;
    const spriteSheetPath =
      this.app.vault.adapter.getResourcePath(relativePath);

    console.debug(`Sprite sheet path resolved to: ${spriteSheetPath}`);

    return spriteSheetPath;
  }

  /**
   * Create or open today's daily note
   * Handles edge cases: plugin disabled, creation errors
   */
  async openDailyNote(): Promise<void> {
    try {
      const {
        createDailyNote,
        getDailyNote,
        getAllDailyNotes,
        appHasDailyNotesPluginLoaded
      } = await import('obsidian-daily-notes-interface');

      // Edge case: Daily Notes plugin not enabled
      if (!appHasDailyNotesPluginLoaded()) {
        new Notice('Daily Notes plugin is not enabled. Please enable it in Settings → Core Plugins.');
        return;
      }

      // Get or create today's note
      const today = window.moment();
      let dailyNote = getDailyNote(today, getAllDailyNotes());

      if (!dailyNote) {
        dailyNote = await createDailyNote(today);
      }

      // Open in workspace
      await this.app.workspace.getLeaf(false).openFile(dailyNote);

    } catch (error) {
      new Notice('Failed to create daily note: ' + (error as Error).message);
      console.error('Error opening daily note:', error);
    }
  }
}
