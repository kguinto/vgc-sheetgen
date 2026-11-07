// Where each value goes on the official team list form.
//
// The form is a plain two-page PDF with no fillable fields, so values are
// drawn as text at fixed positions. The positions were measured from the
// form's own labels and ruled lines. They're in PDF points (1/72 inch),
// measured from the bottom-left corner of a US Letter page (612 × 792).

import type { StatKey } from '../team/types';
import type { AgeDivision } from './player';

/**
 * A box for one line of text. `x` is where the text starts, where it ends
 * when `align` is `'right'`, or its middle when `align` is `'center'`.
 * `baseline` is the height the letters sit on.
 */
export type TextSlot = {
  x: number;
  baseline: number;
  /** Text wider than this is shrunk to fit. */
  maxWidth: number;
  /** The font size to use when the text fits. */
  size: number;
  align?: 'left' | 'right' | 'center';
};

/** A point on the page, e.g. the middle of a checkbox. */
export type Point = { x: number; y: number };

/**
 * The lines at the top of a page. The staff page asks for everything; the
 * opponent page leaves out the personal ones (Player ID, date of birth, and
 * Support ID).
 */
export type HeaderMap = {
  playerName: TextSlot;
  trainerName: TextSlot;
  battleTeam: TextSlot;
  switchProfileName: TextSlot;
  /** The middle of each age division's checkbox. */
  ageDivision: Record<AgeDivision, Point>;
  playerId?: TextSlot;
  /** The spaces before, between, and after the line's two slashes. */
  birthDate?: { month: TextSlot; day: TextSlot; year: TextSlot };
  supportId?: TextSlot;
};

/** The boxes on one Pokémon's card. */
export type CardMap = {
  species: TextSlot;
  alignment: TextSlot;
  ability: TextSlot;
  item: TextSlot;
  moves: [TextSlot, TextSlot, TextSlot, TextSlot];
  /** Only the staff page has boxes for stats. */
  stats?: Record<StatKey, TextSlot>;
};

/** The boxes on one page of the form. */
export type PageMap = {
  header: HeaderMap;
  /** The six cards, left then right, top to bottom. */
  cards: CardMap[];
};

const VALUE_SIZE = 11;
const SPECIES_SIZE = 13;

/** How far the right-hand column of cards is from the left-hand one. */
const COLUMN_OFFSET = 292.13;

/** Values start just after the longest label on a card, "Held Item". */
const VALUE_X = 98;

/**
 * Where values must end. On the staff page that's where the stat boxes
 * start; the opponent page has no stat boxes, so values can run to the
 * card's border.
 */
const STAFF_VALUE_RIGHT = 244;
const OPPONENT_VALUE_RIGHT = 294;

/** The right edge of the stat boxes, in the left-hand column. */
const STAT_RIGHT = 294.5;

/**
 * The baselines of the rows on each card: Pokémon, Stat Alignment, Ability,
 * Held Item, and Moves 1–4. They're taken from the form's labels rather
 * than worked out from a fixed spacing, because the bottom row of cards
 * isn't spaced quite evenly.
 */
type RowBaselines = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

/** One entry per row of cards, top to bottom. */
const STAFF_ROWS: RowBaselines[] = [
  [610.66, 584.62, 559.78, 536.59, 513.43, 490.27, 467.11, 443.95],
  [409.27, 383.23, 358.37, 335.21, 312.05, 288.89, 265.73, 242.57],
  [207.86, 181.82, 156.98, 133.82, 110.66, 87.5, 65.9, 44.18],
];

const OPPONENT_ROWS: RowBaselines[] = [
  [612.94, 586.9, 562.06, 538.87, 515.71, 492.55, 469.39, 446.23],
  [411.55, 385.51, 360.65, 337.49, 314.33, 291.17, 268.01, 244.85],
  [210.14, 184.1, 159.26, 136.1, 112.94, 89.78, 66.62, 43.44],
];

/**
 * Which card row each stat box sits on: HP is beside Ability, Attack beside
 * Held Item, and so on down to Speed beside Move 4.
 */
const STAT_ROW: Record<StatKey, number> = {
  hp: 2,
  atk: 3,
  def: 4,
  spa: 5,
  spd: 6,
  spe: 7,
};

