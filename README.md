# Obsidian Pets 🦊

Your vault companion that celebrates you.

![Version](https://img.shields.io/badge/version-0.1.0--dev-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Obsidian](https://img.shields.io/badge/Obsidian-1.0.0+-purple)

---

## Overview

Obsidian Pets transforms your vault into a delightful space by celebrating your writing journey. Your companion notices when you create notes, reach word count milestones, check off tasks, and engage with your knowledge base—responding with ambient celebrations that make your vault feel alive.

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
- ✅ Cheer when you reach word count milestones
- ✅ Notice when you check off tasks
- ✅ Respond to your vault activities with joy
- ✅ Provide ambient emotional support

### Key Features

- **Vault-Aware Celebrations** 🎉 Pet celebrates your activities (daily notes, word counts, tasks, links)
- **Interactive Pet Companion** ✅ IMPLEMENTED: 7 animation states (idle, greeting, talking, listening, celebration, petting) [TODO: Mapping of these states need to be changed; associated messages replaced with emojis in speech bubbles]
- **User-Configurable Triggers** 🚧 PLANNED: Choose what actions trigger celebrations
- **Ambient Presence** 🚧 PLANNED: Pet walks across panel, exists peacefully when you're working
- **Pets Live Their Lives Alongside Yours** 🚧 PLANNED: Your pets have emerging behaviors and relationships, and go on adventures while you work
- **Privacy-First** ✅ IMPLEMENTED: Fully local, no network calls, no telemetry
- **Mobile Support** ✅ IMPLEMENTED: Touch-enabled for phones and tablets

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

Your pet notices when you:
- Create a daily note
- Create any new note
- Add links between notes
- Check off task checkboxes
- Reach word count milestones (customizable)
- [TODO: Research what other "milestones" users like to track in plugins like RPG Stats Tracker]

Each action triggers a celebration animation—no input required from you. Just write, and your pet celebrates alongside you.

---

## Celebration Triggers

### Built-in Celebrations (Coming Soon)

| Action | Animation | Configurable |
|--------|-----------|--------------|
| **Create daily note** | Small celebration | ✅ On/Off |
| **Create any note** | Hearts | ✅ On/Off |
| **Add a link** | Sparkles | ✅ On/Off |
| **Check off task** | Confetti | ✅ On/Off |
| **Word count milestone** | Fireworks | ✅ Custom thresholds |

### Customization

You decide what deserves celebration:
- Toggle each celebration type on/off
- Set your own word count milestones (e.g., 100, 500, 1000 words)
- Adjust celebration frequency (cooldowns to prevent spam)
- Create celebration banner UI, allow user to customize message
- You decide how you want to celebrate each achievment (pick what animation to play, or what message to display)

**Settings coming in v0.2.0**

---

## Features

### Pet Animations

Your companion has 7 distinct animation states:

[TODO: needs remapping to animation]
- **Idle**: Gentle breathing when resting
- **Greeting**: Welcoming wave when you open the panel
- **Walking**: Travels across the panel (ambient presence)
- **Small Celebration**: Brief cheer for everyday actions
- **Big Celebration**: Enthusiastic celebration for milestones
- **Petting**: Content reaction when you click/tap (available anytime)
- **Listening**: Attentive pose (reserved for future features)

**Mobile Support**: Fully touch-enabled with optimized interactions

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

### Celebration Settings (Coming Soon)

Configure which actions trigger celebrations, and what celebrations they each trigger:
- Daily note creation
- Any note creation
- Link creation
- Task completion
- Word count milestones (custom thresholds)

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
│   ├── pet-sprite-sheet.png
│   └── heart.png
├── styles.css
├── manifest.json
└── package.json
```

---

## Roadmap

### Current Version (0.1.0 - Foundation)

- ✅ Pet companion with 7 animation states
- ✅ Petting interaction (click/tap anytime)
- ✅ Welcome modal and settings
- ✅ Mobile touch support

### v0.2.0 - Celebration System (Next)

- 🚧 Vault event listeners (note creation, tasks, links)
- 🚧 Celebration animations (fireworks, hearts, confetti)
- 🚧 User-configurable triggers
- 🚧 Word count milestone tracking
- 🚧 Cooldown system (prevent spam)

### v0.3.0 - Enhanced Experience

- 📅 Optional companion music (user-provided URLs)
- 📅 Pet walks across panel (ambient movement)
- 📅 Background themes
- 📅 Celebration sound effects (optional)

### v0.4.0+ - Community & Customization

- 📅 Multiple pet types
- 📅 Custom celebration animations
- 📅 Seasonal celebration packs ($1.99)
- 📅 Premium backgrounds ($1.99)
- 📅 Community-contributed pets

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

### Celebrations not triggering (v0.2.0+)
- Check Settings → Obsidian Pets to verify triggers are enabled
- Some celebrations have cooldowns to prevent spam
- Restart Obsidian if celebrations stop working

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
