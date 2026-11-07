// The text recognizer (Tesseract) in the browser. The script's version is
// `src/node/tesseract.ts`; what they share is in
// `src/core/ocr/tesseract-engine.ts`.

import { createWorker, OEM } from 'tesseract.js';
import type { OcrEngine } from '../core/ocr/engine';
import type { GrayImage } from '../core/ocr/image';
import { tesseractEngine } from '../core/ocr/tesseract-engine';

/**
 * Starts Tesseract (its LSTM recognizer, with the "best_int" English model,
 * the same as the script's) in its own background thread.
 *
 * Its code and model are downloaded from jsDelivr, tesseract.js's default
 * CDN, about 7 MB the first time; the browser keeps them after that. Only
 * Tesseract's own files come from there: the screenshots never leave the
 * device. Starting it takes a few seconds, so start one early and use it
 * for every field.
 */
export async function createBrowserEngine(): Promise<OcrEngine> {
  const worker = await createWorker('eng', OEM.LSTM_ONLY);

  return tesseractEngine(worker, toCanvas);
}

/**
 * tesseract.js takes a canvas and makes an image file of it, so each
 * cleaned-up crop is drawn on one, gray value by gray value.
 */
function toCanvas(image: GrayImage): OffscreenCanvas {
  const canvas = new OffscreenCanvas(image.width, image.height);
  const context = canvas.getContext('2d');

  if (!context) throw new Error("The browser couldn't draw a field's crop.");

  const pixels = context.createImageData(image.width, image.height);

  image.data.forEach((value, i) =>
    pixels.data.set([value, value, value, 255], i * 4),
  );
  context.putImageData(pixels, 0, 0);

  return canvas;
}
