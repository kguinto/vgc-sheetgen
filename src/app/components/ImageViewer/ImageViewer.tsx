import { useEffect, useRef } from 'react';
import { useFileImage } from '../../hooks/useFileImage';
import { CloseIcon } from '../CloseIcon/CloseIcon';
import styles from './ImageViewer.module.css';

type Props = {
  image: Blob;
  /** Shown above the image, e.g. the file name. */
  title: string;
  onClose: () => void;
};

/**
 * An image at full size in a modal. Show it to open it; Escape, the close
 * button, or a click outside the image closes it.
 */
export function ImageViewer({ image, title, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const showImage = useFileImage(image);

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
      <img ref={showImage} className={styles.image} alt={title} />
    </dialog>
  );
}
