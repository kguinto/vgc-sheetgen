import { useEffect, useRef } from 'react';
import type { Rect, RgbaImage } from '../../../core/ocr/image';
import { useCropCanvas } from '../../hooks/useCropCanvas';
import { useFileImage } from '../../hooks/useFileImage';
import { CloseIcon } from '../CloseIcon/CloseIcon';
import styles from './ImageViewer.module.css';

/** Part of an image's pixels, e.g. one card of a screenshot. */
export type PixelsPart = { pixels: RgbaImage; rect: Rect };

type Props = {
  /** An image file, or part of an image's pixels. */
  image: Blob | PixelsPart;
  /** Shown above the image, e.g. the file name. */
  title: string;
  onClose: () => void;
};

/**
 * An image as large as fits, in a modal. Show it to open it; Escape, the
 * close button, or a click outside the image closes it.
 */
export function ImageViewer({ image, title, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);

  // A dialog opened this way keeps keyboard focus inside it, dims the page
  // behind it, and closes on Escape.
  useEffect(() => {
    if (!dialog.current || dialog.current.open) return;

    dialog.current.showModal();
    // Opening it focuses the close button, which Safari outlines even after
    // a click. Focus the dialog itself instead; the close button is still
    // one Tab away.
    dialog.current.focus();
  }, []);

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      // Lets the dialog itself take focus when it opens.
      tabIndex={-1}
      aria-label={title}
      onClose={onClose}
      // Clicks on the dialog itself, rather than on what's inside it, land
      // on the dimmed area around it.
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      <header className={styles.header}>
        <span className={styles.title}>{title}</span>
        <button
          type="button"
          className={styles.close}
          aria-label="Close"
          onClick={() => dialog.current?.close()}
        >
          <CloseIcon />
        </button>
      </header>
      {image instanceof Blob ? (
        <FileImage file={image} title={title} />
      ) : (
        <PartImage part={image} title={title} />
      )}
    </dialog>
  );
}

function FileImage({ file, title }: { file: Blob; title: string }) {
  const showFile = useFileImage(file);

  return <img ref={showFile} className={styles.image} alt={title} />;
}

/**
 * Part of a screenshot, drawn from its full-resolution pixels and stretched
 * to fill the width, since crops are usually smaller than the screen.
 */
function PartImage({ part, title }: { part: PixelsPart; title: string }) {
  const draw = useCropCanvas(part.pixels, part.rect);
  const { w, h } = part.rect;

  return (
    <canvas
      ref={draw}
      className={styles.part}
      // As wide as fits, but no taller than the window allows.
      style={{
        aspectRatio: `${w} / ${h}`,
        width: `min(95vw, calc((95vh - 50px) * ${w / h}))`,
      }}
      role="img"
      aria-label={title}
    />
  );
}
