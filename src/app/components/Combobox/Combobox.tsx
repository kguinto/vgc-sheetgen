import { useId, useState, type KeyboardEvent } from 'react';
import styles from './Combobox.module.css';

export type ComboboxOption = { value: string; label: string };

type Props = {
  options: ComboboxOption[];
  /** The chosen option's value. */
  value: string;
  onChange: (value: string) => void;
  /** Names the input for screen readers, if it has no visible label. */
  'aria-label'?: string;
  /** Points the input at its visible label, e.g. a heading's id. */
  'aria-labelledby'?: string;
};

/**
 * A text input with a list of options that narrows as you type, e.g. typing
 * "jol" leaves "Jolly (+Spe / -SpA)". Pick with the arrow keys and Enter, or
 * by clicking or tapping. Only an option can be chosen: leaving the input
 * with text that isn't one puts the chosen option back.
 */
export function Combobox({ options, value, onChange, ...labelling }: Props) {
  const listId = useId();
  const chosen = options.find((option) => option.value === value);

  // While typing: the text so far, and which match is highlighted. `null`
  // when the list is closed, and the input shows the chosen option.
  const [typing, setTyping] = useState<{ text: string; active: number } | null>(
    null,
  );

  const matches = typing
    ? options.filter((option) =>
        option.label.toLowerCase().includes(typing.text.trim().toLowerCase()),
      )
    : [];

  const open = (text: string) => setTyping({ text, active: 0 });
  const close = () => setTyping(null);

  const choose = (option: ComboboxOption | undefined) => {
    if (option && option.value !== value) onChange(option.value);

    close();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!typing) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        open('');
      }

      return;
    }

    const last = matches.length - 1;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setTyping({ ...typing, active: Math.min(typing.active + 1, last) });
        break;
      case 'ArrowUp':
        event.preventDefault();
        setTyping({ ...typing, active: Math.max(typing.active - 1, 0) });
        break;
      case 'Enter':
        event.preventDefault();
        choose(matches[typing.active]);
        break;
      case 'Escape':
        event.preventDefault();
        close();
        break;
    }
  };

  const activeId =
    typing && matches[typing.active] ? `${listId}-${typing.active}` : undefined;

  return (
    <div className={styles.combobox}>
      <input
        className={styles.input}
        role="combobox"
        aria-expanded={!!typing}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        autoComplete="off"
        spellCheck={false}
        {...labelling}
        value={typing ? typing.text : (chosen?.label ?? '')}
        // Opening shows every option, with the current text selected, so
        // typing replaces it.
        onFocus={(event) => event.target.select()}
        onClick={() => !typing && open('')}
        onChange={(event) => open(event.target.value)}
        onKeyDown={onKeyDown}
        // Leaving with text that isn't an option puts the chosen one back.
        onBlur={close}
      />
      {typing && (
        <ul id={listId} className={styles.list} role="listbox">
          {matches.length === 0 && (
            <li className={styles.empty} role="presentation">
              No matches
            </li>
          )}
          {matches.map((option, i) => (
            <li
              key={option.value}
              id={`${listId}-${i}`}
              className={`${styles.option}${i === typing.active ? ` ${styles.active}` : ''}`}
              role="option"
              aria-selected={option.value === value}
              // Chooses before the input loses focus, which would close the
              // list first.
              onMouseDown={(event) => {
                event.preventDefault();
                choose(option);
              }}
              onMouseEnter={() => setTyping({ ...typing, active: i })}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
