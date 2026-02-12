# Phase 1A: Core First Scene - Implementation Plan

**Created**: 2026-02-12
**Status**: Planning Complete - Ready for Implementation
**Estimated Time**: 6-8 hours development + 18 hours testing = **24-26 hours total**

---

## Executive Summary

### Objective
Build the foundational garden scene architecture by creating Garden.svelte (background) and PetPanel.svelte (orchestrator) components, integrating them with the existing Pet.svelte component.

### Deliverable
A visually cohesive garden scene with:
- Animated pet character moving within a styled garden background
- Responsive layout adapting to sidebar width (250px-600px+)
- Dark mode compatibility
- Maintained 60 FPS performance target

### Success Metrics
- ✅ All 124 new tests passing
- ✅ 95%+ code coverage on new components
- ✅ 60 FPS maintained during animations
- ✅ <30KB bundle size increase
- ✅ Background asset <100KB
- ✅ Zero regressions on existing Pet.svelte functionality

---

## Architecture Overview

### Component Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│ PetView.ts (Obsidian ItemView)                         │
│ - Asset path validation & loading                      │
│ - State machine ownership                              │
│ - Plugin settings injection                            │
└────────────┬────────────────────────────────────────────┘
             │ mounts
             ▼
┌─────────────────────────────────────────────────────────┐
│ PetPanel.svelte (NEW - Orchestrator)                    │
│ - Coordinates Garden + Pet                             │
│ - Z-index stacking (Garden: 1, Pet: 2)                 │
│ - Forwards props & events                              │
└────────────┬────────────────────────────────────────────┘
             ├─────────────────┬───────────────────────────┐
             ▼                 ▼                           ▼
   ┌──────────────────┐ ┌──────────────┐    ┌──────────────────┐
   │ Garden.svelte    │ │ Pet.svelte   │    │ Future layers:   │
   │ (NEW)            │ │ (existing)   │    │ - Accessories    │
   │ - Background img │ │ - Movement   │    │ - Chat UI        │
   │ - Theme detect   │ │ - Animations │    │ - Overlays       │
   │ - Responsive     │ │ - Interaction│    └──────────────────┘
   └──────────────────┘ └──────────────┘
```

**Rationale**: Container-Orchestrator pattern keeps PetView focused on Obsidian integration while PetPanel centralizes scene composition logic, making future features (accessories, chat) easy to add.

---

## Detailed Requirements

### 1. Garden.svelte Component (NEW)

**Purpose**: Background rendering layer with theme-aware styling

**Props Interface**:
```typescript
export let backgroundPath: string; // Path to background image
export let theme: 'light' | 'dark' | 'auto' = 'auto'; // Theme override
```

**Responsibilities**:
- Render background image via CSS `background-image`
- Detect Obsidian theme (light/dark) using MutationObserver
- Apply theme-appropriate filters (dark mode: brightness 0.8)
- Provide slot for child content (Pet)
- Handle missing/failed background assets gracefully

**Technical Specifications**:
- **Position**: Absolute (top: 0, left: 0, width/height: 100%)
- **Z-index**: 1 (below Pet layer)
- **Background sizing**: `cover` (fills container without distortion)
- **Background position**: `center center`
- **Fallback**: `var(--background-secondary)` if image fails
- **Pointer events**: `none` (non-interactive)

**Responsive Behavior**:
- **Standard** (300-600px): `background-size: cover`, `center center`
- **Mobile** (<768px): `background-position: center bottom` (show ground)
- **Ultrawide** (>21:9 ratio): `background-size: contain` (prevent stretching)
- **Narrow** (<4:5 ratio): `background-size: auto 100%` (crop sides)

**Asset Requirements**:
- **Dimensions**: 800×600px (4:3 aspect ratio)
- **Format**: WebP preferred (~40KB), PNG acceptable
- **Light mode**: Soft blue sky (#87CEEB), fresh grass (#7CB342)
- **Dark mode**: Deep navy (#1A237E), muted sage (#558B2F)
- **Location**: `d:\vault-pal\assets\backgrounds\spring-light.webp`

**Files**:
- `d:\vault-pal\src\components\Garden.svelte` (new)
- `d:\vault-pal\assets\backgrounds\spring-light.webp` (new asset)

---

### 2. PetPanel.svelte Component (NEW)

**Purpose**: Scene orchestrator coordinating Garden and Pet components

**Props Interface**:
```typescript
export let state: PetState; // From PetStateMachine
export let spriteSheetPath: string; // Validated by PetView
export let heartSpritePath: string; // Validated by PetView
export let gardenBackgroundPath: string; // NEW - Validated by PetView
export let petName: string = 'Kit'; // From settings
export let movementSpeed: number = 50; // From settings
```

**Events**:
```typescript
dispatch('pet', { returnToState: PetState }); // Forwards from Pet
```

**Responsibilities**:
- Mount Garden.svelte as background layer (z-index: 1)
- Mount Pet.svelte as foreground layer (z-index: 2)
- Forward props from PetView to child components
- Bubble pet interaction events to PetView
- Establish stacking context for z-index layering

**Technical Specifications**:
- **Container**: Relative positioning, 100% width/height
- **Overflow**: Hidden (contain pet within scene)
- **No padding/margin**: Handled by child layers
- **Event forwarding**: Use Svelte `on:pet` forwarding

**Files**:
- `d:\vault-pal\src\components\PetPanel.svelte` (new)

---

### 3. PetView.ts Integration (MODIFIED)

**Changes Required**:

#### A. Add getGardenBackgroundPath() method
```typescript
/**
 * Get the path to the garden background asset
 * @returns The resource path to the garden background
 */
