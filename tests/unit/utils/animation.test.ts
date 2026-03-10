/**
 * Unit tests for animation utilities
 * Tests ANIMATION_CONSTANTS shape and clampMovementSpeed for the px/s speed model.
 *
 * The speed-to-duration formula lives inside Pet.svelte's updateMovementRange() and
 * is covered by the px/s speed model tests in Pet.svelte.test.ts.
 */

import * as animationModule from '../../../src/utils/animation';
import { ANIMATION_CONSTANTS, clampMovementSpeed } from '../../../src/utils/animation';

// ─── ANIMATION_CONSTANTS shape ────────────────────────────────────────────────

describe('ANIMATION_CONSTANTS', () => {
  describe('px/s speed model constants', () => {
    it('exports MIN_SPEED_PX_PER_S as a positive number', () => {
      expect(ANIMATION_CONSTANTS.MIN_SPEED_PX_PER_S).toBeDefined();
      expect(typeof ANIMATION_CONSTANTS.MIN_SPEED_PX_PER_S).toBe('number');
      expect(ANIMATION_CONSTANTS.MIN_SPEED_PX_PER_S).toBeGreaterThan(0);
    });

    it('exports MAX_SPEED_PX_PER_S as a positive number', () => {
      expect(ANIMATION_CONSTANTS.MAX_SPEED_PX_PER_S).toBeDefined();
      expect(typeof ANIMATION_CONSTANTS.MAX_SPEED_PX_PER_S).toBe('number');
      expect(ANIMATION_CONSTANTS.MAX_SPEED_PX_PER_S).toBeGreaterThan(0);
    });

    it('MAX_SPEED_PX_PER_S is strictly greater than MIN_SPEED_PX_PER_S', () => {
      expect(ANIMATION_CONSTANTS.MAX_SPEED_PX_PER_S).toBeGreaterThan(
        ANIMATION_CONSTANTS.MIN_SPEED_PX_PER_S
      );
    });
  });

  describe('retained constants', () => {
    it('PET_DISPLAY_SIZE is 75', () => {
      expect(ANIMATION_CONSTANTS.PET_DISPLAY_SIZE).toBe(75);
    });

    it('CELEBRATION_DISPLAY_SIZE is 128', () => {
      expect(ANIMATION_CONSTANTS.CELEBRATION_DISPLAY_SIZE).toBe(128);
    });
  });

  describe('removed duration-model constants', () => {
    it('does not have MAX_DURATION', () => {
      expect((ANIMATION_CONSTANTS as Record<string, unknown>).MAX_DURATION).toBeUndefined();
    });

    it('does not have MIN_DURATION', () => {
      expect((ANIMATION_CONSTANTS as Record<string, unknown>).MIN_DURATION).toBeUndefined();
    });

    it('does not have REFERENCE_CONTAINER_WIDTH', () => {
      expect((ANIMATION_CONSTANTS as Record<string, unknown>).REFERENCE_CONTAINER_WIDTH).toBeUndefined();
    });
  });
});

// ─── Removed exports ──────────────────────────────────────────────────────────

describe('removed exports', () => {
  it('does not export calculateSpeedInPixelsPerSecond', () => {
    expect('calculateSpeedInPixelsPerSecond' in animationModule).toBe(false);
  });

  it('does not export calculateMovementDuration', () => {
    expect('calculateMovementDuration' in animationModule).toBe(false);
  });
});

// ─── clampMovementSpeed ───────────────────────────────────────────────────────

describe('clampMovementSpeed', () => {
  describe('in-range values pass through unchanged', () => {
    it.each([
      [0,   'minimum boundary'],
      [1,   'just above minimum'],
      [50,  'midpoint'],
      [99,  'just below maximum'],
      [100, 'maximum boundary'],
    ])('%i (%s)', (speed) => {
      expect(clampMovementSpeed(speed)).toBe(speed);
    });
  });

  describe('below-range values clamp to 0', () => {
    it.each([
      [-1,        'just below 0'],
      [-10,       'negative'],
      [-100,      'large negative'],
      [-Infinity, '-Infinity'],
    ])('%i (%s)', (speed) => {
      expect(clampMovementSpeed(speed)).toBe(0);
    });
  });

  describe('above-range values clamp to 100', () => {
    it.each([
      [101,      'just above 100'],
      [150,      'large overshoot'],
      [1000,     'very large'],
      [Infinity, '+Infinity'],
    ])('%i (%s)', (speed) => {
      expect(clampMovementSpeed(speed)).toBe(100);
    });
  });
});

