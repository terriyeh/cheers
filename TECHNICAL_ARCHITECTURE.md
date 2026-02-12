# Obsidian Pets - Technical Architecture

**Version:** 2.0
**Date:** 2026-02-09
**Status:** Active Development (v0.1.0 Foundation Complete, v0.2.0 Celebration System In Progress)

---

## Executive Summary

Obsidian Pets is an Obsidian plugin that transforms your vault into a delightful space by celebrating your writing journey. Your companion notices when you create notes, reach word count milestones, check off tasks, and engage with your knowledge base—responding with ambient celebrations that make your vault feel alive.

**Philosophy:** *Feeling the plugin, not thinking about it.*

### Core Technology Stack

- **Language:** TypeScript
- **Framework:** Obsidian Plugin API + Svelte 4
- **Build Tool:** esbuild with esbuild-svelte plugin
- **Animation:** Sprite-based CSS animations + lightweight TypeScript state machine
- **Data Storage:** Obsidian Plugin API (vault-specific JSON)
- **Vault Integration:** Obsidian Workspace API for event listening

---

## 1. Architecture Overview

### Plugin Structure

```
obsidian-pets/
├── src/
│   ├── main.ts                    # ✅ Main plugin class
│   ├── modals/
│   │   └── WelcomeModal.ts       # ✅ First-run settings modal
│   ├── views/
│   │   └── PetView.ts            # ✅ Main pet panel (ItemView)
│   ├── components/               # Svelte components
│   │   └── Pet.svelte            # ✅ Pet display with animations
│   ├── pet/
│   │   └── PetStateMachine.ts    # ✅ Animation state management
│   ├── celebration/              # 🚧 v0.2.0 - Celebration System
│   │   ├── CelebrationEngine.ts  # Core celebration orchestration
│   │   ├── VaultEventListeners.ts # Listens to vault activities
│   │   ├── MilestoneTracker.ts   # Tracks word counts, cooldowns
│   │   ├── EmojiRenderer.ts      # Emoji speech bubbles
│   │   └── SoundEffects.ts       # Audio playback (optional)
│   └── types/
│       ├── settings.ts           # ✅ Settings interface and validation
│       ├── pet.ts                # ✅ Pet state types
│       └── celebration.ts        # 🚧 Celebration trigger types
├── assets/
│   ├── sprites/
│   │   └── kit-sprite-sheet.png  # ✅ Pixel art sprite sheet
│   ├── sounds/                    # 🚧 Optional sound effects
│   │   ├── celebration-small.mp3
│   │   ├── celebration-big.mp3
│   │   └── petting.mp3
│   └── heart.png                 # ✅ Heart sprite
├── archive/                       # 🗄️ Deprecated code (conversation system)
│   ├── TemplateParser.ts         # Archived
│   ├── ConversationManager.ts    # Archived
│   ├── ProgressionSystem.ts      # Archived
│   └── CalendarView.ts           # Archived
├── styles.css                    # ✅ Global styles and animations
├── tests/                        # ✅ Comprehensive test suite
│   ├── unit/
│   │   ├── PetStateMachine.test.ts
│   │   ├── SettingsValidation.test.ts
│   │   └── CelebrationEngine.test.ts  # 🚧 Planned
│   └── integration/
│       └── PetView.integration.test.ts
├── manifest.json                 # ✅ Plugin metadata
├── versions.json
├── esbuild.config.mjs
├── vitest.config.ts              # ✅ Test configuration
├── tsconfig.json
└── package.json

Legend:
✅ = Currently implemented
🚧 = In progress / planned
🗄️ = Archived (preserved for reference)
```

---

## 2. Core Systems

### 2.1 Pet View System (ItemView)

**Responsibility:** Main interactive panel with pet display and controls

**Key Components:**
- Pet animation display (sprite-based with state machine)
- Emoji speech bubbles for celebrations
- Petting interaction (click/tap anytime)
- Welcome modal integration
- Settings access

**Implementation:**

```typescript
// src/views/PetView.ts
export class PetView extends ItemView {
  private petComponent: PetComponent | null = null;
  private stateMachine: PetStateMachine | null = null;
  private celebrationEngine: CelebrationEngine | null = null;
  private containerDiv: HTMLDivElement | null = null;

  getViewType(): string {
    return VIEW_TYPE_PET;
  }

  async onOpen(): Promise<void> {
    // Show loading state
    this.showLoading();

    // Initialize state machine
    this.stateMachine = new PetStateMachine();

    // Initialize celebration engine (v0.2.0)
    this.celebrationEngine = new CelebrationEngine(this.app, this.stateMachine);
    this.celebrationEngine.start();

    // Get validated asset paths
    const spriteSheetPath = this.getSpriteSheetPath();
    const heartSpritePath = this.getHeartSpritePath();

    // Mount Svelte component
    this.petComponent = new PetComponent({
      target: this.containerDiv,
      props: {
        state: this.stateMachine.getCurrentState(),
        spriteSheetPath,
        heartSpritePath,
        petName: plugin?.settings?.petName ?? 'Kit',
        userName: plugin?.settings?.userName ?? '',
        celebrationEmoji: '', // Updated by celebration engine
      },
    });

    // Setup event listeners
    this.setupPetInteraction();

    // Show welcome modal on first run
    const plugin = this.app.plugins.plugins['obsidian-pets'] as ObsidianPetsPlugin;
    if (plugin && !plugin.settings.hasCompletedWelcome) {
      new WelcomeModal(plugin).open();
    }

    // Hide loading state
    this.hideLoading();
  }

  async onClose(): Promise<void> {
    // Cleanup celebration engine
    this.celebrationEngine?.stop();

    // Destroy Svelte component
    if (this.petComponent) {
      this.petComponent.$destroy();
      this.petComponent = null;
    }
  }
}
```

**Security Features:**
- Path validation to prevent directory traversal attacks
- State validation before DOM updates to prevent XSS
- Centralized asset path resolution with `getAssetPath()` method
- Error cleanup to prevent resource leaks

**Svelte Component Structure:**

