import { useId, useState } from 'react';
import type { Team } from '../../../core/team/types';
import type { PlayerDetails } from '../../../core/teamsheet/player';
import { PdfPreview } from '../../components/PdfPreview/PdfPreview';
import { ProgressBar } from '../../components/ProgressBar/ProgressBar';
import { ShowdownExport } from '../../components/ShowdownExport/ShowdownExport';
import { tabPanelProps } from '../../components/Tabs/tab-ids';
import { Tabs, type Tab } from '../../components/Tabs/Tabs';
import { useTeamsheet } from '../../hooks/useTeamsheet';
import { teamsheetFileName } from '../../teamsheet';
import styles from './TeamsheetPage.module.css';

type Props = {
  /** The team as read and corrected on the Review step. */
  team: Team;
  /** What the player filled in for the top of the form. */
  player: PlayerDetails;
};

type View = 'pdf' | 'showdown';

/** The ways to get the team. */
const VIEWS: Tab<View>[] = [
  { id: 'pdf', label: 'PDF' },
  { id: 'showdown', label: 'Showdown' },
];

/**
 * Step 3: the team, ready to use: the official team list form, filled in,
 * to look over, then download or print; or the team as Pokémon Showdown
 * text, to copy.
 */
export function TeamsheetPage({ team, player }: Props) {
  const [view, setView] = useState<View>('pdf');
  const ids = useId();

  return (
    <section aria-labelledby="teamsheet-heading">
      <h2 id="teamsheet-heading">Your teamsheet</h2>
      <p className="hint">
        Get your team as the official team list, to print, or as text for
        Pokémon Showdown.
      </p>

      <Tabs
        tabs={VIEWS}
        active={view}
        onChange={setView}
        label="View"
        idPrefix={ids}
      />

      <div {...tabPanelProps(ids, 'pdf', view)}>
        <PdfView team={team} player={player} />
      </div>

      <div {...tabPanelProps(ids, 'showdown', view)}>
        <ShowdownExport team={team} />
      </div>
    </section>
  );
}

/** The filled-in form: a preview, with ways to download and open it. */
function PdfView({ team, player }: Props) {
  return (
    <>
      <p className={styles.hint}>
        Print both pages: hand the first to tournament staff, and keep the
        second to show your opponents. Anything left blank can be written in by
        hand.
      </p>
      <PdfContent team={team} player={player} />
    </>
  );
}

/** The form once it's filled in, or how filling it in is going. */
function PdfContent({ team, player }: Props) {
  const sheet = useTeamsheet(team, player);

  switch (sheet.status) {
    case 'making':
      return <ProgressBar label="Filling in the team list…" />;

    case 'failed':
      return (
        <p className={styles.message} role="alert">
          The team list couldn't be filled in. Check your internet connection,
          then go back a step and try again.
        </p>
      );

    case 'done':
      return (
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
      );
  }
}
