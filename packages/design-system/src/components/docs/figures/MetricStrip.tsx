import * as React from 'react';
import { cn } from '../../../lib/recipe';

export type MetricTone = 'neutral' | 'success' | 'warning' | 'danger';

export interface Metric {
  /** The figure itself, already formatted, e.g. `5.5:1` or `+8.4%`. */
  value: string;
  /** What the figure counts, in a few words. */
  label: string;
  /** Colours the value by meaning. Defaults to `neutral`. */
  tone?: MetricTone;
}

export interface MetricStripProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Accessible name for the strip. */
  label?: string;
  /** Two to five metrics, left to right. */
  items: readonly Metric[];
  /** Additional classes for the strip. */
  className?: string;
}

const TONE: Record<MetricTone, string> = {
  neutral: 'text-content-primary',
  success: 'text-intent-success',
  warning: 'text-intent-warning',
  danger: 'text-intent-danger',
};

/** A row of headline figures, each with a short label, read before the detail. */
export const MetricStrip = React.forwardRef<HTMLDivElement, MetricStripProps>(function MetricStrip(
  { label = 'Metrics', items, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} role="group" aria-label={label} {...rest} className={cn('border-2 border-edge-strong', className)}>
      <dl className="m-0 grid grid-cols-2 sm:grid-flow-col sm:auto-cols-fr sm:grid-cols-none">
        {items.map((m) => (
          <div key={m.label} className="flex min-w-0 flex-col-reverse gap-1 border-b border-r border-edge-subtle p-3 last:border-r-0">
            <dt className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em] text-content-muted">{m.label}</dt>
            <dd className={cn('m-0 font-display text-xl font-extrabold tabular-nums', TONE[m.tone ?? 'neutral'])}>{m.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
});