private getGardenBackgroundPath(): string {
  return this.getAssetPath('spring-light.webp');
}
```

#### B. Update onOpen() to mount PetPanel
```typescript
// BEFORE:
this.petComponent = new PetComponent({
  target: this.containerDiv,
  props: { state, spriteSheetPath, heartSpritePath, petName, movementSpeed },
});

// AFTER:
this.petComponent = new PetPanelComponent({
  target: this.containerDiv,
  props: {
    state,
    spriteSheetPath,
    heartSpritePath,
    gardenBackgroundPath: this.getGardenBackgroundPath(), // NEW
    petName,
    movementSpeed,
  },
});
```

#### C. Update import
```typescript
// BEFORE:
import PetComponent from '../components/Pet.svelte';

// AFTER:
import PetPanelComponent from '../components/PetPanel.svelte';
```

**Files**:
- `d:\vault-pal\src\views\PetView.ts` (modified)

---

### 4. Pet.svelte Modifications (MINIMAL)

**Changes Required**:

#### Update .pet-sprite-container positioning
```css
/* BEFORE: */
.pet-sprite-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  width: 100%;
  height: 100%;
  position: relative; /* OLD */
  overflow: hidden;
}

/* AFTER: */
.pet-sprite-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  width: 100%;
  height: 100%;
  position: absolute; /* NEW - layer above Garden */
  top: 0;
  left: 0;
  z-index: 2; /* NEW - explicit layering */
  overflow: hidden;
  pointer-events: none; /* NEW - only pet sprite is interactive */
}

/* Re-enable clicks on pet sprite */
.pet-sprite-wrapper {
  position: relative;
  transition: transform 0.1s ease;
  outline: none;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  pointer-events: auto; /* NEW - restore interactivity */
}
```

**Files**:
- `d:\vault-pal\src\components\Pet.svelte` (modified)

---

### 5. Global Styles (MINIMAL)

**Changes Required**:

Update `.obsidian-pets-container` in `styles.css`:

```css
/* BEFORE: */
.obsidian-pets-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

