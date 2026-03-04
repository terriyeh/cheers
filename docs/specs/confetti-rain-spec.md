# Feature Spec: CSS Confetti Rain (Replace Fireworks GIF)

**Type:** Refactor + Visual Enhancement
**Branch:** `fix-fireworks`
**Status:** Ready for implementation

---

## Problem

The current `fireworks.gif` celebration overlay is not visually satisfying despite multiple revisions. It is a raster asset with limited tunability—color, density, timing, and style are baked into the GIF and cannot be adjusted without regenerating the asset.

## Solution

Replace the three-image fireworks overlay with a pure CSS `@keyframes` + TypeScript particle spawner that rains confetti from the top of the pet panel container. No external library. No canvas. No new assets.

---

## Anti-Requirements

- **No external dependencies** — no `canvas-confetti`, `party.js`, `dom-confetti`, or any npm package
- **No `position: fixed`** — must stay scoped to the sidebar panel; fixed positioning escapes Obsidian's DOM hierarchy and renders over the app chrome
- **No `vw`/`vh` units** in keyframes — the sidebar is a fixed-pixel container; viewport-relative units break horizontal drift at narrow widths
- **No `setInterval` spawn loop** — spawn all particles upfront with staggered `animation-delay` values; simpler lifecycle and no timer cleanup
- **No canvas element** — CSS-driven; Obsidian themes can inspect and override as needed
- **No changes to the celebration trigger flow** — `CelebrationService` → `PetStateMachine` → `PetView` → `Pet.svelte` remains untouched; only the visual layer changes
- **No change to `CELEBRATION_DURATION_MS`** — other parts of the system (state machine, service cooldown) depend on this value

---

## Scope: 7 Files

| File | Change type |
|---|---|
| `src/components/Pet.svelte` | Primary — remove fireworks, add confetti |
| `src/utils/celebration-constants.ts` | Remove firework constants; add confetti constants |
| `src/utils/asset-paths.ts` | Remove `EFFECT_SPRITES.FIREWORKS` |
| `src/views/PetView.ts` | Remove `fireworksSpritePath` prop pass |
| `tests/unit/components/Pet.svelte.test.ts` | Rewrite celebration overlay tests |
| `tests/mocks/Pet.svelte.ts` | Remove `fireworksSpritePath` from mock |
| `tests/unit/asset-paths.test.ts` | Remove `FIREWORKS` assertion |

**Asset deleted:** `assets/effects/fireworks.gif`

---

## Detailed Changes

### 1. `src/utils/celebration-constants.ts`

Remove all `FIREWORK_*` constants and replace with confetti equivalents. Keep `CELEBRATION_DURATION_MS` and `STATUS_BAR_NOTIFICATION_DURATION_MS` — both are depended on by `PetStateMachine` and `CelebrationService`.

**Remove** (lines 33–66):
```typescript
FIREWORK_GIF_WIDTH: 256,
FIREWORK_GIF_HEIGHT: 256,
FIREWORK_DISPLAY_WIDTH: 128,
FIREWORK_DISPLAY_HEIGHT: 128,
HALF_DISPLAY_WIDTH: 64,
CENTER_FIREWORK_TOP_PX: 80,
SIDE_FIREWORK_TOP_PX: 120,
VERTICAL_OFFSET_PX: 40,
HORIZONTAL_SPACING_PX: 200,
FADE_IN_DURATION_S: 0.3,
STAGGER_INTERVAL_S: 0.5,
CENTER_DELAY_S: 0,
LEFT_DELAY_S: 0.5,
RIGHT_DELAY_S: 1.0,
```

**Add** to `CELEBRATION_OVERLAY_CONSTANTS`:
```typescript
/** Number of confetti particles to spawn per celebration */
CONFETTI_COUNT: 35,
/** Grace period after CELEBRATION_DURATION_MS before particle DOM cleanup (ms) */
CONFETTI_CLEANUP_GRACE_MS: 500,
```

Update the JSDoc block comment to reflect the new visual approach.

---

### 2. `src/utils/asset-paths.ts`

Remove `FIREWORKS` from `EFFECT_SPRITES`. The `HEART` key is already marked legacy and unused; remove the entire `EFFECT_SPRITES` export if nothing else imports it.

```typescript
// Before:
export const EFFECT_SPRITES = {
  FIREWORKS: 'fireworks.gif',
  HEART: 'heart.png', // legacy
} as const;

// After: delete entire export
```

Verify with a project-wide grep for `EFFECT_SPRITES` before deleting.

