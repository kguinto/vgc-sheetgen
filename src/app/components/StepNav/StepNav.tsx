import styles from './StepNav.module.css';

type Props = {
  /** Goes to the previous page. Without it, Back is disabled. */
  onBack?: () => void;
  /** Goes to the next page. Without it, there's no Next (the last page). */
  onNext?: () => void;
};

/** The Back and Next buttons under each page. */
export function StepNav({ onBack, onNext }: Props) {
  return (
    <nav className={styles.nav} aria-label="Pages">
      <button type="button" onClick={onBack} disabled={!onBack}>
        Back
      </button>
      {onNext && (
        <button type="button" className="primary" onClick={onNext}>
          Next
        </button>
      )}
    </nav>
  );
}
