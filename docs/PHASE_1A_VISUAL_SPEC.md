# Phase 1A: Core First Scene - Visual Design Specification

**Project**: Vault Pal (Obsidian Pets)
**Phase**: 1A - Core First Scene
**Date**: 2026-02-12
**Designer**: UX/Visual Design Specifications
**Status**: Ready for Implementation

---

## Executive Summary

This document defines the visual specifications for the first garden scene in Vault Pal, a delightful Obsidian plugin featuring an animated pet companion. The design balances charm with functionality, optimizing for Obsidian's sidebar constraints (typically 300-400px wide) while supporting dark mode and ensuring the pet's 64x64px sprite remains the focal point.

**Design Philosophy**: "A plugin you feel, not think about" - subtle, ambient, and non-intrusive.

---

## 1. Background Asset Specifications

### 1.1 Dimensions and Aspect Ratio

**Current Implementation**: 128x128px tileable image (horizontal repeat only)

**Implemented Canvas Size**: 128px × 128px (1:1 aspect ratio, tileable)

**Implementation Details**:
- **Tiling**: Horizontal repeat (background-repeat: repeat-x)
- **No scaling**: background-size: auto auto (natural 128x128px dimensions)
- **Positioning**: bottom center (anchored to bottom edge)
- **Pet alignment**: bottom: 64px (center of 128px tile)

**Original Design Spec**: 800px × 600px (4:3 aspect ratio)

**Original Rationale**:
- **Width**: 800px provides sufficient detail when scaled down to sidebar widths (300-400px)
- **Height**: 600px maintains proper vertical composition without excessive letterboxing
- **Aspect Ratio**: 4:3 portrait-leaning provides vertical space for pet ground positioning while avoiding extreme portrait ratios that would waste horizontal space
- **Scaling**: CSS `background-size: cover` ensures the background fills the container while maintaining aspect ratio

**Why Implementation Differs**: Tiling system provides seamless horizontal repeat with smaller file size and no scaling distortion

**Responsive Behavior**:
- Container will be **100% width × 100% height** of the sidebar panel
- Background will scale proportionally using `background-size: cover`
- `background-position: center` ensures focal elements (horizon, ground plane) remain visible at all viewport sizes

**File Format**: WebP (modern, excellent compression)
- Target file size: 30-50KB per image
- Fallback: PNG (for older browsers, if needed)

---

### 1.2 Visual Style

**Current Implementation**: **Horizontal tiling background system**
- Background image: 128x128px tileable image
- Tiling: Horizontal only (background-repeat: repeat-x)
- No scaling: background-size: auto auto (maintains natural dimensions)
- Positioning: bottom center (anchored to bottom edge)
- Above-background fill: #f5f3ef (light neutral color)

**Original Design Spec**: **Soft pixel art with painted textures**

**Characteristics**:
- **Pixel art foundation**: Complements the 64x64px pet sprite's pixelated aesthetic
- **Soft edges**: Subtle anti-aliasing to reduce harshness (not strict 1:1 pixel art)
- **Painterly textures**: Add depth without overwhelming the minimalist design
- **Low detail density**: Avoid visual clutter that would compete with the pet
- **Calm color palette**: Soothing, not overly saturated

**Inspiration References**:
- Stardew Valley (soft pixel art with depth)
- Animal Crossing (gentle, welcoming environments)
- Unpacking (minimalist scene composition)

**Why This Style?**:
- Matches the existing pet sprite's pixel art aesthetic
- Scales well to small sidebar widths
- Reads clearly at low resolutions
- Feels warm and approachable (aligns with "delightful moments" vision)

---

### 1.3 Color Palette

**Base Palette** (placeholder season - Spring):

| Element | Color (Light Mode) | Color (Dark Mode) | Hex (Light) | Hex (Dark) |
|---------|-------------------|------------------|-------------|-----------|
| **Sky** | Soft blue | Deep navy-blue | `#A8D5E2` | `#1A2332` |
| **Ground (top)** | Fresh grass green | Muted sage | `#7BC67E` | `#3A5240` |
| **Ground (bottom)** | Earthy green-brown | Deep forest green | `#5A8C5E` | `#2A3B2E` |
| **Horizon fog** | Pale blue-white | Midnight blue | `#D4E8F0` | `#2B3A47` |
| **Accent (flowers/details)** | Warm coral, soft yellow | Muted amber, lavender | `#F59E6C`, `#F9D87A` | `#8B6F47`, `#7A6B8A` |

