<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import type { PetState } from '../types/pet';

  /**
   * Current state of the pet
   */
  export let state: PetState = 'walking';

  /**
   * Path to the pet sprite GIF (passed from PetView)
   */
  export let petSpritePath: string = 'assets/cat.gif';

  /**
   * Path to the heart sprite (passed from PetView)
   */
  export let heartSpritePath: string = 'assets/heart.png';

  /**
   * Path to the background scene (passed from PetView)
   */
  export let backgroundPath: string = '';

  /**
   * Path to celebration sprite sheet
   */
  export let celebrationSpritePath: string = '';

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

  // Sprite dimension detection (dynamically loaded from image)
  let spriteImgElement: HTMLImageElement | null = null;
  let spriteWidth = 128; // Default fallback
  let spriteHeight = 128; // Default fallback

  // Animation timing constants
  const MAX_DURATION = 33; // Slowest speed (0%)
  const MIN_DURATION = 6; // Fastest speed (100%)
  const REFERENCE_CONTAINER_WIDTH = 800; // Reference width for speed calibration (pixels)

  // Reactive pet width based on loaded sprite dimensions
  $: petWidth = spriteWidth;

  /**
   * Clamp movement speed to valid range (0-100)
   */
  $: clampedSpeed = Math.max(0, Math.min(100, movementSpeed));

  /**
   * Calculate animation duration based on movement speed
   * Linear scaling: 0% = 2s (slowest), 100% = 1s (fastest)
   */
  $: animationDuration = 2 - (clampedSpeed / 100);

  /**
   * Calculate base speed in pixels per second using reference container width
   * This ensures consistent movement speed regardless of actual container size
   * Linear scaling: speed 0% = 33s (slowest), speed 100% = 6s (fastest)
   * Uses dynamically detected sprite width for accurate calculations
   */
  $: referenceDistance = REFERENCE_CONTAINER_WIDTH - petWidth;
  $: referenceDuration = MAX_DURATION - (clampedSpeed / 100) * (MAX_DURATION - MIN_DURATION);
  $: speedInPixelsPerSecond = referenceDistance / referenceDuration;

  // Movement duration will be calculated dynamically based on actual container width
  let movementDuration = 15; // Default fallback value

  /**
   * Handle sprite image load - detect dimensions dynamically
   * This allows any sprite size to work without manual configuration
   */
  function handleSpriteLoad(): void {
    if (spriteImgElement) {
      spriteWidth = spriteImgElement.naturalWidth;
      spriteHeight = spriteImgElement.naturalHeight;

      // Recalculate movement range with new sprite dimensions
      updateMovementRange();
    }
  }

  /**
   * Calculate movement range for adaptive edge-to-edge movement
   * Also calculates duration based on constant speed to maintain consistent px/s across window sizes
   * Uses dynamically detected sprite width for accurate boundary calculations
   */
  function updateMovementRange(): void {
    if (!containerEl) return;

    const containerWidth = containerEl.offsetWidth;

    // Maximum left position (container width - pet width)
    // This gives true edge-to-edge movement using dynamically detected sprite width
    const maxLeft = containerWidth - petWidth;

    // Calculate actual distance for this container
    const actualDistance = maxLeft;

    // Calculate duration to maintain constant speed in px/s
    // duration = distance / speed
    movementDuration = actualDistance / speedInPixelsPerSecond;

    // Set CSS custom properties for keyframes and positioning
    containerEl.style.setProperty('--container-width', `${containerWidth}px`);
    containerEl.style.setProperty('--max-left', `${maxLeft}px`);
    containerEl.style.setProperty('--movement-duration', `${movementDuration}s`);
    containerEl.style.setProperty('--pet-width', `${petWidth}px`);
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
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => fn(...args), delay) as unknown as number;
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
  $: showHeart = state === 'petting';
  $: showCelebration = state === 'celebration';

  // Recalculate movement duration when speed changes
  $: if (speedInPixelsPerSecond && containerEl) {
    updateMovementRange();
  }

  // Celebration animation handled by CSS sprite sheet animation

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
    }
  });

  onDestroy(() => {
    // Explicit cleanup to help garbage collection
    // ResizeObserver cleanup is handled by onMount return function
    // Note: Celebration animation handled entirely by CSS, no interval needed
    containerEl = null;
  });

  // Sprite sheet is now handled entirely by CSS
  // No need for emoji fallback once sprite sheet is placed in assets/
