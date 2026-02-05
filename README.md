# Vault Pal 🦊

An interactive pet companion for Obsidian that makes daily journaling delightful through conversational prompts and gentle gamification.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Obsidian](https://img.shields.io/badge/Obsidian-1.0.0+-purple)

---

## Overview

Vault Pal transforms daily note-taking from a blank page into a friendly conversation with your virtual pet companion, Kit the Fox. Through guided questions, XP rewards, and streak tracking, it helps you build a sustainable journaling habit.

### Key Features

- **Interactive Pet Companion**: Kit the Fox responds to your journaling with 7 animation states (idle, greeting, talking, listening, small celebration, big celebration, petting)
- **Conversational Journaling**: Answer prompts from your template through a chat interface
- **Automatic Note Creation**: Responses are written directly into your daily notes
- **Progress Tracking**: Earn XP, build streaks, unlock milestone rewards
- **Calendar View**: Visual overview of your journaling history with completion indicators
- **Privacy-First**: Fully local, no network calls, no telemetry
- **Customizable Templates**: Use vaultpal code blocks to define your own questions

---

## Installation

### From Obsidian Community Plugins (Recommended)

1. Open Obsidian Settings → Community plugins
2. Browse and search for "Vault Pal"
3. Click Install, then Enable

### Manual Installation

1. Download the latest release from [GitHub Releases](https://github.com/terriyeh/vault-pal/releases)
2. Extract the files to `.obsidian/plugins/vault-pal/` in your vault
3. Reload Obsidian
4. Enable the plugin in Settings → Community plugins

---

## Quick Start

### 1. Enable Daily Notes Plugin

Vault Pal integrates with Obsidian's built-in Daily Notes plugin:

1. Go to Settings → Core plugins
2. Enable "Daily notes"
3. Configure your daily notes folder and template location

### 2. Create a Template with VaultPal Prompts

Add vaultpal code blocks to your daily note template:

```markdown
# Daily Note - {{date}}

## What went well today?

```vaultpal
prompt: "What went well today?"
```

## What was challenging?

```vaultpal
prompt: "What was challenging today?"
```

## What am I grateful for?

```vaultpal
prompt: "What are you grateful for?"
```
```

### 3. Start Journaling

1. Click the paw icon in the sidebar to open Vault Pal
2. Click "Start Conversation" button
3. Answer Kit's questions in the chat interface
4. Your responses are automatically saved to today's daily note
5. Complete all questions to earn XP and build your streak!

---

## Template Syntax

Vault Pal uses special code blocks to identify questions in your template:

### Basic Prompt

```markdown
```vaultpal
prompt: "What's one thing you're grateful for today?"
```
```

### Multi-line Prompt

```markdown
```vaultpal
prompt: "Reflect on your day:
- What went well?
- What could have been better?
- What will you focus on tomorrow?"
```
```

### Supported Question Types

- **Freeform text** (default): Open-ended questions for written responses
- **Checkbox** (coming soon): Multiple choice options

---

## Features

### Pet Animations

Kit the Fox has 7 distinct animation states:

- **Idle**: Gentle breathing animation when resting
- **Greeting**: Welcoming wave when you open the panel
- **Talking**: Animated while presenting questions
- **Listening**: Attentive pose while you type
- **Small Celebration**: Brief cheer after each answer
- **Big Celebration**: Enthusiastic celebration when completing your note
- **Petting**: Content reaction when you click on Kit

### Progression System

- **XP**: Earn 10 XP per completed daily note
- **Streaks**: Track consecutive days of journaling
- **Milestones**: Unlock rewards at 7, 30, 60, and 100-day streaks
- **Cosmetic Rewards**: Unlock decorative elements for Kit's environment

### Calendar View

- Monthly calendar display with completion indicators
- Visual streak visualization
- Click any date to open/create notes
- Quick navigation between Pet View and Calendar View

---

## Settings

Configure Vault Pal in Settings → Community Plugins → Vault Pal:

| Setting | Description | Default |
|---------|-------------|---------|
| Daily Notes folder | Auto-detected from Daily Notes plugin | Read-only |
| Daily Notes template | Auto-detected from Daily Notes plugin | Read-only |
| Pet name | Your companion's name | Kit |
| XP per note | Experience points per completed note | 10 |

---

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Obsidian for testing

### Setup

```bash
# Clone the repository
git clone https://github.com/terriyeh/vault-pal
cd vault-pal

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
mklink /D "C:\path\to\test-vault\.obsidian\plugins\vault-pal" "D:\vault-pal"

# macOS/Linux
ln -s /path/to/vault-pal /path/to/test-vault/.obsidian/plugins/vault-pal
```

3. Enable the plugin in your test vault
4. Install the Hot-Reload plugin for automatic reloading

### Tech Stack

- **Language**: TypeScript
- **UI Framework**: Svelte 4 (compiled to vanilla JS)
- **Build Tool**: esbuild with esbuild-svelte
- **Daily Notes**: obsidian-daily-notes-interface library
- **Animation**: CSS animations + TypeScript state machine
- **Storage**: Obsidian Plugin API (local JSON)

### Project Structure

```
vault-pal/
├── src/
│   ├── main.ts                    # Main plugin class
│   ├── settings.ts                # Settings tab
│   ├── views/
│   │   ├── PetView.ts            # Main pet panel
│   │   └── CalendarView.ts       # Calendar navigation
│   ├── components/               # Svelte components
│   │   ├── Pet.svelte
│   │   ├── Chat.svelte
│   │   ├── ProgressBar.svelte
│   │   └── Calendar.svelte
│   ├── core/
│   │   ├── TemplateParser.ts
│   │   ├── ConversationManager.ts
│   │   └── ProgressionSystem.ts
│   └── types/
│       └── index.ts
├── assets/
│   └── pet/                      # Pet sprites
├── styles.css
├── manifest.json
└── package.json
```

---

## Roadmap

### Current Version (1.0 - MVP)

- ✅ Pet companion with 7 animation states
- ✅ Conversational daily note capture
- ✅ XP and streak tracking
- ✅ Milestone celebrations
- ✅ Calendar view with completion indicators

### Planned Features (Post-MVP)

- **Voice Input**: Local Whisper transcription for verbal responses
- **Journey Progression**: Environment transitions as you complete more notes
- **Multiple Pets**: Additional pet companions with unique animations
- **Paid Asset Packs**: Seasonal backgrounds, pet emotes, and decorations
- **AI Conversations**: Chat with Kit about your notes (BYOK)
- **Habit Tracking**: Integrated habit checkboxes in daily flow
- **Custom Greetings**: User-configurable greeting messages

---

## Troubleshooting

### Plugin won't load
- Ensure Daily Notes core plugin is enabled
- Check that you're using Obsidian 1.0.0 or higher
- Try disabling and re-enabling the plugin

### No questions appear
- Verify your template has `vaultpal` code blocks with `prompt:` fields
- Check Settings → Daily notes for correct template path
- Make sure code blocks use triple backticks with "vaultpal" language

### Responses not saving
- Check file permissions on your vault folder
- Verify Daily Notes folder exists and is writable
- Look for errors in Developer Console (Ctrl+Shift+I)

### Calendar not showing completions
- Ensure responses are written below vaultpal code blocks
- Wait a moment for the calendar to refresh
- Try switching views and back to calendar

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Reporting Issues

Found a bug or have a feature request? [Open an issue](https://github.com/terriyeh/vault-pal/issues) on GitHub.

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Built with the [Obsidian Plugin API](https://github.com/obsidianmd/obsidian-api)
- Inspired by [Finch](https://finchcare.com/), [Forest](https://www.forestapp.cc/), and [Habitica](https://habitica.com/)
- Calendar implementation adapted from [obsidian-calendar-plugin](https://github.com/liamcain/obsidian-calendar-plugin) (MIT)
- Uses [obsidian-daily-notes-interface](https://github.com/liamcain/obsidian-daily-notes-interface) for Daily Notes integration

---

## Support

- **Documentation**: [GitHub Wiki](https://github.com/terriyeh/vault-pal/wiki)
- **Community**: [Obsidian Forum](https://forum.obsidian.md/)
- **Issues**: [GitHub Issues](https://github.com/terriyeh/vault-pal/issues)

---

Made with 💙 for the Obsidian community