# Implementation Plan: Stats/Dashboard Feature

**Spec:** [dashboard.md](./dashboard.md)
**Status:** In progress — Tasks 1–4, 6–8 done; Task 5 (Stats.svelte UI) pending

---

## Pre-Implementation Decision (Required)

**Add `private plugin: ObsidianPetsPlugin | null = null` to `PetView`.**

Set it at the top of `onOpen()` right after the existing undocumented plugin lookup. All new `PetView` methods use `this.plugin` directly instead of repeating the `app.plugins.plugins` lookup. This is less invasive than changing the `PetView` constructor (which would require changing the `registerView` lambda in `main.ts`).

---

## Corrections from Plan Review

Four issues identified and fixed below:

1. **No callback indirection for stats updates.** `CelebrationService` already calls `this.plugin.petView?.transitionState()` directly. The same pattern applies here: call `this.plugin.petView?.updateStatsComponent()` inline after incrementing the counter. No `setStatsCallback()` method, no wiring code in `main.ts`.

2. **`resetDailyStatsIfNeeded()` placement bug.** Must be called *after* the `isMarkdown` guard in `handleNoteCreation()`, not before. If a non-markdown file triggers the reset and then early-returns, the counter never increments — the midnight reset fires but leaves all counters at 0. Correct placement: after the `isMarkdown` check, before the counter increment.

3. **`statsComponent` must be private.** `SettingsTab` should call `this.plugin.petView?.updateStatsComponent()` — not reach into `petView.statsComponent.$set(...)` directly. `updateStatsComponent()` already re-reads all current settings including the new color mode via `buildStatsProps()`. No need to expose the Svelte component instance.

4. **No Stats.svelte mock.** The mock approach would test only that `PetView` calls `$set` — it cannot verify the SVG ring geometry, clip logic, or empty state, because the mock doesn't run the component's reactive code. Instead, extract the pure derivation logic (progress capping, ring visibility flags, empty state) into a separate `src/utils/stats-utils.ts` helper, and unit test that directly. `PetView` tests verify mount/destroy/tab switching via the existing DOM-based approach.

---

## Implementation Phases (8 Tasks)

### Phase A — Data Layer

**Task 1 — `src/types/settings.ts`** ✅ DONE

Extend `DailyWordData`:
```typescript
notesCreatedToday: number;
tasksCompletedToday: number;
linksCreatedToday: number;
```

Add to `ObsidianPetsSettings` (top-level, not nested in `celebrations`):
```typescript
/** Color palette for the Stats dashboard. Default: 'warm'. */
dashboardColorMode: 'warm' | 'cool';
```

Update `DEFAULT_SETTINGS` to include `dashboardColorMode: 'warm'`.

Do NOT add a `VALIDATION_RULES` entry — validation is a simple equality check handled inline in `validateSettings`.

---

**Task 2 — `src/main.ts`** ✅ DONE

In `getDefaultDailyData()`, add the three new fields defaulting to `0`.

In `loadDailyWordData()`, apply `Math.max(0, Math.floor(...))` to each new field. The existing date-mismatch branch already calls `getDefaultDailyData()` so it zeroes the new fields automatically — no change needed there.

In `validateSettings()`, after the celebrations block:
```typescript
if (validated.dashboardColorMode !== 'warm' && validated.dashboardColorMode !== 'cool') {
  validated.dashboardColorMode = DEFAULT_SETTINGS.dashboardColorMode;
}
```

`dashboardColorMode` is top-level, so it is already included in the `{ ...DEFAULT_SETTINGS, ...settingsData }` spread in `loadSettings()`. No special handling required.

---

**Task 3 — `src/celebrations/CelebrationService.ts`** ✅ DONE

Three sub-changes:

**3a. Extract `resetDailyStatsIfNeeded()`:**

The existing inline midnight-reset block inside `checkDailyGoal()` becomes:
```typescript
private resetDailyStatsIfNeeded(): void {
  const today = this.plugin.getLocalDateString();
  const daily = this.plugin.dailyWordData;
  if (daily.date !== today) {
    daily.date = today;
    daily.wordsAddedToday = 0;
    daily.goalCelebrated = false;
    daily.notesCreatedToday = 0;
    daily.tasksCompletedToday = 0;
    daily.linksCreatedToday = 0;
  }
}
```

