import type { ReactNode } from 'react';
import * as React from 'react';
import { cn } from '../../lib/recipe';

/** What happened to a record between baseline and candidate, matched by its stable key. */
export type KeyedChange = 'added' | 'removed' | 'changed' | 'renamed' | 'unchanged';

export interface KeyedDiffRow {
  /** The record's stable identity — a method id, a package name, a cluster key. */
  identity: ReactNode;
  /** What happened to the record. */
  change: KeyedChange;
  /** One cell per entry in `columns`, typically `DeltaValue`s. */
  cells?: readonly ReactNode[];
}

export interface KeyedDiffProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Says what the records are and what they are keyed by. Rendered as the table caption. */
  caption: ReactNode;
  /** Heading for the identity column. */
  identityLabel?: string;
  /** Headings for the measured columns after the identity. */
  columns?: readonly string[];
  /** One row per record, in reading order. Sort by change or by identity before passing them in. */
  rows: readonly KeyedDiffRow[];
  /** Printed when there are no rows. */
  emptyText?: ReactNode;
  /** Replaces the change words, for a translated page. */
  changeLabels?: Partial<Record<KeyedChange, string>>;
  /** Additional classes for the root. */
  className?: string;
}

const LOOK: Record<KeyedChange, { glyph: string; tone: string; word: string }> = {
  added: { glyph: '+', tone: 'text-delta-added', word: 'added' },
  removed: { glyph: '−', tone: 'text-delta-removed', word: 'removed' },
  changed: { glyph: 'Δ', tone: 'text-content-secondary', word: 'changed' },
  renamed: { glyph: '→', tone: 'text-delta-moved', word: 'renamed' },
  unchanged: { glyph: '=', tone: 'text-content-muted', word: 'unchanged' },
};

/**
 * Records compared by stable identity rather than by line: one row per record, a change word,
 * and the measured fields beside it.
 *
 * The form a keyed-collection comparison reports. A method whose signature changed is one
 * `changed` row here where a line diff shows a removal and an addition, and reordering a keyed
 * collection is no change at all.
 */
export const KeyedDiff = React.forwardRef<HTMLDivElement, KeyedDiffProps>(function KeyedDiff(
  { caption, identityLabel = 'Record', columns = [], rows, emptyText = 'No records changed.', changeLabels, className, ...rest },
  ref,
) {
  const words = { ...Object.fromEntries(Object.entries(LOOK).map(([k, v]) => [k, v.word])), ...changeLabels } as Record<KeyedChange, string>;
  const head = 'border-b border-edge-default px-3 py-2 text-left font-mono text-xs font-bold uppercase tracking-wider text-content-muted whitespace-nowrap';
  const cell = 'border-b border-edge-subtle px-3 py-2 align-top';
  return (
    <div ref={ref} data-slot="keyed-diff" {...rest} className={cn('overflow-x-auto border-t-2 border-edge-strong', className)}>
      <table className="w-full border-collapse text-sm [&_tbody_tr:last-child>*]:border-b-0">
        <caption className="px-3 py-2.5 text-left font-mono text-xs font-bold uppercase tracking-wider text-content-muted">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className={head}>Change</th>
            <th scope="col" className={head}>{identityLabel}</th>
            {columns.map((column) => (
              <th key={column} scope="col" className={cn(head, 'text-right')}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={2 + columns.length} className={cn(cell, 'text-content-muted')}>{emptyText}</td>
            </tr>
          ) : (
            rows.map((row, index) => {
              const look = LOOK[row.change];
              return (
                <tr key={index} data-change={row.change}>
                  <td className={cn(cell, 'whitespace-nowrap font-mono text-xs font-bold uppercase tracking-wider', look.tone)}>
                    <span aria-hidden="true" className="pr-1.5">{look.glyph}</span>
                    {words[row.change]}
                  </td>
                  <th scope="row" className={cn(cell, 'text-left font-mono font-normal text-content-primary [overflow-wrap:anywhere]', row.change === 'removed' && 'line-through')}>
                    {row.identity}
                  </th>
                  {columns.map((column, c) => (
                    <td key={column} className={cn(cell, 'text-right tabular-nums')}>{row.cells?.[c]}</td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
});