/* AFTER: */
.obsidian-pets-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0; /* NEW - no padding, handled by layers */
  position: relative; /* NEW - establish stacking context */
  overflow: hidden; /* NEW - prevent background overflow */
}
```

**Files**:
- `d:\vault-pal\styles.css` (modified)

---

## Implementation Steps

### Step 1: Create Garden.svelte Component (3 hours)

**Tasks**:
1. Create `d:\vault-pal\src\components\Garden.svelte`
2. Implement background rendering with CSS `background-image`
3. Add theme detection via MutationObserver
4. Implement responsive background sizing (media queries)
5. Add error handling for missing/failed images
6. Write 28 unit tests (see Testing Strategy)

**Acceptance Criteria**:
- [ ] Background image displays correctly
- [ ] Theme detection works (light/dark)
- [ ] Fallback color shows on image failure
- [ ] Responsive sizing at 300px, 500px, 800px widths
- [ ] All unit tests passing

---

### Step 2: Create PetPanel.svelte Component (2 hours)

**Tasks**:
1. Create `d:\vault-pal\src\components\PetPanel.svelte`
2. Import Garden and Pet components
3. Define props interface (TypeScript)
4. Implement event forwarding (pet events bubble to PetView)
5. Set up z-index stacking (Garden: 1, Pet: 2)
6. Write 30 unit tests (see Testing Strategy)

**Acceptance Criteria**:
- [ ] Garden renders as background
- [ ] Pet renders as foreground
- [ ] Props forward correctly to children
- [ ] Pet events bubble to PetView
- [ ] Z-index layering verified
- [ ] All unit tests passing

---

### Step 3: Acquire Background Asset (1 hour)

**Tasks**:
1. Purchase or create placeholder garden background
2. Optimize asset (target: <50KB WebP)
3. Place in `d:\vault-pal\assets\backgrounds\spring-light.webp`
4. Verify dimensions (800×600px, 4:3 ratio)
5. Test loading in Garden.svelte

**Asset Sources**:
- Kenney.nl (free game assets, CC0 license)
- itch.io (search "pixel art garden background")
- OpenGameArt.org (search "garden scene")
- Commission from Fiverr/Upwork

**Acceptance Criteria**:
- [ ] Asset <100KB (preferably <50KB)
- [ ] Dimensions 800×600px (4:3 ratio)
- [ ] Pixel art style matches pet sprite
- [ ] Works in both light and dark themes
- [ ] Licensed for commercial use

---

### Step 4: Update PetView.ts Integration (1 hour)

**Tasks**:
1. Add `getGardenBackgroundPath()` method
2. Update `onOpen()` to mount PetPanel instead of Pet
3. Update import statement
4. Test asset path validation
5. Verify backward compatibility (existing tests still pass)

**Acceptance Criteria**:
- [ ] PetPanel mounts successfully
- [ ] Background path resolves correctly
- [ ] Pet interactions still work
- [ ] State machine integration intact
- [ ] All existing tests passing (213 tests)

---

### Step 5: Update Pet.svelte Positioning (0.5 hours)

**Tasks**:
1. Change `.pet-sprite-container` to `position: absolute`
2. Add `z-index: 2`
3. Add `pointer-events: none` to container
4. Add `pointer-events: auto` to `.pet-sprite-wrapper`
5. Test pet interactivity

**Acceptance Criteria**:
- [ ] Pet layers above Garden
- [ ] Pet remains clickable/tappable
- [ ] Pet movement unchanged
- [ ] No visual regressions

---

### Step 6: Update Global Styles (0.5 hours)

**Tasks**:
1. Remove padding from `.obsidian-pets-container`
2. Add `position: relative`
3. Add `overflow: hidden`
4. Test layout at different sidebar widths

**Acceptance Criteria**:
- [ ] Container establishes stacking context
- [ ] No padding interferes with Garden
- [ ] Overflow prevents background overflow

---

### Step 7: Write Tests (18 hours - parallel with dev)

**Test Suites**:
1. **Garden.svelte unit tests** (4h, 28 tests)
   - Basic rendering (6 tests)
   - Asset loading (8 tests)
   - Dark mode (4 tests)
   - Responsive (7 tests)
   - Slot content (3 tests)

2. **PetPanel.svelte unit tests** (5h, 30 tests)
   - Component composition (8 tests)
   - State management (6 tests)
   - Event handling (5 tests)
   - Props validation (7 tests)
   - Lifecycle (4 tests)

3. **Integration tests** (3h, 15 tests)
   - Full hierarchy (PetView → PetPanel → Garden + Pet)
   - State transitions
   - Responsive behavior

4. **Performance tests** (4h, 11 tests)
   - FPS measurement
   - Memory profiling
   - Render time benchmarks

5. **Visual validation** (2h, 16 checks)
   - Manual testing across browsers
   - Light/dark theme validation
   - Responsive layout checks

**Acceptance Criteria**:
- [ ] All 124 tests passing
- [ ] 95%+ code coverage
- [ ] Performance benchmarks met (60 FPS)
- [ ] Visual regression checklist complete

---

### Step 8: Manual Testing & QA (1 hour)

**Test Scenarios**:
1. Load plugin in Obsidian (dev build)
2. Verify Garden background displays
3. Test pet interactions (click, keyboard, touch)
4. Resize sidebar (narrow → wide → narrow)
5. Switch theme (light → dark → light)
6. Test on mobile (if possible)
7. Profile with Chrome DevTools (verify 60 FPS)

**Acceptance Criteria**:
- [ ] No visual glitches
- [ ] Smooth 60 FPS animations
- [ ] Pet interactive in all states
- [ ] Responsive at all widths
- [ ] No console errors

---

## Technical Recommendations

### Recommendation 1: Use Container-Orchestrator Pattern ✅

**Approach**: PetPanel coordinates Garden and Pet as siblings

**Rationale**:
- **Clean separation**: PetView handles Obsidian API, PetPanel handles scene
- **Future-proof**: Easy to add accessories, chat UI, seasonal swapping
- **Testable**: Each component can be unit tested in isolation
- **Minimal refactoring**: Pet.svelte mostly unchanged

**Alternatives Considered**:
- ❌ Garden as container → Pet: Tight coupling, hard to add UI overlays
- ❌ PetView manages layers: Mixes concerns, harder to test

**Decision**: Use PetPanel orchestrator (chosen approach)

---

### Recommendation 2: Absolute Positioning for Pet Layer ✅

**Approach**: Pet.svelte uses `position: absolute` with `z-index: 2`

**Rationale**:
- **Proper layering**: Garden fills entire container, Pet layers on top
- **Preserved movement**: Existing ResizeObserver logic unchanged
- **Pointer events**: Background non-interactive, pet interactive
- **Clean overlap**: No layout shifts or reflows

**Alternatives Considered**:
- ❌ Relative positioning: Garden can't fill container properly
- ❌ Flex layout: Complicated z-index stacking, layout shifts

**Decision**: Absolute positioning with z-index (chosen approach)

---

### Recommendation 3: Component-Scoped Styles ✅

**Approach**: Garden and PetPanel use `<style>` blocks (Svelte scoping)

**Rationale**:
- **Automatic scoping**: Prevents conflicts with Obsidian themes
- **Clear ownership**: Each component owns its visual presentation
- **Easier maintenance**: Styles colocated with component logic
- **No global pollution**: Doesn't interfere with existing styles.css

**Alternatives Considered**:
- ❌ Global styles.css: Risk of conflicts, harder to debug
- ❌ CSS modules: Unnecessary complexity for Svelte

**Decision**: Scoped styles (Svelte default, chosen approach)

---

### Recommendation 4: Theme-Aware Background with Separate Assets ✅

**Approach**: Two background assets (light/dark), CSS filter for fine-tuning

**Rationale**:
- **Proper contrast**: Separate assets allow curated lighting per theme
- **Better quality**: Avoids muddy colors from aggressive CSS filters
- **Auto-switching**: MutationObserver detects Obsidian theme changes
- **Graceful fallback**: Single asset works if dark version missing

**Alternatives Considered**:
- ❌ CSS filter only: Can make colors muddy, limited control
- ❌ No theme support: Looks bad in dark mode

**Decision**: Separate assets + optional filter (chosen approach)

---

### Recommendation 5: WebP Format for Background Assets ✅

**Approach**: Use WebP format (~40KB) instead of PNG (~80KB)

**Rationale**:
- **Smaller bundle**: 50% size reduction vs PNG
- **Better compression**: Maintains quality at lower file sizes
- **Browser support**: Electron (Obsidian) fully supports WebP
- **Future-proof**: Industry standard for web graphics

**Alternatives Considered**:
- ❌ PNG: Larger file size, no advantages
- ❌ JPEG: No transparency support, worse for pixel art
- ❌ SVG: Not suitable for complex garden scenes

**Decision**: WebP format (chosen approach)

---

## Risk Assessment

### High-Risk Areas

#### Risk 1: Event Bubbling Breaks
- **Likelihood**: Medium
- **Impact**: High (petting stops working)
- **Mitigation**:
  - 5 dedicated event tests
  - Integration tests for full event flow
  - Manual validation before merge
- **Contingency**: Add explicit event forwarding in PetPanel

#### Risk 2: Responsive Resize Issues
- **Likelihood**: Medium
- **Impact**: High (pet clips or doesn't reach edges)
- **Mitigation**:
  - 7 resize tests
  - Performance test for debounce
  - Manual testing at various widths
- **Contingency**: Adjust CSS media queries, add min/max constraints

### Medium-Risk Areas

#### Risk 3: Asset Path Resolution Fails
- **Likelihood**: Low
- **Impact**: Medium (blank container)
- **Mitigation**:
  - Reuse existing getAssetPath() validation
  - 8 asset loading tests with fallbacks
  - Test on Windows, Mac, Linux
- **Contingency**: Hard-code fallback path for testing

#### Risk 4: Performance Degradation
- **Likelihood**: Low
- **Impact**: High (janky animations)
- **Mitigation**:
  - 11 performance tests
  - Chrome DevTools profiling
  - CSS containment optimizations
- **Contingency**: Remove background rendering if FPS drops

### Low-Risk Areas

#### Risk 5: Dark Mode Incompatibility
- **Likelihood**: Low
- **Impact**: Medium (looks bad in dark theme)
- **Mitigation**:
  - 4 dark mode tests
  - Visual validation checklist
  - Test with community themes
- **Contingency**: Adjust CSS filters, use separate dark asset

---

## Performance Targets

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| **Frame Rate** | 60 FPS | 55 FPS |
| **Component Mount Time** | <100ms | <200ms |
| **State Update Time** | <16ms (1 frame) | <33ms (2 frames) |
| **Background Image Load** | <500ms | <1000ms |
| **Memory Growth** (1000 transitions) | <5MB | <10MB |
| **CPU Usage** (idle with animation) | <0.5% | <2% |
| **Bundle Size Increase** | <15KB | <30KB |

**Measurement Tools**:
- Chrome DevTools Performance tab
- `performance.mark()` and `performance.measure()`
- `performance.memory` (heap size)
- Vitest benchmarks

---

## Testing Strategy Summary

### Test Distribution

```
Total: 124 tests
├── Unit Tests: 82 tests (66%)
│   ├── Garden.svelte: 28 tests
│   ├── PetPanel.svelte: 30 tests
│   ├── Pet.svelte (additions): 4 tests
│   └── Edge cases: 20 tests
│
├── Integration Tests: 15 tests (12%)
│   └── PetView → PetPanel → Garden + Pet
│
├── Performance Tests: 11 tests (9%)
│   ├── FPS: 5 tests
│   ├── Memory: 3 tests
│   └── Render time: 3 tests
│
└── Visual Validation: 16 manual checks (13%)
```

### Coverage Goals

- **Critical paths**: 100% (state flow, events, asset validation)
- **High priority**: 95% (rendering, props, errors)
- **Medium priority**: 85% (dark mode, animations)
- **Low priority**: 70% (debug logs, dev-only code)

---

## Timeline & Effort Estimates

### Development Tasks (8 hours)

| Task | Estimated Time |
|------|----------------|
| Garden.svelte component | 3h |
| PetPanel.svelte component | 2h |
| Background asset acquisition | 1h |
| PetView.ts integration | 1h |
| Pet.svelte positioning updates | 0.5h |
| Global styles updates | 0.5h |

**Total Development: 8 hours**

### Testing Tasks (18 hours)

| Task | Estimated Time |
|------|----------------|
| Garden.svelte unit tests | 4h |
| PetPanel.svelte unit tests | 5h |
| Integration tests | 3h |
| Performance tests | 4h |
| Visual validation | 2h |

**Total Testing: 18 hours**

### Total Phase 1A Effort: 26 hours

**Breakdown**:
- Week 1: Development (8 hours)
- Week 2: Testing & QA (18 hours)

---

## Definition of Done

### Development Checklist
- [ ] Garden.svelte created with theme detection
- [ ] PetPanel.svelte created with props forwarding
- [ ] Placeholder background asset acquired and optimized
- [ ] PetView.ts updated to mount PetPanel
- [ ] Pet.svelte positioning updated (absolute + z-index)
- [ ] Global styles updated (remove padding, add position)
- [ ] All code compiles (TypeScript strict mode)
- [ ] No linting errors

### Testing Checklist
- [ ] 82 unit tests passing
- [ ] 15 integration tests passing
- [ ] 11 performance tests passing
- [ ] 16 visual validation checks complete
- [ ] 95%+ code coverage on new components
- [ ] 100% coverage on critical paths
- [ ] All existing 213 tests still passing

### Quality Checklist
- [ ] 60 FPS maintained during animations
- [ ] <30KB bundle size increase
- [ ] Background asset <100KB
- [ ] No memory leaks detected
- [ ] No console errors
- [ ] Works in light and dark themes
- [ ] Responsive at 250px, 300px, 500px, 800px widths

### Documentation Checklist
- [ ] Inline code comments for complex logic
- [ ] JSDoc for public component props
- [ ] Update docs/TECHNICAL_ARCHITECTURE.md
- [ ] Create CHANGELOG.md entry for Phase 1A
- [ ] Document background asset source and license

---

## Files Created/Modified

### New Files (3 files)
- `d:\vault-pal\src\components\Garden.svelte`
- `d:\vault-pal\src\components\PetPanel.svelte`
- `d:\vault-pal\assets\backgrounds\spring-light.webp`

### Modified Files (3 files)
- `d:\vault-pal\src\views\PetView.ts` (mount PetPanel, add getGardenBackgroundPath)
- `d:\vault-pal\src\components\Pet.svelte` (absolute positioning, z-index)
- `d:\vault-pal\styles.css` (remove padding from container)

### Test Files (5 files)
- `d:\vault-pal\tests\unit\components\Garden.svelte.test.ts` (new)
- `d:\vault-pal\tests\unit\components\PetPanel.svelte.test.ts` (new)
- `d:\vault-pal\tests\integration\Phase1A.test.ts` (new)
- `d:\vault-pal\tests\performance\Phase1A.perf.test.ts` (new)
- `d:\vault-pal\tests\VISUAL_TESTING_PHASE1A.md` (new)

---

## Next Steps

1. **Review this plan** with stakeholders - confirm approach
2. **Acquire background asset** (longest lead time: 1 hour)
3. **Create Garden.svelte** (3 hours dev + 4 hours tests)
4. **Create PetPanel.svelte** (2 hours dev + 5 hours tests)
5. **Integrate with PetView** (1 hour dev + 3 hours integration tests)
6. **Performance validation** (4 hours)
7. **Visual QA** (2 hours)
8. **Merge to main** (after all 124 tests passing)

---

## Appendix: Agent Analysis Links

- **Product Manager Analysis**: Requirements, user stories, acceptance criteria
- **Software Engineer Analysis**: Architecture design, component hierarchy, technical specs
- **UX Designer Analysis**: Visual specifications, layout design, asset requirements
- **QA Engineer Analysis**: Comprehensive testing strategy, 124 test cases

---

**End of Implementation Plan**
