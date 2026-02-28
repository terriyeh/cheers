# Spec: Dashboard (Stats Tab)

**Type:** Feature
**Scope:** V1.0 MVP
**Status:** Draft

---

## Overview

Add a **Stats tab** inside the existing plugin panel alongside the Pet tab. The Stats tab displays:

1. **Concentric word count rings** — outer for daily goal progress, inner for per-note (active file) goal progress. Only rendered when the relevant goal type is enabled and has a goal value set.
2. **Activity tallies** — numeric counts of notes created, links created, and tasks completed today. Only the columns whose celebration type is toggled ON are shown.

All counters are **always tracked** regardless of celebration toggles — the toggles only control whether the tally column is shown. This means turning on a toggle mid-day reveals accurate counts from the full day.

All counters reset at midnight (local time). The tab toggle is persistent within the session; it does not reset when the panel is closed and reopened (defaults to Pet tab).

---

## User Stories

- As a writer, I want to see how many words I've written today so I can track progress toward my daily goal without leaving the vault.
- As a note-taker, I want to see how close my current note is to its word goal so I can judge when I'm done.
- As a user with selective celebration toggles, I want the dashboard to reflect only the metrics I've opted in to, with no empty placeholders for disabled features.
- As a daily user, I want today's tallies to reset at midnight so each day starts fresh.

---

## Scope

### In scope
- Tab bar within the existing `PetView` panel ([Pet] and [Stats])
- `Stats.svelte` component with SVG word count rings and tally grid
- Extending `DailyWordData` with daily activity counters (`notesCreatedToday`, `tasksCompletedToday`, `linksCreatedToday`)
- Incrementing those counters in `CelebrationService` unconditionally on each event (display controlled separately)
- Midnight reset covering all new counters alongside existing word data reset
- Real-time ring updates as words are written (while Stats tab is visible)
- Per-note ring updates when the active file changes
- Validation and defaults for new data fields
- `dashboardColorMode: 'warm' | 'cool'` setting with a toggle in SettingsTab

### Out of scope
- Streaks / Achievements tab (V1.1+)
- Historical data or trends
- Dangling links tally (V1.1)
- Animations on the ring fill (a CSS transition is acceptable; a full animation sequence is not required)

---

## Data Model Changes

### Extend `DailyWordData` (`src/types/settings.ts`)

Add three new fields. These persist in `data.json` under the `daily` key.

```typescript
export interface DailyWordData {
  date: string;
  wordsAddedToday: number;
  goalCelebrated: boolean;
  // NEW:
  notesCreatedToday: number;
  tasksCompletedToday: number;
  linksCreatedToday: number;
}
```

**Defaults:** All three new fields default to `0`.

**Validation on load** (in `main.ts → loadDailyWordData`):
- Must be a non-negative integer. Invalid or missing values → `0`.
- Apply same `Math.max(0, Math.floor(...))` pattern as `wordsAddedToday`.

**Midnight reset** (in `CelebrationService`):
- The existing midnight reset block already zeroes `wordsAddedToday` and resets `goalCelebrated`.
- Extend it to also zero `notesCreatedToday`, `tasksCompletedToday`, `linksCreatedToday`.
- **Critical:** Midnight reset is currently only triggered inside `checkDailyGoal()`, which only fires on word-goal events. Extract reset logic into `resetDailyStatsIfNeeded()` and call it at the top of `handleNoteCreation()`, `checkTaskCompletion()`, `checkLinkCreation()`, and `checkDailyGoal()` so all event paths trigger the reset.

**Persistence:**
- Increment + persist immediately on each event (same pattern as `goalCelebrated`).
- Rationale: these are discrete events (not high-frequency like word counting), so per-event persistence is acceptable.
- Counters are incremented **regardless of whether the celebration toggle is ON**. The toggle only controls display.

### New setting: `dashboardColorMode` (`src/types/settings.ts`)

Add to `ObsidianPetsSettings`:

```typescript
/** Color palette for the Stats dashboard. Default: 'warm'. */
dashboardColorMode: 'warm' | 'cool';
```

Default: `'warm'`. Validation: must be `'warm'` or `'cool'`; any other value → `'warm'`.

---

## Component Architecture

### Tab Bar

The tab bar lives at the top of `PetView`'s content area, above both the Pet and Stats content. It is rendered with plain DOM elements (consistent with the rest of `PetView.ts`, which uses Obsidian's DOM API).

```
┌─────────────────────────┐
│  [🐱 Pet]  [📊 Stats]  │  ← tab bar, always visible
├─────────────────────────┤
│                         │
│   <Pet.svelte>          │  ← visible when Pet tab active
│     OR                  │
│   <Stats.svelte>        │  ← visible when Stats tab active
│                         │
└─────────────────────────┘
```

