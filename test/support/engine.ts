import type { OcrEngine, RecognizedLine } from '../../src/core/ocr/engine';
import type { GrayImage } from '../../src/core/ocr/image';

/** A stand-in text recognizer that records how it was called. */
export type FakeEngine = OcrEngine & {
  /** Every call, in order. */
  calls: { image: GrayImage; whitelist: string }[];
  /** The most calls that were ever in progress at the same time. */
  mostAtOnce: number;
};

/**
 * A fake text recognizer for tests. It "reads" whatever `read` returns (by
 * default nothing), with full confidence, after a short pause, so tests can
 * tell whether calls overlap.
 */
export function fakeEngine(
  read: (whitelist: string) => string = () => '',
): FakeEngine {
  let inProgress = 0;

  const engine: FakeEngine = {
    calls: [],
    mostAtOnce: 0,

    async recognizeLine(image, whitelist): Promise<RecognizedLine> {
      engine.calls.push({ image, whitelist });
      inProgress++;
      engine.mostAtOnce = Math.max(engine.mostAtOnce, inProgress);

      await new Promise((resolve) => setTimeout(resolve, 1));
      inProgress--;

      const text = read(whitelist);

      return {
        text,
        confidence: 100,
        symbols: [...text]
          .filter((c) => c.trim())
          .map((c) => ({ text: c, confidence: 100 })),
      };
    },
  };

  return engine;
}
