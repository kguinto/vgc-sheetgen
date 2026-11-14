import { natureFromAlignment, shortStatName } from './natures';
import { STAT_KEYS, type PokemonSet, type Stats, type Team } from './types';

/** VGC is played at level 50, whatever the Pokémon's level in the game. */
const VGC_LEVEL = 50;

/**
 * The team in Pokémon Showdown's text format, to paste into its
 * teambuilder ("Import from text"), e.g.:
 *
 *     Tyranitar @ Tyranitarite
 *     Ability: Sand Stream
 *     Level: 50
 *     EVs: 21 Atk / 13 SpD / 32 Spe
 *     Jolly Nature
 *     - Protect
 *     - Rock Slide
 *
 * For Pokémon Champions, Showdown's "EVs" line holds the Stat Points (SP).
 * The stats' totals aren't included: Showdown works them out itself.
 */
export function formatShowdown(team: Team): string {
  return team.pokemon.map(formatPokemon).join('\n\n');
}

function formatPokemon(pokemon: PokemonSet): string {
  const species = pokemon.species.trim();
  const item = pokemon.item.trim();
  const ability = pokemon.ability.trim();
  // A neutral nature isn't written: the five neutral natures look the same
  // in the game, and Showdown treats a missing nature as neutral.
  const nature = natureFromAlignment(pokemon.alignment);
  const evs = formatPoints(pokemon.points);

  return [
    item ? `${species} @ ${item}` : species,
    ...(ability ? [`Ability: ${ability}`] : []),
    `Level: ${VGC_LEVEL}`,
    ...(evs ? [`EVs: ${evs}`] : []),
    ...(nature ? [`${nature} Nature`] : []),
    ...pokemon.moves
      .map((move) => move.trim())
      .filter(Boolean)
      .map((move) => `- ${move}`),
  ].join('\n');
}

/**
 * The SP as Showdown writes them: stats with any, in Showdown's order and
 * with its names, e.g. "26 HP / 14 Def / 26 Spe". A stat with 0 SP is left
 * out, as Showdown does, and so is one that wasn't read (the Review step
 * points that out). Empty if no stat has any.
 */
function formatPoints(points: Stats): string {
  return STAT_KEYS.flatMap((stat) => {
    const value = points[stat];

    return value ? [`${value} ${shortStatName(stat)}`] : [];
  }).join(' / ');
}
