// The Battle Team's "Moves & More" tab: each Pokémon's species, ability,
// held item, and moves. The Stats tab (stats.ts) has the same header and
// grid of six cards, so parts of this file mirror that one.

import type { Rect } from '../image';
import type { Field, FieldKind } from '../inspect';
import { offsetRect, type LayoutProfile } from '../layout';
import { countTextPixels, isTabSelected } from '../signals';
import type { ScreenDefinition } from '.';

/**
 * A card counts as empty when there are fewer text-colored pixels than
 * this where its species name would be.
 */
const MIN_SLOT_TEXT_PIXELS = 20;

export const movesScreen: ScreenDefinition = {
  kind: 'moves',
  title: 'Moves & More',

  isShown: (image, layout) => isTabSelected(image, layout.tabs.moves),

  findFields(image, layout) {
    const rects = layout.movesCard;

    // See which cards have a Pokémon, by looking for text where its species
    // name would be.
    const filled = layout.cards.flatMap((origin, card) =>
      countTextPixels(image, offsetRect(rects.species, origin)) >=
      MIN_SLOT_TEXT_PIXELS
        ? [card]
        : [],
    );

    // List the header's fields, then each filled card's. A Pokémon can have
    // no held item and fewer than four moves, so those may be blank.
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
          field(key('ability'), at(rects.ability), 'name', true),
          field(key('item'), at(rects.item), 'name', false),
          ...rects.moves.map((rect, i) =>
            field(key(`moves.${i}`), at(rect), 'name', false),
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
