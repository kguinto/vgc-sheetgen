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
