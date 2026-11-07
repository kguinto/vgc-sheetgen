import { describe, expect, it } from 'vitest';
import type { RecognizedLine } from '../../src/core/ocr/engine';
import { parseField } from '../../src/core/ocr/parse';

/** A recognized line, each character read with the given confidence. */
function line(text: string, confidence = 95): RecognizedLine {
  return {
    text,
    confidence,
    symbols: [...text]
      .filter((c) => c.trim())
      .map((c) => ({ text: c, confidence })),
  };
}

describe('parseField', () => {
  it('tidies the spaces in names and free text', () => {
    expect(parseField('name', line('  Rock   Slide '))).toEqual({
      value: 'Rock Slide',
      confidence: 95,
    });
    expect(parseField('freeText', line('Louie')).value).toBe('Louie');
  });

  it('has no value for blank text', () => {
    expect(parseField('name', line('   ')).value).toBeNull();
  });

  it('reads stats as numbers of 1 to 3 digits', () => {
    expect(parseField('digits', line('175')).value).toBe(175);
    expect(parseField('digits', line('1 75')).value).toBe(175);
    expect(parseField('digits', line('1750')).value).toBeNull();
    expect(parseField('digits', line('')).value).toBeNull();
  });

  it('reads the Team ID from the end of the line, with O as zero', () => {
    expect(parseField('teamId', line('Team ID: OAOHABQMPR')).value).toBe(
      '0A0HABQMPR',
    );
    expect(parseField('teamId', line('Team ID: 12')).value).toBeNull();
  });

  it("counts only the Team ID's own characters towards its confidence", () => {
    const read: RecognizedLine = {
      text: 'Team ID: 0A0HABQMPR',
      confidence: 50,
      symbols: [
        // The "Team ID:" label, read with low confidence…
        ...[...'TeamID:'].map((c) => ({ text: c, confidence: 20 })),
        // …and the ID itself, read well.
        ...[...'0A0HABQMPR'].map((c) => ({ text: c, confidence: 90 })),
      ],
    };

    expect(parseField('teamId', read).confidence).toBe(90);
  });

  it('is as sure as its least sure character', () => {
    const read: RecognizedLine = {
      text: 'Ice Beam',
      confidence: 90,
      symbols: [...'IceBeam'].map((c, i) => ({
        text: c,
        confidence: i === 3 ? 40 : 99,
      })),
    };

    expect(parseField('name', read).confidence).toBe(40);
  });
});
