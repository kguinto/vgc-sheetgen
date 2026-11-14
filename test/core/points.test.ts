import { describe, expect, it } from 'vitest';
import {
  checkPoints,
  describePointsProblem,
  totalPoints,
} from '../../src/core/team/points';
import type { Stats } from '../../src/core/team/types';

/** Tyranitar's spread from the 1080p fixture: 66 in all. */
const valid: Stats = { hp: 0, atk: 21, def: 0, spa: 0, spd: 13, spe: 32 };

describe('checkPoints', () => {
  it('accepts a spread that follows the rules', () => {
    expect(checkPoints(valid)).toEqual([]);
    expect(totalPoints(valid)).toBe(66);
  });

  it('points out a stat with more than 32', () => {
    // 38 instead of 32, e.g. a misread 3: still 72 in all.
    expect(checkPoints({ ...valid, spe: 38 })).toEqual([
      { code: 'too-many', stat: 'spe', points: 38 },
      { code: 'wrong-total', total: 72 },
    ]);
  });

  it('points out a total other than 66', () => {
    expect(checkPoints({ ...valid, atk: 12 })).toEqual([
      { code: 'wrong-total', total: 57 },
    ]);
  });

  it("points out a blank stat, and doesn't check the total without it", () => {
    expect(checkPoints({ ...valid, spd: null })).toEqual([
      { code: 'missing', stat: 'spd' },
    ]);
  });
});

describe('describePointsProblem', () => {
  it('says what to check, in the game’s words', () => {
    expect(
      describePointsProblem({ code: 'too-many', stat: 'spe', points: 38 }),
    ).toBe('Speed has 38 SP; the most is 32');
    expect(describePointsProblem({ code: 'wrong-total', total: 57 })).toBe(
      'SP add up to 57, not 66',
    );
    expect(describePointsProblem({ code: 'missing', stat: 'spa' })).toBe(
      "Sp. Atk's SP is blank",
    );
  });
});
