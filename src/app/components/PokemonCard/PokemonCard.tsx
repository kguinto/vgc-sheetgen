import type { Rect, RgbaImage } from '../../../core/ocr/image';
import { natureFromAlignment, shortStatName } from '../../../core/team/natures';
import {
  STAT_KEYS,
  type PokemonSet,
  type StatKey,
} from '../../../core/team/types';
import { Crop } from '../Crop/Crop';
import { StatMarker } from '../StatMarker/StatMarker';
import styles from './PokemonCard.module.css';

/** Part of a screenshot: this Pokémon's card on one of the tabs. */
export type CardCrop = { image: RgbaImage; rect: Rect };

type Props = {
  /** Its place on the team, from 1. */
  position: number;
  pokemon: PokemonSet;
  /** Its card on the Moves & More tab, to check the values against. */
  movesCrop?: CardCrop;
  /** Its card on the Stats tab. */
  statsCrop?: CardCrop;
};

/**
 * One Pokémon as it was read, to check against the game: each tab's card
 * from the screenshot, above the values read from it, laid out the way the
 * card shows them.
 */
export function PokemonCard({
  position,
  pokemon,
  movesCrop,
  statsCrop,
}: Props) {
  const { alignment } = pokemon;
  const name = `Pokémon ${position}`;

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
        <dl className={styles.details}>
          <Row label="Ability" value={pokemon.ability} />
          <Row label="Held item" value={pokemon.item} />
        </dl>
        <dl className={styles.details}>
          <div className={styles.row}>
            <dt>Moves</dt>
            <dd>
              <ol className={styles.moveList}>
                {[0, 1, 2, 3].map((i) => (
                  <li key={i}>
                    <Value value={pokemon.moves[i]} />
                  </li>
                ))}
              </ol>
            </dd>
          </div>
        </dl>
      </div>

      {statsCrop && <Crop {...statsCrop} label={`${name} on the Stats tab`} />}

      {/* Like the Stats card: HP, Attack, and Defense on the left; Sp. Atk,
          Sp. Def, and Speed on the right. */}
      <dl className={styles.stats}>
        {STAT_KEYS.map((stat) => (
          <div key={stat} className={styles.stat}>
            <dt>
              {shortStatName(stat)}
              {alignment?.plus === stat && <StatMarker direction="up" />}
              {alignment?.minus === stat && <StatMarker direction="down" />}
            </dt>
            <dd>
              <Value value={statValue(pokemon, stat)} />
            </dd>
          </div>
        ))}
      </dl>

      <dl className={styles.details}>
        {/* The five neutral natures look the same in the game, so they
            can't be told apart. */}
        <Row
          label="Nature"
          value={natureFromAlignment(alignment) ?? 'Neutral'}
        />
      </dl>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.row}>
      <dt>{label}</dt>
      <dd>
        <Value value={value} />
      </dd>
    </div>
  );
}

/** A value as read, or a dash where nothing was read. */
function Value({ value }: { value: string | undefined }) {
  return value ? (
    <>{value}</>
  ) : (
    <span className={styles.blank} aria-label="Blank">
      —
    </span>
  );
}

function statValue(pokemon: PokemonSet, stat: StatKey): string | undefined {
  const value = pokemon.stats[stat];

  return value === null ? undefined : String(value);
}
