import { describe, expect, it } from 'vitest';
import { formatTeam } from '../../src/core/team/format';
import type { PokemonSet } from '../../src/core/team/types';

const whimsicott: PokemonSet = {
  species: 'Whimsicott',
  ability: 'Prankster',
  item: 'Sitrus Berry',
  moves: ['Protect', 'Moonblast', 'Giga Drain', 'Tailwind'],
  stats: { hp: 137, atk: 78, def: 133, spa: 113, spd: 127, spe: 136 },
  alignment: { plus: 'spe', minus: 'atk' },
};

describe('formatTeam', () => {
  it('prints the trainer, Team ID, and each Pokémon', () => {
    expect(
      formatTeam({
        teamId: '0A0HABQMPR',
        trainerName: 'Louie',
        pokemon: [whimsicott],
      }),
    ).toBe(
      [
        'Trainer: Louie',
        'Team ID: 0A0HABQMPR',
        '',
        'Whimsicott @ Sitrus Berry',
        'Ability: Prankster',
        'Nature: Timid (+Spe / -Atk)',
        'Stats: HP 137 / Atk 78 / Def 133 / SpA 113 / SpD 127 / Spe 136',
        '- Protect',
        '- Moonblast',
        '- Giga Drain',
        '- Tailwind',
      ].join('\n'),
    );
  });

  it('leaves out what a team or Pokémon lacks', () => {
    const text = formatTeam({
      teamId: '',
      trainerName: 'Louie',
      pokemon: [
        {
          ...whimsicott,
          item: '',
          alignment: null,
          stats: { ...whimsicott.stats, spe: null },
        },
      ],
    });

    // No Team ID line (Switch screenshots don't show one), no "@ item",
    // a neutral nature, and "?" for a stat that wasn't read.
    expect(text).not.toContain('Team ID');
    expect(text).toContain('\nWhimsicott\n');
    expect(text).toContain('Nature: Neutral');
    expect(text).toContain('Spe ?');
  });
});
