import { ThemeSelector } from '../ThemeSelector/ThemeSelector';
import styles from './Footer.module.css';

/** The bottom of every page: for now, just the theme selector. */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <ThemeSelector />
    </footer>
  );
}