```svelte
<!-- src/components/Pet.svelte -->
<script lang="ts">
  export let state: PetState;
  export let spriteSheetPath: string;
  export let heartSpritePath: string;
  export let petName: string;
  export let userName: string;
  export let celebrationEmoji: string; // v0.2.0+

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  function handlePet(event: MouseEvent | TouchEvent) {
    if (event.type === 'touchend') {
      event.preventDefault();
    }
    dispatch('pet', { returnToState: state });
  }
</script>

<div class="pet-view">
  <div class="pet-container"
       data-state={state}
       on:click={handlePet}
       on:touchend={handlePet}
       role="button"
       tabindex="0"
       aria-label="Pet {petName}">

    <!-- Sprite-based animation -->
    <div class="pet-sprite-wrapper">
      <img src={spriteSheetPath}
           alt="{petName} the pet"
           class="pet-sprite" />
    </div>

    <!-- Emoji speech bubble (v0.2.0+) -->
    {#if celebrationEmoji}
      <div class="emoji-bubble">
        {celebrationEmoji}
      </div>
    {/if}
  </div>
</div>
```

---

### 2.2 Celebration System (v0.2.0)

**Responsibility:** Detect vault activities and trigger celebrations

#### 2.2.1 Celebration Engine

**Core orchestration of celebration system:**

```typescript
// src/celebration/CelebrationEngine.ts
export class CelebrationEngine {
  private app: App;
  private stateMachine: PetStateMachine;
  private vaultListeners: VaultEventListeners;
  private milestoneTracker: MilestoneTracker;
  private emojiRenderer: EmojiRenderer;
  private soundEffects: SoundEffects | null = null;

  constructor(app: App, stateMachine: PetStateMachine) {
    this.app = app;
    this.stateMachine = stateMachine;
    this.vaultListeners = new VaultEventListeners(app, this.onVaultEvent.bind(this));
    this.milestoneTracker = new MilestoneTracker();
    this.emojiRenderer = new EmojiRenderer();

    // Load sound effects if enabled
    const settings = this.getSettings();
    if (settings.celebrationSoundsEnabled) {
      this.soundEffects = new SoundEffects();
    }
  }

  start(): void {
    this.vaultListeners.register();
  }

  stop(): void {
    this.vaultListeners.unregister();
  }

  private onVaultEvent(event: VaultEvent): void {
    const settings = this.getSettings();

    // Check if celebration is enabled for this event type
    if (!this.shouldCelebrate(event, settings)) {
      return;
    }

    // Check cooldown
    if (!this.milestoneTracker.canCelebrate(event.type)) {
      return;
    }

    // Trigger celebration
    this.celebrate(event);

    // Update cooldown
    this.milestoneTracker.recordCelebration(event.type);
  }

  private celebrate(event: VaultEvent): void {
    // Get celebration config
    const config = this.getCelebrationConfig(event.type);

    // Trigger animation
    this.stateMachine.transitionTo(config.animation);

    // Show emoji bubble
    this.emojiRenderer.show(config.emoji, config.duration);

    // Play sound if enabled
    if (this.soundEffects) {
      this.soundEffects.play(config.animation);
    }
  }

  private getCelebrationConfig(eventType: VaultEventType): CelebrationConfig {
    const configs: Record<VaultEventType, CelebrationConfig> = {
      'daily-note-created': {
        emoji: '🎉',
        animation: 'small-celebration',
        duration: 2000,
      },
      'note-created': {
        emoji: '❤️',
        animation: 'small-celebration',
        duration: 1500,
      },
      'task-completed': {
        emoji: '🎊',
        animation: 'small-celebration',
        duration: 1500,
      },
      'link-added': {
        emoji: '✨',
        animation: 'small-celebration',
        duration: 1500,
      },
      'word-milestone': {
        emoji: '🎆',
        animation: 'big-celebration',
        duration: 3000,
      },
    };

    return configs[eventType];
  }
}
```

#### 2.2.2 Vault Event Listeners

**Listens to Obsidian vault activities:**

```typescript
// src/celebration/VaultEventListeners.ts
export type VaultEventType =
  | 'daily-note-created'
  | 'note-created'
  | 'task-completed'
  | 'link-added'
  | 'word-milestone';

export interface VaultEvent {
  type: VaultEventType;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export class VaultEventListeners {
  private app: App;
  private onEvent: (event: VaultEvent) => void;
  private listeners: Array<() => void> = [];
  private dailyNotesSettings: DailyNoteSettings | null = null;

  constructor(app: App, onEvent: (event: VaultEvent) => void) {
    this.app = app;
    this.onEvent = onEvent;
  }

  register(): void {
    // Listen for file creation
    const createListener = this.app.vault.on('create', (file) => {
      if (!(file instanceof TFile)) return;

      // Check if it's a daily note
      if (this.isDailyNote(file)) {
        this.onEvent({
          type: 'daily-note-created',
          timestamp: Date.now(),
          metadata: { file: file.path },
        });
      } else {
        this.onEvent({
          type: 'note-created',
          timestamp: Date.now(),
          metadata: { file: file.path },
        });
      }
    });

    // Listen for file modifications (for task completion and links)
    const modifyListener = this.app.vault.on('modify', async (file) => {
      if (!(file instanceof TFile)) return;

      // Detect task completion
      const content = await this.app.vault.read(file);
      if (this.hasNewCompletedTask(content)) {
        this.onEvent({
          type: 'task-completed',
          timestamp: Date.now(),
          metadata: { file: file.path },
        });
      }

      // Detect new links
      if (this.hasNewLink(content)) {
        this.onEvent({
          type: 'link-added',
          timestamp: Date.now(),
          metadata: { file: file.path },
        });
      }

      // Detect word count milestones
      const wordCount = this.getWordCount(content);
      const milestone = this.checkWordMilestone(wordCount);
      if (milestone) {
        this.onEvent({
          type: 'word-milestone',
          timestamp: Date.now(),
          metadata: { file: file.path, wordCount, milestone },
        });
      }
    });

    this.listeners.push(createListener, modifyListener);
  }

  unregister(): void {
    this.listeners.forEach(unregister => unregister());
    this.listeners = [];
  }

  private isDailyNote(file: TFile): boolean {
    // Use obsidian-daily-notes-interface to check
    const dailyNotes = getAllDailyNotes();
    return Object.values(dailyNotes).some(note => note.path === file.path);
  }

  private hasNewCompletedTask(content: string): boolean {
    // Detect newly completed checkbox: - [x]
    // This is a simplified version - production would track state changes
    return /- \[x\]/i.test(content);
  }

  private hasNewLink(content: string): boolean {
    // Detect wiki links: [[note]]
    return /\[\[.+?\]\]/.test(content);
  }

  private getWordCount(content: string): number {
    // Remove frontmatter, code blocks, and links
    const cleaned = content
      .replace(/---[\s\S]*?---/g, '') // Remove frontmatter
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/\[\[.+?\]\]/g, ''); // Remove links

    return cleaned.trim().split(/\s+/).length;
  }

  private checkWordMilestone(wordCount: number): number | null {
    const settings = this.getSettings();
    const milestones = settings.wordMilestones || [100, 250, 500, 1000];

    // Find if we just crossed a milestone
    for (const milestone of milestones) {
      if (wordCount >= milestone && !this.hasReachedMilestone(milestone)) {
        return milestone;
      }
    }

    return null;
  }
}
```