**Dark Mode Considerations**:
- **Contrast requirements**: Ensure 4.5:1 contrast ratio between ground and sky for visual separation
- **Color shift strategy**: Desaturate and darken all colors (reduce saturation by 30-40%, reduce lightness by 40-50%)
- **Obsidian theme integration**: Use CSS custom properties to detect theme:
  ```css
  body.theme-light .garden-scene { background-image: url('spring-light.webp'); }
  body.theme-dark .garden-scene { background-image: url('spring-dark.webp'); }
  ```
- **Alternative approach**: Single image with reduced contrast/saturation that works in both modes (less ideal but simpler)

**Accessibility**:
- Avoid pure red/green combinations (colorblind-friendly)
- Maintain clear visual hierarchy (sky → horizon → ground)

---

### 1.4 Composition Layout

**Vertical Layout** (800px × 600px canvas):

```
┌─────────────────────────────────────┐  0px
│           SKY (Top 40%)             │
│     Gradient: light at top          │
│     → slightly darker at horizon    │  ← ~240px
├─────────────────────────────────────┤
│       HORIZON LINE (5%)             │  ← Soft transition zone
├─────────────────────────────────────┤  ~270px
│                                     │
│        GROUND (Bottom 55%)          │
│                                     │
│  ┌──────────────────────────────┐  │  ← Pet ground level: 420px (70% from top)
│  │  Pet walkable area (64px)    │  │
│  └──────────────────────────────┘  │
│                                     │
│    Subtle grass texture             │
│    Optional: Small flowers          │
└─────────────────────────────────────┘  600px
```

**Key Measurements**:
- **Sky zone**: 0-240px (40%)
- **Horizon transition**: 240-270px (5%)
- **Ground zone**: 270-600px (55%)
- **Pet ground level**: 420px from top (70% down) - this is where the pet's feet should align

**Horizon Line**:
- **Position**: 45% from top (slight offset from true center for visual balance)
- **Style**: Soft gradient fade (not a hard line)
- **Width**: Full canvas width
- **Purpose**: Provides depth and separates sky from ground

