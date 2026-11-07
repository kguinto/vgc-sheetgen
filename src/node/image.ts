import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';
import type { GrayImage, ImageResult, RgbaImage } from '../core/ocr/image';
import type { ScreenshotProblem } from '../core/screenshot-problems';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];

const startsWith = (bytes: Uint8Array, signature: number[]) =>
  signature.every((b, i) => bytes[i] === b);

const unreadable = (message: string): ScreenshotProblem => ({
  code: 'unreadable-image',
  message,
});

/** Decodes a PNG or JPEG file, identified by its contents, to RGBA. */
export async function decodeImage(bytes: Uint8Array): Promise<ImageResult> {
  const isPng = startsWith(bytes, PNG_SIGNATURE);

  if (!isPng && !startsWith(bytes, JPEG_SIGNATURE)) {
    return { problem: unreadable('Not a PNG or JPEG image.') };
  }

  // The decoders throw on corrupt or truncated data.
  try {
    if (isPng) {
      const png = PNG.sync.read(Buffer.from(bytes));

      return {
        image: { width: png.width, height: png.height, data: png.data },
      };
    }

    const img = jpeg.decode(bytes, { useTArray: true, formatAsRGBA: true });

    return { image: { width: img.width, height: img.height, data: img.data } };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);

    return { problem: unreadable(`The image is damaged (${reason}).`) };
  }
}

/** Encodes an image as a PNG file. */
export function encodePng(image: RgbaImage): Buffer {
  const png = new PNG({ width: image.width, height: image.height });

  png.data.set(image.data);

  return PNG.sync.write(png);
}

/** Encodes a grayscale image (e.g. a cleaned-up crop) as a PNG file. */
export function encodeGrayPng(image: GrayImage): Buffer {
  const png = new PNG({ width: image.width, height: image.height });

  image.data.forEach((value, i) =>
    png.data.set([value, value, value, 255], i * 4),
  );

  return PNG.sync.write(png);
}
