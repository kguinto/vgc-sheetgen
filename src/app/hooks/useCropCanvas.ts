import { useCallback } from 'react';
import { cropRgba, type Rect, type RgbaImage } from '../../core/ocr/image';

/**
 * Draws part of an image's pixels on a `<canvas>`, at their full
 * resolution: pass the result as the canvas's `ref`.
 */
export function useCropCanvas(image: RgbaImage, rect: Rect) {
  return useCallback(
    (canvas: HTMLCanvasElement | null) => {
      const context = canvas?.getContext('2d');

      if (!canvas || !context) return;

      const part = cropRgba(image, rect);

      canvas.width = part.width;
      canvas.height = part.height;
      context.putImageData(
        new ImageData(new Uint8ClampedArray(part.data), part.width),
        0,
        0,
      );
    },
    [image, rect],
  );
}
