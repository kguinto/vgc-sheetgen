import { formatAlignment, shortStatName } from './natures';
import { STAT_KEYS, type PokemonSet, type Team } from './types';

/**
 * The team as text, to print or copy: the trainer and Team ID, then one
 * block per Pokémon, in the style of the team-sharing format players know
 * from Pokémon Showdown, but with the stats' actual values.
 */
export function formatTeam(team: Team): string {
  const header = [
    `Trainer: ${team.trainerName || '?'}`,
    // Switch screenshots don't show the Team ID.
    ...(team.teamId ? [`Team ID: ${team.teamId}`] : []),
  ];

  return [header.join('\n'), ...team.pokemon.map(formatPokemon)].join('\n\n');
}

/** One Pokémon's block. A stat that wasn't read shows as "?". */
function formatPokemon(pokemon: PokemonSet): string {
  const stats = STAT_KEYS.map(
    (stat) => `${shortStatName(stat)} ${pokemon.stats[stat] ?? '?'}`,
  ).join(' / ');

  return [
    pokemon.item ? `${pokemon.species} @ ${pokemon.item}` : pokemon.species,
    `Ability: ${pokemon.ability}`,
    `Nature: ${formatAlignment(pokemon.alignment)}`,
    `Stats: ${stats}`,
    ...pokemon.moves.map((move) => `- ${move}`),
  ].join('\n');
}
