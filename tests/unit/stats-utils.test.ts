/**
 * Unit tests for stats-utils.ts — pure ring geometry helpers.
 *
 * These tests cover `computeRingData` which derives all SVG values from props.
 * No mocks are needed: the function is side-effect-free.
 *
 * Ring geometry reference:
 *   OUTER_RADIUS  = 80
 *   STROKE_WIDTH  = 12
 *   INNER_RADIUS  = 80 − 12/2 = 74
 *   CIRCUMFERENCE = 2π × 74 ≈ 464.96
 */

import { computeRingData, CIRCUMFERENCE } from '../../src/utils/stats-utils';

describe('computeRingData()', () => {
  // ─── showOuterRing ────────────────────────────────────────────────────────

  describe('showOuterRing', () => {
    it('is false when dailyWordGoal is null', () => {
      const result = computeRingData(100, null, null, null);
      expect(result.showOuterRing).toBe(false);
    });

    it('is false when dailyWordGoal is 0', () => {
      const result = computeRingData(100, 0, null, null);
      expect(result.showOuterRing).toBe(false);
    });

    it('is true when dailyWordGoal is a positive number', () => {
      const result = computeRingData(0, 500, null, null);
      expect(result.showOuterRing).toBe(true);
    });
  });

  // ─── showInnerCircle ──────────────────────────────────────────────────────

  describe('showInnerCircle', () => {
    it('is false when fileWordGoal is null', () => {
      const result = computeRingData(0, null, null, null);
      expect(result.showInnerCircle).toBe(false);
    });

    it('is false when fileWordGoal is 0', () => {
      const result = computeRingData(0, null, 100, 0);
      expect(result.showInnerCircle).toBe(false);
    });

    it('is true when fileWordGoal is a positive number', () => {
      const result = computeRingData(0, null, 300, 500);
      expect(result.showInnerCircle).toBe(true);
    });
  });

  // ─── showRingSection ──────────────────────────────────────────────────────

  describe('showRingSection', () => {
    it('is false when both goals are null', () => {
      const result = computeRingData(0, null, null, null);
      expect(result.showRingSection).toBe(false);
    });

    it('is true when only dailyWordGoal is set', () => {
      const result = computeRingData(0, 500, null, null);
      expect(result.showRingSection).toBe(true);
    });

    it('is true when only fileWordGoal is set', () => {
      const result = computeRingData(0, null, 100, 500);
      expect(result.showRingSection).toBe(true);
    });

    it('is true when both goals are set', () => {
      const result = computeRingData(100, 500, 200, 500);
      expect(result.showRingSection).toBe(true);
    });
  });

  // ─── dailyProgress ────────────────────────────────────────────────────────

  describe('dailyProgress', () => {
    it('is 0.4 when 400 of 1000 words written', () => {
      const result = computeRingData(400, 1000, null, null);
      expect(result.dailyProgress).toBeCloseTo(0.4);
    });

    it('is capped at 1.0 when wordsAddedToday exceeds dailyWordGoal', () => {
      const result = computeRingData(1500, 1000, null, null);
      expect(result.dailyProgress).toBe(1.0);
    });

    it('is exactly 1.0 when wordsAddedToday equals dailyWordGoal', () => {
      const result = computeRingData(1000, 1000, null, null);
      expect(result.dailyProgress).toBe(1.0);
    });

    it('is 0 when wordsAddedToday is 0', () => {
      const result = computeRingData(0, 1000, null, null);
      expect(result.dailyProgress).toBe(0);
    });

    it('is 0 when dailyWordGoal is null (outer ring absent)', () => {
      const result = computeRingData(500, null, null, null);
      expect(result.dailyProgress).toBe(0);
    });
  });

  // ─── fileProgress ─────────────────────────────────────────────────────────

  describe('fileProgress', () => {
    it('is 0.8 when 400 of 500 words written in the file', () => {
      const result = computeRingData(0, null, 400, 500);
      expect(result.fileProgress).toBeCloseTo(0.8);
    });

    it('is capped at 1.0 when fileWordCount exceeds fileWordGoal', () => {
      const result = computeRingData(0, null, 700, 500);
      expect(result.fileProgress).toBe(1.0);
    });

    it('is 0 when fileWordCount is null (no active markdown editor)', () => {
      // Inner circle absent when no active editor even if fileWordGoal is set
      const result = computeRingData(0, null, null, 500);
      expect(result.fileProgress).toBe(0);
    });

    it('is 0 when fileWordGoal is null (inner circle absent)', () => {
      const result = computeRingData(0, null, 300, null);
      expect(result.fileProgress).toBe(0);
    });

    it('is 0 when fileWordGoal is 0 (inner circle absent)', () => {
      const result = computeRingData(0, null, 300, 0);
      expect(result.fileProgress).toBe(0);
    });
  });

  // ─── outerOffset ─────────────────────────────────────────────────────────

  describe('outerOffset (stroke-dashoffset)', () => {
    it('equals CIRCUMFERENCE at 0% progress — ring appears empty', () => {
      const result = computeRingData(0, 1000, null, null);
      expect(result.outerOffset).toBeCloseTo(CIRCUMFERENCE);
    });

    it('equals 0 at 100% progress — ring appears fully filled', () => {
      const result = computeRingData(1000, 1000, null, null);
      expect(result.outerOffset).toBeCloseTo(0);
    });

    it('equals CIRCUMFERENCE × 0.6 at 40% progress', () => {
      const result = computeRingData(400, 1000, null, null);
      expect(result.outerOffset).toBeCloseTo(CIRCUMFERENCE * 0.6);
    });

    it('equals 0 when progress is capped above 100%', () => {
      const result = computeRingData(2000, 1000, null, null);
      expect(result.outerOffset).toBeCloseTo(0);
    });

    it('equals CIRCUMFERENCE when dailyWordGoal is null (0% progress baseline)', () => {
      // No daily ring means dailyProgress = 0, so offset = CIRCUMFERENCE × 1
      const result = computeRingData(500, null, null, null);
      expect(result.outerOffset).toBeCloseTo(CIRCUMFERENCE);
    });
  });

  // ─── combined scenarios ───────────────────────────────────────────────────

  describe('combined goals', () => {
    it('computes both ring values independently when both goals are set', () => {
      const result = computeRingData(400, 1000, 200, 500);

      expect(result.showOuterRing).toBe(true);
      expect(result.showInnerCircle).toBe(true);
      expect(result.dailyProgress).toBeCloseTo(0.4);
      expect(result.fileProgress).toBeCloseTo(0.4);
      expect(result.outerOffset).toBeCloseTo(CIRCUMFERENCE * 0.6);
    });

    it('caps both progress values independently when both exceed 100%', () => {
      const result = computeRingData(9999, 1000, 9999, 500);

      expect(result.dailyProgress).toBe(1.0);
      expect(result.fileProgress).toBe(1.0);
      expect(result.outerOffset).toBeCloseTo(0);
    });
  });
});
