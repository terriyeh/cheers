/**
 * Mock implementation of Pet.svelte component for testing
 */

import type { PetState } from '../../src/types/pet';

export default class MockPetComponent {
  private target: HTMLElement;
  private props: any;
  public $set: any;
  public $destroy: any;
  private updateCount: number = 0;

  constructor(options: { target: HTMLElement; props: any }) {
    this.target = options.target;
    this.props = options.props;

    // Create mock component structure
    const container = document.createElement('div');
    container.className = 'pet-sprite-container';
    container.dataset.state = options.props.state;

    const sprite = document.createElement('div');
    sprite.className = 'pet-sprite';
    sprite.setAttribute('role', 'img');
    sprite.setAttribute('aria-label', `Pet is ${options.props.state}`);

    const stateText = document.createElement('div');
    stateText.className = 'pet-state-text';
    stateText.textContent = this.getStateText(options.props.state);

    container.appendChild(sprite);
    container.appendChild(stateText);
    this.target.appendChild(container);

    this.$set = (newProps: any) => {
      this.updateCount++;
      this.props = { ...this.props, ...newProps };

      if (newProps.state) {
        container.dataset.state = newProps.state;
        sprite.setAttribute('aria-label', `Pet is ${newProps.state}`);
        stateText.textContent = this.getStateText(newProps.state);
      }
    };

    this.$destroy = () => {
      container.remove();
    };
  }

  private getStateText(state: PetState): string {
    const stateTexts: Record<PetState, string> = {
      idle: 'Just hanging out...',
      greeting: 'Hello there!',
      talking: 'How was your day?',
      listening: "I'm listening...",
      'small-celebration': 'Great job!',
      'big-celebration': 'Amazing! You did it!',
      petting: 'That feels nice!',
    };
    return stateTexts[state];
  }
}