**Ground Plane**:
- **Perspective**: Subtle (minimal foreshortening to keep pet scale consistent)
- **Texture**: Light grass texture with small wildflowers (not dense)
- **Focal area**: Keep the center 80% relatively clear for pet movement
- **Edge decoration**: Flowers/rocks can be denser near edges (outside pet's path)

---

### 1.5 Scene Elements

**Placeholder Background (Spring)**:

**Required Elements**:
1. **Sky** (gradient, cloudless for simplicity)
2. **Ground** (grass texture)
3. **Horizon line** (soft transition)

**Optional Elements** (for visual interest):
- **Foreground**: 2-3 small flowers (left and right edges only)
- **Background**: Distant trees/hills (at horizon, low detail)
- **Ambient detail**: Subtle path or lighter grass strip suggesting pet's walking route

**Excluded Elements** (Phase 2+ only):
- Fountain (not needed for placeholder)
- Cart (not needed for placeholder)
- Seasonal decorations (spring is default, no seasonal swapping yet)

**Asset Naming**:
- `spring-light.webp` (light mode)
- `spring-dark.webp` (dark mode)

---

## 2. Layout Design

### 2.1 Container Structure

**HTML/CSS Hierarchy**:
```html
<div class="pet-view-container">                    <!-- PetView.ts renders this -->
  <div class="garden-scene">                        <!-- Garden.svelte -->
    <div class="pet-sprite-container">              <!-- Pet.svelte -->
      <div class="pet-position-wrapper">
        <div class="pet-flip-wrapper">
          <div class="pet-sprite-wrapper">
            <div class="pet-sprite"></div>           <!-- 64x64px sprite -->
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

**CSS Architecture**:
```css
/* Garden container fills parent (PetView) */
.garden-scene {
  width: 100%;
  height: 100%;
  background-image: url('backgrounds/spring-light.webp');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  overflow: hidden; /* Contain pet within scene */
}

/* Pet container positions pet at ground level */
.pet-sprite-container {
  width: 100%;
  height: 100%;
  position: relative;
}

/* Pet absolute positioning (see section 2.2) */
.pet-position-wrapper {
  position: absolute;
  top: 70%; /* Aligns with ground level (420px on 600px canvas) */
  left: 0;
  margin-top: -32px; /* Offset half pet height for precise ground alignment */
}
```

---

### 2.2 Pet Vertical Positioning

**Ground Level Calculation**:

**Design Intent**:
- Pet's **feet** should align with the ground plane at 70% from the top of the canvas
- On an 800×600px background, this is 420px from top
- Pet sprite is 64px tall, so feet are at the bottom of the sprite

**CSS Implementation** (already exists in Pet.svelte):
```css
.pet-position-wrapper {
  position: absolute;
  top: 70%; /* Percentage-based for responsive scaling */
  left: 0;
  margin-top: -32px; /* Subtract half of pet height (64px / 2) for vertical centering */
}
```

**Why 70% (not 50%)**:
- 50% would center the pet vertically, placing it in the horizon zone (looks like it's floating)
- 70% places the pet's feet on the ground plane with appropriate sky/space above
- Provides visual hierarchy: sky (large, airy) → pet (focal point) → ground (anchored)

**Responsive Behavior**:
- As container resizes, `top: 70%` maintains proportional positioning
- Pet always stays at ground level regardless of sidebar width/height
- Background scales with `background-size: cover`, keeping horizon at ~45%

---

### 2.3 Horizontal Movement

**Movement Range**:
- Pet walks edge-to-edge horizontally (already implemented)
- Movement range: `0px` to `containerWidth - 64px`
- Direction flip at edges: `scaleX(-1)` for leftward movement

**Visual Consideration**:
- Background should not have critical elements at extreme left/right edges where pet walks
- Keep decorative elements (flowers, rocks) within 10% margins from edges

**Current Implementation** (from Pet.svelte):
```css
@keyframes move-back-and-forth {
  0% { left: 0px; }
  50% { left: var(--max-left, calc(100% - 64px)); }
  100% { left: 0px; }
}
```

**Design Constraint**:
- Background artwork must account for pet's full horizontal range
- Avoid placing tall vertical elements (trees, posts) in the middle 80% of the canvas

---

### 2.4 Depth and Overlap

**Z-Index Layering**:
```
├─ Background image (z-index: 0) - Garden.svelte
├─ Pet sprite (z-index: 5) - Pet.svelte
└─ Heart overlay (z-index: 10) - Pet.svelte (petting state)
```

**Overlap Strategy**:
- Pet is **always in front** of the background (no foreground elements in Phase 1A)
- Future phases may add foreground grass/flowers that overlap pet (z-index: 7)

**Shadow/Grounding** (optional enhancement):
- Add subtle drop shadow under pet sprite for depth:
  ```css
  .pet-sprite {
    filter: drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.15));
  }
  ```
- Shadow should be soft and barely visible (not harsh)

---

## 3. Responsive Strategy

### 3.1 Scaling Behavior

**Container Constraints**:
- **Minimum width**: 250px (narrow phone screens)
- **Typical width**: 300-400px (Obsidian sidebar)
- **Maximum width**: 600px (wide desktop sidebar)
- **Height**: Variable (depends on panel height, typically 400-800px)

**Background Scaling**:
```css
.garden-scene {
  background-size: cover; /* Maintains aspect ratio, fills container */
  background-position: center; /* Keeps horizon/ground visible */
}
```

**Scaling Strategy**:
- **Width < 300px**: Background zooms in slightly, but horizon stays at ~45% vertically
- **Width 300-600px**: Optimal viewing range, full scene visible
- **Width > 600px**: Background scales up but pet remains 64px (intentional size contrast for charm)

**Pet Size Considerations**:
- Pet sprite is **fixed at 64x64px** (does not scale with container)
- Rationale: Pixel art loses clarity when scaled; fixed size maintains crisp rendering
- At 300px width, pet is ~21% of width (appropriate focal point size)
- At 600px width, pet is ~11% of width (still clearly visible)

---

### 3.2 Minimum and Maximum Dimensions

**Minimum Container Size**:
- **Width**: 250px (below this, truncate with message: "Resize panel for best experience")
- **Height**: 200px (minimum viable height for scene)

**Maximum Container Size**:
- **Width**: No hard limit (background scales gracefully)
- **Height**: No hard limit (vertical center anchoring keeps pet grounded)

**Obsidian Sidebar Behavior**:
- Right sidebar can be resized by user (typical range: 300-500px)
- Plugin should gracefully handle all sizes within this range
- Use CSS media queries for ultra-narrow fallback (< 280px):
  ```css
  @media (max-width: 280px) {
    .garden-scene {
      background-position: center top; /* Prioritize sky/horizon */
    }
    .pet-position-wrapper {
      top: 75%; /* Move pet lower to stay visible */
    }
  }
  ```

---

### 3.3 Mobile and Touch Considerations

**Mobile Layout**:
- On mobile, Obsidian panels can be full-width (~375-414px on phones)
- Background should still be readable and pet movement should feel smooth

**Touch Targets**:
- Pet sprite is 64x64px = 64pt touch target (exceeds 44pt minimum)
- No additional padding needed for touch interaction

**Performance**:
- Use WebP format (50% smaller than PNG)
- CSS animations run on compositor thread (no main thread blocking)
- Lazy-load background images if/when implementing seasonal swapping

---

## 4. Accessibility

### 4.1 Alt Text Strategy

**Background Image**:
```html
<div class="garden-scene" role="img" aria-label="Spring garden scene with grass and sky">
  <!-- Pet components render here -->
