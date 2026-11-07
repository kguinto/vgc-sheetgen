import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { decodeImage, encodeGrayPng, encodePng } from '../../src/node/image';

const FIXTURES = path.join(import.meta.dirname, '../fixtures');
const JPEG = path.join(FIXTURES, 'console-720/team-2-moves.jpg');

describe('decodeImage', () => {
  // The same screenshot in both formats. The PNG is a conversion of the JPEG
  // and stores RGB without alpha, so decoding has to add the alpha byte.
  it.each(['team-2-moves.jpg', 'team-2-moves.png'])(
    'decodes %s',
    async (name) => {
      const { image } = await decodeImage(
        fs.readFileSync(path.join(FIXTURES, 'console-720', name)),
      );

      expect(image).toMatchObject({ width: 1280, height: 720 });
      expect(image?.data).toHaveLength(1280 * 720 * 4);
    },
  );

  it('reports other formats', async () => {
    const { problem } = await decodeImage(new TextEncoder().encode('GIF89a'));

    expect(problem).toEqual({
      code: 'unreadable-image',
      message: 'Not a PNG or JPEG image.',
    });
  });

  it('reports a damaged image', async () => {
    const truncated = fs.readFileSync(JPEG).subarray(0, 1000);

    expect((await decodeImage(truncated)).problem?.code).toBe(
      'unreadable-image',
    );
  });
});

describe('encodePng and encodeGrayPng', () => {
  it('write PNGs that decode back to the same pixels', async () => {
    const color = {
      width: 2,
      height: 1,
      data: new Uint8Array([9, 8, 7, 255, 1, 2, 3, 255]),
    };
    const gray = { width: 2, height: 1, data: new Uint8Array([0, 255]) };

    expect((await decodeImage(encodePng(color))).image).toEqual({
      ...color,
      data: Buffer.from(color.data),
    });
    expect([...(await decodeImage(encodeGrayPng(gray))).image!.data]).toEqual([
      0, 0, 0, 255, 255, 255, 255, 255,
    ]);
  });
});
