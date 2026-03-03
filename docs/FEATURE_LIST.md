# Cheers! (working title) — Feature List
# Public plugin name: Obsidian Pets

## Vision
Creator of delightful moments in your vault.

Celebrates your vault engagement and progression.

A plugin you feel, not think about.

## Core Features

### 1. Scene Rendering
- **Background system**: Tileable 128x128px image file per season (4 total: spring, summer, autumn, winter)
- **Background tiling**: Horizontal tiling only (repeat-x), no vertical/horizontal scaling
- **Pet positioning**: bottom: 64px (aligns with center of 128px background tile)
- **Scene elements**: Fountain + unmanned cart (painted into background images)
- **Rendering**: 2-layer system (background image + character GIF sprites)
- **Season switching**: Image file swap via CSS `background-image` property

### 2. Character System
- **Main pet**: 1 sprite with cosmetics support (hats, scarves, accessories)
- **Companions**: 0-2 optional (user toggle), shared generic sprite
- **Animation system**: GIF-based animation (walking.gif handles frame animation internally, no sprite sheets)
- **Sprite states**: walking, celebration, petting
- **Movement**: CSS-based horizontal animation (edge-to-edge with direction flip)
- **Speed control**: 0-100% slider with linear scaling (MAX_DURATION=33s at 0%, MIN_DURATION=6s at 100%)

### 3. Interactions
- **Petting**: Click/tap pet → heart sprite appears → return to previous state
- **Butterfly chase**: User clicks button → butterfly sprite released → pets chase → butterfly exits → pets return to walking
- **Cart approach**: Pets periodically approach cart → pause → return to walking (ambient behavior)
- **Celebrations**: Vault events trigger celebration animation state + separate fireworks animation

### 4. Vault-Aware Celebrations
- **Triggers** (user-configurable on/off):
  - Daily note creation
  - Any note creation
  - Link creation
  - Task completion
  - Word count goals (see below)
- **Per-trigger options** (independent toggles for each trigger type):
  - **Fireworks**: Show fireworks overlay animation (on by default)
  - **Status bar notification**: Show a brief message in the status bar for 3 seconds (fires automatically with each enabled trigger)
- **Word count goal types** (at least one required when word count celebration is enabled):
  - **Per-note goal**: Set via frontmatter in the note (`word-goal: 10000`). Celebrates when note reaches 100% of goal.
  - **Per-day goal**: Single number in plugin settings (vault-wide total words written today, resets at midnight). Celebrates when daily total reaches 100% of goal.
  - **Consideration (not decided)**: Also celebrate at 50% of each goal to keep the pet lively during longer sessions.
- **Cooldown system**: Prevent celebration spam
- **Animation**: Play celebration sprite state when triggered

### 5. Dashboard View
- **Access**: Tab toggle within the same plugin panel, following Obsidian Files core plugin tab pattern (tabs at top of view)
- **Tabs**: [Pet] and [Stats], switch between views without opening a separate panel
- **Concentric word count rings**:
  - **Outer ring**: Daily word count progress toward daily goal. Always shown when word count celebration is enabled.
  - **Inner ring**: Per-note word count progress toward `word-goal` frontmatter value. Only renders when the current note has a `word-goal` set — absent otherwise (not an empty ring).
- **Activity tallies** (shown only for celebration types that are toggled ON):
  - Tasks completed today
  - Notes created today
  - Links created today
- **Dangling links tally**: Deferred to V1.1. Framing: each unresolved `[[link]]` you fill counts as +1 progress.
- **All counters reset at midnight**
- **[Later] Streak counter**: Consecutive days the user hit at least one celebration trigger. Highest behavioral impact per pixel — loss aversion mechanism drives daily return. Show current streak prominently; consider a "shield" grace day to prevent one-miss abandonment.
- **[Later] Monthly calendar dots**: One bit per day (filled/empty), GitHub contribution graph style. Minimal historical context with near-zero cognitive overhead; drives writing identity formation without requiring full chart infrastructure.

### 6. Seasonal Transformation
- **Fountain states**: 4 variations painted into background (flowing → sparkling → reflective → frozen)
- **Ambient elements**: Butterflies → fireflies → leaves → snowflakes (painted in)
- **Lighting**: Different atmospheric lighting per season (painted into backgrounds)
- **Cart decorations**: Seasonal wreaths/decorations (painted into backgrounds)
- [TBD, may not do] **Automatic switching**: Season detection based on current date

