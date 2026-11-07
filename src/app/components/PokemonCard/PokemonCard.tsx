import { useId } from 'react';
import type { Rect, RgbaImage } from '../../../core/ocr/image';
import {
  formatAlignment,
  NATURES,
  shortStatName,
} from '../../../core/team/natures';
import {
  STAT_KEYS,
  type PokemonSet,
  type StatAlignment,
  type StatKey,
} from '../../../core/team/types';
import { Combobox } from '../Combobox/Combobox';
import { Crop } from '../Crop/Crop';
import { StatMarker } from '../StatMarker/StatMarker';
import styles from './PokemonCard.module.css';

/** Part of a screenshot: this Pokémon's card on one of the tabs. */
export type CardCrop = { image: RgbaImage; rect: Rect };

type Props = {
  /** Its place on the team, from 1. */
  position: number;
  pokemon: PokemonSet;
  /** Called with the Pokémon as changed by the user. */
  onChange: (pokemon: PokemonSet) => void;
  /** Its card on the Moves & More tab, to check the values against. */
  movesCrop?: CardCrop;
  /** Its card on the Stats tab. */
  statsCrop?: CardCrop;
};

/**
 * Every nature the game can show: "Neutral" for the five neutral natures,
 * which look the same in the game, then the 20 others, e.g. "Jolly (+Spe /
 * -SpA)". Each option's value is its raised and lowered stats, as JSON.
 */
const NATURE_OPTIONS = [
  null,
  ...NATURES.filter((n) => n.plus !== n.minus).map(({ plus, minus }) => ({
    plus,
    minus,
  })),
].map((alignment: StatAlignment) => ({
  value: JSON.stringify(alignment),
  label: formatAlignment(alignment),
}));

/**
 * One Pokémon, to check against the game and correct: each tab's card from
 * the screenshot, above the values read from it, laid out the way the card
 * shows them. Every value can be edited.
 */
export function PokemonCard({
  position,
  pokemon,
  onChange,
  movesCrop,
  statsCrop,
}: Props) {
  const { alignment } = pokemon;
  const name = `Pokémon ${position}`;
  const natureLabel = useId();

  const set = (change: Partial<PokemonSet>) =>
    onChange({ ...pokemon, ...change });

  // The game shows four move slots, so there are always four inputs; an
  // empty one is a slot with no move.
  const setMove = (slot: number, move: string) =>
    set({
      moves: [0, 1, 2, 3].map((i) =>
        i === slot ? move : (pokemon.moves[i] ?? ''),
      ),
    });

  const setStat = (stat: StatKey, text: string) => {
    // Digits only: stats are whole numbers, at most three digits.
    const digits = text.replace(/\D/g, '').slice(0, 3);

    set({
      stats: { ...pokemon.stats, [stat]: digits ? Number(digits) : null },
    });
  };

  return (
    <article className={styles.card} aria-label={name}>
      <h3 className={styles.title}>
        {name}
        {pokemon.species && `: ${pokemon.species}`}
      </h3>

      {movesCrop && (
        <Crop {...movesCrop} label={`${name} on the Moves & More tab`} />
      )}

      {/* Like the Moves & More card: details on the left, moves on the
          right. */}
      <div className={styles.moves}>
        <div className={styles.column}>
          <TextField
            label="Species"
            value={pokemon.species}
            onChange={(species) => set({ species })}
          />
          <TextField
            label="Ability"
            value={pokemon.ability}
            onChange={(ability) => set({ ability })}
          />
          <TextField
            label="Held item"
            value={pokemon.item}
            onChange={(item) => set({ item })}
          />
        </div>
        <fieldset className={styles.column}>
          <legend className={styles.label}>Moves</legend>
          {[0, 1, 2, 3].map((slot) => (
            <input
              key={slot}
              className={styles.input}
              aria-label={`Move ${slot + 1}`}
              value={pokemon.moves[slot] ?? ''}
              onChange={(event) => setMove(slot, event.target.value)}
            />
          ))}
        </fieldset>
      </div>

      {statsCrop && <Crop {...statsCrop} label={`${name} on the Stats tab`} />}

      {/* Like the Stats card: HP, Attack, and Defense on the left; Sp. Atk,
          Sp. Def, and Speed on the right. */}
      <div className={styles.stats}>
        {STAT_KEYS.map((stat) => (
          <label key={stat} className={styles.stat}>
            <span className={styles.statName}>
              {shortStatName(stat)}
              {alignment?.plus === stat && <StatMarker direction="up" />}
              {alignment?.minus === stat && <StatMarker direction="down" />}
            </span>
            <input
              className={`${styles.input} ${styles.number}`}
              inputMode="numeric"
              value={pokemon.stats[stat] ?? ''}
              onChange={(event) => setStat(stat, event.target.value)}
            />
          </label>
        ))}
      </div>

      <div className={styles.field}>
        <span id={natureLabel} className={styles.label}>
          Nature
        </span>
        <Combobox
          aria-labelledby={natureLabel}
          options={NATURE_OPTIONS}
          value={JSON.stringify(alignment)}
          onChange={(value) =>
            set({ alignment: JSON.parse(value) as StatAlignment })
          }
        />
      </div>
    </article>
  );
}

/** A labeled text input, the label above it. */
function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input
        className={styles.input}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
