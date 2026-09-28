import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn, recipe } from '../lib/recipe';
import { childrenToText, slugify } from '../lib/slug';

/**
 * The page frame for a generated report: a titled header with a metadata strip,
 * and a body that spaces its own sections.
 *
 * It exists so an agent writing a report has one obvious starting point rather
 * than a layout decision. Everything inside is ordinary composition — `Card`,
 * `StatCard`, `DataTable`, `NoteBlock`, `Prose` — and the frame only owns the
 * measure, the header and the vertical rhythm.
 *
 * Every colour addresses a role, so the same markup renders on every rung of
 * the ladder and the generator's `--theme` flag is the only thing that decides.
 */

const document_ = recipe({
  slots: {
    // `print:` keeps the document usable on paper, which is where a report
    // often ends up. Utilities rather than an `@media print` block, because a
    // stylesheet is not where styling lives here.
    root: 'mx-auto w-full max-w-4xl bg-surface-base px-6 py-12 font-sans text-content-primary sm:px-8 print:max-w-none print:px-0 print:py-0',
    header: 'mb-10 border-b-4 border-edge-strong pb-6',
    title: 'font-display text-3xl font-bold uppercase leading-tight tracking-tight sm:text-4xl',
    subtitle: 'mt-3 max-w-2xl font-sans text-base text-content-secondary',
    meta: 'mt-6 flex flex-wrap gap-x-8 gap-y-3',
    metaItem: 'flex flex-col gap-0.5',
    metaLabel: 'font-mono text-[0.6875rem] font-bold uppercase tracking-widest text-content-muted',
    metaValue: 'font-mono text-sm text-content-secondary',
    body: 'flex flex-col gap-8',
    section: 'scroll-mt-4 break-inside-avoid',
    sectionTitle:
      'mb-4 border-b-2 border-edge-subtle pb-2 font-display text-xl font-bold uppercase tracking-tight',
    sectionBody: 'flex flex-col gap-4',
    details: 'group border-2 border-edge-strong bg-surface-raised',
    summary:
      'flex cursor-pointer list-none items-center gap-3 px-4 py-3 font-mono text-sm font-bold '
      + 'text-content-primary marker:content-none hover:bg-surface-sunken',
    summaryNote: 'font-normal text-content-muted',
    detailsBody: 'border-t-2 border-edge-subtle p-4',
  },
});

/** One `label`/`value` pair in the header strip — a run date, a commit, a scope. */
export interface ReportMetaItem {
  label: string;
  value: ReactNode;
}

export interface ReportDocumentProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** The report's name, as an `<h1>`. What a reader sees first and links by. */
  title: ReactNode;
  /** One line under the title saying what the report answers. */
  subtitle?: ReactNode;
  /** Rendered as a definition strip under the title. Omit for none. */
  meta?: readonly ReportMetaItem[];
  /** The report body — sections, cards, tables. Spaced by the frame. */
  children: ReactNode;
  /** Merged onto the article. For the measure or the page margin. */
  className?: string;
}

/**
 * The page frame for a generated report: a titled header with a metadata
 * strip, and a body that spaces its own sections.
 *
 * It exists so that a tool writing a report has one obvious starting point
 * rather than a layout decision to make badly. The frame owns the measure, the
 * header and the vertical rhythm, and nothing else — everything inside it is
 * ordinary composition with `Card`, `StatCard`, `DataTable`, `NoteBlock` and
 * `Prose`.
 *
 * Every colour addresses a role, so the same markup renders on every rung of
 * the ladder. It also prints: the `print:` utilities drop the page margin and
 * the measure, because a report is a thing people put in front of other
 * people.
 *
 * Use `ReportSection` for its parts and `ReportDetails` for anything folded
 * away; both are documented on this page.
 */
