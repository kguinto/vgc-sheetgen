import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ALLOWED_CHARACTERS } from '../../src/core/ocr/engine';
import {
  pixelAt,
  type GrayImage,
  type Rect,
  type RgbaImage,
} from '../../src/core/ocr/image';
import { offsetRect } from '../../src/core/ocr/layout';
import { console1080 } from '../../src/core/ocr/layouts/console-1080';
import { createNodeEngine, type NodeEngine } from '../../src/node/tesseract';
import { loadFixture } from '../support/fixtures';

let engine: NodeEngine;

beforeAll(async () => {
  engine = await createNodeEngine();
});

afterAll(async () => {
  await engine.terminate();
});

describe('createNodeEngine', () => {
  it('reads a species name from a screenshot', async () => {
    // The first card's species name on the Moves & More tab: "Tyranitar".
    const image = await loadFixture('console-1080/team-1-moves.jpg');
    const rect = offsetRect(
      console1080.movesCard.species,
      console1080.cards[0]!,
    );

    const line = await engine.recognizeLine(
      darkTextOnWhite(image, rect),
      ALLOWED_CHARACTERS.name,
    );

    expect(line.text).toBe('Tyranitar');
    expect(line.symbols.map((s) => s.text).join('')).toBe('Tyranitar');
    expect(line.confidence).toBeGreaterThan(50);
  });
});

/**
 * The least clean-up that makes a crop readable: grayscale by the darkest
 * color channel, inverted so the game's white text becomes dark on light.
 */
function darkTextOnWhite(image: RgbaImage, rect: Rect): GrayImage {
  const data = new Uint8Array(rect.w * rect.h);

  for (let y = 0; y < rect.h; y++) {
    for (let x = 0; x < rect.w; x++) {
      const [r, g, b] = pixelAt(image, rect.x + x, rect.y + y);

      data[y * rect.w + x] = 255 - Math.min(r, g, b);
    }
  }

  return { width: rect.w, height: rect.h, data };
}
