// Turning a screenshot file into pixels in the browser, with the decoding
// built into the browser. The script does the same in Node with the
// jpeg-js and pngjs libraries (see `src/node/image.ts`).

import {
  damagedImage,
  imageFormat,
  notAnImage,
  type ImageResult,
} from '../core/ocr/image';

/**
 * Decodes a PNG or JPEG file, identified by its contents, to RGBA. Works on
 * the page and in a background thread (Web Worker).
 */
export async function decodeImage(bytes: Uint8Array): Promise<ImageResult> {
  const format = imageFormat(bytes);

  if (!format) return { problem: notAnImage() };

  try {
    // Keep the pixels as stored in the file: no color profile conversion,
    // and no pre-multiplying by transparency. That keeps them as close as
    // possible to what the script's decoders give, which the screen checks
    // and the text clean-up were tuned on.
    const bitmap = await createImageBitmap(
      new Blob([new Uint8Array(bytes)], { type: `image/${format}` }),
      { colorSpaceConversion: 'none', premultiplyAlpha: 'none' },
    );
    const { width, height } = bitmap;
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (!context) throw new Error("the browser couldn't draw it");

    context.drawImage(bitmap, 0, 0);
    bitmap.close();

    const { data } = context.getImageData(0, 0, width, height);

    return { image: { width, height, data } };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);

    return { problem: damagedImage(reason) };
  }
}
