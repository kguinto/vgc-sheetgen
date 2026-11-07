import type { RecognizedLine } from './engine';
import type { FieldKind } from './inspect';

/** A field's value, turned from recognized text into what it means. */
export type ParsedValue = {
  /** `null` when the text is blank, or isn't the right shape for the field. */
  value: string | number | null;
  /** How sure the recognizer is of the characters that make up the value. */
  confidence: number;
};

/** A Team ID is 10 letters and digits, at the end of "Team ID: …". */
const TEAM_ID = /[0-9A-Z]{10}$/;

/** Turns what the recognizer read into the field's value, by field kind. */
export function parseField(kind: FieldKind, line: RecognizedLine): ParsedValue {
  const confidence = lowestConfidence(line.symbols, line.confidence);

  switch (kind) {
    case 'name':

    case 'freeText': {
      const text = line.text.replace(/\s+/g, ' ').trim();

      return { value: text || null, confidence };
    }

    case 'digits': {
      const text = line.text.replace(/\s+/g, '');

      // A stat is 1–3 digits; anything else isn't a stat.
      return {
        value: /^\d{1,3}$/.test(text) ? Number(text) : null,
        confidence,
      };
    }

    case 'teamId': {
      const match = TEAM_ID.exec(line.text.replace(/\s+/g, ''));

      if (!match) return { value: null, confidence };

      // Only the ID's own characters count towards confidence, not the
      // "Team ID:" label in front of it.
      const idSymbols = line.symbols.filter((s) => s.text.trim()).slice(-10);

      return {
        // The game draws zero as a narrow oval that reads as the letter O.
        // This assumes Team IDs never contain the letter O.
        value: match[0].replaceAll('O', '0'),
        confidence: lowestConfidence(idSymbols, line.confidence),
      };
    }
  }
}

/**
 * The least sure character, since one misread character makes the whole
 * value wrong. Falls back to the line's confidence when there are none.
 */
function lowestConfidence(
  symbols: { confidence: number }[],
  fallback: number,
): number {
  return symbols.length
    ? Math.min(...symbols.map((s) => s.confidence))
    : fallback;
}
