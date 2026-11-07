import type { ScreenshotProblem } from '../screenshot-problems';
import type { ImageResult } from './image';
import { selectLayout } from './layout';
import { LAYOUTS } from './layouts';

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

/** What's been worked out so far about a screenshot that can be used. */
export type ScreenshotSummary = {
  name: string;
  width: number;
  height: number;
  /** Which console's screen layout it matched, e.g. `console-720`. */
  layout: string;
};

export type ReadTeamResult = {
  /** The screenshots that can be used, in the order they were given. */
  screenshots: ScreenshotSummary[];
  /** Why the others can't, each naming its screenshot. */
  problems: ScreenshotProblem[];
};

/**
 * Reads a Battle Team from screenshots of its Moves & More and Stats tabs.
 * This is the one function both the command-line script and the web app
 * call, so they behave the same.
 *
 * So far it only turns each file into pixels and works out which console's
 * screen layout it matches. Recognizing the tabs, reading the text, and
 * putting the team together will be added here.
 *
 * A screenshot that can't be used doesn't stop the others: its problem is
 * returned alongside whatever could be read, and the caller decides what to
 * do. Only a bug throws.
 */
export async function readTeam(
  screenshots: ScreenshotInput[],
  options: ReadTeamOptions,
): Promise<ReadTeamResult> {
  const summaries: ScreenshotSummary[] = [];
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

    // Step 2: Work out which console it's from by its size, which tells us
    // where everything is on the screen. This fails if it isn't 16:9.
    const { layout, problem: layoutProblem } = selectLayout(image, LAYOUTS);

    if (layoutProblem) {
      problems.push({ ...layoutProblem, input: name });
      continue;
    }

    // Step 3: Note what was found, for the caller to show.
    // TODO: Recognize which tab the screenshot shows (Moves & More or
    // Stats), and find each Pokémon's card on it.
    const { width, height } = image;

    summaries.push({ name, width, height, layout: layout.name });
  }

  // TODO: Check there's exactly one screenshot of each tab, read the text
  // on each, and put the team together.

  return { screenshots: summaries, problems };
}