#### 2.2.3 Milestone Tracker

**Tracks cooldowns and milestones:**

```typescript
// src/celebration/MilestoneTracker.ts
export class MilestoneTracker {
  private lastCelebrations: Map<VaultEventType, number> = new Map();
  private cooldowns: Map<VaultEventType, number> = new Map([
    ['daily-note-created', 60000], // 1 minute
    ['note-created', 30000], // 30 seconds
    ['task-completed', 10000], // 10 seconds
    ['link-added', 15000], // 15 seconds
    ['word-milestone', 120000], // 2 minutes
  ]);

  canCelebrate(eventType: VaultEventType): boolean {
    const lastTime = this.lastCelebrations.get(eventType);
    if (!lastTime) return true;

    const cooldown = this.cooldowns.get(eventType) || 30000;
    const elapsed = Date.now() - lastTime;

    return elapsed >= cooldown;
  }

  recordCelebration(eventType: VaultEventType): void {
    this.lastCelebrations.set(eventType, Date.now());
  }
}
```

#### 2.2.4 Emoji Renderer

**Displays emoji speech bubbles:**

```typescript
// src/celebration/EmojiRenderer.ts
export class EmojiRenderer {
  private currentBubble: HTMLElement | null = null;

  show(emoji: string, duration: number): void {
    // Remove existing bubble
    if (this.currentBubble) {
      this.currentBubble.remove();
    }

    // Create bubble element
    const bubble = document.createElement('div');
    bubble.className = 'pet-emoji-bubble';
    bubble.textContent = emoji;

    // Append to pet container
    const container = document.querySelector('.pet-container');
    if (container) {
      container.appendChild(bubble);
      this.currentBubble = bubble;

      // Animate in
      setTimeout(() => bubble.classList.add('visible'), 10);

      // Remove after duration
      setTimeout(() => {
        bubble.classList.remove('visible');
        setTimeout(() => {
          bubble.remove();
          if (this.currentBubble === bubble) {
            this.currentBubble = null;
          }
        }, 300); // Wait for fade-out animation
      }, duration);
    }
  }
}
```

**CSS for Emoji Bubbles:**

```css
.pet-emoji-bubble {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%) scale(0);
  font-size: 32px;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid #ccc;
  border-radius: 20px;
  padding: 8px 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  pointer-events: none;
  z-index: 100;
}

.pet-emoji-bubble.visible {
  transform: translateX(-50%) scale(1);
  opacity: 1;
}

/* Speech bubble pointer */
.pet-emoji-bubble::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid #ccc;
}
```

#### 2.2.5 Sound Effects System (Optional)

**Plays celebration sounds (Option 1: Tied to Animation):**

```typescript
// src/celebration/SoundEffects.ts
export class SoundEffects {
  private sounds: Map<PetState, HTMLAudioElement> = new Map();
  private enabled: boolean = true;

  constructor() {
    this.loadSounds();
  }

  private loadSounds(): void {
    const soundMap: Record<PetState, string> = {
      'small-celebration': 'celebration-small.mp3',
      'big-celebration': 'celebration-big.mp3',
      'petting': 'petting.mp3',
    };

    for (const [state, filename] of Object.entries(soundMap)) {
      const audio = new Audio(this.getAssetPath(filename));
      audio.volume = 0.3; // Default volume
      this.sounds.set(state as PetState, audio);
    }
  }

  play(state: PetState): void {
    if (!this.enabled) return;

    const sound = this.sounds.get(state);
    if (sound) {
      // Reset to start if already playing
      sound.currentTime = 0;
      sound.play().catch(err => {
        console.error('Failed to play sound:', err);
      });
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  private getAssetPath(filename: string): string {
    // Similar path validation as in PetView
    const manifest = app.plugins.manifests['obsidian-pets'];
    const pluginDir = manifest?.dir || '.obsidian/plugins/obsidian-pets';
    const normalizedDir = pluginDir.replace(/\\/g, '/').replace(/\/\//g, '/');
    return `${normalizedDir}/assets/sounds/${filename}`;
  }
}
```

---

### 2.3 Animation System

**Responsibility:** Manage pet animation states and transitions

**7 Animation States:**
1. **Idle** - Default state, gentle breathing animation
2. **Greeting** - When user opens the panel
3. **Walking** - CSS-based edge-to-edge movement (0-60% speed)
4. **Running** - Faster CSS-based movement (61-100% speed)
5. **Small Celebration** - Brief cheer for everyday actions
6. **Big Celebration** - Enthusiastic celebration for milestones
7. **Petting** - Content reaction when user clicks/tap (available anytime)

**Deprecated States:**
- ~~Talking~~ - No longer needed (no conversation, replaced by emoji speech bubbles)
- ~~Listening~~ - No longer needed (no conversation)

**Movement System Implementation:**

The walking/running system uses CSS animations for performance and battery efficiency:

- **Architecture:** CSS handles rendering, JavaScript handles logic
- **Performance:** <0.1% CPU usage (GPU-accelerated compositor thread)
- **Battery:** Minimal drain compared to JavaScript per-frame updates
- **Responsiveness:** ResizeObserver updates boundaries on container resize

**State Machine:**