Call sites — in each case, call it **after** the event-specific early-return guard so that a non-qualifying event (non-markdown file, toggle-gated path with no counter) cannot trigger a midnight reset without recording a counter increment:

- `handleNoteCreation()` — after the `isMarkdown` guard
- `checkTaskCompletion()` — after the `if (!onTaskComplete)` toggle check is removed from in front of the counter logic (see 3b)
- `checkLinkCreation()` — same
- `checkDailyGoal()` — replaces the existing inline reset block

**3b. Increment counters unconditionally, call `updateStatsComponent()` directly:**

Counters are tracked regardless of celebration toggles. The existing toggle checks in `checkTaskCompletion()` and `checkLinkCreation()` gate the *celebration* only — the counter and reset run before the toggle check.

In `handleNoteCreation()`, after `isMarkdown` guard and reset:
```typescript
// Always track (toggle only controls display)
this.plugin.dailyWordData.notesCreatedToday++;
void this.plugin.saveSettings().catch(err =>
  console.error('[CelebrationService] Failed to persist note count:', err)
);
this.plugin.petView?.updateStatsComponent();  // same pattern as transitionState
```
Then the existing `if (!onNoteCreate) return;` check follows for the celebration.

In `checkTaskCompletion()`, before the `if (!onTaskComplete) return;` toggle check:
```typescript
const delta = currentTaskCount - this.previousTaskCount;
if (delta > 0) {
  this.plugin.dailyWordData.tasksCompletedToday += delta;
  void this.plugin.saveSettings().catch(err =>
    console.error('[CelebrationService] Failed to persist task count:', err)
  );
  this.plugin.petView?.updateStatsComponent();
}
// existing toggle check for celebration follows
```

Same pattern for `checkLinkCreation()` / `linksCreatedToday`.

**Critical ordering:** `resetDailyStatsIfNeeded()` → increment → save → `updateStatsComponent()`.

**No `setStatsCallback()` method. No wiring in `main.ts`.** Direct call via `this.plugin.petView?.updateStatsComponent()` is sufficient and consistent with existing code.

---

### Phase B — Stats Component

**Task 4 — `src/utils/stats-utils.ts`** ✅ DONE *(new small helper)*

Extract pure derivation logic that needs unit testing:

```typescript
export interface StatsRingData {
  showOuterRing: boolean;
  showInnerCircle: boolean;
  showRingSection: boolean;
  dailyProgress: number;    // 0–1, capped
  fileProgress: number;     // 0–1, capped
  outerOffset: number;      // stroke-dashoffset value
}

const OUTER_RADIUS = 80;
const STROKE_WIDTH = 12;
export const INNER_RADIUS = OUTER_RADIUS - STROKE_WIDTH / 2;   // 74
export const CIRCUMFERENCE = 2 * Math.PI * INNER_RADIUS;       // ~464.96

export function computeRingData(
  wordsAddedToday: number,
  dailyWordGoal: number | null,
  fileWordCount: number | null,
  fileWordGoal: number | null,
): StatsRingData {
  const showOuterRing = dailyWordGoal !== null && dailyWordGoal > 0;
  const showInnerCircle = fileWordGoal !== null && fileWordGoal > 0;
  const dailyProgress = showOuterRing
    ? Math.min(wordsAddedToday / dailyWordGoal!, 1.0) : 0;
  const fileProgress = showInnerCircle && fileWordCount !== null
    ? Math.min(fileWordCount / fileWordGoal!, 1.0) : 0;
  return {
    showOuterRing,
    showInnerCircle,
    showRingSection: showOuterRing || showInnerCircle,
    dailyProgress,
    fileProgress,
    outerOffset: CIRCUMFERENCE * (1 - dailyProgress),
  };
}
```

This is the only logic in `Stats.svelte` that merits unit testing. The rest (SVG markup, CSS) is verified visually.

---

**Task 5 — `src/components/Stats.svelte`** 🚧 PENDING — stub exists, ring/tally UI not yet implemented *(new file)*

Imports `computeRingData`, `INNER_RADIUS`, `CIRCUMFERENCE` from `stats-utils.ts`.

