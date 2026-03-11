import { ItemView, MarkdownView, setIcon, type WorkspaceLeaf, Notice, type ViewStateResult } from 'obsidian';
import type { PetState, StateChangeListener } from '../types/pet';
import { PetStateMachine } from '../pet/PetStateMachine';
import PetComponent from '../components/Pet.svelte';
import StatsComponent from '../components/Stats.svelte';
import type CheersPlugin from '../main';
import { PET_SPRITES, getBackgroundForTheme } from '../utils/asset-paths';
import { CelebrationService } from '../celebrations/CelebrationService';

/** Debounce delay (ms) for refreshing the stats panel on editor-change events. */
const STATS_DEBOUNCE_MS = 150;

/**
 * View type identifier for the pet view
 */
export const VIEW_TYPE_PET = 'cheers-pet-view';

/**
 * Pet View - Main ItemView for displaying the pet companion
 */
/** Props passed to Stats.svelte. All fields must match the component's prop declarations. */
interface StatsProps {
  wordsAddedToday: number;
  notesCreatedToday: number;
  linksCreatedToday: number;
  tasksCompletedToday: number;
  dailyWordGoal: number | null;
  showNotesColumn: boolean;
  showLinksColumn: boolean;
  showTasksColumn: boolean;
  fileWordCount: number | null;
  fileWordGoal: number | null;
  colorMode: 'warm' | 'cool';
}

export class PetView extends ItemView {
  public petComponent: PetComponent | null = null;
  private statsComponent: InstanceType<typeof StatsComponent> | null = null;
  private stateMachine: PetStateMachine | null = null;
  private containerDiv: HTMLDivElement | null = null;
  private petPanel: HTMLElement | null = null;
  private statsPanel: HTMLElement | null = null;
  private petTabEl: HTMLElement | null = null;
  private statsTabEl: HTMLElement | null = null;
  private stateChangeListener: StateChangeListener | null = null;
  private petEventListener: ((event: CustomEvent<{ returnToState: PetState }>) => void) | null = null;
  private plugin: CheersPlugin | null = null;
  private activeTab: 'pet' | 'stats' = 'pet';
  private statsEditorChangeTimeout: number | undefined;
  constructor(leaf: WorkspaceLeaf, plugin: CheersPlugin | null = null) {
    super(leaf);
    this.plugin = plugin;
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
    return 'Cheers';
  }

  /**
   * Get the icon for the view tab
   */
  getIcon(): string {
    return 'party-popper';
  }

  getState(): Record<string, unknown> {
    return { activeTab: this.activeTab };
  }

  async setState(state: Record<string, unknown>, result: ViewStateResult): Promise<void> {
    await super.setState(state, result);
    const tab = state.activeTab;
    if (tab === 'pet' || tab === 'stats') {
      this.switchTab(tab);
    }
  }

