// Fills in the official team list form for one team.

import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from 'pdf-lib';
import { natureFromAlignment, shortStatName } from '../team/natures';
import { STAT_KEYS, type StatKey, type Team } from '../team/types';
import {
  OPPONENT_PAGE,
  STAFF_PAGE,
  type PageMap,
  type TextSlot,
} from './template-map';

/**
 * The form's two pages: one handed to tournament staff, which shows stats,
 * and one shown to opponents, which doesn't.
 */
export type SheetPage = 'staff' | 'opponent';

/** One value written on the form. Used by tests and the debug output. */
export type Placement = {
  page: SheetPage;
  /** Which value it is, e.g. `trainerName` or `pokemon.0.moves.2`. */
  field: string;
  /** The text as written, after any unprintable characters were replaced. */
  text: string;
};

/**
 * Something the player should check on the printed form. Returned rather
 * than thrown, like `ScreenshotProblem`, since the form is still written.
 */
export type SheetWarning = {
  code: SheetWarningCode;
  /**
   * The page it's on. A value with unprintable characters is on both pages
   * but is reported once, for the staff page.
   */
  page: SheetPage;
  field: string;
  /** The value as it came from the team. */
  text: string;
  /** Ready to show the user. */
  message: string;
};

export type SheetWarningCode =
  /**
   * The text has characters the form's font can't print, such as a
   * Japanese trainer name, so they were written as "?".
   */
  | 'replaced-characters'
  /** The text didn't fit its box even at the smallest font size. */
  | 'too-long';

export type RenderResult = {
  /** The filled-in form, ready to save. */
  pdf: Uint8Array;
  placements: Placement[];
  warnings: SheetWarning[];
};

const PAGES: { page: SheetPage; map: PageMap }[] = [
  { page: 'staff', map: STAFF_PAGE },
  { page: 'opponent', map: OPPONENT_PAGE },
];

/** Long text is shrunk to fit its box, but never smaller than this. */
const MIN_FONT_SIZE = 6;

/**
 * Writes the team onto both pages of the form. `template` is the blank form
 * as a PDF file's bytes.
 *
 * Anything missing from the team, such as an empty card or a stat that
 * wasn't read, is left blank so the player can write it in by hand.
 */
export async function renderTeamSheet(
  template: Uint8Array,
  team: Team,
): Promise<RenderResult> {
  const doc = await PDFDocument.load(template);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const placements: Placement[] = [];
  const warnings: SheetWarning[] = [];

  for (const [index, { page, map }] of PAGES.entries()) {
    const pdfPage = doc.getPage(index);

    const write = (field: string, slot: TextSlot, text: string) => {
      if (!text) return;

      const printable = replaceUnprintable(font, text);

      // The same text is on both pages, so only report this once.
      if (printable !== text && page === 'staff') {
        warnings.push({
          code: 'replaced-characters',
          page,
          field,
          text,
          message: `${describeField(field)}: "${text}" has characters the form's font can't print, so they're written as "?"`,
        });
      }

      const fits = drawFitted(pdfPage, font, slot, printable);

      if (!fits) {
        warnings.push({
          code: 'too-long',
          page,
          field,
          text,
          message: `${describeField(field)}: "${text}" is too long for its box on the ${page} page, so it runs past the edge`,
        });
      }

      placements.push({ page, field, text: printable });
    };

    write('trainerName', map.header.trainerName, team.trainerName);

    for (const [i, card] of map.cards.entries()) {
      const pokemon = team.pokemon[i];

      if (!pokemon) continue;

      const at = `pokemon.${i}`;

      write(`${at}.species`, card.species, pokemon.species);
      // Just the nature's name, e.g. "Careful": the form has no room for the
      // raised and lowered stats, and players don't write them.
      write(
        `${at}.alignment`,
        card.alignment,
        natureFromAlignment(pokemon.alignment) ?? 'Neutral',
      );
      write(`${at}.ability`, card.ability, pokemon.ability);
      write(`${at}.item`, card.item, pokemon.item);

      for (const [j, slot] of card.moves.entries()) {
        write(`${at}.moves.${j}`, slot, pokemon.moves[j] ?? '');
      }

      if (card.stats) {
        for (const stat of STAT_KEYS) {
          write(
            `${at}.stats.${stat}`,
            card.stats[stat],
            String(pokemon.stats[stat] ?? ''),
          );
        }
      }
    }
  }

  return { pdf: await doc.save(), placements, warnings };
}

/**
 * Writes `text` in its box, shrinking it until it fits. Returns false if it
 * still doesn't fit at the smallest size, in which case it's written anyway.
 */
function drawFitted(
  page: PDFPage,
  font: PDFFont,
  slot: TextSlot,
  text: string,
): boolean {
  let size = slot.size;

  while (
    size > MIN_FONT_SIZE &&
    font.widthOfTextAtSize(text, size) > slot.maxWidth
  ) {
    size -= 0.5;
  }

  const width = font.widthOfTextAtSize(text, size);

  page.drawText(text, {
    x: slot.align === 'right' ? slot.x - width : slot.x,
    y: slot.baseline,
    size,
    font,
    color: rgb(0, 0, 0),
  });

  return width <= slot.maxWidth;
}

/**
 * Replaces each character the font can't print with "?". The form uses the
 * standard Helvetica font, which covers English and Western European
 * letters (so "Flabébé" is fine) but not, for example, Japanese.
 */
function replaceUnprintable(font: PDFFont, text: string): string {
  let out = '';

  for (const char of text) {
    try {
      font.encodeText(char);
      out += char;
    } catch {
      out += '?';
    }
  }

  return out;
}

/** A field key in words, e.g. `pokemon.1.moves.2` → "Pokémon 2, move 3". */
function describeField(field: string): string {
  if (field === 'trainerName') return 'Trainer name';

  const [, card, name, sub] = field.split('.');
  const pokemon = `Pokémon ${Number(card) + 1}`;

  switch (name) {
    case 'moves':
      return `${pokemon}, move ${Number(sub) + 1}`;
    case 'stats':
      return `${pokemon}, ${shortStatName(sub as StatKey)}`;
    case 'item':
      return `${pokemon}, held item`;
    case 'alignment':
      return `${pokemon}, stat alignment`;
    default:
      return `${pokemon}, ${name}`;
  }
}
