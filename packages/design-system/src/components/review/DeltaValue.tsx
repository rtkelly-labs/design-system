import * as React from 'react';
import { cn } from '../../lib/recipe';

/** Which way a measurement is preferred to move. Omit when neither is. */
export type MetricDirection = 'higher-is-better' | 'lower-is-better';

export interface DeltaValueProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The baseline's value. `null` or omitted when the measurement is new. */
  before?: number | null;
  /** The candidate's value. `null` or omitted when the measurement is gone. */
  after?: number | null;
  /** Printed after each value, e.g. `kB` or `ms`. */
  unit?: string;
  /** The measurement's declared direction. Drives the ▲/▼ emphasis, never a colour. */
  direction?: MetricDirection;
  /** Also print the relative change. A zero baseline prints `n/a` rather than infinity. */
  relative?: boolean;
  /** Formats each number. Defaults to a fixed `en` grouping, so output does not vary by machine. */
  format?: (value: number) => string;
  /** Additional classes for the value. */
  className?: string;
}

const DEFAULT_FORMAT = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });

function signed(value: number, format: (value: number) => string): string {
  if (value > 0) return `+${format(value)}`;
  if (value < 0) return `−${format(-value)}`;
  return format(0);
}

/** `against` when the change moves away from the preferred direction, `with` when toward it. */
export function deltaTrend(change: number, direction?: MetricDirection): 'against' | 'with' | undefined {
  if (direction == null || change === 0) return undefined;
  const up = change > 0;
  return (direction === 'lower-is-better') === up ? 'against' : 'with';
}

/**
 * A measured change, `before → after +n`, the form a numeric Delta reports.
 *
 * Direction is a fact about the metric, not a verdict, so it changes emphasis and never colour:
 * a move against the preferred direction is drawn heavier with ▲ or ▼, a move with it lighter.
 * Whether either is acceptable is left to the Assessment. A new or missing measurement says so
 * in words, and a zero baseline makes the relative change `n/a` rather than an infinite percent.
 */
export const DeltaValue = React.forwardRef<HTMLSpanElement, DeltaValueProps>(function DeltaValue(
  { before, after, unit, direction, relative = false, format = DEFAULT_FORMAT.format, className, ...rest },
  ref,
) {
  const withUnit = (value: number) => (unit ? `${format(value)} ${unit}` : format(value));
  const base = 'inline-flex items-baseline gap-1.5 whitespace-nowrap font-mono text-sm tabular-nums';

  if (before == null && after == null) {
    return (
      <span ref={ref} data-slot="delta-value" data-state="unmeasured" {...rest} className={cn(base, 'text-content-muted', className)}>
        <span aria-hidden="true">—</span>
        <span className="sr-only">not measured</span>
      </span>
    );
  }
  if (before == null) {
    return (
      <span ref={ref} data-slot="delta-value" data-state="new" {...rest} className={cn(base, 'text-content-primary', className)}>
        <span className="text-xs font-bold uppercase tracking-wider text-content-muted">new</span>
        <span>{withUnit(after!)}</span>
      </span>
    );
  }
  if (after == null) {
    return (
      <span ref={ref} data-slot="delta-value" data-state="missing" {...rest} className={cn(base, 'text-content-secondary', className)}>
        <span className="line-through">{withUnit(before)}</span>
        <span className="text-xs font-bold uppercase tracking-wider text-content-muted">gone</span>
      </span>
    );
  }

  const change = after - before;
  if (change === 0) {
    return (
      <span ref={ref} data-slot="delta-value" data-state="unchanged" {...rest} className={cn(base, 'text-content-muted', className)}>
        <span>{withUnit(after)}</span>
        <span aria-hidden="true">=</span>
        <span className="sr-only">unchanged</span>
      </span>
    );
  }

  const trend = deltaTrend(change, direction);
  const rel = relative ? (before === 0 ? 'n/a' : `${signed((change / Math.abs(before)) * 100, (v) => DEFAULT_FORMAT.format(Number(v.toFixed(1))))}%`) : null;
  return (
    <span ref={ref} data-slot="delta-value" data-state="changed" data-trend={trend} {...rest} className={cn(base, 'text-content-primary', className)}>
      <span className="text-content-secondary">{withUnit(before)}</span>
      <span aria-hidden="true" className="text-content-muted">→</span>
      <span className="sr-only">to</span>
      <span>{withUnit(after)}</span>
      <span data-slot="delta-value-change" className={cn(trend === 'against' ? 'font-bold text-content-primary' : 'text-content-secondary')}>
        {signed(change, format)}
        {rel != null ? <span className="pl-1 text-content-muted">({rel})</span> : null}
      </span>
      {trend ? (
        <>
          <span aria-hidden="true" className="text-xs">{change > 0 ? '▲' : '▼'}</span>
          <span className="sr-only">{trend === 'against' ? `, against the preferred direction (${direction?.replace(/-/g, ' ')})` : `, with the preferred direction (${direction?.replace(/-/g, ' ')})`}</span>
        </>
      ) : null}
    </span>
  );
});
