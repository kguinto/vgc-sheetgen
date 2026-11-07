import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { inspectScreenshot } from '../../src/core/ocr/inspect';
import { saveFieldCrops } from '../../src/node/debug';
import { loadFixture } from '../support/fixtures';

describe('saveFieldCrops', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sheetgen-debug-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true });
  });

  it("saves each field's crop and, for text, its cleaned-up version", async () => {
    const image = await loadFixture('console-720/team-2-stats.jpg');
    const screen = inspectScreenshot(image, 'stats.jpg').screen!;
    const out = path.join(dir, 'stats');

    expect(saveFieldCrops(out, screen)).toEqual({});

    const files = fs.readdirSync(out);

    // Two images per field, except arrows, which only get the first.
    const arrows = screen.fields.filter((f) => f.kind === 'arrow').length;

    expect(files).toHaveLength(screen.fields.length * 2 - arrows);
    expect(files).toContain('slot.0.arrows.spe.png');
    expect(files).not.toContain('slot.0.arrows.spe.preprocessed.png');
    expect(files).toContain('slot.0.species.png');
    expect(files).toContain('slot.0.species.preprocessed.png');
  });

  it("explains a folder that can't be written", async () => {
    const image = await loadFixture('console-720/team-2-stats.jpg');
    const screen = inspectScreenshot(image, 'stats.jpg').screen!;
    // A file where the folder should go.
    const blocked = path.join(dir, 'file');

    fs.writeFileSync(blocked, '');

    expect(saveFieldCrops(path.join(blocked, 'stats'), screen).error).toMatch(
      /can't save field crops/,
    );
  });
});
