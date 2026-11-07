import type { Rect } from '../../../core/ocr/image';
import type { RecognizedScreen } from '../../../core/ocr/inspect';
import { offsetRect } from '../../../core/ocr/layout';
import { LAYOUTS } from '../../../core/ocr/layouts';
import { teamCards } from '../../../core/ocr/merge';
import type { ReadTeamResult } from '../../../core/ocr/pipeline';
import { formatScreenshotProblem } from '../../../core/ocr/screenshot-problems';
import {
  PokemonCard,
  type CardCrop,
} from '../../components/PokemonCard/PokemonCard';
import { ProgressBar } from '../../components/ProgressBar/ProgressBar';
import { ScreenshotList } from '../../components/ScreenshotList/ScreenshotList';
import type { ReadState } from '../../hooks/useReadTeam';
import type { Team as TeamType } from '../../../core/team/types';
import type { PlayerDetails as PlayerDetailsType } from '../../../core/teamsheet/player';
import { PlayerDetails } from '../../components/PlayerDetails/PlayerDetails';
import styles from './ReviewPage.module.css';

type Props = {
  /** The two screenshots, shown at the top to compare against. */
  screenshots: File[];
  read: ReadState;
  /** The team as read and then corrected by the user, once there's one. */
  team?: TeamType;
  /** Changes the team, starting from its current state. */
  onTeamChange: (change: (team: TeamType) => TeamType) => void;
  /** What the player fills in at the top of the team list. */
  player: PlayerDetailsType;
  onPlayerChange: (player: PlayerDetailsType) => void;
  /** Tries reading again, after it failed. */
  onRetry: () => void;
  /** Goes back to the first step, to change the screenshots. */
  onChangeScreenshots: () => void;
};

/**
 * Step 2: the team read from the screenshots, to check against them. Each
 * Pokémon's values are shown under its cards from both screenshots.
 */
export function ReviewPage({
  screenshots,
  read,
  team,
  onTeamChange,
  player,
  onPlayerChange,
  onRetry,
  onChangeScreenshots,
}: Props) {
  return (
    <section aria-labelledby="review-heading">
      <h2 id="review-heading">Check your team</h2>
      <p className="hint">
        Compare each value with the card above it before making the team list.
        Click any picture to see it larger.
      </p>

      <ScreenshotList screenshots={screenshots} />

      {read.status === 'idle' || read.status === 'reading' ? (
        <ProgressBar
          label={
            read.status === 'reading' && read.progress
              ? `Reading the text: ${read.progress.done} of ${read.progress.total}`
              : 'Getting the text reader ready…'
          }
          value={
            read.status === 'reading' && read.progress
              ? read.progress.done / read.progress.total
              : undefined
          }
        />
      ) : read.status === 'failed' ? (
        <div className={styles.message} role="alert">
          <p>{read.message}</p>
          <button type="button" onClick={onRetry}>
            Try again
          </button>
        </div>
      ) : team ? (
        <Team
          result={read.result}
          team={team}
          onChange={onTeamChange}
          player={player}
          onPlayerChange={onPlayerChange}
        />
      ) : (
        <div className={styles.message} role="alert">
          <p>These screenshots can't be used:</p>
          <ul>
            {read.result.problems.map((problem) => (
              <li key={formatScreenshotProblem(problem)}>
                {formatScreenshotProblem(problem)}
              </li>
            ))}
          </ul>
          <button type="button" onClick={onChangeScreenshots}>
            Change screenshots
          </button>
        </div>
      )}
    </section>
  );
}

/**
 * The player's details for the top of the form, then each Pokémon with its
 * cards from both screenshots, all editable.
 */
function Team({
  result,
  team,
  onChange,
  player,
  onPlayerChange,
}: {
  result: ReadTeamResult;
  team: TeamType;
  onChange: Props['onTeamChange'];
  player: PlayerDetailsType;
  onPlayerChange: Props['onPlayerChange'];
}) {
  const { screens, reads } = result;

  // The team's first Pokémon is on the first of these cards, and so on.
  const cards = teamCards(reads.moves ?? [], reads.stats ?? []);

  const crop = (
    screen: RecognizedScreen | undefined,
    card: number | undefined,
  ): CardCrop | undefined =>
    screen && card !== undefined
      ? { image: screen.image, rect: cardRect(screen, card) }
      : undefined;

  return (
    <>
      <PlayerDetails
        details={player}
        onChange={onPlayerChange}
        trainerName={team.trainerName}
        onTrainerNameChange={(trainerName) =>
          onChange((t) => ({ ...t, trainerName }))
        }
      />

      <ol className={styles.cards}>
        {team.pokemon.map((pokemon, i) => (
          <li key={cards[i] ?? i}>
            <PokemonCard
              position={i + 1}
              pokemon={pokemon}
              onChange={(changed) =>
                onChange((t) => ({
                  ...t,
                  pokemon: t.pokemon.map((p, j) => (j === i ? changed : p)),
                }))
              }
              movesCrop={crop(screens.moves, cards[i])}
              statsCrop={crop(screens.stats, cards[i])}
            />
          </li>
        ))}
      </ol>
    </>
  );
}

/** Where a card is on a screen, as measured for its layout. */
function cardRect(screen: RecognizedScreen, card: number): Rect {
  const layout = LAYOUTS.find((l) => l.name === screen.layout)!;

  return offsetRect(layout.cardBox, layout.cards[card]!);
}
