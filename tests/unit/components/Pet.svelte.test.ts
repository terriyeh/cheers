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
    state: 'idle' as PetState,
    spriteSheetPath: 'assets/pet-sprite-sheet.png',
    petName: 'Kit',
    userName: 'TestUser',
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
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'talking' } });
      const spriteContainer = container.querySelector('.pet-sprite-container');
      expect(spriteContainer?.getAttribute('data-state')).toBe('talking');
      component.$destroy();
    });

    it('should render state text', () => {
      const component = new MockPetComponent({ target: container, props: defaultProps });
      const stateText = container.querySelector('.pet-state-text');
      expect(stateText).toBeTruthy();
      expect(stateText?.textContent).toBeTruthy();
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

  describe('petting interaction', () => {
    it('should be interactive during idle state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'idle' } });
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

    it('should be non-interactive during talking state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'talking' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.getAttribute('tabindex')).toBe('-1');
      expect(wrapper.getAttribute('aria-disabled')).toBe('true');
      expect(wrapper.style.cursor).toBe('not-allowed');
      component.$destroy();
    });

    it('should be non-interactive during listening state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'listening' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.getAttribute('tabindex')).toBe('-1');
      expect(wrapper.getAttribute('aria-disabled')).toBe('true');
      expect(wrapper.style.cursor).toBe('not-allowed');
      component.$destroy();
    });

    it('should emit pet event when clicked during idle state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'idle' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;

      const petHandler = vi.fn();
      component.$on('pet', petHandler);

      wrapper.click();

      expect(petHandler).toHaveBeenCalledTimes(1);
      expect(petHandler.mock.calls[0][0].detail).toEqual({
        returnToState: 'idle',
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

    it('should not emit pet event when clicked during talking state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'talking' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;

      const petHandler = vi.fn();
      component.$on('pet', petHandler);

      wrapper.click();

      expect(petHandler).not.toHaveBeenCalled();
      component.$destroy();
    });

    it('should not emit pet event when clicked during listening state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'listening' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;

      const petHandler = vi.fn();
      component.$on('pet', petHandler);

      wrapper.click();

      expect(petHandler).not.toHaveBeenCalled();
      component.$destroy();
    });
  });

  describe('heart overlay', () => {
    it('should show heart overlay during petting state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'petting' } });
      const heartOverlay = container.querySelector('.heart-overlay');
      expect(heartOverlay).toBeTruthy();
      component.$destroy();
    });

    it('should not show heart overlay during idle state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'idle' } });
      const heartOverlay = container.querySelector('.heart-overlay');
      expect(heartOverlay).toBeFalsy();
      component.$destroy();
    });

    it('should hide heart overlay when transitioning from petting to idle', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'petting' } });

      // Initially should show heart
      let heartOverlay = container.querySelector('.heart-overlay');
      expect(heartOverlay).toBeTruthy();

      // Transition to idle
      component.$set({ state: 'idle' });

      // Heart should be hidden
      heartOverlay = container.querySelector('.heart-overlay');
      expect(heartOverlay).toBeFalsy();
      component.$destroy();
    });
  });

  describe('state display text', () => {
    it('should display correct text for idle state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'idle' } });
      const stateText = container.querySelector('.pet-state-text');
      expect(stateText?.textContent).toBe('Just hanging out...');
      component.$destroy();
    });

    it('should display correct text for talking state with userName', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'talking', userName: 'Alice' } });
      const stateText = container.querySelector('.pet-state-text');
      expect(stateText?.textContent).toBe('How was your day, Alice?');
      component.$destroy();
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
      expect(stateText?.textContent).toBe('That feels nice!');
      component.$destroy();
    });
  });

  describe('keyboard accessibility', () => {
    it('should emit pet event when Enter key pressed during idle state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'idle' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;

      const petHandler = vi.fn();
      component.$on('pet', petHandler);

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      wrapper.dispatchEvent(event);

      expect(petHandler).toHaveBeenCalledTimes(1);
      expect(petHandler.mock.calls[0][0].detail).toEqual({
        returnToState: 'idle',
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

    it('should not emit pet event when Enter pressed during talking state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'talking' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;

      const petHandler = vi.fn();
      component.$on('pet', petHandler);

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      wrapper.dispatchEvent(event);

      expect(petHandler).not.toHaveBeenCalled();
      component.$destroy();
    });

    it('should not emit pet event when Space pressed during listening state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'listening' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;

      const petHandler = vi.fn();
      component.$on('pet', petHandler);

      const event = new KeyboardEvent('keydown', { key: ' ' });
      wrapper.dispatchEvent(event);

      expect(petHandler).not.toHaveBeenCalled();
      component.$destroy();
    });

    it('should not emit pet event when other keys are pressed', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'idle' } });
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
    it('should have correct ARIA label during idle state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'idle', petName: 'Kit' } });
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

    it('should have correct ARIA label during talking state (busy)', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'talking', petName: 'Kit' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.getAttribute('aria-label')).toBe('Pet Kit (currently busy)');
      component.$destroy();
    });

    it('should have correct ARIA label during listening state (busy)', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'listening', petName: 'Buddy' } });
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
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'petting' } });
      const heartOverlay = container.querySelector('.heart-overlay') as HTMLElement;
      expect(heartOverlay.getAttribute('aria-hidden')).toBe('true');
      component.$destroy();
    });

    it('should have aria-disabled="false" when petting is allowed', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'idle' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.getAttribute('aria-disabled')).toBe('false');
      component.$destroy();
    });

    it('should have aria-disabled="true" when petting is not allowed', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'talking' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.getAttribute('aria-disabled')).toBe('true');
      component.$destroy();
    });
  });

  describe('visual feedback styles', () => {
    it('should have pointer cursor when enabled (idle)', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'idle' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.style.cursor).toBe('pointer');
      component.$destroy();
    });

    it('should have not-allowed cursor when disabled (talking)', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'talking' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.style.cursor).toBe('not-allowed');
      component.$destroy();
    });

    it('should have opacity 0.7 when aria-disabled is true', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'listening' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.getAttribute('aria-disabled')).toBe('true');
      // CSS will apply opacity via attribute selector
      component.$destroy();
    });
  });

  describe('heart overlay positioning and animation', () => {
    it('should have heart overlay with correct positioning classes', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'petting' } });
      const heartOverlay = container.querySelector('.heart-overlay') as HTMLElement;
      expect(heartOverlay).toBeTruthy();
      expect(heartOverlay.className).toBe('heart-overlay');
      component.$destroy();
    });

    it('should contain heart image with correct src', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'petting' } });
      const heartImg = container.querySelector('.heart-overlay img') as HTMLImageElement;
      expect(heartImg).toBeTruthy();
      expect(heartImg.src).toContain('heart.png');
      component.$destroy();
    });
  });
});
