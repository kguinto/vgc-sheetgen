import { describe, expect, it } from 'vitest';
import { countPixels, pixelAt, resizeRgba } from '../../src/core/ocr/image';
import { solidImage } from '../support/fixtures';

describe('resizeRgba', () => {
  it('returns the same image at the same size', () => {
    const img = solidImage(4, 3);

    expect(resizeRgba(img, 4, 3)).toBe(img);
  });

  it('scales to the new size, keeping a solid color', () => {
    const out = resizeRgba(solidImage(4, 2, [10, 20, 30]), 6, 3);

    expect(out).toMatchObject({ width: 6, height: 3 });
    expect(out.data).toHaveLength(6 * 3 * 4);
    expect(pixelAt(out, 0, 0)).toEqual([10, 20, 30]);
    expect(pixelAt(out, 5, 2)).toEqual([10, 20, 30]);
  });
});

describe('countPixels', () => {
  it('counts matching pixels inside the rect only', () => {
    const img = solidImage(4, 4);

    // Make the top-left 2×2 corner white.
    for (const [x, y] of [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ] as const) {
      img.data.set([255, 255, 255], (y * img.width + x) * 4);
    }

    const isWhite = ([r]: [number, number, number]) => r === 255;

    expect(countPixels(img, { x: 0, y: 0, w: 4, h: 4 }, isWhite)).toBe(4);
    expect(countPixels(img, { x: 1, y: 1, w: 3, h: 3 }, isWhite)).toBe(1);
    expect(countPixels(img, { x: 2, y: 2, w: 2, h: 2 }, isWhite)).toBe(0);
  });
});