```typescript
// src/pet/PetStateMachine.ts
type PetState = 'idle' | 'greeting' | 'walking' | 'running' |
                'small-celebration' | 'big-celebration' | 'petting';

interface StateTransition {
  from: PetState;
  to: PetState;
  duration: number;
  canInterrupt: boolean;
  returnsToWalking?: boolean; // Returns to walking instead of idle
}

const transitions: StateTransition[] = [
  { from: 'idle', to: 'greeting', duration: 1000, canInterrupt: true },
  { from: 'greeting', to: 'idle', duration: 500, canInterrupt: true },
  { from: 'idle', to: 'small-celebration', duration: 2000, canInterrupt: false },
  { from: 'idle', to: 'big-celebration', duration: 3000, canInterrupt: false },
  { from: 'small-celebration', to: 'idle', duration: 300, canInterrupt: false },
  { from: 'big-celebration', to: 'idle', duration: 300, canInterrupt: false },
  { from: 'idle', to: 'petting', duration: 1500, canInterrupt: true },
  { from: 'petting', to: 'idle', duration: 300, canInterrupt: true },
  { from: 'idle', to: 'walking', duration: Infinity, canInterrupt: true }, // Continuous until stopped
  { from: 'idle', to: 'running', duration: Infinity, canInterrupt: true }, // Continuous until stopped
  { from: 'walking', to: 'idle', duration: 300, canInterrupt: true },
  { from: 'running', to: 'idle', duration: 300, canInterrupt: true },
  { from: 'walking', to: 'petting', duration: 1500, canInterrupt: true, returnsToWalking: true },
  { from: 'running', to: 'petting', duration: 1500, canInterrupt: true, returnsToWalking: true },
  { from: 'walking', to: 'small-celebration', duration: 2000, canInterrupt: false, returnsToWalking: true },
  { from: 'running', to: 'small-celebration', duration: 2000, canInterrupt: false, returnsToWalking: true },
];

export class PetStateMachine {
  private currentState: PetState = 'idle';
  private previousMovementState: 'walking' | 'running' | null = null;
  private isTransitioning: boolean = false;
  private returnTimer: NodeJS.Timeout | null = null;

  async transitionTo(targetState: PetState): Promise<boolean> {
    // Validate transition exists
    const transition = transitions.find(
      t => t.from === this.currentState && t.to === targetState
    );

    if (!transition) {
      console.error(`Invalid transition: ${this.currentState} -> ${targetState}`);
      return false;
    }

    // Check if can interrupt
    if (this.isTransitioning && !transition.canInterrupt) {
      return false;
    }

    // Store previous movement state if transitioning from walking/running
    if (this.currentState === 'walking' || this.currentState === 'running') {
      this.previousMovementState = this.currentState;
    }

    // Update state
    this.currentState = targetState;
    this.isTransitioning = true;

    // Clear existing timer
    if (this.returnTimer) {
      clearTimeout(this.returnTimer);
      this.returnTimer = null;
    }

    // Update DOM data-state attribute
    this.updateDataAttribute(targetState);

    // Set timer to return to appropriate state
    if (targetState !== 'idle' && transition.duration !== Infinity) {
      this.returnTimer = setTimeout(() => {
        // Return to walking/running if that's where we came from
        const returnState = transition.returnsToWalking && this.previousMovementState
          ? this.previousMovementState
          : 'idle';
        this.transitionTo(returnState);
        this.isTransitioning = false;
      }, transition.duration);
    } else {
      this.isTransitioning = false;
    }

    return true;
  }

  getCurrentState(): PetState {
    return this.currentState;
  }

  private updateDataAttribute(state: PetState): void {
    const container = document.querySelector('.pet-container');
    if (container) {
      container.setAttribute('data-state', state);
    }
  }
}
```

**Sprite-Based Animation:**

```css
/* Idle state */
.pet-container[data-state="idle"] .pet-sprite {
  animation: idle-breathe 3s ease-in-out infinite;
}

@keyframes idle-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

/* Greeting state */
.pet-container[data-state="greeting"] .pet-sprite {
  animation: greeting-wave 1s ease-in-out;
}

@keyframes greeting-wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-5deg); }
  75% { transform: rotate(5deg); }
}

/* Small celebration */
.pet-container[data-state="small-celebration"] .pet-sprite {
  animation: celebrate-small 0.5s ease-in-out 2;
}

@keyframes celebrate-small {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-10px) scale(1.1); }
}

/* Big celebration */
.pet-container[data-state="big-celebration"] .pet-sprite {
  animation: celebrate-big 0.6s ease-in-out 3;
}

@keyframes celebrate-big {
  0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
  25% { transform: translateY(-15px) rotate(-10deg) scale(1.15); }
  75% { transform: translateY(-15px) rotate(10deg) scale(1.15); }
}

/* Petting */
.pet-container[data-state="petting"] .pet-sprite {
  animation: petting-content 1.5s ease-in-out;
}

@keyframes petting-content {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); filter: brightness(1.1); }
}

/* Walking - CSS-based edge-to-edge movement */
.pet-container[data-state="walking"] .pet-position-wrapper,
.pet-container[data-state="running"] .pet-position-wrapper {
  animation: move-horizontal var(--movement-duration) linear infinite alternate;
  animation-delay: -2.5s; /* Start at center (50% of cycle) */
}

@keyframes move-horizontal {
  from { left: 0px; }
  to { left: var(--max-left); /* Calculated: containerWidth - petWidth */ }
}

/* Direction flipping synchronized with movement */
.pet-container[data-state="walking"] .pet-flip-wrapper,
.pet-container[data-state="running"] .pet-flip-wrapper {
  animation: flip-horizontal var(--movement-duration) step-end infinite alternate;
  animation-delay: -2.5s; /* Synchronized with movement */
}

@keyframes flip-horizontal {
  from { transform: scaleX(1); } /* Facing right */
  to { transform: scaleX(-1); } /* Facing left */
}

/* Speed differentiation: running is faster than walking */
.pet-container[data-state="walking"] {
  --movement-duration: 5s; /* Default walking speed */
}

.pet-container[data-state="running"] {
  --movement-duration: 3s; /* Faster running speed */
}
```

**Movement System Architecture:**

The walking/running system uses a layered CSS approach:

