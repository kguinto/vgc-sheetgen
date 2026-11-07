import type { ReactNode } from 'react';
import { Footer } from '../Footer/Footer';
import styles from './PageLayout.module.css';

type Props = {
  /** Shown above the page's card, e.g. which step you're on. */
  top?: ReactNode;
  /** Shown below the page's card, e.g. the Back and Next buttons. */
  bottom?: ReactNode;
  children: ReactNode;
};

/**
 * The frame every page shares: the app's title, the page's contents on a
 * card, and the footer.
 */
export function PageLayout({ top, bottom, children }: Props) {
  return (
    <>
      <div className={styles.layout}>
        <header className={styles.header}>
          <h1>VGC Sheetgen</h1>
          <p>Make a Pokémon VGC team list from two screenshots of your team.</p>
        </header>

        {top}

        <main className={styles.card}>{children}</main>

        {bottom}
      </div>
      <Footer />
    </>
  );
}
