// Things that can be told from pixel colors alone, without reading any
// text: whether a tab is selected, and whether part of the screen has text.

import {
  countPixels,
  pixelAt,
  type Rect,
  type Rgb,
  type RgbaImage,
} from './image';
import type { Point } from './layout';

/** The selected tab is lime green, around (194, 235, 31). */
const isLime = ([r, g, b]: Rgb) => g > 200 && r > 150 && b < 100;

/** The game's text is near-white. */
const isTextPixel = ([r, g, b]: Rgb) => Math.min(r, g, b) > 215;

/** The nature's ⇑ is pink, around (240, 70, 110). */
const isUpArrow = ([r, g, b]: Rgb) => r > 200 && g < 130 && b < 180;

/** The nature's ⇓ is blue, around (40, 170, 230). */
const isDownArrow = ([r, g, b]: Rgb) => b > 200 && g > 140 && r < 110;

/**
 * Enough arrow-colored pixels to be an arrow rather than specks of JPEG
 * noise. Arrows give 49–59 in Switch 2 screenshots and 24–40 in scaled-up
 * Switch ones; places without one give 0 in both fixtures.
 */
const MIN_ARROW_PIXELS = 12;

/** Whether the tab at `point` is the selected one (it's lime green). */
export function isTabSelected(img: RgbaImage, point: Point): boolean {
  return isLime(pixelAt(img, point.x, point.y));
}

/** How many text-colored pixels are in `rect`, e.g. to tell if it's blank. */
export function countTextPixels(img: RgbaImage, rect: Rect): number {
  return countPixels(img, rect, isTextPixel);
}

/**
 * Which of the nature's arrows is in `rect`: `'up'` (⇑), `'down'` (⇓), or
 * `null` for neither. Both at once can't happen in the game, so it also
 * counts as `null`.
 */
export function readArrow(img: RgbaImage, rect: Rect): 'up' | 'down' | null {
  const up = countPixels(img, rect, isUpArrow) >= MIN_ARROW_PIXELS;
  const down = countPixels(img, rect, isDownArrow) >= MIN_ARROW_PIXELS;

  if (up === down) return null;

  return up ? 'up' : 'down';
}
