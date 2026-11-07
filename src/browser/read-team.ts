// Reading a team from its screenshots in the browser, with the same
// `readTeam` as the command-line script. For now it runs on the page itself
// (the main thread), so the page may stutter while it reads; moving it to a
// background thread comes later.

import type { OcrEngine } from '../core/ocr/engine';
import { readTeam, type ReadTeamResult } from '../core/ocr/pipeline';
import { decodeImage } from './image';
import { createBrowserEngine } from './tesseract';

/**
 * The text recognizer, started once and kept for as long as the page is
 * open, so reading again doesn't download or start anything again. If
 * starting fails (e.g. no internet), the next read tries again.
 */
let starting: Promise<OcrEngine> | undefined;

function getEngine(): Promise<OcrEngine> {
  starting ??= createBrowserEngine().catch((err: unknown) => {
    starting = undefined;
    throw err;
  });

  return starting;
}

/**
 * Hands each line to the recognizer once it's ready. Checking the
 * screenshots doesn't need it, so a problem with them is reported without
 * waiting for the recognizer to download.
 */
const engine: OcrEngine = {
  recognizeLine: async (image, whitelist) =>
    (await getEngine()).recognizeLine(image, whitelist),
};

/**
 * The read in progress, if any. The recognizer reads one line at a time
 * (see `OcrEngine`), so a new read waits for the last one to finish rather
 * than overlapping it.
 */
let previous: Promise<unknown> = Promise.resolve();

/** The last screenshots read, and that read, so it isn't repeated. */
let last: { files: File[]; read: Promise<ReadTeamResult> } | undefined;

/**
 * Reads a team from its screenshots, on the device. `onProgress` is called
 * as fields are read. Problems with the screenshots are in the result; it
 * rejects only if something else went wrong, e.g. the text recognizer
 * couldn't be downloaded.
 *
 * Asking again for the same files gives the same read, whether it's still
 * going or done, e.g. after going back to the first step and returning
 * without changing anything. (`onProgress` is then the first caller's.)
 */
export function readTeamOnDevice(
  files: File[],
  onProgress?: (done: number, total: number) => void,
): Promise<ReadTeamResult> {
  if (
    last &&
    last.files.length === files.length &&
    last.files.every((file, i) => file === files[i])
  ) {
    return last.read;
  }

  const read = previous
    .catch(() => {})
    .then(async () => {
      const screenshots = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          bytes: new Uint8Array(await file.arrayBuffer()),
        })),
      );

      return readTeam(screenshots, { decodeImage, engine, onProgress });
    });

  previous = read;
  last = { files, read };
  // A failed read (e.g. no internet) can be tried again.
  read.catch(() => {
    if (last?.read === read) last = undefined;
  });

  return read;
}
