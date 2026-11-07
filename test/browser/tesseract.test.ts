import { describe, expect, it } from 'vitest';
import { ALLOWED_CHARACTERS } from '../../src/core/ocr/engine';
import type { GrayImage, Rect } from '../../src/core/ocr/image';
import { offsetRect } from '../../src/core/ocr/layout';
import { console1080 } from '../../src/core/ocr/layouts/console-1080';
import { createBrowserEngine } from '../../src/browser/tesseract';
import movesUrl from '../fixtures/console-1080/team-1-moves.jpg?url';

describe('createBrowserEngine', () => {
  it('downloads the recognizer and reads a species name', async () => {
    const engine = await createBrowserEngine();

    // The first card's species name on the Moves & More tab: "Tyranitar".
    const rect = offsetRect(
      console1080.movesCard.species,
      console1080.cards[0]!,
    );

    const line = await engine.recognizeLine(
      darkTextOnWhite(await loadPixels(movesUrl), rect),
      ALLOWED_CHARACTERS.name,
    );

    expect(line.text).toBe('Tyranitar');
    expect(line.symbols.map((s) => s.text).join('')).toBe('Tyranitar');
    expect(line.confidence).toBeGreaterThan(50);
  });
});

/** A fixture screenshot's pixels, decoded by the browser. */
async function loadPixels(url: string): Promise<ImageData> {
  const bitmap = await createImageBitmap(await (await fetch(url)).blob());
  const context = new OffscreenCanvas(bitmap.width, bitmap.height).getContext(
    '2d',
  )!;

  context.drawImage(bitmap, 0, 0);

  return context.getImageData(0, 0, bitmap.width, bitmap.height);
}

/**
 * The least clean-up that makes a crop readable: grayscale by the darkest
 * color channel, inverted so the game's white text becomes dark on light.
 * The same as the Node engine's test does.
 */
function darkTextOnWhite(image: ImageData, rect: Rect): GrayImage {
  const data = new Uint8Array(rect.w * rect.h);

  for (let y = 0; y < rect.h; y++) {
    for (let x = 0; x < rect.w; x++) {
      const i = ((rect.y + y) * image.width + rect.x + x) * 4;
      const [r, g, b] = [
        image.data[i]!,
        image.data[i + 1]!,
        image.data[i + 2]!,
      ];

      data[y * rect.w + x] = 255 - Math.min(r, g, b);
    }
  }

  return { width: rect.w, height: rect.h, data };
}
