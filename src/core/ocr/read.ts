import { ALLOWED_CHARACTERS, type OcrEngine } from './engine';
import type { Rect } from './image';
import type { FieldKind, RecognizedScreen } from './inspect';
import { parseField } from './parse';
import { preprocess } from './preprocess';
import { countTextPixels, readArrow } from './signals';

/**
 * A field counts as blank when it has fewer text-colored pixels than this,
 * e.g. a fourth move slot with no move. Blank fields aren't sent to the
 * recognizer at all.
 */
const MIN_TEXT_PIXELS = 20;

/** What was read for one field. */
export type FieldResult = {
  /** The field's name, e.g. `slot.2.ability`. */
  key: string;
  kind: FieldKind;
  /** Where the field is, on the screen's scaled image. */
  rect: Rect;
  /** The value, or `null` if the field is blank or couldn't be made sense of. */
  value: string | number | null;
  /** Exactly what the recognizer read, before it was made sense of. */
  raw: string;
  /** How sure the recognizer is, 0–100 (100 for a blank field). */
  confidence: number;
};

/**
 * Reads every field on a screen, in order. The only step that runs the text
 * recognizer. Fields are read one at a time, never overlapping (see
 * `OcrEngine`).
 */
export async function readFields(
  screen: RecognizedScreen,
  engine: OcrEngine,
  onProgress?: (done: number, total: number) => void,
): Promise<FieldResult[]> {
  const results: FieldResult[] = [];

  for (const { key, kind, rect } of screen.fields) {
    if (kind === 'arrow') {
      // The nature's arrows are told apart by color, so there's no text to
      // read: the value is 'up', 'down', or null.
      const value = readArrow(screen.image, rect);

      results.push({
        key,
        kind,
        rect,
        value,
        raw: value ?? '',
        confidence: 100,
      });
    } else if (countTextPixels(screen.image, rect) < MIN_TEXT_PIXELS) {
      // A blank field has nothing to read, so don't ask the recognizer.
      results.push({ key, kind, rect, value: null, raw: '', confidence: 100 });
    } else {
      // Clean up the field's crop, read it with only the characters its
      // kind allows, and make sense of what was read.
      const line = await engine.recognizeLine(
        preprocess(screen.image, rect),
        ALLOWED_CHARACTERS[kind],
      );
      const { value, confidence } = parseField(kind, line);

      results.push({ key, kind, rect, value, raw: line.text, confidence });
    }

    onProgress?.(results.length, screen.fields.length);
  }

  return results;
}
