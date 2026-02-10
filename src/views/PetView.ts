import { ItemView, type WorkspaceLeaf, Notice } from 'obsidian';
import type { PetState, StateChangeListener } from '../types/pet';
import { PetStateMachine } from '../pet/PetStateMachine';
import PetComponent from '../components/Pet.svelte';
import type VaultPalPlugin from '../main';
import { WelcomeModal } from '../modals/WelcomeModal';

// Build-time constant injected by esbuild
declare const __DEV__: boolean;

/**
 * View type identifier for the pet view
 */
export const VIEW_TYPE_PET = 'vault-pal-pet-view';

/**
 * Pet View - Main ItemView for displaying the pet companion
 */
export class PetView extends ItemView {
  public petComponent: PetComponent | null = null;
  private stateMachine: PetStateMachine | null = null;
  private containerDiv: HTMLDivElement | null = null;
  private stateChangeListener: StateChangeListener | null = null;
  private petEventListener: ((event: CustomEvent<{ returnToState: PetState }>) => void) | null = null;

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
      const heartSpritePath = this.getHeartSpritePath();

      // Get plugin settings for pet name and movement speed (reuse plugin variable from above)
      const petName = plugin?.settings?.petName ?? 'Kit';
      const movementSpeed = plugin?.settings?.movementSpeed ?? 50;

      // Mount Svelte component with asset path and settings
      this.petComponent = new PetComponent({
        target: this.containerDiv,
        props: {
          state: this.stateMachine.getCurrentState(),
          spriteSheetPath: spriteSheetPath,
          heartSpritePath: heartSpritePath,
          petName: petName,
          movementSpeed: movementSpeed,
        },
      });

      // Setup pet interaction event handling
      this.setupPetInteraction();

      // Hide loading state
      this.hideLoading();

      // Add top-right corner action button (matches Graph view pattern)
      this.addAction(
        'calendar-plus',
        'Daily Note',
        () => this.handleDailyNoteButton()
      );
    } catch (error) {
      console.error('Failed to mount Pet View:', error);

      // Hide loading state before showing error
      this.hideLoading();

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

    // Destroy Svelte component (automatically cleans up all event listeners)
    if (this.petComponent) {
      this.petComponent.$destroy();
      this.petComponent = null;
    }

    // Clear pet event listener reference
    this.petEventListener = null;

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
   * Setup pet interaction event handling
   * Listens for 'pet' events from the Pet component and triggers petting animation
   */
  private setupPetInteraction(): void {
    if (!this.petComponent) return;

    // Store listener reference for cleanup
    this.petEventListener = (event: CustomEvent<{ returnToState: PetState }>) => {
      const { returnToState } = event.detail;
      if (this.stateMachine) {
        this.stateMachine.transition('petting', returnToState);
      }
    };

    // Add event listener to pet component
    this.petComponent.$on('pet', this.petEventListener);
  }

  /**
   * Update the data-pet-state attribute on the container
   * Validates state before setting to prevent DOM-based XSS
   */
  private updateDataAttribute(state: PetState): void {
    if (this.containerDiv) {
      // Validate state against known valid states
      const validStates: PetState[] = [
        'walking',
        'running',
        'greeting',
        'celebration',
        'petting',
        'sleeping',
      ];

      if (validStates.includes(state)) {
        this.containerDiv.dataset.petState = state;
      } else {
        console.error(`Attempted to set invalid state: ${state}`);
      }
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
        cls: 'vault-pal-view-error',
      });

      errorDiv.createEl('h3', {
        text: 'Failed to load Vault Pal',
      });

      errorDiv.createEl('p', {
        text: error instanceof Error ? error.message : 'Unknown error',
        cls: 'vault-pal-view-error-message',
      });

      errorDiv.createEl('p', {
        text: 'Check the console for more details.',
        cls: 'vault-pal-view-error-hint',
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
  transitionState(newState: PetState, returnTarget?: PetState): boolean {
    return this.stateMachine?.transition(newState, returnTarget) ?? false;
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
   * Get the path to an asset file with validation
   * @param assetFileName - Name of the asset file (e.g., 'pet-sprite-sheet.png')
   * @returns The resource path to the asset
   * @throws Error if path validation fails
   */
  private getAssetPath(assetFileName: string): string {
    // @ts-expect-error - accessing plugin manifest
    const manifest = this.app.plugins.manifests['vault-pal'];

    if (!manifest) {
      console.warn('Vault Pal manifest not found, using fallback path');
    }

    const pluginDir = manifest?.dir || '.obsidian/plugins/vault-pal';

    // Validate path doesn't contain traversal sequences or absolute paths
    if (
      pluginDir.includes('..') ||
      pluginDir.includes('~') ||
      pluginDir.startsWith('/') ||
      /^[a-zA-Z]:/.test(pluginDir) // Fixed: test from index 0, not substring(1)
    ) {
      throw new Error('Invalid plugin directory path detected');
    }

    // Security: Validate asset filename to prevent path traversal
    // Only allow alphanumeric, dash, underscore, and dot for file extension
    if (!/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(assetFileName)) {
      throw new Error('Invalid asset filename: must be alphanumeric with single file extension');
    }

    // Additional check: ensure no path separators or traversal sequences
    if (assetFileName.includes('..') || assetFileName.includes('/') || assetFileName.includes('\\')) {
      throw new Error('Invalid asset filename: path traversal detected');
    }

    // Normalize path and construct resource path
    const normalizedDir = pluginDir.replace(/\\/g, '/').replace(/\/\//g, '/');
    const relativePath = `${normalizedDir}/assets/${assetFileName}`;
    const assetPath = this.app.vault.adapter.getResourcePath(relativePath);

    // Gate debug logging behind __DEV__ flag
    if (__DEV__) {
      console.debug(`Asset path for ${assetFileName} resolved to: ${assetPath}`);
    }

    return assetPath;
  }

  /**
   * Get the path to the pet sprite sheet asset
   * @returns The resource path to the sprite sheet
   */
  private getSpriteSheetPath(): string {
    return this.getAssetPath('pet-sprite-sheet.png');
  }

  /**
   * Get the path to the heart sprite asset
   * @returns The resource path to the heart sprite
   */
  private getHeartSpritePath(): string {
    return this.getAssetPath('heart.png');
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
        new Notice('Daily Notes plugin is not enabled. Please enable it in Settings → Core Plugins.', 8000);
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
      new Notice('Failed to create daily note: ' + (error as Error).message, 8000);
      console.error('Error opening daily note:', error);
    }
  }

  /**
   * Handle daily note button click
   * Opens or creates today's daily note
   */
  async handleDailyNoteButton(): Promise<void> {
    await this.openDailyNote();
  }

}
