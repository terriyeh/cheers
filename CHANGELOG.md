# Changelog

All notable changes to Cheers will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [0.1.0] - 2026-03-10

Initial public release.

### Added

**Pet companion**
- Animated pet (Mochi) with GIF-based state animations: walking, petting, celebration
- CSS-based edge-to-edge movement with direction flip at container edges
- Movement speed slider (0–100%) in settings
- Petting interaction: click or tap the pet to trigger a petting animation
- Mobile touch support

**Backgrounds**
- Day/night background system: two animated GIF scenes that transition automatically at 6 am and 6 pm
- Sky color fills the area above the tiled background for seamless display at any panel height

**Vault-aware celebrations**
- Confetti rain animation (CSS `@keyframes`, no external assets) triggered by vault events
- Status bar notification fires automatically with each celebration (always on, no toggle needed)
- Individual celebration toggles (all on by default):
  - Note creation
  - Task completion (checkbox checked)
  - Link creation (wiki links and markdown links)
  - Word count goals

**Word count goals**
- Per-note goal: set `word-goal: N` in note frontmatter; celebrates when the note reaches 100% of goal
- Daily goal: configured in settings; counts total words written today across all notes; resets at midnight
- Word counting strips frontmatter, code blocks, inline code, and Obsidian comments to match Obsidian's algorithm

**Stats dashboard**
- Stats tab in the plugin panel (alongside Pet tab)
- Concentric word count rings: outer ring = daily goal progress, inner ring = per-note goal progress (only shown when the active note has `word-goal` set)
- Daily activity tallies for enabled celebration types: notes created, tasks completed, links created
- Warm/cool color mode toggle for the rings

**Settings**
- Pet name (1–30 characters)
- Movement speed slider
- Celebration toggles (note creation, task completion, link creation, word count)
- Daily word goal input
- Dashboard color mode (warm/cool)
- Background theme (day/night)

**Technical**
- All GIF assets bundled into `main.js` at build time — no loose asset files needed at runtime
- Privacy-first: no network calls, fully local
- State machine architecture for pet animation transitions
- Svelte component system
