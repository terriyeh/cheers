# Archived Code

This directory contains code from the original "Vault Pal" concept that was deprecated during the strategic pivot to "Obsidian Pets" on 2026-02-09.

## Why This Code Was Archived

Research into VS Code Pets (2.26M installs) and the Obsidian pet plugin landscape revealed that **simplicity and emotion drive adoption**, not complex conversation/progression systems.

### Strategic Pivot

**From:** Conversation-based daily journaling companion with XP progression
**To:** Celebration-focused vault companion with ambient emotional support

**Core Philosophy:** *"Feeling the plugin, not thinking about it"*

## What's Archived

### Template System (`template/`)
- **Purpose:** Parse VaultPal code blocks (`\`\`\`vaultpal`) from daily note templates
- **Files:**
  - `parser.ts` - Extract questions from templates
  - `validator.ts` - Validate template syntax
  - `cache.ts` - Cache parsed templates
  - `index.ts` - Barrel exports
- **Why archived:** No longer using conversation flow or template-based prompts

### Chat Types (`types/`)
- **Purpose:** Type definitions for conversation system
- **Files:**
  - `chat.ts` - Question, Response, ValidationResult types
  - `template.ts` - Template parsing types
- **Why archived:** Conversation system replaced with emoji celebrations

## What Replaced This

The conversation/template system was replaced with:

### v0.2.0 - Celebration System
- **Vault Event Listeners** - Detect note creation, tasks, links, word counts
- **Emoji Speech Bubbles** - Simple celebrations (🎉 ❤️ 🎊 ✨ 🎆)
- **User-Configurable Triggers** - Choose what deserves celebration
- **Milestone Tracking** - Cooldowns to prevent spam

### v0.3.0+ - Enhanced Experience
- Custom celebration messages (user-entered text)
- Celebration banner UI (toast notifications)
- Immersion behaviors (pets react to each other)
- Relationships (multiple pets interact)
- Adventures (background changes)

## Code Preservation

This code is preserved for:
1. **Reference** - Understanding original design decisions
2. **Learning** - Template parsing patterns may be useful elsewhere
3. **History** - Documenting the evolution of the plugin

## Do Not Use

⚠️ **This code is not maintained and should not be used in production.**

If you need conversation/template features, consider:
- [Obsidian Copilot](https://github.com/logancollins/obsidian-copilot) - AI chat for vault queries
- [Smart Composer](https://github.com/glyphyy/obsidian-smart-composer) - AI-powered writing assistant
- [Templater](https://github.com/SilentVoid13/Templater) - Advanced template system

## See Also

- [CHANGELOG.md](../CHANGELOG.md) - Complete pivot documentation
- [IMPLEMENTATION_ROADMAP.md](../IMPLEMENTATION_ROADMAP.md) - New development roadmap
- [TECHNICAL_ARCHITECTURE.md](../TECHNICAL_ARCHITECTURE.md) - Updated architecture

---

**Archived:** 2026-02-09
**Reason:** Strategic pivot to celebration-focused companion
**Status:** Preserved for reference only