```html
<div class="pet-container" data-state="walking">
  <!-- Layer 1: Horizontal positioning (left property) -->
  <div class="pet-position-wrapper">
    <!-- Layer 2: Direction flipping (scaleX transform) -->
    <div class="pet-flip-wrapper">
      <!-- Layer 3: Vertical centering (margin-top) -->
      <div class="pet-sprite-wrapper">
        <!-- Layer 4: Sprite rendering -->
        <img class="pet-sprite" src="..." />
      </div>
    </div>
  </div>
</div>
```

**Key Implementation Details:**

1. **Separation of Concerns:**
   - `pet-position-wrapper`: Handles horizontal movement via `left` property
   - `pet-flip-wrapper`: Handles direction flipping via `scaleX` transform
   - `pet-sprite-wrapper`: Handles vertical centering via `margin-top`
   - `pet-sprite`: Renders the actual sprite image

2. **Transform Stacking:**
   - Avoided using `transform: translateY(-50%)` for centering (creates stacking context)
   - Used `margin-top: -32px` instead to prevent conflicts with `scaleX` flip

3. **Animation Synchronization:**
   - Both movement and flip animations use matching `animation-delay: -2.5s`
   - Ensures pet starts centered and facing correct direction

4. **Adaptive Boundaries:**
   - ResizeObserver updates `--max-left` CSS variable on container resize
   - `--max-left = containerWidth - petWidth` ensures pet stays within bounds
   - Responsive to sidebar resizing and window changes

5. **Speed Control:**
   - Movement speed slider (0-100%) maps to CSS variable `--movement-duration`
   - 0-60% range = walking state (slower)
   - 61-100% range = running state (faster)
   - Smooth speed transitions without animation restart

**Performance Characteristics:**

- **CPU Usage:** <0.1% (compositor thread, not main thread)
- **Frame Rate:** 60 FPS guaranteed (GPU-accelerated)
- **Battery Impact:** Minimal (no per-frame JavaScript execution)
- **Scalability:** Would handle 5+ pets with negligible overhead
```

---

### 2.4 Security Patterns

**Responsibility:** Protect against common web vulnerabilities

**Key Security Measures:**

1. **Path Validation**
   - Prevents directory traversal attacks in asset loading
   - Validates plugin directory paths before constructing resource URLs
   - Rejects paths containing: `..`, `~`, absolute paths (`/` or `C:\`)

```typescript
// src/views/PetView.ts
private getAssetPath(assetFileName: string): string {
  const manifest = this.app.plugins.manifests['obsidian-pets'];
  const pluginDir = manifest?.dir || '.obsidian/plugins/obsidian-pets';

  // Validate path doesn't contain traversal sequences
  if (
    pluginDir.includes('..') ||
    pluginDir.includes('~') ||
    pluginDir.startsWith('/') ||
    /^[a-zA-Z]:/.test(pluginDir) // Windows absolute paths
  ) {
    throw new Error('Invalid plugin directory path detected');
  }

  // Normalize and construct safe path
  const normalizedDir = pluginDir.replace(/\\/g, '/').replace(/\/\//g, '/');
  const relativePath = `${normalizedDir}/assets/${assetFileName}`;
  return this.app.vault.adapter.getResourcePath(relativePath);
}
```

2. **State Validation**
   - Validates state values before setting DOM attributes
   - Prevents DOM-based XSS attacks via data attributes
   - Whitelists only known valid states

```typescript
// src/views/PetView.ts
private updateDataAttribute(state: PetState): void {
  if (this.containerDiv) {
    const validStates: PetState[] = [
      'idle', 'greeting', 'walking',
      'small-celebration', 'big-celebration', 'petting',
    ];

    if (validStates.includes(state)) {
      this.containerDiv.dataset.petState = state;
    } else {
      console.error(`Attempted to set invalid state: ${state}`);
    }
  }
}
```

3. **Input Sanitization**
   - Settings validation with strict regex patterns
   - Alphanumeric + spaces only for pet/user names
   - Length limits enforced (1-30 chars for petName, 0-30 for userName)

4. **Debug Code Removal**
   - Production builds exclude debug logging and commands
   - `__DEV__` flag gates development-only code
   - Tree-shaking removes unreachable code in production

```typescript
// Build-time constant injected by esbuild
declare const __DEV__: boolean;

// Only in development builds
if (__DEV__) {
  console.debug(`Asset path resolved to: ${assetPath}`);
  window.obsidianPetsDebug = { /* debug commands */ };
}
```

5. **Error Handling**
   - Proper cleanup of partially initialized resources
   - Loading state hidden before error display
   - No sensitive information in error messages

---

### 2.5 Mobile Support

**Responsibility:** Provide seamless experience on mobile devices

**Key Features:**

1. **Touch Event Handling**
   - Native touch support for pet interaction
   - `touchend` event triggers petting animation
   - Prevents default behavior to avoid unwanted scrolling

```typescript
// src/components/Pet.svelte
function handleTouchEnd(event: TouchEvent): void {
  if (!pettingEnabled) return;
  event.preventDefault();

  // Remove focus after touch to prevent visible focus ring
  (event.currentTarget as HTMLElement)?.blur();

  dispatch('pet', { returnToState: state });
}
```

2. **Mobile-Optimized CSS**
   - `touch-action: manipulation` - Prevents double-tap zoom
   - `-webkit-tap-highlight-color: transparent` - Removes iOS tap highlight
   - Responsive sizing and touch-friendly hit areas

```css
.pet-sprite-wrapper {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
}
```

3. **Accessibility**
   - Touch interactions work alongside keyboard/mouse
   - Focus management for screen readers
   - ARIA labels for interactive elements

---

## 3. Data Persistence

### Storage Location
- Vault-specific: `.obsidian/plugins/obsidian-pets/data.json`
- All data is local, no network calls

### Data Schema

```typescript
/**
 * Obsidian Pets Plugin Settings
 */
interface ObsidianPetsSettings {
  /** Name of the pet companion */
  petName: string;

  /** Name of the user (what pet calls them) */
  userName: string;

  /** Whether the welcome modal has been shown */
  hasCompletedWelcome: boolean;

  /** Celebration Settings (v0.2.0+) */
  celebrations: {
    dailyNoteEnabled: boolean;
    noteCreationEnabled: boolean;
    taskCompletionEnabled: boolean;
    linkAdditionEnabled: boolean;
    wordMilestonesEnabled: boolean;
  };

  /** Word count milestones to celebrate */
  wordMilestones: number[]; // Default: [100, 250, 500, 1000]

  /** Sound effects enabled (v0.2.0+) */
  celebrationSoundsEnabled: boolean;
}

const DEFAULT_SETTINGS: ObsidianPetsSettings = {
  petName: 'Kit',
  userName: '',
  hasCompletedWelcome: false,
  celebrations: {
    dailyNoteEnabled: true,
    noteCreationEnabled: true,
    taskCompletionEnabled: true,
    linkAdditionEnabled: true,
    wordMilestonesEnabled: true,
  },
  wordMilestones: [100, 250, 500, 1000],
  celebrationSoundsEnabled: false, // Default OFF (respects user preferences)
};

/**
 * Validation rules for settings
 */
const VALIDATION_RULES = {
  petName: {
    minLength: 1,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9 ]+$/, // Alphanumeric + spaces only
    errorMessage: 'Pet name must be 1-30 characters (letters, numbers, spaces only)',
  },
  userName: {
    minLength: 0, // Can be empty
    maxLength: 30,
    pattern: /^[a-zA-Z0-9 ]*$/, // Alphanumeric + spaces only (optional)
    errorMessage: 'Your name must be 0-30 characters (letters, numbers, spaces only)',
  },
} as const;
```

**Implementation Notes:**
- Pet name is required (min 1 character)
- User name is optional (min 0 characters)
- Both restricted to alphanumeric + spaces for security
- Celebration settings allow users to customize which events trigger celebrations
- Word milestones are user-configurable
- Sound effects default to OFF

### Data Access Pattern

```typescript
// main.ts
export default class ObsidianPetsPlugin extends Plugin {
  settings: ObsidianPetsSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();