export const ReportDocument = forwardRef<HTMLElement, ReportDocumentProps>(function ReportDocument(
  { title, subtitle, meta, children, className, ...props },
  ref,
) {
  const styles = document_();

  return (
    <article ref={ref} className={cn(styles.root(), className)} {...props}>
      <header className={styles.header()}>
        <h1 className={styles.title()}>{title}</h1>
        {subtitle ? <p className={styles.subtitle()}>{subtitle}</p> : null}
        {meta && meta.length > 0 ? (
          <dl className={styles.meta()}>
            {meta.map((item) => (
              <div key={item.label} className={styles.metaItem()}>
                <dt className={styles.metaLabel()}>{item.label}</dt>
                <dd className={styles.metaValue()}>{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </header>
      <div className={styles.body()}>{children}</div>
    </article>
  );
});

/**
 * A titled section inside a report. Headings carry the display font from
 * `styles.css`, so this only owns the rule above and the spacing.
 */
export interface ReportSectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** The section heading, rendered as an `<h2>`. */
  title: ReactNode;
  /**
   * Anchor for the section, so a reader can link straight to it. Derived from
   * the title when omitted — a generated report is often the thing someone
   * pastes into a ticket, and "see the Failures section" is worse than a URL.
   */
  id?: string;
  /** What the section contains. Stacked with the frame's own rhythm. */
  children: ReactNode;
  /** Merged onto the section element. */
  className?: string;
}

export const ReportSection = forwardRef<HTMLElement, ReportSectionProps>(function ReportSection(
  { title, id, children, className, ...props },
  ref,
) {
  const styles = document_();
  const anchor = id ?? slugify(childrenToText(title));
  return (
    <section ref={ref} id={anchor} className={cn(styles.section(), className)} {...props}>
      <h2 className={styles.sectionTitle()}>{title}</h2>
      <div className={styles.sectionBody()}>{children}</div>
    </section>
  );
});

/**
 * A collapsible block, built on `<details>`.
 *
 * This is the one interactive affordance a static report can actually have.
 * Every other one — a sort control, a filter, a tab strip — needs client JS that
 * this pipeline does not emit, so it renders as a dead control; `<details>` is
 * disclosure implemented by the browser itself. That makes progressive
 * disclosure available to a generated report at all: a summary anyone can scan,
 * with the stack trace, the full diff or the 200-row table folded away until
 * someone wants it.
 *
 * `open` is worth setting on the block a reader came for. Printing a report
 * prints only what is open, which is usually right and occasionally surprising.
 */
export interface ReportDetailsProps extends HTMLAttributes<HTMLDetailsElement> {
  /** The always-visible row. Should read as a claim, not a label. */
  summary: ReactNode;
  /** Short right-aligned annotation on the summary row — a count, a duration. */
  note?: ReactNode;
  /** Start expanded. Printing a report prints only what is open. */
  open?: boolean;
  /** The folded-away detail — a trace, a diff, a long table. */
  children: ReactNode;
  /** Merged onto the `<details>` element. */
  className?: string;
}

export const ReportDetails = forwardRef<HTMLDetailsElement, ReportDetailsProps>(
  function ReportDetails({ summary, note, open, children, className, ...props }, ref) {
    const styles = document_();
    return (
      <details ref={ref} open={open} className={cn(styles.details(), className)} {...props}>
        <summary className={styles.summary()}>
        {/* Text, not an icon: the marker has to survive greyscale printing and a
            reader who cannot see colour. */}
          <span aria-hidden="true" className="text-accent-primary">
            <span className="group-open:hidden">[+]</span>
            <span className="hidden group-open:inline">[-]</span>
          </span>
          <span className="flex-1">{summary}</span>
          {note ? <span className={styles.summaryNote()}>{note}</span> : null}
        </summary>
        <div className={styles.detailsBody()}>{children}</div>
      </details>
    );
  },
);

/*
 * `forwardRef` requires these: `check:component-contract` gates displayName at
 * budget 0, and without them a ref-forwarding component shows as
 * `ForwardRef(...)` in React DevTools and in a failing test's output.
 */
ReportDocument.displayName = 'ReportDocument';
ReportSection.displayName = 'ReportSection';
ReportDetails.displayName = 'ReportDetails';
