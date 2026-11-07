import { describe, expect, it } from 'vitest';
import { selectLayout } from '../../src/core/ocr/layout';
import { console1080 } from '../../src/core/ocr/layouts/console-1080';
import { console720 } from '../../src/core/ocr/layouts/console-720';
import { LAYOUTS } from '../../src/core/ocr/layouts';
const pick = (width: number, height: number) =>
  selectLayout({ width, height }, LAYOUTS).layout?.name;

describe('selectLayout', () => {
  it('picks the layout for each console’s capture size', () => {
    expect(pick(1920, 1080)).toBe('console-1080');
    // Also 16:9 like console-1080, but console-720 lists it as a capture size.
    expect(pick(1280, 720)).toBe('console-720');
  });

  it('falls back to the first layout with the same aspect ratio', () => {
    expect(pick(2560, 1440)).toBe('console-1080');
    expect(pick(3840, 2160)).toBe('console-1080');
  });

  it('reports other aspect ratios', () => {
    const { problem } = selectLayout({ width: 1024, height: 768 }, LAYOUTS);
    expect(problem?.code).toBe('unsupported-size');
    expect(problem?.message).toContain('This one is 1024×768.');
  });
});

describe('console-720', () => {
  it('is console-1080 with the cards 11px higher and no Team ID', () => {
    expect(console720.width).toBe(console1080.width);
    expect(console720.header.teamId).toBeUndefined();
    console720.cards.forEach((card, i) => {
      expect(card).toEqual({
        x: console1080.cards[i]!.x,
        y: console1080.cards[i]!.y - 11,
      });
    });
  });
});
