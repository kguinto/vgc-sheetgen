/**
 * Marks a branch the type checker has proven can't run, e.g. the `default`
 * of a `switch` that handles every screen kind. If a new kind is added and
 * a `switch` doesn't handle it, the call here stops compiling, pointing at
 * the code to update. If it's somehow reached anyway, that's a bug.
 */
export function unreachable(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}
