import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseArguments, readFiles } from '../../src/node/cli';

const JPEG = path.join(
  import.meta.dirname,
  '../fixtures/console-720/team-2-moves.jpg',
);

describe('parseArguments', () => {
  it('reads the flags and screenshot paths', () => {
    expect(
      parseArguments(['--debug', '--log', 'run.log', 'a.png', 'b.png']),
    ).toEqual({
      debug: true,
      logPath: 'run.log',
      paths: ['a.png', 'b.png'],
    });
  });

  it('defaults to no debugging and no log', () => {
    expect(parseArguments(['a.png'])).toEqual({
      debug: false,
      logPath: undefined,
      paths: ['a.png'],
    });
  });

  it('explains a malformed command line', () => {
    expect(parseArguments(['--bogus']).error).toMatch(
      /Unknown option '--bogus'/,
    );
    expect(parseArguments(['--log']).error).toMatch(/argument missing/);
  });
});

describe('readFiles', () => {
  it('reads files, named by their paths', () => {
    expect(readFiles([JPEG])).toEqual({
      files: [{ name: JPEG, bytes: fs.readFileSync(JPEG) }],
      errors: [],
    });
  });

  it("reports every file that can't be read, keeping the rest", () => {
    const dir = import.meta.dirname;
    const { files, errors } = readFiles(['nope.png', JPEG, dir]);

    expect(files.map((f) => f.name)).toEqual([JPEG]);
    expect(errors).toEqual([
      'nope.png: no such file',
      `${dir}: can't read (EISDIR)`,
    ]);
  });
});
