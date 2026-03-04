/**
 * Confetti rain particle spawner
 *
 * Spawns CSS-animated confetti particles directly into a container element.
 * All motion is handled by a CSS @keyframes animation — no JS animation loop.
 *
 * @see src/components/Pet.svelte - imports and calls spawnConfettiRain()
 * @see src/utils/celebration-constants.ts - CONFETTI_COUNT, CONFETTI_CLEANUP_GRACE_MS
 */

import { CELEBRATION_OVERLAY_CONSTANTS } from './celebration-constants';

/** Cheerful, theme-independent particle color palette */
const CONFETTI_COLORS = ['#f2d74e', '#ff9a91', '#a8e6cf', '#95c3de', '#c8b8f8', '#ffb347'] as const;

/** Particle shape variants (matched by CSS [data-shape] selectors in Pet.svelte) */
const CONFETTI_SHAPES = ['square', 'rect', 'circle'] as const;

/** Tracks active cleanup timeout so rapid re-triggers cancel the previous one */
let confettiCleanupId: ReturnType<typeof setTimeout> | null = null;

/**
 * Inject the confetti @keyframes definition into document.head on first call.
 *
 * Why here and not in Pet.svelte's <style> block:
 * Svelte 4 silently drops @keyframes rules inside `:global { }` block syntax —
 * only the animation *reference* is emitted, never the *definition*.
 * Injecting a plain <style> tag bypasses Svelte's CSS scoping pipeline entirely.
 */
const CONFETTI_STYLE_ID = 'vp-confetti-keyframes';
function ensureConfettiStyles(): void {
  if (document.getElementById(CONFETTI_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = CONFETTI_STYLE_ID;
  style.textContent = `
@keyframes vp-confetti-fall {
  0%   { transform: translateX(0)     translateY(0)      rotateZ(var(--rot-z));                }
  25%  { transform: translateX(-15px) translateY(100px)  rotateZ(calc(var(--rot-z) + 90deg));  }
  50%  { transform: translateX(10px)  translateY(210px)  rotateZ(calc(var(--rot-z) + 180deg)); }
  75%  { transform: translateX(-20px) translateY(310px)  rotateZ(calc(var(--rot-z) + 270deg)); }
  100% { transform: translateX(8px)   translateY(420px)  rotateZ(calc(var(--rot-z) + 360deg)); }
}`;
  document.head.appendChild(style);
}

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
 * animation delay. The CSS `@keyframes vp-confetti-fall` (defined in Pet.svelte with
 * `:global()`) drives all motion — no JS animation loop is used.
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
  ensureConfettiStyles();
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
