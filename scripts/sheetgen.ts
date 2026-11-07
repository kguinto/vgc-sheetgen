/**
 * Reads a Battle Team from its two screenshots.
 *
 *   pnpm sheetgen <screenshot> <screenshot>
 *
 * One screenshot of the Moves & More tab and one of the Stats tab, in
 * either order. For now this prints each one's size and the layout it
 * would be read with.
 */
import fs from 'node:fs';
import { readTeam } from '../src/core/ocr/pipeline';
import { formatScreenshotProblem } from '../src/core/screenshot-problems';
import { decodeImage } from '../src/node/image';

const USAGE = 'Usage: pnpm sheetgen <screenshot> <screenshot>';

// Step 1: Expect exactly two screenshots, one of the Moves & More tab and
// one of the Stats tab, in either order.
const paths = process.argv.slice(2);

if (paths.length !== 2) {
  console.error(USAGE);
  process.exit(1);
}

// Step 2: Read both files. If either is missing or can't be opened, say so
// and stop.
const files = paths.map((path) => ({
  name: path,
  bytes: readFile(path),
}));

// TODO: Start the text recognizer (Tesseract) here. It keeps running in the
// background, so it has to be shut down at the end or the script won't exit.

// Step 3: Work out what's in the screenshots. So far this only checks that
// each one is an image from a Switch or Switch 2 (by its size). Later it will
// also read the text on each screen and put the team together.
const { screenshots, problems } = await readTeam(files, { decodeImage });

// Step 4: If any screenshot can't be used, explain why for each one, then
// stop.
if (problems.length > 0) {
  console.error(problems.map(formatScreenshotProblem).join('\n'));
  process.exit(1);
}

// Step 5: Show what was found. For now that's each screenshot's size and
// which console's screen layout it matched, just to show progress.
// TODO: Print the team instead, marking any values that might have been
// misread.
for (const { name, width, height, layout } of screenshots) {
  console.log(`${name}: ${width}×${height}, layout ${layout}`);
}

// TODO: With --debug <dir>, save a copy of each screenshot with every field
// outlined, to check that the positions line up.

// TODO: Ask before saving the team list, unless --yes was given.

// TODO: Fill in the official team list PDF and save it, to the -o path if
// given.

/**
 * Reads a file, or exits with Node's error as one line, e.g.
 * "nope.png: no such file".
 */
function readFile(path: string): Uint8Array {
  try {
    return fs.readFileSync(path);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;

    console.error(
      `${path}: ${code === 'ENOENT' ? 'no such file' : `can't read (${code ?? err})`}`,
    );
    process.exit(1);
  }
}
