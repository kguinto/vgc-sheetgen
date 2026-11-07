import { useId, type ReactNode } from 'react';
import {
  AGE_DIVISIONS,
  type PlayerDetails as Details,
} from '../../../core/teamsheet/player';
import styles from './PlayerDetails.module.css';

type Props = {
  details: Details;
  onChange: (details: Details) => void;
  /** The trainer name in the game, which is read from the screenshots. */
  trainerName: string;
  onTrainerNameChange: (trainerName: string) => void;
};

/**
 * The fields at the top of the team list form, laid out like it: the
 * player's and team's names on the left, the age division, IDs, and date of
 * birth on the right. All optional. Only the trainer name comes from the
 * screenshots; the rest are typed in.
 */
export function PlayerDetails({
  details,
  onChange,
  trainerName,
  onTrainerNameChange,
}: Props) {
  const headingId = useId();
  const set = (change: Partial<Details>) => onChange({ ...details, ...change });

  const setBirth = (
    part: keyof Details['birthDate'],
    text: string,
    max: number,
  ) =>
    set({
      birthDate: {
        ...details.birthDate,
        [part]: text.replace(/\D/g, '').slice(0, max),
      },
    });

  return (
    <section className={styles.card} aria-labelledby={headingId}>
      <h3 id={headingId} className={styles.title}>
        Trainer
      </h3>
      <p className={styles.hint}>
        For the top of the team list, and all optional. They stay on this device
        and are gone when you close the page.
      </p>

      <div className={styles.fields}>
        <div className={styles.column}>
          <Field label="Player name">
            <input
              value={details.playerName}
              onChange={(e) => set({ playerName: e.target.value })}
            />
          </Field>
          <Field label="Trainer name in game">
            <input
              value={trainerName}
              onChange={(e) => onTrainerNameChange(e.target.value)}
            />
          </Field>
          <Field label="Battle Team number / name">
            <input
              value={details.battleTeam}
              onChange={(e) => set({ battleTeam: e.target.value })}
            />
          </Field>
          <Field label="Switch profile name">
            <input
              value={details.switchProfileName}
              onChange={(e) => set({ switchProfileName: e.target.value })}
            />
          </Field>
        </div>

        <div className={styles.column}>
          <fieldset className={styles.field}>
            <legend className={styles.label}>Age division</legend>
            <div className={styles.divisions}>
              {AGE_DIVISIONS.map(({ value, label }) => (
                <label key={value} className={styles.division}>
                  <input
                    type="radio"
                    name="age-division"
                    checked={details.ageDivision === value}
                    onChange={() => set({ ageDivision: value })}
                  />
                  {label}
                </label>
              ))}
              {details.ageDivision && (
                <button
                  type="button"
                  className={styles.clear}
                  onClick={() => set({ ageDivision: null })}
                >
                  Clear
                </button>
              )}
            </div>
          </fieldset>
          <Field label="Player ID">
            <input
              value={details.playerId}
              onChange={(e) => set({ playerId: e.target.value })}
            />
          </Field>
          <fieldset className={styles.field}>
            <legend className={styles.label}>Date of birth</legend>
            <div className={styles.date}>
              <input
                className={styles.datePart}
                aria-label="Month"
                placeholder="MM"
                inputMode="numeric"
                value={details.birthDate.month}
                onChange={(e) => setBirth('month', e.target.value, 2)}
              />
              <span aria-hidden>/</span>
              <input
                className={styles.datePart}
                aria-label="Day"
                placeholder="DD"
                inputMode="numeric"
                value={details.birthDate.day}
                onChange={(e) => setBirth('day', e.target.value, 2)}
              />
              <span aria-hidden>/</span>
              <input
                className={`${styles.datePart} ${styles.year}`}
                aria-label="Year"
                placeholder="YYYY"
                inputMode="numeric"
                value={details.birthDate.year}
                onChange={(e) => setBirth('year', e.target.value, 4)}
              />
            </div>
          </fieldset>
          <Field label="Support ID">
            <input
              value={details.supportId}
              onChange={(e) => set({ supportId: e.target.value })}
            />
          </Field>
        </div>
      </div>
    </section>
  );
}

/** A label above its input. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {children}
    </label>
  );
}
