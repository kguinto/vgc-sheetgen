import { describe, expect, it } from 'vitest';
import {
  formatAlignment,
  natureFromAlignment,
  NATURES,
} from '../../src/core/team/natures';
import { ALIGNABLE_STAT_KEYS } from '../../src/core/team/types';

describe('natures', () => {
  it('has a nature for every pair of different stats, exactly once', () => {
    for (const plus of ALIGNABLE_STAT_KEYS) {
      for (const minus of ALIGNABLE_STAT_KEYS) {
        const matching = NATURES.filter(
          (n) => n.plus === plus && n.minus === minus,
        );

        expect(matching).toHaveLength(1);
      }
    }
  });

  it('names a nature from its arrows', () => {
    expect(natureFromAlignment({ plus: 'spe', minus: 'spa' })).toBe('Jolly');
    expect(natureFromAlignment({ plus: 'spe', minus: 'atk' })).toBe('Timid');
  });

  it("can't name a neutral nature", () => {
    expect(natureFromAlignment(null)).toBeNull();
  });

  it('formats the nature for the team list', () => {
    expect(formatAlignment({ plus: 'spe', minus: 'spa' })).toBe(
      'Jolly (+Spe / -SpA)',
    );
    expect(formatAlignment(null)).toBe('Neutral');
  });
});
