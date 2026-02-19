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

### Changed - Animation and Movement System Simplification (2026-02-18)

**Animation System Migration (Sprite Sheets → GIF)**:
- Migrated from sprite sheet animation to GIF-based animation system
- GIF files handle frame animation internally (no CSS keyframe management needed)
- Current states: walking, celebration, petting (simplified from 7 states)
- Future: Different GIF files for different states (celebration.gif, petting.gif)
- Sprite sheet system retained only for celebration overlay (7-frame fireworks animation)

**Speed Formula Simplification**:
- Removed 60% walking/running threshold distinction
- Eliminated 6 constants, reduced to 2: MAX_DURATION=33s, MIN_DURATION=6s
- Linear speed scaling: duration = MAX_DURATION - (speed/100) * (MAX_DURATION - MIN_DURATION)
- Consistent movement behavior across entire 0-100% range
- Maintains constant px/s speed across different container widths

**Background Tiling System**:
- Implemented horizontal tiling (background-repeat: repeat-x)
- No vertical or horizontal scaling (background-size: auto auto)
- 128x128px tileable background design
- Pet positioned at bottom: 64px (aligns with center of background tile)
- Light neutral fill color (#f5f3ef) above background

**Technical Benefits**:
- Simpler codebase (fewer animation constants, clearer speed calculations)
- Better performance (GIF animation handled by browser, not CSS keyframes)
- More maintainable (linear formula easier to understand and modify)
- Consistent tiling (background repeats seamlessly without scaling artifacts)

## [0.2.0] - 2026-02-12

### Added - Vault Celebrations System

**Celebration Features:**
- 🎉 **Note creation celebrations**: Fireworks animation when creating new markdown files
- ✅ **Task completion celebrations**: Fireworks animation when checking off checkboxes (`- [x]`)
- 🔗 **Link creation celebrations**: Fireworks animation when adding wiki links (`[[link]]`) or markdown links (`[text](url)`)
- 📝 **Word milestone celebrations**: Fireworks animation when crossing configurable word count thresholds (default: 100, 500, 1000, 3500, 5000 words)

**Settings Integration:**
- Individual toggle for each celebration type in Settings → Obsidian Pets → Celebrations
- Conditional word milestone input (only shows when word milestones enabled)
- Word milestone validation: auto-removes duplicates, sorts ascending, filters invalid numbers
- Default fallback: `100, 500, 1000, 3500, 5000` if input is cleared

**Technical Implementation:**
- `CelebrationService` class for event management and celebration triggers
- Debounced editor change handling (500ms delay) to reduce performance impact
- Race condition prevention (blocks overlapping celebrations with boolean flag)
- State tracking to celebrate only increases (won't trigger on unchecking tasks or removing links)
- Milestone tracking per document (celebrates each threshold once)
- Clean event listener management with proper cleanup on view close

**Visual Effects:**
- CSS sprite sheet animation (7 frames, 1.8 seconds duration)
- Fireworks celebration sprite (`assets/effects/fireworks-spritesheet.png` - 10KB)
- Celebration overlay positioned in top third of view, horizontally centered
- Background scene (`assets/backgrounds/Background_reg.png` - 128KB)
- GPU-accelerated CSS `steps()` animation for smooth playback

**Testing:**
- 29 comprehensive tests for CelebrationService
- Test coverage: initialization, cleanup, all 4 celebration types, race condition prevention, debouncing
- Integration tests with PetView state transitions
- TDD approach with tests written before implementation

### Added - Movement System (Phase 2 Completion)
- CSS-based edge-to-edge adaptive movement system
  - Walking state (0-60% speed range)
  - Running state (61-100% speed range)
  - Smooth transitions between movement speeds
- Movement speed slider (0-100%) in settings/debug
- Automatic direction flipping at container edges
  - Synchronized flip animation with movement
  - Uses `scaleX` transform for smooth direction changes
- ResizeObserver for responsive boundary updates
  - Adapts to sidebar resizing and window changes
  - Updates CSS variable `--max-left` dynamically
- State-aware animation returns
  - Pet returns to walking/running after petting or celebration if it was moving
  - Preserves movement state across interruptions
- Performance optimizations
  - GPU-accelerated CSS animations (<0.1% CPU usage)
  - 60 FPS guaranteed on compositor thread
  - Minimal battery drain (critical for mobile users)

### Added - Settings & Configuration
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
- State machine updated to support walking/running states
  - Added `returnsToWalking` flag for state transitions
  - Updated transitions to preserve movement state
- Code quality improvements
  - Renamed `returnsToIdle` to `returnsToWalking` for clarity
  - Extracted movement constants (MIN_SPEED, MAX_SPEED, WALKING_THRESHOLD)
  - Improved code organization and readability

### Fixed - Movement System
- Transform stacking context issue
  - Changed from `transform: translateY(-50%)` to `margin-top: -32px`
  - Prevents conflicts between centering and flip animations
- Container width calculation
  - Added `width: 100%` to ensure proper boundary detection
  - Fixed `offsetWidth` returning zero
- Pet backing out on startup
  - Added `animation-delay: -2.5s` to start at center (50% of cycle)
  - Pet now starts centered instead of at left edge
- Direction flip synchronization
  - Synchronized flip animation delay with movement animation
  - Pet now faces correct direction at all times

### Fixed - General
- Windows path validation regex in asset path resolution
- Race condition in pet view activation
- Loading state now properly hidden before error display

### Security
- Enhanced path validation to prevent directory traversal attacks
- Extracted duplicate validation logic to centralized `getAssetPath()` method
- Added state validation before DOM attribute updates to prevent XSS
- Debug logging gated behind `__DEV__` flag (removed in production builds)
- Settings validation to prevent injection attacks

### Technical - Movement Architecture
- Layered CSS architecture for movement:
  - `pet-position-wrapper`: Horizontal movement (left property)
  - `pet-flip-wrapper`: Direction flipping (scaleX transform)
  - `pet-sprite-wrapper`: Vertical centering (margin-top)
  - `pet-sprite`: Sprite rendering
- Separation of concerns prevents transform conflicts
- CSS variables for dynamic speed control (`--movement-duration`)
- ResizeObserver pattern for responsive layouts

### Technical - Settings & State
- Settings interface: `VaultPalSettings` (petName, userName, hasCompletedWelcome)
- Settings persistence to `.obsidian/plugins/vault-pal/data.json`
- Real-time input validation with error messages
- Modal-based settings pattern (no dedicated settings page)
- Build-time conditionals for debug code (`__DEV__` flag)
- Refactored view management with `ensurePetViewExists()` helper method
- Enhanced state machine with movement state preservation

### Performance
- Movement system: <0.1% CPU usage (GPU-accelerated)
- 60 FPS animation guaranteed (compositor thread)
- Minimal battery drain compared to JavaScript per-frame updates
- Scalable architecture (would handle 5+ pets with negligible overhead)

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
