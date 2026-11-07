import { describe, expect, it } from 'vitest';
import { readArrow } from '../../src/core/ocr/signals';
import { solidImage } from '../support/fixtures';

describe('readArrow', () => {
  const purple: [number, number, number] = [120, 90, 200];
  const pink: [number, number, number] = [240, 70, 110];
  const blue: [number, number, number] = [40, 170, 230];
  const all = { x: 0, y: 0, w: 10, h: 10 };

  /** A purple 10×10 zone with 15 pixels of each given color: an arrow's worth. */
  function zone(...colors: [number, number, number][]) {
    const image = solidImage(10, 10, purple);

    colors.forEach((rgb, row) => {
      // 15 pixels per color: a full row of 10, plus 5 on the next.
      for (let i = 0; i < 15; i++) {
        image.data.set(rgb, (row * 20 + i) * 4);
      }
    });

    return image;
  }

  it('finds the ⇑ and the ⇓ by their colors', () => {
    expect(readArrow(zone(pink), all)).toBe('up');
    expect(readArrow(zone(blue), all)).toBe('down');
  });

  it('finds nothing where there is no arrow', () => {
    expect(readArrow(zone(), all)).toBeNull();
  });

  it('ignores a few stray pixels of arrow color', () => {
    const image = solidImage(10, 10, purple);

    image.data.set(pink, 0);
    expect(readArrow(image, all)).toBeNull();
  });

  it("doesn't pick either when both colors are there", () => {
    expect(readArrow(zone(pink, blue), all)).toBeNull();
  });
});
