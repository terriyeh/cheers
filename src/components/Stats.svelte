<script lang="ts">
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { computeRingData, INNER_RADIUS, CIRCUMFERENCE } from '../utils/stats-utils';

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
  export let ringWidthPercent: number = 80;

  $: ring = computeRingData(wordsAddedToday, dailyWordGoal, fileWordCount, fileWordGoal);

  // Inner circle radius: 80% of outer ring so they read as one concentric object.
  $: innerRadius = ring.showOuterRing ? Math.round(INNER_RADIUS * 0.80) : INNER_RADIUS;

  // Outer ring: tweened stroke-dashoffset (JS tween is theme-independent).
  const outerOffsetTween = tweened(CIRCUMFERENCE, { duration: 300, easing: cubicOut });
  $: outerOffsetTween.set(ring.outerOffset);

  // Inner circle: pie-chart fill via thick-stroke technique.
  // A circle at r=innerRadius/2 with stroke-width=innerRadius covers a filled disk of radius innerRadius.
  // Circumference = 2π × (innerRadius/2) = π × innerRadius.
  // stroke-dashoffset sweeps clockwise from 12 o'clock, consistent with the outer ring.
  $: innerCircumference = Math.PI * innerRadius;
  const innerOffsetTween = tweened(Math.PI * INNER_RADIUS, { duration: 300, easing: cubicOut });
  $: innerOffsetTween.set(innerCircumference * (1 - ring.fileProgress));

  $: anyColumnVisible = showNotesColumn || showLinksColumn || showTasksColumn;
  $: showEmptyState = !ring.showRingSection && !anyColumnVisible;
</script>

<div class="vp-stats" data-color-mode={colorMode}>

  {#if ring.showRingSection}
    <div class="vp-stats-rings" style="width: {ringWidthPercent}%">

      {#if ring.showInnerCircle && fileWordGoal !== null}
        <p class="vp-stats-label">File goal: {fileWordCount ?? 0}/{fileWordGoal} words</p>
      {/if}

      <svg viewBox="0 0 200 200" class="vp-stats-svg" aria-hidden="true">

        {#if ring.showOuterRing}
          <circle cx="100" cy="100" r={INNER_RADIUS}
            fill="none" stroke="var(--vp-ring-color)"
            stroke-width="12" opacity="0.15" />
          <circle cx="100" cy="100" r={INNER_RADIUS}
            fill="none" stroke="var(--vp-ring-color)"
            stroke-width="12" stroke-linecap="round"
            stroke-dasharray={CIRCUMFERENCE}
            stroke-dashoffset={$outerOffsetTween}
            transform="rotate(-90 100 100)" />
        {/if}

        {#if ring.showInnerCircle}
          <!-- Background disk (dim) -->
          <circle cx="100" cy="100" r={innerRadius}
            fill="var(--vp-ring-color)" opacity="0.15" />
          <!-- Pie-fill disk: thick stroke sweeps clockwise from 12 o'clock -->
          <circle cx="100" cy="100" r={innerRadius / 2}
            fill="none"
            stroke="var(--vp-ring-color)"
            stroke-width={innerRadius}
            stroke-dasharray={innerCircumference}
            stroke-dashoffset={$innerOffsetTween}
            transform="rotate(-90 100 100)" />
        {/if}

      </svg>

      {#if ring.showOuterRing && dailyWordGoal !== null}
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

<style>
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

  .vp-stats-rings {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 16px;
  }

  /* SVG fills its container; container width is controlled by ringWidthPercent prop */
  .vp-stats-svg { width: 100%; height: auto; }

  .vp-stats-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-align: center;
    margin: 4px 0;
  }

  .vp-stats-tallies {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 24px;
    width: 100%;
    margin-top: 8px;
  }

  .vp-tally-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 60px;
  }

  .vp-tally-count { font-size: 2rem; font-weight: 700; line-height: 1; margin-bottom: 4px; }
  .vp-tally-label { font-size: 0.72rem; color: var(--text-muted); text-align: center; line-height: 1.3; }

  .vp-tally-notes .vp-tally-count { color: var(--vp-notes-color); }
  .vp-tally-links .vp-tally-count { color: var(--vp-links-color); }
  .vp-tally-tasks .vp-tally-count { color: var(--vp-tasks-color); }

  .vp-stats-empty { font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 16px; }
</style>
