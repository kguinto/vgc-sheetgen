// Things that can be told from pixel colors alone, without reading any
// text: which tab is selected, and whether part of the screen has text.

import {
  countPixels,
  pixelAt,
  type Rect,
  type Rgb,
  type RgbaImage,
} from './image';
import type { LayoutProfile } from './layout';

/** Which tab of the Battle Team screen a screenshot shows. */
export type ScreenKind = 'moves' | 'stats';

/** The tabs' names as the game shows them, for messages and output. */
export const SCREEN_NAMES: Record<ScreenKind, string> = {
  moves: 'Moves & More',
  stats: 'Stats',
};

/** The selected tab is lime green, around (194, 235, 31). */
const isLime = ([r, g, b]: Rgb) => g > 200 && r > 150 && b < 100;

/** The game's text is near-white. */
const isTextPixel = ([r, g, b]: Rgb) => Math.min(r, g, b) > 215;

/**
 * Which tab is selected, or `null` if neither is (so it isn't a Battle Team
 * screen). Checks the color of one point inside each tab.
 */
export function detectScreen(
  img: RgbaImage,
  layout: LayoutProfile,
): ScreenKind | null {
  const { moves, stats } = layout.tabs;
  const movesSelected = isLime(pixelAt(img, moves.x, moves.y));
  const statsSelected = isLime(pixelAt(img, stats.x, stats.y));

  if (movesSelected === statsSelected) return null;

  return movesSelected ? 'moves' : 'stats';
}

/** How many text-colored pixels are in `rect`, e.g. to tell if it's blank. */
export function countTextPixels(img: RgbaImage, rect: Rect): number {
  return countPixels(img, rect, isTextPixel);
}