</div>
```

**Pet Sprite**:
```html
<div class="pet-sprite" role="img" aria-label="Pet is walking">
  <!-- Sprite animation handled by CSS -->
</div>
```

**State-Specific Labels**:
- Walking: "Pet is walking"
- Running: "Pet is running"
- Petting: "Pet is being petted"
- Celebration: "Pet is celebrating"
- Sleeping: "Pet is sleeping"

**Screen Reader Announcement**:
- Use `aria-live="polite"` on pet state changes (not every frame, only state transitions)
- Example: "Your pet is now being petted"

---

### 4.2 Color Contrast

**WCAG 2.1 AA Compliance**:

**Text on Background**:
- No text rendered on background in Phase 1A
- Future phases (celebration banners, buttons) must meet 4.5:1 contrast ratio

**Visual Separation**:
- Sky vs. Ground: Minimum 3:1 contrast for non-text elements
- Light mode: `#A8D5E2` (sky) vs `#7BC67E` (ground) = 1.9:1 (acceptable for decorative)
- Dark mode: `#1A2332` (sky) vs `#3A5240` (ground) = 1.6:1 (acceptable for decorative)

**Pet Sprite Visibility**:
- Pet sprite has internal contrast (defined in sprite sheet design)
- Background should not have elements that camouflage the pet
- Avoid medium-value grays that blend with pet sprite

**Keyboard Focus**:
- Pet sprite has visible focus outline (already implemented in Pet.svelte):
  ```css
  .pet-sprite-wrapper:focus-visible {
    outline: 2px solid var(--interactive-accent);
    outline-offset: 4px;
    border-radius: 4px;
  }
  ```

---

### 4.3 Reduced Motion

**Prefers-Reduced-Motion Support**:

**Background**:
- Static (no animated elements in background itself)
- Seasonal swapping is a hard cut (no transitions), inherently motion-friendly

**Pet Animation**:
```css
@media (prefers-reduced-motion: reduce) {
  /* Pause sprite animation but keep pet visible */
  .pet-sprite {
    animation-play-state: paused;
    background-position: 0 -128px; /* Show first frame of walking */
  }

  /* Slow down horizontal movement (don't eliminate entirely) */
  .pet-position-wrapper {
    animation-duration: calc(var(--movement-duration) * 3); /* 3x slower */
  }

  /* Disable flip animation (keep pet facing right) */
  .pet-flip-wrapper {
    animation: none;
    transform: scaleX(1);
  }
}
```

