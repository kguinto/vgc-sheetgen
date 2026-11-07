// What the Node and browser text recognizers have in common: both run
// Tesseract (through tesseract.js) the same way, and differ only in how
// it's started and how a crop is handed to it.

import type { OcrEngine, RecognizedLine } from './engine';
import type { GrayImage } from './image';

/**
 * Tesseract's page segmentation mode for "the image is one line of text",
 * which every crop is. (tesseract.js calls it `PSM.SINGLE_LINE`.)
 */
const SINGLE_LINE = '7';

/** One character Tesseract read, and how sure it is of it, 0–100. */
type TesseractSymbol = { text: string; confidence: number };

/**
 * The parts of a started tesseract.js worker that are used here. Both
 * tesseract.js's Node and browser workers have them; describing just these
 * keeps tesseract.js itself out of `src/core`.
 */
export type TesseractWorker<Input> = {
  setParameters(params: Record<string, string>): Promise<unknown>;
  recognize(
    image: Input,
    options: object,
    output: { text: true; blocks: true },
  ): Promise<{
    data: {
      text: string;
      confidence: number;
      blocks:
        | {
            paragraphs: {
              lines: { words: { symbols: TesseractSymbol[] }[] }[];
            }[];
          }[]
        | null;
    };
  }>;
};

/**
 * Turns a started tesseract.js worker into the text recognizer the reading
 * steps use. `toInput` turns a cleaned-up crop into something tesseract.js
 * takes, e.g. a PNG file in Node.
 */
export async function tesseractEngine<Input>(
  worker: TesseractWorker<Input>,
  toInput: (image: GrayImage) => Input | Promise<Input>,
): Promise<OcrEngine> {
  // Each crop holds one line of text.
  await worker.setParameters({ tessedit_pageseg_mode: SINGLE_LINE });

  // Changing settings has a cost, so only do it when the allowed characters
  // change.
  let currentWhitelist: string | undefined;

  return {
    async recognizeLine(image, whitelist): Promise<RecognizedLine> {
      if (whitelist !== currentWhitelist) {
        await worker.setParameters({ tessedit_char_whitelist: whitelist });
        currentWhitelist = whitelist;
      }

      const { data } = await worker.recognize(
        await toInput(image),
        {},
        { text: true, blocks: true },
      );

      // Every character read, with how sure Tesseract is of each.
      const symbols = (data.blocks ?? []).flatMap((block) =>
        block.paragraphs.flatMap((paragraph) =>
          paragraph.lines.flatMap((line) =>
            line.words.flatMap((word) =>
              word.symbols.map((s) => ({
                text: s.text,
                confidence: s.confidence,
              })),
            ),
          ),
        ),
      );

      return { text: data.text.trim(), confidence: data.confidence, symbols };
    },
  };
}
