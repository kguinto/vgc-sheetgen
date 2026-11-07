// Everything about the specific screens this app can read: which ones there
// are, how each is recognized and read (one file per screen), and what a
// team needs (one screenshot of each Battle Team tab).

import type { ScreenshotProblem } from '../../screenshot-problems';
import type { RgbaImage } from '../image';
import type { Field, RecognizedScreen } from '../inspect';
import type { LayoutProfile } from '../layout';
import { movesScreen } from './moves';
import { statsScreen } from './stats';

/** Which screen a screenshot shows: a Battle Team tab. */
export type ScreenKind = 'moves' | 'stats';

/**
 * Everything specific to one kind of screen: how to recognize it, and where
 * the text on it is. Each supported screen has one of these in its own file,
 * listed in `SCREENS`.
 *
 * The image passed in is the screenshot scaled to the layout's size.
 */
export interface ScreenDefinition {
  kind: ScreenKind;
  /** The screen's name as the game shows it, e.g. "Moves & More". */
  title: string;
  /** Whether the screenshot shows this screen. */
  isShown(image: RgbaImage, layout: LayoutProfile): boolean;
  /** Every field to read on this screen, in order. */
  findFields(image: RgbaImage, layout: LayoutProfile): Field[];
}

/**
 * Every supported screen, by kind. A new kind of screen won't compile until
 * it's listed here.
 */
export const SCREENS: Record<ScreenKind, ScreenDefinition> = {
  moves: movesScreen,
  stats: statsScreen,
};

/**
 * The one screen this screenshot shows, or `undefined` if none of them
 * recognize it, or if more than one does (so it can't be trusted). The image
 * is the screenshot scaled to the layout's size.
 */
export function detectScreen(
  image: RgbaImage,
  layout: LayoutProfile,
): ScreenDefinition | undefined {
  const matches = Object.values(SCREENS).filter((definition) =>
    definition.isShown(image, layout),
  );

  return matches.length === 1 ? matches[0] : undefined;
}

/** A screen's name as the game shows it, for messages and output. */
export function screenTitle(kind: ScreenKind): string {
  return SCREENS[kind].title;
}

/** Shown when a screenshot isn't any of the supported screens. */
export const UNKNOWN_SCREEN_MESSAGE =
  "This isn't a Battle Team screenshot: neither the Moves & More nor the Stats tab is selected.";

/**
 * Which of a Battle Team screen's six cards (0–5) have a Pokémon. A card's
 * fields are only listed when it has one, and their keys start with
 * `slot.<card>.`.
 */
export function filledCards(screen: RecognizedScreen): number[] {
  const cards = screen.fields.flatMap(({ key }) => {
    const match = /^slot\.(\d+)\./.exec(key);

    return match ? [Number(match[1])] : [];
  });

  return [...new Set(cards)];
}

/** The Moves & More and Stats screens. Either is absent if it wasn't found. */
export type ScreenPair = {
  moves?: RecognizedScreen;
  stats?: RecognizedScreen;
};

export type ScreenPairResult = {
  pair: ScreenPair;
  /** `same-screen` or `missing-screen`. Empty when there's one of each. */
  problems: ScreenshotProblem[];
};

export type ScreenPairOptions = {
  /**
   * How many screenshots couldn't be used at all (e.g. not an image). Any of
   * them may have been the missing tab, and their own problems already say
   * what's wrong, so a missing tab isn't reported on top of them.
   */
  unusable?: number;
};

/**
 * Picks out the Moves & More screen and the Stats screen from screens given
 * in any order. Reports two screenshots of the same tab, or a tab with none.
 *
 * A missing tab is only reported when nothing else is wrong: with an
 * unusable screenshot (see `unusable`), or two of the other tab, the other
 * problem already explains it.
 */
export function getScreenPair(
  screens: RecognizedScreen[],
  options: ScreenPairOptions = {},
): ScreenPairResult {
  const pair: ScreenPair = {};
  const problems: ScreenshotProblem[] = [];
  const missing: ScreenshotProblem[] = [];

  for (const kind of ['moves', 'stats'] as const) {
    const matching = screens.filter((s) => s.kind === kind);
    const tab = screenTitle(kind);

    if (matching.length === 1) {
      pair[kind] = matching[0];
    } else if (matching.length === 0) {
      missing.push({
        code: 'missing-screen',
        message: `There's no screenshot of the ${tab} tab. Add one.`,
      });
    } else {
      problems.push({
        code: 'same-screen',
        message: `${count(matching.length)} screenshots show the ${tab} tab. Use one of Moves & More and one of Stats.`,
      });
    }
  }

  if (problems.length === 0 && !options.unusable) problems.push(...missing);

  return { pair, problems };
}

/** "Two", "Three", or the number itself, to start a sentence. */
function count(n: number): string {
  return ['Two', 'Three', 'Four'][n - 2] ?? String(n);
}