**Rationale**:
- Complete animation removal would make the plugin feel "broken"
- Slowing down movement respects motion sensitivity while maintaining charm
- Pausing sprite animation (showing static pose) reduces visual noise

---

## 5. Visual Mockup Description

### 5.1 ASCII Layout Diagram

```
┌─────────────────────────────────────────────────────┐
│ Obsidian Sidebar (350px wide, 600px tall)          │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │           Soft Blue Sky (#A8D5E2)             │ │
│  │                                               │ │
│  │         (Gradient: lighter at top)            │ │
│  │                                               │ │
│  ├───────────────────────────────────────────────┤ │ ← Horizon (45%)
│  │       Pale blue-white fog (#D4E8F0)           │ │
│  ├───────────────────────────────────────────────┤ │
│  │                                               │ │
│  │        Fresh Grass Green (#7BC67E)            │ │
│  │                                               │ │
│  │     🌸              🐱              🌼        │ │ ← Pet at 70%
│  │                    (64x64px)                  │ │
│  │                                               │ │
│  │      Earthier Green-Brown (#5A8C5E)           │ │
│  │                                               │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Legend**:
- 🌸 = Small flower (left edge decoration)
- 🐱 = Pet sprite (64x64px, walking animation)
- 🌼 = Small flower (right edge decoration)

---

### 5.2 Detailed Visual Description

**Scene Composition**:

**Sky (Top 40%)**:
- Soft, clear blue gradient (`#A8D5E2` at top → `#B8DDE8` at horizon)
- No clouds (keeps design minimal and uncluttered)
- Subtle vertical gradient suggests atmospheric depth
- Color palette: Calming, not saturated (avoids eye strain)

**Horizon (45% from top, 5% height)**:
- Gentle fog/haze layer (`#D4E8F0`)
- Soft gradient transition (no hard line)
- Creates depth without adding visual complexity
- Slightly desaturated to recede into background

**Ground (Bottom 55%)**:
- Upper ground: Fresh grass green (`#7BC67E`) with subtle texture
- Lower ground: Deeper green-brown (`#5A8C5E`) suggests earth/shadow
- Texture: Light pixel-art grass blades (not dense, painterly)
- Suggests a gentle downward slope toward viewer

