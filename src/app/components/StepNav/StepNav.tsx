import styles from './StepNav.module.css';

type Props = {
  /** Goes to the previous page. Without it, Back is disabled. */
  onBack?: () => void;
  /** Goes to the next page. Without it, there's no Next (the last page). */
  onNext?: () => void;
  /** Whether Next is enabled, e.g. only once both screenshots are added. */
  canContinue?: boolean;
};

/** The Back and Next buttons under each page. */
export function StepNav({ onBack, onNext, canContinue = true }: Props) {
  return (
    <nav className={styles.nav} aria-label="Pages">
      <button type="button" onClick={onBack} disabled={!onBack}>
        Back
      </button>
      {onNext && (
        <button
          type="button"
          className="primary"
          onClick={onNext}
          disabled={!canContinue}
        >
          Next
        </button>
      )}
    </nav>
  );
}
