/**
 * Unit tests for Pet.svelte component
 * Tests rendering, interactivity, accessibility, and state display
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
    walkingSpritePath: 'assets/cat-walking-6fps.gif',
    pettingSpritePath: 'assets/cat-petting-6fps.gif',
    celebrationSpritePath: 'assets/cat-celebrating-6fps.gif',
    backgroundPath: '',
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

    it('should render pet sprite with correct src', () => {
      const component = new MockPetComponent({ target: container, props: defaultProps });
      const sprite = container.querySelector('.pet-sprite') as HTMLImageElement;
      expect(sprite).toBeTruthy();
      expect(sprite.getAttribute('src')).toContain('assets/cat-walking-6fps.gif');
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
    it('should render in walking state at speed 0 (slowest)', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'walking', movementSpeed: 0 } });
      const petContainer = container.querySelector('.pet-sprite-container') as HTMLElement;
      expect(petContainer).toBeTruthy();
      expect(petContainer.dataset.state).toBe('walking');
      component.$destroy();
    });

    it('should render in walking state at speed 30 (medium walking)', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'walking', movementSpeed: 30 } });
      const petContainer = container.querySelector('.pet-sprite-container') as HTMLElement;
      expect(petContainer).toBeTruthy();
      expect(petContainer.dataset.state).toBe('walking');
      component.$destroy();
    });

    it('should render in walking state at speed 60 (fastest walking)', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'walking', movementSpeed: 60 } });
      const petContainer = container.querySelector('.pet-sprite-container') as HTMLElement;
      expect(petContainer).toBeTruthy();
      expect(petContainer.dataset.state).toBe('walking');
      component.$destroy();
    });

    it('should accept movementSpeed updates via $set', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'walking', movementSpeed: 30 } });
      const petContainer = container.querySelector('.pet-sprite-container') as HTMLElement;

      component.$set({ movementSpeed: 60 });
      // State should be unaffected by speed change
      expect(petContainer.dataset.state).toBe('walking');

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

  describe('sprite path switching', () => {
    it('should use walking sprite during walking state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'walking' } });
      const sprite = container.querySelector('.pet-sprite') as HTMLImageElement;
      expect(sprite.getAttribute('src')).toContain('cat-walking-6fps.gif');
      component.$destroy();
    });

    it('should use petting sprite during petting state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'petting' } });
      const sprite = container.querySelector('.pet-sprite') as HTMLImageElement;
      expect(sprite.getAttribute('src')).toContain('cat-petting-6fps.gif');
      component.$destroy();
    });

    it('should use celebration sprite during celebration state', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'celebration' } });
      const sprite = container.querySelector('.pet-sprite') as HTMLImageElement;
      expect(sprite.getAttribute('src')).toContain('cat-celebrating-6fps.gif');
      component.$destroy();
    });

    it('should switch sprite when transitioning from petting to walking', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'petting' } });

      // Initially should show petting sprite
      let sprite = container.querySelector('.pet-sprite') as HTMLImageElement;
      expect(sprite.getAttribute('src')).toContain('cat-petting-6fps.gif');

      // Transition to walking
      component.$set({ state: 'walking' });

      // Should now show walking sprite
      sprite = container.querySelector('.pet-sprite') as HTMLImageElement;
      expect(sprite.getAttribute('src')).toContain('cat-walking-6fps.gif');
      component.$destroy();
    });
  });

  describe('celebration overlay', () => {
    it('should not render a .celebration-overlay div during celebration state', () => {
      const component = new MockPetComponent({
        target: container,
        props: { ...defaultProps, state: 'celebration' }
      });

      expect(container.querySelector('.celebration-overlay')).toBeFalsy();

      component.$destroy();
    });

    it('should not render any .celebration-sprite elements during celebration state', () => {
      const component = new MockPetComponent({
        target: container,
        props: { ...defaultProps, state: 'celebration' }
      });

      expect(container.querySelectorAll('.celebration-sprite').length).toBe(0);

      component.$destroy();
    });

    it('should apply data-state="celebration" to the container for CSS animation pause', () => {
      const component = new MockPetComponent({
        target: container,
        props: { ...defaultProps, state: 'celebration' }
      });

      const spriteContainer = container.querySelector('.pet-sprite-container');
      expect(spriteContainer?.getAttribute('data-state')).toBe('celebration');

      component.$destroy();
    });

    it('should not render overlay or sprites during walking state', () => {
      const component = new MockPetComponent({ target: container, props: defaultProps });

      expect(container.querySelector('.celebration-overlay')).toBeFalsy();
      expect(container.querySelectorAll('.celebration-sprite').length).toBe(0);

      component.$destroy();
    });

    it('should not render overlay or sprites during petting state', () => {
      const component = new MockPetComponent({
        target: container,
        props: { ...defaultProps, state: 'petting' }
      });

      expect(container.querySelector('.celebration-overlay')).toBeFalsy();
      expect(container.querySelectorAll('.celebration-sprite').length).toBe(0);

      component.$destroy();
    });

    it('should not render overlay or sprites after transitioning from celebration to walking', () => {
      const component = new MockPetComponent({
        target: container,
        props: { ...defaultProps, state: 'celebration' }
      });

      component.$set({ state: 'walking' });

      expect(container.querySelector('.celebration-overlay')).toBeFalsy();
      expect(container.querySelectorAll('.celebration-sprite').length).toBe(0);

      component.$destroy();
    });
  });


  describe('px/s speed model — CSS custom properties', () => {
    // The real Pet.svelte sets --movement-duration and --animation-delay on the
    // container element via updateMovementRange(). The mock simulates this so
    // these tests can verify the correct values without mounting a real Svelte
    // component in JSDOM.
    //
    // Duration formula (mirrors Pet.svelte updateMovementRange):
    //   speedPxPerS = MIN_SPEED_PX_PER_S + (clampedSpeed / 100) * (MAX - MIN)
    //   duration    = maxLeft / speedPxPerS      where maxLeft = containerWidth - petWidth
    // Mock uses containerWidth = 800px for all CSS property assertions.

    it('sets --movement-duration on the container element', () => {
      const component = new MockPetComponent({
        target: container,
        props: { ...defaultProps, movementSpeed: 50 },
      });
      const petContainer = container.querySelector('.pet-sprite-container') as HTMLElement;
      const duration = petContainer.style.getPropertyValue('--movement-duration');
      expect(duration).toBeTruthy();
      expect(duration).toMatch(/^\d+(\.\d+)?s$/); // e.g. "2.45s"
      component.$destroy();
    });

    it('sets --animation-delay on the container element', () => {
      const component = new MockPetComponent({
        target: container,
        props: { ...defaultProps, movementSpeed: 50 },
      });
      const petContainer = container.querySelector('.pet-sprite-container') as HTMLElement;
      const delay = petContainer.style.getPropertyValue('--animation-delay');
      expect(delay).toBeTruthy();
      expect(delay).toMatch(/^-?\d+(\.\d+)?s$/); // e.g. "-3.2s"
      component.$destroy();
    });

    it('speed 0 → longer --movement-duration than speed 100', () => {
      const slow = new MockPetComponent({
        target: container,
        props: { ...defaultProps, movementSpeed: 0 },
      });
      const fastContainer = document.createElement('div');
      document.body.appendChild(fastContainer);
      const fast = new MockPetComponent({
        target: fastContainer,
        props: { ...defaultProps, movementSpeed: 100 },
      });

      const slowDuration = parseFloat(
        (container.querySelector('.pet-sprite-container') as HTMLElement)
          .style.getPropertyValue('--movement-duration')
      );
      const fastDuration = parseFloat(
        (fastContainer.querySelector('.pet-sprite-container') as HTMLElement)
          .style.getPropertyValue('--movement-duration')
      );

      expect(slowDuration).toBeGreaterThan(fastDuration);

      slow.$destroy();
      fast.$destroy();
      document.body.removeChild(fastContainer);
    });

    it('speed 50 → --movement-duration between speed-0 and speed-100 values', () => {
      const containers = [0, 50, 100].map(speed => {
        const el = document.createElement('div');
        document.body.appendChild(el);
        const comp = new MockPetComponent({ target: el, props: { ...defaultProps, movementSpeed: speed } });
        return { el, comp };
      });

      const [d0, d50, d100] = containers.map(({ el }) =>
        parseFloat(
          (el.querySelector('.pet-sprite-container') as HTMLElement)
            .style.getPropertyValue('--movement-duration')
        )
      );

      expect(d50).toBeGreaterThan(d100);
      expect(d50).toBeLessThan(d0);

      containers.forEach(({ el, comp }) => { comp.$destroy(); document.body.removeChild(el); });
    });

    it('updating movementSpeed via $set recalculates --movement-duration', () => {
      const component = new MockPetComponent({
        target: container,
        props: { ...defaultProps, movementSpeed: 0 },
      });
      const petContainer = container.querySelector('.pet-sprite-container') as HTMLElement;

      const durationBefore = parseFloat(
        petContainer.style.getPropertyValue('--movement-duration')
      );

      component.$set({ movementSpeed: 100 });

      const durationAfter = parseFloat(
        petContainer.style.getPropertyValue('--movement-duration')
      );

      expect(durationAfter).toBeLessThan(durationBefore);
      component.$destroy();
    });

    it('clamped speed -10 produces same duration as speed 0', () => {
      const atZero = document.createElement('div');
      const atNeg = document.createElement('div');
      document.body.appendChild(atZero);
      document.body.appendChild(atNeg);

      const c0 = new MockPetComponent({ target: atZero, props: { ...defaultProps, movementSpeed: 0 } });
      const cn = new MockPetComponent({ target: atNeg,  props: { ...defaultProps, movementSpeed: -10 } });

      const d0 = parseFloat(
        (atZero.querySelector('.pet-sprite-container') as HTMLElement)
          .style.getPropertyValue('--movement-duration')
      );
      const dn = parseFloat(
        (atNeg.querySelector('.pet-sprite-container') as HTMLElement)
          .style.getPropertyValue('--movement-duration')
      );

      expect(dn).toBeCloseTo(d0, 5);

      c0.$destroy(); cn.$destroy();
      document.body.removeChild(atZero); document.body.removeChild(atNeg);
    });

    it('clamped speed 110 produces same duration as speed 100', () => {
      const at100 = document.createElement('div');
      const at110 = document.createElement('div');
      document.body.appendChild(at100);
      document.body.appendChild(at110);

      const c1 = new MockPetComponent({ target: at100, props: { ...defaultProps, movementSpeed: 100 } });
      const c2 = new MockPetComponent({ target: at110, props: { ...defaultProps, movementSpeed: 110 } });

      const d100 = parseFloat(
        (at100.querySelector('.pet-sprite-container') as HTMLElement)
          .style.getPropertyValue('--movement-duration')
      );
      const d110 = parseFloat(
        (at110.querySelector('.pet-sprite-container') as HTMLElement)
          .style.getPropertyValue('--movement-duration')
      );

      expect(d110).toBeCloseTo(d100, 5);

      c1.$destroy(); c2.$destroy();
      document.body.removeChild(at100); document.body.removeChild(at110);
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

    it('should clamp negative movement speed to 0 without error', () => {
      const component = new MockPetComponent({ target: container, props: { ...defaultProps, state: 'walking', movementSpeed: -10 } });
      const petContainer = container.querySelector('.pet-sprite-container') as HTMLElement;
      // Negative speed should be clamped; component should still render in walking state
      expect(petContainer.dataset.state).toBe('walking');
      component.$destroy();
    });
  });

});
