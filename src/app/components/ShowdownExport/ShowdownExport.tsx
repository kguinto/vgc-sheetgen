import { useRef, useState } from 'react';
import { formatShowdown } from '../../../core/team/showdown';
import type { Team } from '../../../core/team/types';
import styles from './ShowdownExport.module.css';

/** How long "Copied" shows on the button. */
const COPIED_FOR_MS = 2000;

/**
 * The team as Pokémon Showdown text, to copy and paste into Showdown's
 * teambuilder. The text can be copied with the button, or selected and
 * copied by hand.
 */
export function ShowdownExport({ team }: { team: Team }) {
  const text = formatShowdown(team);
  const box = useRef<HTMLTextAreaElement>(null);
  const [copy, setCopy] = useState<'idle' | 'copied' | 'failed'>('idle');

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopy('copied');
      setTimeout(() => setCopy('idle'), COPIED_FOR_MS);
    } catch {
      // Some browsers block copying from a page; select the text instead,
      // so it can be copied by hand.
      box.current?.select();
      setCopy('failed');
    }
  };

  return (
    <div className={styles.export}>
      <p className={styles.hint}>
        In Pokémon Showdown's teambuilder, choose "Import from text" and paste
        this. The Stat Points (SP) are on each Pokémon's "EVs" line, as Showdown
        writes them for Pokémon Champions.
      </p>

      {/* Read out when it changes, for screen readers. On screen, copying
          shows as the button's check mark, so only a failure is shown. */}
      <p
        className={copy === 'failed' ? styles.status : styles.hidden}
        role="status"
      >
        {copy === 'copied' && 'Copied to the clipboard.'}
        {copy === 'failed' &&
          "Couldn't copy automatically. The text is selected: copy it from your keyboard or menu."}
      </p>

      {/* The copy button floats on the box's top-right corner. */}
      <div className={styles.box}>
        <textarea
          ref={box}
          className={styles.text}
          aria-label="The team as Pokémon Showdown text"
          readOnly
          value={text}
          rows={text.split('\n').length}
          spellCheck={false}
          // Selecting it all makes copying by hand one step.
          onFocus={(event) => event.target.select()}
        />
        <button
          type="button"
          className={styles.copy}
          aria-label="Copy"
          title={copy === 'copied' ? 'Copied' : 'Copy'}
          onClick={onCopy}
        >
          {copy === 'copied' ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
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

/** Two overlapping sheets: copy. */
function CopyIcon() {
  return (
    <svg {...iconProps}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

/** A check mark: copied. */
function CheckIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
