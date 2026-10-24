import type { ReactNode } from 'react';
import * as React from 'react';
import { cn } from '../../lib/recipe';

export interface ProvenanceItem {
  /** What the value is, in a few words: `Baseline commit`, `Trust`, `Comparator`. */
  label: string;
  /** The value. Digests and commits are drawn in mono and wrap anywhere rather than overflow. */
  value: ReactNode;
  /** One short line under the value, such as what a baseline role asks. */
  note?: ReactNode;
}

export interface ProvenanceStripProps extends React.HTMLAttributes<HTMLElement> {
  /** Accessible name for the strip. */
  label?: string;
  /** Each fact the result can be traced back to, in reading order. */
  items: readonly ProvenanceItem[];
  /** Additional classes for the strip. */
  className?: string;
}

/**
 * Where a result came from — subject, baseline role and commit, manifest digest, trust state,
 * producer and comparator — as a title block: one strong rule above, a hairline below, cells
 * spaced by a gutter, and no box — so a row that wraps reads the same as the first.
 *
 * Wider than `ReportDocument`'s `meta` line because a review's provenance is long (a forty-
 * character commit, a SHA-256 digest) and a reader checks it rather than skims it. A value that
 * was not recorded belongs here too, as a `StatusMark`, rather than being left out.
 */
export const ProvenanceStrip = React.forwardRef<HTMLElement, ProvenanceStripProps>(function ProvenanceStrip(
  { label = 'Provenance', items, className, ...rest },
  ref,
) {
  return (
    <section ref={ref} aria-label={label} data-slot="provenance-strip" {...rest} className={cn('border-y border-t-2 border-edge-subtle border-t-edge-strong', className)}>
      <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-x-8">
        {items.map((item, index) => (
          <div key={`${item.label}-${index}`} data-slot="provenance-strip-item" className="flex min-w-0 flex-col gap-1.5 py-3">
            <dt className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.08em] text-content-muted">{item.label}</dt>
            <dd className="m-0 font-mono text-sm text-content-primary [overflow-wrap:anywhere]">{item.value}</dd>
            {item.note != null ? <dd className="m-0 text-xs text-content-muted">{item.note}</dd> : null}
          </div>
        ))}
      </dl>
    </section>
  );
});
