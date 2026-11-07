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
