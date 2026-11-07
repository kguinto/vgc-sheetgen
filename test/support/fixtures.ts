import fs from 'node:fs';
import path from 'node:path';
import type { RgbaImage } from '../../src/core/ocr/image';
import type { RecognizedScreen } from '../../src/core/ocr/inspect';
import { decodeImage } from '../../src/node/image';

const FIXTURES = path.join(import.meta.dirname, '../fixtures');

/** A fixture screenshot as `readTeam` takes it: its name and file contents. */
export function fixtureFile(name: string) {
  return { name, bytes: fs.readFileSync(path.join(FIXTURES, name)) };
}

/** A fixture screenshot as pixels, e.g. `console-720/team-2-moves.jpg`. */
export async function loadFixture(name: string): Promise<RgbaImage> {
  const { image, problem } = await decodeImage(fixtureFile(name).bytes);

  if (problem) throw new Error(`Fixture ${name}: ${problem.message}`);

  return image;
}

/** A blank image, all one color. */
export function solidImage(
  width: number,
  height: number,
  rgb: [number, number, number] = [0, 0, 0],
): RgbaImage {
  const data = new Uint8Array(width * height * 4);

  for (let i = 0; i < data.length; i += 4) data.set([...rgb, 255], i);

  return { width, height, data };
}

/**
 * A stand-in for a recognized screen, for tests that only care about its
 * kind and name: a 1×1 image with no fields.
 */
export function fakeScreen(
  kind: RecognizedScreen['kind'],
  name: string,
): RecognizedScreen {
  return {
    kind,
    name,
    layout: 'test',
    scale: 1,
    image: solidImage(1, 1),
    fields: [],
  };
}
