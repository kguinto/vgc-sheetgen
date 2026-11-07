import styles from './StepIndicator.module.css';

type Props = {
  /** Each step's name, in order. */
  steps: readonly string[];
  /** Which step you're on: 0 for the first. */
  current: number;
  /**
   * Goes back to a step you've finished. Without it, finished steps can't be
   * clicked.
   */
  onSelect?: (step: number) => void;
};

/**
 * Shows which step you're on, e.g. "1 Screenshots · 2 Review · 3 Team list".
 * Finished steps can be clicked to go back to them; later steps can't, since
 * each step needs the one before it.
 */
export function StepIndicator({ steps, current, onSelect }: Props) {
  return (
    <ol className={styles.steps}>
      {steps.map((name, i) => {
        const done = i < current;

        const content = (
          <>
            <span className={styles.number}>{i + 1}</span>
            <span className={styles.name}>{name}</span>
          </>
        );

        return (
          <li
            key={name}
            className={i === current ? styles.current : done ? styles.done : ''}
            aria-current={i === current ? 'step' : undefined}
          >
            {done && onSelect ? (
              <button
                type="button"
                className={styles.step}
                onClick={() => onSelect(i)}
                aria-label={`Go back to step ${i + 1}: ${name}`}
              >
                {content}
              </button>
            ) : (
              <span className={styles.step}>{content}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
