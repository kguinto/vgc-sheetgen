import type { LayoutProfile } from '../layout';
import { console1080 } from './console-1080';
import { console720 } from './console-720';

/**
 * Every console whose screenshots can be read. Order matters for screenshots
 * of other sizes: they use the first layout with the same shape, so anything
 * 16:9 that isn't 1280×720 is read as a Switch 2 screenshot.
 */
export const LAYOUTS: LayoutProfile[] = [console1080, console720];
