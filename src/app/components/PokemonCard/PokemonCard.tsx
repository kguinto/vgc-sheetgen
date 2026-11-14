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
import {
  checkPoints,
  describePointsProblem,
  TOTAL_STAT_POINTS,
  totalPoints,
} from '../../../core/team/points';
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

  // Digits only, as whole numbers: up to three for a stat's total, two for
  // its SP. Clearing one leaves it blank.
  const number = (text: string, maxDigits: number) => {
    const digits = text.replace(/\D/g, '').slice(0, maxDigits);

    return digits ? Number(digits) : null;
  };

  const setStat = (stat: StatKey, text: string) =>
    set({ stats: { ...pokemon.stats, [stat]: number(text, 3) } });

  const setPoints = (stat: StatKey, text: string) =>
    set({ points: { ...pokemon.points, [stat]: number(text, 2) } });

  // SP that break the game's rules must have been misread (or mistyped).
  const pointsProblems = checkPoints(pokemon.points);

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
          Sp. Def, and Speed on the right. Each row is the stat's name, its
          total, and its Stat Points (SP), as the game shows them. */}
      <div className={styles.stats}>
        {[STAT_KEYS.slice(0, 3), STAT_KEYS.slice(3)].map((column, i) => [
          <div
            key={`${column[0]}-heading`}
            className={`${styles.statHeading}${i > 0 ? ` ${styles.secondHeading}` : ''}`}
          >
            <span>Stat</span>
            <span>SP</span>
          </div>,
          ...column.map((stat) => (
            <div key={stat} className={styles.stat}>
              <span className={styles.statName}>
                {shortStatName(stat)}
                {alignment?.plus === stat && <StatMarker direction="up" />}
                {alignment?.minus === stat && <StatMarker direction="down" />}
              </span>
              <input
                className={`${styles.input} ${styles.number}`}
                aria-label={shortStatName(stat)}
                inputMode="numeric"
                value={pokemon.stats[stat] ?? ''}
                onChange={(event) => setStat(stat, event.target.value)}
              />
              <input
                className={`${styles.input} ${styles.number} ${styles.points}`}
                aria-label={`${shortStatName(stat)} SP`}
                inputMode="numeric"
                value={pokemon.points[stat] ?? ''}
                onChange={(event) => setPoints(stat, event.target.value)}
              />
            </div>
          )),
        ])}
      </div>

      {/* The SP total, or what's wrong with the SP, to check against the
          card above. Read out when it changes. */}
      {pointsProblems.length === 0 ? (
        <p className={styles.pointsTotal} role="status">
          SP: {totalPoints(pokemon.points)} / {TOTAL_STAT_POINTS}
        </p>
      ) : (
        <div className={styles.pointsWarning} role="status">
          <p>Check the SP against the card above:</p>
          <ul>
            {pointsProblems.map((problem) => (
              <li key={describePointsProblem(problem)}>
                {describePointsProblem(problem)}.
              </li>
            ))}
          </ul>
        </div>
      )}

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
