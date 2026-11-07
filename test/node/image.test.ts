import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { decodeImage } from '../../src/node/image';

const FIXTURES = path.join(import.meta.dirname, '../fixtures');

describe('decodeImage', () => {
  // The same screenshot in both formats. The PNG is a conversion of the JPEG
  // and stores RGB without alpha, so decoding has to add the alpha byte.
  it.each(['team-2-moves.jpg', 'team-2-moves.png'])('decodes %s', (name) => {
    const img = decodeImage(
      fs.readFileSync(path.join(FIXTURES, 'console-720', name)),
    );
    expect(img).toMatchObject({ width: 1280, height: 720 });
    expect(img.data).toHaveLength(1280 * 720 * 4);
  });

  it('rejects other formats', () => {
    expect(() => decodeImage(new TextEncoder().encode('GIF89a'))).toThrow(
      'Unsupported image format',
    );
  });
});