**Script block:**
```typescript
import { onMount } from 'svelte';
import { tweened } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';
import { computeRingData, INNER_RADIUS, CIRCUMFERENCE } from '../utils/stats-utils';

// Props
export let wordsAddedToday: number = 0;
export let dailyWordGoal: number | null = null;
export let fileWordCount: number | null = null;
export let fileWordGoal: number | null = null;
export let notesCreatedToday: number = 0;
export let linksCreatedToday: number = 0;
export let tasksCompletedToday: number = 0;
export let showNotesColumn: boolean = false;
export let showLinksColumn: boolean = false;
export let showTasksColumn: boolean = false;
export let colorMode: 'warm' | 'cool' = 'warm';

// Unique clipPath ID per instance (prevents collisions if multiple views open)
let instanceId: string = '';
onMount(() => { instanceId = Math.random().toString(36).slice(2); });

// Derived ring data (pure, importable, testable)
$: ring = computeRingData(wordsAddedToday, dailyWordGoal, fileWordCount, fileWordGoal);

// Inner circle sizing
$: innerCircleRadius = ring.showOuterRing ? Math.round(80 * 0.36) : INNER_RADIUS;

// Tweened for smooth liquid fill (SVG attribute changes can't use CSS transitions)
const fileProgressTween = tweened(0, { duration: 300, easing: cubicOut });
$: fileProgressTween.set(ring.fileProgress);
$: clipRectHeight = innerCircleRadius * 2 * $fileProgressTween;
$: clipRectY = 100 + innerCircleRadius - clipRectHeight;

$: anyColumnVisible = showNotesColumn || showLinksColumn || showTasksColumn;
$: showEmptyState = !ring.showRingSection && !anyColumnVisible;
```

**Template:**
```svelte
<div class="vp-stats" data-color-mode={colorMode}>
  {#if ring.showRingSection}
    <div class="vp-stats-rings">
      {#if ring.showInnerCircle && fileWordGoal}
        <p class="vp-stats-label">File goal: {fileWordCount ?? 0}/{fileWordGoal} words</p>
      {/if}

      <svg viewBox="0 0 200 200" class="vp-stats-svg" aria-hidden="true">
        <defs>
          {#if ring.showInnerCircle && instanceId}
            <clipPath id="vp-liquid-{instanceId}">
              <rect
                x={100 - innerCircleRadius} y={clipRectY}
                width={innerCircleRadius * 2} height={clipRectHeight}
              />
            </clipPath>
          {/if}
        </defs>

        {#if ring.showOuterRing}
          <circle cx="100" cy="100" r={INNER_RADIUS} fill="none"
            stroke="var(--vp-ring-color)" stroke-width="12" opacity="0.15" />
          <circle cx="100" cy="100" r={INNER_RADIUS} fill="none"
            stroke="var(--vp-ring-color)" stroke-width="12"
            stroke-dasharray={CIRCUMFERENCE} stroke-dashoffset={ring.outerOffset}
            stroke-linecap="round" transform="rotate(-90 100 100)"
            class="vp-ring-progress" />
        {/if}

        {#if ring.showInnerCircle && instanceId}
          <circle cx="100" cy="100" r={innerCircleRadius}
            fill="var(--vp-ring-color)" opacity="0.15" />
          <circle cx="100" cy="100" r={innerCircleRadius}
            fill="var(--vp-ring-color)"
            clip-path="url(#vp-liquid-{instanceId})" />
        {/if}
      </svg>

      {#if ring.showOuterRing && dailyWordGoal}
        <p class="vp-stats-label">Daily goal: {wordsAddedToday}/{dailyWordGoal} words</p>
      {/if}
    </div>
  {/if}

  {#if anyColumnVisible}
    <div class="vp-stats-tallies">
      {#if showNotesColumn}
        <div class="vp-tally-col vp-tally-notes">
          <span class="vp-tally-count">{notesCreatedToday}</span>
          <span class="vp-tally-label">Notes created</span>
        </div>
      {/if}
      {#if showLinksColumn}
        <div class="vp-tally-col vp-tally-links">
          <span class="vp-tally-count">{linksCreatedToday}</span>
          <span class="vp-tally-label">Links created</span>
        </div>
      {/if}
      {#if showTasksColumn}
        <div class="vp-tally-col vp-tally-tasks">
          <span class="vp-tally-count">{tasksCompletedToday}</span>
          <span class="vp-tally-label">Tasks completed</span>
        </div>
      {/if}
    </div>
  {/if}

  {#if showEmptyState}
    <p class="vp-stats-empty">Enable celebrations in settings to track your activity.</p>
  {/if}
</div>
```