  /**
   * Called when the view is opened
   */
  async onOpen(): Promise<void> {
    try {
      // Resolve plugin: prefer constructor-injected instance (production path via main.ts),
      // fall back to internal registry lookup (test / late-open path).
      if (this.plugin === null) {
        const appWithPlugins = this.app as any;
        this.plugin = (appWithPlugins.plugins?.plugins?.['cheers'] as CheersPlugin | undefined) ?? null;
      }
      const plugin = this.plugin;
      this.activeTab = 'pet';

      // Show loading state
      this.showLoading();

      // Initialize state machine
      this.stateMachine = new PetStateMachine();

      // Build tab bar + panels inside the content container
      const contentContainer = this.getContentContainer();

      const tabBar = contentContainer.createDiv({ cls: 'vp-tab-bar' });
      this.petTabEl = tabBar.createDiv({ cls: 'vp-tab-pet' });
      this.petTabEl.classList.add('is-active');
      this.statsTabEl = tabBar.createDiv({ cls: 'vp-tab-stats' });

      setIcon(this.petTabEl, 'cat');
      this.petTabEl.setAttribute('aria-label', 'Pet');
      setIcon(this.statsTabEl, 'bar-chart-2');
      this.statsTabEl.setAttribute('aria-label', 'Today');

      const panelsContainer = contentContainer.createDiv({ cls: 'vp-panels-container' });
      this.petPanel = panelsContainer.createDiv({ cls: 'vp-panel-pet' });
      this.statsPanel = panelsContainer.createDiv({ cls: 'vp-panel-stats' });
      this.statsPanel.classList.add('vp-panel-hidden');

      // Wire tab click handlers
      this.registerDomEvent(this.petTabEl!, 'click', () => this.switchTab('pet'));
      this.registerDomEvent(this.statsTabEl!, 'click', () => this.switchTab('stats'));

      // Create pet component container inside the pet panel
      this.containerDiv = this.petPanel!.createDiv({
        cls: 'cheers-container',
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

      // GIFs are inlined as base64 data URLs by esbuild — no filesystem access needed
      const bg = getBackgroundForTheme(plugin?.settings?.backgroundTheme ?? 'day');

      // Get plugin settings for pet name and movement speed (reuse plugin variable from above)
      const petName = plugin?.settings?.petName ?? 'Mochi';
      const movementSpeed = plugin?.settings?.movementSpeed ?? 50;

      // Mount Svelte component with asset path and settings
      this.petComponent = new PetComponent({
        target: this.containerDiv,
        props: {
          state: this.stateMachine.getCurrentState(),
          walkingSpritePath: PET_SPRITES.WALKING,
          pettingSpritePath: PET_SPRITES.PETTING,
          celebrationSpritePath: PET_SPRITES.CELEBRATING,
          backgroundPath: bg.src,
          background: bg,
          petName: petName,
          movementSpeed: movementSpeed,
        },
      });

      // Mount Stats Svelte component into the stats panel
      if (this.statsPanel) {
        try {
          this.statsComponent = new StatsComponent({
            target: this.statsPanel,
            props: {},
          });
        } catch (error) {
          console.error('Failed to mount Stats component:', error);
          // Stats tab will be empty but pet tab remains functional
        }
      }

      // Register workspace events to refresh stats panel when it is visible
      this.registerEvent(this.app.workspace.on('editor-change', () => {
        if (this.activeTab !== 'stats') return;
        if (this.statsEditorChangeTimeout !== undefined) {
          window.clearTimeout(this.statsEditorChangeTimeout);
        }
        this.statsEditorChangeTimeout = window.setTimeout(() => {
          this.statsEditorChangeTimeout = undefined;
          this.updateStatsComponent();
        }, STATS_DEBOUNCE_MS);
      }));

      this.registerEvent(this.app.workspace.on('active-leaf-change', () => {
        if (this.activeTab === 'stats') {
          this.updateStatsComponent();
        }
      }));

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

    // Destroy Stats Svelte component
    if (this.statsComponent) {
      this.statsComponent.$destroy();
      this.statsComponent = null;
    }

    // Null out reference for GC ($destroy above already removed the Svelte listener)
    this.petEventListener = null;

    // Clean up state machine
    if (this.stateMachine) {
      this.stateMachine.cleanup();
      this.stateMachine = null;
    }

    // Clear stats debounce timer
    if (this.statsEditorChangeTimeout !== undefined) {
      window.clearTimeout(this.statsEditorChangeTimeout);
      this.statsEditorChangeTimeout = undefined;
    }

    // Clear container
    this.containerEl.empty();
    this.containerDiv = null;
    this.petPanel = null;
    this.statsPanel = null;
    this.petTabEl = null;
    this.statsTabEl = null;
    this.plugin = null;
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
        cls: 'cheers-loading',
        text: 'Loading Cheers...',
      });
    } catch (error) {
      console.error('Failed to show loading state:', error);
    }
  }

