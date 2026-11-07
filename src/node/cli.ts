// Command-line helpers for the sheetgen script: reading its arguments and
// the screenshot files it's given. They return problems as messages rather
// than exiting, so the script decides when to stop.

import fs from 'node:fs';
import { parseArgs } from 'node:util';
import type { ScreenshotInput } from '../core/ocr/pipeline';

export type Arguments = {
  /** Whether --debug was given. */
  debug: boolean;
  /** The --log file, if one was given. */
  logPath?: string;
  /** The --debug-dir folder, if one was given. */
  debugDir?: string;
  /** The screenshot paths, in the order given. */
  paths: string[];
  /** Node's message if the command line couldn't be read, e.g. an unknown flag. */
  error?: string;
};

/**
 * Reads the script's command line (without the leading `node` and script
 * path). On a malformed command line, `error` says what's wrong and the
 * rest are empty.
 */
export function parseArguments(argv: string[]): Arguments {
  try {
    const { values, positionals } = parseArgs({
      args: argv,
      options: {
        debug: { type: 'boolean', default: false },
        log: { type: 'string' },
        'debug-dir': { type: 'string' },
      },
      allowPositionals: true,
    });

    return {
      debug: values.debug,
      logPath: values.log,
      debugDir: values['debug-dir'],
      paths: positionals,
    };
  } catch (err) {
    return {
      debug: false,
      paths: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export type ReadFilesResult = {
  /** The files that could be read, named by their paths, in order. */
  files: ScreenshotInput[];
  /** One line for each file that couldn't, e.g. "nope.png: no such file". */
  errors: string[];
};

/** Reads each file into memory, reporting every one that can't be read. */
export function readFiles(paths: string[]): ReadFilesResult {
  const files: ScreenshotInput[] = [];
  const errors: string[] = [];

  for (const path of paths) {
    try {
      files.push({ name: path, bytes: fs.readFileSync(path) });
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;

      errors.push(
        `${path}: ${code === 'ENOENT' ? 'no such file' : `can't read (${code ?? err})`}`,
      );
    }
  }

  return { files, errors };
}
