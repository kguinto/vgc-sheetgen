import type { Team } from '../../../core/team/types';
import type { PlayerDetails } from '../../../core/teamsheet/player';
import { PdfPreview } from '../../components/PdfPreview/PdfPreview';
import { ProgressBar } from '../../components/ProgressBar/ProgressBar';
import { useTeamsheet } from '../../hooks/useTeamsheet';
import { teamsheetFileName } from '../../teamsheet';
import styles from './TeamsheetPage.module.css';

type Props = {
  /** The team as read and corrected on the Review step. */
  team: Team;
  /** What the player filled in for the top of the form. */
  player: PlayerDetails;
};

/**
 * Step 3: the official team list form, filled in with the team, to look
 * over, then download or print.
 */
export function TeamsheetPage({ team, player }: Props) {
  const sheet = useTeamsheet(team, player);

  return (
    <section aria-labelledby="teamsheet-heading">
      <h2 id="teamsheet-heading">Your teamsheet</h2>
      <p className="hint">
        Print both pages: hand the first to tournament staff, and keep the
        second to show your opponents. Anything left blank can be written in by
        hand.
      </p>

      {sheet.status === 'making' && (
        <ProgressBar label="Filling in the team list…" />
      )}

      {sheet.status === 'failed' && (
        <p className={styles.message} role="alert">
          The team list couldn't be filled in. Check your internet connection,
          then go back a step and try again.
        </p>
      )}

      {sheet.status === 'done' && (
        <>
          {sheet.warnings.length > 0 && (
            <div className={styles.warnings} role="status">
              <p>Check these on the printed form:</p>
              <ul>
                {sheet.warnings.map((warning) => (
                  <li key={`${warning.page} ${warning.field}`}>
                    {warning.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.actions}>
            <a
              className="button primary"
              href={sheet.url}
              download={teamsheetFileName(team)}
            >
              Download PDF
            </a>
            <a
              className="button"
              href={sheet.url}
              target="_blank"
              rel="noopener"
            >
              Open in a new tab
            </a>
          </div>

          <PdfPreview url={sheet.url} title="The filled-in team list" />
        </>
      )}
    </section>
  );
}
