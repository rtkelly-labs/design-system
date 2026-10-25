'use client';

import { forwardRef, useId, useRef, useState } from 'react';
import type { ChangeEvent, HTMLAttributes, KeyboardEvent, ReactNode } from 'react';
import { Field as BaseField } from '@base-ui/react/field';
import { recipe } from '../lib/recipe';
import { FREE_TEXT_KEY, describeFilter, formatFilter, sameFilter, tryParseFilter } from '../lib/filters';
import type { Filter } from '../lib/filters';

/** A field `FilterBar` suggests while typing. */
export interface FilterBarField {
  /** The key as it is written in an expression: `service`, `http.status`. */
  key: string;
  /** A human name for the field, shown beside the `key=` suggestion where the browser shows labels. */
  label?: string;
  /** Known values, each suggested as `key=value`. */
  values?: readonly string[];
}

export interface FilterBarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** The filters, controlled. Pair with `onFiltersChange`. */
  filters?: readonly Filter[];
  /** The filters on first render, uncontrolled. */
  defaultFilters?: readonly Filter[];
  /** Called with the whole next list whenever a chip is added, edited, removed or cleared. */
  onFiltersChange?: (filters: Filter[]) => void;
  /** Fields and values offered as suggestions, through a native `<datalist>`. */
  fields?: readonly FilterBarField[];
  /** The input's accessible name. Default `Filter`. */
  label?: string;
  /** Keep the label for assistive technology only. Default `false`: it leads the bar. */
  hideLabel?: boolean;
  /** Placeholder text in the empty input. */
  placeholder?: string;
  /** Right-aligned summary — a count such as `42 of 1,204 spans`. */
  summary?: ReactNode;
  /** The label of the button that removes every filter. Default `Clear all`. */
  clearLabel?: string;
}

const filterBar = recipe({
  slots: {
    root: 'flex flex-col gap-1 font-mono text-xs text-content-primary',
    bar:
      'flex flex-wrap items-center gap-1.5 border-2 border-edge-strong bg-surface-base px-2 py-1.5 transition-colors motion-reduce:transition-none '
      + 'focus-within:border-accent-primary',
    label: 'shrink-0 pr-1 text-xs font-bold uppercase tracking-wider text-content-secondary',
    chips: 'flex flex-wrap items-center gap-1.5',
    chip: 'inline-flex max-w-full items-stretch border border-edge-default bg-surface-raised',
    chipEdit:
      'cursor-pointer truncate px-1.5 py-0.5 text-left hover:bg-surface-sunken aria-pressed:bg-accent-quiet aria-pressed:text-content-inverse',
    chipKey: 'text-content-secondary',
    chipOperator: 'px-0.5 font-bold text-accent-primary',
    chipValue: 'text-content-primary',
    chipRemove:
      'cursor-pointer border-l border-edge-default px-1.5 text-content-secondary hover:bg-surface-sunken hover:text-intent-danger',
    input: 'min-w-[12ch] flex-1 bg-transparent py-0.5 font-mono text-xs text-content-primary placeholder:text-content-muted',
    clear:
      'shrink-0 cursor-pointer px-1 text-content-secondary underline decoration-dotted underline-offset-2 hover:text-content-primary',
    summary: 'ml-auto shrink-0 pl-2 tabular-nums text-content-secondary',
    error: 'text-intent-danger',
  },
  variants: {
    invalid: {
      true: { bar: 'border-intent-danger focus-within:border-intent-danger' },
    },
  },
});

function suggestions(fields: readonly FilterBarField[]): Array<{ value: string; label?: string }> {
  const seen = new Set<string>();
  const out: Array<{ value: string; label?: string }> = [];
  const push = (value: string, label?: string) => {
    if (seen.has(value)) return;
    seen.add(value);
    out.push({ value, label });
  };
  for (const field of fields) {
    push(`${field.key}=`, field.label);
    for (const value of field.values ?? []) {
      push(formatFilter({ key: field.key, operator: '=', value }), field.label);
    }
  }
  return out;
}

function ChipText({ filter, styles }: { filter: Filter; styles: ReturnType<typeof filterBar> }) {
  if (filter.key === FREE_TEXT_KEY && filter.operator === '~') {
    return <span className={styles.chipValue()}>{describeFilter(filter)}</span>;
  }
  return (
    <>
      <span className={styles.chipKey()}>{filter.key}</span>
      <span className={styles.chipOperator()}>{filter.operator}</span>
      <span className={styles.chipValue()}>{filter.value}</span>
    </>
  );
}