**`<style>` block:**
```css
.vp-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 16px 8px;
  box-sizing: border-box;
  overflow-y: auto;
  --vp-ring-color: var(--color-purple);
}
.vp-stats[data-color-mode="warm"] {
  --vp-notes-color: var(--color-pink);
  --vp-links-color: var(--color-yellow);
  --vp-tasks-color: var(--color-orange);
}
.vp-stats[data-color-mode="cool"] {
  --vp-notes-color: var(--color-blue);
  --vp-links-color: var(--color-cyan);
  --vp-tasks-color: var(--color-green);
}
.vp-stats-rings { display: flex; flex-direction: column; align-items: center; width: 100%; margin-bottom: 16px; }
.vp-stats-svg { width: min(100%, 200px); height: auto; }
.vp-ring-progress { transition: stroke-dashoffset 0.3s ease; }
.vp-stats-label { font-size: 0.75rem; color: var(--text-muted); text-align: center; margin: 4px 0; }
.vp-stats-tallies { display: flex; flex-direction: row; justify-content: center; flex-wrap: wrap; gap: 24px; width: 100%; margin-top: 8px; }
.vp-tally-col { display: flex; flex-direction: column; align-items: center; min-width: 60px; }
.vp-tally-count { font-size: 2rem; font-weight: 700; line-height: 1; margin-bottom: 4px; }
.vp-tally-label { font-size: 0.72rem; color: var(--text-muted); text-align: center; line-height: 1.3; }
.vp-tally-notes .vp-tally-count { color: var(--vp-notes-color); }
.vp-tally-links .vp-tally-count { color: var(--vp-links-color); }
.vp-tally-tasks .vp-tally-count { color: var(--vp-tasks-color); }
.vp-stats-empty { font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 16px; }
```

---

### Phase C — View Integration

**Task 6 — `src/views/PetView.ts` + `src/settings/SettingsTab.ts` + `tests/mocks/obsidian.ts`** ✅ DONE (PetView + mocks done; SettingsTab color mode toggle pending — no SettingsTab.ts yet)

Three coordinated changes done together since they share a dependency boundary.

**PetView new fields:**
```typescript
private statsComponent: StatsComponent | null = null;  // private — callers use updateStatsComponent()
private statsContainerDiv: HTMLDivElement | null = null;
private petContainerDiv: HTMLDivElement | null = null;  // was containerDiv
private activeTab: 'pet' | 'stats' = 'pet';
private statsEditorChangeTimeout: number | undefined;
```

**`onOpen()` additions (after existing plugin lookup):**
1. Store plugin as `this.plugin`.
2. Build tab bar with `setIcon()` — add `import { ItemView, setIcon, ... } from 'obsidian'`.
3. Create `.obsidian-pets-panel.vp-panel-pet` and `.obsidian-pets-panel.vp-panel-stats.vp-panel-hidden`.
4. Mount `Pet.svelte` into `petContainerDiv` (unchanged behavior).
5. Mount `Stats.svelte` into `statsContainerDiv` with `buildStatsProps()`.
6. Register `editor-change` (150ms debounce) and `active-leaf-change` via `this.registerEvent()`.

**`switchTab()` private method:**
```typescript
private switchTab(tab: 'pet' | 'stats', petTabEl: HTMLElement, statsTabEl: HTMLElement): void {
  this.activeTab = tab;
  const isPet = tab === 'pet';
  this.petContainerDiv?.toggleClass('vp-panel-hidden', !isPet);
  this.statsContainerDiv?.toggleClass('vp-panel-hidden', isPet);
  petTabEl.toggleClass('is-active', isPet);
  statsTabEl.toggleClass('is-active', !isPet);
  if (!isPet) this.updateStatsComponent();
}
```

