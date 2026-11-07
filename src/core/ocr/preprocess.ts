import { pixelAt, type GrayImage, type Rect, type RgbaImage } from './image';

/**
 * How bright a pixel's darkest color channel must be to count as text. The
 * game's text is near-white, so all three channels are high; the purple
 * card background and colored icons each have at least one low channel.
 */
const TEXT_THRESHOLD = 190;

/**
 * A field's crop, cleaned up for the text recognizer: black text on a white
 * background, which is what it reads best.
 *
 * Kept deliberately minimal. Further steps (e.g. scaling up, removing stray
 * marks) are added only where the accuracy check (`pnpm accuracy`) shows
 * they help.
 */
export function preprocess(image: RgbaImage, rect: Rect): GrayImage {
  const data = new Uint8Array(rect.w * rect.h);

  for (let y = 0; y < rect.h; y++) {
    for (let x = 0; x < rect.w; x++) {
      const [r, g, b] = pixelAt(image, rect.x + x, rect.y + y);

      // Text becomes black (0), everything else white (255).
      data[y * rect.w + x] = Math.min(r, g, b) > TEXT_THRESHOLD ? 0 : 255;
    }
  }

  return { width: rect.w, height: rect.h, data };
}
