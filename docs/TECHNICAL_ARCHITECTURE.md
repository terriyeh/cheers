# Technical Architecture Plan

**Date**: 2026-02-12
**Version**: 3.0 (Garden Scene Design)
**Based on**: [FEATURE_LIST.md](FEATURE_LIST.md)
**Status**: Ready for Implementation

---

## Executive Summary

**Tech Stack Decision**: **Hybrid CSS + JavaScript**
- **CSS handles**: All rendering and animations (GPU-accelerated, 60 FPS)
- **JavaScript handles**: Logic, state management, vault events, user interactions

**Architecture**: Component-based Svelte architecture with centralized state machine

**Target Performance**: 60 FPS, <0.1% CPU usage

**Total Phase 2 Scope**: 60-71 hours estimated

---

## Tech Stack Analysis

### Pure CSS (Compositor Thread - 60 FPS Guaranteed)

**What CSS Handles:**
- ✅ Background image swaps (seasonal garden scenes)
- ✅ 2-layer rendering (background + character sprites)
- ✅ All sprite animations (idle, walk, run, celebrate, etc.)
- ✅ Horizontal movement (edge-to-edge walking)
- ✅ Direction flipping (`scaleX(-1)`)
- ✅ Speed control (via CSS custom properties)
- ✅ Companion duplication (CSS positioning)
- ✅ Cosmetics layering (z-index stacking)
- ✅ Heart animation (float-up effect)
- ✅ Butterfly flight path
- ✅ Ambient elements (snowflakes, leaves - optional)

**Why CSS is Sufficient:**
- Runs on compositor thread (separate from JavaScript)
- GPU-accelerated transforms and opacity
- No per-frame JavaScript execution
- Browser handles interpolation and timing
- Survives JavaScript main thread blocking

### JavaScript Required (Main Thread - Logic Only)

**What JavaScript Handles:**
- ✅ Season detection (`new Date().getMonth()`)
- ✅ Background switching logic (reactive variable triggers CSS swap)
- ✅ Petting interaction (click handler → state transition)
- ✅ Butterfly chase (spawn sprite, timer, state coordination)
- ✅ Cart approach (periodic timer, state transition)
- ✅ Vault event listeners (Obsidian API integration)
- ✅ Celebration triggers (cooldown checks, state transitions)
- ✅ Settings persistence (Obsidian `loadData/saveData`)
- ✅ Companion count control (render 0-2 instances)
- ✅ Modal UIs (Svelte components)

**Why JavaScript is Needed:**
- State machine logic (cannot be done in CSS)
- Vault event listeners (Obsidian Plugin API)
- Date calculations (season detection)
- Cooldown timers (anti-spam)
- User interaction handlers (click, touch)

**Verdict**: Hybrid approach maximizes performance while maintaining full feature set.

---

## Component Architecture

### Proposed File Structure

```
d:\vault-pal\
├── src\
│   ├── components\
│   │   ├── Pet.svelte           # ✅ Existing - Main pet sprite
│   │   ├── PetPanel.svelte      # 🆕 Orchestrator for all components
│   │   ├── Garden.svelte        # 🆕 Background + seasonal management
│   │   ├── Butterfly.svelte     # 🆕 Butterfly chase sprite
│   │   ├── CompanionPets.svelte # 🆕 Renders 0-2 companions
│   │   ├── ButterflyButton.svelte # 🆕 Interactive button UI
│   │   └── CelebrationBanner.svelte # 🆕 Phase 2 toast notification
│   │
│   ├── pet\
│   │   ├── PetStateMachine.ts   # ✅ Existing - State management
│   │   ├── SeasonDetector.ts    # 🆕 Date-based season calculation
│   │   └── CelebrationManager.ts # 🆕 Phase 2 event coordination
│   │
│   ├── events\                  # 🆕 Phase 2 - Vault event listeners
│   │   ├── VaultEventRegistry.ts
│   │   ├── NoteEventHandler.ts
│   │   ├── TaskEventHandler.ts
│   │   └── CooldownManager.ts
│   │
│   ├── modals\
│   │   ├── WelcomeModal.ts      # ✅ Existing
│   │   └── SettingsModal.svelte # 🆕 Full settings UI (replace .ts)
│   │
│   ├── views\
│   │   └── PetView.ts           # ✅ Existing - ItemView (minimal changes)
│   │
│   ├── types\
│   │   ├── pet.ts               # ✅ Existing (add 'chase' state)
│   │   ├── settings.ts          # ✅ Existing (expand for Phase 2)
│   │   ├── season.ts            # 🆕 Season types
│   │   └── events.ts            # 🆕 Phase 2 event types
│   │
│   └── main.ts                  # ✅ Existing (register event listeners)
│
├── assets\
│   ├── sprites\
│   │   ├── pet-sprite-sheet.png # ✅ Existing
│   │   ├── companion-sprite-sheet.png # 🆕 Generic companion
│   │   ├── butterfly.png        # 🆕 Butterfly sprite
│   │   └── heart.png            # ✅ Existing
│   │
│   └── backgrounds\             # 🆕 Seasonal garden images
│       ├── spring.webp          # 800x600px, ~30-50KB
│       ├── summer.webp
│       ├── autumn.webp
│       └── winter.webp
```

