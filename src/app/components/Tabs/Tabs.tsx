import type { KeyboardEvent } from 'react';
import { panelId, tabId } from './tab-ids';
import styles from './Tabs.module.css';

export type Tab<T extends string> = { id: T; label: string };

type Props<T extends string> = {
  tabs: Tab<T>[];
  /** The tab whose panel is shown. */
  active: T;
  onChange: (id: T) => void;
  /** Names the row of tabs for screen readers, e.g. "View". */
  label: string;
  /**
   * Starts the tabs' and panels' ids, so they can point at each other (see
   * `tabPanelProps`).
   */
  idPrefix: string;
};

/**
 * A row of tabs. Clicking one shows its panel. From the keyboard, Tab moves
 * into the row once, the arrow keys move between tabs, and Home and End jump
 * to the first and last.
 */
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  label,
  idPrefix,
}: Props<T>) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = tabs.findIndex((tab) => tab.id === active);
    const last = tabs.length - 1;

    const next =
      event.key === 'ArrowRight'
        ? (current + 1) % tabs.length
        : event.key === 'ArrowLeft'
          ? (current - 1 + tabs.length) % tabs.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : undefined;

    if (next === undefined) return;

    event.preventDefault();

    const tab = tabs[next]!;

    onChange(tab.id);
    document.getElementById(tabId(idPrefix, tab.id))?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={styles.tabs}
      onKeyDown={onKeyDown}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          id={tabId(idPrefix, tab.id)}
          aria-selected={tab.id === active}
          aria-controls={panelId(idPrefix, tab.id)}
          // Only the chosen tab is in the Tab order; the arrow keys reach
          // the rest.
          tabIndex={tab.id === active ? 0 : -1}
          className={styles.tab}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
