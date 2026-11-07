// The player's details at the top of the team list form. None of them come
// from the screenshots; the player types them in, and all are optional.
// They're personal, so they're never stored or logged.

/** The form's age divisions, by year of birth. */
export type AgeDivision = 'juniors' | 'seniors' | 'masters';

export const AGE_DIVISIONS: { value: AgeDivision; label: string }[] = [
  { value: 'juniors', label: 'Juniors' },
  { value: 'seniors', label: 'Seniors' },
  { value: 'masters', label: 'Masters' },
];

/** What the player fills in at the top of the form. Blank where not given. */
export type PlayerDetails = {
  playerName: string;
  /** The Battle Team's number or name in the game, e.g. "Slot 1". */
  battleTeam: string;
  switchProfileName: string;
  ageDivision: AgeDivision | null;
  /** The player's Play! Pokémon ID. */
  playerId: string;
  /** As the form asks for it: month / day / year. */
  birthDate: { month: string; day: string; year: string };
  supportId: string;
};

export const NO_PLAYER_DETAILS: PlayerDetails = {
  playerName: '',
  battleTeam: '',
  switchProfileName: '',
  ageDivision: null,
  playerId: '',
  birthDate: { month: '', day: '', year: '' },
  supportId: '',
};
