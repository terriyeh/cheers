# Vault Pal - Technical Architecture

**Version:** 1.1
**Date:** 2026-02-05
**Status:** Active Development (Phase 1)

---

## Executive Summary

Vault Pal is an Obsidian plugin that gamifies daily note-taking through an interactive virtual pet companion. This document outlines the technical architecture, technology stack, implementation approach, and development roadmap.

### Core Technology Stack

- **Language:** TypeScript
- **Framework:** Obsidian Plugin API + Svelte 4
- **Build Tool:** esbuild with esbuild-svelte plugin
- **Animation:** SVG with CSS animations + lightweight TypeScript state machine
- **Data Storage:** Obsidian Plugin API (vault-specific JSON)
- **Daily Notes:** obsidian-daily-notes-interface library

---

## 1. Architecture Overview

### Plugin Structure

```
vault-pal/
├── src/
│   ├── main.ts                    # ✅ Main plugin class
│   ├── modals/
│   │   └── WelcomeModal.ts       # ✅ First-run settings modal
│   ├── views/
│   │   ├── PetView.ts            # ✅ Main pet panel (ItemView)
│   │   └── CalendarView.ts       # 🔮 Calendar navigation panel (planned)
│   ├── components/               # Svelte components
│   │   ├── Pet.svelte            # ✅ Pet display with animations
│   │   ├── Chat.svelte           # 🔮 Chat interface for questions (planned)
│   │   ├── ProgressBar.svelte    # 🔮 XP and streak display (planned)
│   │   └── Calendar.svelte       # 🔮 Calendar component (planned)
│   ├── pet/
│   │   └── PetStateMachine.ts    # ✅ Animation state management
│   ├── core/                      # 🔮 Planned features
│   │   ├── TemplateParser.ts     # Parse vaultpal code blocks
│   │   ├── NoteCreator.ts        # Daily note creation logic
│   │   ├── ConversationManager.ts # Q&A flow management
│   │   └── ProgressionSystem.ts  # XP, streaks, milestones
│   └── types/
│       ├── settings.ts           # ✅ Settings interface and validation
│       └── index.ts              # ✅ TypeScript interfaces
├── assets/
│   └── sprites/
│       └── kit-sprite-sheet.png  # ✅ Pixel art sprite sheet
├── styles.css                    # ✅ Global styles and animations
├── tests/                        # ✅ Comprehensive test suite
│   ├── unit/                     # Unit tests
│   │   ├── PetStateMachine.test.ts
│   │   ├── SettingsValidation.test.ts
│   │   └── SettingsPersistence.test.ts
│   └── integration/              # Integration tests
│       └── PetView.integration.test.ts
├── manifest.json
├── versions.json
├── esbuild.config.mjs
├── vitest.config.ts              # ✅ Test configuration
├── tsconfig.json
└── package.json

Legend:
✅ = Currently implemented
🔮 = Planned for future phases
```

---

## 2. Core Systems

### 2.1 Pet View System (ItemView)

**Responsibility:** Main interactive panel with pet, chat, and controls

**Key Components:**
- Pet animation display (SVG with state machine)
- Chat interface for questions/responses
- Progress indicators (XP, streak)
- "Share my day" button to initiate conversation

**Implementation:**

```typescript
// src/views/PetView.ts
export class PetView extends ItemView {
  private petComponent: Pet;
  private chatComponent: Chat;
  private stateMachine: PetStateMachine;

  getViewType(): string {
    return VIEW_TYPE_PET;
  }

  async onOpen(): Promise<void> {
    // Mount Svelte components
    // Initialize state machine
    // Set up event handlers
  }
}
```

**Svelte Component Structure:**

```svelte
<!-- src/components/Pet.svelte -->
<script lang="ts">
  export let state: PetState;
  export let xp: number;
  export let streak: number;
</script>

<div class="pet-view">
  <div class="pet-container" data-state={state}>
    <!-- SVG layers -->
  </div>
  <ProgressBar {xp} {streak} />
  <Chat />
</div>
```

