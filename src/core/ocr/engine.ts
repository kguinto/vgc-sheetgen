import type { GrayImage } from './image';
import type { FieldKind } from './inspect';

/** What the text recognizer read on one line of text. */
export type RecognizedLine = {
  text: string;
  /** How sure it is overall, 0–100. */
  confidence: number;
  /** Each character it read, and how sure it is of that one, 0–100. */
  symbols: { text: string; confidence: number }[];
};

/**
 * Reads one line of text from a cleaned-up crop. It's passed in, rather than
 * created here, because Node and the browser run the text recognizer
 * (Tesseract) differently; see `createNodeEngine` in `src/node/tesseract.ts`.
 *
 * Calls must not overlap: the recognizer sets the allowed characters and
 * then reads, as two steps, so overlapping calls could read with the wrong
 * characters allowed. Await each call before making the next.
 */
export type OcrEngine = {
  /** `whitelist` lists the characters the line may contain; '' means any. */
  recognizeLine(image: GrayImage, whitelist: string): Promise<RecognizedLine>;
};

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';

/**
 * The characters each kind of field may contain. Limiting them stops the
 * recognizer reading, say, a stat's "0" as the letter "O".
 */
export const ALLOWED_CHARACTERS: Record<FieldKind, string> = {
  // In-game names, e.g. "Mr. Mime", "Farfetch'd", "Flabébé", "Porygon-Z".
  name: `${LETTERS}${DIGITS} .'’:é-`,
  // The player chose it, so anything goes.
  freeText: '',
  digits: DIGITS,
  // "Team ID: XXXXXXXXXX"
  teamId: `${LETTERS}${DIGITS} :`,
};
