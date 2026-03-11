<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import type { PetState } from '../types/pet';
  import {
    ANIMATION_CONSTANTS,
    clampMovementSpeed,
  } from '../utils/animation';
  import { PET_SPRITES, BACKGROUNDS, type Background } from '../utils/asset-paths';
  import { CELEBRATION_OVERLAY_CONSTANTS } from '../utils/celebration-constants';
  import { spawnConfettiRain, cancelConfettiCleanup } from '../utils/confetti';

  /**
   * Current state of the pet
   */
  export let state: PetState = 'walking';

  /**
   * Path to the walking sprite GIF (passed from PetView)
   */
  export let walkingSpritePath: string = PET_SPRITES.WALKING;

  /**
   * Path to the petting sprite GIF (passed from PetView)
   */
  export let pettingSpritePath: string = PET_SPRITES.PETTING;

  /**
   * Path to the celebration sprite GIF (passed from PetView)
   */
  export let celebrationSpritePath: string = PET_SPRITES.CELEBRATING;

  /**
   * Path to the background scene (passed from PetView)
   */
  export let backgroundPath: string = '';

  /**
   * Background scene data — drives sky color, tile size, and pet walk offset.
   * Path construction is handled by PetView (platform-specific); only scene
   * metadata lives here so all values travel together and stay in sync.
   */
  export let background: Background = BACKGROUNDS.DAY;

  /**
   * Pet's name (from settings)
   */
  export let petName: string = 'Mochi';

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

  // Baseline duration (seconds) set at init and after each container resize.
  // Speed changes use playbackRate relative to this baseline instead of changing
  // animation-duration — changing duration while an animation is running clips
  // currentTime to the new duration if it exceeds it, causing the visible jump.
  let movementBaseDurationS = 0;
  // Last measured maxLeft; changing this means the container was resized.
  let movementLastMaxLeft = -1;

  /**
   * Update layout and movement speed.
   *
   * px/s model: speedPxPerS = MIN + (clampedSpeed/100) × (MAX − MIN)
   *             durationS   = maxLeft / speedPxPerS
   *
   * On first call / resize → set --movement-duration, start at midpoint via
   *   --animation-delay, reset playbackRate to 1.
   *
   * On speed-only change → only adjust playbackRate = baseDuration / durationS.
   *   The CSS animation-duration stays fixed; playbackRate scales how fast it plays
   *   without touching the timing model, so position is always preserved.
   */
  function updateMovementRange(): void {
    if (!containerEl) return;
    const containerWidth = containerEl.offsetWidth;
    const maxLeft = containerWidth - petWidth;
    if (maxLeft <= 0) return;

    const { MIN_SPEED_PX_PER_S, MAX_SPEED_PX_PER_S } = ANIMATION_CONSTANTS;
    const speedPxPerS = MIN_SPEED_PX_PER_S + (clampedSpeed / 100) * (MAX_SPEED_PX_PER_S - MIN_SPEED_PX_PER_S);
    const durationS = maxLeft / speedPxPerS;

    containerEl.style.setProperty('--container-width', `${containerWidth}px`);
    containerEl.style.setProperty('--max-left', `${maxLeft}px`);
    containerEl.style.setProperty('--pet-width', `${petWidth}px`);
    containerEl.style.setProperty('--pet-display-size', `${ANIMATION_CONSTANTS.PET_DISPLAY_SIZE}px`);
    containerEl.style.setProperty('--celebration-display-size', `${ANIMATION_CONSTANTS.CELEBRATION_DISPLAY_SIZE}px`);

    const posAnim = containerEl.querySelector<HTMLElement>('.pet-position-wrapper')?.getAnimations()[0];
    const flipAnim = containerEl.querySelector<HTMLElement>('.pet-flip-wrapper')?.getAnimations()[0];

    if (maxLeft !== movementLastMaxLeft || !posAnim || !flipAnim) {
      // First call or resize: set a fresh duration and midpoint start, reset rate to 1.
      containerEl.style.setProperty('--movement-duration', `${durationS}s`);
      containerEl.style.setProperty('--animation-delay', `${-(durationS / 2)}s`);
      if (posAnim) posAnim.playbackRate = 1;
      if (flipAnim) flipAnim.playbackRate = 1;
      movementBaseDurationS = durationS;
      movementLastMaxLeft = maxLeft;
      return;
    }

    // Speed-only change: scale playbackRate, leave animation-duration untouched.
    const rate = movementBaseDurationS / durationS;
    posAnim.playbackRate = rate;
    flipAnim.playbackRate = rate;
  }

  // Re-run whenever speed changes (resize is handled by ResizeObserver).
  // The void reference makes clampedSpeed a tracked reactive dependency.
  $: { void clampedSpeed; updateMovementRange(); }

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

  // Confetti rain is spawned by spawnConfettiRain() into containerEl on celebration entry.
  // Walking animation handled by GIF (browser-native frame animation)

  onMount(() => {
    // Initial update (not debounced for immediate positioning)
    updateMovementRange();

    // Watch for container resize with fallback for older browsers
    if (!containerEl) return;

    let cleanup: (() => void) | undefined;
    try {
      // Use debounced update for resize events to improve performance
      resizeObserver = new ResizeObserver(updateMovementRangeDebounced);
      resizeObserver.observe(containerEl);
      cleanup = () => {
        resizeObserver?.disconnect();
        resizeObserver = null;
      };
    } catch (error) {
      console.warn('ResizeObserver not supported, using window resize fallback', error);
      // Disconnect any partially-constructed observer before falling back
      resizeObserver?.disconnect();
      resizeObserver = null;
      window.addEventListener('resize', updateMovementRangeDebounced);
      cleanup = () => window.removeEventListener('resize', updateMovementRangeDebounced);
    }

    // Handle initial celebration state: containerEl is now populated so spawn directly.
    // prevState = 'celebration' prevents the $: reactive block from double-spawning
    // if Svelte re-evaluates it after mount (e.g. restored session or test harness
    // passing state='celebration' as initial prop).
    if (state === 'celebration' && containerEl) {
      spawnConfettiRain(containerEl, CELEBRATION_OVERLAY_CONSTANTS.CELEBRATION_DURATION_MS);
      prevState = 'celebration';
    }

    return cleanup;
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
  style:--pet-bottom="{background.petBottom}px"
  style:background-image={backgroundPath ? `url("${backgroundPath.replace(/"/g, '%22')}")` : 'none'}
  style:background-color={background.skyColor}
  style:background-size="{background.displayWidth}px {background.displayHeight}px"
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
    /* background-size and --pet-bottom driven by Background data via style: directives */
    background-position: bottom center;
    background-repeat: repeat-x;
  }

  /* Position wrapper handles horizontal movement */
  /* bottom offset driven by background.petBottom via --pet-bottom CSS custom property */
  .pet-position-wrapper {
    position: absolute;
    bottom: var(--pet-bottom, 10px);
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
    animation-delay: var(--animation-delay, -7.5s);
  }

  .pet-sprite-container .pet-flip-wrapper {
    animation: flip-at-edges var(--movement-duration, 15s) steps(2, jump-both) infinite;
    animation-delay: var(--animation-delay, -7.5s); /* Sync with position animation */
  }

  /* Pause pet movement during celebration and petting */
  /* During celebration: Pet freezes in place while confetti rain plays (5 seconds) */
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

  /* Confetti rain styles are defined in styles.css (.vp-confetti-particle + @keyframes vp-confetti-fall) */
</style>
