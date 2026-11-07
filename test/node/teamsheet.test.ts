import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { loadTemplate } from '../../src/node/teamsheet';

describe('loadTemplate', () => {
  it('loads the two-page team list form', async () => {
    const doc = await PDFDocument.load(loadTemplate());

    expect(doc.getPageCount()).toBe(2);
  });
});