---

### 3. `src/components/Pet.svelte`

This is the primary change. Three parts: script block, template, style block.

#### 3a. Script block — imports and prop removal

Remove from imports (line 9):
```typescript
// Remove EFFECT_SPRITES from this import:
import { PET_SPRITES, EFFECT_SPRITES, BACKGROUNDS } from '../utils/asset-paths';
//                    ^^^^^^^^^^^^^^^ remove
```

Remove `fireworksSpritePath` prop (line 34):
```typescript
// Delete this prop entirely:
export let fireworksSpritePath: string = `assets/effects/${EFFECT_SPRITES.FIREWORKS}`;
```

Add to imports at top of script (alongside existing imports):
```typescript
import { CELEBRATION_OVERLAY_CONSTANTS } from '../utils/celebration-constants';
```

#### 3b. Script block — confetti constants and spawn function

Add after the existing constant declarations (after line 65 `const petWidth = ...`):

```typescript
/** Confetti particle colors — cheerful palette, theme-independent */
const CONFETTI_COLORS = ['#f2d74e', '#ff9a91', '#a8e6cf', '#95c3de', '#c8b8f8', '#ffb347'] as const;
const CONFETTI_SHAPES = ['square', 'rect', 'circle'] as const;

/**
 * Spawn confetti rain particles into the given container element.
 * Particles are driven entirely by CSS @keyframes after initial DOM injection.
 * All particles are removed after durationMs + CONFETTI_CLEANUP_GRACE_MS.
 *
 * @param container - Element with position:relative and overflow:hidden (pet-sprite-container)
 * @param durationMs - Celebration duration; particles removed after this + grace period
 */
function spawnConfettiRain(container: HTMLElement, durationMs: number): void {
  const { CONFETTI_COUNT, CONFETTI_CLEANUP_GRACE_MS } = CELEBRATION_OVERLAY_CONSTANTS;
  const particles: HTMLElement[] = [];

  for (let i = 0; i < CONFETTI_COUNT; i++) {
    const el = document.createElement('div');
    el.className = 'vp-confetti-particle';

    // CSS custom properties drive all per-particle variation
    el.style.setProperty('--color', CONFETTI_COLORS[i % CONFETTI_COLORS.length]);
    el.style.setProperty('--left', `${(i / CONFETTI_COUNT) * 100}%`);
    el.style.setProperty('--delay', `${-(Math.random() * 3)}s`);          // negative = already mid-fall
    el.style.setProperty('--duration', `${2.5 + Math.random() * 2}s`);   // 2.5–4.5s
    el.style.setProperty('--rot-z', `${Math.random() * 360}deg`);
    el.dataset.shape = CONFETTI_SHAPES[Math.floor(Math.random() * CONFETTI_SHAPES.length)];

    container.appendChild(el);
    particles.push(el);
  }

  window.setTimeout(() => {
    particles.forEach(p => p.remove());
  }, durationMs + CONFETTI_CLEANUP_GRACE_MS);
}
```

#### 3c. Script block — reactive trigger

Add a `prevState` tracker and reactive spawn trigger. Place this near the existing `$: showCelebration = state === 'celebration'` declaration (line 201):

```typescript
$: showCelebration = state === 'celebration';

// Spawn confetti exactly once when entering celebration state
let prevState: PetState = 'walking';
$: {
  if (state === 'celebration' && prevState !== 'celebration' && containerEl) {
    spawnConfettiRain(containerEl, CELEBRATION_OVERLAY_CONSTANTS.CELEBRATION_DURATION_MS);
  }
  prevState = state;
}
```

**Why `prevState` tracking instead of a simpler `$: if (showCelebration)`:**
Svelte re-runs reactive blocks whenever any referenced reactive value changes. Without tracking the previous state, the block could fire during re-renders that occur while already in `celebration` state. The `prevState` guard ensures exactly one `spawnConfettiRain` call per transition into `celebration`.

#### 3d. Template — replace fireworks overlay

**Remove** (lines 283–305):
```svelte
<!-- Celebration overlay - 3-firework display pattern -->
{#if showCelebration}
  <div class="celebration-overlay" aria-hidden="true">
    <img class="celebration-sprite celebration-sprite-center" src={fireworksSpritePath} alt="" />
    <img class="celebration-sprite celebration-sprite-left"   src={fireworksSpritePath} alt="" />
    <img class="celebration-sprite celebration-sprite-right"  src={fireworksSpritePath} alt="" />
  </div>
{/if}
```

