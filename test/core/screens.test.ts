import { describe, expect, it } from 'vitest';
import type { Field } from '../../src/core/ocr/inspect';
import { console1080 } from '../../src/core/ocr/layouts/console-1080';
import {
  detectScreen,
  filledCards,
  getScreenPair,
  SCREENS,
  screenTitle,
} from '../../src/core/ocr/screens';
import { fakeScreen, loadFixture, solidImage } from '../support/fixtures';

describe('detectScreen', () => {
  it('recognizes each Battle Team tab', async () => {
    const moves = await loadFixture('console-1080/team-1-moves.jpg');
    const stats = await loadFixture('console-1080/team-1-stats.jpg');

    expect(detectScreen(moves, console1080)).toBe(SCREENS.moves);
    expect(detectScreen(stats, console1080)).toBe(SCREENS.stats);
  });

  it("doesn't recognize a screen with neither tab selected", () => {
    expect(detectScreen(solidImage(1920, 1080), console1080)).toBeUndefined();
  });

  it("doesn't trust a screen that more than one screen recognizes", async () => {
    // Paint the Stats tab lime too, so both tabs look selected.
    const image = await loadFixture('console-1080/team-1-moves.jpg');
    const { x, y } = console1080.tabs.stats;

    image.data.set([194, 235, 31], (y * image.width + x) * 4);

    expect(detectScreen(image, console1080)).toBeUndefined();
  });
});

describe('screenTitle', () => {
  it("uses the game's names for the tabs", () => {
    expect(screenTitle('moves')).toBe('Moves & More');
    expect(screenTitle('stats')).toBe('Stats');
  });
});

describe('filledCards', () => {
  const at = { x: 0, y: 0, w: 1, h: 1 };
  const field = (key: string): Field => ({
    key,
    rect: at,
    kind: 'name',
    required: true,
  });

  it('lists each card that has fields, once, in order', () => {
    const screen = {
      ...fakeScreen('moves', 'moves.png'),
      fields: [
        field('trainerName'),
        field('slot.0.species'),
        field('slot.0.ability'),
        field('slot.3.species'),
        field('slot.5.moves.2'),
      ],
    };

    expect(filledCards(screen)).toEqual([0, 3, 5]);
  });

  it('is empty when no card has fields', () => {
    expect(filledCards(fakeScreen('stats', 'stats.png'))).toEqual([]);
  });
});

describe('getScreenPair', () => {
  const moves = fakeScreen('moves', 'moves.png');
  const stats = fakeScreen('stats', 'stats.png');

  it('accepts either order', () => {
    expect(getScreenPair([moves, stats])).toEqual({
      pair: { moves, stats },
      problems: [],
    });
    expect(getScreenPair([stats, moves])).toEqual({
      pair: { moves, stats },
      problems: [],
    });
  });

  it('reports two screenshots of the same tab', () => {
    const { pair, problems } = getScreenPair([moves, stats, stats]);

    expect(pair).toEqual({ moves });
    expect(problems.map((p) => p.code)).toEqual(['same-screen']);
  });

  it("doesn't report a missing tab when screenshots were unusable", () => {
    expect(getScreenPair([moves], { unusable: 1 }).problems).toEqual([]);
  });

  it("doesn't report a missing tab next to two of the other tab", () => {
    const { problems } = getScreenPair([moves, moves]);

    expect(problems.map((p) => p.code)).toEqual(['same-screen']);
  });

  it('reports a missing tab', () => {
    const { pair, problems } = getScreenPair([moves]);

    expect(pair).toEqual({ moves });
    expect(problems).toEqual([
      {
        code: 'missing-screen',
        message: "There's no screenshot of the Stats tab. Add one.",
      },
    ]);
  });
});
