import type { AlignableStatKey, StatAlignment, StatKey } from './types';

/** A nature, and the stats it raises and lowers (the same for neutral ones). */
type Nature = { name: string; plus: AlignableStatKey; minus: AlignableStatKey };

/** All 25 natures. The five whose `plus` and `minus` match are neutral. */
export const NATURES: readonly Nature[] = [
  { name: 'Hardy', plus: 'atk', minus: 'atk' },
  { name: 'Lonely', plus: 'atk', minus: 'def' },
  { name: 'Brave', plus: 'atk', minus: 'spe' },
  { name: 'Adamant', plus: 'atk', minus: 'spa' },
  { name: 'Naughty', plus: 'atk', minus: 'spd' },
  { name: 'Bold', plus: 'def', minus: 'atk' },
  { name: 'Docile', plus: 'def', minus: 'def' },
  { name: 'Relaxed', plus: 'def', minus: 'spe' },
  { name: 'Impish', plus: 'def', minus: 'spa' },
  { name: 'Lax', plus: 'def', minus: 'spd' },
  { name: 'Timid', plus: 'spe', minus: 'atk' },
  { name: 'Hasty', plus: 'spe', minus: 'def' },
  { name: 'Serious', plus: 'spe', minus: 'spe' },
  { name: 'Jolly', plus: 'spe', minus: 'spa' },
  { name: 'Naive', plus: 'spe', minus: 'spd' },
  { name: 'Modest', plus: 'spa', minus: 'atk' },
  { name: 'Mild', plus: 'spa', minus: 'def' },
  { name: 'Quiet', plus: 'spa', minus: 'spe' },
  { name: 'Bashful', plus: 'spa', minus: 'spa' },
  { name: 'Rash', plus: 'spa', minus: 'spd' },
  { name: 'Calm', plus: 'spd', minus: 'atk' },
  { name: 'Gentle', plus: 'spd', minus: 'def' },
  { name: 'Sassy', plus: 'spd', minus: 'spe' },
  { name: 'Careful', plus: 'spd', minus: 'spa' },
  { name: 'Quirky', plus: 'spd', minus: 'spd' },
];

/**
 * The nature that raises `plus` and lowers `minus`, e.g. Jolly for +Spe and
 * −SpA. `null` for a neutral alignment: the five neutral natures look the
 * same in the game, so which one it is can't be told from a screenshot.
 */
export function natureFromAlignment(alignment: StatAlignment): string | null {
  if (!alignment || alignment.plus === alignment.minus) return null;

  const nature = NATURES.find(
    (n) => n.plus === alignment.plus && n.minus === alignment.minus,
  );

  return nature?.name ?? null;
}

/** The stats' short names, as the team list shows them. */
const SHORT_STAT_NAMES: Record<StatKey, string> = {
  hp: 'HP',
  atk: 'Atk',
  def: 'Def',
  spa: 'SpA',
  spd: 'SpD',
  spe: 'Spe',
};

/** A stat's short name, e.g. "SpA". */
export function shortStatName(stat: StatKey): string {
  return SHORT_STAT_NAMES[stat];
}

/**
 * The nature for the team list: e.g. "Jolly (+Spe / -SpA)", or "Neutral"
 * when no stat is raised, since the neutral natures can't be told apart.
 */
export function formatAlignment(alignment: StatAlignment): string {
  const nature = natureFromAlignment(alignment);

  if (!alignment || !nature) return 'Neutral';

  const raised = shortStatName(alignment.plus);
  const lowered = shortStatName(alignment.minus);

  return `${nature} (+${raised} / -${lowered})`;
}