### 2.2 Calendar View System

**Responsibility:** Visual calendar for navigating daily notes

**Features:**
- Monthly calendar display
- Visual indicators for completed notes
- Streak visualization
- Click to open/create daily note
- Quick navigation (week/month views)

**Integration:**
- Can toggle between Pet View and Calendar View
- Both views accessible from sidebar

### 2.3 Template Parser

**Responsibility:** Extract questions from user's daily note template

**Code Block Syntax:**

```markdown
## Today

What went well? (1-3 bullets)

```vaultpal
prompt: "What went well today?"
```

What was difficult?

```vaultpal
prompt: "What was difficult today?"
```
```

**Implementation:**

```typescript
// src/core/TemplateParser.ts
interface VaultPalQuestion {
  prompt: string;
  position: number; // Line number in template
}

export class TemplateParser {
  async parseTemplate(templatePath: string): Promise<VaultPalQuestion[]> {
    const file = this.app.vault.getAbstractFileByPath(templatePath);
    const content = await this.app.vault.read(file);

    // Regex to find ```vaultpal code blocks
    const regex = /```vaultpal\s+prompt:\s*"([^"]+)"/g;
    const questions: VaultPalQuestion[] = [];

    let match;
    while ((match = regex.exec(content)) !== null) {
      questions.push({
        prompt: match[1],
        position: content.substring(0, match.index).split('\n').length
      });
    }

    return questions;
  }
}
```

**Alternative Syntax Consideration:**

Based on research, we could also use YAML-style syntax inside code blocks:

```markdown
```vaultpal
prompt: "What went well today?"
optional: false
placeholder: "Think about 1-3 things..."
```
```

### 2.4 Note Creation System

**Responsibility:** Create and populate daily notes

**Key Requirements:**
- Integrate with Obsidian's Daily Notes plugin settings
- Use `obsidian-daily-notes-interface` library
- Check if note already exists
- Preserve non-VaultPal content in existing notes
- Insert responses immediately after corresponding questions

**Implementation:**

```typescript
// src/core/NoteCreator.ts
import { createDailyNote, getDailyNote, getAllDailyNotes } from 'obsidian-daily-notes-interface';

export class NoteCreator {
  async createOrOpenDailyNote(date: moment.Moment): Promise<TFile> {
    const allNotes = getAllDailyNotes();
    let note = getDailyNote(date, allNotes);

    if (!note) {
      note = await createDailyNote(date);
    }

    return note;
  }

  async insertResponse(
    note: TFile,
    questionPosition: number,
    response: string
  ): Promise<void> {
    await this.app.vault.process(note, (content) => {
      const lines = content.split('\n');
      // Find the vaultpal code block at questionPosition
      // Insert response immediately after the block
      lines.splice(questionPosition + 1, 0, response);
      return lines.join('\n');
    });
  }
}
```

**Note Conflict Handling:**

```typescript
async checkExistingAnswers(note: TFile): Promise<boolean> {
  const content = await this.app.vault.read(note);

  // Check if VaultPal responses already exist
  // Look for responses immediately after vaultpal blocks
  const hasAnswers = /```vaultpal[\s\S]*?```\s*\n[^\s]/.test(content);

  if (hasAnswers) {
    return await this.confirmOverwrite();
  }

  return true;
}
```

### 2.5 Conversation Manager

**Responsibility:** Orchestrate the Q&A flow

**Flow:**
1. User clicks "Share my day"
2. Parse template to get questions
3. Create/open daily note
4. Present first question in chat
5. User responds
6. Save response to note
7. Repeat until all questions answered
8. Show completion message
9. Award XP

**Implementation:**

