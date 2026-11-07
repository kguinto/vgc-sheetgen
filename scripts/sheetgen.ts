/**
 * Reads a Battle Team from its two screenshots.
 *
 *   pnpm sheetgen <screenshot> <screenshot>
 *
 * One screenshot of the Moves & More tab and one of the Stats tab, in
 * either order. For now this only decodes them and prints their sizes.
 */
import { ImageFileError, loadImage } from '../src/node/image';

const USAGE = 'Usage: pnpm sheetgen <screenshot> <screenshot>';

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const files = process.argv.slice(2);

if (files.length !== 2) fail(USAGE);

try {
  // Load both before printing anything, so a bad file fails the whole run.
  const images = files.map((file) => ({ file, image: loadImage(file) }));
  for (const { file, image } of images) {
    console.log(`${file}: ${image.width}×${image.height}`);
  }
} catch (err) {
  if (err instanceof ImageFileError) fail(err.message);
  throw err;
}