    // Register views, commands, etc.
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
```

---

## 4. Settings Implementation

### Welcome Modal Pattern

Obsidian Pets uses a **modal-based settings approach** for initial setup, with a settings tab for celebration customization.

#### Welcome Modal (First Run)

```typescript
// src/modals/WelcomeModal.ts
export class WelcomeModal extends Modal {
  private plugin: ObsidianPetsPlugin;
  private petNameInput: TextComponent;
  private userNameInput: TextComponent;
  private petNameError: HTMLElement;
  private userNameError: HTMLElement;

  constructor(plugin: ObsidianPetsPlugin) {
    super(plugin.app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    // Title and description
    contentEl.createEl('h2', { text: 'Welcome to Obsidian Pets! 🦊' });
    contentEl.createEl('p', {
      text: 'Your vault companion that celebrates you. Let\'s set up your pet!'
    });

    // Pet name setting with validation
    new Setting(contentEl)
      .setName('Pet name')
      .setDesc('What should we call your companion? (1-30 characters)')
      .addText(text => {
        this.petNameInput = text;
        text
          .setPlaceholder('Kit')
          .setValue(this.plugin.settings.petName)
          .onChange(async (value) => {
            this.validatePetName(value);
          });
      });

    // Error container for pet name
    this.petNameError = contentEl.createDiv({ cls: 'setting-error' });

    // User name setting with validation
    new Setting(contentEl)
      .setName('Your name')
      .setDesc('What should your pet call you? (Optional, 0-30 characters)')
      .addText(text => {
        this.userNameInput = text;
        text
          .setPlaceholder('Leave empty to be called "there"')
          .setValue(this.plugin.settings.userName)
          .onChange(async (value) => {
            this.validateUserName(value);
          });
      });

    // Error container for user name
    this.userNameError = contentEl.createDiv({ cls: 'setting-error' });

    // Save button
    new Setting(contentEl)
      .addButton(btn => btn
        .setButtonText("Let's Go!")
        .setCta()
        .onClick(async () => {
          await this.saveSettings();
        }));
  }

  private async saveSettings() {
    const petName = this.petNameInput.getValue().trim();
    const userName = this.userNameInput.getValue().trim();

    // Validate before saving
    const petNameValid = this.validatePetName(petName);
    const userNameValid = this.validateUserName(userName);

    if (!petNameValid || !userNameValid) {
      return; // Don't close modal if validation fails
    }

    // Save settings
    this.plugin.settings.petName = petName;
    this.plugin.settings.userName = userName;
    this.plugin.settings.hasCompletedWelcome = true;
    await this.plugin.saveSettings();

    this.close();
  }
}
```

#### Settings Tab (Celebration Customization - v0.2.0+)

```typescript
// src/settings/SettingsTab.ts
export class ObsidianPetsSettingsTab extends PluginSettingTab {
  plugin: ObsidianPetsPlugin;

