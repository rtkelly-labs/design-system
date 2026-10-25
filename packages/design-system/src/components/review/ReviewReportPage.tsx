import type { ReactNode } from 'react';
import * as React from 'react';
import { cn } from '../../lib/recipe';
import { ReportDocument, ReportSection, type ReportMetaItem } from '../ReportDocument';
import { ChangeIndex } from './ChangeIndex';
import { DeltaValue, type MetricDirection } from './DeltaValue';
import { DiffView } from './DiffView';
import { KeyedDiff, type KeyedChange } from './KeyedDiff';
import { ProvenanceStrip, type ProvenanceItem } from './ProvenanceStrip';
import { VerdictBand } from './VerdictBand';
import { countDiff, type DiffHunk } from './diff';
import type { AssessmentOutcome } from './vocabulary';

/** One measured value: the baseline's and the candidate's. A `direction` here overrides the column's. */
export interface ReviewValue {
  before?: number | null;
  after?: number | null;
  direction?: MetricDirection;
  unit?: string;
}

export interface ReviewColumn {
  /** The measurement's name. Its direction, if any, is printed beside it. */
  label: string;
  direction?: MetricDirection;
  unit?: string;
}

/** A table of numeric deltas, one row per subject, one column per measurement. */
export interface ReviewMeasurementTable {
  caption: string;
  /** Heading for the subject column. */
  identityLabel: string;
  columns: readonly ReviewColumn[];
  rows: readonly { identity: string; values: readonly ReviewValue[] }[];
}

/** Records compared by stable identity, each with its measured values. */
export interface ReviewRecordTable {
  caption: string;
  identityLabel: string;
  columns: readonly ReviewColumn[];
  rows: readonly { identity: string; change: KeyedChange; values: readonly ReviewValue[] }[];
}

/** A group of changed files, each with its hunks. */
export interface ReviewFileGroup {
  title: string;
  files: readonly { path: string; hunks: readonly DiffHunk[] }[];
}

/** Everything a review report shows, in the order it shows it. */
export interface ReviewReportData {
  title: string;
  /** One line saying what was compared. */
  subtitle?: string;
  /** The header strip: comparator, Delta status, policy. */
  meta?: readonly ReportMetaItem[];
  /** The Assessment's outcome, or `none` when no policy ran. */
  outcome: AssessmentOutcome;
  /** The verdict line. */
  verdict: string;
  /** One line of context under it. */
  verdictContext?: string;
  /** What the result can be traced back to. */
  provenance: readonly ProvenanceItem[];
  /** Headline counts, read before the detail. */
  figures?: readonly { label: string; value: string; note?: string }[];
  /** Numeric deltas. */
  measurements?: readonly ReviewMeasurementTable[];
  /** Records compared by stable identity. */
  records?: ReviewRecordTable;
  /** Methodology or coverage notes that qualify a measurement. Never a verdict. */
  caveats?: readonly { title: string; body: ReactNode }[];
  /** The changed files, grouped. */
  files: readonly ReviewFileGroup[];
}

export interface ReviewReportPageProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /** The report to draw. `DEFAULT_REVIEW_REPORT` is a real comparison to start from. */
  report: ReviewReportData;
  /** Additional classes for the document. */
  className?: string;
}

const DIRECTION_MARK: Record<MetricDirection, string> = { 'lower-is-better': '↓', 'higher-is-better': '↑' };

function ColumnHead({ column }: { column: ReviewColumn }) {
  return (
    <th scope="col" className="whitespace-nowrap border-b border-edge-default px-3 py-2 text-right font-mono text-xs font-bold uppercase tracking-wider text-content-muted">
      {column.label}
      {column.direction ? (
        <>
          <span aria-hidden="true" className="pl-1">{DIRECTION_MARK[column.direction]}</span>
          <span className="sr-only">{`, ${column.direction.replace(/-/g, ' ')}`}</span>
        </>
      ) : null}
    </th>
  );
}

function valueCell(column: ReviewColumn, value: ReviewValue | undefined, key: React.Key) {
  return (
    <DeltaValue
      key={key}
      before={value?.before}
      after={value?.after}
      direction={value?.direction ?? column.direction}
      unit={value?.unit ?? column.unit}
    />
  );
}

