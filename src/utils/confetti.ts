/**
 * Confetti rain particle spawner
 *
 * Spawns CSS-animated confetti particles directly into a container element.
 * All motion is handled by the `@keyframes vp-confetti-fall` rule defined in
 * styles.css — no JS animation loop and no injected <style> tags.
 *
 * @see src/components/Pet.svelte - imports and calls spawnConfettiRain()
 * @see src/utils/celebration-constants.ts - CONFETTI_COUNT, CONFETTI_CLEANUP_GRACE_MS
 * @see styles.css - vp-confetti-fall keyframes and .vp-confetti-particle rules
 */

import { CELEBRATION_OVERLAY_CONSTANTS } from './celebration-constants';

/** Cheerful, theme-independent particle color palette */
const CONFETTI_COLORS = ['#ff6abc', '#fbc534', '#4f3cf8', '#f68217', '#57bbff', '#ff3131'] as const;

/** Particle shape variants (matched by CSS [data-shape] selectors in styles.css) */
const CONFETTI_SHAPES = ['square', 'rect', 'circle'] as const;

/** Tracks active cleanup timeout so rapid re-triggers cancel the previous one */
let confettiCleanupId: ReturnType<typeof setTimeout> | null = null;

/**
 * Cancel any in-flight confetti cleanup timer.
 * Call from Pet.svelte's onDestroy to prevent the setTimeout from firing
 * against already-detached DOM nodes after the component is torn down.
 */
export function cancelConfettiCleanup(): void {
  if (confettiCleanupId !== null) {
    clearTimeout(confettiCleanupId);
    confettiCleanupId = null;
  }
}

/**
 * Spawn confetti rain particles into the given container element.
 *
 * Each particle is a `<div class="vp-confetti-particle">` with CSS custom properties
 * controlling its color, horizontal start position, fall speed, initial rotation, and
 * animation delay. The CSS `@keyframes vp-confetti-fall` (defined in styles.css)
 * drives all motion — no JS animation loop is used.
 *
 * Cancels any in-progress cleanup before spawning, so rapid re-triggers
 * (celebration → walking → celebration within 4820ms) replace rather than accumulate.
 *
 * @param container - Element to append particles into. Must have position:relative and
 *   overflow:hidden so particles are scoped and clipped (pet-sprite-container qualifies).
 * @param durationMs - How long the celebration lasts; particles are removed after
 *   durationMs + CONFETTI_CLEANUP_GRACE_MS.
 */
export function spawnConfettiRain(container: HTMLElement, durationMs: number): void {
  const { CONFETTI_COUNT, CONFETTI_CLEANUP_GRACE_MS } = CELEBRATION_OVERLAY_CONSTANTS;

  // Cancel any pending cleanup and remove leftover particles from a previous run
  if (confettiCleanupId !== null) {
    clearTimeout(confettiCleanupId);
    confettiCleanupId = null;
  }
  container.querySelectorAll('.vp-confetti-particle').forEach(p => p.remove());

  const particles: HTMLElement[] = [];

  for (let i = 0; i < CONFETTI_COUNT; i++) {
    const el = document.createElement('div');
    el.className = 'vp-confetti-particle';

    // Cycle through palette colors deterministically so all colors appear
    el.style.setProperty('--color', CONFETTI_COLORS[i % CONFETTI_COLORS.length]);
    // Linear distribution across full container width
    el.style.setProperty('--left', `${(i / CONFETTI_COUNT) * 100}%`);
    // Negative delay = particle starts mid-fall immediately (no uniform top-start burst)
    el.style.setProperty('--delay', `${-(Math.random() * 3)}s`);
    // Varied fall speeds for organic feel
    el.style.setProperty('--duration', `${2.5 + Math.random() * 2}s`);
    // Random initial tumble angle
    el.style.setProperty('--rot-z', `${Math.random() * 360}deg`);
    // Shape variants styled by CSS [data-shape] attribute selectors
    el.dataset.shape = CONFETTI_SHAPES[Math.floor(Math.random() * CONFETTI_SHAPES.length)];

    container.appendChild(el);
    particles.push(el);
  }

  confettiCleanupId = setTimeout(() => {
    particles.forEach(p => p.remove());
    confettiCleanupId = null;
  }, durationMs + CONFETTI_CLEANUP_GRACE_MS);
}
