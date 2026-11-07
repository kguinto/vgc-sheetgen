import { describe, expect, it } from 'vitest';
import { preprocess } from '../../src/core/ocr/preprocess';

describe('preprocess', () => {
  it('turns near-white text black, and everything else white', () => {
    // One row of pixels: the game's white text, the purple card background,
    // a colored icon, and light gray text.
    const colors = [
      [235, 235, 235],
      [120, 90, 200],
      [240, 70, 110],
      [200, 200, 200],
    ];
    const data = new Uint8Array(colors.flatMap((rgb) => [...rgb, 255]));

    const crop = preprocess(
      { width: 4, height: 1, data },
      { x: 0, y: 0, w: 4, h: 1 },
    );

    expect(crop).toEqual({
      width: 4,
      height: 1,
      data: new Uint8Array([0, 255, 255, 0]),
    });
  });

  it('crops to the rect', () => {
    const data = new Uint8Array(10 * 10 * 4).fill(255);
    const crop = preprocess(
      { width: 10, height: 10, data },
      { x: 2, y: 3, w: 4, h: 5 },
    );

    expect(crop).toMatchObject({ width: 4, height: 5 });
    expect(crop.data).toHaveLength(4 * 5);
  });
});