```typescript
// src/core/ConversationManager.ts
export class ConversationManager {
  private questions: VaultPalQuestion[];
  private currentIndex: number = 0;
  private dailyNote: TFile;

  async startConversation(): Promise<void> {
    // 1. Parse template
    this.questions = await this.templateParser.parseTemplate(
      this.plugin.settings.templatePath
    );

    // 2. Create/open daily note
    this.dailyNote = await this.noteCreator.createOrOpenDailyNote(moment());

    // 3. Check for existing answers
    const canProceed = await this.noteCreator.checkExistingAnswers(this.dailyNote);
    if (!canProceed) return;

    // 4. Start with first question
    this.askNextQuestion();
  }

  private askNextQuestion(): void {
    if (this.currentIndex >= this.questions.length) {
      this.completeConversation();
      return;
    }

    const question = this.questions[this.currentIndex];
    this.petView.displayQuestion(question.prompt);
    this.petStateMachine.transitionTo('talking');
  }

  async submitResponse(response: string): Promise<void> {
    const question = this.questions[this.currentIndex];

    // Save to daily note
    await this.noteCreator.insertResponse(
      this.dailyNote,
      question.position,
      response
    );

    // Move to next question
    this.currentIndex++;

    if (this.currentIndex < this.questions.length) {
      // Encourage user
      this.petView.displayMessage("Great! Let's continue...");
      setTimeout(() => this.askNextQuestion(), 1000);
    } else {
      this.completeConversation();
    }
  }

  private async completeConversation(): Promise<void> {
    this.petView.displayMessage("Thank you for sharing your day with me!");
    this.petStateMachine.transitionTo('big-celebration');

    // Award XP
    await this.progressionSystem.completeNote();
  }
}
```

### 2.6 Progression System

**Responsibility:** Track XP, streaks, and milestones

**Data Structure:**

```typescript
interface ProgressionData {
  xp: number;
  totalNotes: number;
  currentStreak: number;
  longestStreak: number;
  lastCompleted: string; // ISO date
  milestones: {
    '7day': boolean;
    '30day': boolean;
    '60day': boolean;
    '100day': boolean;
  };
  unlockedAccessories: string[];
}
```

**Implementation:**

```typescript
// src/core/ProgressionSystem.ts
export class ProgressionSystem {
  async completeNote(): Promise<void> {
    const today = moment().format('YYYY-MM-DD');
    const lastCompleted = this.plugin.settings.progression.lastCompleted;
    const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');

    // Award XP
    this.plugin.settings.progression.xp += 10;
    this.plugin.settings.progression.totalNotes++;

    // Update streak
    if (lastCompleted === yesterday) {
      // Continuing streak
      this.plugin.settings.progression.currentStreak++;
    } else if (lastCompleted !== today) {
      // Starting new streak
      this.plugin.settings.progression.currentStreak = 1;
    }

    // Update longest streak
    if (this.plugin.settings.progression.currentStreak >
        this.plugin.settings.progression.longestStreak) {
      this.plugin.settings.progression.longestStreak =
        this.plugin.settings.progression.currentStreak;
    }

    // Check milestones
    await this.checkMilestones();

    // Save
    this.plugin.settings.progression.lastCompleted = today;
    await this.plugin.saveSettings();
  }

  private async checkMilestones(): Promise<void> {
    const streak = this.plugin.settings.progression.currentStreak;

    if (streak === 7 && !this.plugin.settings.progression.milestones['7day']) {
      this.unlockMilestone('7day');
    }
    // ... check other milestones
  }
}
```

### 2.7 Animation System

**Responsibility:** Manage pet animation states and transitions

**7 Animation States:**
1. **Idle** - Default state, gentle breathing animation
2. **Greeting** - When user opens the panel
3. **Talking** - When presenting a question
4. **Listening** - When user is typing
5. **Small Celebration** - After each answer
6. **Big Celebration** - After completing all questions
7. **Petting** - User clicks on pet for affection

**State Machine:**

