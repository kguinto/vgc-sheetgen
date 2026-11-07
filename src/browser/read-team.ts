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

/** How far a read has got: fields read so far, out of how many. */
export type ReadProgress = { done: number; total: number };

/** A read, with everyone following its progress. */
type Read = {
  files: File[];
  result: Promise<ReadTeamResult>;
  /** The latest progress, for anyone who starts following it midway. */
  progress?: ReadProgress;
  listeners: Set<(progress: ReadProgress) => void>;
};

/** The last screenshots read, and that read, so it isn't repeated. */
let last: Read | undefined;

export type ReadOptions = {
  /** Called as fields are read, starting with how far it's got already. */
  onProgress?: (progress: ReadProgress) => void;
  /** Stops `onProgress` being called, e.g. when the page is left. */
  signal?: AbortSignal;
};

/**
 * Reads a team from its screenshots, on the device. Problems with the
 * screenshots are in the result; it rejects only if something else went
 * wrong, e.g. the text recognizer couldn't be downloaded.
 *
 * Asking again for the same files gives the same read, whether it's still
 * going or done, e.g. after going back to the first step and returning
 * without changing anything. Its progress is shared too.
 */
export function readTeamOnDevice(
  files: File[],
  { onProgress, signal }: ReadOptions = {},
): Promise<ReadTeamResult> {
  const read = sameFiles(last?.files, files) ? last! : startRead(files);

  if (onProgress && !signal?.aborted) {
    if (read.progress) onProgress(read.progress);

    read.listeners.add(onProgress);
    signal?.addEventListener('abort', () => read.listeners.delete(onProgress));
  }

  return read.result;
}

function startRead(files: File[]): Read {
  const listeners = new Set<(progress: ReadProgress) => void>();

  const read: Read = {
    files,
    listeners,
    result: previous
      .catch(() => {})
      .then(async () => {
        const screenshots = await Promise.all(
          files.map(async (file) => ({
            name: file.name,
            bytes: new Uint8Array(await file.arrayBuffer()),
          })),
        );

        return readTeam(screenshots, {
          decodeImage,
          engine,
          onProgress: (done, total) => {
            read.progress = { done, total };
            listeners.forEach((listener) => listener({ done, total }));
          },
        });
      }),
  };

  previous = read.result;
  last = read;
  // A failed read (e.g. no internet) can be tried again.
  read.result.catch(() => {
    if (last === read) last = undefined;
  });

  return read;
}

function sameFiles(a: File[] | undefined, b: File[]): boolean {
  return a?.length === b.length && a.every((file, i) => file === b[i]);
}
