import { describe, expect, it } from 'vitest';
import { readTeam } from '../../src/core/ocr/pipeline';
import { decodeImage } from '../../src/node/image';
import { fixtureFile } from '../support/fixtures';

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
        layout: { name: 'console-1080', scale: 1 },
      });
      expect(screens.stats).toMatchObject({
        kind: 'stats',
        name: STATS,
        layout: { name: 'console-720', scale: 1.5 },
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
});