**Nothing replaces it in the template** — confetti particles are injected directly into `containerEl` (`.pet-sprite-container`) by `spawnConfettiRain()`, which already has `position: relative` and `overflow: hidden`.

#### 3e. Style block — replace fireworks CSS

**Remove** (lines 431–489):
- `.celebration-overlay` ruleset
- `.celebration-sprite` ruleset
- `.celebration-sprite-center`, `.celebration-sprite-left`, `.celebration-sprite-right` rulesets
- `@keyframes fadeIn`

**Add** in their place:

```css
/* ── Confetti rain ─────────────────────────────────────────────── */

.vp-confetti-particle {
  position: absolute;
  top: -12px;
  left: var(--left);
  width: 8px;
  height: 10px;
  background-color: var(--color);
  border-radius: 1px;
  pointer-events: none;
  z-index: 20;
  animation: vp-confetti-fall var(--duration, 3s) var(--delay, 0s) linear infinite;
}

.vp-confetti-particle[data-shape="circle"] { width: 8px;  height: 8px;  border-radius: 50%; }
.vp-confetti-particle[data-shape="rect"]   { width: 12px; height: 5px;  border-radius: 1px; }
.vp-confetti-particle[data-shape="square"] { width: 8px;  height: 8px;  border-radius: 1px; }

/*
 * 3D sway pattern adapted from cssscript.com/confetti-animation/ (MIT).
 * Uses % for translateX (container-relative, not vw) so it works at
 * any sidebar width. translateY(115%) exits below the container edge;
 * overflow:hidden on pet-sprite-container clips it cleanly.
 */
@keyframes vp-confetti-fall {
  0%   { transform: rotateZ(var(--rot-z))                     rotateY(0deg)    translateX(0)    translateY(-12px); opacity: 1;   }
  25%  { transform: rotateZ(calc(var(--rot-z) + 90deg))       rotateY(360deg)  translateX(-5%)  translateY(25%);               }
  50%  { transform: rotateZ(calc(var(--rot-z) + 180deg))      rotateY(720deg)  translateX(5%)   translateY(55%);               }
  75%  { transform: rotateZ(calc(var(--rot-z) + 270deg))      rotateY(1080deg) translateX(-8%)  translateY(80%);               }
  100% { transform: rotateZ(calc(var(--rot-z) + 360deg))      rotateY(1440deg) translateX(8%)   translateY(115%); opacity: 0.3; }
}
```

---

### 4. `src/views/PetView.ts`

Find the section that passes `fireworksSpritePath` to `Pet.svelte` (approximately line 600–620) and remove it. The prop no longer exists on the component.

Search for: `fireworksSpritePath` in PetView.ts and delete the line.

---

### 5. `tests/mocks/Pet.svelte.ts`

Remove `fireworksSpritePath` from the mock's accepted props and any internal usage of it.

---

### 6. `tests/unit/components/Pet.svelte.test.ts`

#### 6a. Remove from `defaultProps` (line 27):
```typescript
fireworksSpritePath: 'assets/effects/fireworks.gif',  // delete this line
```

#### 6b. Rewrite the `celebration overlay` describe block (lines 215–288)

**Remove** these tests entirely:
- `should render 3 firework sprites during celebration state`
- `should show celebration overlay only during celebration state`
- `should clean up celebration overlay when component is destroyed`

**Replace with:**
```typescript
describe('celebration overlay', () => {
  it('should not render firework sprites during celebration state', () => {
    const component = new MockPetComponent({
      target: container,
      props: { ...defaultProps, state: 'celebration' }
    });

    // Old firework sprites are gone
    const fireworkSprites = container.querySelectorAll('.celebration-sprite');
    expect(fireworkSprites.length).toBe(0);
    expect(container.querySelector('.celebration-overlay')).toBeFalsy();

    component.$destroy();
  });

  it('should apply celebration data-state for CSS animation pause', () => {
    const component = new MockPetComponent({
      target: container,
      props: { ...defaultProps, state: 'celebration' }
    });

    const spriteContainer = container.querySelector('.pet-sprite-container');
    expect(spriteContainer?.getAttribute('data-state')).toBe('celebration');

    component.$destroy();
  });
});
```

> **Note on confetti particle tests:** `spawnConfettiRain()` uses `window.setTimeout` and appends DOM nodes to `containerEl`. In JSDOM (vitest environment), `containerEl.offsetWidth` is 0, which means `containerEl` may be null or zero-sized. The mock component does not invoke `onMount`, so `containerEl` is never set. Confetti spawn is therefore a **manual/visual test only** — no unit test for particle DOM injection. The existing `data-state` attribute test is sufficient to verify the state machine integration.

