// Loads the blank team list form that ships with the repo.

import fs from 'node:fs';
import path from 'node:path';

/** The official Play! Pokémon team list form, in `src/assets`. */
export const TEMPLATE_PATH = path.join(
  import.meta.dirname,
  '../assets/play-pokemon-vg-team-list.pdf',
);

/** The blank form as a PDF file's bytes, ready for `renderTeamSheet`. */
export function loadTemplate(): Uint8Array {
  return new Uint8Array(fs.readFileSync(TEMPLATE_PATH));
}
