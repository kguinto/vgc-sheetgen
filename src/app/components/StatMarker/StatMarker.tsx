import styles from './StatMarker.module.css';

/**
 * The game's mark for a stat the nature raises (a pink double chevron
 * pointing up) or lowers (a blue one pointing down).
 */
export function StatMarker({ direction }: { direction: 'up' | 'down' }) {
  const up = direction === 'up';
  const label = up ? 'Raised by nature' : 'Lowered by nature';

  return (
    <svg
      className={up ? styles.up : styles.down}
      viewBox="0 0 10 10"
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      <path d={up ? 'M1 5 5 1 9 5M1 9 5 5 9 9' : 'M1 1 5 5 9 1M1 5 5 9 9 5'} />
    </svg>
  );
}