</script>

<div
  class="pet-sprite-container"
  data-state={state}
  style:--animation-duration="{animationDuration}s"
  style:--movement-duration="{movementDuration}s"
  style:background-image={backgroundPath ? `url(${backgroundPath})` : 'none'}
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
        <!-- Animated GIF with dynamic dimension detection -->
        <!-- Image renders at natural size; dimensions detected for calculations only -->
        <img
          bind:this={spriteImgElement}
          on:load={handleSpriteLoad}
          class="pet-sprite"
          src={petSpritePath}
          alt={`Pet is ${state}`}
        />

        <!-- Heart overlay during petting state -->
        {#if showHeart}
          <div class="heart-overlay" aria-hidden="true">
            <img src={heartSpritePath} alt="" />
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Celebration overlay - top third, horizontally centered -->
  {#if showCelebration}
    <div class="celebration-overlay" aria-hidden="true">
      <div
        class="celebration-sprite"
        style:background-image="url({celebrationSpritePath})"
      />
    </div>
  {/if}
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
    /* Maintains natural image dimensions, tiles left-right, anchored to bottom */
    background-size: auto auto;
    background-position: bottom center;
    background-repeat: repeat-x;

    /* Light neutral color fills space above background */
    background-color: #f5f3ef;
  }

  /* Position wrapper handles horizontal movement */
  /* Anchored to bottom with offset to align pet with path center */
  /* Position cat on the road in the background, re-check when changing backgrounds */
  .pet-position-wrapper {
    position: absolute;
    bottom: 64px; /* Offset from bottom - aligns with center of 128px background */
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

  /* Disabled state appearance - but not during sleeping */
  .pet-sprite-container:not([data-state='sleeping']) .pet-sprite-wrapper[aria-disabled="true"] {
    opacity: 0.7;
  }

  .pet-sprite {
    /* Width and height set dynamically via inline styles based on loaded image dimensions */
    display: block;
    image-rendering: pixelated; /* Keep pixel art crisp */
    image-rendering: -moz-crisp-edges;
    image-rendering: crisp-edges;
  }

  /* Heart overlay positioned top-right diagonal */
  .heart-overlay {
    position: absolute;
    top: -8px;
    right: -8px;
    z-index: 10;
    animation: floatUp 2s ease-out forwards;
    pointer-events: none;
  }

  .heart-overlay img {
    width: 32px;
    height: 32px;
    display: block;
  }

  /* Float upward animation for heart - fades out while rising */
  @keyframes floatUp {
    0% {
      opacity: 0;
      transform: translateY(0) scale(0.8);
    }
    15% {
      opacity: 1;
      transform: translateY(-5px) scale(1);
    }
    100% {
      opacity: 0;
      transform: translateY(-40px) scale(1.1);
    }
  }

  /* GIF-based animations */
  /* GIF handles frame animation internally - no CSS keyframes needed */
  /* Future: Different GIF files for celebration and petting states */
  /* For now, all states use the same walking.gif */

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

  /* Movement: Full cycle with direction changes at edges (used for both walking and running) */
  @keyframes move-back-and-forth {
    0% {
      left: 0px; /* Left edge */
    }
    50% {
      /* Right edge - dynamically calculated, fallback uses CSS custom property */
      left: var(--max-left, calc(100% - var(--pet-width, 128px)));
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

  /* Celebration overlay - top third, horizontally centered */
  .celebration-overlay {
    position: absolute;
    top: 16.66%; /* Top third = 33.33% / 2 */
    left: 50%;
    transform: translateX(-50%);
    z-index: 20; /* Above pet */
    pointer-events: none;
  }

  .celebration-sprite {
    width: 128px;
    height: 128px;
    background-size: 896px 128px; /* 7 frames × 128px = 896px width, 128px height */
    background-repeat: no-repeat;
    image-rendering: auto; /* Smooth rendering for celebration effects */
    animation: celebration-animation 1.8s steps(7) 1;
  }

  @keyframes celebration-animation {
    from { background-position: 0 0; }
    to { background-position: -896px 0; } /* 7 frames × 128px */
  }
</style>
