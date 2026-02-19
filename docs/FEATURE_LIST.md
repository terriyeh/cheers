# Obsidian Pets - Feature List

## Vision
Creator of delightful moments in your vault. 

Celebrates your vault engagaement and progression. 

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

### 4. Vault-Aware Celebrations (Phase 2)
- **Triggers** (user-configurable on/off):
  - Daily note creation
  - Any note creation
  - Link creation
  - Task completion
  - Word count milestones (custom thresholds)
- **Cooldown system**: Prevent celebration spam
- **Animation**: Play celebration sprite state when triggered

### 5. Seasonal Transformation
- **Fountain states**: 4 variations painted into background (flowing → sparkling → reflective → frozen)
- **Ambient elements**: Butterflies → fireflies → leaves → snowflakes (painted in)
- **Lighting**: Different atmospheric lighting per season (painted into backgrounds)
- **Cart decorations**: Seasonal wreaths/decorations (painted into backgrounds)
- [TBD, may not do] **Automatic switching**: Season detection based on current date

### 6. Cosmetics System
- **Slots**: 3 per main pet (hat, scarf, accessory)
- **Application**: Layered sprite rendering (base + cosmetic layers)
- **Storage**: Save equipped cosmetics to settings
- [TBD, may not do] **Preview**: Show cosmetics in settings UI

### 7. Settings & Persistence
- **Pet settings**:
  - Pet name (1-30 characters, alphanumeric + spaces)
  - [Existing, remove] User name (0-30 characters, optional)
  - Companion count (0, 1, or 2)
  - Movement speed (0-100%)
- **Celebration settings** (Phase 2):
  - Toggle for each trigger type (daily notes, tasks, etc.)
  - Custom word count thresholds
- **Data storage**: Local JSON via Obsidian Plugin API

### 8. UI Components
- **Pet panel**: Sidebar view with garden scene + pet(s)
- **Welcome modal**: First-run setup (pet name, celebration events)
- **Settings modal**: Edit pet settings (accessible via command palette) -> change to editing in Plugin Settings page
- **Butterfly button**: Clickable icon to release butterfly
- **Speed slider**: Control movement speed (in settings or panel)

### 9. Performance
- **GPU acceleration**: CSS animations on compositor thread
- **Mobile optimization**: Touch-enabled, battery-efficient
- **Frame rate**: 60 FPS target
- **CPU usage**: <0.1% target (CSS handles animation)

### 10. Technical Constraints
- **No dynamic lighting system** (deferred to Phase 4+)
- **No multi-layer rendering engine** (backgrounds are single images)
- **No mix-and-match seasonal elements** (entire scene swaps)
- **Privacy-first**: No network calls, fully local

---

## Phase Breakdown

### Phase 1 (Complete)
- Movement system (CSS-based walking/running)
- Basic pet sprite with animation states
- Petting interaction
- Settings persistence

### Phase 2 (Next)
- 1 placeholder background
- Vault event listeners + celebration triggers
- Companion toggle (0-2)
- Toggle on/off companions
- Butterfly chase interaction
- Cart approach behavior
- Cosmetic Foundation

### Phase 3 (Future)
- Rare random butterfly
- Additional cosmetics

### Phase 4+ (Deferred)
- Dynamic lighting
- Movement pattern variety
- Pet species variety
- Sound effects

---

## Architecture Implications

1. **Background**: Image asset management + CSS swap logic
2. **Sprites**: Sprite sheet management + CSS animation keyframes
3. **State machine**: Pet animation state transitions
4. **Event system**: Vault listeners → celebration triggers
5. **Settings**: Modal UI + data persistence layer
6. **Companion system**: CSS sprite duplication (positioning logic)
7. **Seasonal detection**: Date-based season calculator
8. **Cosmetics**: Layered sprite rendering system
