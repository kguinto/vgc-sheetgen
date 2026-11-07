import { describe, expect, it } from 'vitest';
import type { RgbaImage, Rect } from '../../src/core/ocr/image';
import { inspectScreenshot, getScreenPair } from '../../src/core/ocr/inspect';
import { offsetRect } from '../../src/core/ocr/layout';
import { console1080 } from '../../src/core/ocr/layouts/console-1080';
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
    ({ file, kind, layout, scale, fields }) => {
      const { screen, problem } = inspectScreenshot(loadFixture(file));

      expect(problem).toBeUndefined();
      expect(screen?.kind).toBe(kind);
      expect(screen?.layout).toEqual({ name: layout, scale });
      expect(screen?.image).toMatchObject({ width: 1920, height: 1080 });
      expect(screen?.slots.every((s) => s.present)).toBe(true);
      expect(screen?.fields).toHaveLength(fields);
    },
  );

  it('lists the header, then each card in order', () => {
    const moves = inspectScreenshot(
      loadFixture('console-1080/team-1-moves.jpg'),
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
      loadFixture('console-720/team-2-stats.jpg'),
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

  it('skips the fields of an empty card', () => {
    // Paint over the sixth card's species name, as if the card were empty.
    const image = loadFixture('console-1080/team-1-moves.jpg');

    blackOut(
      image,
      offsetRect(console1080.movesCard.species, console1080.cards[5]!),
    );

    const screen = inspectScreenshot(image).screen;

    expect(screen?.slots.map((s) => s.present)).toEqual([
      true,
      true,
      true,
      true,
      true,
      false,
    ]);
    expect(screen?.fields).toHaveLength(44 - 7);
    expect(screen?.fields.some((f) => f.key.startsWith('slot.5.'))).toBe(false);
  });

  it('reports a 16:9 image that is not a Battle Team screen', () => {
    expect(inspectScreenshot(solidImage(1920, 1080)).problem?.code).toBe(
      'unknown-screen',
    );
  });

  it('reports an image that is not 16:9', () => {
    expect(inspectScreenshot(solidImage(1024, 768)).problem?.code).toBe(
      'unsupported-size',
    );
  });
});

describe('getScreenPair', () => {
  type Item = { kind: 'moves' | 'stats'; n: number };
  const moves: Item = { kind: 'moves', n: 1 };
  const stats: Item = { kind: 'stats', n: 2 };

  it('accepts either order', () => {
    expect(getScreenPair([moves, stats])).toEqual({
      moves,
      stats,
      problems: [],
    });
    expect(getScreenPair([stats, moves])).toEqual({
      moves,
      stats,
      problems: [],
    });
  });

  it('reports two screenshots of the same tab', () => {
    const { stats: found, problems } = getScreenPair([moves, stats, stats]);

    expect(found).toBeUndefined();
    expect(problems.map((p) => p.code)).toEqual(['same-screen']);
  });

  it('reports a missing tab', () => {
    const { moves: found, problems } = getScreenPair([moves]);

    expect(found).toBe(moves);
    expect(problems).toEqual([
      {
        code: 'missing-screen',
        message: "There's no screenshot of the Stats tab. Add one.",
      },
    ]);
  });
});

function blackOut(img: RgbaImage, rect: Rect) {
  for (let y = rect.y; y < rect.y + rect.h; y++) {
    const start = (y * img.width + rect.x) * 4;

    img.data.fill(0, start, start + rect.w * 4);
  }
}
