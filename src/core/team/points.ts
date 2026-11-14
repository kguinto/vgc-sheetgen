// Stat Points (SP): the points a player puts into a Pokémon's stats in
// Pokémon Champions. Each stat takes 0 to 32, and every Pokémon has exactly
// 66 to spread. A spread that breaks these rules can't be right, so it
// points to a misread (or mistyped) number.

import { STAT_KEYS, type StatKey, type Stats } from './types';

/** Each stat's name as the game's Stats tab shows it. */
const STAT_NAMES: Record<StatKey, string> = {
  hp: 'HP',
  atk: 'Attack',
  def: 'Defense',
  spa: 'Sp. Atk',
  spd: 'Sp. Def',
  spe: 'Speed',
};

/** The most SP one stat can have. */
export const MAX_STAT_POINTS = 32;

/** The SP every Pokémon has, spread over its six stats. */
export const TOTAL_STAT_POINTS = 66;

/** Something wrong with a Pokémon's SP. */
export type PointsProblem =
  /** A stat's SP wasn't read, or was left blank. */
  | { code: 'missing'; stat: StatKey }
  /** A stat has more than `MAX_STAT_POINTS`. */
  | { code: 'too-many'; stat: StatKey; points: number }
  /**
   * The stats don't add up to `TOTAL_STAT_POINTS`. Only checked when every
   * stat has a number.
   */
  | { code: 'wrong-total'; total: number };

/** The SP of the stats that have a number, added up. */
export function totalPoints(points: Stats): number {
  return STAT_KEYS.reduce((sum, stat) => sum + (points[stat] ?? 0), 0);
}

/** Everything wrong with a Pokémon's SP, or nothing if they follow the rules. */
export function checkPoints(points: Stats): PointsProblem[] {
  const problems: PointsProblem[] = [];

  for (const stat of STAT_KEYS) {
    const value = points[stat];

    if (value === null) problems.push({ code: 'missing', stat });
    else if (value > MAX_STAT_POINTS) {
      problems.push({ code: 'too-many', stat, points: value });
    }
  }

  const complete = STAT_KEYS.every((stat) => points[stat] !== null);
  const total = totalPoints(points);

  if (complete && total !== TOTAL_STAT_POINTS) {
    problems.push({ code: 'wrong-total', total });
  }

  return problems;
}

/** The problem in words, e.g. "Speed has 38 SP; the most is 32". */
export function describePointsProblem(problem: PointsProblem): string {
  switch (problem.code) {
    case 'missing':
      return `${STAT_NAMES[problem.stat]}'s SP is blank`;
    case 'too-many':
      return `${STAT_NAMES[problem.stat]} has ${problem.points} SP; the most is ${MAX_STAT_POINTS}`;
    case 'wrong-total':
      return `SP add up to ${problem.total}, not ${TOTAL_STAT_POINTS}`;
  }
}
