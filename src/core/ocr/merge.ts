import {
  ALIGNABLE_STAT_KEYS,
  STAT_KEYS,
  type AlignableStatKey,
  type PokemonSet,
  type StatAlignment,
  type Team,
} from '../team/types';
import type { FieldResult } from './read';

/**
 * Puts the team together from what was read on its two screens, matching
 * each Pokémon by its card's position. Species, ability, held item, and
 * moves come from the Moves & More screen; stats and the nature's arrows
 * from the Stats screen. The trainer name and Team ID are on both; the
 * Moves & More reading is used.
 *
 * A card with a Pokémon on only one of the screens is still included, with
 * what that screen shows. (Flagging that, and readings that disagree
 * between the screens, comes later.)
 */
export function mergeTeam(moves: FieldResult[], stats: FieldResult[]): Team {
  const movesRead = byKey(moves);
  const statsRead = byKey(stats);

  /** The text read for `key`: from Moves & More, else Stats, else blank. */
  const text = (key: string) =>
    String(movesRead.get(key)?.value ?? statsRead.get(key)?.value ?? '');

  return {
    teamId: text('teamId'),
    trainerName: text('trainerName'),
    pokemon: filledCards(moves, stats).map((card): PokemonSet => ({
      species: text(`slot.${card}.species`),
      ability: text(`slot.${card}.ability`),
      item: text(`slot.${card}.item`),
      // Fewer than four moves leaves blank move slots, which are dropped.
      moves: [0, 1, 2, 3]
        .map((i) => text(`slot.${card}.moves.${i}`))
        .filter(Boolean),
      stats: Object.fromEntries(
        STAT_KEYS.map((stat) => {
          const value = statsRead.get(`slot.${card}.stats.${stat}`)?.value;

          return [stat, typeof value === 'number' ? value : null];
        }),
      ) as PokemonSet['stats'],
      alignment: alignmentOf(
        ALIGNABLE_STAT_KEYS.map((stat) => ({
          stat,
          arrow: statsRead.get(`slot.${card}.arrows.${stat}`)?.value,
        })),
      ),
    })),
  };
}

/** The readings, by field key. */
function byKey(results: FieldResult[]): Map<string, FieldResult> {
  return new Map(results.map((result) => [result.key, result]));
}

/**
 * Which cards have a Pokémon on either screen, in order. A card's fields
 * are only read when it has one, and their keys start with `slot.<card>.`.
 */
function filledCards(...screens: FieldResult[][]): number[] {
  const cards = screens.flat().flatMap(({ key }) => {
    const match = /^slot\.(\d+)\./.exec(key);

    return match ? [Number(match[1])] : [];
  });

  return [...new Set(cards)].sort((a, b) => a - b);
}

/**
 * The nature's raised and lowered stats, from the arrows read after each
 * stat's name: one ⇑ and one ⇓ on different stats, or none for a neutral
 * nature. Anything else can't be a real nature, so it's left blank (null)
 * for now; flagging it for the user to check comes later.
 */
function alignmentOf(
  arrows: { stat: AlignableStatKey; arrow: unknown }[],
): StatAlignment {
  const up = arrows.filter((a) => a.arrow === 'up');
  const down = arrows.filter((a) => a.arrow === 'down');

  if (up.length === 1 && down.length === 1) {
    return { plus: up[0]!.stat, minus: down[0]!.stat };
  }

  return null;
}
