/** The six battle stats, in the order the game and the team list show them. */
export const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;

/** One of the six stats: HP, Attack, Defense, Sp. Atk, Sp. Def, or Speed. */
export type StatKey = (typeof STAT_KEYS)[number];

/**
 * The five stats a nature can raise or lower, in the same order. HP is never
 * affected by a nature.
 */
export const ALIGNABLE_STAT_KEYS = ['atk', 'def', 'spa', 'spd', 'spe'] as const;

/** One of the five stats a nature can raise or lower. */
export type AlignableStatKey = (typeof ALIGNABLE_STAT_KEYS)[number];

/** Each stat's number, or `null` where it wasn't read. */
export type Stats = Record<StatKey, number | null>;

/**
 * Which stat the nature raises and which it lowers, as the game's ⇑ and ⇓
 * show it, e.g. `{ plus: 'spe', minus: 'spa' }` for Jolly. `null` for a
 * neutral nature, which shows no arrows.
 */
export type StatAlignment = {
  plus: AlignableStatKey;
  minus: AlignableStatKey;
} | null;

/** One Pokémon, as it goes on the team list. */
export type PokemonSet = {
  species: string;
  ability: string;
  /** Blank if it holds no item. */
  item: string;
  /** Up to four. */
  moves: string[];
  stats: Stats;
  alignment: StatAlignment;
};

/** A Battle Team, ready to print or put on the team list. */
export type Team = {
  /** Blank on Switch screenshots, which don't show it. */
  teamId: string;
  trainerName: string;
  pokemon: PokemonSet[];
};
