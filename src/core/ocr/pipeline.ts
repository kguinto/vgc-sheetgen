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
  decodeImage(bytes: Uint8Array): ImageResult | Promise<ImageResult>;
};

/** A recognized screenshot, with the name it was given (e.g. its file name). */
export type NamedScreen = BattleTeamScreen & { name: string };

export type ReadTeamResult = {
  /**
   * The screenshot of each tab, as far as they could be recognized. Either
   * may be missing when there are problems.
   */
  screens: Omit<ScreenPair<NamedScreen>, 'problems'>;
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
  const recognized: NamedScreen[] = [];
  const problems: ScreenshotProblem[] = [];

  // Each screenshot is handled on its own, so a problem with one doesn't
  // stop the others from being checked. Problems are tagged with the
  // screenshot's name, so the user knows which file to fix.
  for (const { name, bytes } of screenshots) {
    // Step 1: Turn the file into pixels. This fails if it isn't a PNG or
    // JPEG, or is damaged.
    const { image, problem: decodeProblem } = await options.decodeImage(bytes);

    if (decodeProblem) {
      problems.push({ ...decodeProblem, input: name });
      continue;
    }

    // Step 2: Work out which console and which tab it shows, and where each
    // Pokémon's card and every piece of text is. This fails if it isn't a
    // Battle Team screenshot from a supported console.
    const { screen, problem: inspectProblem } = inspectScreenshot(image);

    if (inspectProblem) {
      problems.push({ ...inspectProblem, input: name });
      continue;
    }

    recognized.push({ ...screen, name });
  }

  // Step 3: Pick out the Moves & More and the Stats screenshot. A missing
  // tab is only reported when there's no other problem: otherwise that
  // problem (an unusable file, or two of the same tab) already explains it.
  const { problems: pairProblems, ...screens } = getScreenPair(recognized);
  const otherProblems = [
    ...problems,
    ...pairProblems.filter((p) => p.code !== 'missing-screen'),
  ];

  const allProblems = otherProblems.length > 0 ? otherProblems : pairProblems;

  // TODO: Read the text on each screen and put the team together.

  return { screens, problems: allProblems };
}
