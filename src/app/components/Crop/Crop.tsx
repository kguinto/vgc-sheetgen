import { useState } from 'react';
import type { Rect, RgbaImage } from '../../../core/ocr/image';
import { useCropCanvas } from '../../hooks/useCropCanvas';
import { ImageViewer } from '../ImageViewer/ImageViewer';
import styles from './Crop.module.css';

type Props = {
  /** A screenshot's pixels, e.g. a screen's scaled image after reading. */
  image: RgbaImage;
  /** The part to show, in the image's pixels. */
  rect: Rect;
  /** What it shows, e.g. "Pokémon 1 on the Stats tab". */
  label: string;
};

/**
 * Part of a screenshot, scaled to the width of its container. Clicking it
 * shows it larger, for a closer look.
 */
export function Crop({ image, rect, label }: Props) {
  const [viewing, setViewing] = useState(false);
  const draw = useCropCanvas(image, rect);

  return (
    <>
      <button
        type="button"
        className={styles.open}
        aria-label={`View ${label} larger`}
        onClick={() => setViewing(true)}
      >
        <canvas
          ref={draw}
          className={styles.crop}
          style={{ aspectRatio: `${rect.w} / ${rect.h}` }}
        />
      </button>

      {viewing && (
        <ImageViewer
          image={{ pixels: image, rect }}
          title={label}
          onClose={() => setViewing(false)}
        />
      )}
    </>
  );
}
