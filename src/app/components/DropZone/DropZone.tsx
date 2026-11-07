import { useEffect, useEffectEvent, useState, type ReactNode } from 'react';
import styles from './DropZone.module.css';

type Props = {
  /** File types to accept, e.g. `['image/png', 'image/jpeg']`. */
  accept: string[];
  /**
   * Called with the files dropped or picked, split into the ones of an
   * accepted type and the rest.
   */
  onFiles(accepted: File[], rejected: File[]): void;
  /** Shown inside the zone, e.g. what to drop and how many are added. */
  children: ReactNode;
};

/**
 * Takes files dropped anywhere on the page while it's shown, and lights up
 * while files are dragged over the page. Clicking or tapping it opens the
 * file picker instead, which on phones offers the photo library.
 */
export function DropZone({ accept, onFiles, children }: Props) {
  const [dragging, setDragging] = useState(false);

  const add = (files: FileList | null | undefined) => {
    const all = [...(files ?? [])];

    if (all.length === 0) return;

    onFiles(
      all.filter((f) => accept.includes(f.type)),
      all.filter((f) => !accept.includes(f.type)),
    );
  };

  // The page-wide drop handler below is set up once, but should always add
  // to the latest screenshots.
  const addDropped = useEffectEvent(add);

  // The whole page takes drops, so a file doesn't have to land on the zone.
  // Without this, the browser would open a file dropped elsewhere in place
  // of the app, losing everything added so far.
  useEffect(() => {
    // Only react to files being dragged, not, say, selected text.
    const hasFiles = (event: DragEvent) =>
      event.dataTransfer?.types.includes('Files') ?? false;

    const onDragOver = (event: DragEvent) => {
      if (!hasFiles(event)) return;

      event.preventDefault();
      setDragging(true);
    };

    // Fired as the pointer moves between elements too; it has only left the
    // page when there's nothing it moved onto.
    const onDragLeave = (event: DragEvent) => {
      if (!event.relatedTarget) setDragging(false);
    };

    const onDrop = (event: DragEvent) => {
      if (!hasFiles(event)) return;

      event.preventDefault();
      setDragging(false);
      addDropped(event.dataTransfer?.files);
    };

    addEventListener('dragover', onDragOver);
    addEventListener('dragleave', onDragLeave);
    addEventListener('drop', onDrop);

    return () => {
      removeEventListener('dragover', onDragOver);
      removeEventListener('dragleave', onDragLeave);
      removeEventListener('drop', onDrop);
    };
  }, []);

  return (
    <label className={`${styles.zone}${dragging ? ` ${styles.dragging}` : ''}`}>
      <input
        type="file"
        accept={accept.join(',')}
        multiple
        className={styles.input}
        onChange={(event) => {
          add(event.target.files);
          // Lets the same file be picked again.
          event.target.value = '';
        }}
      />
      {children}
    </label>
  );
}
