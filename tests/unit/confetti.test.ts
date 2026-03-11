/**
 * Unit tests for src/utils/confetti.ts
 *
 * Tests particle spawning, CSS custom property values, cleanup timing,
 * and the re-trigger guard (rapid celebration → walking → celebration).
 */

import { vi } from 'vitest';
import { spawnConfettiRain } from '../../src/utils/confetti';
import { CELEBRATION_OVERLAY_CONSTANTS } from '../../src/utils/celebration-constants';

const { CONFETTI_COUNT, CONFETTI_CLEANUP_GRACE_MS, CELEBRATION_DURATION_MS } = CELEBRATION_OVERLAY_CONSTANTS;

/** Confetti palette — must match the CONFETTI_COLORS array in confetti.ts */
const VALID_COLORS = ['#ff6abc', '#fbc534', '#4f3cf8', '#f68217', '#57bbff', '#ff3131'];
/** Shape variants — must match CONFETTI_SHAPES in confetti.ts */
const VALID_SHAPES = ['square', 'rect', 'circle'];

describe('spawnConfettiRain()', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    if (container.parentElement) {
      document.body.removeChild(container);
    }
  });

  // ── Particle count ───────────────────────────────────────────────────────────

  describe('particle count', () => {
    it('should spawn exactly CONFETTI_COUNT (35) particles', () => {
      spawnConfettiRain(container, 1000);
      expect(container.querySelectorAll('.vp-confetti-particle').length).toBe(CONFETTI_COUNT);
    });

    it('should append all particles as direct children of the container', () => {
      spawnConfettiRain(container, 1000);
      const particles = container.querySelectorAll('.vp-confetti-particle');
      particles.forEach(p => {
        expect(p.parentElement).toBe(container);
      });
    });

    it('should add no other elements beyond the confetti particles', () => {
      spawnConfettiRain(container, 1000);
      expect(container.children.length).toBe(CONFETTI_COUNT);
    });
  });

  // ── Class name ───────────────────────────────────────────────────────────────

  describe('particle class name', () => {
    it('should give every particle the class vp-confetti-particle', () => {
      spawnConfettiRain(container, 1000);
      const allChildren = Array.from(container.children);
      allChildren.forEach(child => {
        expect(child.classList.contains('vp-confetti-particle')).toBe(true);
      });
    });
  });

  // ── data-shape attribute ─────────────────────────────────────────────────────

  describe('data-shape attribute', () => {
    it('should set data-shape on every particle', () => {
      spawnConfettiRain(container, 1000);
      const particles = Array.from(container.querySelectorAll('.vp-confetti-particle'));
      particles.forEach(p => {
        expect((p as HTMLElement).dataset.shape).toBeDefined();
        expect((p as HTMLElement).dataset.shape).not.toBe('');
      });
    });

    it('should only use valid shape values (square, rect, circle)', () => {
      spawnConfettiRain(container, 1000);
      const particles = Array.from(container.querySelectorAll('.vp-confetti-particle'));
      particles.forEach(p => {
        expect(VALID_SHAPES).toContain((p as HTMLElement).dataset.shape);
      });
    });

    it('should use all three shape types across the 35 particles', () => {
      spawnConfettiRain(container, 1000);
      const particles = Array.from(container.querySelectorAll('.vp-confetti-particle'));
      const shapes = particles.map(p => (p as HTMLElement).dataset.shape);
      VALID_SHAPES.forEach(shape => {
        expect(shapes).toContain(shape);
      });
    });
  });

  // ── CSS custom property: --color ─────────────────────────────────────────────

  describe('CSS custom property --color', () => {
    it('should set --color on every particle', () => {
      spawnConfettiRain(container, 1000);
      const particles = Array.from(container.querySelectorAll('.vp-confetti-particle'));
      particles.forEach(p => {
        const color = (p as HTMLElement).style.getPropertyValue('--color');
        expect(color).toBeTruthy();
      });
    });

    it('should use only colors from the defined palette', () => {
      spawnConfettiRain(container, 1000);
      const particles = Array.from(container.querySelectorAll('.vp-confetti-particle'));
      particles.forEach(p => {
        const color = (p as HTMLElement).style.getPropertyValue('--color').trim();
        expect(VALID_COLORS).toContain(color);
      });
    });

    it('should cycle through all palette colors across the 35 particles', () => {
      spawnConfettiRain(container, 1000);
      const particles = Array.from(container.querySelectorAll('.vp-confetti-particle'));
      const colors = particles.map(p => (p as HTMLElement).style.getPropertyValue('--color').trim());
      VALID_COLORS.forEach(color => {
        expect(colors).toContain(color);
      });
    });
  });

  // ── CSS custom property: --left ──────────────────────────────────────────────

  describe('CSS custom property --left', () => {
    it('should set --left on every particle', () => {
      spawnConfettiRain(container, 1000);
      const particles = Array.from(container.querySelectorAll('.vp-confetti-particle'));
      particles.forEach(p => {
        const left = (p as HTMLElement).style.getPropertyValue('--left');
        expect(left).toBeTruthy();
      });
    });

    it('should set the first particle --left to 0%', () => {
      spawnConfettiRain(container, 1000);
      const first = container.querySelector('.vp-confetti-particle') as HTMLElement;
      expect(first.style.getPropertyValue('--left')).toBe('0%');
    });

    it('should distribute --left values linearly in strictly increasing order', () => {
      spawnConfettiRain(container, 1000);
      const particles = Array.from(container.querySelectorAll('.vp-confetti-particle'));
      const leftValues = particles.map(p =>
        parseFloat((p as HTMLElement).style.getPropertyValue('--left'))
      );
      for (let i = 1; i < leftValues.length; i++) {
        expect(leftValues[i]).toBeGreaterThan(leftValues[i - 1]);
      }
    });

    it('should keep the last particle --left below 100% (no out-of-bounds placement)', () => {
      spawnConfettiRain(container, 1000);
      const particles = Array.from(container.querySelectorAll('.vp-confetti-particle'));
      const lastLeft = parseFloat((particles[particles.length - 1] as HTMLElement).style.getPropertyValue('--left'));
      expect(lastLeft).toBeGreaterThan(90);
      expect(lastLeft).toBeLessThan(100);
    });
  });

  // ── CSS custom property: --delay ─────────────────────────────────────────────

  describe('CSS custom property --delay', () => {
    it('should set --delay on every particle', () => {
      spawnConfettiRain(container, 1000);
      const particles = Array.from(container.querySelectorAll('.vp-confetti-particle'));
      particles.forEach(p => {
        const delay = (p as HTMLElement).style.getPropertyValue('--delay');
        expect(delay).toBeTruthy();
      });
    });

    it('should set --delay to a negative value (particle starts mid-fall)', () => {
      spawnConfettiRain(container, 1000);
      const particles = Array.from(container.querySelectorAll('.vp-confetti-particle'));
      particles.forEach(p => {
        const delay = parseFloat((p as HTMLElement).style.getPropertyValue('--delay'));
        expect(delay).toBeLessThanOrEqual(0);
      });
    });

    it('should set --delay to at most -3s (within the 0 to -3s window)', () => {
      spawnConfettiRain(container, 1000);
      const particles = Array.from(container.querySelectorAll('.vp-confetti-particle'));
      particles.forEach(p => {
        const delay = parseFloat((p as HTMLElement).style.getPropertyValue('--delay'));
        expect(delay).toBeGreaterThanOrEqual(-3);
      });
    });

    it('should use seconds unit in --delay value', () => {
      spawnConfettiRain(container, 1000);
      const particles = Array.from(container.querySelectorAll('.vp-confetti-particle'));
      particles.forEach(p => {
        const delay = (p as HTMLElement).style.getPropertyValue('--delay');
        expect(delay).toMatch(/s$/);
      });
    });
  });

  // ── CSS custom property: --duration ──────────────────────────────────────────

  describe('CSS custom property --duration', () => {
    it('should set --duration on every particle', () => {
      spawnConfettiRain(container, 1000);
      const particles = Array.from(container.querySelectorAll('.vp-confetti-particle'));
      particles.forEach(p => {
        const duration = (p as HTMLElement).style.getPropertyValue('--duration');
        expect(duration).toBeTruthy();
      });
    });

    it('should set --duration in the 2.5s–4.5s range', () => {
      spawnConfettiRain(container, 1000);
      const particles = Array.from(container.querySelectorAll('.vp-confetti-particle'));
      particles.forEach(p => {
        const duration = parseFloat((p as HTMLElement).style.getPropertyValue('--duration'));
        expect(duration).toBeGreaterThanOrEqual(2.5);
        expect(duration).toBeLessThanOrEqual(4.5);
      });
    });

    it('should use seconds unit in --duration value', () => {
      spawnConfettiRain(container, 1000);
      const particles = Array.from(container.querySelectorAll('.vp-confetti-particle'));
      particles.forEach(p => {
        const duration = (p as HTMLElement).style.getPropertyValue('--duration');
        expect(duration).toMatch(/s$/);
      });
    });
  });

  // ── CSS custom property: --rot-z ─────────────────────────────────────────────

  describe('CSS custom property --rot-z', () => {
    it('should set --rot-z on every particle', () => {
      spawnConfettiRain(container, 1000);
      const particles = Array.from(container.querySelectorAll('.vp-confetti-particle'));
      particles.forEach(p => {
        const rotZ = (p as HTMLElement).style.getPropertyValue('--rot-z');
        expect(rotZ).toBeTruthy();
      });
    });

    it('should set --rot-z in the 0–360deg range', () => {
      spawnConfettiRain(container, 1000);
      const particles = Array.from(container.querySelectorAll('.vp-confetti-particle'));
      particles.forEach(p => {
        const rotZ = parseFloat((p as HTMLElement).style.getPropertyValue('--rot-z'));
        expect(rotZ).toBeGreaterThanOrEqual(0);
        expect(rotZ).toBeLessThan(360);
      });
    });

    it('should use deg unit in --rot-z value', () => {
      spawnConfettiRain(container, 1000);
      const particles = Array.from(container.querySelectorAll('.vp-confetti-particle'));
      particles.forEach(p => {
        const rotZ = (p as HTMLElement).style.getPropertyValue('--rot-z');
        expect(rotZ).toMatch(/deg$/);
      });
    });
  });

  // ── Cleanup timing ───────────────────────────────────────────────────────────

  describe('particle cleanup via setTimeout', () => {
    it('should not remove particles before the cleanup time fires', () => {
      vi.useFakeTimers();
      spawnConfettiRain(container, 1000);

      vi.advanceTimersByTime(1000 + CONFETTI_CLEANUP_GRACE_MS - 1);

      expect(container.querySelectorAll('.vp-confetti-particle').length).toBe(CONFETTI_COUNT);
    });

    it('should remove all particles exactly at durationMs + CONFETTI_CLEANUP_GRACE_MS', () => {
      vi.useFakeTimers();
      spawnConfettiRain(container, 1000);

      vi.advanceTimersByTime(1000 + CONFETTI_CLEANUP_GRACE_MS);

      expect(container.querySelectorAll('.vp-confetti-particle').length).toBe(0);
    });

    it('should clean up at the correct time using CELEBRATION_DURATION_MS', () => {
      vi.useFakeTimers();
      spawnConfettiRain(container, CELEBRATION_DURATION_MS);

      // One ms before cleanup — particles still present
      vi.advanceTimersByTime(CELEBRATION_DURATION_MS + CONFETTI_CLEANUP_GRACE_MS - 1);
      expect(container.querySelectorAll('.vp-confetti-particle').length).toBe(CONFETTI_COUNT);

      // Exactly at cleanup — particles removed
      vi.advanceTimersByTime(1);
      expect(container.querySelectorAll('.vp-confetti-particle').length).toBe(0);
    });
  });

  // ── Re-trigger guard (double-spawn prevention) ───────────────────────────────

  describe('re-trigger guard', () => {
    it('should replace previous particles instead of accumulating on re-trigger', () => {
      spawnConfettiRain(container, 5000);
      expect(container.querySelectorAll('.vp-confetti-particle').length).toBe(CONFETTI_COUNT);

      spawnConfettiRain(container, 5000);

      // Must still be exactly CONFETTI_COUNT, not 70
      expect(container.querySelectorAll('.vp-confetti-particle').length).toBe(CONFETTI_COUNT);
    });

    it('should cancel the first cleanup timer when re-triggered within the cleanup window', () => {
      vi.useFakeTimers();

      spawnConfettiRain(container, 1000);

      // Re-trigger before first cleanup fires
      spawnConfettiRain(container, 5000);

      // Advance past the FIRST cleanup time (1500ms) — particles must still be present
      // because the first timer was cancelled
      vi.advanceTimersByTime(1000 + CONFETTI_CLEANUP_GRACE_MS + 100);
      expect(container.querySelectorAll('.vp-confetti-particle').length).toBe(CONFETTI_COUNT);
    });

    it('should clean up at the second call duration after re-trigger', () => {
      vi.useFakeTimers();

      spawnConfettiRain(container, 1000); // cleanup at 1000 + 500 = 1500ms (cancelled)
      spawnConfettiRain(container, 3000); // cleanup at 3000 + 500 = 3500ms (active)

      vi.advanceTimersByTime(3000 + CONFETTI_CLEANUP_GRACE_MS);
      expect(container.querySelectorAll('.vp-confetti-particle').length).toBe(0);
    });
  });

  // ── Pre-existing particle cleanup ────────────────────────────────────────────

  describe('pre-existing particle cleanup', () => {
    it('should remove manually inserted .vp-confetti-particle elements before spawning', () => {
      // Simulate leftover particles from a failed or interrupted cleanup
      const stale1 = document.createElement('div');
      stale1.className = 'vp-confetti-particle';
      const stale2 = document.createElement('div');
      stale2.className = 'vp-confetti-particle';
      container.appendChild(stale1);
      container.appendChild(stale2);
      expect(container.querySelectorAll('.vp-confetti-particle').length).toBe(2);

      spawnConfettiRain(container, 1000);

      // Should be exactly CONFETTI_COUNT, not CONFETTI_COUNT + 2
      expect(container.querySelectorAll('.vp-confetti-particle').length).toBe(CONFETTI_COUNT);
    });

    it('should not disturb non-confetti children of the container', () => {
      // Simulate the pet sprite wrapper being present
      const spriteWrapper = document.createElement('div');
      spriteWrapper.className = 'pet-sprite-wrapper';
      container.appendChild(spriteWrapper);

      spawnConfettiRain(container, 1000);

      expect(container.querySelector('.pet-sprite-wrapper')).toBeTruthy();
    });
  });
});
