'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { Input, Modal } from '@/ds';
import { searchEntries } from '@/lib/search';
import type { SearchEntry } from '@/lib/search';

/**
 * Search, hand-rolled on `Modal` and `Input`.
 *
 * The package has no combobox or command palette (issue 158), and its rules bar
 * reaching for `cmdk` — sixteen `@radix-ui/*` packages and a second focus
 * model. So the dialog is the package's `Modal` (Base UI's dialog: focus trap,
 * Escape, the inert background, focus return) and the list is the ARIA 1.2
 * combobox pattern written here: focus stays in the input, the arrow keys move
 * `aria-activedescendant`, Enter follows the active option.
 */

interface SearchContextValue {
  open: () => void;
}

const SearchContext = createContext<SearchContextValue>({ open: () => {} });

export const useSearch = () => useContext(SearchContext);

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

export function SearchProvider({ entries, children }: { entries: readonly SearchEntry[]; children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  // Each opening mounts a fresh dialog, so the query starts empty without an
  // effect resetting state after the fact.
  const [session, setSession] = useState(0);
  const open = useCallback(() => {
    setSession((n) => n + 1);
    setOpen(true);
  }, []);

  const openRef = useRef(isOpen);
  useEffect(() => {
    openRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (openRef.current) setOpen(false);
        else open();
      } else if (event.key === '/' && !isTypingTarget(event.target)) {
        event.preventDefault();
        open();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <SearchContext.Provider value={value}>
      {children}
      <SearchDialog key={session} entries={entries} isOpen={isOpen} onClose={() => setOpen(false)} />
    </SearchContext.Provider>
  );
}

function SearchDialog({
  entries,
  isOpen,
  onClose,
}: {
  entries: readonly SearchEntry[];
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const uid = useId();
  const inputId = `${uid}-input`;
  const listId = `${uid}-list`;
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const suggestions = useMemo(() => entries.filter((e) => !e.page).slice(0, 7), [entries]);
  const results = useMemo(
    () => (query.trim() ? searchEntries(entries, query) : suggestions),
    [entries, query, suggestions],
  );

  // `Modal` sends focus to its popup so the dialog's title is announced. A
  // search dialog wants the input instead, and the package offers no
  // `initialFocus` override — so focus moves one frame after open.
  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => document.getElementById(inputId)?.focus());
    return () => cancelAnimationFrame(frame);
  }, [isOpen, inputId]);

  const go = (entry: SearchEntry | undefined) => {
    if (!entry) return;
    onClose();
    router.push(entry.href);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActive(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActive(Math.max(0, results.length - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      go(results[active]);
    }
  };

  const activeId = results[active] ? `${uid}-opt-${results[active].id}` : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="SEARCH"
      className="max-w-2xl"
      footer={
        <p className="m-0 font-mono text-xs uppercase tracking-wide text-content-muted">
          <kbd>↑</kbd> <kbd>↓</kbd> move · <kbd>↵</kbd> open · <kbd>esc</kbd> close
        </p>
      }
    >
      <Input
        id={inputId}
        label="Search the documentation"
        placeholder="button, sorting, focus trap…"
        autoComplete="off"
        spellCheck={false}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
        }}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={results.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
      />

      <p className="mt-4 mb-2 font-mono text-xs font-bold uppercase tracking-wider text-content-muted" aria-live="polite">
        {query.trim()
          ? results.length
            ? `[ ${results.length} RESULT${results.length === 1 ? '' : 'S'} ]`
            : `[ NO MATCHES FOR “${query.trim()}” ]`
          : '[ PAGES ]'}
      </p>

      <ul id={listId} role="listbox" aria-label="Results" className="m-0 max-h-[50vh] list-none overflow-y-auto p-0">
        {results.map((entry, index) => {
          const selected = index === active;
          return (
            // Options take no focus and need no key handler of their own: in the
            // combobox pattern the keyboard stays in the input, which moves
            // aria-activedescendant and follows the active option on Enter.
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events
            <li
              key={entry.id}
              id={`${uid}-opt-${entry.id}`}
              role="option"
              aria-selected={selected}
              onMouseMove={() => setActive(index)}
              onClick={() => go(entry)}
              className={
                'flex cursor-pointer items-baseline justify-between gap-4 border-l-4 px-3 py-2.5 font-mono text-sm ' +
                (selected
                  ? 'border-accent-primary bg-surface-sunken text-content-primary'
                  : 'border-transparent text-content-secondary')
              }
            >
              <span className="min-w-0">
                {entry.page ? <span className="text-content-muted">{entry.page} › </span> : null}
                <span className="font-bold">{entry.title}</span>
              </span>
              <span className="shrink-0 text-xs uppercase tracking-wide text-content-muted">{entry.trail}</span>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