### Component Responsibilities

**PetPanel.svelte** (NEW - Main Orchestrator)
- Coordinates all child components
- Manages UI state (butterfly cooldown, current season)
- Handles user interactions (butterfly button clicks)
- Listens to PetStateMachine for state changes
- Passes state down to Pet and Companions

**Garden.svelte** (NEW)
- Renders seasonal background image
- Provides container for pet positioning
- Renders ambient animated elements (CSS overlays)
- Later: Detects and swaps seasons automatically

**Pet.svelte** (EXISTING - Minor Modifications)
- Add `isCompanion: boolean` prop
- Disable petting interaction if `isCompanion={true}`
- Keep all existing movement and animation logic
- Support cosmetics layering (Phase 3)

**CompanionPets.svelte** (NEW)
- Renders 0-2 instances of Pet.svelte with `isCompanion={true}`
- Offsets movement timing to prevent synchronization
- Coordinates state during chase/celebration (synchronized)

**Butterfly.svelte** (NEW)
- Animated sprite with diagonal flight path
- Self-managing (handles own animation lifecycle)
- Emits `exited` event when animation completes
- Removes self from DOM after exit

**ButterflyButton.svelte** (NEW)
- Circular button with butterfly icon
- Shows enabled/disabled state
- Optional cooldown progress indicator
- Emits `release` event on click

