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
  for (const { name, bytes } of screenshots) {
    const decoded = await options.decodeImage(bytes);
    if (decoded.problem) {
      problems.push({ ...decoded.problem, input: name });
      continue;
    }
    const { width, height } = decoded.image;
    const selected = selectLayout(decoded.image, LAYOUTS);
    if (selected.problem) {
      problems.push({ ...selected.problem, input: name });
      continue;
    }
    summaries.push({ name, width, height, layout: selected.layout.name });
  }
  return { screenshots: summaries, problems };
}
