import fs from 'node:fs';

/**
 * Prints messages for the person running a script, and copies each one to
 * a log file when there is one.
 */
export type Logger = {
  /** Normal output, to stdout. */
  info(message: string): void;
  /** Problems, to stderr. */
  error(message: string): void;
  /**
   * With debugging on, prints `value` as JSON to stderr, for looking into
   * what happened. Pixel data is summarized rather than printed. Does
   * nothing with debugging off.
   */
  debug(value: unknown): void;
};

export type LoggerOptions = {
  /** A file to copy every message to, replacing what was there. */
  logPath?: string;
  /** Whether `debug` prints anything. */
  debug?: boolean;
};

export type CreateLoggerResult = {
  logger: Logger;
  /**
   * Why the log file couldn't be created, as one line. The logger then
   * prints to the console only, so it can still report this.
   */
  error?: string;
};

/**
 * A logger that prints to the console and, with `logPath`, also writes
 * every message to that file. Each message is written as soon as it's
 * logged, so the file is complete even if the script exits early.
 *
 * If the log file can't be created, the logger prints to the console only,
 * and `error` says why.
 */
export function createLogger(options: LoggerOptions = {}): CreateLoggerResult {
  const { logPath, debug = false } = options;
  let file: number | undefined;
  let error: string | undefined;

  if (logPath !== undefined) {
    try {
      file = fs.openSync(logPath, 'w');
    } catch (err) {
      // E.g. ENOENT when the log file's folder doesn't exist.
      const code = (err as NodeJS.ErrnoException).code;

      error = `${logPath}: can't write the log (${code ?? err})`;
    }
  }

  const copyToFile = (message: string) => {
    if (file !== undefined) fs.writeSync(file, `${message}\n`);
  };

  const logger: Logger = {
    info(message) {
      console.log(message);
      copyToFile(message);
    },
    error(message) {
      console.error(message);
      copyToFile(message);
    },
    debug(value) {
      if (debug) logger.error(JSON.stringify(value, summarizePixels, 2));
    },
  };

  return { logger, error };
}

/**
 * For debug output: replaces pixel data (millions of numbers per
 * screenshot) with a short description, and leaves everything else as is.
 */
function summarizePixels(_key: string, value: unknown): unknown {
  if (value instanceof Uint8Array || value instanceof Uint8ClampedArray) {
    return `<${value.length.toLocaleString('en-US')} bytes of pixel data>`;
  }

  return value;
}