### 7. Cosmetics System
- **Slots**: 3 per main pet (hat, scarf, accessory)
- **Application**: Layered sprite rendering (base + cosmetic layers)
- **Storage**: Save equipped cosmetics to settings
- [TBD, may not do] **Preview**: Show cosmetics in settings UI

### 8. Settings & Persistence
- **Pet settings**:
  - Pet name (1-30 characters, alphanumeric + spaces)
  - Companion count (0, 1, or 2)
  - Movement speed (0-100%)
- **Celebration settings**:
  - Toggle for each trigger type (daily notes, tasks, links, word count)
  - Per-trigger fireworks toggle (on/off, default on)
  - Status bar notification: fires automatically when a celebration trigger fires (no separate toggle)
  - Daily word goal (number, required when word count celebration is on)
  - Per-note word goal: set in note frontmatter (`word-goal: [number]`), not in plugin settings
- **Data storage**: Local JSON via Obsidian Plugin API

### 9. UI Components
- **Plugin panel**: Sidebar view with two tabs — Pet tab (garden scene + pet) and Stats tab (dashboard)
- **Welcome modal**: First-run setup (pet name, celebration events)
- **Settings page**: Plugin Settings tab (Settings → Obsidian Pets) — not a modal
- **Butterfly button**: Clickable icon to release butterfly
- **Speed slider**: Control movement speed (in settings)

### 10. Performance
- **GPU acceleration**: CSS animations on compositor thread
- **Mobile optimization**: Touch-enabled, battery-efficient
- **Frame rate**: 60 FPS target
- **CPU usage**: <0.1% target (CSS handles animation)

### 11. Technical Constraints
- **No dynamic lighting system** (deferred to V1.2+)
- **No multi-layer rendering engine** (backgrounds are single images)
- **No mix-and-match seasonal elements** (entire scene swaps)
- **Privacy-first**: No network calls, fully local

---

## Phase Breakdown

### V1.0 — MVP (Community Plugin Submission)
**Complete:**
- Movement system (CSS-based walking)
- Basic pet GIFs for each state (walk, celebrate, pet)
- Petting interaction
- Background scene (garden path)
- Vault event listeners + celebration triggers (note creation, task completion, link creation)
- Main character animations (walk, pet, celebrate)
- Production fireworks animation
- Settings persistence
- Status bar notification system (global toggle, off by default, independent of fireworks)
- Word count goals: per-note goal (frontmatter `word-goal`) + per-day goal (settings), replacing milestone list
- Stats dashboard (Today tab): concentric word count rings, activity tallies, warm/cool color mode

**Remaining:**
- None. V1.0 is feature-complete.

### V1.1 — Interactivity + Vault Health
- Butterfly chase interaction (user-triggered, pets chase then return to walking)
- Dangling links tally on Today tab (unresolved `[[links]]` count; reducing them is progress)
- Streaks tab (third panel tab): streak counter (consecutive days with vault activity) + monthly calendar dots (GitHub heatmap style; one bit per day)

### V1.2 — Scene & Cosmetics
- Companion system (0–2 companions; crew celebrating together, lively scene feel)
- Cosmetics system (hat, scarf, accessory slots with layered sprite rendering)
- Seasonal background assets (spring, summer, autumn, winter scenes)
- Note: companions + cosmetics + seasonal ship together due to shared rendering complexity (multi-entity positioning, layered sprites)

---

## Architecture Implications

1. **Background**: Image asset management + CSS swap logic
2. **Sprites**: GIF-based animation per state
3. **State machine**: Pet animation state transitions
4. **Event system**: Vault listeners → celebration triggers → fireworks + status bar notification
5. **Word count tracking**: Delta accumulation per file for daily total; frontmatter reader for per-note goal
6. **Dashboard**: Tab-switched view within same panel; SVG concentric rings (pure CSS/SVG, no charting library); daily counters with midnight reset
7. **Settings**: Plugin Settings tab UI + data persistence layer
8. **Companion system**: Multi-entity positioning logic (V1.2)
9. **Cosmetics**: Layered sprite rendering system (V1.2)
10. **Seasonal detection**: Date-based season calculator (V1.2)
