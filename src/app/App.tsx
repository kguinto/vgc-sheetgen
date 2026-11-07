import { useState } from 'react';
import { PageLayout } from './components/PageLayout/PageLayout';
import { StepIndicator } from './components/StepIndicator/StepIndicator';
import { StepNav } from './components/StepNav/StepNav';
import { useReadTeam } from './hooks/useReadTeam';
import { useTeamDraft } from './hooks/useTeamDraft';
import {
  NO_PLAYER_DETAILS,
  type PlayerDetails,
} from '../core/teamsheet/player';
import { ReviewPage } from './pages/ReviewPage/ReviewPage';
import {
  SCREENSHOTS_NEEDED,
  ScreenshotsPage,
} from './pages/ScreenshotsPage/ScreenshotsPage';
import { TeamListPage } from './pages/TeamListPage/TeamListPage';

/** The app's steps, in the order you go through them. */
const STEP_NAMES = ['Screenshots', 'Review', 'Teamsheet'];

/**
 * The whole app: three pages, one after the other. Add the two screenshots,
 * check the team read from them, then get the filled-in team list.
 */
export function App() {
  const [page, setPage] = useState(0);
  // Kept here rather than on their page, so they're still there after going
  // on to the next step and coming back.
  const [screenshots, setScreenshots] = useState<File[]>([]);

  // Reading starts on reaching Review. Going back doesn't stop it, and
  // returning with the same screenshots doesn't start it again.
  const { state: read, retry } = useReadTeam(page >= 1 ? screenshots : null);

  // What the player fills in for the top of the team list. Kept apart from
  // the team, so changing a screenshot doesn't clear it, and only in
  // memory: it's personal.
  const [player, setPlayer] = useState<PlayerDetails>(NO_PLAYER_DETAILS);

  // The team as read, with the user's corrections from the Review step.
  const { team, update: updateTeam } = useTeamDraft(
    read.status === 'done' ? read.result.team : undefined,
  );

  // Each step needs what the one before it produced: both screenshots, then
  // a team read from them.
  const canContinue =
    page === 0
      ? screenshots.length === SCREENSHOTS_NEEDED
      : page === 1
        ? !!team
        : true;

  return (
    <PageLayout
      top={
        <StepIndicator steps={STEP_NAMES} current={page} onSelect={setPage} />
      }
      bottom={
        <StepNav
          onBack={page > 0 ? () => setPage(page - 1) : undefined}
          onNext={
            page < STEP_NAMES.length - 1 ? () => setPage(page + 1) : undefined
          }
          canContinue={canContinue}
        />
      }
    >
      {page === 0 && (
        <ScreenshotsPage screenshots={screenshots} onChange={setScreenshots} />
      )}
      {page === 1 && (
        <ReviewPage
          screenshots={screenshots}
          read={read}
          team={team}
          onTeamChange={updateTeam}
          player={player}
          onPlayerChange={setPlayer}
          onRetry={retry}
          onChangeScreenshots={() => setPage(0)}
        />
      )}
      {page === 2 && <TeamListPage />}
    </PageLayout>
  );
}
