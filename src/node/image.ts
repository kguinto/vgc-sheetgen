import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';
import {
  damagedImage,
  imageFormat,
  notAnImage,
  type GrayImage,
  type ImageResult,
  type RgbaImage,
} from '../core/ocr/image';

/** Decodes a PNG or JPEG file, identified by its contents, to RGBA. */
export async function decodeImage(bytes: Uint8Array): Promise<ImageResult> {
  const format = imageFormat(bytes);

  if (!format) return { problem: notAnImage() };

  // The decoders throw on corrupt or truncated data.
  try {
    if (format === 'png') {
      const png = PNG.sync.read(Buffer.from(bytes));

      return {
        image: { width: png.width, height: png.height, data: png.data },
      };
    }

    const img = jpeg.decode(bytes, { useTArray: true, formatAsRGBA: true });

    return { image: { width: img.width, height: img.height, data: img.data } };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);

    return { problem: damagedImage(reason) };
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
