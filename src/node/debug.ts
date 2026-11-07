import fs from 'node:fs';
import path from 'node:path';
import { cropRgba } from '../core/ocr/image';
import type { RecognizedScreen } from '../core/ocr/inspect';
import { preprocess } from '../core/ocr/preprocess';
import { encodeGrayPng, encodePng } from './image';

/**
 * Saves two images of each field on a screen into `dir`, to see why a field
 * was misread: `<key>.png`, the field as it appears in the screenshot, and
 * `<key>.preprocessed.png`, the cleaned-up crop the text recognizer was
 * given. `dir` is created if needed. Arrow fields, which are read by color
 * rather than text, only get the first.
 *
 * Returns Node's error as one line if the files can't be written.
 */
export function saveFieldCrops(
  dir: string,
  screen: RecognizedScreen,
): { error?: string } {
  try {
    fs.mkdirSync(dir, { recursive: true });

    for (const { key, kind, rect } of screen.fields) {
      fs.writeFileSync(
        path.join(dir, `${key}.png`),
        encodePng(cropRgba(screen.image, rect)),
      );

      if (kind === 'arrow') continue;

      fs.writeFileSync(
        path.join(dir, `${key}.preprocessed.png`),
        encodeGrayPng(preprocess(screen.image, rect)),
      );
    }

    return {};
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;

    return { error: `${dir}: can't save field crops (${code ?? err})` };
  }
}