// ─── Speed-to-duration formula ────────────────────────────────────────────────
//
// These tests verify the px/s model math directly, using the constants exported
// by animation.ts.  The same formula is implemented in Pet.svelte's
// updateMovementRange() — these tests ensure the constants produce sensible
// physics before the component wires them up.

describe('px/s speed model formula', () => {
  const { MIN_SPEED_PX_PER_S, MAX_SPEED_PX_PER_S, PET_DISPLAY_SIZE } = ANIMATION_CONSTANTS;

  /**
   * Mirrors the formula in Pet.svelte's updateMovementRange():
   *   speedPxPerS = MIN + (clampedSpeed / 100) * (MAX - MIN)
   *   duration    = maxLeft / speedPxPerS
   */
  function speedPxPerS(speed: number): number {
    return MIN_SPEED_PX_PER_S + (speed / 100) * (MAX_SPEED_PX_PER_S - MIN_SPEED_PX_PER_S);
  }

  function durationFor(speed: number, containerWidth: number): number {
    const maxLeft = containerWidth - PET_DISPLAY_SIZE;
    return maxLeft / speedPxPerS(speed);
  }

  describe('speedPxPerS linearity', () => {
    it('speed 0% → MIN_SPEED_PX_PER_S', () => {
      expect(speedPxPerS(0)).toBe(MIN_SPEED_PX_PER_S);
    });

    it('speed 100% → MAX_SPEED_PX_PER_S', () => {
      expect(speedPxPerS(100)).toBe(MAX_SPEED_PX_PER_S);
    });

    it('speed 50% → midpoint between MIN and MAX', () => {
      const mid = (MIN_SPEED_PX_PER_S + MAX_SPEED_PX_PER_S) / 2;
      expect(speedPxPerS(50)).toBeCloseTo(mid, 5);
    });

    it('speed 25% → one quarter from MIN toward MAX', () => {
      const quarter = MIN_SPEED_PX_PER_S + 0.25 * (MAX_SPEED_PX_PER_S - MIN_SPEED_PX_PER_S);
      expect(speedPxPerS(25)).toBeCloseTo(quarter, 5);
    });

    it('is monotonically increasing (higher speed → higher px/s)', () => {
      for (let s = 0; s < 100; s += 10) {
        expect(speedPxPerS(s + 10)).toBeGreaterThan(speedPxPerS(s));
      }
    });
  });

  describe('duration scales with container width (same px/s)', () => {
    const speed = 50;

    it('wider container → longer duration at same speed', () => {
      expect(durationFor(speed, 400)).toBeGreaterThan(durationFor(speed, 250));
    });

    it('narrower container → shorter duration', () => {
      expect(durationFor(speed, 250)).toBeLessThan(durationFor(speed, 800));
    });

    it('duration is proportional to container width', () => {
      // doubling the moveable range should double the duration
      const narrow = 75 + 100;   // maxLeft = 100
      const wide   = 75 + 200;   // maxLeft = 200
      const ratio = durationFor(speed, wide) / durationFor(speed, narrow);
      expect(ratio).toBeCloseTo(2, 5);
    });
  });

  describe('duration at different speeds (fixed container)', () => {
    const containerWidth = 400;

    it('slower speed → longer duration', () => {
      expect(durationFor(0, containerWidth)).toBeGreaterThan(durationFor(50, containerWidth));
    });

    it('faster speed → shorter duration', () => {
      expect(durationFor(100, containerWidth)).toBeLessThan(durationFor(50, containerWidth));
    });

    it('speed 0 → finite duration (not infinite or zero)', () => {
      const d = durationFor(0, containerWidth);
      expect(Number.isFinite(d)).toBe(true);
      expect(d).toBeGreaterThan(0);
    });

    it('speed 100 → finite positive duration', () => {
      const d = durationFor(100, containerWidth);
      expect(Number.isFinite(d)).toBe(true);
      expect(d).toBeGreaterThan(0);
    });
  });

  describe('edge: container no wider than the pet', () => {
    it('maxLeft === 0 → durationFor returns 0 (no distance to traverse)', () => {
      // Pet width exactly fills the container; nothing to animate
      expect(durationFor(50, PET_DISPLAY_SIZE)).toBe(0);
    });

    it('container narrower than pet → negative maxLeft; component must guard against this', () => {
      const d = durationFor(50, PET_DISPLAY_SIZE - 10);
      // duration is negative — implementation must clamp / skip animation
      expect(d).toBeLessThan(0);
    });
  });
});
