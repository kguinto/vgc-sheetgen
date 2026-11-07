import type { ScreenshotProblem } from '../screenshot-problems';
import { resizeRgba, type Rect, type RgbaImage } from './image';
import { selectLayout } from './layout';
import { LAYOUTS } from './layouts';
import {
  detectScreen,
  UNKNOWN_SCREEN_MESSAGE,
  type ScreenKind,
} from './screens';

/** What a field holds, which decides how its text is read. */
export type FieldKind =
  /** A name from the game: a species, ability, item, or move. */
  | 'name'
  /** Text the player chose, such as their trainer name. */
  | 'freeText'
  /** A stat's number. */
  | 'digits'
  /** The "Team ID: XXXXXXXXXX" line at the top. */
  | 'teamId'
  /**
   * Whether a stat has the nature's ⇑ or ⇓ next to it. Read by its color,
   * not by the text recognizer.
   */
  | 'arrow';

/** A piece of text to read: where it is on the screen, and what it holds. */
export type Field = {
  /**
   * Names the field, e.g. `trainerName`, or `slot.2.moves.1` for the third
   * card's second move. Each screen's file decides its fields' names.
   */
  key: string;
  /** In pixels, on the screen's scaled image. */
  rect: Rect;
  kind: FieldKind;
  /** A required field that turns out blank is flagged for the user to check. */
  required: boolean;
};

/** A screenshot recognized as one of the supported screens. */
export type RecognizedScreen = {
  kind: ScreenKind;
  /** The screenshot's name as the user gave it, e.g. its file name. */
  name: string;
  /** Which console's screen layout it matched, e.g. `console-720`. */
  layout: string;
  /** How much it was scaled to match, e.g. 1.5 for a Switch screenshot. */
  scale: number;
  /** The screenshot, scaled to the layout's size, which fields refer to. */
  image: RgbaImage;
  /** Every field to read on it, in order. */
  fields: Field[];
};

/** A recognized screen, or the reason the screenshot isn't one. */
export type InspectResult =
  | { screen: RecognizedScreen; problem?: undefined }
  | { screen?: undefined; problem: ScreenshotProblem };

/**
 * Works out what a screenshot shows and where every piece of text on it is,
 * without reading any of the text yet: which console it's from, which
 * screen it shows, and the position of each field to read. `name` (e.g. the
 * file name) is kept on the screen, so the caller can tell which screenshot
 * it came from.
 */
export function inspectScreenshot(
  image: RgbaImage,
  name: string,
): InspectResult {
  // Step 1: Find the console's screen layout from the screenshot's size, and
  // scale the screenshot to the size that layout was measured at.
  const { layout, problem } = selectLayout(image, LAYOUTS);

  if (problem) return { problem };

  const scaled = resizeRgba(image, layout.width, layout.height);

  // Step 2: Work out which screen it shows.
  const definition = detectScreen(scaled, layout);

  if (!definition) {
    return {
      problem: { code: 'unknown-screen', message: UNKNOWN_SCREEN_MESSAGE },
    };
  }

  // Step 3: Let that screen find the fields to read on it.
  return {
    screen: {
      kind: definition.kind,
      name,
      layout: layout.name,
      scale: layout.width / image.width,
      image: scaled,
      fields: definition.findFields(scaled, layout),
    },
  };
}
