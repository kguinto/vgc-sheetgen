import { useState } from 'react';
import type { Team } from '../../core/team/types';

/**
 * The team as the user has corrected it, starting from the team that was
 * read. Edits are kept for as long as that read is current; a new read
 * (e.g. after changing a screenshot) starts again from what it read.
 */
export function useTeamDraft(read: Team | undefined): {
  /** The team with any edits, or `undefined` while there's no read team. */
  team: Team | undefined;
  /** Changes the team, starting from its current state. */
  update: (change: (team: Team) => Team) => void;
} {
  // The edited team, with the read it started from, so edits to an older
  // read are dropped when there's a new one.
  const [draft, setDraft] = useState<{ from: Team; team: Team }>();

  const current = (from: Team, saved?: { from: Team; team: Team }) =>
    saved?.from === from ? saved.team : from;

  return {
    team: read && current(read, draft),
    update: (change) => {
      if (!read) return;

      setDraft((saved) => ({ from: read, team: change(current(read, saved)) }));
    },
  };
}
