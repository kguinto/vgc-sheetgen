import { useEffect, useState } from 'react';
import type { ReadTeamResult } from '../../core/ocr/pipeline';
import { readTeamOnDevice, type ReadProgress } from '../../browser/read-team';

/** Where reading the screenshots has got to. */
export type ReadState =
  /** Not asked to read anything yet. */
  | { status: 'idle' }
  /**
   * Reading. `progress` is missing until the first field is read, e.g. while
   * the text recognizer is still downloading.
   */
  | { status: 'reading'; progress?: ReadProgress }
  /** Read: the team, or the problems with the screenshots. */
  | { status: 'done'; result: ReadTeamResult }
  /** Something went wrong that isn't about the screenshots. */
  | { status: 'failed'; message: string };

/**
 * Reads a team from its screenshots, on the device, and tracks how it's
 * going. Pass `null` to not read yet. Reading the same screenshots again
 * reuses the earlier read (see `readTeamOnDevice`), and `retry` tries again
 * after a failure.
 */
export function useReadTeam(screenshots: File[] | null): {
  state: ReadState;
  retry: () => void;
} {
  const [attempt, setAttempt] = useState(0);
  // The latest state, with what it's for, so a state left over from other
  // screenshots or an earlier attempt isn't shown for the new ones.
  const [latest, setLatest] = useState<{
    screenshots: File[];
    attempt: number;
    state: ReadState;
  }>();

  useEffect(() => {
    if (!screenshots) return;

    // Leaving stops updates from a read that's no longer shown.
    const left = new AbortController();

    const update = (state: ReadState) => {
      if (!left.signal.aborted) setLatest({ screenshots, attempt, state });
    };

    readTeamOnDevice(screenshots, {
      signal: left.signal,
      onProgress: (progress) => update({ status: 'reading', progress }),
    }).then(
      (result) => {
        update({ status: 'done', result });
        // Everything worked out, field by field, for a closer look.
        console.debug('Read the screenshots:', result);
      },
      (err: unknown) => {
        console.error("Couldn't read the screenshots:", err);
        update({
          status: 'failed',
          message:
            "Couldn't start the text reader. Check your internet connection and try again.",
        });
      },
    );

    return () => left.abort();
  }, [screenshots, attempt]);

  const retry = () => setAttempt((n) => n + 1);

  if (!screenshots) return { state: { status: 'idle' }, retry };

  const isCurrent =
    latest?.screenshots === screenshots && latest.attempt === attempt;

  return { state: isCurrent ? latest.state : { status: 'reading' }, retry };
}
