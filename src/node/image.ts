import fs from 'node:fs';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';
import type { RgbaImage } from '../core/ocr/image';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];

const startsWith = (bytes: Uint8Array, signature: number[]) =>
  signature.every((b, i) => bytes[i] === b);

/** Decodes a PNG or JPEG file, identified by its contents, to RGBA. */
export function decodeImage(bytes: Uint8Array): RgbaImage {
  if (startsWith(bytes, PNG_SIGNATURE)) {
    const png = PNG.sync.read(Buffer.from(bytes));

    return { width: png.width, height: png.height, data: png.data };
  }

  if (startsWith(bytes, JPEG_SIGNATURE)) {
    const img = jpeg.decode(bytes, { useTArray: true, formatAsRGBA: true });

    return { width: img.width, height: img.height, data: img.data };
  }

  throw new Error('Unsupported image format: expected PNG or JPEG');
}

/**
 * A screenshot file that can't be used: missing, unreadable, or not a PNG
 * or JPEG. Its message is meant to be shown to the user as is.
 */
export class ImageFileError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ImageFileError';
  }
}

/** Reads and decodes a screenshot file. */
export function loadImage(file: string): RgbaImage {
  if (!fs.existsSync(file)) throw new ImageFileError(`No such file: ${file}`);
  try {
    return decodeImage(fs.readFileSync(file));
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new ImageFileError(`Can't read ${file}: ${reason}`, { cause: err });
  }
}
