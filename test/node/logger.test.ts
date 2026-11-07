import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLogger, type LoggerOptions } from '../../src/node/logger';

describe('createLogger', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sheetgen-logger-'));
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(dir, { recursive: true });
  });

  /** A logger that must open, for tests that aren't about failing to. */
  function open(options?: LoggerOptions) {
    const { logger, error } = createLogger(options);

    if (error) throw new Error(error);

    return logger;
  }

  it('prints info to stdout and errors to stderr', () => {
    const logger = open();

    logger.info('found it');
    logger.error('went wrong');

    expect(console.log).toHaveBeenCalledWith('found it');
    expect(console.error).toHaveBeenCalledWith('went wrong');
  });

  it('copies every message to the log file, in order', () => {
    const logPath = path.join(dir, 'run.log');
    const logger = open({ logPath });

    logger.info('first');
    logger.error('second');
    logger.info('third');

    expect(fs.readFileSync(logPath, 'utf8')).toBe('first\nsecond\nthird\n');
  });

  it("explains a log file that can't be created, and still prints", () => {
    const logPath = path.join(dir, 'no/such/dir/run.log');
    const { logger, error } = createLogger({ logPath });

    expect(error).toBe(`${logPath}: can't write the log (ENOENT)`);

    logger.error('still works');
    expect(console.error).toHaveBeenCalledWith('still works');
  });

  it('prints debug values as JSON only with debugging on', () => {
    open().debug({ a: 1 });
    expect(console.error).not.toHaveBeenCalled();

    open({ debug: true }).debug({ a: 1 });
    expect(console.error).toHaveBeenCalledWith('{\n  "a": 1\n}');
  });

  it('summarizes pixel data in debug output', () => {
    open({ debug: true }).debug({ data: new Uint8ClampedArray(2000) });

    expect(console.error).toHaveBeenCalledWith(
      '{\n  "data": "<2,000 bytes of pixel data>"\n}',
    );
  });
});
