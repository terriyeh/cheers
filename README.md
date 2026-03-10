# Cheers 🦊

Your vault companion that celebrates you.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Obsidian](https://img.shields.io/badge/Obsidian-1.0.0+-purple)

---

<!-- TODO: Add screenshot or GIF demo here -->

If you've ever wished for a personal cheerleader to celebrate the progress in your Obsidian vault, Cheers is for you. 

Cheers puts an animated, vault-aware cat companion in your Obsidian sidebar. As you work in the vault, your companion notices — and celebrates. Whether you create a note, check off a task, reach a word goal (daily and per-document), or create a new link, your companion responds with confetti and a cheerful status bar message.

Personalize the activities you want celebrated. Switch to Daily Stats for non-animated tallies.

Minimal distraction. Maximum delight. This plugin gently rewards with cozy moments of recognition when you make progress.

---

## Celebrated Vault Activities

Each activity triggers confetti and a status bar message using your pet's name. Every trigger has its own on/off toggle.

- Create any `.md` note
- Check off a task `- [x]`
- Add a link `[[wiki]]` or `[md](url)`
- Reach your **daily word goal** (set in Settings)
- Reach a **per-note word goal** (set via `word-goal:` frontmatter)

---

## Installation

### From Obsidian Community Plugins (Recommended)

1. Open Obsidian **Settings → Community plugins**
2. Browse and search for **"Cheers"**
3. Click **Install**, then **Enable**

### Manual

1. Download the [latest release](https://github.com/terriyeh/cheers/releases) and grab `main.js`, `manifest.json`, and `styles.css`
2. Create a folder at `.obsidian/plugins/cheers/` in your vault and place the three files inside
3. Reload Obsidian and enable the plugin under Community plugins

---

## Quick Start

1. Open the **Cheers panel** from the left sidebar (cat icon) or via **Command Palette → "Open Cheers"**
2. A welcome screen lets you name your pet (default: Kit) and optionally enter your own name
3. Open **Settings → Cheers** to turn on the celebrations you want
4. Start writing — your pet does the rest

---

## Configuration

### Celebrations

Open **Settings → Cheers → Celebrations** to configure:

- **Individual toggles** — enable or disable each celebration type independently
- **Daily word goal** — set a vault-wide target; resets at midnight
- **Per-note word goal** — add `word-goal: 200` to any note's frontmatter

Both goal types can be active at the same time. The per-note goal is checked against the current open file only.

### Pet & Appearance

- **Pet name** — 1–30 characters, letters and spaces
- **Your name** — optional; used in status bar messages (e.g. "✨ Kit cheers for Alex!")
- **Animation speed** — 0–100% slider (0% = leisurely, 100% = very fast)
- **Background** — automatically switches between a day scene (6am–8pm) and a night scene
- **Stats color palette** — warm (pink / yellow / orange) or cool (blue / cyan / green) for the Stats tab tallies

---

## Stats Dashboard

The **Stats tab** (inside the pet panel) shows your writing activity at a glance:

- **Outer ring** — daily word progress toward your goal
- **Inner circle** — per-note word progress for the currently open file
- **Activity tallies** — notes created, links added, and tasks completed today (shown when the corresponding celebration is enabled)

---

## Troubleshooting

**Pet won't load**
- Confirm you're on Obsidian 1.0.0 or higher
- Disable and re-enable the plugin
- Check the Developer Console (Ctrl+Shift+I) for errors

**Celebrations not triggering**
- Verify the relevant toggle is on in **Settings → Cheers → Celebrations**
- Only one celebration plays at a time — if another is in progress, the next one queues
- Link celebrations require content inside the brackets (`[[]]` alone won't trigger)
- Word goal celebrations fire once when you cross 100% — not on every word after

**Stats rings not showing**
- The outer ring requires a daily word goal set in Settings
- The inner circle requires `word-goal: [number]` in the current file's frontmatter

**Welcome modal doesn't appear**
- Use **Command Palette → "Edit Pet Settings"** to reopen it at any time

---

## Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/terriyeh/cheers).

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

## Support

- **Issues**: [GitHub Issues](https://github.com/terriyeh/cheers/issues)
- **Community**: [Obsidian Forum](https://forum.obsidian.md/)

---

*"Your vault celebrates you."*
