/**
 * Unit tests for asset-paths utilities
 * Tests getBackgroundForTheme() pure function input/output behaviour
 */

import { getBackgroundForTheme, BACKGROUNDS } from '../../src/utils/asset-paths';

describe('getBackgroundForTheme', () => {
  it('returns BACKGROUNDS.DAY when theme is "day"', () => {
    expect(getBackgroundForTheme('day')).toBe(BACKGROUNDS.DAY);
  });

  it('returns BACKGROUNDS.NIGHT when theme is "night"', () => {
    expect(getBackgroundForTheme('night')).toBe(BACKGROUNDS.NIGHT);
  });
});
