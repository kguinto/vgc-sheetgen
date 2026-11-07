import styles from './PdfPreview.module.css';

type Props = {
  /** The PDF's URL. */
  url: string;
  /** Names the preview for screen readers. */
  title: string;
};

/**
 * A PDF in the browser's own viewer, which can also zoom and print it. Some
 * browsers can't show PDFs inside a page (e.g. Chrome on Android); there,
 * it says so, and the PDF can still be opened or downloaded.
 */
export function PdfPreview({ url, title }: Props) {
  if (!navigator.pdfViewerEnabled) {
    return (
      <p className={styles.unsupported}>
        This browser can't show the team list here. Open or download it to see
        it.
      </p>
    );
  }

  // Fit the page's width, so a whole page shows at once.
  return (
    <iframe className={styles.frame} src={`${url}#view=FitH`} title={title} />
  );
}
