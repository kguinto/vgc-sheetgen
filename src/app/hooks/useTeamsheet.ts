import { useEffect, useState } from 'react';
import type { Team } from '../../core/team/types';
import type { PlayerDetails } from '../../core/teamsheet/player';
import type { SheetWarning } from '../../core/teamsheet/render';
import { makeTeamsheet } from '../teamsheet';

/** Where filling in the form has got to. */
export type TeamsheetState =
  | { status: 'making' }
  | {
      status: 'done';
      /** A temporary URL for the PDF, for previewing and downloading it. */
      url: string;
      /** Things to check on the printed form, e.g. a name too long for its box. */
      warnings: SheetWarning[];
    }
  | { status: 'failed' };

/**
 * Fills in the team list form while the component using it is shown, again
 * whenever the team or the player's details change.
 */
export function useTeamsheet(
  team: Team,
  player: PlayerDetails,
): TeamsheetState {
  // The latest outcome, with what it's for, so an outcome for an earlier
  // team isn't shown for a changed one.
  const [latest, setLatest] = useState<{
    team: Team;
    player: PlayerDetails;
    state: TeamsheetState;
  }>();

  useEffect(() => {
    const left = new AbortController();
    // The PDF is kept in memory until its URL is released.
    let url: string | undefined;

    makeTeamsheet(team, player).then(
      ({ pdf, warnings }) => {
        if (left.signal.aborted) return;

        url = URL.createObjectURL(
          new Blob([new Uint8Array(pdf)], { type: 'application/pdf' }),
        );
        setLatest({ team, player, state: { status: 'done', url, warnings } });
      },
      (err: unknown) => {
        console.error("Couldn't fill in the team list:", err);

        if (!left.signal.aborted) {
          setLatest({ team, player, state: { status: 'failed' } });
        }
      },
    );

    return () => {
      left.abort();

      if (url) URL.revokeObjectURL(url);
    };
  }, [team, player]);

  return latest?.team === team && latest.player === player
    ? latest.state
    : { status: 'making' };
}
