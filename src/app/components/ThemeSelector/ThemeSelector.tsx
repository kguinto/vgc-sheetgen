import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
} from 'react';
import styles from './ThemeSelector.module.css';

/**
 * Saved under the same key the script in index.html reads when the page
 * loads. "Follow the device" is saved as no key at all, so that script falls
 * back to the device's setting. It also re-applies the theme when another
 * tab changes the key.
 */
const STORAGE_KEY = 'theme';

type Preference = 'system' | 'light' | 'dark';

const OPTIONS: { value: Preference; label: string; Icon: ComponentType }[] = [
  { value: 'system', label: 'System', Icon: MonitorIcon },
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
];

function readPreference(): Preference {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    return saved === 'light' || saved === 'dark' ? saved : 'system';
  } catch {
    return 'system';
  }
}

/** Saves the choice and switches the page's theme to match. */
function applyPreference(preference: Preference) {
  try {
    if (preference === 'system') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Saving is blocked, e.g. in some private modes: still switch this page.
  }

  const deviceTheme = matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

  document.documentElement.dataset.theme =
    preference === 'system' ? deviceTheme : preference;
}

/** Three buttons to pick the theme: follow the device, light, or dark. */
export function ThemeSelector() {
  const [preference, setPreference] = useState<Preference>(readPreference);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  // Another tab changed the choice: show it here too.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) {
        setPreference(readPreference());
      }
    };

    addEventListener('storage', onStorage);

    return () => removeEventListener('storage', onStorage);
  }, []);

  const select = (value: Preference) => {
    setPreference(value);
    applyPreference(value);
  };

  // A radio group: Tab moves into it once, and the arrow keys move between
  // the options, choosing each one.
  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;

    if (!step) return;

    event.preventDefault();

    const next = (index + step + OPTIONS.length) % OPTIONS.length;

    select(OPTIONS[next]!.value);
    buttons.current[next]?.focus();
  };

  return (
    <div className={styles.selector} role="radiogroup" aria-label="Theme">
      {OPTIONS.map(({ value, label, Icon }, index) => (
        <button
          key={value}
          ref={(el) => {
            buttons.current[index] = el;
          }}
          type="button"
          role="radio"
          className={styles.option}
          aria-checked={preference === value}
          aria-label={label}
          title={label}
          tabIndex={value === preference ? 0 : -1}
          onClick={() => select(value)}
          onKeyDown={(event) => onKeyDown(event, index)}
        >
          <Icon />
        </button>
      ))}
    </div>
  );
}

const iconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

function MonitorIcon() {
  return (
    <svg {...iconProps}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg {...iconProps}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