**`buildStatsProps()` private helper** — derives all 13 props from `plugin.settings`, `plugin.dailyWordData`, and active editor:
```typescript
private buildStatsProps(plugin: ObsidianPetsPlugin): Record<string, unknown> {
  const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
  const activeFile = activeView?.file ?? null;
  let fileWordCount: number | null = null;
  let fileWordGoal: number | null = null;
  if (activeFile && activeView) {
    fileWordCount = CelebrationService.countWords(activeView.editor.getValue());
    const raw = plugin.app.metadataCache.getFileCache(activeFile)?.frontmatter?.['word-goal'];
    const parsed = typeof raw === 'number' ? raw : parseInt(raw, 10);
    fileWordGoal = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  const { onWordGoal, dailyWordGoal, onNoteCreate, onLinkCreate, onTaskComplete } =
    plugin.settings.celebrations;
  return {
    wordsAddedToday: plugin.dailyWordData.wordsAddedToday,
    dailyWordGoal: (onWordGoal && dailyWordGoal && dailyWordGoal > 0) ? dailyWordGoal : null,
    fileWordCount,
    fileWordGoal: onWordGoal ? fileWordGoal : null,
    notesCreatedToday: plugin.dailyWordData.notesCreatedToday,
    linksCreatedToday: plugin.dailyWordData.linksCreatedToday,
    tasksCompletedToday: plugin.dailyWordData.tasksCompletedToday,
    showNotesColumn: onNoteCreate,
    showLinksColumn: onLinkCreate,
    showTasksColumn: onTaskComplete,
    colorMode: plugin.settings.dashboardColorMode,
  };
}
```

**`updateStatsComponent()` public method** — called by `CelebrationService` and `SettingsTab`:
```typescript
public updateStatsComponent(): void {
  if (!this.statsComponent || !this.plugin) return;
  this.statsComponent.$set(this.buildStatsProps(this.plugin));
}
```

**Event subscriptions:**
```typescript
this.registerEvent(
  this.app.workspace.on('editor-change', () => {
    window.clearTimeout(this.statsEditorChangeTimeout);
    this.statsEditorChangeTimeout = window.setTimeout(() => {
      if (this.activeTab === 'stats') this.updateStatsComponent();
    }, 150);
  })
);
this.registerEvent(
  this.app.workspace.on('active-leaf-change', () => {
    if (this.activeTab === 'stats') this.updateStatsComponent();
  })
);
```

**`onClose()` additions:**
```typescript
if (this.statsComponent) {
  this.statsComponent.$destroy();
  this.statsComponent = null;
}
if (this.statsEditorChangeTimeout !== undefined) {
  window.clearTimeout(this.statsEditorChangeTimeout);
  this.statsEditorChangeTimeout = undefined;
}
// this.registerEvent() cleans up workspace events automatically
```

**SettingsTab change** (15 lines, included here):

In `src/settings/SettingsTab.ts`, add after the word-count goals section:
```typescript
new Setting(containerEl)
  .setName('Dashboard color mode')
  .setDesc('Color palette for the Stats tab')
  .addDropdown((dropdown) =>
    dropdown
      .addOption('warm', 'Warm (pink / yellow / orange)')
      .addOption('cool', 'Cool (blue / cyan / green)')
      .setValue(this.plugin.settings.dashboardColorMode)
      .onChange(async (value: string) => {
        if (value === 'warm' || value === 'cool') {
          this.plugin.settings.dashboardColorMode = value;
          await this.plugin.saveSettings();
          this.plugin.petView?.updateStatsComponent(); // re-reads settings.dashboardColorMode
        }
      })
  );
```