---

### 7. `tests/unit/asset-paths.test.ts`

Remove any assertion that references `EFFECT_SPRITES.FIREWORKS` or `fireworks.gif`. If `EFFECT_SPRITES` is deleted from the source, remove the entire `EFFECT_SPRITES` describe block from the test file.

---

### 8. Delete `assets/effects/fireworks.gif`

```bash
rm assets/effects/fireworks.gif
```

If `assets/effects/` becomes empty after deletion, remove the directory too.

---

## CSS Design Notes

### Why `animation-iteration-count: infinite` instead of `animation-iteration-count: 1`

Infinite-loop particles started with **negative `animation-delay`** appear to already be mid-fall when they're inserted into the DOM. This creates the illusion of a full curtain of rain from the very first frame — no build-up delay. The `window.setTimeout` cleanup removes all particles at once after `CELEBRATION_DURATION_MS + 500ms`, regardless of where they are in their loop.

### Why `%` for `translateX`, not `px` or `vw`

The sidebar panel is approximately 200–300px wide. `translateX(-5%)` of a 250px container = 12.5px of drift — visible but not excessive. Using `vw` on a 1920px monitor would give 96px drift, which would carry most particles off-screen. Using fixed `px` would need to be tuned per container size.

### Why `containerEl` directly instead of a `.celebration-overlay` child div

The `.celebration-overlay` div was only needed to group the three firework `<img>` elements. Confetti particles appended to `containerEl` directly get the same clipping behavior (`overflow: hidden`) and sit above the pet (`z-index: 20`) just as the old overlay did. One fewer DOM layer.

### `rotateY` for the flip tumble effect

`rotateY(1440deg)` over the course of a single fall produces 4 full flips on the Y axis, giving the "tumbling" effect that makes confetti look like paper rather than falling squares. This is the key visual differentiator between "a box falling" and "confetti."

---

## Visual Tuning Knobs (post-implementation)

After implementing, adjust these values in `celebration-constants.ts` or inline in the CSS for visual quality:

| Parameter | Location | Current | Effect of increasing |
|---|---|---|---|
| `CONFETTI_COUNT` | `celebration-constants.ts` | 35 | Denser rain |
| Negative delay range | `spawnConfettiRain()` | 0–3s | More particles appear mid-air on start |
| `--duration` range | `spawnConfettiRain()` | 2.5–4.5s | Slower fall with more spread |
| `translateX` max | `@keyframes` | 8% | Wider sway (risk: particles exit container) |
| Particle size | CSS shape rules | 8–12px | Larger = more visible, less fine |
| Color set | `CONFETTI_COLORS` | 6 colors | More variety vs. more cohesion |

---

## Success Criteria

1. `npm test` — 398 tests pass (no regressions)
2. `npm run build` — zero TypeScript errors
3. `fireworksSpritePath` does not appear anywhere in the codebase (grep clean)
4. `fireworks.gif` does not appear anywhere in the codebase (grep clean)
5. **Manual — Obsidian**: Trigger a celebration → confetti falls from the top of the pet panel, swaying and tumbling, for ~4.3 seconds, then clears
6. **Manual — rapid trigger**: Trigger two celebrations back-to-back → no particle accumulation (isCelebrating guard in CelebrationService prevents re-entry)
7. **Manual — narrow panel**: Resize sidebar to minimum width → confetti stays within the panel boundary (no overflow outside the container)

---

## Key Files Reference

| File | Lines | Purpose |
|---|---|---|
| `src/components/Pet.svelte` | 1–491 | Primary change target |
| `src/utils/celebration-constants.ts` | 31–77 | `CELEBRATION_OVERLAY_CONSTANTS` |
| `src/utils/asset-paths.ts` | 20–26 | `EFFECT_SPRITES` |
| `src/views/PetView.ts` | ~600–620 | `fireworksSpritePath` prop pass |
| `src/pet/PetStateMachine.ts` | 35–38 | `celebration.duration` — do not change |
| `src/celebrations/CelebrationService.ts` | ~496 | `isCelebrating` guard — do not change |
| `tests/unit/components/Pet.svelte.test.ts` | 215–288 | `celebration overlay` block |
| `tests/mocks/Pet.svelte.ts` | — | Mock prop list |
| `tests/unit/asset-paths.test.ts` | — | FIREWORKS assertion |

---

*Version: 1.0 — 2026-03-03*
