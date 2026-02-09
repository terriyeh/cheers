<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { PetState } from '../types/pet';

  /**
   * Current state of the pet
   */
  export let state: PetState = 'idle';

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
   * User's name (from settings, optional)
   */
  export let userName: string = '';

  // Event dispatcher for 'pet' event
  const dispatch = createEventDispatcher<{ pet: { returnToState: PetState } }>();

  /**
   * Check if petting interaction is allowed in the current state
   * Only idle and greeting states allow petting
   */
  function isPettingAllowed(currentState: PetState): boolean {
    return currentState === 'idle' || currentState === 'greeting';
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

  /**
   * Get display text for current state
   */
  function getStateText(currentState: PetState): string {
    const greeting = userName ? `Hello ${userName}!` : 'Hello there!';
    const talking = userName ? `How was your day, ${userName}?` : 'How was your day?';

    const stateTexts: Record<PetState, string> = {
      idle: 'Just hanging out...',
      greeting: greeting,
      talking: talking,
      listening: 'I\'m listening...',
      'small-celebration': 'Great job!',
      'big-celebration': 'Amazing! You did it!',
      petting: 'That feels nice!',
    };
    return stateTexts[currentState];
  }

  // Reactive declarations for conditional interactivity
  $: pettingEnabled = isPettingAllowed(state);
  $: cursorStyle = (pettingEnabled || state === 'petting') ? 'pointer' : 'not-allowed';
  $: ariaLabel = pettingEnabled
    ? `Pet ${petName}`
    : state === 'petting'
    ? `Pet ${petName}`
    : `Pet ${petName} (currently busy)`;
  $: showHeart = state === 'petting';

  // Sprite sheet is now handled entirely by CSS
  // No need for emoji fallback once sprite sheet is placed in assets/
</script>

<div class="pet-sprite-container" data-state={state}>
  <!-- Interactive pet sprite with keyboard and touch accessibility -->
  <div
    class="pet-sprite-wrapper"
    role="button"
    tabindex={pettingEnabled ? 0 : -1}
    aria-label={ariaLabel}
    aria-disabled={!pettingEnabled}
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

  <div class="pet-state-text">
    {getStateText(state)}
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
  }

  /* Interactive wrapper for pet sprite */
  .pet-sprite-wrapper {
    position: relative;
    transition: transform 0.1s ease, opacity 0.2s ease;
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

  /* Disabled state appearance - but not during petting */
  .pet-sprite-container:not([data-state='petting']) .pet-sprite-wrapper[aria-disabled="true"] {
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

  .pet-state-text {
    font-size: 0.9rem;
    color: var(--text-muted);
    text-align: center;
    font-style: italic;
  }

  /* Sprite animations for each state */
  /* Note: All positions are 2x scale (64px instead of 32px) */

  /* Row 1 (y=0): Idle - 5 frames */
  .pet-sprite-container[data-state='idle'] .pet-sprite {
    animation: sprite-idle 1s steps(5) infinite;
  }

  @keyframes sprite-idle {
    from { background-position: 0 0; }
    to { background-position: -320px 0; } /* 5 frames × 64px */
  }

  /* Row 2 (y=64): Greeting - 14 frames */
  .pet-sprite-container[data-state='greeting'] .pet-sprite {
    animation: sprite-greeting 1.4s steps(14) 1; /* Play once */
  }

  @keyframes sprite-greeting {
    from { background-position: 0 -64px; }
    to { background-position: -896px -64px; } /* 14 frames × 64px */
  }

  /* Row 3 (y=128): Talking - 8 frames */
  .pet-sprite-container[data-state='talking'] .pet-sprite {
    animation: sprite-talking 0.8s steps(8) infinite;
  }

  @keyframes sprite-talking {
    from { background-position: 0 -128px; }
    to { background-position: -512px -128px; } /* 8 frames × 64px */
  }

  /* Row 4 (y=192): Listening - 11 frames */
  .pet-sprite-container[data-state='listening'] .pet-sprite {
    animation: sprite-listening 1.1s steps(11) infinite;
  }

  @keyframes sprite-listening {
    from { background-position: 0 -192px; }
    to { background-position: -704px -192px; } /* 11 frames × 64px */
  }

  /* Row 5 (y=256): Small celebration - 5 frames */
  .pet-sprite-container[data-state='small-celebration'] .pet-sprite {
    animation: sprite-small-celebration 0.5s steps(5) 1;
  }

  @keyframes sprite-small-celebration {
    from { background-position: 0 -256px; }
    to { background-position: -320px -256px; } /* 5 frames × 64px */
  }

  /* Row 6 (y=320): Petting - 6 frames */
  .pet-sprite-container[data-state='petting'] .pet-sprite {
    animation: sprite-petting 0.6s steps(6) 1;
  }

  @keyframes sprite-petting {
    from { background-position: 0 -320px; }
    to { background-position: -384px -320px; } /* 6 frames × 64px */
  }

  /* Row 7 (y=384): Big celebration - 7 frames */
  .pet-sprite-container[data-state='big-celebration'] .pet-sprite {
    animation: sprite-big-celebration 0.7s steps(7) 1;
  }

  @keyframes sprite-big-celebration {
    from { background-position: 0 -384px; }
    to { background-position: -448px -384px; } /* 7 frames × 64px */
  }
</style>
