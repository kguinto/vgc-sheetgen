import type { ScreenshotProblem } from '../screenshot-problems';
import type { ImageResult } from './image';
import {
  inspectScreenshot,
  getScreenPair,
  type BattleTeamScreen,
  type ScreenPair,
} from './inspect';

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
  // Each screenshot is handled on its own, at the same time as the others,
  // so a problem with one doesn't stop the others from being checked.
  // Problems are tagged with the screenshot's name, so the user knows which
  // file to fix. Results stay in the order the screenshots were given.
  const checked = await Promise.all(
    screenshots.map(async ({ name, bytes }) => {
      // Step 1: Turn the file into pixels. This fails if it isn't a PNG or
      // JPEG, or is damaged.
      const { image, problem: decodeProblem } =
        await options.decodeImage(bytes);

      if (decodeProblem) return { problem: { ...decodeProblem, input: name } };

      // Step 2: Work out which console and which tab it shows, and where
      // each Pokémon's card and every piece of text is. This fails if it
      // isn't a Battle Team screenshot from a supported console.
      const { screen, problem: inspectProblem } = inspectScreenshot(
        image,
        name,
      );

      if (inspectProblem) {
        return { problem: { ...inspectProblem, input: name } };
      }

      return { screen };
    }),
  );

  // Split the results into the screens that were recognized and the
  // problems with the rest.
  const recognized: BattleTeamScreen[] = [];
  const problems: ScreenshotProblem[] = [];

  for (const { screen, problem } of checked) {
    if (screen) recognized.push(screen);

    if (problem) problems.push(problem);
  }

  // Step 3: Pair up the Moves & More and the Stats screenshot.
  const { pair, problems: pairProblems } = getScreenPair(recognized, {
    unusable: problems.length,
  });

  // TODO: Read the text on each screen and put the team together.

  return { screens: pair, problems: [...problems, ...pairProblems] };
}
