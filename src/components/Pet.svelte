<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { PetState } from '../types/pet';

  /**
   * Current state of the pet
   */
  export let state: PetState = 'walking';

  /**
   * Path to the sprite sheet (passed from PetView)
   */
  export let spriteSheetPath: string = 'assets/pet-sprite-sheet.png';

  /**
   * Path to the heart sprite (passed from PetView)
   */
  export let heartSpritePath: string = 'assets/heart.png';

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

  /**
   * Calculate animation duration based on movement speed
   * Walking (0-60%): 2s to 1s
   * Running (61-100%): 1s to 0.4s
   */
  $: isRunning = movementSpeed > 60;
  $: animationDuration = isRunning
    ? 1 - ((movementSpeed - 60) / 40) * 0.6 // 1s to 0.4s
    : 2 - (movementSpeed / 60); // 2s to 1s

  /**
   * Check if petting interaction is allowed in the current state
   * Walking, running, and greeting states allow petting
   */
  function isPettingAllowed(currentState: PetState): boolean {
    return currentState === 'walking' || currentState === 'running' || currentState === 'greeting';
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

  // Sprite sheet is now handled entirely by CSS
  // No need for emoji fallback once sprite sheet is placed in assets/
</script>

<div class="pet-sprite-container" data-state={state} style:--animation-duration="{animationDuration}s">
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
        <!-- Sprite sheet animation -->
        <div
          class="pet-sprite"
          role="img"
          aria-label={`Pet is ${state}`}
          style:background-image="url({spriteSheetPath})">
          <!-- Sprite background set dynamically via style attribute -->
        </div>

        <!-- Heart overlay during petting state -->
        {#if showHeart}
          <div class="heart-overlay" aria-hidden="true">
            <img src={heartSpritePath} alt="" />
          </div>
        {/if}
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
    padding: 2rem;
    height: 100%;
    position: relative;
    overflow: hidden; /* Contain pet within view */
  }

  /* Position wrapper handles horizontal movement */
  .pet-position-wrapper {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
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

  /* Hover effect when enabled */
  .pet-sprite-wrapper:not([aria-disabled="true"]):hover {
    transform: scale(1.05);
  }

  /* Active effect when enabled */
  .pet-sprite-wrapper:not([aria-disabled="true"]):active {
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
    width: 64px; /* 2x scale of 32px frames */
    height: 64px;
    margin-bottom: 1rem;
    /* background-image set via inline style with correct plugin path */
    background-size: 896px 448px; /* 2x scale: 448*2 = 896, 224*2 = 448 */
    background-repeat: no-repeat;
    image-rendering: pixelated; /* Keep pixel art crisp */
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

  /* Sprite animations for each state */
  /* Note: All positions are 2x scale (64px instead of 32px) */
  /* Ordered by sprite row (top to bottom) for easier debugging */

  /* Row 1 (y=0): Idle - 5 frames (UNUSED - kept for reference) */
  /* .pet-sprite-container[data-state='idle'] .pet-sprite {
    animation: sprite-idle 1s steps(5) infinite;
  }
  @keyframes sprite-idle {
    from { background-position: 0 0; }
    to { background-position: -320px 0; }
  } */

  /* Row 2 (y=-64px): Greeting - 14 frames */
  .pet-sprite-container[data-state='greeting'] .pet-sprite {
    animation: sprite-greeting 1.4s steps(14) 1;
  }

  @keyframes sprite-greeting {
    from { background-position: 0 -64px; }
    to { background-position: -896px -64px; } /* 14 frames × 64px */
  }

  /* Row 3 (y=-128px): Walking - 8 frames (placeholder) */
  .pet-sprite-container[data-state='walking'] .pet-sprite {
    animation: sprite-walking var(--animation-duration, 1.5s) steps(8) infinite;
  }

  .pet-sprite-container[data-state='walking'] .pet-position-wrapper {
    animation: move-horizontal 5s linear infinite alternate;
  }

  .pet-sprite-container[data-state='walking'] .pet-flip-wrapper {
    animation: flip-horizontal 5s step-end infinite;
  }

  @keyframes sprite-walking {
    from { background-position: 0 -128px; }
    to { background-position: -512px -128px; } /* 8 frames × 64px (estimated) */
  }

  /* Row 4 (y=-192px): Running - 8 frames (placeholder) */
  .pet-sprite-container[data-state='running'] .pet-sprite {
    animation: sprite-running var(--animation-duration, 0.7s) steps(8) infinite;
  }

  .pet-sprite-container[data-state='running'] .pet-position-wrapper {
    animation: move-horizontal 3s linear infinite alternate;
  }

  .pet-sprite-container[data-state='running'] .pet-flip-wrapper {
    animation: flip-horizontal 3s step-end infinite;
  }

  @keyframes sprite-running {
    from { background-position: 0 -192px; }
    to { background-position: -512px -192px; } /* 8 frames × 64px (estimated) */
  }

  /* Row 5 (y=-256px): Celebration - 5 frames (was small-celebration) */
  .pet-sprite-container[data-state='celebration'] .pet-sprite {
    animation: sprite-celebration 0.5s steps(5) 1;
  }

  @keyframes sprite-celebration {
    from { background-position: 0 -256px; }
    to { background-position: -320px -256px; } /* 5 frames × 64px */
  }

  /* Row 6 (y=-320px): Sleeping - 6 frames (was petting) */
  .pet-sprite-container[data-state='sleeping'] .pet-sprite {
    animation: sprite-sleeping 0.6s steps(6) 1;
  }

  @keyframes sprite-sleeping {
    from { background-position: 0 -320px; }
    to { background-position: -384px -320px; } /* 6 frames × 64px */
  }

  /* Row 7 (y=-384px): Petting - 7 frames (was big-celebration) */
  .pet-sprite-container[data-state='petting'] .pet-sprite {
    animation: sprite-petting 0.7s steps(7) 1;
  }

  @keyframes sprite-petting {
    from { background-position: 0 -384px; }
    to { background-position: -448px -384px; } /* 7 frames × 64px */
  }

  /* Horizontal movement animation (percentage-based for adaptive width) */
  @keyframes move-horizontal {
    from {
      left: 5%;
    }
    to {
      left: 95%;
    }
  }

  /* Flip animation for direction changes */
  @keyframes flip-horizontal {
    0%, 49.99% {
      transform: scaleX(1); /* Facing right */
    }
    50%, 100% {
      transform: scaleX(-1); /* Facing left */
    }
  }
</style>
