import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { renderTeamSheet } from '../../src/core/teamsheet/render';
import type { Team } from '../../src/core/team/types';
import { loadTemplate } from '../../src/node/teamsheet';
import { fixtureFile } from '../support/fixtures';

const template = loadTemplate();

const team = JSON.parse(
  fixtureFile('console-1080/team-1.expected.json').bytes.toString('utf8'),
) as Team;

const STAT_FIELD = /\.stats\./;

describe('renderTeamSheet', () => {
  it('fills in both pages of the form', async () => {
    const { pdf } = await renderTeamSheet(template, team);

    expect((await PDFDocument.load(pdf)).getPageCount()).toBe(2);
  });

  it('writes the trainer name and every Pokémon on both pages', async () => {
    const { placements, warnings } = await renderTeamSheet(template, team);

    for (const page of ['staff', 'opponent'] as const) {
      const texts = placements
        .filter((p) => p.page === page)
        .map((p) => p.text);

      expect(texts).toContain('Louie');
      expect(texts).toContain('Jolly');
      expect(texts).not.toContain('Jolly (+Spe / -SpA)');

      for (const pokemon of team.pokemon) {
        expect(texts).toEqual(
          expect.arrayContaining([
            pokemon.species,
            pokemon.ability,
            pokemon.item,
            ...pokemon.moves,
          ]),
        );
      }
    }

    expect(warnings).toEqual([]);
  });

  it('leaves the Team ID off the form', async () => {
    const { placements } = await renderTeamSheet(template, team);

    expect(placements.map((p) => p.text)).not.toContain(team.teamId);
  });

  it('writes stats on the staff page only', async () => {
    const { placements } = await renderTeamSheet(template, team);
    const stats = placements.filter((p) => STAT_FIELD.test(p.field));

    expect(stats.filter((p) => p.page === 'staff')).toHaveLength(36);
    expect(stats.filter((p) => p.page === 'opponent')).toEqual([]);
    expect(stats).toContainEqual({
      page: 'staff',
      field: 'pokemon.0.stats.hp',
      text: '175',
    });
  });

  it('leaves missing Pokémon and unread stats blank', async () => {
    const first = team.pokemon[0]!;

    const { placements } = await renderTeamSheet(template, {
      ...team,
      pokemon: [
        { ...first, stats: { ...first.stats, atk: null } },
        ...team.pokemon.slice(1, 4),
      ],
    });
    const fields = placements.map((p) => p.field);

    expect(fields).toContain('pokemon.0.stats.hp');
    expect(fields).not.toContain('pokemon.0.stats.atk');
    expect(fields.some((f) => f.startsWith('pokemon.4.'))).toBe(false);
    expect(fields.some((f) => f.startsWith('pokemon.5.'))).toBe(false);
  });

  it('leaves blank move slots blank', async () => {
    const first = team.pokemon[0]!;

    const { placements } = await renderTeamSheet(template, {
      ...team,
      pokemon: [{ ...first, moves: first.moves.slice(0, 2) }],
    });
    const fields = placements.map((p) => p.field);

    expect(fields).toContain('pokemon.0.moves.1');
    expect(fields).not.toContain('pokemon.0.moves.2');
  });

  it('keeps accented letters, as in Flabébé', async () => {
    const { placements, warnings } = await renderTeamSheet(template, {
      ...team,
      pokemon: [{ ...team.pokemon[0]!, species: 'Flabébé' }],
    });

    expect(placements.find((p) => p.field === 'pokemon.0.species')?.text).toBe(
      'Flabébé',
    );
    expect(warnings).toEqual([]);
  });

  it('writes characters the font cannot print as "?", and warns once', async () => {
    const { placements, warnings } = await renderTeamSheet(template, {
      ...team,
      trainerName: 'ルイ',
    });

    expect(
      placements.filter((p) => p.field === 'trainerName').map((p) => p.text),
    ).toEqual(['??', '??']);
    expect(warnings).toEqual([
      expect.objectContaining({
        code: 'replaced-characters',
        field: 'trainerName',
        text: 'ルイ',
        message: expect.stringMatching(/^Trainer name: "ルイ"/),
      }),
    ]);
  });

  it('shrinks long text, and warns when it still does not fit', async () => {
    const { warnings } = await renderTeamSheet(template, {
      ...team,
      pokemon: [
        { ...team.pokemon[0]!, item: 'Very Long Held Item Name'.repeat(3) },
      ],
    });

    expect(warnings).toEqual([
      expect.objectContaining({
        code: 'too-long',
        page: 'staff',
        field: 'pokemon.0.item',
        message: expect.stringMatching(/^Pokémon 1, held item: /),
      }),
      expect.objectContaining({ code: 'too-long', page: 'opponent' }),
    ]);
  });
});
