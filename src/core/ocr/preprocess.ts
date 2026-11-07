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
  const gray = cropToGray(image, rect);

  return removeEdgeMarks(toBlackAndWhite(scaleUp(gray, UPSCALE)));
}

/** How much each crop is enlarged before being turned black and white. */
const UPSCALE = 2;

/**
 * Crops `rect` to grayscale, using each pixel's darkest color channel: the
 * game's white text stays bright, while the purple background and colored
 * icons, which each have a dark channel, go dark.
 */
function cropToGray(image: RgbaImage, rect: Rect): GrayImage {
  const data = new Uint8Array(rect.w * rect.h);

  for (let y = 0; y < rect.h; y++) {
    for (let x = 0; x < rect.w; x++) {
      const [r, g, b] = pixelAt(image, rect.x + x, rect.y + y);

      data[y * rect.w + x] = Math.min(r, g, b);
    }
  }

  return { width: rect.w, height: rect.h, data };
}

/**
 * Enlarges a grayscale image by `factor`, blending neighboring pixels so
 * letters' edges stay smooth, which gives the recognizer more to work with.
 */
export function scaleUp(img: GrayImage, factor: number): GrayImage {
  const width = Math.round(img.width * factor);
  const height = Math.round(img.height * factor);
  const data = new Uint8Array(width * height);
  const at = (x: number, y: number) => img.data[y * img.width + x] ?? 0;

  for (let y = 0; y < height; y++) {
    // Where this row falls in the original, measured from pixel centers;
    // y0 and y1 are the rows either side, wy how far between them (0–1).
    const fy = Math.max(0, (y + 0.5) / factor - 0.5);
    const y0 = Math.min(Math.floor(fy), img.height - 1);
    const y1 = Math.min(y0 + 1, img.height - 1);
    const wy = fy - y0;

    for (let x = 0; x < width; x++) {
      // The same for this column.
      const fx = Math.max(0, (x + 0.5) / factor - 0.5);
      const x0 = Math.min(Math.floor(fx), img.width - 1);
      const x1 = Math.min(x0 + 1, img.width - 1);
      const wx = fx - x0;

      const top = at(x0, y0) * (1 - wx) + at(x1, y0) * wx;
      const bottom = at(x0, y1) * (1 - wx) + at(x1, y1) * wx;

      data[y * width + x] = Math.round(top * (1 - wy) + bottom * wy);
    }
  }

  return { width, height, data };
}

/**
 * Turns a grayscale crop black and white: the game's near-white text becomes
 * black, and everything else white.
 */
function toBlackAndWhite(gray: GrayImage): GrayImage {
  const data = gray.data.map((value) => (value > TEXT_THRESHOLD ? 0 : 255));

  return { width: gray.width, height: gray.height, data };
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
