/**
 * Mock implementation of Pet.svelte component for testing
 * Mirrors the structure and behavior of the real Pet.svelte component
 */

import type { PetState } from '../../src/types/pet';
import { clampMovementSpeed, calculateGifAnimationDuration } from '../../src/utils/animation';

export default class MockPetComponent {
  private target: HTMLElement;
  public props: any;
  public $set: any;
  public $destroy: any;
  public $on: any;
  public $off: any;
  private updateCount: number = 0;
  private eventHandlers: Map<string, Function[]> = new Map();
  private container!: HTMLElement;
  private wrapper!: HTMLElement;
  private sprite!: HTMLElement;
  private heartOverlay: HTMLElement | null = null;
  private celebrationOverlay: HTMLElement | null = null;

  constructor(options: { target: HTMLElement; props: any }) {
    this.target = options.target;
    this.props = options.props;

    // Create mock component structure matching real implementation
    this.container = document.createElement('div');
    this.container.className = 'pet-sprite-container';
    this.container.dataset.state = options.props.state;

    // Set initial animation duration if movementSpeed is provided
    if (options.props.movementSpeed !== undefined) {
      const clampedSpeed = clampMovementSpeed(options.props.movementSpeed);
      const animationDuration = calculateGifAnimationDuration(clampedSpeed);
      this.container.style.setProperty('--animation-duration', `${animationDuration}s`);
    }

    // Apply initial background styles
    if (options.props.backgroundColor !== undefined) {
      this.container.style.backgroundColor = options.props.backgroundColor;
    }
    if (options.props.backgroundPath !== undefined) {
      this.container.style.backgroundImage = `url("${options.props.backgroundPath}")`;
    }

    // Wrapper with interactive attributes
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'pet-sprite-wrapper';
    this.wrapper.setAttribute('role', 'button');
    this.updateInteractiveAttributes(options.props.state, options.props.petName || 'Kit');

    // Add event listeners to wrapper
    this.wrapper.addEventListener('click', this.handleClick.bind(this));
    this.wrapper.addEventListener('keydown', this.handleKeyDown.bind(this));

    // Pet sprite - use img element to match real component
    this.sprite = document.createElement('img');
    this.sprite.className = 'pet-sprite';
    this.sprite.setAttribute('alt', `Pet is ${options.props.state}`);
    this.sprite.setAttribute('src', this.getCurrentSpritePath(options.props));
    (this.sprite as HTMLImageElement).src = this.getCurrentSpritePath(options.props);

    // Assemble structure
    this.wrapper.appendChild(this.sprite);
    this.container.appendChild(this.wrapper);
    this.target.appendChild(this.container);

    // Add heart overlay if in petting state
    this.updateHeartOverlay(options.props.state);

    // Add celebration overlay if in celebration state
    this.updateCelebrationOverlay(options.props.state);

    // Set method for updating props
    this.$set = (newProps: any) => {
      this.updateCount++;
      this.props = { ...this.props, ...newProps };

      // Update sprite src if state changes or any sprite path changes
      const needsSpriteUpdate =
        newProps.state !== undefined ||
        newProps.walkingSpritePath !== undefined ||
        newProps.pettingSpritePath !== undefined ||
        newProps.celebrationSpritePath !== undefined;

      if (needsSpriteUpdate) {
        const newSpritePath = this.getCurrentSpritePath(this.props);
        (this.sprite as HTMLImageElement).src = newSpritePath;
        this.sprite.setAttribute('src', newSpritePath);
      }

      if (newProps.state !== undefined) {
        this.container.dataset.state = newProps.state;
        this.sprite.setAttribute('alt', `Pet is ${newProps.state}`);
        this.updateInteractiveAttributes(newProps.state, this.props.petName);
        this.updateHeartOverlay(newProps.state);
        this.updateCelebrationOverlay(newProps.state);
      }

      if (newProps.petName !== undefined) {
        this.updateInteractiveAttributes(this.props.state, newProps.petName);
      }

      if (newProps.movementSpeed !== undefined) {
        const clampedSpeed = clampMovementSpeed(newProps.movementSpeed);
        const animationDuration = calculateGifAnimationDuration(clampedSpeed);
        this.container.style.setProperty('--animation-duration', `${animationDuration}s`);
      }

      if (newProps.fireworksSpritePath !== undefined) {
        this.updateCelebrationOverlay(this.props.state);
      }

      if (newProps.backgroundColor !== undefined) {
        this.container.style.backgroundColor = newProps.backgroundColor;
      }

      if (newProps.backgroundPath !== undefined) {
        this.container.style.backgroundImage = `url("${newProps.backgroundPath}")`;
      }
    };

    // Event handler registration
    this.$on = (eventName: string, handler: Function) => {
      if (!this.eventHandlers.has(eventName)) {
        this.eventHandlers.set(eventName, []);
      }
      this.eventHandlers.get(eventName)!.push(handler);
    };

    // Event handler removal
    this.$off = (eventName: string, handler: Function) => {
      const handlers = this.eventHandlers.get(eventName);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };

    // Cleanup
    this.$destroy = () => {
      this.wrapper.removeEventListener('click', this.handleClick.bind(this));
      this.wrapper.removeEventListener('keydown', this.handleKeyDown.bind(this));
      this.container.remove();
      this.eventHandlers.clear();
    };
  }

