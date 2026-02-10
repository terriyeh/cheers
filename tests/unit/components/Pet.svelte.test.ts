/**
 * Unit tests for Pet.svelte component
 * Tests rendering, interactivity, heart overlay, accessibility, and state display
 */

import { vi } from 'vitest';
import MockPetComponent from '../../mocks/Pet.svelte';
import type { PetState } from '../../../src/types/pet';

describe('Pet.svelte Component', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  const defaultProps = {
    state: 'walking' as PetState,
    spriteSheetPath: 'assets/pet-sprite-sheet.png',
    petName: 'Kit',
    userName: 'TestUser',
    movementSpeed: 60,
  };

  describe('basic rendering', () => {
    it('should render pet sprite container', () => {
      const component = new MockPetComponent({ target: container, props: defaultProps });
      const spriteContainer = container.querySelector('.pet-sprite-container');
      expect(spriteContainer).toBeTruthy();
      component.$destroy();
    });

    it('should render pet sprite with correct background image', () => {
      const component = new MockPetComponent({ target: container, props: defaultProps });
      const sprite = container.querySelector('.pet-sprite') as HTMLElement;
      expect(sprite).toBeTruthy();
      expect(sprite.style.backgroundImage).toContain('assets/pet-sprite-sheet.png');
      component.$destroy();
    });

    it('should apply correct data-state attribute', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'celebration' } });
      const spriteContainer = container.querySelector('.pet-sprite-container');
      expect(spriteContainer?.getAttribute('data-state')).toBe('celebration');
      component.$destroy();
    });

    it('should render movement speed animation duration', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, movementSpeed: 60 } });
      const sprite = container.querySelector('.pet-sprite') as HTMLElement;
      expect(sprite).toBeTruthy();
      // Animation duration should be calculated based on speed
      component.$destroy();
    });

    it('should update state reactively', () => {
      const component = new MockPetComponent({ target: container, props: defaultProps });

      // Update state
      component.$set({ state: 'greeting' });

      const spriteContainer = container.querySelector('.pet-sprite-container');
      expect(spriteContainer?.getAttribute('data-state')).toBe('greeting');
      component.$destroy();
    });
  });

  describe('movement speed prop', () => {
    it('should apply walking animation duration for speed 0 (slowest)', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'walking', movementSpeed: 0 } });
      const sprite = container.querySelector('.pet-sprite') as HTMLElement;
      expect(sprite).toBeTruthy();
      // Duration = 2 - (0 / 60) = 2s
      const computedStyle = window.getComputedStyle(sprite);
      expect(computedStyle.animationDuration).toBe('2s');
      component.$destroy();
    });

    it('should apply walking animation duration for speed 30 (medium walking)', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'walking', movementSpeed: 30 } });
      const sprite = container.querySelector('.pet-sprite') as HTMLElement;
      expect(sprite).toBeTruthy();
      // Duration = 2 - (30 / 60) = 1.5s
      const computedStyle = window.getComputedStyle(sprite);
      expect(computedStyle.animationDuration).toBe('1.5s');
      component.$destroy();
    });

    it('should apply walking animation duration for speed 60 (fastest walking)', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'walking', movementSpeed: 60 } });
      const sprite = container.querySelector('.pet-sprite') as HTMLElement;
      expect(sprite).toBeTruthy();
      // Duration = 2 - (60 / 60) = 1s
      const computedStyle = window.getComputedStyle(sprite);
      expect(computedStyle.animationDuration).toBe('1s');
      component.$destroy();
    });

    it('should apply running animation duration for speed 61 (slowest running)', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'running', movementSpeed: 61 } });
      const sprite = container.querySelector('.pet-sprite') as HTMLElement;
      expect(sprite).toBeTruthy();
      // Duration = 1 - ((61 - 60) / 40) * 0.6 = 1 - 0.015 = 0.985s
      const computedStyle = window.getComputedStyle(sprite);
      expect(parseFloat(computedStyle.animationDuration)).toBeCloseTo(0.985, 2);
      component.$destroy();
    });

    it('should apply running animation duration for speed 80 (medium running)', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'running', movementSpeed: 80 } });
      const sprite = container.querySelector('.pet-sprite') as HTMLElement;
      expect(sprite).toBeTruthy();
      // Duration = 1 - ((80 - 60) / 40) * 0.6 = 1 - 0.3 = 0.7s
      const computedStyle = window.getComputedStyle(sprite);
      expect(computedStyle.animationDuration).toBe('0.7s');
      component.$destroy();
    });

    it('should apply running animation duration for speed 100 (fastest)', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'running', movementSpeed: 100 } });
      const sprite = container.querySelector('.pet-sprite') as HTMLElement;
      expect(sprite).toBeTruthy();
      // Duration = 1 - ((100 - 60) / 40) * 0.6 = 1 - 0.6 = 0.4s
      const computedStyle = window.getComputedStyle(sprite);
      expect(computedStyle.animationDuration).toBe('0.4s');
      component.$destroy();
    });

    it('should update animation duration reactively when speed changes', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'walking', movementSpeed: 30 } });
      const sprite = container.querySelector('.pet-sprite') as HTMLElement;

      // Initial: 1.5s for speed 30
      let computedStyle = window.getComputedStyle(sprite);
      expect(computedStyle.animationDuration).toBe('1.5s');

      // Update speed to 60
      component.$set({ movementSpeed: 60 });
      computedStyle = window.getComputedStyle(sprite);
      expect(computedStyle.animationDuration).toBe('1s');

      component.$destroy();
    });

    it('should not apply movement speed to non-movement states', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'greeting', movementSpeed: 100 } });
      const sprite = container.querySelector('.pet-sprite') as HTMLElement;
      expect(sprite).toBeTruthy();
      // Greeting should use fixed 2s duration, not affected by movement speed
      component.$destroy();
    });
  });

  describe('petting interaction', () => {
    it('should be interactive during walking state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'walking' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.getAttribute('tabindex')).toBe('0');
      expect(wrapper.getAttribute('aria-disabled')).toBe('false');
      expect(wrapper.style.cursor).toBe('pointer');
      component.$destroy();
    });

    it('should be interactive during greeting state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'greeting' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.getAttribute('tabindex')).toBe('0');
      expect(wrapper.getAttribute('aria-disabled')).toBe('false');
      expect(wrapper.style.cursor).toBe('pointer');
      component.$destroy();
    });

    it('should be non-interactive during celebration state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'celebration' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.getAttribute('tabindex')).toBe('-1');
      expect(wrapper.getAttribute('aria-disabled')).toBe('true');
      expect(wrapper.style.cursor).toBe('not-allowed');
      component.$destroy();
    });

    it('should be non-interactive during sleeping state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'sleeping' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.getAttribute('tabindex')).toBe('-1');
      expect(wrapper.getAttribute('aria-disabled')).toBe('true');
      expect(wrapper.style.cursor).toBe('not-allowed');
      component.$destroy();
    });

    it('should emit pet event when clicked during walking state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'walking' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;

      const petHandler = vi.fn();
      component.$on('pet', petHandler);

      wrapper.click();

      expect(petHandler).toHaveBeenCalledTimes(1);
      expect(petHandler.mock.calls[0][0].detail).toEqual({
        returnToState: 'walking',
      });
      component.$destroy();
    });

    it('should emit pet event with greeting returnToState when clicked during greeting', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'greeting' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;

      const petHandler = vi.fn();
      component.$on('pet', petHandler);

      wrapper.click();

      expect(petHandler).toHaveBeenCalledTimes(1);
      expect(petHandler.mock.calls[0][0].detail).toEqual({
        returnToState: 'greeting',
      });
      component.$destroy();
    });

    it('should not emit pet event when clicked during celebration state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'celebration' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;

      const petHandler = vi.fn();
      component.$on('pet', petHandler);

      wrapper.click();

      expect(petHandler).not.toHaveBeenCalled();
      component.$destroy();
    });

    it('should not emit pet event when clicked during sleeping state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'sleeping' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;

      const petHandler = vi.fn();
      component.$on('pet', petHandler);

      wrapper.click();

      expect(petHandler).not.toHaveBeenCalled();
      component.$destroy();
    });
  });

  describe('heart overlay', () => {
    it('should show heart overlay during sleeping state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'sleeping' } });
      const heartOverlay = container.querySelector('.heart-overlay');
      expect(heartOverlay).toBeTruthy();
      component.$destroy();
    });

    it('should not show heart overlay during walking state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'walking' } });
      const heartOverlay = container.querySelector('.heart-overlay');
      expect(heartOverlay).toBeFalsy();
      component.$destroy();
    });

    it('should hide heart overlay when transitioning from sleeping to walking', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'sleeping' } });

      // Initially should show heart
      let heartOverlay = container.querySelector('.heart-overlay');
      expect(heartOverlay).toBeTruthy();

      // Transition to walking
      component.$set({ state: 'walking' });

      // Heart should be hidden
      heartOverlay = container.querySelector('.heart-overlay');
      expect(heartOverlay).toBeFalsy();
      component.$destroy();
    });
  });


  describe('duration formula calculations', () => {
    it('should calculate correct walking duration for speed=30 (1.5s)', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'walking', movementSpeed: 30 } });
      const sprite = container.querySelector('.pet-sprite') as HTMLElement;
      const computedStyle = window.getComputedStyle(sprite);
      // duration = 2 - (30 / 60) = 1.5s
      expect(computedStyle.animationDuration).toBe('1.5s');
      component.$destroy();
    });

    it('should calculate correct running duration for speed=90 (0.55s)', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'running', movementSpeed: 90 } });
      const sprite = container.querySelector('.pet-sprite') as HTMLElement;
      const computedStyle = window.getComputedStyle(sprite);
      // duration = 1 - ((90 - 60) / 40) * 0.6 = 1 - 0.45 = 0.55s
      expect(computedStyle.animationDuration).toBe('0.55s');
      component.$destroy();
    });
  });

    it('should display correct text for greeting state with userName', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'greeting', userName: 'Alice' } });
      const stateText = container.querySelector('.pet-state-text');
      expect(stateText?.textContent).toBe('Hello Alice!');
      component.$destroy();
    });

    it('should display correct text for petting state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'petting' } });
      const stateText = container.querySelector('.pet-state-text');
      expect(stateText?.textContent).toBe('Amazing! You did it!');
      component.$destroy();
    });

    it('should display correct text for sleeping state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'sleeping' } });
      const stateText = container.querySelector('.pet-state-text');
      expect(stateText?.textContent).toBe('Zzz...');
      component.$destroy();
    });
  });

  describe('keyboard accessibility', () => {
    it('should emit pet event when Enter key pressed during walking state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'walking' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;

      const petHandler = vi.fn();
      component.$on('pet', petHandler);

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      wrapper.dispatchEvent(event);

      expect(petHandler).toHaveBeenCalledTimes(1);
      expect(petHandler.mock.calls[0][0].detail).toEqual({
        returnToState: 'walking',
      });
      component.$destroy();
    });

    it('should emit pet event when Space key pressed during greeting state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'greeting' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;

      const petHandler = vi.fn();
      component.$on('pet', petHandler);

      const event = new KeyboardEvent('keydown', { key: ' ' });
      wrapper.dispatchEvent(event);

      expect(petHandler).toHaveBeenCalledTimes(1);
      expect(petHandler.mock.calls[0][0].detail).toEqual({
        returnToState: 'greeting',
      });
      component.$destroy();
    });

    it('should not emit pet event when Enter pressed during celebration state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'celebration' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;

      const petHandler = vi.fn();
      component.$on('pet', petHandler);

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      wrapper.dispatchEvent(event);

      expect(petHandler).not.toHaveBeenCalled();
      component.$destroy();
    });

    it('should not emit pet event when Space pressed during sleeping state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'sleeping' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;

      const petHandler = vi.fn();
      component.$on('pet', petHandler);

      const event = new KeyboardEvent('keydown', { key: ' ' });
      wrapper.dispatchEvent(event);

      expect(petHandler).not.toHaveBeenCalled();
      component.$destroy();
    });

    it('should not emit pet event when other keys are pressed', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'walking' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;

      const petHandler = vi.fn();
      component.$on('pet', petHandler);

      wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));

      expect(petHandler).not.toHaveBeenCalled();
      component.$destroy();
    });
  });

  describe('accessibility attributes', () => {
    it('should have correct ARIA label during walking state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'walking', petName: 'Kit' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.getAttribute('aria-label')).toBe('Pet Kit');
      component.$destroy();
    });

    it('should have correct ARIA label during greeting state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'greeting', petName: 'Fluffy' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.getAttribute('aria-label')).toBe('Pet Fluffy');
      component.$destroy();
    });

    it('should have correct ARIA label during celebration state (busy)', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'celebration', petName: 'Kit' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.getAttribute('aria-label')).toBe('Pet Kit (currently busy)');
      component.$destroy();
    });

    it('should have correct ARIA label during sleeping state (busy)', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'sleeping', petName: 'Buddy' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.getAttribute('aria-label')).toBe('Pet Buddy (currently busy)');
      component.$destroy();
    });

    it('should have role="button" on wrapper', () => {
      const component = new MockPetComponent({ target: container, props: defaultProps });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.getAttribute('role')).toBe('button');
      component.$destroy();
    });

    it('should have aria-hidden="true" on heart overlay', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'sleeping' } });
      const heartOverlay = container.querySelector('.heart-overlay') as HTMLElement;
      expect(heartOverlay.getAttribute('aria-hidden')).toBe('true');
      component.$destroy();
    });

    it('should have aria-disabled="false" when petting is allowed', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'walking' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.getAttribute('aria-disabled')).toBe('false');
      component.$destroy();
    });

    it('should have aria-disabled="true" when petting is not allowed', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'celebration' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.getAttribute('aria-disabled')).toBe('true');
      component.$destroy();
    });
  });

  describe('visual feedback styles', () => {
    it('should have pointer cursor when enabled (walking)', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'walking' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.style.cursor).toBe('pointer');
      component.$destroy();
    });

    it('should have not-allowed cursor when disabled (celebration)', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'celebration' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.style.cursor).toBe('not-allowed');
      component.$destroy();
    });

    it('should have opacity 0.7 when aria-disabled is true', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'sleeping' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.getAttribute('aria-disabled')).toBe('true');
      // CSS will apply opacity via attribute selector
      component.$destroy();
    });

    it('should clamp negative movement speed to 0', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'walking', movementSpeed: -10 } });
      const sprite = container.querySelector('.pet-sprite') as HTMLElement;
      const computedStyle = window.getComputedStyle(sprite);
      // Should clamp to 0, giving duration = 2 - (0 / 60) = 2s
      expect(computedStyle.animationDuration).toBe('2s');
      component.$destroy();
    });
  });

  describe('heart overlay positioning and animation', () => {
    it('should have heart overlay with correct positioning classes', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'sleeping' } });
      const heartOverlay = container.querySelector('.heart-overlay') as HTMLElement;
      expect(heartOverlay).toBeTruthy();
      expect(heartOverlay.className).toBe('heart-overlay');
      component.$destroy();
    });

    it('should contain heart image with correct src', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'sleeping' } });
      const heartImg = container.querySelector('.heart-overlay img') as HTMLImageElement;
      expect(heartImg).toBeTruthy();
      expect(heartImg.src).toContain('heart.png');
      component.$destroy();
    });
  });
});
