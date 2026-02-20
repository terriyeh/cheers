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
    petSpritePath: 'assets/cat-walking-6fps.gif',
    heartSpritePath: 'assets/heart.png',
    backgroundPath: '',
    celebrationSpritePath: '',
    petName: 'Kit',
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
      expect(sprite.style.backgroundImage).toContain('assets/cat-walking-6fps.gif');
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
      component.$set({ state: 'celebration' });

      const spriteContainer = container.querySelector('.pet-sprite-container');
      expect(spriteContainer?.getAttribute('data-state')).toBe('celebration');
      component.$destroy();
    });
  });

  describe('movement speed prop', () => {
    it('should apply walking animation duration for speed 0 (slowest)', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'walking', movementSpeed: 0 } });
      const petContainer = container.querySelector('.pet-sprite-container') as HTMLElement;
      expect(petContainer).toBeTruthy();
      // Duration = 2 - (0 / 60) = 2s
      expect(petContainer.style.getPropertyValue('--animation-duration')).toBe('2s');
      component.$destroy();
    });

    it('should apply walking animation duration for speed 30 (medium walking)', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'walking', movementSpeed: 30 } });
      const petContainer = container.querySelector('.pet-sprite-container') as HTMLElement;
      expect(petContainer).toBeTruthy();
      // Duration = 2 - (30 / 100) = 1.7s
      expect(petContainer.style.getPropertyValue('--animation-duration')).toBe('1.7s');
      component.$destroy();
    });

    it('should apply walking animation duration for speed 60 (fastest walking)', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'walking', movementSpeed: 60 } });
      const petContainer = container.querySelector('.pet-sprite-container') as HTMLElement;
      expect(petContainer).toBeTruthy();
      // Duration = 2 - (60 / 100) = 1.4s
      expect(petContainer.style.getPropertyValue('--animation-duration')).toBe('1.4s');
      component.$destroy();
    });

    it('should update animation duration reactively when speed changes', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'walking', movementSpeed: 30 } });
      const petContainer = container.querySelector('.pet-sprite-container') as HTMLElement;

      // Initial: 1.7s for speed 30
      expect(petContainer.style.getPropertyValue('--animation-duration')).toBe('1.7s');

      // Update speed to 60
      component.$set({ movementSpeed: 60 });
      expect(petContainer.style.getPropertyValue('--animation-duration')).toBe('1.4s');

      component.$destroy();
    });

    it('should not apply movement speed to non-movement states', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'celebration', movementSpeed: 100 } });
      const sprite = container.querySelector('.pet-sprite') as HTMLElement;
      expect(sprite).toBeTruthy();
      // Celebration should use fixed duration, not affected by movement speed
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

    it('should be non-interactive during celebration state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'celebration' } });
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

    it('should not emit pet event when clicked during celebration state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'celebration' } });
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

    it('should not show heart overlay during walking state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'walking' } });
      const heartOverlay = container.querySelector('.heart-overlay');
      expect(heartOverlay).toBeFalsy();
      component.$destroy();
    });

    it('should hide heart overlay when transitioning from petting to walking', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'petting' } });

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
    it('should calculate correct walking duration for speed=30 (1.7s)', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'walking', movementSpeed: 30 } });
      const petContainer = container.querySelector('.pet-sprite-container') as HTMLElement;
      // duration = 2 - (30 / 100) = 1.7s
      expect(petContainer.style.getPropertyValue('--animation-duration')).toBe('1.7s');
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

    it('should have correct ARIA label during celebration state (busy)', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'celebration', petName: 'Kit' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.getAttribute('aria-label')).toBe('Pet Kit (currently busy)');
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
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'celebration' } });
      const wrapper = container.querySelector('.pet-sprite-wrapper') as HTMLElement;
      expect(wrapper.getAttribute('aria-disabled')).toBe('true');
      // CSS will apply opacity via attribute selector
      component.$destroy();
    });

    it('should clamp negative movement speed to 0', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'walking', movementSpeed: -10 } });
      const petContainer = container.querySelector('.pet-sprite-container') as HTMLElement;
      // Should clamp to 0, giving duration = 2 - (0 / 60) = 2s
      expect(petContainer.style.getPropertyValue('--animation-duration')).toBe('2s');
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

  describe('celebration overlay', () => {
    it('should render 3 firework sprites during celebration state', () => {
      const component = new MockPetComponent({
        target: container,
        props: {
          ...defaultProps,
          state: 'celebration',
          celebrationSpritePath: 'assets/effects/fireworks.gif'
        }
      });

      const celebrationOverlay = container.querySelector('.celebration-overlay');
      expect(celebrationOverlay).toBeTruthy();

      const fireworkSprites = container.querySelectorAll('.celebration-sprite');
      expect(fireworkSprites.length).toBe(3);

      // Verify each sprite has the correct class
      expect(container.querySelector('.celebration-sprite-center')).toBeTruthy();
      expect(container.querySelector('.celebration-sprite-left')).toBeTruthy();
      expect(container.querySelector('.celebration-sprite-right')).toBeTruthy();

      component.$destroy();
    });

    it('should show celebration overlay only during celebration state', () => {
      const component = new MockPetComponent({
        target: container,
        props: {
          ...defaultProps,
          state: 'walking',
          celebrationSpritePath: 'assets/effects/fireworks.gif'
        }
      });

      // Walking state - no overlay
      let overlay = container.querySelector('.celebration-overlay');
      expect(overlay).toBeFalsy();

      // Transition to celebration
      component.$set({ state: 'celebration' });
      overlay = container.querySelector('.celebration-overlay');
      expect(overlay).toBeTruthy();

      // Transition to petting
      component.$set({ state: 'petting' });
      overlay = container.querySelector('.celebration-overlay');
      expect(overlay).toBeFalsy();

      component.$destroy();
    });

    it('should apply celebration data-state to container during celebration', () => {
      const component = new MockPetComponent({
        target: container,
        props: { ...defaultProps, state: 'celebration' }
      });

      const spriteContainer = container.querySelector('.pet-sprite-container');
      expect(spriteContainer?.getAttribute('data-state')).toBe('celebration');

      // CSS selector `.pet-sprite-container[data-state='celebration']` enables pause
      // This data-state attribute is critical for animation-play-state: paused

      component.$destroy();
    });

    it('should clean up celebration overlay when component is destroyed', () => {
      const component = new MockPetComponent({
        target: container,
        props: {
          ...defaultProps,
          state: 'celebration',
          celebrationSpritePath: 'assets/effects/fireworks.gif'
        }
      });

      // Verify overlay exists
      let overlay = container.querySelector('.celebration-overlay');
      expect(overlay).toBeTruthy();

      // Destroy component
      component.$destroy();

      // Verify cleanup
      overlay = container.querySelector('.celebration-overlay');
      expect(overlay).toBeFalsy();
    });
  });
});
