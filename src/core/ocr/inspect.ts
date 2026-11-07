import type { ScreenshotProblem } from '../screenshot-problems';
import { STAT_KEYS, type StatKey } from '../team/types';
import { unreachable } from '../unreachable';
import { resizeRgba, type Rect, type RgbaImage } from './image';
import { offsetRect, selectLayout, type LayoutProfile } from './layout';
import { LAYOUTS } from './layouts';
import {
  countTextPixels,
  detectScreen,
  SCREEN_NAMES,
  type ScreenKind,
} from './signals';

/**
 * A card counts as empty when its probe area (the species name on the
 * Moves & More tab, the HP number on the Stats tab) has fewer text-colored
 * pixels than this.
 */
const MIN_SLOT_TEXT_PIXELS = 20;

/** A card's position on the screen: 0–5, left to right, then top to bottom. */
export type Slot = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Names a field, e.g. `trainerName`, or `slot.2.moves.1` for the third
 * card's second move.
 */
export type FieldKey =
  | 'teamId'
  | 'trainerName'
  | `slot.${Slot}.${'species' | 'ability' | 'item'}`
  | `slot.${Slot}.moves.${0 | 1 | 2 | 3}`
  | `slot.${Slot}.stats.${StatKey}`;

/** What a field holds, which decides how its text is read. */
export type FieldKind =
  /** A name from the game: a species, ability, item, or move. */
  | 'name'
  /** Text the player chose, such as their trainer name. */
  | 'freeText'
  /** A stat's number. */
  | 'digits'
  /** The "Team ID: XXXXXXXXXX" line at the top. */
  | 'teamId';

/** A piece of text to read: where it is on the screen, and what it holds. */
export type Field = {
  key: FieldKey;
  /** In pixels, on the screen's scaled image. */
  rect: Rect;
  kind: FieldKind;
  /** A required field that turns out blank is flagged for the user to check. */
  required: boolean;
};

/** Whether a card position has a Pokémon in it. */
export type SlotPresence = {
  slot: Slot;
  present: boolean;
  /** How many text-colored pixels were found where its name or HP would be. */
  textPixels: number;
};

/** Which console's screen layout a screenshot matched. */
export type ScreenLayout = {
  /** E.g. `console-1080`. */
  name: string;
  /** How much the screenshot was scaled to match it, e.g. 1.5 for a Switch. */
  scale: number;
};

/** What every recognized Battle Team screenshot has, whichever tab it shows. */
interface BattleTeamScreenBase {
  /** The screenshot's name as the user gave it, e.g. its file name. */
  name: string;
  layout: ScreenLayout;
  /** The screenshot, scaled to the layout's size, which fields refer to. */
  image: RgbaImage;
  slots: SlotPresence[];
  /** Every field to read: the header first, then each Pokémon's card. */
  fields: Field[];
}

/** A screenshot of a Battle Team's "Moves & More" tab. */
export interface MovesScreen extends BattleTeamScreenBase {
  kind: 'moves';
}

/** A screenshot of a Battle Team's "Stats" tab. */
export interface StatsScreen extends BattleTeamScreenBase {
  kind: 'stats';
}

/** A screenshot recognized as one of the two Battle Team tabs. */
export type BattleTeamScreen = MovesScreen | StatsScreen;

/** A recognized screen, or the reason the screenshot isn't one. */
export type InspectResult =
  | { screen: BattleTeamScreen; problem?: undefined }
  | { screen?: undefined; problem: ScreenshotProblem };

/**
 * Works out what a screenshot shows and where every piece of text on it is,
 * without reading any of the text yet: which console it's from, which tab
 * is selected, which of the six cards have a Pokémon, and the position of
 * each field to read. `name` (e.g. the file name) is kept on the screen, so
 * the caller can tell which screenshot it came from.
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

  // Step 2: Check which tab is selected.
  const kind = detectScreen(scaled, layout);

  if (!kind) {
    return {
      problem: {
        code: 'unknown-screen',
        message:
          "This isn't a Battle Team screenshot: neither the Moves & More nor the Stats tab is selected.",
      },
    };
  }

  // Step 3: Find what there is to read on this kind of screen. Battle Team
  // tabs have the same header and six Pokémon cards; other kinds of screen
  // would get their own branch here.
  const { slots, fields } = findBattleTeamFields(kind, layout, scaled);

  return {
    screen: {
      kind,
      name,
      layout: { name: layout.name, scale: layout.width / image.width },
      image: scaled,
      slots,
      fields,
    },
  };
}

/**
 * The fields to read on a Battle Team tab: which of the six cards have a
 * Pokémon, and every field to read, the header first and then each filled
 * card in order.
 */
