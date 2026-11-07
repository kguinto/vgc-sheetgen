// Filling in the official team list form in the browser, with the same
// `renderTeamSheet` as the command-line script.

import type { Team } from '../core/team/types';
import type { PlayerDetails } from '../core/teamsheet/player';
import type { RenderResult } from '../core/teamsheet/render';
import templateUrl from '../assets/play-pokemon-vg-team-list.pdf?url';

/** The blank form, fetched from our own site once and kept. */
let template: Promise<Uint8Array> | undefined;

function loadTemplate(): Promise<Uint8Array> {
  template ??= fetch(templateUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      return response.arrayBuffer();
    })
    .then((buffer) => new Uint8Array(buffer))
    .catch((err: unknown) => {
      // Try again next time, e.g. after the connection comes back.
      template = undefined;
      throw err;
    });

  return template;
}

/**
 * Fills in the form with the team and the player's details. The code that
 * writes PDFs is large and only needed on this last step, so it's loaded the
 * first time it's used rather than with the rest of the app.
 */
export async function makeTeamsheet(
  team: Team,
  player: PlayerDetails,
): Promise<RenderResult> {
  const [{ renderTeamSheet }, form] = await Promise.all([
    import('../core/teamsheet/render'),
    loadTemplate(),
  ]);

  return renderTeamSheet(form, team, player);
}

/** Characters not allowed in file names on Windows or macOS. */
const UNSAFE = /[/\\:*?"<>|\p{Cc}]/gu;

/** The downloaded file's name, e.g. "Louie teamsheet.pdf". */
export function teamsheetFileName(team: Team): string {
  const name = team.trainerName
    .replace(UNSAFE, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return `${name ? `${name} ` : ''}teamsheet.pdf`;
}
