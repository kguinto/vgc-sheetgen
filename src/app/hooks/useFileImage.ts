import { useCallback } from 'react';

/**
 * Shows a file in an `<img>`: pass the result as the image's `ref`.
 *
 * The image is shown from a temporary URL for the file. The browser keeps
 * the file in memory until the URL is released, so it's released when the
 * image goes away or shows another file. Nothing is uploaded.
 */
export function useFileImage(file: Blob) {
  return useCallback(
    (img: HTMLImageElement | null) => {
      if (!img) return;

      const url = URL.createObjectURL(file);

      img.src = url;

      return () => URL.revokeObjectURL(url);
    },
    [file],
  );
}
