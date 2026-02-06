<script lang="ts">
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
   * Pet's name (from settings)
   */
  export let petName: string = 'Kit';

  /**
   * User's name (from settings, optional)
   */
  export let userName: string = '';

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

  // Sprite sheet is now handled entirely by CSS
  // No need for emoji fallback once sprite sheet is placed in assets/
</script>

<div class="pet-sprite-container" data-state={state}>
  <!-- Sprite sheet animation -->
  <div
    class="pet-sprite"
    role="img"
    aria-label={`Pet is ${state}`}
    style:background-image="url({spriteSheetPath})">
    <!-- Sprite background set dynamically via style attribute -->
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

  .pet-sprite {
    width: 64px; /* 2x scale of 32px frames */
    height: 64px;
    margin-bottom: 1rem;
    /* background-image set via inline style with correct plugin path */
    background-size: 896px 448px; /* 2x scale: 448*2 = 896, 224*2 = 448 */
    background-repeat: no-repeat;
    image-rendering: pixelated; /* Keep pixel art crisp */
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
