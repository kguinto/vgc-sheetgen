import { describe, expect, it } from 'vitest';
import { preprocess, removeEdgeMarks } from '../../src/core/ocr/preprocess';

describe('preprocess', () => {
  it('turns near-white text black, and everything else white', () => {
    // A 6×3 image with a purple border, and in the middle row: the game's
    // white text, the purple card background, a colored icon, and light
    // gray text. The border keeps them away from the edge, where marks are
    // erased.
    const purple = [120, 90, 200];
    const middle = [
      purple,
      [235, 235, 235],
      [120, 90, 200],
      [240, 70, 110],
      [200, 200, 200],
      purple,
    ];
    const rows = [Array(6).fill(purple), middle, Array(6).fill(purple)];
    const data = new Uint8Array(
      rows.flatMap((row) => row.flatMap((rgb) => [...rgb, 255])),
    );

    const crop = preprocess(
      { width: 6, height: 3, data },
      { x: 0, y: 0, w: 6, h: 3 },
    );

    expect([...crop.data.subarray(6, 12)]).toEqual([255, 0, 255, 255, 0, 255]);
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
