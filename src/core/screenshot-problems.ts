/**
 * Why a screenshot the user gave can't be used, e.g. it's not an image, or
 * it's from a console we don't recognize.
 *
 * These are returned rather than thrown, so a thrown error always means a
 * bug. They're plain objects, so the script and the web app can both show
 * them, and the web app can pass them from its background thread as is.
 */
export type ScreenshotProblem = {
  code: ScreenshotProblemCode;
  /** Ready to show the user. */
  message: string;
  /** The screenshot it's about, if it's about one, e.g. its file name. */
  input?: string;
};

/** What kind of problem it is, for code that wants to react to it. */
export type ScreenshotProblemCode =
  /** The file isn't a PNG or JPEG image, or it's damaged. */
  | 'unreadable-image'
  /** The screenshot isn't 16:9, so it isn't from a supported console. */
  | 'unsupported-size';

/**
 * The problem as one line of text, starting with the screenshot it's about:
 * "<file>: <message>", or just the message.
 */
export function formatScreenshotProblem(problem: ScreenshotProblem): string {
  return problem.input
    ? `${problem.input}: ${problem.message}`
    : problem.message;
}