  /**
   * Get the current sprite path based on state (matches real component logic)
   * Celebration: celebrationSpritePath
   * Petting: pettingSpritePath
   * Walking: walkingSpritePath
   */
  private getCurrentSpritePath(props: any): string {
    if (props.state === 'celebration') {
      return props.celebrationSpritePath || props.walkingSpritePath;
    } else if (props.state === 'petting') {
      return props.pettingSpritePath || props.walkingSpritePath;
    } else {
      return props.walkingSpritePath;
    }
  }

  private isPettingAllowed(state: PetState): boolean {
    return state === 'walking';
  }

  private updateInteractiveAttributes(state: PetState, petName: string): void {
    const pettingEnabled = this.isPettingAllowed(state);
    const cursorStyle = pettingEnabled ? 'pointer' : 'not-allowed';
    const ariaLabel = pettingEnabled
      ? `Pet ${petName}`
      : `Pet ${petName} (currently busy)`;

    this.wrapper.setAttribute('tabindex', pettingEnabled ? '0' : '-1');
    this.wrapper.setAttribute('aria-disabled', pettingEnabled ? 'false' : 'true');
    this.wrapper.setAttribute('aria-label', ariaLabel);
    this.wrapper.style.cursor = cursorStyle;
  }

  private updateHeartOverlay(state: PetState): void {
    const showHeart = state === 'petting';

    if (showHeart && !this.heartOverlay) {
      // Create heart overlay
      this.heartOverlay = document.createElement('div');
      this.heartOverlay.className = 'heart-overlay';
      this.heartOverlay.setAttribute('aria-hidden', 'true');

      const heartImg = document.createElement('img');
      heartImg.src = 'assets/heart.png';
      heartImg.alt = '';

      this.heartOverlay.appendChild(heartImg);
      this.wrapper.appendChild(this.heartOverlay);
    } else if (!showHeart && this.heartOverlay) {
      // Remove heart overlay
      this.heartOverlay.remove();
      this.heartOverlay = null;
    }
  }

  private updateCelebrationOverlay(state: PetState): void {
    // Remove existing overlay
    if (this.celebrationOverlay) {
      this.celebrationOverlay.remove();
      this.celebrationOverlay = null;
    }

    // Add overlay if in celebration state and fireworks path is provided
    if (state === 'celebration' && this.props.fireworksSpritePath) {
      this.celebrationOverlay = document.createElement('div');
      this.celebrationOverlay.className = 'celebration-overlay';
      this.celebrationOverlay.setAttribute('aria-hidden', 'true');

      // Center firework
      const centerSprite = document.createElement('img');
      centerSprite.className = 'celebration-sprite celebration-sprite-center';
      centerSprite.src = this.props.fireworksSpritePath;
      centerSprite.alt = '';

      // Left firework
      const leftSprite = document.createElement('img');
      leftSprite.className = 'celebration-sprite celebration-sprite-left';
      leftSprite.src = this.props.fireworksSpritePath;
      leftSprite.alt = '';

      // Right firework
      const rightSprite = document.createElement('img');
      rightSprite.className = 'celebration-sprite celebration-sprite-right';
      rightSprite.src = this.props.fireworksSpritePath;
      rightSprite.alt = '';

      this.celebrationOverlay.appendChild(centerSprite);
      this.celebrationOverlay.appendChild(leftSprite);
      this.celebrationOverlay.appendChild(rightSprite);
      this.container.appendChild(this.celebrationOverlay);
    }
  }

  private handleClick(event: MouseEvent): void {
    if (!this.isPettingAllowed(this.props.state)) return;
    event.preventDefault();
    this.dispatchEvent('pet', { returnToState: this.props.state });
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isPettingAllowed(this.props.state)) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.dispatchEvent('pet', { returnToState: this.props.state });
    }
  }

  private dispatchEvent(eventName: string, detail: any): void {
    const handlers = this.eventHandlers.get(eventName) || [];
    handlers.forEach((handler) => {
      handler({ detail });
    });
  }
}
