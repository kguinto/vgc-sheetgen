import { describe, expect, it } from 'vitest';
import {
  preprocess,
  removeEdgeMarks,
  scaleUp,
} from '../../src/core/ocr/preprocess';

describe('preprocess', () => {
  const purple = [120, 90, 200];

  /**
   * A purple image with 3×3 blocks of the given colors in a row, each with
   * a purple gap around it, so none of them touch the edge.
   */
  function blocks(...colors: number[][]) {
    const width = colors.length * 4 + 1;
    const height = 5;
    const data = new Uint8Array(width * height * 4);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const block = Math.floor((x - 1) / 4);
        const inBlock = (x - 1) % 4 < 3 && y >= 1 && y <= 3 && x >= 1;
        const rgb = inBlock ? colors[block]! : purple;

        data.set([...rgb, 255], (y * width + x) * 4);
      }
    }

    return { width, height, data };
  }

  it('turns near-white text black, and everything else white', () => {
    // The game's white text, a colored icon, and light gray text.
    const image = blocks([235, 235, 235], [240, 70, 110], [200, 200, 200]);
    const crop = preprocess(image, {
      x: 0,
      y: 0,
      w: image.width,
      h: image.height,
    });

    // The middle of each block, at twice the size.
    const middle = (block: number) =>
      crop.data[5 * crop.width + (block * 4 + 2) * 2];

    expect([middle(0), middle(1), middle(2)]).toEqual([0, 255, 0]);
    // The purple background is white.
    expect(crop.data[0]).toBe(255);
  });

  it('crops to the rect, at twice the size', () => {
    const data = new Uint8Array(10 * 10 * 4).fill(255);
    const crop = preprocess(
      { width: 10, height: 10, data },
      { x: 2, y: 3, w: 4, h: 5 },
    );

    expect(crop).toMatchObject({ width: 8, height: 10 });
    expect(crop.data).toHaveLength(8 * 10);
  });
});

describe('scaleUp', () => {
  it('enlarges by the factor, blending between pixels', () => {
    // Black on the left, white on the right.
    const image = { width: 2, height: 1, data: new Uint8Array([0, 255]) };
    const scaled = scaleUp(image, 2);

    expect(scaled).toMatchObject({ width: 4, height: 2 });
    // The outer pixels keep their colors, and those in between blend.
    expect([...scaled.data.subarray(0, 4)]).toEqual([0, 64, 191, 255]);
  });
});

describe('removeEdgeMarks', () => {
  /** A small black-and-white image from rows of `#` (black) and `.` (white). */
  function crop(...rows: string[]) {
    return {
      width: rows[0]!.length,
      height: rows.length,
      data: new Uint8Array(
        rows.flatMap((row) => [...row].map((c) => (c === '#' ? 0 : 255))),
      ),
    };
  }

  it('erases marks touching the edge, and keeps the rest', () => {
    const result = removeEdgeMarks(
      crop(
        '......#',
        '.##..##', // the right-hand mark reaches the edge
        '.##...#',
        '.......',
      ),
    );

    expect(result).toEqual(crop('.......', '.##....', '.##....', '.......'));
  });

  it('erases a whole mark that reaches the edge, including diagonally', () => {
    const result = removeEdgeMarks(
      crop(
        '.......',
        '.#.....',
        '..#....',
        '...#...',
        '....#..',
        '.....#.',
        '......#',
      ),
    );

    expect(result.data.every((v) => v === 255)).toBe(true);
  });
});