**Decorative Elements**:
- **Flowers**: 2-3 small wildflowers near left/right edges
  - Pixel art style (3-5px diameter flower heads)
  - Colors: Coral (`#F59E6C`), soft yellow (`#F9D87A`)
  - Positioned below pet ground level (don't overlap walking path)
- **Path suggestion**: Optional lighter green strip horizontally across ground (pet's route)

**Pet Placement**:
- Positioned at 70% from top (feet aligned with ground plane)
- 64x64px sprite with walking animation
- Movement range: Edge-to-edge horizontally
- Always in front of background (z-index layering)

---

### 5.3 Dark Mode Variant

**Color Adjustments**:
- **Sky**: `#A8D5E2` → `#1A2332` (deep navy-blue)
- **Horizon**: `#D4E8F0` → `#2B3A47` (midnight blue)
- **Ground (upper)**: `#7BC67E` → `#3A5240` (muted sage)
- **Ground (lower)**: `#5A8C5E` → `#2A3B2E` (deep forest green)
- **Flowers**: `#F59E6C` → `#8B6F47` (muted amber), `#F9D87A` → `#7A6B8A` (lavender)

**Lighting Shift**:
- Overall scene is darker and more muted
- Horizon fog is less prominent (lower contrast)
- Ground texture is subtler (avoid harsh highlights)

**Obsidian Theme Integration**:
```css
body.theme-dark .garden-scene {
  background-image: url('backgrounds/spring-dark.webp');
}
```

---

## 6. Asset Creation Guidelines

### 6.1 Design Deliverables

**Required Assets**:
1. **spring-light.webp** (800×600px, ~40KB)
2. **spring-dark.webp** (800×600px, ~40KB)

**Design Tool Recommendations**:
- **Aseprite** (pixel art editor, $19.99) - best for pixel art
- **Piskel** (free, web-based) - good for pixel art
- **Procreate** (iPad, $12.99) - painterly textures with pixel brush
- **Photoshop/GIMP** - for final compositing and WebP export

**Design Process**:
1. Create base composition at 800×600px
2. Design in pixel art style (use 2x or 4x pixel brush)
3. Apply subtle anti-aliasing for soft edges
4. Add painterly textures (light grass detail)
5. Export as PNG (no compression)
6. Convert to WebP using tools:
   ```bash
   cwebp -q 85 spring-light.png -o spring-light.webp
   ```

---

### 6.2 Color Palette Export

**Light Mode Palette** (Hex values for design tools):
```
Sky:           #A8D5E2
Sky (gradient):#B8DDE8
Horizon:       #D4E8F0
Ground (top):  #7BC67E
Ground (bottom):#5A8C5E
Flower (coral):#F59E6C
Flower (yellow):#F9D87A
```

**Dark Mode Palette**:
```
Sky:           #1A2332
Horizon:       #2B3A47
Ground (top):  #3A5240
Ground (bottom):#2A3B2E
Flower (amber):#8B6F47
Flower (lav):  #7A6B8A
```

---

### 6.3 Quality Checklist

Before finalizing assets, verify:

**Technical**:
- [ ] Canvas size is exactly 800×600px
- [ ] File format is WebP (with PNG fallback)
- [ ] File size is under 50KB per image
- [ ] Images load quickly (test on slow connection)

**Visual**:
- [ ] Horizon line is at ~45% from top
- [ ] Ground plane is at ~70% from top (where pet feet align)
- [ ] Colors match specified hex values (±5% tolerance)
- [ ] Dark mode image has appropriate contrast reduction
- [ ] Pet sprite (64x64px) is clearly visible on both backgrounds

**Composition**:
- [ ] No tall vertical elements in center 80% (pet walking area)
- [ ] Decorative elements (flowers) are near edges only
- [ ] Visual style matches soft pixel art aesthetic
- [ ] Scene feels calm and uncluttered (not visually noisy)

**Accessibility**:
- [ ] Sky and ground have 3:1+ contrast ratio
- [ ] No red/green combinations (colorblind-friendly)
- [ ] Background does not have patterns that could camouflage 64x64px sprite

---

## 7. Implementation Notes

### 7.1 CSS Integration

**Garden.svelte** (new component):
```svelte
<script lang="ts">
  // Theme detection will be handled by Obsidian's body class
  // No JavaScript needed for theme-based background swapping
</script>

<div class="garden-scene" role="img" aria-label="Spring garden scene">
  <slot /> <!-- Pet component renders here -->
</div>

<style>
  .garden-scene {
    width: 100%;
    height: 100%;
    background-image: var(--garden-background-light);
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    position: relative;
    overflow: hidden;
  }

  /* Dark mode override via Obsidian theme class */
  :global(body.theme-dark) .garden-scene {
    background-image: var(--garden-background-dark);
  }
</style>
```

**CSS Custom Properties** (defined in styles.css):
```css
:root {
  --garden-background-light: url('backgrounds/spring-light.webp');
  --garden-background-dark: url('backgrounds/spring-dark.webp');
}
```

---

### 7.2 Responsive Testing

**Test Cases**:
1. **Narrow sidebar** (280px width) - pet should remain visible, background should not crop critical elements
2. **Standard sidebar** (350px width) - optimal viewing experience
3. **Wide sidebar** (500px width) - background scales gracefully, pet remains 64px
4. **Mobile portrait** (375px width) - full scene visible
5. **Mobile landscape** (667px width × 375px height) - verify horizon stays at 45%

**Testing Tools**:
- Chrome DevTools responsive mode
- Obsidian mobile app (iOS/Android)
- Physical devices (iPhone, Android phone, iPad)

---

### 7.3 Performance Optimization

**Image Loading**:
- Use WebP format (50% smaller than PNG)
- Lazy-load backgrounds if implementing multiple seasons (Phase 2)
- Preload next season's background in advance (1 week before season change)

**CSS Performance**:
- Background rendering is GPU-accelerated (no main thread impact)
- Use `will-change: background-image` only during season transitions (if animated)
- Avoid `background-attachment: fixed` (causes repaint on scroll)

**Memory**:
- 2 WebP images (light + dark) = ~80KB total
- Backgrounds are cached by browser (no repeated downloads)

---

## 8. Future Considerations

### 8.1 Seasonal Variations (Phase 2)

**Upcoming Assets**:
- `summer-light.webp` / `summer-dark.webp`
- `autumn-light.webp` / `autumn-dark.webp`
- `winter-light.webp` / `winter-dark.webp`

**Design Consistency**:
- Maintain same composition (sky 40%, ground 55%, horizon 45%)
- Keep pet ground level at 70% across all seasons
- Vary colors, textures, and ambient elements (leaves, snow, flowers)

**Seasonal Color Palettes** (TBD in Phase 2 design doc):
- Summer: Warmer yellows, vibrant greens
- Autumn: Orange, rust, golden hues
- Winter: Cool blues, whites, muted purples

---

### 8.2 Foreground Elements (Phase 3+)

**Potential Additions**:
- Foreground grass blades that overlap pet (z-index: 7)
- Fountain and cart (painted into background or separate sprites)
- Parallax scrolling (background moves slower than pet)

**Design Constraint**:
- Any foreground elements must not obscure pet's face/body
- Use transparency/partial overlap only

---

### 8.3 Animation Enhancements (Phase 4+)

**Ambient Animations**:
- Subtle cloud movement (CSS animation on sky layer)
- Swaying grass (CSS keyframes on foreground grass)
- Seasonal elements (falling leaves, snowflakes) as separate CSS layers

**Performance Impact**:
- All animations must remain on compositor thread (transform/opacity only)
- Target: <0.1% CPU usage even with ambient animations

---

## 9. Acceptance Criteria

Before marking Phase 1A as complete, verify:

**Visual**:
- [ ] Background image loads correctly in light mode
- [ ] Background image loads correctly in dark mode
- [ ] Pet sprite (64x64px) is clearly visible on both backgrounds
- [ ] Pet's feet align with ground plane at 70% vertical position
- [ ] Horizon line is visible at ~45% vertical position
- [ ] Scene feels calm and uncluttered (not visually busy)

**Responsive**:
- [ ] Background scales correctly from 280px to 600px width
- [ ] Pet remains visible and properly positioned at all widths
- [ ] No jarring crops or awkward scaling at edge cases

**Accessibility**:
- [ ] Background has `role="img"` and appropriate `aria-label`
- [ ] Color contrast meets WCAG 2.1 AA (non-text elements)
- [ ] Reduced motion media query is respected (if applicable)

**Performance**:
- [ ] WebP images load in <500ms on 3G connection
- [ ] No frame drops during pet animation (60 FPS maintained)
- [ ] CPU usage remains <0.1% (CSS animations on compositor thread)

**Integration**:
- [ ] Garden.svelte renders correctly in PetView
- [ ] Pet.svelte renders on top of Garden background
- [ ] Obsidian theme switching (light/dark) updates background automatically

---

## 10. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-12 | Initial specification for Phase 1A |

---

## Appendix: Quick Reference

**Background Dimensions**: 800×600px (4:3 aspect ratio)
**File Format**: WebP (~40KB each)
**Color Mode**: Light and dark variants required
**Pet Ground Level**: 70% from top
**Horizon Line**: 45% from top
**Visual Style**: Soft pixel art with painterly textures

**Key Files**:
- `assets/backgrounds/spring-light.webp`
- `assets/backgrounds/spring-dark.webp`
- `src/components/Garden.svelte` (new)
- `styles.css` (add CSS custom properties)

---

**Document Status**: Ready for Implementation
**Next Steps**:
1. Create background assets (spring-light.webp, spring-dark.webp)
2. Implement Garden.svelte component
3. Integrate Garden.svelte into PetPanel.svelte
4. Test responsive behavior across device sizes
5. Verify accessibility compliance (WCAG 2.1 AA)

**Estimated Design Time**: 6-8 hours (asset creation + integration)
**Estimated Development Time**: 3-4 hours (Garden.svelte + CSS integration)

---

**Designer Notes**:
This specification provides a strong foundation for Phase 1A. The placeholder spring scene should be simple and delightful, setting the tone for future seasonal variations. Focus on clarity, charm, and performance. Remember: "A plugin you feel, not think about."
