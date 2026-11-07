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

/** Whether the tab at `point` is the selected one (it's lime green). */
export function isTabSelected(img: RgbaImage, point: Point): boolean {
  return isLime(pixelAt(img, point.x, point.y));
}

/** How many text-colored pixels are in `rect`, e.g. to tell if it's blank. */
export function countTextPixels(img: RgbaImage, rect: Rect): number {
  return countPixels(img, rect, isTextPixel);
}
