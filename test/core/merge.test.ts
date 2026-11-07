import { describe, expect, it } from 'vitest';
import type { FieldKind } from '../../src/core/ocr/inspect';
import { mergeTeam } from '../../src/core/ocr/merge';
import type { FieldResult } from '../../src/core/ocr/read';

/** Field results from `key: value` pairs, as if read from a screen. */
function reads(values: Record<string, string | number | null>): FieldResult[] {
  return Object.entries(values).map(([key, value]) => ({
    key,
    kind: (key.includes('.arrows.')
      ? 'arrow'
      : key.includes('.stats.')
        ? 'digits'
        : 'name') as FieldKind,
    rect: { x: 0, y: 0, w: 1, h: 1 },
    value,
    raw: String(value ?? ''),
    confidence: 100,
  }));
}

const moves = reads({
  teamId: '0A0HABQMPR',
  trainerName: 'Louie',
  'slot.0.species': 'Whimsicott',
  'slot.0.ability': 'Prankster',
  'slot.0.item': 'Sitrus Berry',
  'slot.0.moves.0': 'Moonblast',
  'slot.0.moves.1': 'Tailwind',
  'slot.0.moves.2': null,
  'slot.0.moves.3': null,
});

const stats = reads({
  teamId: '0A0HABQMPR',
  trainerName: 'Louie',
  'slot.0.species': 'Whimsicott',
  'slot.0.stats.hp': 137,
  'slot.0.stats.atk': 78,
  'slot.0.stats.def': 133,
  'slot.0.stats.spa': 113,
  'slot.0.stats.spd': 127,
  'slot.0.stats.spe': 136,
  'slot.0.arrows.atk': 'down',
  'slot.0.arrows.def': null,
  'slot.0.arrows.spa': null,
  'slot.0.arrows.spd': null,
  'slot.0.arrows.spe': 'up',
});

describe('mergeTeam', () => {
  it('takes each value from the screen that shows it', () => {
    expect(mergeTeam(moves, stats)).toEqual({
      teamId: '0A0HABQMPR',
      trainerName: 'Louie',
      pokemon: [
        {
          species: 'Whimsicott',
          ability: 'Prankster',
          item: 'Sitrus Berry',
          // Blank move slots are dropped.
          moves: ['Moonblast', 'Tailwind'],
          stats: { hp: 137, atk: 78, def: 133, spa: 113, spd: 127, spe: 136 },
          // ⇑ Speed, ⇓ Attack: Timid.
          alignment: { plus: 'spe', minus: 'atk' },
        },
      ],
    });
  });

  it('reads no arrows as a neutral nature', () => {
    const neutral = stats.map((r) =>
      r.kind === 'arrow' ? { ...r, value: null } : r,
    );

    expect(mergeTeam(moves, neutral).pokemon[0]?.alignment).toBeNull();
  });

  it("leaves arrows that can't be a real nature blank", () => {
    // Two ⇑ and no ⇓.
    const impossible = stats.map((r) =>
      r.key === 'slot.0.arrows.atk' ? { ...r, value: 'up' } : r,
    );

    expect(mergeTeam(moves, impossible).pokemon[0]?.alignment).toBeNull();
  });

  it('keeps a card that only one screen shows', () => {
    const extra = reads({
      'slot.3.species': 'Milotic',
      'slot.3.ability': 'Competitive',
    });
    const team = mergeTeam([...moves, ...extra], stats);

    expect(team.pokemon.map((p) => p.species)).toEqual([
      'Whimsicott',
      'Milotic',
    ]);
    expect(team.pokemon[1]?.stats.hp).toBeNull();
  });
});
