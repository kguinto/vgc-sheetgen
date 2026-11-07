import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { decodeImage } from '../../src/node/image';

const FIXTURES = path.join(import.meta.dirname, '../fixtures');
const JPEG = path.join(FIXTURES, 'console-720/team-2-moves.jpg');

describe('decodeImage', () => {
  // The same screenshot in both formats. The PNG is a conversion of the JPEG
  // and stores RGB without alpha, so decoding has to add the alpha byte.
  it.each(['team-2-moves.jpg', 'team-2-moves.png'])('decodes %s', (name) => {
    const { image } = decodeImage(
      fs.readFileSync(path.join(FIXTURES, 'console-720', name)),
    );
    expect(image).toMatchObject({ width: 1280, height: 720 });
    expect(image?.data).toHaveLength(1280 * 720 * 4);
  });

  it('reports other formats', () => {
    const { problem } = decodeImage(new TextEncoder().encode('GIF89a'));
    expect(problem).toEqual({
      code: 'unreadable-image',
      message: 'Not a PNG or JPEG image.',
    });
  });

  it('reports a damaged image', () => {
    const truncated = fs.readFileSync(JPEG).subarray(0, 1000);
    expect(decodeImage(truncated).problem?.code).toBe('unreadable-image');
  });
});
