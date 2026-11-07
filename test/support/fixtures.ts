import type { RgbaImage } from '../../src/core/ocr/image';

/** A blank image, all one color. */
export function solidImage(
  width: number,
  height: number,
  rgb: [number, number, number] = [0, 0, 0],
): RgbaImage {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < data.length; i += 4) data.set([...rgb, 255], i);
  return { width, height, data };
}
