import * as React from 'react';
import { cn } from '../../../lib/recipe';
import type { ThemeLevel } from '../../../theme/levels';
import { Swatch } from '../../Swatch';

export type VerdictTone = 'neutral' | 'success' | 'warning' | 'info';

export interface SwatchColumn {
  /** Column heading, usually a hue or a role. */
  name: string;
  /** Short verdict under the column, e.g. `kept`, `lifted`, `new`. */
  verdict?: string;
  /** How the verdict reads. Defaults to `neutral`. */
  tone?: VerdictTone;
}

export interface SwatchRow {
  /** Row label, e.g. `Today` or `Now`. */
  label: string;
  /** One CSS colour per column, or `null` where no value exists. */
  values: readonly (string | null)[];
}

export interface SwatchCompareProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Accessible name for the comparison table. */
  label?: string;
  /** Paint the swatches on this Level's ground. Omit to use the page's. */
  level?: ThemeLevel;
  /** The columns, left to right. */
  columns: readonly SwatchColumn[];
  /** One row per state being compared, top to bottom. */
  rows: readonly SwatchRow[];
  /** Additional classes for the outer frame. */
  className?: string;
}

const VERDICT: Record<VerdictTone, string> = {
  neutral: 'border-edge-default text-content-secondary',
  success: 'border-intent-success text-intent-success',
  warning: 'border-intent-warning text-intent-warning',
  info: 'border-intent-info text-intent-info',
};

/** Rows of colour across named columns, so a reader compares a palette before and after a change. */
export const SwatchCompare = React.forwardRef<HTMLDivElement, SwatchCompareProps>(function SwatchCompare(
  { label = 'Colour comparison', level, columns, rows, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} {...rest} data-theme={level} className={cn('min-w-0 overflow-x-auto bg-surface-sunken p-3', className)}>
      <table aria-label={label} className="w-full border-collapse font-mono text-xs">
        <thead>
          <tr>
            <th scope="col" className="sr-only">State</th>
            {columns.map((c) => (
              <th key={c.name} scope="col" className="px-1 pb-2 text-center font-bold uppercase tracking-[0.08em] text-content-muted">
                {c.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row" className="pr-3 text-left font-bold uppercase tracking-[0.08em] text-content-muted">{row.label}</th>
              {columns.map((c, i) => {
                const value = row.values[i] ?? null;
                return (
                  <td key={c.name} className="px-1 py-1 align-top">
                    {value === null ? (
                      <>
                        <span aria-hidden="true" className="block h-10 w-full border-2 border-dashed border-edge-subtle" />
                        <span className="sr-only">{`${row.label}: no ${c.name}`}</span>
                      </>
                    ) : (
                      <Swatch value={value} name={value} size="md" className="flex-col items-start gap-1 [&>[data-slot=swatch-well]]:w-full" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          {columns.some((c) => c.verdict) && (
            <tr>
              <th scope="row" className="sr-only">Verdict</th>
              {columns.map((c) => (
                <td key={c.name} className="px-1 pt-2 text-center">
                  {c.verdict && (
                    <span className={cn('inline-block border-2 px-1 py-0.5 font-bold uppercase', VERDICT[c.tone ?? 'neutral'])}>{c.verdict}</span>
                  )}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
});
