import { Fragment, forwardRef, useId, useMemo, useState, useSyncExternalStore, type HTMLAttributes, type ReactNode } from 'react';
import { cn, recipe } from '../lib/recipe';
import {
  INCONCLUSIVE_REASON_TEXT,
  benchmarkDisplayUnit,
  formatRatio,
  formatPercent,
  formatRatioChange,
  formatSignificant,
  sortByImpact,
  type BenchmarkComparison,
} from '../lib/benchmark';
import { DeltaValue } from './review/DeltaValue';
import { StatusMark } from './review/StatusMark';

/** Every value each enumerable prop accepts, first the default — for stories and evaluation grids to iterate. */
export const BENCHMARK_COMPARE_VARIANTS = {
  sort: ['impact', 'input', 'name'],
  density: ['regular', 'compact'],
  plot: ['interval', 'none'],
} as const satisfies Record<string, readonly unknown[]>;

/** The order rows are drawn in. */
export type BenchmarkCompareSort = (typeof BENCHMARK_COMPARE_VARIANTS.sort)[number];

const PLOT = {
  regular: { width: 144, height: 22, pad: 6, radius: 3.25, cap: 5 },
  compact: { width: 136, height: 16, pad: 5, radius: 2.75, cap: 4 },
} as const;

/** Candidate ratios printed under the axis, when inside the domain. */
const RATIO_TICKS = [0.25, 0.5, 0.67, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 2, 4];

const benchmarkCompare = recipe({
  slots: {
    root: 'flex min-w-0 flex-col gap-2 font-mono text-xs text-content-primary',
    summary: 'flex flex-wrap gap-x-4 gap-y-1 text-content-secondary',
    frame: 'overflow-x-auto border-t-2 border-edge-strong',
    table: 'w-full border-collapse text-sm [&_tbody_tr:last-child>*]:border-b-0',
    caption: 'px-3 py-2.5 text-left font-mono text-xs font-bold uppercase tracking-wider text-content-muted',
    head: 'border-b border-edge-default px-3 py-2 text-left align-bottom font-mono text-xs font-bold uppercase tracking-wider text-content-muted',
    sortButton: 'cursor-pointer appearance-none border-0 bg-transparent p-0 font-[inherit] uppercase tracking-[inherit] text-[inherit] underline decoration-dotted underline-offset-4 hover:text-content-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary',
    name: 'border-b border-edge-subtle px-3 py-2 text-left align-top font-mono font-normal text-content-primary min-w-44',
    cell: 'border-b border-edge-subtle px-3 py-2 align-top',
    note: 'mt-1 block text-xs text-content-muted',
    empty: 'border border-dashed border-edge-default px-3 py-6 text-center text-content-muted',
  },
  variants: {
    density: {
      regular: {},
      compact: { name: 'py-1 text-xs', cell: 'py-1 text-xs', head: 'py-1.5' },
    },
  },
});

export interface BenchmarkCompareProps extends HTMLAttributes<HTMLDivElement> {
  /** One comparison per benchmark, from `compareBenchmarks` or an equivalent producer. Drawn as given; never recomputed. */
  comparisons: readonly BenchmarkComparison[];
  /**
   * The order rows are drawn in, including in a static render: `impact` (default) puts regressions
   * first, then improvements, inconclusive and unchanged, each largest first; `input` keeps the
   * given order; `name` is alphabetical. Once hydrated, the column headers re-sort.
   */
  sort?: BenchmarkCompareSort;
  /** `compact` tightens the rows and the interval plot. Default `regular`. */
  density?: 'regular' | 'compact';
  /** `interval` (default) draws each ratio's interval over the noise band; `none` leaves the numbers alone. */
  plot?: 'interval' | 'none';
  /**
   * The ratio range the interval plots share, `[low, high]`. Default: wide enough for every interval
   * and the band, symmetric around 1× on a log scale so 0.5× and 2× sit the same distance out.
   */
  domain?: readonly [low: number, high: number];
  /** A caption above the table, e.g. the suite and the two commits. */
  caption?: string;
}

const subscribeNever = () => () => {};
const isClient = () => true;
const isServer = () => false;

