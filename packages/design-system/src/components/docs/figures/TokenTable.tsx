import * as React from 'react';
import { cn } from '../../../lib/recipe';
import { Swatch } from '../../Swatch';

export interface TokenRow {
  /** The token's path, e.g. `text.muted`. */
  token: string;
  /** The value before the change. `null` reads as "did not exist". Omit when nothing changed. */
  before?: string | null;
  /** The value now. */
  after: string;
  /** One entry per `measures` heading, already formatted. */
  values?: readonly string[];
  /** Why this value, in a sentence. */
  note?: string;
}

export interface TokenTableProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Accessible name for the table. */
  label?: string;
  /** Headings for the measured columns, e.g. `WCAG`, `APCA Lc`. */
  measures?: readonly string[];
  /** One row per token. */
  rows: readonly TokenRow[];
  /** Additional classes for the scroll container. */
  className?: string;
}

const CELL = 'border-b border-edge-subtle px-3 py-2 align-top';
const HEAD = 'border-b-2 border-edge-strong px-3 pb-2 text-left font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em] text-content-muted';

function Chip({ value }: { value: string | null | undefined }) {
  if (value === undefined) return null;
  if (value === null) return <span className="font-mono text-xs text-content-muted">none</span>;
  return <Swatch value={value} name={value} size="sm" />;
}

/** Tokens with their values and measurements side by side, so a change is read as numbers, not taste. */
export const TokenTable = React.forwardRef<HTMLDivElement, TokenTableProps>(function TokenTable(
  { label = 'Tokens', measures = [], rows, className, ...rest },
  ref,
) {
  const hasBefore = rows.some((r) => r.before !== undefined);
  const hasNote = rows.some((r) => r.note);
  // Focusable and named because it scrolls on a narrow screen; `Table` says why.
  return (
    <div data-slot="token-table" ref={ref} role="region" tabIndex={0} aria-label={`${label} scroll area`} {...rest} className={cn('min-w-0 overflow-x-auto', className)}>
      <table aria-label={label} className="w-full min-w-[34rem] border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={HEAD}>Token</th>
            {hasBefore && <th scope="col" className={HEAD}>Before</th>}
            <th scope="col" className={HEAD}>{hasBefore ? 'After' : 'Value'}</th>
            {measures.map((m) => <th key={m} scope="col" className={HEAD}>{m}</th>)}
            {hasNote && <th scope="col" className={HEAD}>Note</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={`${r.token}-${ri}`}>
              <th scope="row" className={cn(CELL, 'text-left font-mono text-xs font-bold text-content-primary')}>{r.token}</th>
              {hasBefore && <td className={CELL}><Chip value={r.before} /></td>}
              <td className={CELL}><Chip value={r.after} /></td>
              {measures.map((m, i) => <td key={m} className={cn(CELL, 'font-mono text-xs tabular-nums text-content-secondary')}>{r.values?.[i] ?? <><span aria-hidden="true">—</span><span className="sr-only">not measured</span></>}</td>)}
              {hasNote && <td className={cn(CELL, 'text-content-secondary')}>{r.note}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      <span className="sr-only">{rows.length === 0 ? 'No tokens.' : `${rows.length} token${rows.length === 1 ? '' : 's'}.`}</span>
    </div>
  );
});