function card(
  rows: RowBaselines,
  column: 0 | 1,
  valueRight: number,
  withStats: boolean,
): CardMap {
  const dx = column * COLUMN_OFFSET;

  const slot = (row: number, size = VALUE_SIZE): TextSlot => ({
    x: VALUE_X + dx,
    baseline: rows[row]!,
    maxWidth: valueRight - VALUE_X,
    size,
  });

  const stat = (key: StatKey): TextSlot => ({
    x: STAT_RIGHT + dx,
    baseline: rows[STAT_ROW[key]]!,
    maxWidth: 40,
    size: VALUE_SIZE,
    align: 'right',
  });

  return {
    // The Pokémon row has no stat box beside it, so the name can run to the
    // card's border on both pages.
    species: {
      ...slot(0, SPECIES_SIZE),
      maxWidth: OPPONENT_VALUE_RIGHT - VALUE_X,
    },
    alignment: slot(1),
    ability: slot(2),
    item: slot(3),
    moves: [slot(4), slot(5), slot(6), slot(7)],
    ...(withStats && {
      stats: {
        hp: stat('hp'),
        atk: stat('atk'),
        def: stat('def'),
        spa: stat('spa'),
        spd: stat('spd'),
        spe: stat('spe'),
      },
    }),
  };
}

function cards(
  rows: RowBaselines[],
  valueRight: number,
  withStats: boolean,
): CardMap[] {
  return rows.flatMap((row) => [
    card(row, 0, valueRight, withStats),
    card(row, 1, valueRight, withStats),
  ]);
}

/*
 * The header's underlines, measured from the form at 4× resolution. The left
 * column's run from x 140.25 to 310.75, the right column's (staff page only)
 * from 432.5 to 591. Values sit just above them.
 */
const LEFT_LINE = { x: 140.25, right: 310.75 };
const RIGHT_LINE = { x: 432.5, right: 591 };

function headerSlot(
  underlineY: number,
  line: { x: number; right: number } = LEFT_LINE,
): TextSlot {
  return {
    x: line.x + 3,
    baseline: underlineY + 2.5,
    maxWidth: line.right - line.x - 6,
    size: VALUE_SIZE,
  };
}

/** A value centered between `left` and `right` on an underline. */
function centeredSlot(
  underlineY: number,
  left: number,
  right: number,
): TextSlot {
  return {
    x: (left + right) / 2,
    baseline: underlineY + 2.5,
    maxWidth: right - left - 6,
    size: VALUE_SIZE,
    align: 'center',
  };
}

/**
 * The middles of the Juniors, Seniors, and Masters checkboxes. They sit a
 * little higher on the opponent page, by `lift`. (Masters' box is drawn
 * about a point higher than the others.)
 */
function ageBoxes(lift: number): Record<AgeDivision, Point> {
  return {
    juniors: { x: 477.6, y: 708.9 + lift },
    seniors: { x: 533.3, y: 709.1 + lift },
    masters: { x: 582.9, y: 710.3 + lift },
  };
}

/** Page 1, "For Tournament Staff": the only page with stats. */
export const STAFF_PAGE: PageMap = {
  header: {
    playerName: headerSlot(702.25),
    trainerName: headerSlot(680.74),
    battleTeam: headerSlot(659.5),
    switchProfileName: headerSlot(635),
    ageDivision: ageBoxes(0),
    playerId: headerSlot(680.75, RIGHT_LINE),
    // The line's slashes are at x 478.5–483.5 and 534.25–539.25.
    birthDate: {
      month: centeredSlot(659.5, RIGHT_LINE.x, 478.5),
      day: centeredSlot(659.5, 483.5, 534.25),
      year: centeredSlot(659.5, 539.25, RIGHT_LINE.right),
    },
    supportId: headerSlot(635, RIGHT_LINE),
  },
  cards: cards(STAFF_ROWS, STAFF_VALUE_RIGHT, true),
};

/** Page 2, "For Opponents": no stats, and no personal details. */
export const OPPONENT_PAGE: PageMap = {
  header: {
    playerName: headerSlot(704),
    trainerName: headerSlot(682.54),
    battleTeam: headerSlot(661.25),
    switchProfileName: headerSlot(636.75),
    ageDivision: ageBoxes(1.7),
  },
  cards: cards(OPPONENT_ROWS, OPPONENT_VALUE_RIGHT, false),
};
