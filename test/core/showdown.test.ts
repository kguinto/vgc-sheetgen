import { describe, expect, it } from 'vitest';
import { formatShowdown } from '../../src/core/team/showdown';
import type { PokemonSet, Team } from '../../src/core/team/types';

const tyranitar: PokemonSet = {
  species: 'Tyranitar',
  ability: 'Sand Stream',
  item: 'Tyranitarite',
  moves: ['Protect', 'Rock Slide', 'Knock Off', 'Low Kick'],
  stats: { hp: 175, atk: 175, def: 130, spa: 103, spd: 133, spe: 124 },
  alignment: { plus: 'spe', minus: 'spa' },
};

const team = (...pokemon: PokemonSet[]): Team => ({
  teamId: '0A0HABQMPR',
  trainerName: 'Louie',
  pokemon,
});

describe('formatShowdown', () => {
  it("writes each Pokémon in Showdown's import format", () => {
    expect(formatShowdown(team(tyranitar))).toBe(
      [
        'Tyranitar @ Tyranitarite',
        'Ability: Sand Stream',
        'Level: 50',
        'Jolly Nature',
        '- Protect',
        '- Rock Slide',
        '- Knock Off',
        '- Low Kick',
      ].join('\n'),
    );
  });

  it('separates Pokémon with a blank line', () => {
    const whimsicott = { ...tyranitar, species: 'Whimsicott' };

    expect(formatShowdown(team(tyranitar, whimsicott))).toContain(
      '- Low Kick\n\nWhimsicott @ Tyranitarite',
    );
  });

  it('leaves out a neutral nature, a missing item or ability, and empty move slots', () => {
    expect(
      formatShowdown(
        team({
          ...tyranitar,
          item: '',
          ability: ' ',
          alignment: null,
          moves: ['Protect', '', 'Knock Off', ''],
        }),
      ),
    ).toBe(['Tyranitar', 'Level: 50', '- Protect', '- Knock Off'].join('\n'));
  });

  it('leaves out the stats and the trainer', () => {
    const text = formatShowdown(team(tyranitar));

    expect(text).not.toMatch(/175|Stats|EVs|Louie|0A0HABQMPR/);
  });
});
