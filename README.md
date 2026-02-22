# Obsidian Pets 🦊

Your vault companion that celebrates you.

![Version](https://img.shields.io/badge/version-0.1.0--dev-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Obsidian](https://img.shields.io/badge/Obsidian-1.0.0+-purple)

---

## Overview

Obsidian Pets transforms your vault into a delightful space by celebrating your writing journey. Your companion notices when you create notes, reach word count goals, check off tasks, and engage with your knowledge base—responding with ambient celebrations that make your vault feel alive.

**Philosophy:** *Feeling the plugin, not thinking about it.*

No chat. No XP grinding. No cognitive load. Just cozy moments of recognition when you do what you love: write, think, and organize your knowledge.

---

## Why Obsidian Pets?

### What Makes It Different

**Pixel Pets:** Decorative pet + AI chat for vault queries
**Vault Pets:** Pure decoration (VS Code Pets port)
**Obsidian Pets:** **Your vault celebrates you** ✨

We're not here to:
- ❌ Chat about your notes (use Obsidian Copilot for that)
- ❌ Track productivity metrics (use RPG Stat Tracker for that)
- ❌ Demand your attention with notifications

We're here to:
- ✅ Celebrate when you create a daily note
- ✅ Cheer when you reach your word count goals
- ✅ Notice when you check off tasks
- ✅ Respond to your vault activities with joy
- ✅ Provide ambient emotional support

### Key Features

- **Vault-Aware Celebrations** ✅ IMPLEMENTED (v0.2.0, Feb 12 2026): Pet celebrates note creation, task completion, link creation, and word count goals
- **Interactive Pet Companion** ✅ IMPLEMENTED: 3 animation states with GIF-based animations
  - Walking, celebration, petting
  - CSS-based movement system with speed control
  - Automatic direction flipping at edges
- **Ambient Presence** ✅ IMPLEMENTED: Pet walks across panel with configurable speed (0-100%)
  - Linear speed scaling (0% = 33s duration, 100% = 6s duration)
  - GPU-accelerated CSS animations (<0.1% CPU)
- **User-Configurable Triggers** ✅ IMPLEMENTED (v0.2.0): Individual toggles for each celebration type, with independent fireworks and toast controls
- **Toast Notifications** 🚧 PLANNED (v1.0): Per-trigger toast messages when your pet cheers — on by default, toggleable per celebration type
- **Progress Dashboard** 🚧 PLANNED (v1.0): Stats tab within the pet panel — concentric word count rings and daily activity tallies for enabled celebration types
- **Butterfly Chase** 🚧 PLANNED (v1.1): Release a butterfly and watch your pet chase it
- **Crew & Cosmetics** 🚧 PLANNED (v1.2): Optional companion pets + accessories (hats, scarves) + seasonal backgrounds
- **Privacy-First** ✅ IMPLEMENTED: Fully local, no network calls, no telemetry
- **Mobile Support** ✅ IMPLEMENTED: Touch-enabled for phones and tablets, battery-optimized

---

## Installation

### From Obsidian Community Plugins (Recommended)

1. Open Obsidian Settings → Community plugins
2. Browse and search for "Obsidian Pets"
3. Click Install, then Enable

### Manual Installation

1. Download the latest release from [GitHub Releases](https://github.com/terriyeh/obsidian-pets/releases)
2. Extract the files to `.obsidian/plugins/obsidian-pets/` in your vault
3. Reload Obsidian
4. Enable the plugin in Settings → Community plugins

---

## Quick Start

### 1. Configure Your Pet Companion

On first launch, you'll see a welcome modal:

1. Enter your pet's name (default: Kit)
2. Optionally enter your name (what your pet will call you)
3. Click "Let's Go!" or Skip to use defaults

You can change these settings later using **Command Palette → "Edit Pet Settings"**

### 2. Open Your Pet Panel

1. Click the paw icon 🐾 in the sidebar ribbon
2. Your pet appears and greets you with a wave
3. Click or tap your pet to pet them anytime!

### 3. Start Writing

Your pet celebrates when you:
- ✅ **Create any new note** - Fireworks + toast
- ✅ **Check off task checkboxes** - Fireworks + toast
- ✅ **Add links between notes** (wiki `[[link]]` or markdown `[link](url)`) - Fireworks + toast
- ✅ **Reach your daily word goal** (configured in settings) - Fireworks + toast
- ✅ **Reach your per-note word goal** (set `word-goal: [number]` in note frontmatter) - Fireworks + toast

Each action triggers a celebration animation—no input required from you. Just write, and your pet celebrates alongside you. Configure which celebrations you want in Settings.

---

## Celebration Triggers

### Built-in Celebrations

| Action | Fireworks | Toast | Configurable |
|--------|-----------|-------|--------------|
| **Create any note** (.md files) | ✅ On/Off | ✅ On/Off | Per-trigger |
| **Check off task** (`- [x]`) | ✅ On/Off | ✅ On/Off | Per-trigger |
| **Add a link** (`[[wiki]]` or `[markdown](url)`) | ✅ On/Off | ✅ On/Off | Per-trigger |
| **Reach daily word goal** (vault-wide, resets midnight) | ✅ On/Off | ✅ On/Off | Goal set in settings |
| **Reach per-note word goal** (`word-goal` frontmatter) | ✅ On/Off | ✅ On/Off | Goal set per note |

### Customization

Configure celebrations in **Settings → Obsidian Pets → Celebrations**:
- **Individual toggles**: Enable/disable each celebration type independently
- **Per-trigger controls**: Each type has independent Fireworks and Toast toggles (both on by default)
- **Daily word goal**: Set your target words per day in settings (vault-wide, resets at midnight)
- **Per-note word goal**: Add `word-goal: [number]` to any note's frontmatter to set a target for that document
- **Race condition prevention**: Only one celebration plays at a time (prevents overlapping animations)
- **Smart detection**: Only celebrates increases (won't trigger when unchecking tasks or removing links)

---

## Features

### Pet Animations

Your companion has 3 animation states using GIF-based animation:

- **Walking**: Continuous edge-to-edge movement with configurable speed (0-100%)
  - Smooth horizontal movement with automatic direction flipping
  - Linear speed scaling (0% = slowest 33s, 100% = fastest 6s)
  - GPU-accelerated for 60 FPS performance
  - Minimal battery drain (<0.1% CPU usage)
  - GIF handles frame animation internally, no sprite sheets
- **Celebration**: Fireworks animation triggered by vault events (v0.2.0)
  - GIF animation (4.32 seconds)
  - Triggered by note creation, task completion, link creation, word count goals
- **Petting**: Content reaction when you click/tap (available anytime)
  - GIF-based petting animation
  - Returns to walking state after petting

**GIF-Based Animation System:**

Each pet state uses a separate animated GIF file for smooth, browser-native animation:

- **Pet Sprites** (100px × 100px display size):
  - `cat-walking-6fps.gif` - Looping walk cycle
  - `cat-petting-6fps.gif` - Content reaction animation
  - `cat-celebrating-6fps.gif` - Character celebrates
- **Visual Effects** (128px × 128px display size):
  - `fireworks.gif` - 3-firework overlay during celebrations
- **Background Scene**:
  - `Background_reg.png` - Tileable garden path (128px height)

All frame animation is handled natively by the browser (no sprite sheets or CSS keyframes needed). This approach reduces complexity and ensures consistent performance across devices.

**Movement System Features:**
- Configurable speed (0-100% slider)
- Adaptive boundaries (ResizeObserver updates on container resize)
- Direction changes synchronized with sprite flipping
- State preservation (pet returns to walking after interruptions)

**Mobile Support**: Fully touch-enabled with battery-optimized CSS animations

---

## Recommended Plugin Pairings

Obsidian Pets works beautifully alongside other plugins to create your perfect workspace:

### For Ambient Music
**[Soundscapes](https://github.com/andrewmcgivery/obsidian-soundscapes)** - Adds ambient background music to Obsidian
- Curated lo-fi, nature sounds, and ambient tracks
- Toggle on/off easily
- Perfect companion for focused writing sessions
- Pairs naturally with pet celebrations

### For Productivity
- **Daily Notes** (Core plugin) - Creates daily notes that your pet celebrates
- **Tasks** - Track checkboxes that trigger celebrations
- **Calendar** - Visual overview of your writing journey

---

## Settings & Configuration

### Pet Personalization

**First Run:**
- Welcome modal appears automatically when you first open the Pet View
- Configure your pet's name and your own name
- Settings are saved to `.obsidian/plugins/obsidian-pets/data.json`

**Changing Settings Later:**
- Open Command Palette (Ctrl/Cmd + P)
- Type "Edit Pet Settings"
- Update your pet's name or your name

**Available Settings:**

| Setting | Description | Default | Validation |
|---------|-------------|---------|------------|
| Pet name | Your companion's name | Kit | 1-30 characters, alphanumeric + spaces only |
| Your name | What your pet calls you | (optional) | 0-30 characters, alphanumeric + spaces only |

### Celebration Settings

Open **Settings → Obsidian Pets → Celebrations** to configure:

**Individual Toggles** (each type has independent Fireworks and Toast controls):
- ✅ **Note creation** - Celebrate when creating new .md files
- ✅ **Task completion** - Celebrate when checking off checkboxes (`- [x]`)
- ✅ **Link creation** - Celebrate when adding wiki links or markdown links
- ✅ **Word count goals** - Celebrate when reaching your daily or per-note goal

**Word Count Goal Configuration** (shown only when word count goals enabled):
- **Daily goal**: Set a target number of words to write per day across your vault (resets at midnight)
- **Per-note goal**: Add `word-goal: [number]` to any note's frontmatter to set a target for that document
- At least one goal type must be configured when word count celebrations are enabled

---

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Obsidian for testing

### Setup

```bash
# Clone the repository
git clone https://github.com/terriyeh/obsidian-pets
cd obsidian-pets

# Install dependencies
npm install

# Start development mode (watch for changes)
npm run dev

# Build for production
npm run build
```

### Testing in Obsidian

1. Create a test vault in Obsidian
2. Create a symlink to the plugin directory:

```bash
# Windows
mklink /D "C:\path\to\test-vault\.obsidian\plugins\obsidian-pets" "D:\obsidian-pets"

# macOS/Linux
ln -s /path/to/obsidian-pets /path/to/test-vault/.obsidian/plugins/obsidian-pets
```

3. Enable the plugin in your test vault
4. Install the Hot-Reload plugin for automatic reloading

### Tech Stack

- **Language**: TypeScript
- **UI Framework**: Svelte 4 (compiled to vanilla JS)
- **Build Tool**: esbuild with esbuild-svelte
- **Animation**: CSS animations + TypeScript state machine
- **Storage**: Obsidian Plugin API (local JSON)

### Project Structure

```
obsidian-pets/
├── src/
│   ├── main.ts                    # Main plugin class
│   ├── modals/
│   │   └── WelcomeModal.ts       # Settings modal
│   ├── views/
│   │   └── PetView.ts            # Main pet panel
│   ├── components/               # Svelte components
│   │   └── Pet.svelte
│   ├── pet/
│   │   └── PetStateMachine.ts   # Animation state machine
│   ├── celebration/              # Celebration system (coming soon)
│   │   ├── CelebrationEngine.ts
│   │   ├── VaultEventListeners.ts
│   │   └── MilestoneTracker.ts
│   └── types/
│       ├── pet.ts
│       └── settings.ts
├── assets/
│   ├── cat-walking-6fps.gif       # Walking animation GIF
│   ├── cat-petting-6fps.gif       # Petting animation GIF
│   ├── cat-celebrating-6fps.gif   # Celebration animation GIF
│   ├── effects/
│   │   ├── fireworks.gif          # Celebration fireworks overlay
│   │   └── heart.png              # Legacy asset (unused)
│   └── backgrounds/
│       └── Background_reg.png     # Default garden scene
├── styles.css
├── manifest.json
└── package.json
```

---

## Roadmap

### Current (Foundation + Celebrations)

- ✅ Pet companion with 3 animation states (walking, petting, celebration)
- ✅ CSS-based movement system with speed control (0-100%)
- ✅ Petting interaction (click/tap anytime)
- ✅ Garden background scene
- ✅ Vault event listeners — note creation, task completion, link creation
- ✅ Fireworks celebration animations
- ✅ User-configurable triggers with per-type toggles
- ✅ Welcome modal and settings persistence
- ✅ Mobile touch support with battery optimization
- ✅ GPU-accelerated animations (60 FPS, <0.1% CPU)

### v1.0 — MVP (Community Plugin Submission)

- 🚧 Toast notifications — per-trigger, on by default, independent of fireworks
- 🚧 Word count goals — daily goal (settings) and per-note goal (frontmatter), replacing milestone list
- 🚧 Progress dashboard — Stats tab within the pet panel:
  - Concentric word count rings (daily outer, per-note inner)
  - Daily activity tallies for enabled celebration types
- 🚧 Settings page — all settings accessible via Plugin Settings tab

### v1.1 — Interactivity + Vault Health

- 📅 Butterfly chase — release a butterfly, watch your pet chase it
- 📅 Dangling links tally on dashboard — unresolved `[[links]]`; fixing them counts as progress

### v1.2 — Scene & Cosmetics

- 📅 Companion pets (0–2 optional companions, crew celebrating together)
- 📅 Cosmetics system — hats, scarves, accessories with layered sprite rendering
- 📅 Seasonal backgrounds — spring, summer, autumn, winter scenes

---

## Command Palette Commands

- **Open Obsidian Pets** - Opens the pet view in the sidebar
- **Edit Pet Settings** - Reopens the welcome modal to change pet/user names

---

## Troubleshooting

### Plugin won't load
- Check that you're using Obsidian 1.0.0 or higher
- Try disabling and re-enabling the plugin
- Check Developer Console (Ctrl+Shift+I) for errors

### Pet doesn't animate
- Verify sprite assets exist in `assets/` folder
- Check that animations aren't disabled by another plugin
- Look for CSS conflicts with theme

### Celebrations not triggering
- Check **Settings → Obsidian Pets → Celebrations** to verify triggers are enabled
- Celebrations use race condition prevention (only one at a time) - not cooldowns
- Link celebrations require content inside brackets (won't trigger on empty `[[]]`)
- Word count goal celebrations fire when you hit 100% of your daily or per-note goal
- Restart Obsidian if celebrations stop working after plugin update

### Welcome modal doesn't appear
- Welcome modal only appears on first view open
- Use Command Palette → "Edit Pet Settings" to reopen
- Check that `hasCompletedWelcome` is false in `data.json`

### Settings validation errors
- Pet name must be 1-30 characters (alphanumeric + spaces only)
- Your name must be 0-30 characters (alphanumeric + spaces only)
- Special characters like @#$%^&* are not allowed

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Automated Code Review

All pull requests are automatically reviewed by Claude AI using the official [Anthropic Claude Code Action](https://github.com/anthropics/claude-code-action):

- **Automatic**: Runs on every PR, no @claude mention needed
- **Comprehensive**: Reviews code quality, security, and testing
- **Interactive**: Comment `@claude` on PRs/issues for assistance

See [`.github/workflows/README.md`](.github/workflows/README.md) for details.

### Reporting Issues

Found a bug or have a feature request? [Open an issue](https://github.com/terriyeh/obsidian-pets/issues) on GitHub.

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Built with the [Obsidian Plugin API](https://github.com/obsidianmd/obsidian-api)
- Inspired by [VS Code Pets](https://github.com/tonybaloney/vscode-pets) (2.26M installs, emotion > features)
- Research: [Pixel Pets](https://github.com/LucasHJin/obsidian-pets) and vault companion landscape
- Animation patterns from sprite-based web games

---

## Support

- **Documentation**: [GitHub Wiki](https://github.com/terriyeh/obsidian-pets/wiki)
- **Community**: [Obsidian Forum](https://forum.obsidian.md/)
- **Issues**: [GitHub Issues](https://github.com/terriyeh/obsidian-pets/issues)

---

**Made with 💙 for the Obsidian community**

*"Your vault celebrates you."*