function findBattleTeamFields(
  kind: ScreenKind,
  layout: LayoutProfile,
  image: RgbaImage,
): { slots: SlotPresence[]; fields: Field[] } {
  // See which cards have a Pokémon, by looking for text where its name
  // (Moves & More) or HP (Stats) would be.
  const probe = slotProbe(kind, layout);

  const slots = layout.cards.map((origin, i): SlotPresence => {
    const textPixels = countTextPixels(image, offsetRect(probe, origin));

    return {
      slot: i as Slot,
      present: textPixels >= MIN_SLOT_TEXT_PIXELS,
      textPixels,
    };
  });

  // List the header's fields, then each filled card's.
  const fields = [
    ...headerFields(layout),
    ...slots
      .filter((s) => s.present)
      .flatMap((s) => cardFields(kind, layout, s.slot)),
  ];

  return { slots, fields };
}

/**
 * Where on a card to look for text to tell whether it has a Pokémon: the
 * species name on the Moves & More tab, the HP number on the Stats tab.
 */
function slotProbe(kind: ScreenKind, layout: LayoutProfile): Rect {
  switch (kind) {
    case 'moves':
      return layout.movesCard.species;
    case 'stats':
      return layout.statsCard.values.hp;
    default:
      return unreachable(kind);
  }
}

/** The Team ID (when the screen shows one) and the trainer name. */
function headerFields(layout: LayoutProfile): Field[] {
  const { teamId, trainerName } = layout.header;

  return [
    ...(teamId ? [field('teamId', teamId, 'teamId', true)] : []),
    field('trainerName', trainerName, 'freeText', true),
  ];
}

/** The fields on one Pokémon's card, positioned on the screen. */
function cardFields(
  kind: ScreenKind,
  layout: LayoutProfile,
  slot: Slot,
): Field[] {
  const origin = layout.cards[slot]!;
  const at = (rect: Rect) => offsetRect(rect, origin);
  const key = (name: string) => `slot.${slot}.${name}` as FieldKey;

  switch (kind) {
    case 'moves': {
      const card = layout.movesCard;

      // A Pokémon can have no held item and fewer than four moves, so those
      // may be blank.
      return [
        field(key('species'), at(card.species), 'name', true),
        field(key('ability'), at(card.ability), 'name', true),
        field(key('item'), at(card.item), 'name', false),
        ...card.moves.map((rect, i) =>
          field(key(`moves.${i}`), at(rect), 'name', false),
        ),
      ];
    }

    case 'stats': {
      const card = layout.statsCard;

      return [
        field(key('species'), at(card.species), 'name', true),
        ...STAT_KEYS.map((stat) =>
          field(key(`stats.${stat}`), at(card.values[stat]), 'digits', true),
        ),
      ];
    }

    default:
      return unreachable(kind);
  }
}

function field(
  key: FieldKey,
  rect: Rect,
  kind: FieldKind,
  required: boolean,
): Field {
  return { key, rect, kind, required };
}

/** The Moves & More and Stats screens. Either is absent if it wasn't found. */
export type ScreenPair = {
  moves?: MovesScreen;
  stats?: StatsScreen;
};

export type ScreenPairResult = {
  pair: ScreenPair;
  /** `same-screen` or `missing-screen`. Empty when there's one of each. */
  problems: ScreenshotProblem[];
};

export type ScreenPairOptions = {
  /**
   * How many screenshots couldn't be used at all (e.g. not an image). Any of
   * them may have been the missing tab, and their own problems already say
   * what's wrong, so a missing tab isn't reported on top of them.
   */
  unusable?: number;
};

/**
 * Picks out the Moves & More screen and the Stats screen from screens given
 * in any order. Reports two screenshots of the same tab, or a tab with none.
 *
 * A missing tab is only reported when nothing else is wrong: with an
 * unusable screenshot (see `unusable`), or two of the other tab, the other
 * problem already explains it.
 */
export function getScreenPair(
  screens: BattleTeamScreen[],
  options: ScreenPairOptions = {},
): ScreenPairResult {
  const moves = screens.filter((s): s is MovesScreen => s.kind === 'moves');
  const stats = screens.filter((s): s is StatsScreen => s.kind === 'stats');

  const pair: ScreenPair = {};
  const problems: ScreenshotProblem[] = [];
  const missing: ScreenshotProblem[] = [];

  for (const [kind, matching] of [
    ['moves', moves],
    ['stats', stats],
  ] as const) {
    const tab = SCREEN_NAMES[kind];

    if (matching.length === 0) {
      missing.push({
        code: 'missing-screen',
        message: `There's no screenshot of the ${tab} tab. Add one.`,
      });
    } else if (matching.length > 1) {
      problems.push({
        code: 'same-screen',
        message: `${count(matching.length)} screenshots show the ${tab} tab. Use one of Moves & More and one of Stats.`,
      });
    }
  }

  if (moves.length === 1) pair.moves = moves[0];

  if (stats.length === 1) pair.stats = stats[0];

  if (problems.length === 0 && !options.unusable) problems.push(...missing);

  return { pair, problems };
}

/** "Two", "Three", or the number itself, to start a sentence. */
function count(n: number): string {
  return ['Two', 'Three', 'Four'][n - 2] ?? String(n);
}
