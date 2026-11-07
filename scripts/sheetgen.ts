/**
 * Reads a Battle Team from its two screenshots.
 *
 *   pnpm sheetgen [--debug] [--log <file>] <screenshot> <screenshot>
 *
 * One screenshot of the Moves & More tab and one of the Stats tab, in
 * either order. For now this prints which file shows which tab, and how
 * many Pokémon each has.
 *
 * --debug       Also print everything that was worked out about the
 *               screenshots, as JSON, to stderr. Pixel data is summarized
 *               rather than printed.
 * --log <file>  Also write everything printed to the console to a file,
 *               e.g. `--log run.log`. With --debug, that includes the JSON.
 */
import { readTeam } from '../src/core/ocr/pipeline';
import { filledCards, screenTitle } from '../src/core/ocr/screens';
import { formatScreenshotProblem } from '../src/core/screenshot-problems';
import { parseArguments, readFiles } from '../src/node/cli';
import { decodeImage } from '../src/node/image';
import { createLogger } from '../src/node/logger';

const USAGE =
  'Usage: pnpm sheetgen [--debug] [--log <file>] <screenshot> <screenshot>';

// Step 1: Expect exactly two screenshots, one of the Moves & More tab and
// one of the Stats tab, in either order, and optionally --debug and --log.
const {
  debug,
  logPath,
  paths,
  error: argumentsError,
} = parseArguments(process.argv.slice(2));

if (argumentsError) {
  console.error(`${argumentsError}\n${USAGE}`);
  process.exit(1);
}

// Everything printed from here on goes through the logger, which also
// writes it to the --log file if one was given.
const { logger, error: logError } = createLogger({ logPath, debug });

if (logError) {
  logger.error(logError);
  process.exit(1);
}

if (paths.length !== 2) {
  logger.error(USAGE);
  process.exit(1);
}

// Step 2: Read both files. If either is missing or can't be opened, say so
// and stop.
const { files, errors: fileErrors } = readFiles(paths);

if (fileErrors.length > 0) {
  logger.error(fileErrors.join('\n'));
  process.exit(1);
}

// TODO: Start the text recognizer (Tesseract) here. It keeps running in the
// background, so it has to be shut down at the end or the script won't exit.

// Step 3: Work out what's in the screenshots. So far this recognizes which
// tab each one shows and finds each Pokémon's card. Later it will also read
// the text on each screen and put the team together.
const result = await readTeam(files, { decodeImage });
const { screens, problems } = result;

// With --debug, print everything that was worked out. This happens before
// anything can stop the script, so it's there for failed runs too.
logger.debug(result);

// Step 4: If any screenshot can't be used, explain why for each one, then
// stop.
if (problems.length > 0) {
  logger.error(problems.map(formatScreenshotProblem).join('\n'));
  process.exit(1);
}

// Step 5: Show what was found. For now that's which file shows which tab,
// the console's screen layout, and how many Pokémon it has, just to show
// progress.
// TODO: Print the team instead, marking any values that might have been
// misread.
for (const screen of [screens.moves, screens.stats]) {
  if (!screen) continue;

  const pokemon = filledCards(screen).length;

  logger.info(
    `${screenTitle(screen.kind)}: ${screen.name} (layout ${screen.layout}, ${pokemon} Pokémon)`,
  );
}

// TODO: With --debug, also save a copy of each screenshot with every field
// outlined, to check that the positions line up.

// TODO: Ask before saving the team list, unless --yes was given.

// TODO: Fill in the official team list PDF and save it, to the -o path if
// given.
