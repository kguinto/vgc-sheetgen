import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { readTeam } from '../../src/core/ocr/pipeline';
import { decodeImage } from '../../src/node/image';
import { solidImage } from '../support/fixtures';

const FIXTURES = path.join(import.meta.dirname, '../fixtures');
const fixture = (name: string) => ({
  name,
  bytes: fs.readFileSync(path.join(FIXTURES, name)),
});

describe('readTeam', () => {
  it('summarizes each screenshot with the layout it matched', async () => {
    const { screenshots, problems } = await readTeam(
      [
        fixture('console-1080/team-1-moves.jpg'),
        fixture('console-720/team-2-stats.jpg'),
      ],
      { decodeImage },
    );
    expect(problems).toEqual([]);
    expect(screenshots).toEqual([
      {
        name: 'console-1080/team-1-moves.jpg',
        width: 1920,
        height: 1080,
        layout: 'console-1080',
      },
      {
        name: 'console-720/team-2-stats.jpg',
        width: 1280,
        height: 720,
        layout: 'console-720',
      },
    ]);
  });

  it('reports every problem, each naming its screenshot', async () => {
    const { screenshots, problems } = await readTeam(
      [
        { name: 'notes.txt', bytes: new TextEncoder().encode('hello') },
        fixture('console-720/team-2-moves.png'),
        { name: 'square.png', bytes: new Uint8Array() },
      ],
      {
        // A decoder that turns "square.png" into a 4:3 image.
        decodeImage: async (bytes) =>
          bytes.length === 0
            ? { image: solidImage(1024, 768) }
            : decodeImage(bytes),
      },
    );
    expect(screenshots.map((s) => s.name)).toEqual([
      'console-720/team-2-moves.png',
    ]);
    expect(problems.map((p) => [p.input, p.code])).toEqual([
      ['notes.txt', 'unreadable-image'],
      ['square.png', 'unsupported-size'],
    ]);
  });
});
