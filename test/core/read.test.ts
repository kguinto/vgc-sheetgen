import { describe, expect, it } from 'vitest';
import { ALLOWED_CHARACTERS } from '../../src/core/ocr/engine';
import type { Field } from '../../src/core/ocr/inspect';
import { readFields } from '../../src/core/ocr/read';
import { fakeEngine } from '../support/engine';
import { fakeScreen, solidImage } from '../support/fixtures';

/**
 * A screen with two fields: a stat, drawn as a white block (so it has
 * text), and a move slot left blank, on a purple background.
 */
function screenWithFields() {
  const image = solidImage(40, 20, [120, 90, 200]);

  for (let y = 2; y < 8; y++) {
    for (let x = 2; x < 12; x++) {
      image.data.set([235, 235, 235], (y * 40 + x) * 4);
    }
  }

  const fields: Field[] = [
    {
      key: 'slot.0.stats.hp',
      rect: { x: 0, y: 0, w: 14, h: 10 },
      kind: 'digits',
      required: true,
    },
    {
      key: 'slot.0.moves.3',
      rect: { x: 20, y: 10, w: 14, h: 10 },
      kind: 'name',
      required: false,
    },
  ];

  return { ...fakeScreen('stats', 'stats.png'), image, fields };
}

describe('readFields', () => {
  it('reads each field in order, with the characters its kind allows', async () => {
    const engine = fakeEngine(() => '175');
    const results = await readFields(screenWithFields(), engine);

    expect(results.map((r) => [r.key, r.value, r.raw])).toEqual([
      ['slot.0.stats.hp', 175, '175'],
      ['slot.0.moves.3', null, ''],
    ]);
    expect(engine.calls.map((c) => c.whitelist)).toEqual([
      ALLOWED_CHARACTERS.digits,
    ]);
  });

  it("doesn't send blank fields to the recognizer", async () => {
    const engine = fakeEngine();
    const [, blank] = await readFields(screenWithFields(), engine);

    expect(engine.calls).toHaveLength(1);
    expect(blank).toMatchObject({ value: null, raw: '', confidence: 100 });
  });

  it('reports progress after each field', async () => {
    const progress: [number, number][] = [];

    await readFields(screenWithFields(), fakeEngine(), (done, total) =>
      progress.push([done, total]),
    );

    expect(progress).toEqual([
      [1, 2],
      [2, 2],
    ]);
  });

  it('reads arrows by color, without the recognizer', async () => {
    const engine = fakeEngine();
    const screen = screenWithFields();

    // A pink ⇑ in the top-left, where the arrow field is.
    for (let i = 0; i < 20; i++) screen.image.data.set([240, 70, 110], i * 4);

    const [arrow] = await readFields(
      {
        ...screen,
        fields: [
          {
            key: 'slot.0.arrows.spe',
            rect: { x: 0, y: 0, w: 20, h: 2 },
            kind: 'arrow',
            required: false,
          },
        ],
      },
      engine,
    );

    expect(arrow).toMatchObject({ value: 'up', raw: 'up', confidence: 100 });
    expect(engine.calls).toEqual([]);
  });
});
