import { ItemView, type WorkspaceLeaf, Notice } from 'obsidian';
import type { PetState, StateChangeListener } from '../types/pet';
import { PetStateMachine } from '../pet/PetStateMachine';
import PetComponent from '../components/Pet.svelte';
import type ObsidianPetsPlugin from '../main';
import { WelcomeModal } from '../modals/WelcomeModal';
import { PET_SPRITES, EFFECT_SPRITES, BACKGROUNDS, ASSET_DIRECTORIES } from '../utils/asset-paths';

// Build-time constant injected by esbuild
declare const __DEV__: boolean;

/**
 * View type identifier for the pet view
 */
export const VIEW_TYPE_PET = 'obsidian-pets-pet-view';

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
    return 'Obsidian Pets';
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
      // Access plugin instance from internal registry (may break with Obsidian API changes)
      // Type assertion required as this uses undocumented Obsidian API
      interface AppWithPlugins {
        plugins: { plugins: Record<string, unknown> };
      }
      const appWithPlugins = this.app as unknown as AppWithPlugins;
      let plugin: ObsidianPetsPlugin | undefined;
      if (appWithPlugins.plugins?.plugins && typeof appWithPlugins.plugins.plugins === 'object' && 'obsidian-pets' in appWithPlugins.plugins.plugins) {
        plugin = appWithPlugins.plugins.plugins['obsidian-pets'] as ObsidianPetsPlugin;
        if (plugin && !plugin.settings.hasCompletedWelcome) {
          new WelcomeModal(plugin).open();
        }
      }

      // Show loading state
      this.showLoading();

      // Initialize state machine
      this.stateMachine = new PetStateMachine();

      // Create container for pet component
      const contentContainer = this.getContentContainer();
      this.containerDiv = contentContainer.createDiv({
        cls: 'obsidian-pets-container',
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

      // Get asset paths with validation using centralized constants
      const walkingSpritePath = this.getAssetPath(PET_SPRITES.WALKING);
      const pettingSpritePath = this.getAssetPath(PET_SPRITES.PETTING);
      const celebrationSpritePath = this.getAssetPath(PET_SPRITES.CELEBRATING);
      const fireworksSpritePath = this.getAssetPath(EFFECT_SPRITES.FIREWORKS, ASSET_DIRECTORIES.EFFECTS);
      const backgroundPath = this.getAssetPath(BACKGROUNDS.DEFAULT, ASSET_DIRECTORIES.BACKGROUNDS);

      // Get plugin settings for pet name and movement speed (reuse plugin variable from above)
      const petName = plugin?.settings?.petName ?? 'Kit';
      const movementSpeed = plugin?.settings?.movementSpeed ?? 50;

      // Mount Svelte component with asset path and settings
      this.petComponent = new PetComponent({
        target: this.containerDiv,
        props: {
          state: this.stateMachine.getCurrentState(),
          walkingSpritePath: walkingSpritePath,
          pettingSpritePath: pettingSpritePath,
          celebrationSpritePath: celebrationSpritePath,
          fireworksSpritePath: fireworksSpritePath,
          backgroundPath: backgroundPath,
          petName: petName,
          movementSpeed: movementSpeed,
        },
      });

      // Setup pet interaction event handling
      this.setupPetInteraction();

      // Hide loading state
      this.hideLoading();
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
        'celebration',
        'petting',
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
        cls: 'obsidian-pets-loading',
        text: 'Loading Obsidian Pets...',
      });
    } catch (error) {
      console.error('Failed to show loading state:', error);
    }
  }

  /**
   * Hide loading state
   */
  private hideLoading(): void {
    const loadingEl = this.containerEl.querySelector('.obsidian-pets-loading');
    if (loadingEl) {
      loadingEl.remove();
    }
  }

  /**
   * Categorize error and provide user-friendly message
   */
  private categorizeError(error: unknown): { title: string; message: string; hint: string } {
    const errorMsg = error instanceof Error ? error.message : String(error);

    // Path/asset loading errors
    if (errorMsg.includes('asset') || errorMsg.includes('path') || errorMsg.includes('file')) {
      return {
        title: 'Asset Loading Failed',
        message: errorMsg,
        hint: 'The pet assets (images/sprites) could not be loaded. Try reinstalling the plugin.',
      };
    }

    // Component mounting errors
    if (errorMsg.includes('mount') || errorMsg.includes('component')) {
      return {
        title: 'Component Initialization Failed',
        message: errorMsg,
        hint: 'Failed to initialize the pet component. Try reloading Obsidian.',
      };
    }

    // Permission/security errors
    if (errorMsg.includes('permission') || errorMsg.includes('denied') || errorMsg.includes('Invalid')) {
      return {
        title: 'Security Error',
        message: errorMsg,
        hint: 'A security check failed. This might be a plugin installation issue.',
      };
    }

    // Generic error
    return {
      title: 'Failed to load Obsidian Pets',
      message: errorMsg,
      hint: 'An unexpected error occurred. Check the console (Ctrl+Shift+I) for details.',
    };
  }

  /**
   * Show error state in the view with categorized error messages
   */
  private showError(error: unknown): void {
    try {
      const container = this.getContentContainer();
      container.empty();

      const { title, message, hint } = this.categorizeError(error);

      const errorDiv = container.createDiv({
        cls: 'obsidian-pets-view-error',
      });

      errorDiv.createEl('h3', { text: title });

      errorDiv.createEl('p', {
        text: message,
        cls: 'obsidian-pets-view-error-message',
      });

      errorDiv.createEl('p', {
        text: hint,
        cls: 'obsidian-pets-view-error-hint',
      });

      // Also show as notice for visibility
      new Notice(`Obsidian Pets: ${message}`, 8000);
    } catch (containerError) {
      console.error('Failed to show error state:', containerError);
      console.error('Original error:', error);
      // Fallback notice
      new Notice('Obsidian Pets failed to load. Check the console for details.', 8000);
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
   * Get the content container safely with multiple fallback strategies
   * @throws Error if container element not found
   */
  private getContentContainer(): HTMLElement {
    // Strategy 1: Try standard Obsidian ItemView content container class
    let container = this.containerEl.querySelector('.view-content') as HTMLElement;

    // Strategy 2: Try children[1] (traditional Obsidian structure)
    if (!container && this.containerEl.children.length > 1) {
      container = this.containerEl.children[1] as HTMLElement;
    }

    // Strategy 3: Find first div child that's not a header
    if (!container) {
      const children = Array.from(this.containerEl.children);
      container = children.find(
        (el) => el.tagName === 'DIV' && !el.classList.contains('view-header')
      ) as HTMLElement;
    }

    // Strategy 4: Create fallback container if none exists
    if (!container) {
      console.warn('Standard container not found, creating fallback container');
      container = this.containerEl.createDiv({ cls: 'view-content' });
    }

    return container;
  }

  /**
   * Check if a path is absolute (cross-platform)
   * @param pathStr - Path to check
   * @returns true if path is absolute
   */
  private isAbsolutePath(pathStr: string): boolean {
    // Unix/Linux/Mac absolute paths start with /
    if (pathStr.startsWith('/')) return true;
    // Windows absolute paths: C:\ or C:/ (drive letter followed by colon and slash)
    if (/^[a-zA-Z]:[/\\]/.test(pathStr)) return true;
    // UNC paths: \\server\share
    if (pathStr.startsWith('\\\\')) return true;
    return false;
  }

  /**
   * Get the path to an asset file with validation
   * @param assetFileName - Name of the asset file (e.g., 'pet-sprite-sheet.png'), or empty string for directory path
   * @param subdirectory - Optional subdirectory within assets/ (e.g., 'backgrounds')
   * @returns The resource path to the asset
   * @throws Error if path validation fails
   */
  private getAssetPath(assetFileName: string, subdirectory?: string): string {
    // Access plugin manifest safely using type assertion (undocumented Obsidian API)
    interface AppWithManifests {
      plugins: { manifests: Record<string, { dir?: string }> };
    }
    const appWithManifests = this.app as unknown as AppWithManifests;
    const manifest = appWithManifests.plugins?.manifests?.['obsidian-pets'];

    if (!manifest) {
      console.warn('Obsidian Pets manifest not found, using fallback path');
    }

    const pluginDir = manifest?.dir || '.obsidian/plugins/obsidian-pets';

    // Validate path doesn't contain traversal sequences or absolute paths
    if (
      pluginDir.includes('..') ||
      pluginDir.includes('~') ||
      this.isAbsolutePath(pluginDir)
    ) {
      throw new Error('Invalid plugin directory path detected');
    }

    // Security: Validate subdirectory if provided
    if (subdirectory) {
      if (!/^[a-zA-Z0-9_-]+$/.test(subdirectory)) {
        throw new Error('Invalid subdirectory: must be alphanumeric with dash/underscore only');
      }
      if (subdirectory.includes('..') || subdirectory.includes('/') || subdirectory.includes('\\')) {
        throw new Error('Invalid subdirectory: path traversal detected');
      }
    }

    // Security: Validate asset filename to prevent path traversal and DoS
    // Allow empty string for directory paths, otherwise must be valid filename
    if (assetFileName !== '') {
      // Length validation to prevent DoS attacks
      if (assetFileName.length > 255) {
        throw new Error('Invalid asset filename: exceeds maximum length (255 characters)');
      }

      // Only allow alphanumeric, dash, underscore, and dot for file extension
      // Filename: 1-200 chars, Extension: 1-10 chars
      if (!/^[a-zA-Z0-9_-]{1,200}\.[a-zA-Z0-9]{1,10}$/.test(assetFileName)) {
        throw new Error('Invalid asset filename: must be alphanumeric with valid file extension');
      }

      // Additional check: ensure no path separators or traversal sequences
      if (assetFileName.includes('..') || assetFileName.includes('/') || assetFileName.includes('\\')) {
        throw new Error('Invalid asset filename: path traversal detected');
      }

      // Whitelist common asset extensions for additional security
      const allowedExtensions = ['gif', 'png', 'jpg', 'jpeg', 'svg', 'webp'];
      const extension = assetFileName.split('.').pop()?.toLowerCase();
      if (!extension || !allowedExtensions.includes(extension)) {
        throw new Error(`Invalid asset extension: only ${allowedExtensions.join(', ')} are allowed`);
      }
    }

    // Normalize path and construct resource path
    const normalizedDir = pluginDir.replace(/\\/g, '/').replace(/\/\//g, '/');
    const assetSubpath = subdirectory
      ? assetFileName !== ''
        ? `${subdirectory}/${assetFileName}`
        : subdirectory
      : assetFileName;
    const relativePath = `${normalizedDir}/assets/${assetSubpath}`;
    const assetPath = this.app.vault.adapter.getResourcePath(relativePath);

    // Gate debug logging behind __DEV__ flag
    if (__DEV__) {
      console.debug(`Asset path for ${assetFileName || subdirectory} resolved to: ${assetPath}`);
    }

    return assetPath;
  }



}
