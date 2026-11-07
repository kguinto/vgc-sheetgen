/**
 * Reads a Battle Team from its two screenshots.
 *
 *   pnpm sheetgen [--debug] [--debug-dir <dir>] [--log <file>]
 *                 <screenshot> <screenshot>
 *
 * One screenshot of the Moves & More tab and one of the Stats tab, in
 * either order. For now this prints which file shows which tab, and every
 * field read on it.
 *
 * --debug       Also print everything that was worked out about the
 *               screenshots, as JSON, to stderr. Pixel data is summarized
 *               rather than printed.
 * --debug-dir <dir>  Save two images of each field into <dir>, one folder
 *               per screen: the field as it appears in the screenshot
 *               (`<key>.png`), and the cleaned-up crop the text recognizer
 *               was given (`<key>.preprocessed.png`).
 * --log <file>  Also write everything printed to the console to a file,
 *               e.g. `--log run.log`. With --debug, that includes the JSON.
 */
import path from 'node:path';
import { readTeam } from '../src/core/ocr/pipeline';
import { filledCards, screenTitle } from '../src/core/ocr/screens';
import { formatScreenshotProblem } from '../src/core/screenshot-problems';
import { parseArguments, readFiles } from '../src/node/cli';
import { saveFieldCrops } from '../src/node/debug';
import { decodeImage } from '../src/node/image';
import { createNodeEngine } from '../src/node/tesseract';
import { createLogger } from '../src/node/logger';

const USAGE =
  'Usage: pnpm sheetgen [--debug] [--debug-dir <dir>] [--log <file>] <screenshot> <screenshot>';

// Step 1: Expect exactly two screenshots, one of the Moves & More tab and
// one of the Stats tab, in either order, and optionally the debugging and
// logging flags.
const {
  debug,
  debugDir,
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

// Step 3: Start the text recognizer (Tesseract), work out what's in the
// screenshots, and read their text. The recognizer keeps running in the
// background, so it's shut down as soon as reading is done, or Node won't
// exit.
// TODO: Put the team together too.
const engine = await createNodeEngine();
let result;

try {
  result = await readTeam(files, { decodeImage, engine, onProgress });
} finally {
  await engine.terminate();
  clearProgress();
}

const { screens, reads, problems } = result;

// With --debug, print everything that was worked out. This happens before
// anything can stop the script, so it's there for failed runs too.
logger.debug(result);

// With --debug-dir, save each field's crop from the screenshot, and the
// cleaned-up version the text recognizer was given, one folder per screen.
if (debugDir) {
  for (const kind of ['moves', 'stats'] as const) {
    const screen = screens[kind];

    if (!screen) continue;

    const { error } = saveFieldCrops(path.join(debugDir, kind), screen);

    if (error) {
      logger.error(error);
      process.exit(1);
    }
  }

  logger.error(`Saved each field's crops to ${debugDir}`);
}

// Step 4: If any screenshot can't be used, explain why for each one, then
// stop.
if (problems.length > 0) {
  logger.error(problems.map(formatScreenshotProblem).join('\n'));
  process.exit(1);
}

// Step 5: Show what was found. For now that's which file shows which tab,
// and every field read on it, by name; a blank field shows as "–".
// TODO: Print the team instead, marking any values that might have been
// misread.
for (const kind of ['moves', 'stats'] as const) {
  const screen = screens[kind];

  if (!screen) continue;

  const pokemon = filledCards(screen).length;

  logger.info(
    `${screenTitle(kind)}: ${screen.name} (layout ${screen.layout}, ${pokemon} Pokémon)`,
  );

  for (const { key, value } of reads[kind] ?? []) {
    logger.info(`  ${key.padEnd(18)} ${value ?? '–'}`);
  }
}

// TODO: Ask before saving the team list, unless --yes was given.

// TODO: Fill in the official team list PDF and save it, to the -o path if
// given.

/**
 * Shows how many fields have been read so far, on one line that updates in
 * place. Only when stderr is a terminal, so it doesn't clutter logs.
 */
function onProgress(done: number, total: number) {
  if (process.stderr.isTTY) {
    process.stderr.write(`\rReading the text: ${done}/${total}`);
  }
}

/** Clears the progress line, so what's printed next starts cleanly. */
function clearProgress() {
  if (process.stderr.isTTY) process.stderr.write('\r\x1b[K');
}
