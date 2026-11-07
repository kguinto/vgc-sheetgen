import { useState } from 'react';
import { DropZone } from '../../components/DropZone/DropZone';
import { ScreenshotList } from '../../components/ScreenshotList/ScreenshotList';
import styles from './ScreenshotsPage.module.css';

/** A Moves & More screenshot and a Stats one. */
export const SCREENSHOTS_NEEDED = 2;

const ACCEPTED_TYPES = ['image/png', 'image/jpeg'];

type Props = {
  screenshots: File[];
  onChange(screenshots: File[]): void;
};

/**
 * Step 1: add a screenshot of the Battle Team's Moves & More tab and one of
 * its Stats tab. Which is which is worked out later, so the order doesn't
 * matter.
 */
export function ScreenshotsPage({ screenshots, onChange }: Props) {
  const [rejected, setRejected] = useState<File[]>([]);

  // Adding more than two keeps the latest two, so a wrong screenshot can be
  // replaced by adding the right one.
  const add = (accepted: File[], rejectedFiles: File[]) => {
    setRejected(rejectedFiles);

    if (accepted.length > 0) {
      onChange([...screenshots, ...accepted].slice(-SCREENSHOTS_NEEDED));
    }
  };

  return (
    <section aria-labelledby="screenshots-heading">
      <h2 id="screenshots-heading">Add your screenshots</h2>
      <p className="hint">
        One of the Battle Team's <strong>Moves &amp; More</strong> tab and one
        of its <strong>Stats</strong> tab, in either order.
      </p>

      <DropZone accept={ACCEPTED_TYPES} onFiles={add}>
        <span className={styles.dropTitle}>
          Drop screenshots anywhere on this page, or click to choose
        </span>
        <span className="hint">
          PNG or JPEG · {screenshots.length} of {SCREENSHOTS_NEEDED} added
        </span>
      </DropZone>

      {rejected.length > 0 && (
        <p className={styles.error} role="alert">
          {rejected.map((f) => f.name).join(', ')}{' '}
          {rejected.length === 1 ? "isn't" : "aren't"} a PNG or JPEG image, so{' '}
          {rejected.length === 1 ? 'it was' : 'they were'} skipped.
        </p>
      )}

      <ScreenshotList
        screenshots={screenshots}
        onRemove={(index) => {
          setRejected([]);
          onChange(screenshots.filter((_, i) => i !== index));
        }}
      />
    </section>
  );
}