```typescript
// src/animations/PetStateMachine.ts
type PetState = 'idle' | 'greeting' | 'talking' | 'listening' |
                'small-celebration' | 'big-celebration' | 'petting';

interface StateTransition {
  from: PetState;
  to: PetState;
  duration: number;
  canInterrupt: boolean;
}

const transitions: StateTransition[] = [
  { from: 'idle', to: 'greeting', duration: 1000, canInterrupt: true },
  { from: 'greeting', to: 'idle', duration: 500, canInterrupt: true },
  { from: 'idle', to: 'talking', duration: 300, canInterrupt: true },
  { from: 'talking', to: 'listening', duration: 300, canInterrupt: true },
  { from: 'listening', to: 'small-celebration', duration: 500, canInterrupt: false },
  // ... more transitions
];

export class PetStateMachine {
  private currentState: PetState = 'idle';
  private isTransitioning: boolean = false;

  async transitionTo(targetState: PetState): Promise<boolean> {
    // Validate transition exists
    // Check if can interrupt
    // Update DOM data-state attribute
    // Wait for animation duration
    // Return success/failure
  }
}
```

**SVG Layer System:**

```html
<div class="pet-container" data-state="idle">
  <!-- Background Layer -->
  <svg class="layer layer-background">
    <use href="#background-default" />
  </svg>

  <!-- Pet Layer -->
  <svg class="layer layer-pet">
    <use href="#pet-idle" />
  </svg>

  <!-- Accessory Layer -->
  <svg class="layer layer-accessory">
    <use href="#accessory-none" />
  </svg>
</div>
```

**CSS Animations:**

```css
/* Idle state */
.pet-container[data-state="idle"] .layer-pet {
  animation: idle-breathe 3s ease-in-out infinite;
}

@keyframes idle-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

/* Talking state */
.pet-container[data-state="talking"] .layer-pet {
  animation: talking-bounce 0.5s ease-in-out infinite;
}

@keyframes talking-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

/* ... more states */
```

---

## 3. Data Persistence

### Storage Location
- Vault-specific: `.obsidian/plugins/vault-pal/data.json`
- All data is local, no network calls

### Data Schema