function MeasurementTable({ table }: { table: ReviewMeasurementTable }) {
  return (
    <div data-slot="review-report-measurements" className="overflow-x-auto border-t-2 border-edge-strong">
      <table className="w-full border-collapse text-sm [&_tbody_tr:last-child>*]:border-b-0">
        <caption className="px-3 py-2.5 text-left font-mono text-xs font-bold uppercase tracking-wider text-content-muted">{table.caption}</caption>
        <thead>
          <tr>
            <th scope="col" className="border-b border-edge-default px-3 py-2 text-left font-mono text-xs font-bold uppercase tracking-wider text-content-muted">{table.identityLabel}</th>
            {table.columns.map((column) => (
              <ColumnHead key={column.label} column={column} />
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.identity}>
              <th scope="row" className="border-b border-edge-subtle px-3 py-2 text-left font-mono font-normal text-content-primary">{row.identity}</th>
              {table.columns.map((column, c) => (
                <td key={column.label} className="border-b border-edge-subtle px-3 py-2 text-right">{valueCell(column, row.values[c], c)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * A whole review report, the document a comparison tool such as Diffra emits: the verdict, its
 * provenance, headline figures, numeric deltas with their directions, records by stable identity,
 * methodology caveats, then every changed file indexed and drawn as a line diff.
 *
 * Static-safe throughout, so it renders the same in an application and in a `ds-report` file.
 * The largest file opens by default; the rest fold. Change is drawn in the `delta` roles and only
 * the verdict and status marks use `intent`.
 */
export const ReviewReportPage = React.forwardRef<HTMLElement, ReviewReportPageProps>(function ReviewReportPage(
  { report, className, ...rest },
  ref,
) {
  const sized = report.files.map((group) => ({
    title: group.title,
    files: group.files.map((file) => ({ ...file, ...countDiff(file.hunks) })),
  }));
  const all = sized.flatMap((group) => group.files);
  const max = Math.max(1, ...all.map((file) => file.added + file.removed));
  const largest = all.reduce<(typeof all)[number] | undefined>((best, file) => (!best || file.added + file.removed > best.added + best.removed ? file : best), undefined);

  return (
    <ReportDocument
      ref={ref}
      data-slot="review-report-page"
      title={report.title}
      subtitle={report.subtitle}
      meta={report.meta}
      {...rest}
      className={cn('max-w-6xl', className)}
    >
      <VerdictBand outcome={report.outcome} title={report.verdict}>
        {report.verdictContext}
      </VerdictBand>
      <ProvenanceStrip items={report.provenance} />

      {report.figures && report.figures.length > 0 ? (
        <dl data-slot="review-report-figures" className="m-0 grid grid-cols-[repeat(auto-fit,minmax(min(100%,11rem),1fr))] border-y border-edge-subtle">
          {report.figures.map((figure) => (
            <div key={figure.label} className="flex flex-col-reverse gap-1.5 border-l border-dashed border-edge-subtle px-4 py-3.5 first:border-l-0 first:pl-0">
              {figure.note ? <dd className="m-0 text-xs text-content-secondary">{figure.note}</dd> : null}
              <dd className="m-0 font-display text-2xl font-bold tabular-nums">{figure.value}</dd>
              <dt className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.08em] text-content-muted">{figure.label}</dt>
            </div>
          ))}
        </dl>
      ) : null}

      {report.measurements && report.measurements.length > 0 ? (
        <ReportSection title="Measured drift">
          <p className="m-0 max-w-3xl text-sm text-content-secondary">
            Each measurement with its direction. ▲ or ▼ in bold marks a move against the preferred direction. That is a fact about the number; whether it is acceptable is for a policy to decide.
          </p>
          {report.measurements.map((table) => (
            <MeasurementTable key={table.caption} table={table} />
          ))}
          {report.caveats?.map((caveat) => (
            <div key={caveat.title} data-slot="review-report-caveat" className="flex flex-col gap-1.5 border-l-4 border-accent-quiet bg-surface-sunken px-4 py-3">
              <p className="m-0 font-mono text-xs font-bold uppercase tracking-wider text-content-primary">{caveat.title}</p>
              <div className="text-sm text-content-secondary">{caveat.body}</div>
            </div>
          ))}
        </ReportSection>
      ) : null}

      {report.records ? (
        <ReportSection title="Records by identity">
          <KeyedDiff
            caption={report.records.caption}
            identityLabel={report.records.identityLabel}
            columns={report.records.columns.map((column) => (column.direction ? `${column.label} ${DIRECTION_MARK[column.direction]}` : column.label))}
            rows={report.records.rows.map((row) => ({
              identity: row.identity,
              change: row.change,
              cells: report.records!.columns.map((column, c) => valueCell(column, row.values[c], c)),
            }))}
          />
        </ReportSection>
      ) : null}

      <ReportSection title="Changed files">
        <ChangeIndex label="Changed files" groups={sized.map((group) => ({ title: group.title, files: group.files.map(({ path, added, removed }) => ({ path, added, removed })) }))} />
        <div className="flex flex-col gap-4">
          {all.map((file) => (
            <DiffView key={file.path} path={file.path} hunks={file.hunks} max={max} defaultOpen={file === largest} />
          ))}
        </div>
      </ReportSection>
    </ReportDocument>
  );
});
