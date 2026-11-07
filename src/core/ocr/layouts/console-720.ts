import type { LayoutProfile } from '../layout';
import { console1080 } from './console-1080';

// Positions on Nintendo Switch screenshots (the original Switch). These are
// always 1280×720, docked or handheld; see console-1080.ts for the source.
//
// The screen is laid out like the Switch 2 one, so these screenshots are
// scaled up to 1920×1080 and reuse its positions, with three differences:
// - the cards sit 11px higher;
// - the header shows the team's name where the Team ID would be, so there's
//   no Team ID to read;
// - the trainer name is centered in its box, so its rectangle is further
//   left.
const LIFT = 11;

export const console720: LayoutProfile = {
  ...console1080,
  name: 'console-720',
  captures: [{ width: 1280, height: 720 }],
  header: {
    trainerName: { x: 1075, y: 106, w: 400, h: 50 },
  },
  cards: console1080.cards.map((c) => ({ x: c.x, y: c.y - LIFT })),
};
