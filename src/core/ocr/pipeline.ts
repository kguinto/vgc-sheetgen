import type { ScreenshotProblem } from '../screenshot-problems';
import type { ImageResult } from './image';
import {
  inspectScreenshot,
  type InspectResult,
  type RecognizedScreen,
} from './inspect';
import { getScreenPair, type ScreenPair } from './screens';

/** A screenshot file as the user gave it: a name to show, and its contents. */
export type ScreenshotInput = { name: string; bytes: Uint8Array };

export type ReadTeamOptions = {
  /**
   * Turns a PNG or JPEG file into pixels. It's passed in because Node and
   * the browser do this differently: Node uses the jpeg-js and pngjs
   * libraries, and the browser has image decoding built in.
   */
  decodeImage(bytes: Uint8Array): Promise<ImageResult>;
};

export type ReadTeamResult = {
  /**
   * The screenshot of each tab, as far as they could be recognized. Either
   * may be missing when there are problems.
   */
  screens: ScreenPair;
  /** Why some screenshots can't be used, each naming its screenshot. */
  problems: ScreenshotProblem[];
};

/**
 * Reads a Battle Team from screenshots of its Moves & More and Stats tabs.
 * This is the one function both the command-line script and the web app
 * call, so they behave the same.
 *
 * So far it recognizes which tab each screenshot shows and where the text
 * on it is. Reading the text and putting the team together will be added
 * here.
 *
 * A screenshot that can't be used doesn't stop the others: its problem is
 * returned alongside whatever could be read, and the caller decides what to
 * do. Only a bug throws.
 */
export async function readTeam(
  screenshots: ScreenshotInput[],
  options: ReadTeamOptions,
): Promise<ReadTeamResult> {
  // Step 1: Check each screenshot, all at the same time. A problem with one
  // doesn't stop the others, and results keep the order they were given in.
  const results = await Promise.all(
    screenshots.map((screenshot) =>
      checkScreenshot(screenshot, options.decodeImage),
    ),
  );

  const { screens, problems } = splitResults(results);

  // Step 2: Pair up the Moves & More and the Stats screenshot.
  const { pair, problems: pairProblems } = getScreenPair(screens, {
    unusable: problems.length,
  });

  // TODO: Read the text on each screen and put the team together.

  return { screens: pair, problems: [...problems, ...pairProblems] };
}

/**
 * Turns one screenshot file into a recognized screen, or the reason it
 * can't be used, tagged with the screenshot's name so the user knows which
 * file to fix.
 */
async function checkScreenshot(
  { name, bytes }: ScreenshotInput,
  decodeImage: ReadTeamOptions['decodeImage'],
): Promise<InspectResult> {
  // Turn the file into pixels. This fails if it isn't a PNG or JPEG, or is
  // damaged.
  const { image, problem } = await decodeImage(bytes);

  if (problem) return { problem: { ...problem, input: name } };

  // Work out which console and screen it shows, and where the text is. This
  // fails if it isn't a supported screen from a supported console.
  const inspected = inspectScreenshot(image, name);

  return inspected.problem
    ? { problem: { ...inspected.problem, input: name } }
    : inspected;
}

/**
 * Splits per-screenshot results into the screens that were recognized and
 * the problems with the rest, keeping the order they were given in.
 */
function splitResults(results: InspectResult[]): {
  screens: RecognizedScreen[];
  problems: ScreenshotProblem[];
} {
  const screens: RecognizedScreen[] = [];
  const problems: ScreenshotProblem[] = [];

  for (const { screen, problem } of results) {
    if (screen) screens.push(screen);

    if (problem) problems.push(problem);
  }

  return { screens, problems };
}
