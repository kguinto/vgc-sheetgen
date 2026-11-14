import { natureFromAlignment } from './natures';
import type { PokemonSet, Team } from './types';

/** VGC is played at level 50, whatever the Pokémon's level in the game. */
const VGC_LEVEL = 50;

/**
 * The team in Pokémon Showdown's text format, to paste into its
 * teambuilder ("Import from text"), e.g.:
 *
 *     Tyranitar @ Tyranitarite
 *     Ability: Sand Stream
 *     Level: 50
 *     Jolly Nature
 *     - Protect
 *     - Rock Slide
 *
 * Stats aren't included: Showdown describes them with EVs and IVs, which
 * the screenshots don't show, not the totals the game displays.
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

  return [
    item ? `${species} @ ${item}` : species,
    ...(ability ? [`Ability: ${ability}`] : []),
    `Level: ${VGC_LEVEL}`,
    ...(nature ? [`${nature} Nature`] : []),
    ...pokemon.moves
      .map((move) => move.trim())
      .filter(Boolean)
      .map((move) => `- ${move}`),
  ].join('\n');
}
