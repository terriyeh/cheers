/**
 * Mock implementation of Pet.svelte component for testing
 * Mirrors the structure and behavior of the real Pet.svelte component
 */

import type { PetState } from '../../src/types/pet';

export default class MockPetComponent {
  private target: HTMLElement;
  private props: any;
  public $set: any;
  public $destroy: any;
  public $on: any;
  public $off: any;
  private updateCount: number = 0;
  private eventHandlers: Map<string, Function[]> = new Map();
  private container!: HTMLElement;
  private wrapper!: HTMLElement;
  private sprite!: HTMLElement;
  private stateText!: HTMLElement;
  private heartOverlay: HTMLElement | null = null;

  constructor(options: { target: HTMLElement; props: any }) {
    this.target = options.target;
    this.props = options.props;

    // Create mock component structure matching real implementation
    this.container = document.createElement('div');
    this.container.className = 'pet-sprite-container';
    this.container.dataset.state = options.props.state;

    // Wrapper with interactive attributes
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'pet-sprite-wrapper';
    this.wrapper.setAttribute('role', 'button');
    this.updateInteractiveAttributes(options.props.state, options.props.petName || 'Kit');

    // Add event listeners to wrapper
    this.wrapper.addEventListener('click', this.handleClick.bind(this));
    this.wrapper.addEventListener('keydown', this.handleKeyDown.bind(this));

    // Pet sprite
    this.sprite = document.createElement('div');
    this.sprite.className = 'pet-sprite';
    this.sprite.setAttribute('role', 'img');
    this.sprite.setAttribute('aria-label', `Pet is ${options.props.state}`);
    this.sprite.style.backgroundImage = `url(${options.props.spriteSheetPath})`;

    // State text
    this.stateText = document.createElement('div');
    this.stateText.className = 'pet-state-text';
    this.stateText.textContent = this.getStateText(options.props.state, options.props.userName);

    // Assemble structure
    this.wrapper.appendChild(this.sprite);
    this.container.appendChild(this.wrapper);
    this.container.appendChild(this.stateText);
    this.target.appendChild(this.container);

    // Add heart overlay if in petting state
    this.updateHeartOverlay(options.props.state);

    // Set method for updating props
    this.$set = (newProps: any) => {
      this.updateCount++;
      this.props = { ...this.props, ...newProps };

      if (newProps.state !== undefined) {
        this.container.dataset.state = newProps.state;
        this.sprite.setAttribute('aria-label', `Pet is ${newProps.state}`);
        this.stateText.textContent = this.getStateText(newProps.state, this.props.userName);
        this.updateInteractiveAttributes(newProps.state, this.props.petName);
        this.updateHeartOverlay(newProps.state);
      }

      if (newProps.petName !== undefined) {
        this.updateInteractiveAttributes(this.props.state, newProps.petName);
      }

      if (newProps.userName !== undefined) {
        this.stateText.textContent = this.getStateText(this.props.state, newProps.userName);
      }

      if (newProps.spriteSheetPath !== undefined) {
        this.sprite.style.backgroundImage = `url(${newProps.spriteSheetPath})`;
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

  private isPettingAllowed(state: PetState): boolean {
    return state === 'idle' || state === 'greeting';
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

  private getStateText(state: PetState, userName?: string): string {
    const greeting = userName ? `Hello ${userName}!` : 'Hello there!';

    const stateTexts: Record<PetState, string> = {
      idle: 'Just hanging out...',
      greeting: greeting,
      'small-celebration': 'Great job!',
      'big-celebration': 'Amazing! You did it!',
      petting: 'That feels nice!',
    };
    return stateTexts[state];
  }
}
