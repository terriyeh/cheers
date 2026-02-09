# Changelog

All notable changes to Obsidian Pets will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [PIVOT] - 2026-02-09

### Strategic Direction Change

**From:** Conversation-based daily journaling companion with XP progression
**To:** Celebration-focused vault companion with ambient emotional support

**Core Philosophy:** "Feeling the plugin, not thinking about it"

### Why This Pivot?

Research into VS Code Pets (2.26M installs) and the Obsidian pet plugin landscape revealed:
1. **No progression needed**: VS Code Pets has ZERO XP/levels yet dominates the market (50x more installs than competitors with progression)
2. **Emotion > Features**: Success driven by "100% joy gain, zero productivity gain"
3. **Market gap**: No Obsidian plugin celebrates vault activities proactively
4. **Simplicity wins**: Complex chat/conversation systems add cognitive load and compete with existing plugins (Obsidian Copilot, Smart Composer)

### What's Changing

**Removed Features (Archived):**
- ❌ Conversation/chat system (Issues #10, #12, #14, #55)
- ❌ Chat UI component
- ❌ Template parsing for journal prompts
- ❌ Chat types validation (Issue #46)
- ❌ XP progression and leveling
- ❌ Calendar view with completion tracking
- ❌ Streak-based gamification

**New Direction:**
- ✅ **Vault-aware celebrations**: Pet celebrates when you create notes, reach word counts, check tasks, add links
- ✅ **User-configurable triggers**: Choose what actions deserve celebration
- ✅ **Ambient presence**: Pet exists peacefully, no attention demands
- ✅ **Optional companion music**: User-provided lo-fi URLs
- ✅ **Zero cognitive load**: No chat, no decisions, just write

### Renamed

- **Repository**: `vault-pal` → `obsidian-pets`
- **Plugin ID**: `vault-pal` → `obsidian-pets`
- **Plugin Name**: "Vault Pal" → "Obsidian Pets"
- **GitHub URL**: https://github.com/terriyeh/obsidian-pets

### Competitive Positioning

| Plugin | Focus | Interaction |
|--------|-------|-------------|
| Pixel Pets | Decorative + AI Chat | Reactive Q&A |
| Vault Pets | Decoration Only | None |
| **Obsidian Pets** | **Celebration Companion** | **Proactive Joy** |

### What's Preserved

- ✅ Pet companion with 7 animation states
- ✅ Petting interaction (click/tap anytime)
- ✅ Welcome modal and settings
- ✅ Mobile touch support
- ✅ Privacy-first (no network calls)
- ✅ State machine architecture
- ✅ Svelte component system

### Technical Debt Cleaned

- Moved conversation system to `archive/` folder
- Removed template parsing logic
- Simplified PetView.ts (removed conversation methods)
- Archived conversation tests
- Updated documentation to reflect new direction

### Next Steps

**v0.2.0 - Celebration System (Simple & Focused):**
- Vault event listeners (note creation, tasks, links, word counts)
- Emoji speech bubbles for celebrations (no text messages)
- User-configurable celebration triggers
- Milestone tracking with cooldowns
- Settings UI for customization
- State remapping (remove "talking"/"listening" states)

**v0.3.0+ - Enhanced Experience:**
- Custom celebration messages (user-entered text)
- Celebration banner UI (toast notifications)
- Immersion behaviors (pets react to each other)
- Relationships (multiple pets interact like VS Code Pets friends)
- Adventures (background changes)

**Note:** Companion music feature removed - recommend pairing with [Soundscapes plugin](https://github.com/andrewmcgivery/obsidian-soundscapes) instead

---

## [Unreleased]

### Added
- Welcome modal for first-run configuration (Issue #3)
- Pet name setting with validation (1-30 chars, alphanumeric + spaces)
- User name setting (optional) with validation (0-30 chars, alphanumeric + spaces)
- Personalized messages using pet name and user name
  - Greeting message: "Hello [userName]!" (or "Hello there!" if no userName)
  - Talking message: "How was your day, [userName]?" (or generic if no userName)
- Command palette command "Edit Pet Settings" to reopen welcome modal
- 37 comprehensive tests for settings validation and persistence
- Automatic Daily Notes configuration detection
- Manual state triggers for development (console debug commands)
- Mobile touch support for pet interaction
  - Touch event handling with `handleTouchEnd()`
  - Mobile-optimized CSS (touch-action, tap highlight removal)

### Changed
- Welcome modal now appears on first view open instead of plugin load
- Settings stored in modal-based pattern instead of settings page

### Fixed
- Windows path validation regex in asset path resolution
- Race condition in pet view activation
- Loading state now properly hidden before error display

### Security
- Enhanced path validation to prevent directory traversal attacks
- Extracted duplicate validation logic to centralized `getAssetPath()` method
- Added state validation before DOM attribute updates to prevent XSS
- Debug logging gated behind `__DEV__` flag (removed in production builds)

### Technical
- Settings interface: `VaultPalSettings` (petName, userName, hasCompletedWelcome)
- Settings persistence to `.obsidian/plugins/vault-pal/data.json`
- Real-time input validation with error messages
- Modal-based settings pattern (no dedicated settings page)
- Build-time conditionals for debug code (`__DEV__` flag)
- Refactored view management with `ensurePetViewExists()` helper method

## [0.0.1] - 2026-02-04

### Added
- Initial project setup
- Pet view foundation with state machine (Issue #4)
- 7 animation states (idle, greeting, talking, listening, small-celebration, big-celebration, petting)
- 120 tests for pet view and state machine with 100% coverage
- Sprite-based animation system with pixel art
- State transitions with auto-return to idle
- Svelte component architecture
- Security hardening (path validation, state validation, error cleanup)
- Integration tests for complex state sequences
- Development console commands for manual state testing (`window.vaultPalDebug`)
