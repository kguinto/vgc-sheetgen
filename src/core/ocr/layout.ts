import type { ScreenshotProblem } from '../screenshot-problems';
import type { AlignableStatKey, StatKey } from '../team/types';
import type { Rect } from './image';

/** A position in pixels. */
export type Point = { x: number; y: number };

/**
 * Where everything sits on the Battle Team screens in one console's
 * screenshots: the header, the two tabs, and each field on the six Pokémon
 * cards.
 *
 * Positions are in pixels on a screenshot scaled to `width` × `height`.
 * Positions on a card are measured from that card's top-left corner, so each
 * card's layout is written once and shifted into place for all six.
 */
export type LayoutProfile = {
  /** A short name for messages and debugging, e.g. `console-1080`. */
  name: string;
  /** The size the positions were measured at. Screenshots are scaled to it. */
  width: number;
  height: number;
  /**
   * The screenshot sizes this layout is for, e.g. 1280×720 for a Switch.
   * Screenshots of other sizes fall back to the first layout with the same
   * shape (see `selectLayout`).
   */
  captures: { width: number; height: number }[];
  /**
   * The Team ID and trainer name at the top. Switch screenshots show the
   * team's name where the Team ID would be, so they have no `teamId`.
   */
  header: { teamId?: Rect; trainerName: Rect };
  /**
   * A point inside each of the two tabs. The selected tab is lime green,
   * which is how the screen is told apart from the other one.
   */
  tabs: { moves: Point; stats: Point };
  /**
   * The top-left corner of each of the six Pokémon cards: left to right,
   * then top to bottom.
   */
  cards: Point[];
  /** Where each field is on a card on the Moves & More tab. */
  movesCard: {
    species: Rect;
    ability: Rect;
    item: Rect;
    moves: [Rect, Rect, Rect, Rect];
  };
  /** Where each field is on a card on the Stats tab. */
  statsCard: {
    /** In the same place as on the Moves & More tab. */
    species: Rect;
    /** The number shown for each stat. */
    values: Record<StatKey, Rect>;
    /**
     * Where the nature's ⇑ or ⇓ can appear: just after each stat's name.
     * HP can't be raised or lowered by a nature, so it has none.
     */
    arrows: Record<AlignableStatKey, Rect>;
  };
};

/** Shifts a rectangle by `origin`, e.g. from a card's corner to the screen. */
export function offsetRect(rect: Rect, origin: Point): Rect {
  return { ...rect, x: rect.x + origin.x, y: rect.y + origin.y };
}

/** The layout for a screenshot, or the reason none fits. */
export type LayoutResult =
  | { layout: LayoutProfile; problem?: undefined }
  | { layout?: undefined; problem: ScreenshotProblem };

/**
 * Picks the layout for a screenshot of this size. A layout that lists the
 * exact size wins; otherwise the first layout with the same shape (16:9,
 * within 1%) is used, e.g. for a 2560×1440 capture-card recording.
 *
 * The exact match has to come first: a 1280×720 Switch screenshot is also
 * 16:9, and would otherwise get the Switch 2 positions.
 */
export function selectLayout(
  size: { width: number; height: number },
  layouts: LayoutProfile[],
): LayoutResult {
  const aspect = size.width / size.height;
  const layout =
    layouts.find((l) =>
      l.captures.some(
        (c) => c.width === size.width && c.height === size.height,
      ),
    ) ??
    layouts.find((l) => Math.abs(l.width / l.height - aspect) / aspect < 0.01);

  if (layout) return { layout };

  return {
    problem: {
      code: 'unsupported-size',
      message: `Screenshots must be 16:9, like 1920×1080 or 1280×720. This one is ${size.width}×${size.height}.`,
    },
  };
}
