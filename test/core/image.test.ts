import { describe, expect, it } from 'vitest';
import { pixelAt, resizeRgba } from '../../src/core/ocr/image';
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