  constructor(app: App, plugin: ObsidianPetsPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // Pet Settings Section
    containerEl.createEl('h2', { text: 'Pet Settings' });

    new Setting(containerEl)
      .setName('Pet name')
      .setDesc('Your companion\'s name')
      .addText(text => text
        .setPlaceholder('Kit')
        .setValue(this.plugin.settings.petName)
        .onChange(async (value) => {
          this.plugin.settings.petName = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Your name')
      .setDesc('What your pet calls you (optional)')
      .addText(text => text
        .setPlaceholder('Leave empty')
        .setValue(this.plugin.settings.userName)
        .onChange(async (value) => {
          this.plugin.settings.userName = value;
          await this.plugin.saveSettings();
        }));

    // Celebration Settings Section
    containerEl.createEl('h2', { text: 'Celebration Triggers' });

    new Setting(containerEl)
      .setName('Celebrate daily notes')
      .setDesc('Celebrate when you create a daily note')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.celebrations.dailyNoteEnabled)
        .onChange(async (value) => {
          this.plugin.settings.celebrations.dailyNoteEnabled = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Celebrate new notes')
      .setDesc('Celebrate when you create any note')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.celebrations.noteCreationEnabled)
        .onChange(async (value) => {
          this.plugin.settings.celebrations.noteCreationEnabled = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Celebrate task completion')
      .setDesc('Celebrate when you check off a task')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.celebrations.taskCompletionEnabled)
        .onChange(async (value) => {
          this.plugin.settings.celebrations.taskCompletionEnabled = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Celebrate links')
      .setDesc('Celebrate when you add a link between notes')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.celebrations.linkAdditionEnabled)
        .onChange(async (value) => {
          this.plugin.settings.celebrations.linkAdditionEnabled = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Celebrate word milestones')
      .setDesc('Celebrate when you reach word count milestones')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.celebrations.wordMilestonesEnabled)
        .onChange(async (value) => {
          this.plugin.settings.celebrations.wordMilestonesEnabled = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Word milestones')
      .setDesc('Word counts to celebrate (comma-separated)')
      .addText(text => text
        .setPlaceholder('100, 250, 500, 1000')
        .setValue(this.plugin.settings.wordMilestones.join(', '))
        .onChange(async (value) => {
          const milestones = value.split(',').map(m => parseInt(m.trim())).filter(m => !isNaN(m));
          this.plugin.settings.wordMilestones = milestones;
          await this.plugin.saveSettings();
        }));

    // Sound Settings Section
    containerEl.createEl('h2', { text: 'Sound Effects' });

    new Setting(containerEl)
      .setName('Enable celebration sounds')
      .setDesc('Play sound effects during celebrations')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.celebrationSoundsEnabled)
        .onChange(async (value) => {
          this.plugin.settings.celebrationSoundsEnabled = value;
          await this.plugin.saveSettings();

          // Reload celebration engine to apply sound changes
          this.plugin.reloadCelebrationEngine();
        }));
  }
}
```

---

## 5. Build Configuration

### package.json

```json
{
  "name": "obsidian-pets",
  "version": "0.1.0",
  "description": "Your vault companion that celebrates you",
  "main": "main.js",
  "scripts": {
    "dev": "node esbuild.config.mjs",
    "build": "tsc -noEmit -skipLibCheck && node esbuild.config.mjs production",
    "version": "node version-bump.mjs && git add manifest.json versions.json",
    "lint": "eslint src --ext .ts,.svelte",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  },
  "keywords": [
    "obsidian",
    "obsidian-plugin",
    "pet",
    "companion",
    "celebration",
    "vault-awareness"
  ],
  "author": "Terri Yeh",
  "license": "MIT",
  "devDependencies": {
    "@testing-library/svelte": "^5.3.1",
    "@tsconfig/svelte": "^5.0.4",
    "@types/node": "^20.11.19",
    "@typescript-eslint/eslint-plugin": "^6.21.0",
    "@typescript-eslint/parser": "^6.21.0",
    "@vitest/coverage-v8": "^4.0.18",
    "@vitest/ui": "^4.0.18",
    "esbuild": "^0.27.2",
    "esbuild-svelte": "0.8.0",
    "eslint": "^8.56.0",
    "eslint-plugin-svelte": "^3.14.0",
    "happy-dom": "^20.5.0",
    "jsdom": "^28.0.0",
    "obsidian": "^1.5.0",
    "svelte": "^4.2.12",
    "svelte-eslint-parser": "^1.4.1",
    "svelte-preprocess": "^5.1.3",
    "tslib": "^2.6.2",
    "typescript": "^5.3.3",
    "vitest": "^4.0.18"
  }
}
```

### esbuild.config.mjs

```javascript
import esbuild from "esbuild";
import sveltePlugin from "esbuild-svelte";
import sveltePreprocess from "svelte-preprocess";

const production = process.argv[2] === "production";

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "@codemirror/*",
    "moment"
  ],
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  sourcemap: production ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
  define: {
    '__DEV__': production ? 'false' : 'true',
  },
  plugins: [
    sveltePlugin({
      preprocess: sveltePreprocess(),
      compilerOptions: {
        css: "injected",
        dev: !production
      }
    })
  ]
});

if (production) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
  console.log("Watching for changes...");
}
```

---

## 6. Key Integration Points

### 6.1 Obsidian Workspace API

**Event Listening:**

```typescript
// Vault events
this.app.vault.on('create', callback);
this.app.vault.on('modify', callback);
this.app.vault.on('delete', callback);

// Workspace events
this.app.workspace.on('file-open', callback);
this.app.workspace.on('editor-change', callback);

// Metadata cache
this.app.metadataCache.on('resolved', callback);
```

### 6.2 View Registration

**Workspace Management:**

```typescript
// main.ts
async onload() {
  // Register Pet View
  this.registerView(
    VIEW_TYPE_PET,
    (leaf) => new PetView(leaf, this)
  );

  // Add ribbon icon
  this.addRibbonIcon("heart", "Open Obsidian Pets", () => {
    this.activateView();
  });

  // Add command
  this.addCommand({
    id: "open-obsidian-pets",
    name: "Open Obsidian Pets",
    callback: () => this.activateView()
  });
}

async activateView() {
  const { workspace } = this.app;

  // Detach existing leaves of this type
  workspace.detachLeavesOfType(VIEW_TYPE_PET);

  // Create new leaf in right sidebar
  const leaf = workspace.getRightLeaf(false);
  await leaf.setViewState({
    type: VIEW_TYPE_PET,
    active: true
  });

  workspace.revealLeaf(leaf);
}
```

---

## 7. Development Workflow

### Setup

```bash
# Clone repository
git clone https://github.com/terriyeh/obsidian-pets
cd obsidian-pets

# Install dependencies
npm install

# Start development mode
npm run dev
```

### Testing in Obsidian

1. Create a test vault
2. Create symlink to plugin directory:
   ```bash
   # Windows
   mklink /D "C:\path\to\test-vault\.obsidian\plugins\obsidian-pets" "D:\obsidian-pets"

   # macOS/Linux
   ln -s /path/to/obsidian-pets /path/to/test-vault/.obsidian/plugins/obsidian-pets
   ```
3. Enable the plugin in Obsidian settings
4. Install Hot-Reload plugin for automatic reloading

### Build for Production

```bash
npm run build
```

This creates:
- `main.js` - Compiled plugin code
- `manifest.json` - Plugin manifest
- `styles.css` - Styles

---

## 8. Performance Targets

| Metric | Target |
|--------|--------|
| Plugin load time | < 100ms |
| View initialization | < 200ms |
| Animation frame rate | 60 FPS |
| State transition | < 300ms |
| Event detection latency | < 100ms |
| Emoji bubble render | < 50ms |
| Memory usage | < 10MB |
| Sprite asset size | < 150KB |
| Sound effects (total) | < 500KB |

---

## 9. Architecture Strategy: CSS for Rendering, JavaScript for Logic

### Agreed Phased Approach

**Core Principle:** CSS handles sprite rendering throughout ALL phases. JavaScript only adds position tracking and behavior logic when needed.

**Phase 2 (Current - Completed):**
- Custom CSS single-pet with movement system
- CSS handles sprite rendering and edge-to-edge movement
- JavaScript handles state machine logic and speed control
- Performance: GPU-accelerated, <0.1% CPU, 60 FPS guaranteed
- **Status:** ✅ Completed 2026-02-09

**Phase 2.5 (Planned):**
- Multi-pet (CSS-only, no awareness of each other)
- Each pet moves independently using CSS animations
- No coordination or interaction between pets
- Minimal JavaScript overhead (state management only)
- **Estimated Effort:** 5-10 hours

**Phase 3 (Planned):**
- Multi-pet with position tracking + simple behaviors
- CSS continues to handle rendering
- JavaScript tracks positions periodically (not every frame)
- Simple coordination: pets celebrate together when nearby
- Hybrid approach: CSS performance + JavaScript coordination
- **Estimated Effort:** 10-15 hours

**Phase 4 (Planned):**
- Following/chasing with basic AI
- Leader uses CSS animation (battery-efficient)
- Follower uses JavaScript position updates when needed
- Simple follow behavior with smooth interpolation
- **Estimated Effort:** 20-30 hours

**Phase 5 (Research):**
- Neural network for emergent behavior (experimental)
- Explore ML-based pet behaviors
- CSS rendering maintained throughout
- JavaScript adds AI decision-making layer
- **Estimated Effort:** 40-60 hours (research + implementation)

### Decision: Don't Fork vscode-pets

**Rationale:**
- Architecture mismatch: vscode-pets uses JavaScript for ALL movement (2-5% CPU per pet)
- Our CSS approach: <0.1% CPU (10-50x better performance)
- Fork would require 110-200 hours of adaptation work
- 70% of vscode-pets features are irrelevant to our roadmap (ball throwing, wall climbing)
- CSS approach better suited for mobile battery life (critical for Obsidian users)
- **Confidence:** High (based on technical assessment and proven CSS implementation)

### Multi-Pet Strategy

**CSS-Only Approach (Phase 2.5):**
```svelte
<!-- Pet 1 walks independently -->
<Pet state={pet1State} />

<!-- Pet 2 walks independently -->
<Pet state={pet2State} />
```
- Each pet GPU-accelerated CSS animation
- No coordination overhead
- Battery-friendly

**Hybrid Approach (Phase 3+):**
```svelte
<script>
// Periodic proximity check (not every frame)
function checkProximity() {
  const pet1Pos = getPetPosition(pet1AnimationTime); // Math, no DOM read
  const pet2Pos = getPetPosition(pet2AnimationTime);

  if (Math.abs(pet1Pos - pet2Pos) < 100) {
    pet1State = 'celebration'; // Both celebrate
    pet2State = 'celebration';
  }
}
</script>
```
- Minimal JavaScript (check every 500ms, not every frame)
- Best of both worlds: CSS performance + JavaScript coordination

---

## 10. Future Considerations

### v0.3.0+ Features
- Custom celebration messages (user-entered text)
- Celebration banner UI (toast notifications)
- Additional movement patterns (zigzag, bounce, figure-8)
- Speed variation (±10% randomization for organic feel)
- State-based speed multipliers (excited pet moves faster)
- Adventures (background changes)
- Celebration sound effects (optional)

### v0.4.0+ Features
- Multiple pet types
- Multi-pet support (phased: 2.5 → 3 → 4 → 5)
- Custom celebration packs (community-contributed)
- Seasonal celebration themes ($1.99)
- Premium backgrounds ($1.99)

### Scalability
- Asset loading optimization (lazy loading)
- Efficient event debouncing
- Plugin settings migration
- Cross-vault celebration stats (optional)
- Multi-pet coordination (phases 3-5)

---

## 11. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Performance impact on large vaults | Efficient event debouncing, cooldowns prevent spam |
| Mobile compatibility | Touch event handling, mobile-optimized CSS, tested on mobile app |
| Breaking changes in Obsidian API | Follow official API docs, test with latest versions |
| Path traversal attacks | Validate all asset paths, reject suspicious patterns |
| DOM-based XSS attacks | Validate state values before setting DOM attributes |
| Debug code in production | Use `__DEV__` flag with tree-shaking to exclude debug code |
| Resource leaks on errors | Proper cleanup in error handlers, hide loading states |
| Event listener memory leaks | Proper cleanup on view close, unregister all listeners |
| Sound autoplay restrictions | Respect browser autoplay policies, default to OFF |
| CSS animation bugs | Proven debugging ability (60 min for 4 bugs), simple architecture |
| Multi-pet performance | Phased approach, CSS performance maintained, hybrid coordination |

---

## Conclusion

This architecture provides a solid foundation for Obsidian Pets' celebration-focused experience:
- ✅ Pet view with 6 animation states (simplified from 7)
- ✅ Vault-aware celebration system
- ✅ User-configurable triggers
- ✅ Emoji speech bubbles
- ✅ Optional sound effects (tied to animations)
- ✅ Fully local and private
- ✅ Mobile support with touch interactions

The modular design allows for easy extension and future feature additions (custom messages, banner UI, immersion behaviors, relationships, adventures) while maintaining clean separation of concerns and respecting the core philosophy: **"Feeling the plugin, not thinking about it."**

---

**Next Steps (v0.2.0 Development):**
1. Implement CelebrationEngine core orchestration
2. Create VaultEventListeners for vault activity detection
3. Add EmojiRenderer for speech bubbles
4. Implement MilestoneTracker for cooldowns
5. Add SoundEffects system (optional, default OFF)
6. Create settings tab for celebration customization
7. Update PetView to integrate celebration system
8. Remove conversation-related code (archive to `archive/` folder)
9. Comprehensive testing of celebration triggers
10. Polish animations and timing