```typescript
/**
 * VaultPal Plugin Settings
 */
interface VaultPalSettings {
  /** Name of the pet companion */
  petName: string;
  /** Name of the user (what pet calls them) */
  userName: string;
  /** Whether the welcome modal has been shown */
  hasCompletedWelcome: boolean;
}

const DEFAULT_SETTINGS: VaultPalSettings = {
  petName: 'Kit',
  userName: '',
  hasCompletedWelcome: false,
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
- Daily Notes folder and template are auto-detected, not stored

### Data Access Pattern

```typescript
// main.ts
export default class VaultPalPlugin extends Plugin {
  settings: VaultPalSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();
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

Vault Pal uses a **modal-based settings approach** instead of a traditional settings tab. This provides a better first-run experience and keeps the settings simple and focused.

#### Implementation

```typescript
// src/modals/WelcomeModal.ts
export class WelcomeModal extends Modal {
  private plugin: VaultPalPlugin;
  private petNameInput: TextComponent;
  private userNameInput: TextComponent;
  private petNameError: HTMLElement;
  private userNameError: HTMLElement;

  constructor(plugin: VaultPalPlugin) {
    super(plugin.app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    // Title and description
    contentEl.createEl('h2', { text: 'Welcome to Vault Pal! 🦊' });
    contentEl.createEl('p', {
      text: 'Let\'s set up your pet companion. You can change these settings anytime.'
    });

    // Info box about Daily Notes requirement
    const infoBox = contentEl.createDiv({ cls: 'vault-pal-info-box' });
    infoBox.createEl('p', {
      text: 'ℹ️  Requires enabling the Daily Notes core plugin for full functionality'
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
        .setButtonText('Save and Start')
        .setCta()
        .onClick(async () => {
          await this.saveSettings();
        }));
  }

  // Real-time validation with error display
  private validatePetName(value: string): boolean {
    const trimmed = value.trim();
    const rules = VALIDATION_RULES.petName;

    if (trimmed.length < rules.minLength || trimmed.length > rules.maxLength) {
      this.petNameError.setText(rules.errorMessage);
      this.petNameError.style.display = 'block';
      return false;
    }

    if (!rules.pattern.test(trimmed)) {
      this.petNameError.setText(rules.errorMessage);
      this.petNameError.style.display = 'block';
      return false;
    }

    this.petNameError.style.display = 'none';
    return true;
  }

  private validateUserName(value: string): boolean {
    const trimmed = value.trim();
    const rules = VALIDATION_RULES.userName;

    if (trimmed.length > rules.maxLength) {
      this.userNameError.setText(rules.errorMessage);
      this.userNameError.style.display = 'block';
      return false;
    }

    if (!rules.pattern.test(trimmed)) {
      this.userNameError.setText(rules.errorMessage);
      this.userNameError.style.display = 'block';
      return false;
    }

    this.userNameError.style.display = 'none';
    return true;
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

    // Refresh pet view to apply new names
    const petView = this.app.workspace.getLeavesOfType(PET_VIEW_TYPE)[0];
    if (petView?.view instanceof PetView) {
      petView.view.updatePetNames(petName, userName);
    }

    this.close();
  }
}
```

#### Trigger Logic

The welcome modal appears automatically on **first view open** (not on plugin enable):

```typescript
// src/views/PetView.ts
async onOpen() {
  const container = this.containerEl.children[1];
  container.empty();

  // Show welcome modal on first run
  const plugin = this.app.plugins.plugins['vault-pal'] as VaultPalPlugin;
  if (plugin && !plugin.settings.hasCompletedWelcome) {
    new WelcomeModal(plugin).open();
  }

  // ... continue with view initialization
}
```

This approach is less intrusive than showing the modal immediately when the plugin loads, as it waits until the user actively opens the pet view.

#### Command Palette Integration

Users can reopen the settings modal at any time:

```typescript
// src/main.ts
this.addCommand({
  id: 'edit-pet-settings',
  name: 'Edit Pet Settings',
  callback: () => {
    new WelcomeModal(this).open();
  }
});
```

#### Settings Persistence

Settings are saved to `.obsidian/plugins/vault-pal/data.json`:

```json
{
  "petName": "Kit",
  "userName": "Alice",
  "hasCompletedWelcome": true
}
```

The `hasCompletedWelcome` flag ensures the modal only appears once automatically.

---

## 5. Build Configuration

### package.json

```json
{
  "name": "vault-pal",
  "version": "1.0.0",
  "description": "Interactive pet companion for Obsidian daily notes",
  "main": "main.js",
  "scripts": {
    "dev": "node esbuild.config.mjs",
    "build": "tsc -noEmit && node esbuild.config.mjs production",
    "lint": "eslint src --ext .ts,.svelte"
  },
  "keywords": [
    "obsidian",
    "obsidian-plugin",
    "daily-notes",
    "gamification"
  ],
  "author": "Your Name",
  "license": "MIT",
  "devDependencies": {
    "@tsconfig/svelte": "^5.0.0",
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "esbuild": "^0.20.0",
    "esbuild-svelte": "^0.8.0",
    "eslint": "^8.0.0",
    "obsidian": "latest",
    "obsidian-daily-notes-interface": "latest",
    "svelte": "^4.0.0",
    "svelte-preprocess": "^5.0.0",
    "tslib": "^2.6.0",
    "typescript": "^5.0.0"
  }
}
```

### esbuild.config.mjs

```javascript
import esbuild from "esbuild";
import sveltePlugin from "esbuild-svelte";
import sveltePreprocess from "svelte-preprocess";
import fs from "fs";

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

### tsconfig.json

```json
{
  "extends": "@tsconfig/svelte/tsconfig.json",
  "compilerOptions": {
    "target": "ES6",
    "module": "ESNext",
    "lib": ["ES2022", "DOM"],
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": ".",
    "inlineSourceMap": true,
    "inlineSources": true,
    "types": ["node", "svelte"]
  },
  "include": ["src/**/*.ts", "src/**/*.svelte"]
}
```

---

## 6. Key Integration Points

### 6.1 Daily Notes Plugin Integration

**Using obsidian-daily-notes-interface:**

```typescript
import {
  createDailyNote,
  getDailyNote,
  getAllDailyNotes,
  appHasDailyNotesPluginLoaded,
  getDailyNoteSettings
} from 'obsidian-daily-notes-interface';

// Check if Daily Notes is available
if (!appHasDailyNotesPluginLoaded()) {
  new Notice('Please enable Daily Notes plugin');
  return;
}

// Get user's Daily Notes settings
const settings = getDailyNoteSettings();
// Returns: { format: string, folder: string, template: string }
```

**Important Considerations:**
- Respect user's existing Daily Notes configuration
- Use their date format and folder settings
- VaultPal template path is separate from Daily Notes template
- Handle case where user has Periodic Notes plugin

### 6.2 Templater Compatibility

**Potential Conflict:**
- User's template may contain Templater syntax (`<% %>`)
- Templater processes templates on file creation
- VaultPal processes templates during conversation

**Solution:**
- VaultPal only looks for `vaultpal` code blocks
- Ignore all other code blocks
- Let Templater process its own syntax
- Ensure VaultPal runs after Templater completes

### 6.3 Workspace Management

**View Registration:**

```typescript
// main.ts
async onload() {
  // Register Pet View
  this.registerView(
    VIEW_TYPE_PET,
    (leaf) => new PetView(leaf, this)
  );

  // Register Calendar View
  this.registerView(
    VIEW_TYPE_CALENDAR,
    (leaf) => new CalendarView(leaf, this)
  );

  // Add ribbon icon
  this.addRibbonIcon("heart", "Open Vault Pal", () => {
    this.activateView(VIEW_TYPE_PET);
  });

  // Add commands
  this.addCommand({
    id: "open-vault-pal",
    name: "Open Vault Pal",
    callback: () => this.activateView(VIEW_TYPE_PET)
  });

  this.addCommand({
    id: "open-calendar-view",
    name: "Open Calendar View",
    callback: () => this.activateView(VIEW_TYPE_CALENDAR)
  });
}

async activateView(viewType: string) {
  const { workspace } = this.app;

  // Detach existing leaves of this type
  workspace.detachLeavesOfType(viewType);

  // Create new leaf in right sidebar
  const leaf = workspace.getRightLeaf(false);
  await leaf.setViewState({
    type: viewType,
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
git clone https://github.com/terriyeh/vault-pal
cd vault-pal

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
   mklink /D "C:\path\to\test-vault\.obsidian\plugins\vault-pal" "D:\vault-pal"

   # macOS/Linux
   ln -s /path/to/vault-pal /path/to/test-vault/.obsidian/plugins/vault-pal
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
| Template parsing | < 50ms |
| Note creation | < 500ms |
| Memory usage | < 10MB |
| SVG asset size (total) | < 150KB |

---

## 9. Future Considerations

### Phase 2 Features (Post-MVP)
- Voice input (local Whisper)
- Journey progression system
- Paid asset packs
- Multiple pet types
- Advanced customization

### Scalability
- Asset loading optimization
- State persistence strategies
- Plugin settings migration
- Cross-vault sync (if needed)

---

## 10. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| User has existing Daily Notes setup | Integrate with daily-notes-interface to respect settings |
| Template conflicts with other plugins | Use unique `vaultpal` code block syntax |
| Performance in large vaults | Lazy load assets, optimize SVG files |
| Mobile compatibility | Use responsive CSS, test on mobile app |
| Breaking changes in Obsidian API | Follow official API docs, test with latest versions |

---

## Conclusion

This architecture provides a solid foundation for Vault Pal's MVP features:
- ✅ Pet view with 7 animation states
- ✅ Calendar view for navigation
- ✅ Template-based conversation flow
- ✅ Daily note integration
- ✅ XP and progression system
- ✅ Fully local and private

The modular design allows for easy extension and future feature additions while maintaining clean separation of concerns.

---

**Next Steps:**
1. Set up project repository
2. Implement core plugin structure
3. Create SVG assets
4. Develop animation system
5. Build conversation flow
6. Integrate with Daily Notes
7. Implement progression system
8. Add calendar view
9. Testing and polish
10. Submit to Obsidian community plugins
