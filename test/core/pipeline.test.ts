import { describe, expect, it } from 'vitest';
import { readTeam } from '../../src/core/ocr/pipeline';
import type { ImageResult } from '../../src/core/ocr/image';
import { decodeImage } from '../../src/node/image';
import { fixtureFile, solidImage } from '../support/fixtures';

const MOVES = 'console-1080/team-1-moves.jpg';
const STATS = 'console-720/team-2-stats.jpg';

describe('readTeam', () => {
  it('recognizes one screenshot of each tab, in either order', async () => {
    for (const order of [
      [MOVES, STATS],
      [STATS, MOVES],
    ]) {
      const { screens, problems } = await readTeam(order.map(fixtureFile), {
        decodeImage,
      });

      expect(problems).toEqual([]);
      expect(screens.moves).toMatchObject({
        kind: 'moves',
        name: MOVES,
        layout: 'console-1080',
        scale: 1,
      });
      expect(screens.stats).toMatchObject({
        kind: 'stats',
        name: STATS,
        layout: 'console-720',
        scale: 1.5,
      });
    }
  });

  it('reports every problem, each naming its screenshot', async () => {
    const { problems } = await readTeam(
      [
        { name: 'notes.txt', bytes: new TextEncoder().encode('hello') },
        fixtureFile(MOVES),
        fixtureFile('console-720/team-2-moves.png'),
      ],
      { decodeImage },
    );

    expect(problems.map((p) => [p.input, p.code])).toEqual([
      ['notes.txt', 'unreadable-image'],
      [undefined, 'same-screen'],
    ]);
  });

  it('reports a missing tab only when the screenshots are otherwise fine', async () => {
    const alone = await readTeam([fixtureFile(MOVES)], { decodeImage });

    expect(alone.problems.map((p) => p.code)).toEqual(['missing-screen']);

    // The unreadable file is the real problem; "no Stats screenshot" would
    // just repeat it.
    const withBadFile = await readTeam(
      [
        fixtureFile(MOVES),
        { name: 'notes.txt', bytes: new TextEncoder().encode('hello') },
      ],
      { decodeImage },
    );

    expect(withBadFile.problems.map((p) => p.code)).toEqual([
      'unreadable-image',
    ]);

    // "Two of the Moves & More tab" already says to use one of each.
    const twoOfOne = await readTeam(
      [fixtureFile(MOVES), fixtureFile('console-720/team-2-moves.png')],
      { decodeImage },
    );

    expect(twoOfOne.problems.map((p) => p.code)).toEqual(['same-screen']);
  });

  it("reports screenshots that aren't usable Battle Team screens, by name", async () => {
    // A decoder that turns the made-up files into blank images: one 16:9,
    // one 4:3.
    const blanks: Record<string, ImageResult> = {
      blank: { image: solidImage(1920, 1080) },
      square: { image: solidImage(1024, 768) },
    };
    const fakeDecode = async (bytes: Uint8Array) =>
      blanks[new TextDecoder().decode(bytes)] ?? decodeImage(bytes);
    const named = (name: string) => ({
      name: `${name}.png`,
      bytes: new TextEncoder().encode(name),
    });

    const { screens, problems } = await readTeam(
      [named('blank'), fixtureFile(MOVES), named('square')],
      { decodeImage: fakeDecode },
    );

    expect(screens.moves?.name).toBe(MOVES);
    // No "missing Stats screenshot" on top: either file may have been it.
    expect(problems.map((p) => [p.input, p.code])).toEqual([
      ['blank.png', 'unknown-screen'],
      ['square.png', 'unsupported-size'],
    ]);
  });
});
