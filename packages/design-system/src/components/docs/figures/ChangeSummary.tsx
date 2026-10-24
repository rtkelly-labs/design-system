/**
 * Adapted from mdxcn by Keshav Bagaade, MIT licensed.
 * Source: https://github.com/keshav-exe/mdxcn/blob/2928126ba146ebbae9c2351deca27d27bb40e744/registry/default/graph-diff/graph-diff.tsx
 * The local port removes motion and graph variables while retaining the
 * source component's Markdown and `<Line>` data forms.
 */

import type { ReactNode } from 'react';
import * as React from 'react';
import {
  childItems,
  defineAsciiItem,
  AsciiFrameBody,
  AsciiFrameRule,
  hasHost,
  itemText,
  listItems,
  splitLabel,
  textOf,
  type FigurePalette,
} from './FigureFrame';
import { cn } from '../../../lib/recipe';
import { deltaSignificance, deltaTrend, trendTone, type DeltaSignificance, type MetricDirection } from '../../review/DeltaValue';

export type DiffSign = 'add' | 'remove' | 'keep';

export interface DiffRow {
  /** Falls back to the child text for `<Line value="31 kb">app</Line>`. */
  label?: string;
  value: string;
  sign?: DiffSign;
  /** The change relative to its baseline, as a signed fraction: `0.18` for +18%. Sizes the row's bar and decides whether it is noise. */
  relative?: number;
  /** Which way this row is preferred to move, overriding the summary's `direction`. */
  direction?: MetricDirection;
}

export interface DiffLineProps extends DiffRow {
  /** Draw the row under a rule as the total. */
  total?: boolean;
}

export interface ChangeSummaryProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Accessible name; the enclosing FigureFrame owns the caption. */
  label?: string;
  /** Data form. If omitted, the component reads Markdown or `<Line>` children. */
  rows?: DiffRow[];
  /** Optional typed total shown below the row rule. */
  footer?: DiffRow;
  /**
   * Which way the rows are preferred to move. Given one, a row reads as better (success) or worse
   * (danger) instead of as an addition or removal, and a tally of each leads the summary.
   */
  direction?: MetricDirection;
  /** Relative-change bands. Rows under `noise` are drawn quiet; rows at or over `major` heavy. */
  significance?: DeltaSignificance;
  /** Markdown list or `<Line>` content used to derive rows. */
  children?: ReactNode;
  /**
   * Accepted for symmetry with the other figures and ignored: additions and removals take the
   * `delta` roles, so a summary reads the same in a `multi` figure as in a `mono` one.
   */
  palette?: FigurePalette;
  /** Additional classes for this summary. */
  className?: string;
}

/** MDX-only diff item, for example `<Line sign="add" value="31 kb">app</Line>`. */
export const Line = defineAsciiItem<DiffLineProps>('Line');

function signOf(value: string): DiffSign | undefined {
  if (/^\+/.test(value.trim())) return 'add';
  if (/^[−-]/.test(value.trim())) return 'remove';
  return undefined;
}

/** A trailing `(+18%)` on a Markdown row is its relative change. */
function relativeOf(text: string): { text: string; relative?: number } {
  const match = /\s*\(([+−-]?\d+(?:\.\d+)?)\s*%\)\s*$/.exec(text);
  if (!match) return { text };
  return { text: text.slice(0, match.index), relative: Number(match[1]!.replace('−', '-')) / 100 };
}

function diffFromList(children: ReactNode): DiffLineProps[] {
  return listItems(children).map((item) => {
    const { label, rest: raw } = splitLabel(itemText(item));
    const { text: rest, relative } = relativeOf(raw);
    const content = (item.props as { children?: ReactNode }).children;
    return {
      label,
      value: rest.replace(/^[+−-]\s*/, '') || rest,
      sign: signOf(rest) ?? (relative ? (relative > 0 ? 'add' : 'remove') : undefined),
      relative,
      total: hasHost(content, ['strong', 'b']),
    };
  });
}

function lineText(row: DiffRow): string {
  return `${row.label ?? ''} ${row.value}`.trim();
}

function percent(relative: number): string {
  const value = Math.abs(relative * 100);
  return `${relative > 0 ? '+' : relative < 0 ? '−' : ''}${value < 10 ? Number(value.toFixed(1)) : Math.round(value)}%`;
}

const GRID = 'grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-baseline gap-x-3';

interface Judged {
  row: DiffRow & { label: string };
  sign: DiffSign;
  trend: 'against' | 'with' | undefined;
  size: 'noise' | 'notable' | 'major';
}

function judge(row: DiffRow & { label: string }, direction: MetricDirection | undefined, bands: DeltaSignificance | undefined): Judged {
  const sign = row.sign ?? 'keep';
  const change = sign === 'add' ? 1 : sign === 'remove' ? -1 : 0;
  return { row, sign, trend: deltaTrend(change, row.direction ?? direction), size: change === 0 ? 'noise' : deltaSignificance(row.relative, bands) };
}