**`tests/mocks/obsidian.ts` additions** (done in this task, not deferred):
- `export const setIcon = vi.fn()`
- `workspace.getActiveViewOfType: vi.fn().mockReturnValue(null)`
- `workspace.registerEvent: vi.fn()` on the mock ItemView (so `this.registerEvent()` doesn't throw in tests)
- `metadataCache: { getFileCache: vi.fn().mockReturnValue(null) }` on mock App

---

**Task 7 — `styles.css`** ✅ DONE

Append at end:
```css
/* PetView tab bar */
.workspace-leaf-content[data-type="obsidian-pets-pet-view"] .view-content {
  display: flex;
  flex-direction: column;
  padding: 0 !important; /* Override existing 3px padding */
}
.vp-tab-bar {
  display: flex;
  border-bottom: 1px solid var(--background-modifier-border);
  padding: 0 8px;
  flex-shrink: 0;
}
.vp-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--text-muted);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  user-select: none;
  transition: color 0.15s ease;
}
.vp-tab:hover { color: var(--text-normal); }
.vp-tab.is-active { color: var(--text-normal); border-bottom-color: var(--interactive-accent); }
.vp-tab svg { width: 14px; height: 14px; }
.obsidian-pets-panel { flex: 1; min-height: 0; overflow: hidden; }
.vp-panel-hidden { display: none !important; }
```

---

### Phase D — Tests

**Task 8 — Tests (three files)** ✅ DONE

**`tests/unit/CelebrationService.test.ts`** — extend existing:
- Extend `MockPlugin.dailyWordData` with 3 new fields (all `0`).
- `describe('activity counter tracking')`:
  - `notesCreatedToday` increments for markdown files even with `onNoteCreate: false`
  - Non-markdown file creation does NOT increment counter (reset also does not fire)
  - `tasksCompletedToday` increments by delta (paste case: 3 tasks checked → counter +3)
  - `updateStatsComponent()` is called on the mock `petView` after each counter increment
- `describe('midnight reset via non-word events')`:
  - Note creation with stale date resets all counters then increments `notesCreatedToday` to 1
  - Task completion with stale date resets all counters then increments `tasksCompletedToday`
  - Non-markdown file creation with stale date does NOT reset (reset is after the markdown guard)

**`tests/unit/stats-utils.test.ts`** — new, tests `computeRingData`:
- Daily progress capped at 1.0 when `wordsAddedToday > dailyWordGoal`
- File progress capped at 1.0
- `showOuterRing` false when `dailyWordGoal` is null
- `showOuterRing` false when `dailyWordGoal` is 0
- `showInnerCircle` false when `fileWordGoal` is null
- `showRingSection` false when both are null
- `outerOffset` equals `CIRCUMFERENCE` at 0% progress (fully offset = empty ring)
- `outerOffset` equals 0 at 100% progress (no offset = full ring)

**`tests/unit/PetView.test.ts`** — extend existing:
- Tab bar renders `.vp-tab-pet` and `.vp-tab-stats` after `onOpen`
- Clicking `.vp-tab-stats` adds `vp-panel-hidden` to pet panel, removes from stats panel
- Pet component is NOT destroyed when switching to Stats tab
- `statsComponent.$destroy` is called in `onClose`
- `updateStatsComponent()` calls `statsComponent.$set`

No Stats.svelte mock file. No new vitest alias. `computeRingData` is tested directly via `stats-utils.test.ts`.

---

## Data Flow Summary

| Event | Path |
|---|---|
| User types | `editor-change` (100ms) → CelebrationService updates `wordsAddedToday` → `petView?.updateStatsComponent()` direct call → outer ring updates |
| User creates note | `vault.create` → `isMarkdown` check → `resetDailyStatsIfNeeded()` → `notesCreatedToday++` → `saveSettings()` → `petView?.updateStatsComponent()` → tally updates |
| Midnight crossing | First markdown event → `resetDailyStatsIfNeeded()` zeroes all 6 counters → increments the triggering counter to 1 |
| Switch to Stats tab | `switchTab('stats')` → `updateStatsComponent()` reads fresh props → correct initial state |
| Settings color mode change | `SettingsTab.onChange` → `saveSettings()` → `petView?.updateStatsComponent()` → `buildStatsProps()` re-reads `dashboardColorMode` → `data-color-mode` attribute updates |

---

## Risk Summary

| Risk | Severity | Mitigation |
|---|---|---|
| `clipPath` ID empty at render time → two instances collide | Medium | `{#if showInnerCircle && instanceId}` guard ensures clipPath only renders after `onMount` — both the definition and its reference are inside the same `{#if}` |
| `view-content` padding override breaks pet layout | Low | Pet uses `position: absolute` internally; 36px tab bar height reduces the walkable area only slightly |
| `getPlugin()` returns null (undocumented API) | Low | `buildStatsProps` and `updateStatsComponent` both null-check `this.plugin`; Stats shows empty state gracefully |
| `active-leaf-change` fires for non-stats-tab leaf switches | Low | `if (this.activeTab === 'stats')` guard limits work to visible tab only |
