import { useState } from 'react';
import { useFileImage } from '../../hooks/useFileImage';
import { CloseIcon } from '../CloseIcon/CloseIcon';
import { ImageViewer } from '../ImageViewer/ImageViewer';
import styles from './ScreenshotList.module.css';

type Props = {
  screenshots: File[];
  /** Shows a remove button on each screenshot when given. */
  onRemove?: (index: number) => void;
};

/**
 * The screenshots side by side, each with its file name. Clicking one shows
 * it at full size.
 */
export function ScreenshotList({ screenshots, onRemove }: Props) {
  const [viewing, setViewing] = useState<File | null>(null);

  if (screenshots.length === 0) return null;

  return (
    <>
      <ul className={styles.list}>
        {screenshots.map((file, i) => (
          // Two files can have the same name, so the position is the key.
          <li key={i} className={styles.item}>
            <button
              type="button"
              className={styles.open}
              aria-label={`View ${file.name}`}
              onClick={() => setViewing(file)}
            >
              <Thumbnail file={file} />
            </button>
            <span className={styles.name} title={file.name}>
              {file.name}
            </span>
            {onRemove && (
              <button
                type="button"
                className={styles.remove}
                aria-label={`Remove ${file.name}`}
                title="Remove"
                onClick={() => onRemove(i)}
              >
                <CloseIcon size={12} />
              </button>
            )}
          </li>
        ))}
      </ul>

      {viewing && (
        <ImageViewer
          image={viewing}
          title={viewing.name}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  );
}

function Thumbnail({ file }: { file: File }) {
  const showFile = useFileImage(file);

  // The button around it is labeled with the file name, so the image itself
  // needs no description.
  return <img ref={showFile} className={styles.image} alt="" />;
}
