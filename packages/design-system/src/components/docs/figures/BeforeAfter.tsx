/**
 * Adapted from mdxcn by Keshav Bagaade, MIT licensed.
 * Source: https://github.com/keshav-exe/mdxcn/blob/2928126ba146ebbae9c2351deca27d27bb40e744/registry/default/graph-slope/graph-slope.tsx
 * The local port removes motion and graph variables while preserving the
 * before/after data API and Markdown-friendly child syntax.
 */

import type { ReactNode } from 'react';
import * as React from 'react';
import {
  childItems,
  defineAsciiItem,
  AsciiFrameBody,
  itemText,
  listItems,
  numberOf,
  splitLabel,
  textOf,
  type FigurePalette,
} from './FigureFrame';
import { cn } from '../../../lib/recipe';

export interface SlopeItem {
  /** Falls back to the child text for `<Slope from={160} to={142}>read</Slope>`. */
  label?: string;
  from: number | string;
  to: number | string;
}

export interface BeforeAfterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Accessible name; the enclosing FigureFrame owns the caption. */
  label?: string;
  /** Header for the before-value column. */
  fromLabel: string;
  /** Header for the after-value column. */
  toLabel: string;
  /** Data form. If omitted, the component reads Markdown or `<Slope>` children. */
  items?: SlopeItem[];
  /** Markdown list or `<Slope>` content used to derive items. */
  children?: ReactNode;
  /** Accent palette used for directional change. */
  palette?: FigurePalette;
  /** Additional classes for this comparison. */
  className?: string;
}

/** MDX-only slope item, for example `<Slope from={8200} to={12400}>docs</Slope>`. */
export const Slope = defineAsciiItem<SlopeItem>('Slope');

type SlopeRow = { label: string; from: number; to: number; fromDisplay: string; toDisplay: string };

function format(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: Number.isInteger(value) ? 0 : 1 });
}

function displayOf(value: number | string): string {
  return typeof value === 'number' ? format(value) : value.trim();
}

function itemsOf(children: ReactNode): SlopeItem[] {
  const listed = listItems(children).map((item) => {
    const { label, rest } = splitLabel(itemText(item));
    const [from = '', to = ''] = rest.split(/\s*(?:→|->|—>|=>)\s*/);
    return { label, from, to };
  });
  if (listed.length > 0) return listed;
  return childItems(children, Slope).map((entry) => ({ ...entry, label: entry.label ?? textOf(entry.children) }));
}

/** Renders paired values with directional change and an accessible row label. */
export const BeforeAfter = React.forwardRef<HTMLDivElement, BeforeAfterProps>(function BeforeAfter({ label = 'Before and after', fromLabel, toLabel, items: itemsProp, children, palette, className, ...rest }, ref) {
  const items: SlopeRow[] = (itemsProp ?? itemsOf(children)).map((entry) => ({
    label: entry.label ?? '',
    from: numberOf(entry.from),
    to: numberOf(entry.to),
    fromDisplay: displayOf(entry.from),
    toDisplay: displayOf(entry.to),
  }));

  return (
      <AsciiFrameBody ref={ref} {...rest} className={cn('flex flex-col gap-3', className)}>
        <div className="grid grid-cols-[minmax(0,1fr)_6.5rem_2rem_6.5rem] items-end gap-x-3">
          <span />
          <span className="text-right text-content-muted">{fromLabel}</span>
          <span />
          <span className="text-right text-content-muted">{toLabel}</span>
        </div>
        <ul className="flex flex-col gap-2" aria-label={label}>
          {items.map((row, index) => {
            const up = row.to > row.from;
            const down = row.to < row.from;
            const tone = up ? 'text-accent-primary' : down ? palette === 'multi' ? 'text-accent-secondary' : 'text-content-secondary' : 'text-content-primary';
            return (
              <li className="grid grid-cols-[minmax(0,1fr)_6.5rem_2rem_6.5rem] items-baseline gap-x-3" key={`${row.label}-${index}`} aria-label={`${row.label} from ${row.fromDisplay} to ${row.toDisplay}`}>
                <span className="truncate text-content-primary">{row.label}</span>
                <span className="text-right tabular-nums text-content-muted">{row.fromDisplay}</span>
                <span aria-hidden="true" className={cn('select-none text-center', tone)}>{up || down ? '→' : '–'}</span>
                <span className={cn('text-right tabular-nums', tone)}>{row.toDisplay}</span>
              </li>
            );
          })}
        </ul>
        <span className="sr-only">{items.length === 0 ? 'Empty comparison.' : `${items.length} before and after comparison${items.length === 1 ? '' : 's'}.`}</span>
      </AsciiFrameBody>
  );
});
