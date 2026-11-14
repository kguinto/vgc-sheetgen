import { describe, expect, it } from 'vitest';
import { formatShowdown } from '../../src/core/team/showdown';
import type { PokemonSet, Team } from '../../src/core/team/types';

const tyranitar: PokemonSet = {
  species: 'Tyranitar',
  ability: 'Sand Stream',
  item: 'Tyranitarite',
  moves: ['Protect', 'Rock Slide', 'Knock Off', 'Low Kick'],
  stats: { hp: 175, atk: 175, def: 130, spa: 103, spd: 133, spe: 124 },
  points: { hp: 0, atk: 21, def: 0, spa: 0, spd: 13, spe: 32 },
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
        'EVs: 21 Atk / 13 SpD / 32 Spe',
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
          points: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        }),
      ),
    ).toBe(['Tyranitar', 'Level: 50', '- Protect', '- Knock Off'].join('\n'));
  });

  it("writes SP in Showdown's order, leaving out those with none", () => {
    const raichu = {
      ...tyranitar,
      points: { hp: 26, atk: 0, def: 14, spa: 0, spd: 0, spe: 26 },
    };

    expect(formatShowdown(team(raichu))).toContain(
      'Level: 50\nEVs: 26 HP / 14 Def / 26 Spe\nJolly Nature',
    );
  });

  it('leaves out SP that were not read', () => {
    const unread = { ...tyranitar, points: { ...tyranitar.points, spd: null } };

    expect(formatShowdown(team(unread))).toContain('EVs: 21 Atk / 32 Spe');
  });

  it("leaves out the stats' totals and the trainer", () => {
    const text = formatShowdown(team(tyranitar));

    expect(text).not.toMatch(/175|Stats|Louie|0A0HABQMPR/);
  });
});
