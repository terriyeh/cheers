/**
 * Unit tests for asset-paths utilities
 * Tests getTimeOfDayBackground() pure function input/output behaviour
 */

import { vi } from 'vitest';
import { getTimeOfDayBackground, BACKGROUNDS } from '../../src/utils/asset-paths';

describe('getTimeOfDayBackground', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── Explicit hour argument ───────────────────────────────────────────────

  describe('with explicit hour argument', () => {
    describe('returns DAY background (6am–5:59pm)', () => {
      it.each([
        [6,  'exactly 6am — start of day'],
        [7,  'early morning'],
        [9,  'mid morning'],
        [12, 'noon'],
        [13, 'early afternoon'],
        [17, 'hour 17 — last full hour of day'],
      ])('hour %i (%s)', (hour) => {
        expect(getTimeOfDayBackground(hour)).toBe(BACKGROUNDS.DAY);
      });
    });

    describe('returns NIGHT background (6pm–5:59am)', () => {
      it.each([
        [0,  'midnight'],
        [1,  'early night'],
        [2,  'early night'],
        [3,  'early night'],
        [4,  'pre-dawn'],
        [5,  'hour 5 — last hour of night'],
        [18, 'exactly 6pm — start of night'],
        [19, 'evening'],
        [20, 'evening'],
        [21, 'night'],
        [22, 'night'],
        [23, 'late night'],
      ])('hour %i (%s)', (hour) => {
        expect(getTimeOfDayBackground(hour)).toBe(BACKGROUNDS.NIGHT);
      });
    });

    describe('boundary precision', () => {
      it('hour 5 is night, hour 6 is day (6am boundary is inclusive for day)', () => {
        expect(getTimeOfDayBackground(5)).toBe(BACKGROUNDS.NIGHT);
        expect(getTimeOfDayBackground(6)).toBe(BACKGROUNDS.DAY);
      });

      it('hour 17 is day, hour 18 is night (6pm boundary is inclusive for night)', () => {
        expect(getTimeOfDayBackground(17)).toBe(BACKGROUNDS.DAY);
        expect(getTimeOfDayBackground(18)).toBe(BACKGROUNDS.NIGHT);
      });
    });

    describe('return values match BACKGROUNDS entries', () => {
      it('DAY result is the BACKGROUNDS.DAY object', () => {
        expect(getTimeOfDayBackground(12)).toBe(BACKGROUNDS.DAY);
      });

      it('DAY file is the day background filename', () => {
        expect(getTimeOfDayBackground(12).file).toBe('background-day-8fps.gif');
      });

      it('DAY skyColor is the day sky color', () => {
        expect(getTimeOfDayBackground(12).skyColor).toBe(BACKGROUNDS.DAY.skyColor);
      });

      it('NIGHT result is the BACKGROUNDS.NIGHT object', () => {
        expect(getTimeOfDayBackground(0)).toBe(BACKGROUNDS.NIGHT);
      });

      it('NIGHT file is the night background filename', () => {
        expect(getTimeOfDayBackground(0).file).toBe('background-night-8fps.gif');
      });

      it('NIGHT skyColor is the night sky color', () => {
        expect(getTimeOfDayBackground(0).skyColor).toBe(BACKGROUNDS.NIGHT.skyColor);
      });
    });
  });

  // ─── No argument — reads current time ────────────────────────────────────

  describe('without argument — uses current time', () => {
    it('returns DAY when system time is 9am', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T09:00:00'));
      expect(getTimeOfDayBackground()).toBe(BACKGROUNDS.DAY);
    });

    it('returns NIGHT when system time is 10pm', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T22:00:00'));
      expect(getTimeOfDayBackground()).toBe(BACKGROUNDS.NIGHT);
    });

    it('returns DAY at exactly 6am wall-clock time', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T06:00:00'));
      expect(getTimeOfDayBackground()).toBe(BACKGROUNDS.DAY);
    });

    it('returns NIGHT at exactly 6pm wall-clock time', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T18:00:00'));
      expect(getTimeOfDayBackground()).toBe(BACKGROUNDS.NIGHT);
    });

    it('returns NIGHT just before 6am (5:59am)', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T05:59:59'));
      expect(getTimeOfDayBackground()).toBe(BACKGROUNDS.NIGHT);
    });

    it('returns DAY just before 6pm (5:59pm)', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T17:59:59'));
      expect(getTimeOfDayBackground()).toBe(BACKGROUNDS.DAY);
    });
  });
});
