import { createRequire } from 'node:module';
import path from 'node:path';
import { createWorker, OEM } from 'tesseract.js';
import type { OcrEngine } from '../core/ocr/engine';
import { tesseractEngine } from '../core/ocr/tesseract-engine';
import { encodeGrayPng } from './image';

const require = createRequire(import.meta.url);

/** A text recognizer for Node, which must be shut down when done. */
export type NodeEngine = OcrEngine & {
  /** Stops the recognizer. Until this is called, Node won't exit. */
  terminate(): Promise<void>;
};

/**
 * Starts Tesseract (its LSTM recognizer, with the "best_int" English model)
 * in a Node worker thread. The language data comes from the
 * `@tesseract.js-data/eng` package, so nothing is downloaded. Starting it
 * takes about a second, so create one and use it for every field.
 */
export async function createNodeEngine(): Promise<NodeEngine> {
  const langPath = path.join(
    path.dirname(require.resolve('@tesseract.js-data/eng/package.json')),
    '4.0.0_best_int',
  );
  const worker = await createWorker('eng', OEM.LSTM_ONLY, {
    langPath,
    gzip: true,
    cacheMethod: 'none',
  });

  // Tesseract takes image files, so each crop is encoded as a PNG.
  const engine = await tesseractEngine(worker, encodeGrayPng);

  return {
    ...engine,
    terminate: async () => {
      await worker.terminate();
    },
  };
}
