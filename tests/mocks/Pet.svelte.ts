/**
 * Mock implementation of Pet.svelte component for testing
 * Mirrors the structure and behavior of the real Pet.svelte component
 */

import type { PetState } from '../../src/types/pet';
import { clampMovementSpeed, ANIMATION_CONSTANTS } from '../../src/utils/animation';

/**
 * Mirrors the px/s duration formula in Pet.svelte's updateMovementRange().
 * Tests use a fixed reference container width so assertions are deterministic.
 */
const MOCK_CONTAINER_WIDTH = 800;

function computeMovementDuration(movementSpeed: number): number {
  const { MIN_SPEED_PX_PER_S, MAX_SPEED_PX_PER_S, PET_DISPLAY_SIZE } = ANIMATION_CONSTANTS;
  const clamped = clampMovementSpeed(movementSpeed);
  const speedPxPerS = MIN_SPEED_PX_PER_S + (clamped / 100) * (MAX_SPEED_PX_PER_S - MIN_SPEED_PX_PER_S);
  const maxLeft = MOCK_CONTAINER_WIDTH - PET_DISPLAY_SIZE;
  return maxLeft / speedPxPerS;
}

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
  constructor(options: { target: HTMLElement; props: any }) {
    this.target = options.target;
    this.props = options.props;

    // Create mock component structure matching real implementation
    this.container = document.createElement('div');
    this.container.className = 'pet-sprite-container';
    this.container.dataset.state = options.props.state;

    // Apply initial background styles
    if (options.props.background !== undefined) {
      this.container.style.backgroundColor = options.props.background.skyColor;
      this.container.style.backgroundSize = `${options.props.background.displayWidth}px ${options.props.background.displayHeight}px`;
      this.container.style.setProperty('--pet-bottom', `${options.props.background.petBottom}px`);
    }
    if (options.props.backgroundPath !== undefined) {
      this.container.style.backgroundImage = `url("${options.props.backgroundPath}")`;
    }

    // Set movement animation CSS custom properties (mirrors updateMovementRange)
    const initialDuration = computeMovementDuration(options.props.movementSpeed ?? 50);
    this.container.style.setProperty('--movement-duration', `${initialDuration}s`);
    this.container.style.setProperty('--animation-delay', `-${initialDuration / 2}s`);

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
      }

      if (newProps.petName !== undefined) {
        this.updateInteractiveAttributes(this.props.state, newProps.petName);
      }

      if (newProps.movementSpeed !== undefined) {
        const newDuration = computeMovementDuration(newProps.movementSpeed);
        this.container.style.setProperty('--movement-duration', `${newDuration}s`);
        this.container.style.setProperty('--animation-delay', `-${newDuration / 2}s`);
      }

      if (newProps.background !== undefined) {
        this.container.style.backgroundColor = newProps.background.skyColor;
        this.container.style.backgroundSize = `${newProps.background.displayWidth}px ${newProps.background.displayHeight}px`;
        this.container.style.setProperty('--pet-bottom', `${newProps.background.petBottom}px`);
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
