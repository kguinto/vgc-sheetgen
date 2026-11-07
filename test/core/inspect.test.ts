import { describe, expect, it } from 'vitest';
import type { RgbaImage, Rect } from '../../src/core/ocr/image';
import { inspectScreenshot } from '../../src/core/ocr/inspect';
import { offsetRect } from '../../src/core/ocr/layout';
import { console1080 } from '../../src/core/ocr/layouts/console-1080';
import { filledCards } from '../../src/core/ocr/screens';
import { loadFixture, solidImage } from '../support/fixtures';

const fixtures = [
  {
    file: 'console-1080/team-1-moves.jpg',
    kind: 'moves',
    layout: 'console-1080',
    scale: 1,
    fields: 44,
  },
  {
    file: 'console-1080/team-1-stats.jpg',
    kind: 'stats',
    layout: 'console-1080',
    scale: 1,
    fields: 44,
  },
  {
    file: 'console-720/team-2-moves.jpg',
    kind: 'moves',
    layout: 'console-720',
    scale: 1.5,
    fields: 43,
  },
  {
    file: 'console-720/team-2-stats.jpg',
    kind: 'stats',
    layout: 'console-720',
    scale: 1.5,
    fields: 43,
  },
] as const;

describe('inspectScreenshot', () => {
  // Header fields (Team ID and trainer name, or just the trainer name on a
  // Switch) plus 7 per card.
  it.each(fixtures)(
    'recognizes $file',
    async ({ file, kind, layout, scale, fields }) => {
      const { screen, problem } = inspectScreenshot(
        await loadFixture(file),
        file,
      );

      expect(problem).toBeUndefined();
      expect(screen?.kind).toBe(kind);
      expect(screen?.name).toBe(file);
      expect(screen?.layout).toBe(layout);
      expect(screen?.scale).toBe(scale);
      expect(screen?.image).toMatchObject({ width: 1920, height: 1080 });
      expect(filledCards(screen!)).toEqual([0, 1, 2, 3, 4, 5]);
      expect(screen?.fields).toHaveLength(fields);
    },
  );

  it('lists the header, then each card in order', async () => {
    const moves = inspectScreenshot(
      await loadFixture('console-1080/team-1-moves.jpg'),
      'team-1-moves.jpg',
    ).screen;

    expect(moves?.fields.slice(0, 9).map((f) => f.key)).toEqual([
      'teamId',
      'trainerName',
      'slot.0.species',
      'slot.0.ability',
      'slot.0.item',
      'slot.0.moves.0',
      'slot.0.moves.1',
      'slot.0.moves.2',
      'slot.0.moves.3',
    ]);

    const stats = inspectScreenshot(
      await loadFixture('console-720/team-2-stats.jpg'),
      'team-2-stats.jpg',
    ).screen;

    // Switch screenshots have no Team ID.
    expect(stats?.fields.slice(0, 8).map((f) => f.key)).toEqual([
      'trainerName',
      'slot.0.species',
      'slot.0.stats.hp',
      'slot.0.stats.atk',
      'slot.0.stats.def',
      'slot.0.stats.spa',
      'slot.0.stats.spd',
      'slot.0.stats.spe',
    ]);
  });

  it('skips the fields of an empty card', async () => {
    // Paint over the sixth card's species name, as if the card were empty.
    const image = await loadFixture('console-1080/team-1-moves.jpg');

    blackOut(
      image,
      offsetRect(console1080.movesCard.species, console1080.cards[5]!),
    );

    const screen = inspectScreenshot(image, 'team-1-moves.jpg').screen;

    expect(filledCards(screen!)).toEqual([0, 1, 2, 3, 4]);
    expect(screen?.fields).toHaveLength(44 - 7);
    expect(screen?.fields.some((f) => f.key.startsWith('slot.5.'))).toBe(false);
  });

  it('reports a 16:9 image that is not a Battle Team screen', () => {
    expect(
      inspectScreenshot(solidImage(1920, 1080), 'blank.png').problem?.code,
    ).toBe('unknown-screen');
  });

  it('reports a screenshot where both tabs look selected', async () => {
    // Paint the Stats tab lime too, so both tabs look selected.
    const image = await loadFixture('console-1080/team-1-moves.jpg');
    const { x, y } = console1080.tabs.stats;

    image.data.set([194, 235, 31], (y * image.width + x) * 4);

    expect(inspectScreenshot(image, 'both.png').problem?.code).toBe(
      'unknown-screen',
    );
  });

  it('reports an image that is not 16:9', () => {
    expect(
      inspectScreenshot(solidImage(1024, 768), 'square.png').problem?.code,
    ).toBe('unsupported-size');
  });
});

function blackOut(img: RgbaImage, rect: Rect) {
  for (let y = rect.y; y < rect.y + rect.h; y++) {
    const start = (y * img.width + rect.x) * 4;

    img.data.fill(0, start, start + rect.w * 4);
  }
}
