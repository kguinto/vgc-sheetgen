/**
 * Measures how accurately the fixture screenshots are read: every field of
 * every fixture pair, compared with the team in its `*.expected.json`.
 *
 *   pnpm accuracy
 *
 * Prints each field read wrongly, then how many were read correctly. Use it
 * to check whether a change to how fields are cleaned up or read helps. (The
 * golden test, once the team is put together, will check the same thing.)
 */
import fs from 'node:fs';
import path from 'node:path';
import { readTeam } from '../src/core/ocr/pipeline';
import type { FieldResult } from '../src/core/ocr/read';
import { ALIGNABLE_STAT_KEYS, STAT_KEYS } from '../src/core/team/types';
import { decodeImage } from '../src/node/image';
import { createNodeEngine } from '../src/node/tesseract';

const FIXTURES = path.join(import.meta.dirname, '../test/fixtures');

/** The parts of an `*.expected.json` this script compares against. */
type ExpectedTeam = {
  teamId: string;
  trainerName: string;
  pokemon: {
    species: string;
    ability: string;
    item: string;
    moves: string[];
    stats: Record<string, number>;
    /** The stats the nature raises and lowers, or null for a neutral one. */
    alignment: { plus: string; minus: string } | null;
  }[];
};

const engine = await createNodeEngine();
let correct = 0;
let total = 0;

try {
  // Each fixture pair is `<team>-moves.*` and `<team>-stats.*`, next to
  // `<team>.expected.json`, in a folder per layout.
  for (const layout of fs.readdirSync(FIXTURES)) {
    const dir = path.join(FIXTURES, layout);

    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.expected.json')) continue;

      const team = file.replace('.expected.json', '');

      const screenshot = (tab: string) => {
        const name = `${team}-${tab}.jpg`;

        return { name, bytes: fs.readFileSync(path.join(dir, name)) };
      };

      const expected = expectedValues(
        JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')),
      );
      const { reads, problems } = await readTeam(
        [screenshot('moves'), screenshot('stats')],
        { decodeImage, engine },
      );

      if (problems.length > 0) {
        console.log(`${layout}/${team}: ${problems.map((p) => p.message)}`);
        continue;
      }

      for (const [tab, results] of Object.entries(reads)) {
        for (const result of results as FieldResult[]) {
          // A field the fixture doesn't know about (e.g. the Team ID on a
          // screen that doesn't show one) isn't counted.
          if (!expected.has(result.key)) continue;

          const want = expected.get(result.key)!;
          const got = result.value ?? '';

          total++;

          if (String(got) === String(want)) {
            correct++;
          } else {
            console.log(
              `${layout}/${team} ${tab} ${result.key}: expected "${want}", read "${got}"`,
            );
          }
        }
      }
    }
  }
} finally {
  await engine.terminate();
}

const percent = total ? ((100 * correct) / total).toFixed(1) : '0';

console.log(`\n${correct}/${total} fields read correctly (${percent}%)`);

/** Each field's expected value, by field key, e.g. `slot.2.ability`. */
function expectedValues(team: ExpectedTeam): Map<string, string | number> {
  const values = new Map<string, string | number>([
    ['trainerName', team.trainerName],
  ]);

  // Switch screenshots don't show the Team ID, and their fixtures leave it
  // blank.
  if (team.teamId) values.set('teamId', team.teamId);

  team.pokemon.forEach((p, card) => {
    const slot = `slot.${card}`;

    values.set(`${slot}.species`, p.species);
    values.set(`${slot}.ability`, p.ability);
    values.set(`${slot}.item`, p.item);
    p.moves.forEach((move, i) => values.set(`${slot}.moves.${i}`, move));

    for (const stat of STAT_KEYS) {
      values.set(`${slot}.stats.${stat}`, p.stats[stat]!);
    }

    // Each stat's arrow: up for the one the nature raises, down for the one
    // it lowers, none (blank) for the rest.
    for (const stat of ALIGNABLE_STAT_KEYS) {
      const arrow =
        stat === p.alignment?.plus
          ? 'up'
          : stat === p.alignment?.minus
            ? 'down'
            : '';

      values.set(`${slot}.arrows.${stat}`, arrow);
    }
  });

  return values;
}
