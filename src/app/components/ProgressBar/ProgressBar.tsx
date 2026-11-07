import styles from './ProgressBar.module.css';

type Props = {
  /** What's happening, e.g. "Reading the text: 41 of 118". */
  label: string;
  /** How far along, from 0 to 1. Without it, the bar shows activity only. */
  value?: number;
};

/** A labeled progress bar. */
export function ProgressBar({ label, value }: Props) {
  return (
    <div className={styles.progress}>
      <span className={styles.label}>{label}</span>
      {/* Without a value, a progress bar shows it's busy rather than how
          far along it is. */}
      <progress className={styles.bar} value={value} aria-label={label} />
    </div>
  );
}
