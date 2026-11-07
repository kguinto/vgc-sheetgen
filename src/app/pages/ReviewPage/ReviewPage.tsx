import { useReadTeam } from '../../hooks/useReadTeam';

/**
 * Step 2: check the team read from the screenshots. For now, reaching it
 * reads the screenshots and writes the outcome to the browser's console;
 * showing it on the page comes later.
 */
export function ReviewPage({ screenshots }: { screenshots: File[] }) {
  useReadTeam(screenshots);

  return (
    <section>
      <h2>Check your team</h2>
      <p className="hint">
        Coming soon: the team read from your screenshots, to check. For now,
        it's written to the browser's console.
      </p>
    </section>
  );
}