**[Later] CelebrationBanner.svelte** (NEW - Phase 2)
- Slide-down toast notification
- Auto-dismisses after 2 seconds
- Displays celebration message + icon
- Non-blocking (doesn't interrupt interactions)

---

## State Management

### Architecture Pattern

**Centralized State Machine** with event-driven updates:

```
┌─────────────────────────────────┐
│        PetView.ts               │
│  - Owns PetStateMachine         │
│  - Registers vault listeners    │
│  - Updates PetPanel via props   │
└─────────────────────────────────┘
              ▼
┌─────────────────────────────────┐
│      PetPanel.svelte            │
│  - Receives state from PetView  │
│  - Manages UI state             │
│  - Coordinates children         │
└─────────────────────────────────┘
              ▼
┌──────────┬──────────┬───────────┐
│   Pet    │Companions│ Butterfly │
│ (main)   │  (0-2)   │           │
└──────────┴──────────┴───────────┘
```

### State Sources

1. **PetStateMachine** (TypeScript)
   - Pet animation state (walking, running, celebrating, etc.)
   - Current: Supports idle, walking, running, greeting, celebration, petting, sleeping
   - Update to simplify and support: 
    - remap running -> `chase` state for butterfly interaction
    - remap idle -> `drinking` state for drinking coffee 
    - remove sleeping

2. **Plugin Settings** (Obsidian API)
   - Current: Pet name, user name. Remove user name (will not be used)
   - Companion count (0, 1, or 2)
   - Movement speed (0-100%)
   - Celebration triggers (Phase 2)
   - Equipped cosmetics (Phase 3)

3. [TBD] **SeasonDetector** (TypeScript)
   - Calculates season from current date
   - Returns: `'spring' | 'summer' | 'autumn' | 'winter'`

4. **CelebrationManager** (TypeScript - Phase 2)
   - Tracks cooldown timestamps
   - Listens to vault events
   - Coordinates celebration triggers

---

## Implementation by Feature

### 1. Scene Rendering (Garden Backgrounds)

**Approach**: Hybrid CSS + JavaScript

**JavaScript**: Season Detection
```typescript
// src/pet/SeasonDetector.ts
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export function getCurrentSeason(): Season {
  const month = new Date().getMonth(); // 0-11

  if (month >= 2 && month <= 4) return 'spring';   // Mar-May
  if (month >= 5 && month <= 7) return 'summer';   // Jun-Aug
  if (month >= 8 && month <= 10) return 'autumn';  // Sep-Nov
  return 'winter'; // Dec-Feb
}
```

**CSS**: Background Rendering (Horizontal Tiling System)
```svelte
<!-- src/components/Pet.svelte (current implementation) -->
<div
  class="pet-sprite-container"
  data-state={state}
  style:--animation-duration="{animationDuration}s"
  style:--movement-duration="{movementDuration}s"
  style:background-image={backgroundPath ? `url(${backgroundPath})` : 'none'}>
  <!-- Pet renders here -->
</div>

<style>
  .pet-sprite-container {
    /* Background scene - tiled horizontally, no vertical scaling */
    /* Maintains natural image dimensions, tiles left-right, anchored to bottom */
    background-size: auto auto;        /* No scaling - use natural 128x128px size */
    background-position: bottom center; /* Anchor to bottom edge */
    background-repeat: repeat-x;        /* Tile horizontally only */

    /* Light neutral color fills space above background */
    background-color: #f5f3ef;

    /* Container properties */
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }

  /* Pet positioning - aligned with center of 128px background */
  .pet-position-wrapper {
    position: absolute;
    bottom: 64px; /* Offset from bottom - aligns with center of 128px background */
    left: 0;
  }
</style>
```

**Background Tiling System Details**:
- **Tile size**: 128x128px (natural image dimensions)
- **Tiling**: Horizontal only (repeat-x) - seamless left-to-right repeat
- **No scaling**: background-size: auto auto - prevents distortion
- **Positioning**: bottom center - anchored to bottom edge
- **Pet alignment**: bottom: 64px - places pet at center of 128px tile
- **Above-background fill**: #f5f3ef light neutral color for empty space

**Files Affected**:
- 🆕 `src/components/Garden.svelte`
- 🆕 `src/pet/SeasonDetector.ts`
- 🆕 `src/types/season.ts`
- 🆕 `assets/backgrounds/spring.webp` (design work)
- 🆕 `assets/backgrounds/summer.webp` (design work)
- 🆕 `assets/backgrounds/autumn.webp` (design work)
- 🆕 `assets/backgrounds/winter.webp` (design work)

**Estimated Effort**: 13-17 hours (2h code + 8-12h design + 3h integration)

---

### 2. Animation and Movement System

**Animation Approach**: GIF-based animation system

**GIF Animation Details**:
```typescript
// src/components/Pet.svelte
/**
 * Path to the pet sprite GIF (passed from PetView)
 */
export let petSpritePath: string = 'assets/cat.gif';
```

**How It Works**:
- GIF files handle frame animation internally (browser-native)
- No CSS sprite sheet keyframes needed
- Current: Single walking.gif for all states
- Future: Separate GIFs per state (celebration.gif, petting.gif, etc.)
- Celebration state uses sprite sheet overlay (7-frame fireworks animation)

**Movement Speed System**: Linear scaling with constant px/s

**Speed Formula (Simplified)**:
```typescript
// Animation timing constants
const MAX_DURATION = 33; // Slowest speed (0%) - 33 seconds
const MIN_DURATION = 6;  // Fastest speed (100%) - 6 seconds

// Linear speed scaling
$: referenceDuration = MAX_DURATION - (clampedSpeed / 100) * (MAX_DURATION - MIN_DURATION);
$: speedInPixelsPerSecond = referenceDistance / referenceDuration;

// Maintains constant px/s across different container widths
$: movementDuration = actualDistance / speedInPixelsPerSecond;
```

**Key Simplifications** (vs. old system):
- ❌ Removed: 60% walking/running threshold
- ❌ Removed: 6 speed constants (WALKING_MIN_SPEED, WALKING_MAX_SPEED, etc.)
- ✅ Added: 2 duration constants (MAX_DURATION, MIN_DURATION)
- ✅ Linear scaling: Simple, predictable speed progression
- ✅ Constant px/s: Movement speed consistent across window sizes

**Files Affected**:
- ✏️ `src/components/Pet.svelte` (speed calculation logic)
- ✏️ `src/views/PetView.ts` (uses cat.gif instead of sprite sheet)

**Estimated Effort**: Already implemented

---

### 3. Character System (Companions)

**Approach**: Svelte component duplication with CSS positioning

**Implementation**:
```svelte
<!-- src/components/CompanionPets.svelte -->
<script>
  import Pet from './Pet.svelte';
  import type { PetState } from '../types/pet';

  export let companionCount: number; // 0, 1, or 2
  export let state: PetState;
  export let spriteSheetPath: string;
  export let movementSpeed: number;

  $: companions = Array.from({ length: companionCount }, (_, i) => ({
    id: i,
    offset: i * 100 // px offset for starting position
  }));
</script>

{#each companions as companion (companion.id)}
  <Pet
    {state}
    {spriteSheetPath}
    {movementSpeed}
    isCompanion={true}
    startOffset={companion.offset}
  />
{/each}
```

**Files Affected**:
- 🆕 `src/components/CompanionPets.svelte`
- ✏️ `src/components/Pet.svelte` (add `isCompanion` prop)
- ✏️ `src/types/settings.ts` (add `companionCount: 0 | 1 | 2`)

**Estimated Effort**: 7-9 hours

---

### 4. Vault-Aware Celebrations

**Event Flow**:
```
Vault Event (daily note created)
  ↓
VaultEventRegistry catches event
  ↓
CelebrationManager.handleEvent()
  ├─ Check: Is trigger enabled in settings?
  ├─ Check: Is cooldown expired?
  └─ YES → Trigger celebration
      ↓
  PetView.transitionState('celebration')
      ↓
  PetStateMachine.transition('celebration')
      └─ Updates all pets (main + companions)
```

**Files Affected**:
- 🆕 `src/events/VaultEventRegistry.ts`
- 🆕 `src/events/CelebrationManager.ts`
- 🆕 `src/events/CooldownManager.ts`
- 🆕 `src/events/NoteEventHandler.ts`
- 🆕 `src/events/TaskEventHandler.ts`
- 🆕 `src/components/CelebrationBanner.svelte`
- ✏️ `src/main.ts` (register event listeners)
- ✏️ `src/types/settings.ts` (add celebration settings)
- 🆕 `src/types/events.ts`

**Estimated Effort**: 14-17 hours

---

### 5. Butterfly Chase Interaction (Phase 2)

**CSS**: Butterfly Animation
```css
@keyframes butterfly-fly {
  0% {
    left: calc(50% - 12px);
    bottom: 20%;
    opacity: 1;
  }
  80% {
    left: calc(100% - 24px);
    top: 10%;
    opacity: 1;
  }
  100% {
    left: calc(100% + 50px);
    top: 5%;
    opacity: 0;
  }
}

.butterfly {
  position: absolute;
  width: 24px;
  height: 24px;
  animation: butterfly-fly 5s ease-in-out forwards;
  z-index: 15;
}
```

**Files Affected**:
- 🆕 `src/components/Butterfly.svelte`
- 🆕 `src/components/ButterflyButton.svelte`
- 🆕 `assets/sprites/butterfly.png` (design work)
- ✏️ `src/types/pet.ts` (add `chase` to PetState type)
- ✏️ `src/pet/PetStateMachine.ts` (add 'chase' state handling)

**Estimated Effort**: 9-11 hours

---

### 6. Cart Approach (Ambient Behavior)

**Approach**: Timer-based periodic trigger

**Implementation**:
```typescript
// In PetPanel.svelte
let cartApproachTimer: number;

onMount(() => {
  const scheduleCartApproach = () => {
    const delay = 120000 + Math.random() * 180000; // 2-5 min
    cartApproachTimer = setTimeout(() => {
      triggerCartApproach();
      scheduleCartApproach();
    }, delay);
  };

  scheduleCartApproach();
});

function triggerCartApproach(): void {
  const previousState = petState;
  petState = 'cart-approach';

  setTimeout(() => {
    petState = previousState;
  }, 3000);
}
```

**Files Affected**:
- ✏️ `src/components/PetPanel.svelte` (add cart trigger logic)
- ✏️ `src/pet/PetStateMachine.ts` (add 'cart-approach' state)
- ✏️ `src/types/pet.ts` (add state to type)

**Estimated Effort**: 3-4 hours

---

## Performance Strategy

### CSS Optimizations

**1. Compositor Thread Animations**
```css
/* ✅ GOOD - Uses compositor thread */
.pet-sprite {
  transform: translateX(100px);
  opacity: 0.8;
  background-position: -64px 0;
}
```

**2. GPU Acceleration Hints**
```css
.pet-sprite-wrapper {
  will-change: transform;
}
```

**3. Containment**
```css
.pet-container {
  contain: layout style paint;
}
```

### JavaScript Optimizations

**1. Debounce Event Handlers**
```typescript
const handleResize = debounce(() => {
  updateMovementRange();
}, 150);
```

**2. Throttle Vault Events**
```typescript
this.app.workspace.on('editor-change', throttle((editor) => {
  checkWordCount(editor);
}, 2000));
```

**3. Lazy-Load Backgrounds**
```typescript
const currentSeason = getCurrentSeason();
const nextSeason = getNextSeason(currentSeason);
preloadImage(getBackgroundPath(currentSeason));
preloadImage(getBackgroundPath(nextSeason));
```

### Performance Targets

- **Frame Rate**: 60 FPS (16.67ms per frame)
- **CPU Usage**: <0.1% (CSS handles animations)
- **Memory**: <50MB total (including background images)
- **Bundle Size**: <200KB (Svelte compiled + code)
- **Asset Size**: <200KB total (all sprites + backgrounds)

---

## Implementation Roadmap

### Phase 0: Pre-work (6-9 hours)

1. X Remove all legacy functions, tests, and UI related to Daily Note Creation
2. X Rename from vault-pets to obsidian-pets across codebase
3. X Fix failing tests
4. ? Enhance Obsidian mocks

**Deliverable**: X Clean codebase

---

### Phase 1A: Core First Scene 
**Estimated**: 6-8 horus

1. Garden.svelte (3h)
2. X One placeholder background (purchase existing)
3. PetPanel.svelte (3h)

**Deliverable**: X One placeholder scene with animated components 

---

### Phase 1B: Core Features: Vault Events
**Estimated**: 14-17 hours

13. CooldownManager.ts (2h)
14. CelebrationManager.ts (3h)
15. VaultEventRegistry.ts (6h)
16. CelebrationBanner.svelte (3h)
17. Document event specification

**Deliverable**: Vault-aware celebrations

---

### Phase 2A: Interactions 
**Estimated**: 12-15 hours

8. Butterfly.svelte (3h)
9. ButterflyButton.svelte (2h)
10. Chase State (1h)
11. Butterfly Integration (3h)
12. Cart Approach (3-4h)

**Deliverable**: Butterfly chase + cart behavior

---

### Phase 2B: Companions 
**Estimated**: 7-9 hours

5. CompanionPets.svelte (4h)
6. Pet.svelte Modifications (1h)
7. Settings Integration (2h)

**Deliverable**: Configurable companions (0-2)

---

### Phase 2C: Polish & Testing
**Estimated**: 8-10 hours

17. Performance Testing (3h)
18. Accessibility (2h)
19. Mobile/Touch Testing (2h)
20. Bug Fixes & Refinement (3h)

**Deliverable**: Production-ready Phase 2

---

### Phase Prod: Production Sprites
**Estimated**: 16-20 hours

1. Main character sprite
2. Non-main character sprite
3. One animated background
4. Celebration sprite

**Deliverable**: Production assets

---

### [TBD] Phase 2F: Core Dynamic Scene Swapping
**Estimated**: 16-20 hours

1. SeasonDetector.ts (2h)
2. Garden.svelte (3h)
3. Seasonal Backgrounds (8-12h design)
4. PetPanel.svelte (3h)

**Deliverable**: Garden scene with automatic seasonal swapping

---

## Total Estimated Effort

**Phase 2 Total**: 60-71 hours

**Timeline**: 12-14 weeks at 20 hours/week

**Critical Path**: 2A → 2B → 2C must be sequential; 2D can be parallel with 2C

---

## Next Steps

1. Review this architecture plan
2. Create seasonal background designs (longest lead time)
3. Set up Phase 2A branch for development
4. Implement SeasonDetector + Garden components first
5. Iterate on garden visuals based on testing

---

**Document Status**: ✅ Ready for Implementation
**Last Updated**: 2026-02-12
**Next Review**: After Phase 2A completion
