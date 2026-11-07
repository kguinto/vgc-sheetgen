import type { ScreenshotProblem } from '../screenshot-problems';

/**
 * A screenshot as raw pixels, after it's been decoded from its PNG or JPEG
 * file. Each pixel takes 4 bytes (red, green, blue, and alpha, i.e.
 * opacity), and the pixels run row by row from the top left.
 */
export type RgbaImage = {
  width: number;
  height: number;
  data: Uint8Array | Uint8ClampedArray;
};

/** A decoded image, or the reason the file couldn't be used as one. */
export type ImageResult =
  | { image: RgbaImage; problem?: undefined }
  | { image?: undefined; problem: ScreenshotProblem };

/** A rectangle in pixels: its top-left corner, width, and height. */
export type Rect = { x: number; y: number; w: number; h: number };

/** A color as red, green, and blue, each from 0 to 255. */
export type Rgb = [r: number, g: number, b: number];

/** The color of the pixel at column `x`, row `y`. */
export function pixelAt(img: RgbaImage, x: number, y: number): Rgb {
  const i = (y * img.width + x) * 4;

  return [img.data[i] ?? 0, img.data[i + 1] ?? 0, img.data[i + 2] ?? 0];
}

/**
 * Scales an image to a new size, e.g. a 1280×720 Switch screenshot up to
 * 1920×1080 so it lines up with positions measured on a Switch 2 screenshot.
 * Each new pixel is a blend of the four nearest original pixels, weighted by
 * distance ("bilinear" scaling), which keeps the edges of text smooth.
 *
 * An image that's already the right size is returned as is, without copying.
 */
export function resizeRgba(
  img: RgbaImage,
  width: number,
  height: number,
): RgbaImage {
  if (img.width === width && img.height === height) return img;

  // The new image, and how far apart its pixels are in the original's
  // pixels (e.g. 0.67 when scaling 1280 wide up to 1920).
  const out = new Uint8ClampedArray(width * height * 4);
  const sx = img.width / width;
  const sy = img.height / height;

  // One channel of an original pixel: c is 0 for red, 1 green, 2 blue, and
  // 3 alpha.
  const at = (x: number, y: number, c: number) =>
    img.data[(y * img.width + x) * 4 + c] ?? 0;

  for (let y = 0; y < height; y++) {
    // Where this row falls in the original image (fy, usually between two
    // rows), measured from pixel centers so the result isn't shifted by half
    // a pixel. y0 and y1 are the original rows above and below it, and wy is
    // how far it is from y0 toward y1, from 0 to 1.
    const fy = Math.max(0, (y + 0.5) * sy - 0.5);
    const y0 = Math.min(Math.floor(fy), img.height - 1);
    const y1 = Math.min(y0 + 1, img.height - 1);
    const wy = fy - y0;

    for (let x = 0; x < width; x++) {
      // The same for this column: the original columns either side (x0, x1)
      // and how far between them it falls (wx).
      const fx = Math.max(0, (x + 0.5) * sx - 0.5);
      const x0 = Math.min(Math.floor(fx), img.width - 1);
      const x1 = Math.min(x0 + 1, img.width - 1);
      const wx = fx - x0;

      // Blend the four original pixels around that point, channel by
      // channel: first left to right along the row above and the row below,
      // then between those two results.
      for (let c = 0; c < 4; c++) {
        const top = at(x0, y0, c) * (1 - wx) + at(x1, y0, c) * wx;
        const bottom = at(x0, y1, c) * (1 - wx) + at(x1, y1, c) * wx;

        out[(y * width + x) * 4 + c] = top * (1 - wy) + bottom * wy;
      }
    }
  }

  return { width, height, data: out };
}