  /**
   * Hide loading state
   */
  private hideLoading(): void {
    const loadingEl = this.containerEl.querySelector('.cheers-loading');
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
      title: 'Failed to load Cheers',
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
        cls: 'cheers-view-error',
      });

      errorDiv.createEl('h3', { text: title });

      errorDiv.createEl('p', {
        text: message,
        cls: 'cheers-view-error-message',
      });

      errorDiv.createEl('p', {
        text: hint,
        cls: 'cheers-view-error-hint',
      });

      // Also show as notice for visibility
      new Notice(`Cheers: ${message}`, 8000);
    } catch (containerError) {
      console.error('Failed to show error state:', containerError);
      console.error('Original error:', error);
      // Fallback notice
      new Notice('Cheers failed to load. Check the console for details.', 8000);
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
   * Push updated stats props to the Stats Svelte component.
   * Called by CelebrationService whenever daily activity counters change.
   * Safe to call before onOpen() or after onClose() — no-op when component is absent.
   */
  updateStatsComponent(): void {
    if (!this.statsComponent) return;
    const plugin = this.plugin;
    // Guard: dailyWordData may be absent on partially-populated test stubs
    if (!plugin || !plugin.dailyWordData) return;
    this.statsComponent.$set(this.buildStatsProps(plugin));
  }

  /**
   * Derive the props object passed to Stats.svelte from current plugin state.
   * Precondition: plugin.dailyWordData is present (enforced by updateStatsComponent).
   */
  private buildStatsProps(plugin: CheersPlugin): StatsProps {
    const daily = plugin.dailyWordData;
    const cel = plugin.settings.celebrations;
    const dailyWordGoal: number | null = cel.onWordGoal ? cel.dailyWordGoal : null;

    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    const fileWordCount: number | null = activeView
      ? CelebrationService.countWords(activeView.editor.getValue())
      : null;

    const raw = cel.onWordGoal && activeView?.file
      ? this.app.metadataCache.getFileCache(activeView.file)?.frontmatter?.['word-goal']
      : undefined;
    const parsedGoal = typeof raw === 'number' ? raw : parseInt(String(raw ?? ''), 10);
    const fileWordGoal: number | null = Number.isFinite(parsedGoal) && parsedGoal > 0 ? parsedGoal : null;

    return {
      wordsAddedToday: daily.wordsAddedToday,
      notesCreatedToday: daily.notesCreatedToday,
      linksCreatedToday: daily.linksCreatedToday,
      tasksCompletedToday: daily.tasksCompletedToday,
      dailyWordGoal,
      showNotesColumn: cel.onNoteCreate,
      showLinksColumn: cel.onLinkCreate,
      showTasksColumn: cel.onTaskComplete,
      fileWordCount,
      fileWordGoal,
      colorMode: plugin.settings.dashboardColorMode,
    };
  }

  /**
   * Switch between the Pet and Stats tabs.
   */
  private switchTab(tab: 'pet' | 'stats'): void {
    const showPet = tab === 'pet';
    this.petPanel?.classList.toggle('vp-panel-hidden', !showPet);
    this.statsPanel?.classList.toggle('vp-panel-hidden', showPet);
    this.petTabEl?.classList.toggle('is-active', showPet);
    this.statsTabEl?.classList.toggle('is-active', !showPet);
    this.activeTab = tab;
    if (tab === 'stats') {
      this.updateStatsComponent();
    }
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

    // Strategy 4: Expected DOM structure not found — fail loudly rather than
    // silently mounting content in the wrong container.
    if (!container) {
      throw new Error('View content container not found — Obsidian DOM structure may have changed');
    }

    return container;
  }

  /**
   * Apply the background from the current backgroundTheme setting to the pet component.
   * Called by SettingsTab when the user changes the background theme.
   */
  applyBackground(): void {
    if (!this.petComponent) return;
    const theme = this.plugin?.settings?.backgroundTheme ?? 'day';
    const bg = getBackgroundForTheme(theme);
    this.petComponent.$set({ backgroundPath: bg.src, background: bg });
  }
}
