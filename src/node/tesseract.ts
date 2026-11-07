import { createRequire } from 'node:module';
import path from 'node:path';
import { PNG } from 'pngjs';
import { createWorker, OEM, PSM } from 'tesseract.js';
import type { OcrEngine, RecognizedLine } from '../core/ocr/engine';
import type { GrayImage } from '../core/ocr/image';

const require = createRequire(import.meta.url);

/** A text recognizer for Node, which must be shut down when done. */
export type NodeEngine = OcrEngine & {
  /** Stops the recognizer. Until this is called, Node won't exit. */
  terminate(): Promise<void>;
};

/**
 * Starts Tesseract (its LSTM recognizer, with the "best_int" English model)
 * in a Node worker thread. The language data comes from the
 * `@tesseract.js-data/eng` package, so nothing is downloaded. Starting it
 * takes about a second, so create one and use it for every field.
 */
export async function createNodeEngine(): Promise<NodeEngine> {
  const langPath = path.join(
    path.dirname(require.resolve('@tesseract.js-data/eng/package.json')),
    '4.0.0_best_int',
  );
  const worker = await createWorker('eng', OEM.LSTM_ONLY, {
    langPath,
    gzip: true,
    cacheMethod: 'none',
  });

  // Each crop holds one line of text.
  await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_LINE });

  // Changing settings has a cost, so only do it when the whitelist changes.
  let currentWhitelist: string | undefined;

  return {
    async recognizeLine(image, whitelist): Promise<RecognizedLine> {
      if (whitelist !== currentWhitelist) {
        await worker.setParameters({ tessedit_char_whitelist: whitelist });
        currentWhitelist = whitelist;
      }

      const { data } = await worker.recognize(
        encodeGrayPng(image),
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

    terminate: async () => {
      await worker.terminate();
    },
  };
}

/** Tesseract takes image files, so a grayscale crop is encoded as a PNG. */
function encodeGrayPng(image: GrayImage): Buffer {
  const png = new PNG({ width: image.width, height: image.height });

  image.data.forEach((value, i) =>
    png.data.set([value, value, value, 255], i * 4),
  );

  return PNG.sync.write(png);
}
