/**
 * An image as raw pixels: 4 bytes per pixel (red, green, blue, alpha), row
 * by row from the top left.
 *
 * This is a screenshot after it's been decoded from its PNG or JPEG file.
 */
export type RgbaImage = {
  width: number;
  height: number;
  data: Uint8Array | Uint8ClampedArray;
};