- Icons: use Obsidian's `setIcon()` helper. Pet tab = `'cat'`, Stats tab = `'bar-chart-2'`.
- Active tab has a distinct visual state (border-bottom or background highlight, following Obsidian's `.is-active` class pattern).
- Switching tabs shows/hides the relevant container div (CSS `display: none` on the inactive one; the Svelte components are mounted once and kept alive, not destroyed on tab switch).
- Default tab on `onOpen`: Pet tab.
- Tab state is in-memory only; it does not persist across panel closes.

### `Stats.svelte` (`src/components/Stats.svelte`)

New Svelte component. Receives all data via props; does not access the plugin directly.

**Props:**
```typescript
// Word goal ring data
wordsAddedToday: number;
dailyWordGoal: number | null;   // null = no daily goal set / onWordGoal off → outer ring absent
fileWordCount: number | null;   // null = no active markdown editor open
fileWordGoal: number | null;    // null = active file has no word-goal frontmatter → inner circle absent

// Activity tally data — always the real count from dailyWordData
notesCreatedToday: number;
linksCreatedToday: number;
tasksCompletedToday: number;

// Display flags — whether to show each tally column (independent of count)
showNotesColumn: boolean;       // = settings.celebrations.onNoteCreate
showLinksColumn: boolean;       // = settings.celebrations.onLinkCreate
showTasksColumn: boolean;       // = settings.celebrations.onTaskComplete

// Color palette
colorMode: 'warm' | 'cool';
```

**Prop derivation** (computed in `PetView.ts` before passing to Stats.svelte):
- `dailyWordGoal`: `settings.celebrations.onWordGoal && settings.celebrations.dailyWordGoal > 0 ? settings.celebrations.dailyWordGoal : null`
- `fileWordGoal`: read from `metadataCache.getFileCache(activeFile)?.frontmatter?.['word-goal']` — only when `onWordGoal` is enabled; parsed to number or null
- `fileWordCount`: count words in the active editor content using `CelebrationService.countWords()` (public static)
- `notesCreatedToday`: always `dailyWordData.notesCreatedToday` (no toggle check)
- `showNotesColumn`: `settings.celebrations.onNoteCreate` (same pattern for links/tasks)
- `colorMode`: `settings.dashboardColorMode`

---

## Visual Specification

### Ring Section

Rendered with inline SVG. No external charting library.

#### When rings are shown

| `dailyWordGoal` set | `fileWordGoal` set | Rendered |
|---|---|---|
| ✓ | ✓ | Outer stroke ring (daily) + inner liquid-fill circle (per-note), concentric |
| ✓ | ✗ | Outer stroke ring only, centered |
| ✗ | ✓ | Inner liquid-fill circle only, centered |
| ✗ | ✗ | Ring section entirely absent; tallies fill the available space |

#### Outer ring (daily goal)

- SVG stroke-based progress ring (`stroke-dasharray` / `stroke-dashoffset`).
- Progress = `min(wordsAddedToday / dailyWordGoal, 1.0)` (capped at 100%).
- Background track circle: same path, low-opacity stroke (`opacity: 0.15`).
- Label **below** the ring: `Daily goal: {wordsAddedToday}/{dailyWordGoal} words`

#### Inner circle (per-note goal)

- Solid SVG circle with a **constant radius** that fills upward from the bottom as progress increases — a "liquid fill" effect.
- **Technique:** A full-radius filled circle clipped by an SVG `<clipPath>` containing a `<rect>` anchored to the bottom. The rect's height = `circleRadius * 2 * progress`, growing upward from the bottom of the circle bounding box as progress increases.
- At 0% progress the clip rect has 0 height → circle appears empty (a faint track circle at 15% opacity remains visible as the "container").
- At 100%+ progress the clip rect covers the full circle diameter → circle appears fully filled.
- Track circle (always rendered at `opacity: 0.15`, same fill color) provides the "empty container" visual at all progress levels.
- Label **above** the ring: `File goal: {fileWordCount}/{fileWordGoal} words`
- SVG `<clipPath>` IDs must be unique per component instance to avoid collisions if multiple views open (use a Svelte `onMount` uid or `Math.random().toString(36).slice(2)`).

#### Colors

All colors reference Obsidian's built-in CSS variables, which automatically adapt to light and dark mode. Custom properties are set on the `.vp-stats` container element; `data-color-mode` attribute switches the palette.

```css
/* Base — shared across both modes */
.vp-stats {
  --vp-ring-color:   var(--color-purple);
  --vp-ring-track:   var(--color-purple);
}

/* Warm mode (default) */
.vp-stats[data-color-mode="warm"] {
  --vp-notes-color: var(--color-pink);
  --vp-links-color: var(--color-yellow);
  --vp-tasks-color: var(--color-orange);
}

/* Cool mode */
.vp-stats[data-color-mode="cool"] {
  --vp-notes-color: var(--color-blue);
  --vp-links-color: var(--color-cyan);
  --vp-tasks-color: var(--color-green);
}
```

Ring and circle fill: `var(--vp-ring-color)`. Labels: `var(--text-muted)`.

#### Ring sizing

- Outer ring diameter: `min(container-width - 32px, 200px)`, responsive via `ResizeObserver` or CSS `aspect-ratio`.
- When only the inner circle is shown (no outer ring): same max diameter applies to the inner circle directly.
- When both are shown: inner circle radius = 36% of the outer ring's inner radius, leaving a visible gap between the circle edge and the ring track.
- CSS `transition: 0.3s ease` on `stroke-dashoffset` (outer ring) and on the clip rect height (inner circle) for smooth updates.

---

### Tally Section

Below the ring section (or filling the full area when no rings are shown).

#### Layout

Columns in a flex row, `justify-content: center`, `gap: 24px`, `flex-wrap: wrap`. Each visible column:

```
     3          ← large number, bold, column color
Notes           ← label line 1, --text-muted
created         ← label line 2, --text-muted
```

If `showNotesColumn` is false, the Notes column is **entirely absent** — no placeholder, no gap. The remaining columns center naturally via flexbox.

If all three `show*Column` flags are false and no rings are shown, display a single centered empty-state message: `"Enable celebrations in settings to track your activity."` (`--text-muted`, `font-size: 0.8rem`).

#### Column specs

| Prop | `show*Column` flag | Label | Warm color | Cool color |
|---|---|---|---|---|
| `notesCreatedToday` | `showNotesColumn` | "Notes created" | `var(--color-pink)` | `var(--color-blue)` |
| `linksCreatedToday` | `showLinksColumn` | "Links created" | `var(--color-yellow)` | `var(--color-cyan)` |
| `tasksCompletedToday` | `showTasksColumn` | "Tasks completed" | `var(--color-orange)` | `var(--color-green)` |

- Count: `font-size: 2rem`, `font-weight: 700`, color = column's `--vp-*-color` variable.
- Label: `font-size: 0.72rem`, `color: var(--text-muted)`, `text-align: center`, rendered as a single string (not forced two-line; line break is natural from container width).
- No animation on tally number updates.

---

## Interaction Specification

### Tab Switching

- Clicking the Stats tab icon: shows Stats.svelte container, hides Pet.svelte container. No re-mount.
- Clicking the Pet tab icon: reverse.
- Both components remain mounted in the DOM while the view is open (avoids destroying pet animation state).

### Real-Time Updates (Stats tab)

The Stats component's props must stay current while the tab is visible. `PetView.ts` is responsible for pushing updated props.

Update triggers:
1. **Editor change** (word count update): subscribe to Obsidian `editor-change` workspace event with 150ms debounce. Recalculate `fileWordCount` and `wordsAddedToday` (read from `plugin.dailyWordData`), then call `statsComponent.$set(...)`.
2. **Active file change**: subscribe to Obsidian `active-leaf-change` workspace event. Recalculate `fileWordGoal` and `fileWordCount` for the new file.
3. **Celebration fired** (tally increments): `CelebrationService` must notify `PetView` after updating `dailyWordData`. A simple callback pattern is sufficient: pass an optional `onDailyStatsChanged: () => void` callback to `CelebrationService` constructor; `PetView` supplies a callback that calls `statsComponent.$set(...)`.

All event subscriptions must be cleaned up in `PetView.onClose()` (use `this.registerEvent()` pattern from Obsidian Plugin API for automatic cleanup).

### Midnight Reset

The midnight reset currently only triggers inside `checkDailyGoal()`, which only fires on word-goal events. With the new counters, a user who creates notes but never hits a word count path would not see a reset.

**Fix:** Extract midnight-reset logic into `resetDailyStatsIfNeeded()` and call it at the top of `handleNoteCreation()`, `checkTaskCompletion()`, `checkLinkCreation()`, and `checkDailyGoal()`.

---

## File Changes

| File | Change |
|---|---|
| `src/types/settings.ts` | Add 3 new fields to `DailyWordData`; add `dashboardColorMode: 'warm' \| 'cool'` to `ObsidianPetsSettings`; update defaults |
| `src/main.ts` | Update `loadDailyWordData()` to validate and default new fields; update `getDefaultDailyData()`; validate `dashboardColorMode` in `validateSettings()` |
| `src/celebrations/CelebrationService.ts` | Extract `resetDailyStatsIfNeeded()`; increment all three counters unconditionally on each event; add `onDailyStatsChanged` callback |
| `src/settings/SettingsTab.ts` | Add warm/cool color mode toggle |
| `src/views/PetView.ts` | Add tab bar DOM elements; mount `Stats.svelte`; subscribe to editor/leaf events; supply `onDailyStatsChanged` callback; clean up in `onClose()` |
| `src/components/Stats.svelte` | **New file.** SVG rings (outer stroke ring + inner liquid-fill circle) + tally grid |
| `styles.css` | Tab bar styles; `.vp-stats` container and color-mode variables |

---

## Success Criteria

All criteria must be met before this feature is considered complete.

### Data integrity
- [ ] After writing 50 words, `dailyWordData.wordsAddedToday` equals 50 and persists across vault restarts on the same day.
- [ ] After creating 3 notes with `onNoteCreate` **ON**, `dailyWordData.notesCreatedToday` equals 3 and persists.
- [ ] After creating 3 notes with `onNoteCreate` **OFF**, `dailyWordData.notesCreatedToday` still equals 3 (tracking is unconditional); the column is simply not shown.
- [ ] At midnight (simulated by changing the stored `date` to yesterday), all daily counters reset to 0 on the next triggering event regardless of which event type fires first (note creation, not just word-goal events).

### Ring rendering
- [ ] With `dailyWordGoal = 1000` and `wordsAddedToday = 400`: outer ring stroke covers ~40% of circumference, label reads `Daily goal: 400/1000 words`.
- [ ] With active file having `word-goal: 500` and current word count 400: inner circle fills ~80% of its height from the bottom, label reads `File goal: 400/500 words`.
- [ ] At 0 words written, inner circle shows only the faint track circle (the clip rect has 0 height).
- [ ] At 100%+ words written, inner circle is fully filled (no overflow beyond the circle boundary).
- [ ] With no `dailyWordGoal` set: no outer ring rendered.
- [ ] With no active file `word-goal`: no inner circle rendered.
- [ ] With neither goal set: ring section is entirely absent.
- [ ] Ring fill updates within 200ms of stopping typing (debounce + render time).
- [ ] Word count progress capped at 100% (outer ring stroke does not exceed full circumference; inner clip rect does not exceed circle diameter).

### Tally rendering
- [ ] With all three celebration types ON: all three tally columns visible with labels "Notes created", "Links created", "Tasks completed".
- [ ] With `onLinkCreate` OFF: "Links created" column absent; the other two columns remain centered.
- [ ] With all three celebration types OFF and no rings: empty-state message shown.
- [ ] Tally counts update immediately when a celebration fires (no page refresh needed).
- [ ] In warm mode: notes = pink, links = yellow, tasks = orange.
- [ ] In cool mode: notes = blue, links = cyan, tasks = green.
- [ ] Rings are purple in both modes.
- [ ] Colors use Obsidian's `--color-*` variables and render correctly in both light and dark themes.

### Tab behavior
- [ ] Clicking Stats tab hides pet, shows stats without destroying the pet component (pet resumes walking where it left off when switching back).
- [ ] Tab indicator correctly reflects which tab is active.
- [ ] Panel close/reopen defaults to Pet tab.

### Cleanup
- [ ] All workspace event subscriptions registered in `PetView.onOpen()` are released on `onClose()` with no console errors.
- [ ] `Stats.svelte` is destroyed in `PetView.onClose()`.

---

## Anti-Requirements

- **No charting library.** Rings are pure SVG.
- **No empty ring placeholders.** If a goal type is not enabled, its ring does not render (not a grayed-out empty ring).
- **No empty tally placeholders.** Disabled columns are absent, not greyed out.
- **No separate panel.** Stats live inside the existing PetView leaf only.
- **No historical data.** Only today's counters are stored; there is no per-day log.
- **No separate Streaks or Achievements tab** in this release.
- **No new celebration toggles.** The only new setting is `dashboardColorMode`; it configures display only.
- **No fallback hex colors.** All colors must go through Obsidian's `--color-*` variables to ensure theme compatibility.
- **No persisting the active tab.** It resets to Pet tab on panel reopen.

---

## Risks & Edge Cases

| Risk | Mitigation |
|---|---|
| Active file has no editor open (e.g., reading mode, non-markdown file) | `fileWordCount` and `fileWordGoal` both null → inner circle absent. No error. |
| User opens Stats tab before any editor is open | All ring values default to 0/null gracefully; ring section absent if no goals configured. |
| `metadataCache` lags behind frontmatter edits | Documented known limitation (same as existing per-note goal check). Stats ring updates on next editor-change after cache refreshes. |
| `dailyWordGoal` is null vs. 0 | Treat both as "no goal set." Outer ring absent in both cases. |
| Very large word counts (>100,000 words/day) | Progress capped at 1.0; outer stroke stays within circumference; inner clip rect height capped at circle diameter. |
| Panel too narrow for all three tally columns | Flexbox with `flex-wrap: wrap` so columns reflow to two rows on narrow widths. |
