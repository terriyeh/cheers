<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import type { PetState } from '../types/pet';
  import {
    ANIMATION_CONSTANTS,
    clampMovementSpeed,
    calculateSpeedInPixelsPerSecond,
  } from '../utils/animation';
  import { PET_SPRITES, BACKGROUNDS } from '../utils/asset-paths';
  import { CELEBRATION_OVERLAY_CONSTANTS } from '../utils/celebration-constants';
  import { spawnConfettiRain, cancelConfettiCleanup } from '../utils/confetti';

  /**
   * Current state of the pet
   */
  export let state: PetState = 'walking';

  /**
   * Path to the walking sprite GIF (passed from PetView)
   */
  export let walkingSpritePath: string = `assets/${PET_SPRITES.WALKING}`;

  /**
   * Path to the petting sprite GIF (passed from PetView)
   */
  export let pettingSpritePath: string = `assets/${PET_SPRITES.PETTING}`;

  /**
   * Path to the celebration sprite GIF (passed from PetView)
   */
  export let celebrationSpritePath: string = `assets/${PET_SPRITES.CELEBRATING}`;

  /**
   * Path to the background scene (passed from PetView)
   */
  export let backgroundPath: string = '';

  /**
   * Sky fill color matching the current background scene (passed from PetView).
   * Fills the container above the tiled GIF so the sky extends seamlessly upward.
   */
  export let backgroundColor: string = BACKGROUNDS.DAY.skyColor;

  /**
   * Pet's name (from settings)
   */
  export let petName: string = 'Kit';

  /**
   * Movement speed (0-100) from settings
   */
  export let movementSpeed: number = 50;

  // Event dispatcher for 'pet' event
  const dispatch = createEventDispatcher<{ pet: { returnToState: PetState } }>();

  // Container element for resize observation
  let containerEl: HTMLElement | null = null;
  let resizeObserver: ResizeObserver | null = null;

  // Fixed display width for consistent sizing
  const petWidth = ANIMATION_CONSTANTS.PET_DISPLAY_SIZE;

  /**
   * Select the appropriate sprite GIF based on current state
   * Each state has its own GIF animation
   * Walking: cat-walking-6fps.gif
   * Petting: cat-petting-6fps.gif
   * Celebration: cat-celebrating-6fps.gif
   */
  $: petSpritePath = state === 'celebration'
    ? celebrationSpritePath
    : state === 'petting'
    ? pettingSpritePath
    : walkingSpritePath;

  /**
   * Clamp movement speed to valid range (0-100)
   */
  $: clampedSpeed = clampMovementSpeed(movementSpeed);

  /**
   * Calculate base speed in pixels per second using reference container width
   * This ensures consistent movement speed regardless of actual container size
   * Uses fixed 100px display width for calculations (PET_DISPLAY_SIZE)
   */
  $: speedInPixelsPerSecond = calculateSpeedInPixelsPerSecond(clampedSpeed, petWidth);

  // Movement duration will be calculated dynamically based on actual container width
  let movementDuration = 15; // Default fallback value

  /**
   * Calculate movement range for adaptive edge-to-edge movement
   * Also calculates duration based on constant speed to maintain consistent px/s across window sizes
   * Uses fixed 100px display width for boundary calculations (PET_DISPLAY_SIZE)
   */
  function updateMovementRange(): void {
    if (!containerEl) return;

    const containerWidth = containerEl.offsetWidth;

    // Maximum left position (container width - pet width)
    // This gives true edge-to-edge movement using fixed 100px display width
    const maxLeft = containerWidth - petWidth;

    // Calculate duration to maintain constant speed in px/s
    // Linear speed scaling: duration = distance / speed
    // Ensures movement speed (px/s) is consistent regardless of container width
    // Prevent division by zero - fallback to slowest speed
    movementDuration = speedInPixelsPerSecond > 0 && maxLeft > 0
      ? maxLeft / speedInPixelsPerSecond
      : ANIMATION_CONSTANTS.MAX_DURATION;

    // Set CSS custom properties for keyframes and positioning
    containerEl.style.setProperty('--container-width', `${containerWidth}px`);
    containerEl.style.setProperty('--max-left', `${maxLeft}px`);
    containerEl.style.setProperty('--movement-duration', `${movementDuration}s`);
    containerEl.style.setProperty('--pet-width', `${petWidth}px`);
    containerEl.style.setProperty('--pet-display-size', `${ANIMATION_CONSTANTS.PET_DISPLAY_SIZE}px`);
    containerEl.style.setProperty('--celebration-display-size', `${ANIMATION_CONSTANTS.CELEBRATION_DISPLAY_SIZE}px`);
  }

  /**
   * Debounce utility to prevent excessive calls during rapid events
   * @param fn - Function to debounce
   * @param delay - Delay in milliseconds
   */
  function debounce<T extends (...args: never[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
    let timeoutId: number | undefined;
    return (...args: Parameters<T>) => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => fn(...args), delay);
    };
  }

  // Debounced version of updateMovementRange (150ms delay for performance)
  const updateMovementRangeDebounced = debounce(updateMovementRange, 150);

  /**
   * Check if petting interaction is allowed in the current state
   * Only walking state allows petting (celebration and petting are temporary states)
   */
  function isPettingAllowed(currentState: PetState): boolean {
    return currentState === 'walking';
  }

  /**
   * Handle pet interaction (click or keyboard)
   * Dispatches 'pet' event with current state as returnToState
   */
  function handlePetInteraction(event: MouseEvent | KeyboardEvent): void {
    if (!pettingEnabled) return;
    event.preventDefault();

    // Remove focus on click to prevent visible focus ring
    if (event instanceof MouseEvent) {
      (event.currentTarget as HTMLElement)?.blur();
    }

    dispatch('pet', { returnToState: state });
  }

  /**
   * Handle keyboard interactions (Enter or Space)
   */
  function handleKeyDown(event: KeyboardEvent): void {
    if (!pettingEnabled) return;
    if (event.key === 'Enter' || event.key === ' ') {
      handlePetInteraction(event);
    }
  }

  /**
   * Handle touch interactions (mobile)
   * Dispatches 'pet' event on touchend to match click behavior
   */
  function handleTouchEnd(event: TouchEvent): void {
    if (!pettingEnabled) return;
    event.preventDefault();

    // Remove focus after touch to prevent visible focus ring
    (event.currentTarget as HTMLElement)?.blur();

    dispatch('pet', { returnToState: state });
  }

  // Reactive declarations for conditional interactivity
  $: pettingEnabled = isPettingAllowed(state);
  // Keep cursor as pointer during petting state (cooldown period)
  $: cursorStyle = (pettingEnabled || state === 'petting') ? 'pointer' : 'not-allowed';
  // Keep aria-disabled false during petting to prevent dimming
  $: ariaDisabled = !pettingEnabled && state !== 'petting';
  $: ariaLabel = pettingEnabled
    ? `Pet ${petName}`
    : `Pet ${petName} (currently busy)`;
  // Spawn confetti exactly once when entering celebration state.
  // prevState is a plain `let` variable — assigning inside $: does NOT trigger re-run
  // (Svelte 4 only tracks reactive dependencies at block entry, not plain let assignments).
  let prevState: PetState = 'walking';
  $: {
    if (state === 'celebration' && prevState !== 'celebration' && containerEl) {
      spawnConfettiRain(containerEl, CELEBRATION_OVERLAY_CONSTANTS.CELEBRATION_DURATION_MS);
    }
    prevState = state;
  }

  // Recalculate movement duration when speed changes
  // Maintains constant px/s speed across different container widths
  $: if (speedInPixelsPerSecond && containerEl) {
    updateMovementRange();
  }

  // Confetti rain is spawned by spawnConfettiRain() into containerEl on celebration entry.
  // Walking animation handled by GIF (browser-native frame animation)

  onMount(() => {
    // Initial update (not debounced for immediate positioning)
    updateMovementRange();

    // Watch for container resize with fallback for older browsers
    if (!containerEl) return;

    try {
      // Use debounced update for resize events to improve performance
      resizeObserver = new ResizeObserver(updateMovementRangeDebounced);
      resizeObserver.observe(containerEl);

      // Return cleanup function for ResizeObserver
      return () => {
        resizeObserver?.disconnect();
        resizeObserver = null;
      };
    } catch (error) {
      console.warn('ResizeObserver not supported, using window resize fallback', error);
      // Fallback: Use debounced update on window resize for performance
      window.addEventListener('resize', updateMovementRangeDebounced);

      // Return cleanup function for fallback
      return () => window.removeEventListener('resize', updateMovementRangeDebounced);
    } finally {
      // Fallback: if component mounts already in celebration state (e.g. restored session
      // or test harness passing state='celebration' as initial prop), containerEl is now
      // populated so spawn directly. prevState = 'celebration' prevents the $: block
      // from double-spawning if Svelte re-evaluates it after mount.
      if (state === 'celebration' && containerEl) {
        spawnConfettiRain(containerEl, CELEBRATION_OVERLAY_CONSTANTS.CELEBRATION_DURATION_MS);
        prevState = 'celebration';
      }
    }
  });

  onDestroy(() => {
    // Explicit cleanup to help garbage collection
    // ResizeObserver cleanup is handled by onMount return function
    // Cancel any in-flight confetti cleanup timer (prevents setTimeout firing on detached nodes)
    cancelConfettiCleanup();
    containerEl = null;
  });