function Row({ judged, scale, total = false }: { judged: Judged; scale: number; total?: boolean }) {
  const { row, sign, trend, size } = judged;
  const directed = trend != null;
  // Undirected change keeps the `delta` roles: it is an addition or a removal, not better or worse.
  const tone = directed ? trendTone(trend, size) : sign === 'add' ? 'text-delta-added' : sign === 'remove' ? 'text-delta-removed' : 'text-content-primary';
  const mark = sign === 'keep' ? ' ' : directed ? (sign === 'add' ? '▲' : '▼') : sign === 'add' ? '+' : '-';
  const heavy = directed && size === 'major';
  const bar = !total && row.relative != null && sign !== 'keep' ? Math.max(0.04, Math.min(1, Math.abs(row.relative) / scale)) : 0;
  const verdict = directed ? (size === 'noise' ? 'within noise' : trend === 'against' ? 'worse' : 'better') : sign;
  return (
    <li
      className={cn(GRID, 'gap-y-1', heavy && '-ml-2 border-l-4 pl-1', heavy && (trend === 'against' ? 'border-intent-danger' : 'border-intent-success'))}
      data-trend={trend}
      data-significance={directed ? size : undefined}
      aria-label={`${total ? 'total' : verdict}: ${lineText(row)}${row.relative != null ? ` (${percent(row.relative)})` : ''}`}
    >
      <span aria-hidden="true" className={cn('select-none text-center text-xs', sign === 'keep' ? 'text-content-muted' : tone)}>{mark}</span>
      <span className={cn(directed ? 'text-content-primary' : tone, heavy && 'font-bold', directed && size === 'noise' && 'text-content-secondary')}>{row.label}</span>
      <span className="flex items-baseline justify-end gap-2 whitespace-nowrap tabular-nums">
        <span className={cn(tone, heavy && 'text-lg font-bold')}>{row.value}</span>
        {row.relative != null ? <span className={cn('text-xs', directed && size !== 'noise' ? tone : 'text-content-muted')}>{percent(row.relative)}</span> : null}
      </span>
      {bar > 0 ? (
        <svg aria-hidden="true" viewBox="0 0 100 1" preserveAspectRatio="none" className="col-start-2 col-end-4 block h-1.5 w-full fill-surface-sunken">
          <rect width="100" height="1" />
          <rect width={bar * 100} height="1" className={directed ? (size === 'noise' ? 'fill-content-muted' : trend === 'against' ? 'fill-intent-danger' : 'fill-intent-success') : sign === 'add' ? 'fill-delta-added' : 'fill-delta-removed'} />
        </svg>
      ) : null}
    </li>
  );
}

/**
 * Renders additions, removals, and unchanged rows with a readable text summary.
 *
 * Given a `direction`, rows read as better or worse instead: colour says which way a row moved
 * against what is preferred, and its relative size says how loudly. A move under the noise band
 * stays quiet, a major one is bold with a rule beside it, and a bar under each row shows its
 * relative size against the largest move in the summary.
 */
export const ChangeSummary = React.forwardRef<HTMLDivElement, ChangeSummaryProps>(function ChangeSummary({ label = 'Change summary', rows: rowsProp, footer: footerProp, direction, significance, children, palette: _palette, className, ...rest }, ref) {
  const listed = diffFromList(children);
  const tagged = childItems(children, Line).map((entry) => ({ ...entry, label: entry.label ?? textOf(entry.children) }));
  const lines = listed.length > 0 ? listed : tagged;
  const rows = (rowsProp ?? lines.filter((entry) => !entry.total)).map((entry) => judge({ ...entry, label: entry.label ?? '' }, direction, significance));
  const footerLine = footerProp ?? lines.find((entry) => entry.total);
  const footer = footerLine ? judge({ ...footerLine, label: footerLine.label ?? '' }, direction, significance) : undefined;
  const scale = Math.max(1e-9, ...rows.map((r) => Math.abs(r.row.relative ?? 0)));
  const directed = rows.filter((r) => r.trend != null);
  const tally = [
    { word: 'worse', count: directed.filter((r) => r.size !== 'noise' && r.trend === 'against').length, tone: 'text-intent-danger' },
    { word: 'better', count: directed.filter((r) => r.size !== 'noise' && r.trend === 'with').length, tone: 'text-intent-success' },
    { word: 'within noise', count: directed.filter((r) => r.size === 'noise').length, tone: 'text-content-secondary' },
  ].filter((t) => t.count > 0);

  return (
      <AsciiFrameBody data-slot="change-summary" ref={ref} {...rest} className={cn('flex flex-col gap-3', className)}>
        {tally.length > 0 ? (
          <p data-slot="change-summary-tally" className="m-0 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold uppercase tracking-wider">
            {tally.map((t) => (
              <span key={t.word} className={t.tone}>
                <span className="text-base tabular-nums">{t.count}</span> {t.word}
              </span>
            ))}
          </p>
        ) : null}
        <ul className="flex flex-col gap-2.5" aria-label={label}>
          {rows.map((judged, index) => (
            <Row key={`${lineText(judged.row)}-${index}`} judged={judged} scale={scale} />
          ))}
        </ul>
        {footer ? <><AsciiFrameRule /><ul className="flex flex-col"><Row judged={footer} scale={scale} total /></ul></> : null}
        <span className="sr-only">{rows.length === 0 && !footer ? 'Empty diff.' : `${rows.length} changed row${rows.length === 1 ? '' : 's'}${footer ? `, total ${lineText(footer.row)}` : ''}.`}</span>
      </AsciiFrameBody>
  );
});
