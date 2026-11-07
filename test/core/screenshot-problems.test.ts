import { describe, expect, it } from 'vitest';
import { formatScreenshotProblem } from '../../src/core/ocr/screenshot-problems';

describe('formatScreenshotProblem', () => {
  it('names the input when there is one', () => {
    const problem = {
      code: 'unreadable-image',
      message: 'Not a PNG or JPEG image.',
    } as const;

    expect(formatScreenshotProblem(problem)).toBe('Not a PNG or JPEG image.');
    expect(formatScreenshotProblem({ ...problem, input: 'a.png' })).toBe(
      'a.png: Not a PNG or JPEG image.',
    );
  });
});