</script>

<div
  class="pet-sprite-container"
  data-state={state}
  style:--movement-duration="{movementDuration}s"
  style:background-image={backgroundPath ? `url("${backgroundPath}")` : 'none'}
  style:background-color={backgroundColor}
  bind:this={containerEl}>
  <!-- Position wrapper handles horizontal movement -->
  <div class="pet-position-wrapper">
    <!-- Flip wrapper handles direction changes -->
    <div class="pet-flip-wrapper">
      <!-- Interactive pet sprite with keyboard and touch accessibility -->
      <div
        class="pet-sprite-wrapper"
        role="button"
        tabindex={pettingEnabled ? 0 : -1}
        aria-label={ariaLabel}
        aria-disabled={ariaDisabled}
        style:cursor={cursorStyle}
        on:click={handlePetInteraction}
        on:keydown={handleKeyDown}
        on:touchend={handleTouchEnd}>
        <!-- Animated GIF that changes based on state -->
        <!-- Walking: cat-walking-6fps.gif, Petting: cat-petting-6fps.gif -->
        <img
          class="pet-sprite"
          src={petSpritePath}
          alt={`Pet is ${state}`}
        />
      </div>
    </div>
  </div>

</div>

<style>
  .pet-sprite-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0;
    width: 100%; /* Fill parent width */
    height: 100%;
    position: relative;
    overflow: hidden; /* Contain pet within view */

    /* Background scene - tiled horizontally, no vertical scaling */
    /* Display size constrained to 400x400 per tile, tiles left-right, anchored to bottom */
    background-size: 400px 400px;
    background-position: bottom center;
    background-repeat: repeat-x;

    /* Sky fill color is set dynamically via style:background-color (see backgroundColor prop) */
  }

  /* Position wrapper handles horizontal movement */
  /* Anchored to bottom with offset to align pet with path center */
  /* Position cat on the road in the background, re-check when changing backgrounds */
  .pet-position-wrapper {
    position: absolute;
    bottom: 64px; /* Offset from bottom - aligns pet (100px) with center of background path */
    left: 0;
  }

  /* Flip wrapper handles direction changes */
  .pet-flip-wrapper {
    position: relative;
  }

  /* Interactive wrapper for pet sprite */
  .pet-sprite-wrapper {
    position: relative;
    transition: transform 0.1s ease;
    outline: none; /* Use focus-visible for keyboard focus only */
    touch-action: manipulation; /* Prevent double-tap zoom on mobile */
    -webkit-tap-highlight-color: transparent; /* Remove tap highlight on iOS */
  }

  /* Hover effect when enabled (but not during petting cooldown) */
  .pet-sprite-container:not([data-state='petting']) .pet-sprite-wrapper:not([aria-disabled="true"]):hover {
    transform: scale(1.05);
  }

  /* Active effect when enabled (but not during petting cooldown) */
  .pet-sprite-container:not([data-state='petting']) .pet-sprite-wrapper:not([aria-disabled="true"]):active {
    transform: scale(0.95);
  }

  /* Focus outline for keyboard navigation */
  .pet-sprite-wrapper:focus-visible {
    outline: 2px solid var(--interactive-accent);
    outline-offset: 4px;
    border-radius: 4px;
  }

  .pet-sprite {
    display: block;
    width: var(--pet-display-size, 100px); /* Fixed display width for consistent sizing (PET_DISPLAY_SIZE) */
    height: var(--pet-display-size, 100px); /* Fixed display height for consistent sizing (PET_DISPLAY_SIZE) */
    image-rendering: pixelated; /* Keep pixel art crisp */
    image-rendering: -moz-crisp-edges;
    image-rendering: crisp-edges;
  }

  /* GIF-based animation system */
  /* GIF handles frame animation internally - no CSS sprite sheet keyframes needed */
  /* Browser natively plays GIF frames, reducing CSS complexity */
  /* GIF changes based on state: walking or petting */
  /* Walking: cat-walking-6fps.gif, Petting: cat-petting-6fps.gif */
  /* Celebration uses confetti rain (CSS @keyframes via spawnConfettiRain) */

  /* Apply movement animations - pet moves continuously in all states */
  /* Movement speed is controlled by --movement-duration CSS variable */
  .pet-sprite-container .pet-position-wrapper {
    animation: move-back-and-forth var(--movement-duration, 15s) linear infinite;
    animation-delay: -7.5s; /* Fixed delay (midpoint of 20s-10s and 10s-4s ranges) */
  }

  .pet-sprite-container .pet-flip-wrapper {
    animation: flip-at-edges var(--movement-duration, 15s) steps(2, jump-both) infinite;
    animation-delay: -7.5s; /* Sync with position animation */
  }

  /* Pause pet movement during celebration and petting */
  /* During celebration: Pet freezes in place while fireworks display plays (4.32 seconds) */
  /* During petting: Pet pauses to enjoy being petted */
  /* @see CELEBRATION_OVERLAY_CONSTANTS in src/utils/celebration-constants.ts */
  .pet-sprite-container[data-state='celebration'] .pet-position-wrapper,
  .pet-sprite-container[data-state='celebration'] .pet-flip-wrapper,
  .pet-sprite-container[data-state='petting'] .pet-position-wrapper,
  .pet-sprite-container[data-state='petting'] .pet-flip-wrapper {
    animation-play-state: paused;
  }

  /* Movement: Full cycle with direction changes at edges (used for both walking and running) */
  @keyframes move-back-and-forth {
    0% {
      left: 0px; /* Left edge */
    }
    50% {
      /* Right edge - dynamically calculated, fallback uses CSS custom property */
      left: var(--max-left, calc(100% - var(--pet-width, 100px)));
    }
    100% {
      left: 0px; /* Back to left edge */
    }
  }

  @keyframes flip-at-edges {
    0%, 49.9% {
      transform: scaleX(-1); /* Facing left while moving left (0→50%) */
    }
    50%, 100% {
      transform: scaleX(1); /* Facing right while moving right (50→100%) */
    }
  }

  /* ── Confetti rain ──────────────────────────────────────────────────────────── */

  /*
   * :global() is REQUIRED here.
   * Particles are created via document.createElement() and appended directly to
   * containerEl — they are NOT rendered by Svelte's template. Svelte's scoped CSS
   * compiler adds a hash suffix (e.g. .vp-confetti-particle.svelte-abc123) to all
   * class selectors. Dynamically created elements never receive this hash attribute,
   * so without :global() these rules are silently ignored and particles are invisible.
   */
  :global(.vp-confetti-particle) {
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

  /* Shape variants */
  :global(.vp-confetti-particle[data-shape="circle"]) { width: 8px;  height: 8px;  border-radius: 50%; }
  :global(.vp-confetti-particle[data-shape="rect"])   { width: 12px; height: 5px;  border-radius: 1px; }
  :global(.vp-confetti-particle[data-shape="square"]) { width: 8px;  height: 8px;  border-radius: 1px; }

  /*
   * Sway pattern: fixed px lateral drift gives visible wobble independent of particle size.
   * translateX uses px NOT % — in CSS transforms, % is relative to the element's own
   * width, not the container. 5% of an 8px particle = 0.4px (imperceptible drift).
   * ±8–20px gives ~3–8% of a 250px sidebar width, which is visually meaningful.
   *
   * rotateZ only — rotateY omitted: a genuine Y-axis flip requires a perspective context
   * (perspective: Xpx on an ancestor). The sidebar has none, so rotateY produces a flat
   * horizontal-squish artifact and forces GPU compositing layers with zero visual payoff.
   *
   * No opacity animation — avoids the hard 0.3→1 flash at each loop boundary that occurs
   * when animation-iteration-count: infinite resets from 100% back to 0%.
   *
   * translateY uses px NOT % — same reason as translateX. 115% of a 10px particle = 11.5px
   * (imperceptible fall). Fixed px values (0→420px) travel the full container height.
   */
  /*
   * @keyframes vp-confetti-fall is intentionally NOT defined here.
   * Svelte 4 silently drops @keyframes rules inside :global{} block syntax —
   * only the animation reference is emitted, never the definition.
   * The keyframes are injected at runtime via ensureConfettiStyles() in
   * src/utils/confetti.ts, called at the start of every spawnConfettiRain() invocation.
   */
</style>
