// The whole pipeline, with the real text recognizer, on every fixture: each
// pair of screenshots must read back as exactly the team in its
// `*.expected.json`. A new fixture is picked up by dropping its files into
// a layout's folder in `test/fixtures/`.
//
// When this fails, `pnpm accuracy` lists which fields were misread, and
// `pnpm sheetgen --debug-dir <dir>` shows what the recognizer was given.

import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readTeam } from '../../src/core/ocr/pipeline';
import { decodeImage } from '../../src/node/image';
import { createNodeEngine, type NodeEngine } from '../../src/node/tesseract';

const FIXTURES = path.join(import.meta.dirname, '../fixtures');

/** Every `<layout>/<team>.expected.json`, with its two screenshots. */
const fixtures = fs.readdirSync(FIXTURES).flatMap((layout) =>
  fs
    .readdirSync(path.join(FIXTURES, layout))
    .filter((file) => file.endsWith('.expected.json'))
    .map((file) => ({
      name: `${layout}/${file.replace('.expected.json', '')}`,
      dir: path.join(FIXTURES, layout),
      team: file.replace('.expected.json', ''),
    })),
);

let engine: NodeEngine;

beforeAll(async () => {
  engine = await createNodeEngine();
});

afterAll(async () => {
  await engine.terminate();
});

describe('golden fixtures', () => {
  it.each(fixtures)(
    '$name reads back as its expected team',
    async (fixture) => {
      const screenshot = (tab: string) => {
        const name = `${fixture.team}-${tab}.jpg`;

        return { name, bytes: fs.readFileSync(path.join(fixture.dir, name)) };
      };

      const expected = JSON.parse(
        fs.readFileSync(
          path.join(fixture.dir, `${fixture.team}.expected.json`),
          'utf8',
        ),
      );

      const { team, problems } = await readTeam(
        [screenshot('moves'), screenshot('stats')],
        { decodeImage, engine },
      );

      expect(problems).toEqual([]);
      expect(team).toEqual(expected);
    },
  );

  it('has fixtures to check', () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });
});
