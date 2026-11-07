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
 * Kept deliberately minimal. Each step is here because the accuracy check
 * (`pnpm accuracy`) showed it helps; others are added the same way.
 */
export function preprocess(image: RgbaImage, rect: Rect): GrayImage {
  return removeEdgeMarks(toBlackAndWhite(image, rect));
}

/**
 * Crops `rect` and turns it black and white: the game's near-white text
 * becomes black, and everything else white.
 */
function toBlackAndWhite(image: RgbaImage, rect: Rect): GrayImage {
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

/**
 * Erases any mark that touches the crop's edge, keeping the text in the
 * middle. A field's rectangle leaves clear space around its text, so a mark
 * reaching the edge belongs to something else: e.g. the large, faded slot
 * number in the corner of each card, which otherwise reads as a stray "y"
 * after the fourth move.
 *
 * A mark is a group of black pixels that touch each other, including
 * diagonally.
 */
export function removeEdgeMarks(crop: GrayImage): GrayImage {
  const { width, height } = crop;
  const data = new Uint8Array(crop.data);
  const isBlack = (i: number) => data[i] === 0;

  // Start from every black pixel on the edge, and turn white everything
  // connected to it.
  const stack: number[] = [];

  for (let x = 0; x < width; x++) stack.push(x, (height - 1) * width + x);

  for (let y = 0; y < height; y++) stack.push(y * width, y * width + width - 1);

  while (stack.length > 0) {
    const i = stack.pop()!;

    if (!isBlack(i)) continue;

    data[i] = 255;

    const x = i % width;
    const y = (i - x) / width;

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && ny >= 0 && nx < width && ny < height) {
          stack.push(ny * width + nx);
        }
      }
    }
  }

  return { width, height, data };
}
