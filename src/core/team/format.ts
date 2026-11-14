import { formatAlignment, shortStatName } from './natures';
import { STAT_KEYS, type PokemonSet, type Stats, type Team } from './types';

/**
 * The team as text, to print or copy: the trainer and Team ID, then one
 * block per Pokémon, in the style of the team-sharing format players know
 * from Pokémon Showdown, but with the stats' actual values and their Stat
 * Points (SP).
 */
export function formatTeam(team: Team): string {
  const header = [
    `Trainer: ${team.trainerName || '?'}`,
    // Switch screenshots don't show the Team ID.
    ...(team.teamId ? [`Team ID: ${team.teamId}`] : []),
  ];

  return [header.join('\n'), ...team.pokemon.map(formatPokemon)].join('\n\n');
}

/** One Pokémon's block. A number that wasn't read shows as "?". */
function formatPokemon(pokemon: PokemonSet): string {
  // Each stat's number, e.g. "HP 137 / Atk 78 / …".
  const perStat = (values: Stats) =>
    STAT_KEYS.map(
      (stat) => `${shortStatName(stat)} ${values[stat] ?? '?'}`,
    ).join(' / ');

  return [
    pokemon.item ? `${pokemon.species} @ ${pokemon.item}` : pokemon.species,
    `Ability: ${pokemon.ability}`,
    `Nature: ${formatAlignment(pokemon.alignment)}`,
    `Stats: ${perStat(pokemon.stats)}`,
    `SP: ${perStat(pokemon.points)}`,
    ...pokemon.moves.map((move) => `- ${move}`),
  ].join('\n');
}
