/**
 * Adapted from mdxcn by Keshav Bagaade, MIT licensed.
 * Source: https://github.com/keshav-exe/mdxcn/blob/2928126ba146ebbae9c2351deca27d27bb40e744/registry/default/graph-uptime/graph-uptime.tsx
 * The local port removes motion and graph variables in favour of deterministic
 * rendering and the design system's semantic token classes.
 */

import * as React from 'react';
import { AsciiFrameBody, AsciiFrameTick, AsciiFrameTrack, resolveGlyphs, words, type Glyphs, type FigurePalette } from './FigureFrame';
import { cn } from '../../../lib/recipe';

export type UptimeStatus = 'ok' | 'degraded' | 'down' | 'empty';

export interface UptimeStripProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Accessible name; the enclosing FigureFrame owns the caption. */
  label?: string;
  /** `['ok', 'down']` or `'ok ok down'`; accepted values are ok, degraded, down, and empty. */
  days: UptimeStatus[] | string;
  /** Optional label for the first status mark. */
  from?: string;
  /** Optional label for the last status mark. */
  to?: string;
  /** Number of status marks per row. */
  columns?: number;
  /** Glyph set name or custom glyph sequence. */
  glyphs?: Glyphs;
  /** Accent palette used for health states. */
  palette?: FigurePalette;
  /** Additional classes for this strip. */
  className?: string;
}

function statusClass(palette: FigurePalette | undefined, status: UptimeStatus): string {
  if (status === 'ok') return 'text-accent-primary';
  if (status === 'degraded') return palette === 'multi' ? 'text-accent-secondary' : 'text-content-secondary';
  return 'text-content-muted';
}

/** Renders compact service health marks with a text summary for assistive technology. */
export const UptimeStrip = React.forwardRef<HTMLDivElement, UptimeStripProps>(function UptimeStrip({ label = 'Uptime', days: daysProp, from, to, columns = 30, glyphs, palette, className, ...rest }, ref) {
  const days = words<UptimeStatus>(daysProp);
  const known = days.filter((day) => day !== 'empty');
  const ok = known.filter((day) => day === 'ok').length;
  const percent = known.length === 0 ? 0 : Math.round((ok / known.length) * 100);
  const cols = Math.max(1, columns);
  const set = resolveGlyphs(glyphs);
  const last = set.length - 1;
  const mark: Record<UptimeStatus, string> = {
    ok: set[last] ?? '█',
    degraded: set[Math.min(2, last)] ?? '▒',
    down: set[0] ?? '·',
    empty: '-',
  };
  const rows: UptimeStatus[][] = [];
  for (let index = 0; index < days.length; index += cols) rows.push(days.slice(index, index + cols));

  return (
      <AsciiFrameBody ref={ref} {...rest} className={cn('flex flex-col items-start gap-4', className)}>
        <div className="flex w-fit max-w-full flex-col gap-4 overflow-x-auto" role="region" tabIndex={0} aria-label={`${label} status chart`}>
          <div aria-hidden="true" className="flex select-none flex-col gap-1">
            {rows.map((row, rowIndex) => (
              <div key={rowIndex}>
                <AsciiFrameTrack className="w-auto justify-start gap-0.5">
                  {row.map((day, index) => <AsciiFrameTick className={cn('flex-none', statusClass(palette, day))} key={`${rowIndex}-${index}`}>{mark[day]}</AsciiFrameTick>)}
                </AsciiFrameTrack>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="tabular-nums text-accent-primary">{percent}%</p>
            {from || to ? <p className="flex gap-3 text-content-muted">{from ? <span>{from}</span> : null}{to ? <span>{to}</span> : null}</p> : null}
          </div>
        </div>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-content-muted">
          <span><span className="text-accent-primary">{mark.ok}</span> up</span>
          <span><span className={statusClass(palette, 'degraded')}>{mark.degraded}</span> slow</span>
          <span><span className="text-content-muted">{mark.down}</span> down</span>
        </p>
        <span className="sr-only">{percent} percent uptime over {known.length} days{from && to ? `, ${from} to ${to}` : ''}.</span>
      </AsciiFrameBody>
  );
});