/** A dotted benchmark name with break opportunities after `.`, `(` and `,`, so it wraps at its parts. */
function breakable(name: string): ReactNode {
  const parts = name.split(/(?<=[.(,])/);
  return parts.map((part, index) => (
    <Fragment key={index}>
      {part}
      {index < parts.length - 1 ? <wbr /> : null}
    </Fragment>
  ));
}

/** The sort applied to a list, stable. */
function ordered(comparisons: readonly BenchmarkComparison[], sort: BenchmarkCompareSort): readonly BenchmarkComparison[] {
  if (sort === 'impact') return sortByImpact(comparisons);
  if (sort === 'name') return [...comparisons].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  return comparisons;
}

/** A log-symmetric ratio domain covering every interval, estimate and band edge. */
function sharedDomain(comparisons: readonly BenchmarkComparison[]): [number, number] {
  let reach = Math.log(1.1);
  for (const c of comparisons) {
    for (const value of [c.band.low, c.band.high, c.ratio, c.interval?.low, c.interval?.high]) {
      if (value != null && value > 0 && Number.isFinite(value)) reach = Math.max(reach, Math.abs(Math.log(value)));
    }
  }
  const m = Math.exp(reach * 1.12);
  return [1 / m, m];
}

/** StatusMark props for a classification: the `delta` vocabulary, with the benchmark's own word. */
function statusFor(classification: BenchmarkComparison['classification']) {
  if (classification === 'slower' || classification === 'faster') return { status: 'changed' as const, label: classification };
  return { status: classification, label: undefined };
}

function IntervalPlot({ comparison, domain, density }: { comparison: BenchmarkComparison; domain: readonly [number, number]; density: 'regular' | 'compact' }) {
  const g = PLOT[density] ?? PLOT.regular;
  const lo = Math.log(domain[0]);
  const hi = Math.log(domain[1]);
  const inner = g.width - g.pad * 2;
  const clamp = (value: number) => Math.max(domain[0], Math.min(domain[1], value));
  const x = (ratio: number) => g.pad + ((Math.log(clamp(ratio)) - lo) / (hi - lo || 1)) * inner;
  const mid = g.height / 2;
  const { interval, ratio, band, classification } = comparison;
  const conclusive = classification !== 'inconclusive';
  const estimate = interval?.estimate ?? ratio;
  const clipped = interval ? interval.low < domain[0] || interval.high > domain[1] : false;
  return (
    <svg
      data-slot="benchmark-compare-interval"
      data-clipped={clipped || undefined}
      viewBox={`0 0 ${g.width} ${g.height}`}
      width={g.width}
      height={g.height}
      aria-hidden="true"
      className="block shrink-0 overflow-visible"
    >
      <rect data-part="band" x={x(band.low)} y={0} width={Math.max(0, x(band.high) - x(band.low))} height={g.height} className="fill-content-muted" fillOpacity={0.16} />
      <line data-part="reference" x1={x(1)} x2={x(1)} y1={0} y2={g.height} className="stroke-edge-strong" strokeWidth={1} />
      {interval ? (
        <g data-part="whisker" className={conclusive ? 'stroke-content-primary' : 'stroke-content-muted'} strokeWidth={1.5} strokeDasharray={conclusive ? undefined : '3 2'}>
          <line x1={x(interval.low)} x2={x(interval.high)} y1={mid} y2={mid} />
          <line x1={x(interval.low)} x2={x(interval.low)} y1={mid - g.cap / 2} y2={mid + g.cap / 2} strokeDasharray={undefined} />
          <line x1={x(interval.high)} x2={x(interval.high)} y1={mid - g.cap / 2} y2={mid + g.cap / 2} strokeDasharray={undefined} />
        </g>
      ) : null}
      {estimate != null && Number.isFinite(estimate) ? (
        <circle
          data-part="estimate"
          cx={x(estimate)}
          cy={mid}
          r={g.radius}
          strokeWidth={1.5}
          className={cn('stroke-content-primary', conclusive ? 'fill-content-primary' : 'fill-surface-base')}
        />
      ) : null}
    </svg>
  );
}

function IntervalAxis({ domain, density }: { domain: readonly [number, number]; density: 'regular' | 'compact' }) {
  const g = PLOT[density] ?? PLOT.regular;
  const lo = Math.log(domain[0]);
  const hi = Math.log(domain[1]);
  const x = (ratio: number) => g.pad + ((Math.log(ratio) - lo) / (hi - lo || 1)) * (g.width - g.pad * 2);
  // Keep ticks at least ~30 units apart, 1× always.
  const ticks: number[] = [];
  for (const tick of RATIO_TICKS.filter((t) => t >= domain[0] && t <= domain[1]).sort((a, b) => Math.abs(Math.log(a)) - Math.abs(Math.log(b)))) {
    if (ticks.every((other) => Math.abs(x(other) - x(tick)) >= 30)) ticks.push(tick);
  }
  return (
    <svg data-slot="benchmark-compare-axis" viewBox={`0 0 ${g.width} 12`} width={g.width} height={12} aria-hidden="true" className="mt-1 block shrink-0 overflow-visible">
      {ticks.map((tick) => (
        <text key={tick} x={x(tick)} y={10} textAnchor="middle" fontSize={9} className={tick === 1 ? 'fill-content-secondary' : 'fill-content-muted'}>{`${tick}×`}</text>
      ))}
    </svg>
  );
}

/**
 * Benchmarks compared baseline against candidate, one row each: the medians as a `DeltaValue`,
 * the ratio with its confidence interval — drawn as a point and whisker over a 1× line and a
 * shaded noise band — the sample sizes, and the classification as a `StatusMark`.
 *
 * It draws comparisons and never makes them: pass the output of `compareBenchmarks`, or the same
 * shape from another producer. `inconclusive` is a first-class row, with its reason printed, and
 * its interval is dashed and its point hollow — a small or straddling run looks unfinished rather
 * than quietly passing. The `DeltaValue` only takes the metric's direction when the row is
 * conclusive, so a noise-sized difference is not drawn heavier than it deserves.
 *
 * Static-first: the default `impact` order, the plots and every number are in the server render.
 * Sorting by the column headers is an enhancement that appears once the page hydrates.
 */
export const BenchmarkCompare = forwardRef<HTMLDivElement, BenchmarkCompareProps>(function BenchmarkCompare(
  { comparisons, sort: sortProp = 'impact', density = 'regular', plot = 'interval', domain: domainProp, caption, className, ...props },
  ref,
) {
  const id = useId();
  const styles = benchmarkCompare({ density });
  // A reader's choice holds until the `sort` prop itself changes.
  const [chosen, setChosen] = useState<{ base: BenchmarkCompareSort; sort: BenchmarkCompareSort } | null>(null);
  const sort = chosen && chosen.base === sortProp ? chosen.sort : sortProp;
  const setSort = (next: BenchmarkCompareSort) => setChosen({ base: sortProp, sort: next });
  // False on the server and in a static render, true once hydrated: the sort buttons are an enhancement.
  const enhanced = useSyncExternalStore(subscribeNever, isClient, isServer);
  const rows = useMemo(() => ordered(comparisons, sort), [comparisons, sort]);
  const domain = useMemo(() => domainProp ?? sharedDomain(comparisons), [domainProp, comparisons]);

  if (!comparisons.length) {
    return (
      <div ref={ref} data-slot="benchmark-compare" data-empty="" {...props} className={styles.root({ className })}>
        <p className={styles.empty()}>No benchmarks.</p>
      </div>
    );
  }

  const counts = { slower: 0, faster: 0, inconclusive: 0, unchanged: 0 };
  for (const c of comparisons) counts[c.classification] += 1;
  const thresholds = [...new Set(comparisons.map((c) => c.threshold))];
  const levels = [...new Set(comparisons.flatMap((c) => (c.interval ? [c.interval.level] : [])))];
  const methods = [...new Set(comparisons.flatMap((c) => (c.interval ? [c.interval.method] : [])))];
  const summaryParts = [
    `${comparisons.length} ${comparisons.length === 1 ? 'benchmark' : 'benchmarks'}`,
    `${counts.slower} slower`,
    `${counts.faster} faster`,
    `${counts.inconclusive} inconclusive`,
    `${counts.unchanged} unchanged`,
    thresholds.length === 1 ? `noise ±${formatPercent(thresholds[0]!)}` : 'noise thresholds vary',
    levels.length === 1 ? `${formatPercent(levels[0]!)} intervals${methods.length === 1 ? ` (${methods[0]})` : ''}` : null,
  ].filter((part): part is string => part !== null);

  const header = (label: string, key: BenchmarkCompareSort) =>
    enhanced ? (
      <button type="button" className={styles.sortButton()} aria-describedby={`${id}-sort`} onClick={() => setSort(sort === key ? 'input' : key)}>
        {label}
      </button>
    ) : (
      label
    );
  const ariaSort = (key: BenchmarkCompareSort, order: 'ascending' | 'descending') => (sort === key ? order : undefined);

  return (
    <div ref={ref} data-slot="benchmark-compare" data-sort={sort} {...props} className={styles.root({ className })}>
      <p data-part="summary" className={styles.summary()}>
        {summaryParts.map((part) => (
          <span key={part}>{part}</span>
        ))}
      </p>
      {enhanced ? (
        <p id={`${id}-sort`} className="sr-only">
          Sorts the table. Press again to return to the input order.
        </p>
      ) : null}
      <div className={styles.frame()}>
        <table className={styles.table()}>
          {caption ? <caption className={styles.caption()}>{caption}</caption> : null}
          <thead>
            <tr>
              <th scope="col" aria-sort={ariaSort('name', 'ascending')} className={styles.head()}>
                {header('Benchmark', 'name')}
              </th>
              <th scope="col" className={styles.head()}>Median, baseline → candidate</th>
              <th scope="col" aria-sort={ariaSort('impact', 'descending')} className={cn(styles.head(), 'text-right')}>
                {header('Ratio', 'impact')}
              </th>
              {plot === 'interval' ? (
                <th scope="col" className={styles.head()}>
                  <span className="sr-only">Interval plot</span>
                  <IntervalAxis domain={domain} density={density} />
                </th>
              ) : null}
              <th scope="col" className={cn(styles.head(), 'text-right')}>n</th>
              <th scope="col" className={styles.head()}>Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const display = benchmarkDisplayUnit(c.baseline?.median ?? c.candidate?.median ?? Number.NaN, c.unit);
              const scaled = (value: number | undefined) => (value != null && Number.isFinite(value) ? value / display.factor : null);
              const conclusive = c.classification !== 'inconclusive';
              const mark = statusFor(c.classification);
              const intervalText = c.interval
                ? `${formatPercent(c.interval.level)} ${formatRatio(c.interval.low)}–${formatRatio(c.interval.high)}`
                : 'no interval';
              return (
                <tr key={c.id} data-slot="benchmark-compare-row" data-classification={c.classification} data-reason={c.reason}>
                  <th scope="row" className={styles.name()}>{breakable(c.name)}</th>
                  <td className={styles.cell()}>
                    <DeltaValue
                      before={scaled(c.baseline?.n ? c.baseline.median : undefined)}
                      after={scaled(c.candidate?.n ? c.candidate.median : undefined)}
                      unit={display.unit}
                      direction={conclusive ? c.direction : undefined}
                      format={formatSignificant}
                    />
                  </td>
                  <td className={cn(styles.cell(), 'text-right tabular-nums')}>
                    <span className={conclusive ? 'font-bold' : 'text-content-secondary'}>{formatRatio(c.ratio)}</span>
                    <span className={styles.note()}>
                      {c.ratio !== null ? <span className="whitespace-nowrap">{formatRatioChange(c.ratio)}</span> : null}
                      <span className="block whitespace-nowrap">{intervalText}</span>
                    </span>
                  </td>
                  {plot === 'interval' ? (
                    <td className={styles.cell()}>
                      <IntervalPlot comparison={c} domain={domain} density={density} />
                    </td>
                  ) : null}
                  <td className={cn(styles.cell(), 'whitespace-nowrap text-right tabular-nums text-content-secondary')}>
                    <span aria-hidden="true">{`${c.baseline?.n ?? 0} / ${c.candidate?.n ?? 0}`}</span>
                    <span className="sr-only">{`${c.baseline?.n ?? 0} baseline samples, ${c.candidate?.n ?? 0} candidate samples`}</span>
                  </td>
                  <td className={styles.cell()}>
                    <StatusMark vocabulary="delta" status={mark.status} label={mark.label} />
                    {c.reason ? <span className={styles.note()}>{INCONCLUSIVE_REASON_TEXT[c.reason]}</span> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

BenchmarkCompare.displayName = 'BenchmarkCompare';