/**
 * A query bar for log, span and event lists: each condition is a chip —
 * `service = checkout`, `status != 500`, `msg ~ timeout` — and one text input
 * adds more.
 *
 * Type `key=value` (or `!=`, `~`, `!~`, or plain text to search everything) and
 * press Enter to add a chip. Backspace in the empty input removes the last
 * chip; Escape clears the input. Pressing a chip's text puts it back in the
 * input for editing — Enter replaces it in place, Escape abandons the edit.
 *
 * Suggestions come from `fields` through a native `<datalist>`, so the browser
 * owns the list, its keyboard and its announcements; there is no popup or
 * focus model here. Expressions are parsed by `parseFilter` from
 * `lib/filters`, and `matchFilters` applies the result to records.
 *
 * An expression that cannot be parsed — `=value` with no field — stays in the
 * input with a message joined to its `aria-describedby`. The label, the
 * message and their wiring are Base UI's `Field`, as on every control here.
 */
export const FilterBar = forwardRef<HTMLDivElement, FilterBarProps>(function FilterBar(
  {
    filters: filtersProp,
    defaultFilters,
    onFiltersChange,
    fields,
    label = 'Filter',
    hideLabel = false,
    placeholder = 'key=value or text',
    summary,
    clearLabel = 'Clear all',
    className,
    ...props
  },
  ref,
) {
  const [owned, setOwned] = useState<readonly Filter[]>(() => defaultFilters ?? []);
  const filters = filtersProp ?? owned;
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();
  const listId = `${baseId}-suggestions`;
  const styles = filterBar({ invalid: Boolean(error) });
  const options = fields?.length ? suggestions(fields) : [];

  const commit = (next: Filter[]) => {
    if (filtersProp === undefined) setOwned(next);
    onFiltersChange?.(next);
  };

  const reset = () => {
    setText('');
    setError(null);
    setEditing(null);
  };

  const submit = () => {
    const result = tryParseFilter(text);
    if (!result) {
      reset();
      return;
    }
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const filter = result.filter;
    const index = editing !== null && editing < filters.length ? editing : null;
    const rest = index === null ? filters : filters.filter((_, at) => at !== index);
    if (!rest.some((existing) => sameFilter(existing, filter))) {
      const next = [...filters];
      if (index === null) next.push(filter);
      else next[index] = filter;
      commit(next);
    } else if (index !== null) {
      // The edit now duplicates another chip: drop the one being edited.
      commit(rest.slice());
    }
    reset();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
    } else if (event.key === 'Escape') {
      if (text || editing !== null || error) {
        event.preventDefault();
        reset();
      }
    } else if (event.key === 'Backspace' && text === '' && filters.length > 0 && editing === null) {
      event.preventDefault();
      commit(filters.slice(0, -1));
    }
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value);
    if (error) setError(null);
  };

  const remove = (index: number) => {
    commit(filters.filter((_, at) => at !== index));
    if (editing !== null) {
      if (editing === index) reset();
      else if (editing > index) setEditing(editing - 1);
    }
    inputRef.current?.focus();
  };

  const edit = (index: number) => {
    const filter = filters[index];
    if (!filter) return;
    setText(formatFilter(filter));
    setError(null);
    setEditing(index);
    inputRef.current?.focus();
  };

  return (
    <BaseField.Root ref={ref} data-slot="filter-bar" invalid={Boolean(error)} {...props} className={styles.root({ className })}>
      <div data-slot="filter-bar-field" className={styles.bar()}>
        <BaseField.Label data-slot="filter-bar-label" className={styles.label({ class: hideLabel ? 'sr-only' : undefined })}>
          {label}
        </BaseField.Label>
        {filters.length > 0 ? (
          <ul aria-label="Active filters" className={styles.chips()}>
            {filters.map((filter, index) => {
              const described = describeFilter(filter);
              return (
                <li key={`${index}:${formatFilter(filter)}`} data-slot="filter-bar-chip" className={styles.chip()}>
                  <button
                    type="button"
                    aria-label={`Edit filter ${described}`}
                    aria-pressed={editing === index}
                    onClick={() => edit(index)}
                    className={styles.chipEdit()}
                  >
                    <ChipText filter={filter} styles={styles} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove filter ${described}`}
                    onClick={() => remove(index)}
                    className={styles.chipRemove()}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
        <BaseField.Control
          ref={inputRef}
          type="text"
          value={text}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          list={options.length ? listId : undefined}
          data-slot="filter-bar-input"
          className={styles.input()}
        />
        {options.length ? (
          <datalist id={listId}>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label ?? option.value}
              </option>
            ))}
          </datalist>
        ) : null}
        {filters.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              commit([]);
              reset();
              inputRef.current?.focus();
            }}
            className={styles.clear()}
          >
            {clearLabel}
          </button>
        ) : null}
        {summary !== undefined && summary !== null ? (
          <span data-slot="filter-bar-summary" className={styles.summary()}>
            {summary}
          </span>
        ) : null}
      </div>
      {error ? (
        <BaseField.Description data-slot="filter-bar-error" className={styles.error()}>
          {error}
        </BaseField.Description>
      ) : null}
    </BaseField.Root>
  );
});

FilterBar.displayName = 'FilterBar';
