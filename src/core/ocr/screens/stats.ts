// The Battle Team's "Stats" tab: each Pokémon's species and its six stat
// numbers. The Moves & More tab (moves.ts) has the same header and grid of
// six cards, so parts of this file mirror that one.

import { STAT_KEYS } from '../../team/types';
import type { Rect } from '../image';
import type { Field, FieldKind } from '../inspect';
import { offsetRect, type LayoutProfile } from '../layout';
import { countTextPixels, isTabSelected } from '../signals';
import type { ScreenDefinition } from '.';

/**
 * A card counts as empty when there are fewer text-colored pixels than
 * this where its HP number would be.
 */
const MIN_SLOT_TEXT_PIXELS = 20;

export const statsScreen: ScreenDefinition = {
  kind: 'stats',
  title: 'Stats',

  isShown: (image, layout) => isTabSelected(image, layout.tabs.stats),

  findFields(image, layout) {
    const rects = layout.statsCard;

    // See which cards have a Pokémon, by looking for text where its HP
    // number would be.
    const filled = layout.cards.flatMap((origin, card) =>
      countTextPixels(image, offsetRect(rects.values.hp, origin)) >=
      MIN_SLOT_TEXT_PIXELS
        ? [card]
        : [],
    );

    // List the header's fields, then each filled card's.
    const fields = [
      ...headerFields(layout),
      // Each Pokémon card's fields. flatMap joins every existing card's list
      // of fields into one list, which the spread then adds after the header's.
      ...filled.flatMap((card) => {
        const origin = layout.cards[card]!;
        const at = (rect: Rect) => offsetRect(rect, origin);
        const key = (name: string) => `slot.${card}.${name}`;

        return [
          field(key('species'), at(rects.species), 'name', true),
          ...STAT_KEYS.map((stat) =>
            field(key(`stats.${stat}`), at(rects.values[stat]), 'digits', true),
          ),
        ];
      }),
    ];

    return fields;
  },
};

/** The Team ID (when the screen shows one) and the trainer name. */
function headerFields(layout: LayoutProfile): Field[] {
  const { teamId, trainerName } = layout.header;

  return [
    ...(teamId ? [field('teamId', teamId, 'teamId', true)] : []),
    field('trainerName', trainerName, 'freeText', true),
  ];
}

function field(
  key: string,
  rect: Rect,
  kind: FieldKind,
  required: boolean,
): Field {
  return { key, rect, kind, required };
}
