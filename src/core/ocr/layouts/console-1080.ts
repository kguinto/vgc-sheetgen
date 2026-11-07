import type { LayoutProfile } from '../layout';

// Positions on Nintendo Switch 2 screenshots. These are always 1920×1080,
// whether the console is docked or handheld, and even when it sends 4K to a
// TV: Nintendo saves screenshots at a fixed size per console.
// https://www.nintendo.com/en-gb/Support/Nintendo-Switch-2/Captured-Screenshots-or-Video-Appear-Blurry-or-Low-Quality-2843784.html
//
// The six Pokémon cards form a grid of two columns and three rows: the right
// column starts 800px right of the left one, and rows are 217px apart.
//
// Each field's rectangle leaves some space around its text (capitals start
// about 10px below the top, and letters like "g" end about 6px above the
// bottom). Keep it that way when adjusting them: when a field is read, any
// marks touching the rectangle's edge are assumed to belong to something
// else and are ignored.
const CARD_X = [185, 985];
const CARD_Y = [272, 489, 706];

// On the Stats tab, the six numbers sit in two columns of three rows.
const STAT_ROWS = [55, 99, 144];
const LEFT_VALUE = { x: 215, w: 58 };
const RIGHT_VALUE = { x: 565, w: 60 };
const ROW_H = 38;

// Where each stat's name is, which the nature's ⇑ or ⇓ follows.
const LEFT_NAME = { x: 90, w: 130 };
const RIGHT_NAME = { x: 440, w: 135 };

export const console1080: LayoutProfile = {
  name: 'console-1080',
  width: 1920,
  height: 1080,
  captures: [{ width: 1920, height: 1080 }],
  header: {
    teamId: { x: 660, y: 106, w: 300, h: 46 },
    trainerName: { x: 1270, y: 106, w: 400, h: 50 },
  },
  tabs: { moves: { x: 700, y: 224 }, stats: { x: 1200, y: 224 } },
  cards: CARD_Y.flatMap((y) => CARD_X.map((x) => ({ x, y }))),
  movesCard: {
    species: { x: 81, y: 4, w: 234, h: 50 },
    ability: { x: 87, y: 53, w: 355, h: 44 },
    item: { x: 87, y: 99, w: 355, h: 44 },
    moves: [
      { x: 499, y: 8, w: 248, h: 44 },
      { x: 499, y: 53, w: 248, h: 44 },
      { x: 499, y: 99, w: 248, h: 44 },
      { x: 499, y: 144, w: 248, h: 44 },
    ],
  },
  statsCard: {
    species: { x: 81, y: 4, w: 234, h: 50 },
    values: {
      hp: { ...LEFT_VALUE, y: STAT_ROWS[0]!, h: ROW_H },
      atk: { ...LEFT_VALUE, y: STAT_ROWS[1]!, h: ROW_H },
      def: { ...LEFT_VALUE, y: STAT_ROWS[2]!, h: ROW_H },
      spa: { ...RIGHT_VALUE, y: STAT_ROWS[0]!, h: ROW_H },
      spd: { ...RIGHT_VALUE, y: STAT_ROWS[1]!, h: ROW_H },
      spe: { ...RIGHT_VALUE, y: STAT_ROWS[2]!, h: ROW_H },
    },
    arrows: {
      atk: { ...LEFT_NAME, y: STAT_ROWS[1]!, h: ROW_H },
      def: { ...LEFT_NAME, y: STAT_ROWS[2]!, h: ROW_H },
      spa: { ...RIGHT_NAME, y: STAT_ROWS[0]!, h: ROW_H },
      spd: { ...RIGHT_NAME, y: STAT_ROWS[1]!, h: ROW_H },
      spe: { ...RIGHT_NAME, y: STAT_ROWS[2]!, h: ROW_H },
    },
  },
};
