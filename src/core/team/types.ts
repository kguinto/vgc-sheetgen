/** The six battle stats, in the order the game and the team list show them. */
export const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;

/** One of the six stats: HP, Attack, Defense, Sp. Atk, Sp. Def, or Speed. */
export type StatKey = (typeof STAT_KEYS)[number];
