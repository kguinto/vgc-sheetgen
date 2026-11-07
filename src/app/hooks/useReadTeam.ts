import { useEffect } from 'react';
import { formatScreenshotProblem } from '../../core/ocr/screenshot-problems';
import { formatTeam } from '../../core/team/format';
import { readTeamOnDevice } from '../../browser/read-team';

/**
 * Reads a team from its screenshots while the component using it is shown,
 * and writes the progress and the outcome to the browser's console. Reading
 * the same screenshots again reuses the earlier read (see
 * `readTeamOnDevice`). Showing the outcome on the page comes later.
 */
export function useReadTeam(screenshots: File[]) {
  useEffect(() => {
    // Leaving the page before the read finishes means nobody's waiting for
    // its outcome. (In development, React also runs this twice on purpose;
    // the second run gets the same read, so it's only logged once.)
    const left = new AbortController();
    const started = performance.now();
    let lastQuarter = 0;

    console.info('Reading the screenshots…');

    readTeamOnDevice(screenshots, (done, total) => {
      // A line for each quarter, rather than one per field.
      const quarter = Math.floor((done / total) * 4);

      if (quarter > lastQuarter) {
        lastQuarter = quarter;
        console.info(`Reading the text: ${done}/${total}`);
      }
    }).then(
      (result) => {
        if (left.signal.aborted) return;

        const seconds = ((performance.now() - started) / 1000).toFixed(1);

        if (result.team) {
          console.info(
            `Read the team in ${seconds} s:\n\n${formatTeam(result.team)}`,
          );
        } else {
          console.warn(
            `These screenshots can't be used:\n${result.problems.map(formatScreenshotProblem).join('\n')}`,
          );
        }

        // Everything worked out, field by field, for a closer look.
        console.debug('Every field as read:', result);
      },
      (err: unknown) => {
        if (!left.signal.aborted)
          console.error("Couldn't read the screenshots:", err);
      },
    );

    return () => left.abort();
  }, [screenshots]);
}
