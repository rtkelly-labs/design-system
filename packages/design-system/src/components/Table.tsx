"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type RefObject,
  type TableHTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from 'react';
import { cn, recipe } from '../lib/recipe';

/** The visual treatment of a table. `grid` preserves the original framed style. */
export type TableAppearance = 'grid' | 'quiet' | 'index';

/** Cell spacing for roomy reading or dense reference data. */
export type TableDensity = 'comfortable' | 'compact';

interface TablePresentation {
  appearance: TableAppearance;
  density: TableDensity;
}

const DEFAULT_PRESENTATION: TablePresentation = {
  appearance: 'grid',
  density: 'comfortable',
};

const TablePresentationContext = createContext<TablePresentation>(DEFAULT_PRESENTATION);

function useTablePresentation() {
  return useContext(TablePresentationContext);
}

const tableStyles = recipe({
  slots: {
    // The `data-more-*` clauses are the overflow cue: a hard 4px edge-strong
    // rule outside the frame, on whichever side has columns the reader cannot
    // see. A shadow rather than a fade, and outside rather than inside, because
    // the header's own fill would cover anything drawn behind the cells.
    container:
      'relative w-full overflow-x-auto border-2 border-edge-strong bg-surface-base print:max-h-none print:overflow-visible '
      + 'data-[more-right]:shadow-[4px_0_0_0_var(--ds-border-strong)] '
      + 'data-[more-left]:shadow-[-4px_0_0_0_var(--ds-border-strong)] '
      + 'data-[more-left]:data-[more-right]:shadow-[-4px_0_0_0_var(--ds-border-strong),4px_0_0_0_var(--ds-border-strong)]',
    table: 'w-full caption-bottom text-left font-mono text-sm border-collapse',
    header: 'bg-surface-raised border-b-2 border-edge-strong print:table-header-group',
    head: 'h-11 px-4 py-3 text-left align-middle font-display text-xs font-bold uppercase tracking-wider text-accent-primary border-r-2 border-edge-strong last:border-r-0',
    rowHead: 'px-4 py-3 text-left align-middle text-sm font-bold text-content-primary border-r-2 border-edge-strong last:border-r-0',
    body: 'divide-y-2 divide-edge-strong [&_tr:last-child]:border-0',
    // D6-B: selected is the opaque tint with primary ink; the cursor row is a 2px
    // outline (never a glyph); hover is an edge-default inset ring, a device of its
    // own, so hover on a selected row still reads as hover.
    row:
      'border-b-2 border-edge-strong transition-colors hover:inset-ring-2 hover:inset-ring-edge-default '
      + 'data-[state=selected]:bg-selection-multi data-[state=selected]:text-content-primary '
      + 'data-[state=selected]:[&_td]:text-content-primary data-[state=selected]:[&_th]:text-content-primary '
      + 'data-[current=true]:outline-2 data-[current=true]:-outline-offset-2 data-[current=true]:outline-edge-strong '
      + 'print:break-inside-avoid',
    cell: 'px-4 py-3 align-middle text-sm text-content-primary border-r-2 border-edge-strong last:border-r-0',
    footer: 'bg-surface-raised border-t-2 border-edge-strong font-mono text-xs font-bold text-content-primary',
    caption: 'mt-3 text-xs font-mono text-content-muted text-center',
  },
  variants: {
    appearance: {
      grid: {},
      quiet: {
        container: 'border-0 bg-transparent',
        header: 'bg-transparent border-b border-edge-subtle',
        head: 'text-content-secondary border-r-0',
        rowHead: 'border-r-0',
        body: 'divide-y divide-edge-subtle',
        row: 'border-b border-edge-subtle',
        cell: 'border-r-0',
        footer: 'bg-transparent border-t border-edge-subtle',
        caption: 'text-left',
      },
      index: {
        container: 'border-0 bg-transparent',
        header: 'bg-transparent border-b border-edge-subtle',
        head: 'text-content-secondary border-r-0',
        rowHead: 'border-l-2 border-accent-primary border-r-0 pl-3',
        body: 'divide-y divide-edge-subtle',
        row: 'border-b border-edge-subtle',
        cell: 'border-r-0',
        footer: 'bg-transparent border-t border-edge-subtle',
        caption: 'text-left',
      },
    },
    density: {
      comfortable: {},
      compact: {
        head: 'h-9 px-3 py-2',
        rowHead: 'px-3 py-1.5',
        cell: 'px-3 py-1.5',
        caption: 'mt-2',
      },
    },
  },
  defaultVariants: {
    appearance: 'grid',
    density: 'comfortable',
  },
});

/**
 * Which sides of a horizontal scroller have content past the edge, kept current
 * as it scrolls, resizes and its table changes width. Drives the overflow cue:
 * a table that clips a header mid-word at 375px says nothing about the columns
 * it is hiding without it.
 */
function useOverflowSides(ref: RefObject<HTMLElement | null>): { left: boolean; right: boolean } {
  const [sides, setSides] = useState({ left: false, right: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      // `abs`: a right-to-left scroller reports a negative `scrollLeft`.
      const offset = Math.abs(el.scrollLeft);
      const left = offset > 1;
      const right = el.scrollWidth - el.clientWidth - offset > 1;
      setSides((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
    };
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(el);
    if (el.firstElementChild) observer?.observe(el.firstElementChild);
    return () => {
      el.removeEventListener('scroll', measure);
      observer?.disconnect();
    };
  }, [ref]);

  return sides;
}

export function Table({
  className,
  containerClassName,
  label = 'Table',
  appearance = 'grid',
  density = 'comfortable',
  ...props
}: TableHTMLAttributes<HTMLTableElement> & {
  containerClassName?: string;
  /**
   * Names the scrollable region a keyboard user lands on before the table
   * itself. Defaults to `Table`, which is honest but uninformative — pass the
   * table's subject where it is known.
   */
  label?: string;
  /**
   * `grid` keeps the framed default, `quiet` removes the full cell grid, and
   * `index` adds a keyline to row headers for catalog-style scanning.
   */
  appearance?: TableAppearance;
  /**
   * `comfortable` preserves the existing cell spacing. `compact` reduces it
   * for reference tables with many rows.
   */
  density?: TableDensity;
}) {
  const presentation = { appearance, density };
  const styles = tableStyles(presentation);
  const containerRef = useRef<HTMLDivElement>(null);
  const more = useOverflowSides(containerRef);
  /*
   * `tabIndex={0}` on the container because it is `overflow-x-auto`: any table
   * wider than its column becomes a scrollable region, and a scrollable region
   * that cannot take focus cannot be scrolled by keyboard at all — axe's
   * `scrollable-region-focusable`, and a real trap rather than a technicality,
   * since the columns off the right edge are then reachable only with a
   * pointer. `CodeBlock` carries the same attribute for the same reason.
   *
   * `role="region"` and a name come with it, and not only to satisfy
   * `jsx-a11y/no-noninteractive-tabindex`, which is at budget 0. The two rules
   * are asking for the same thing from opposite ends: axe wants the scroll
   * container reachable, jsx-a11y wants anything focusable to be worth
   * landing on. A focus stop a screen reader announces as nothing is the
   * thing jsx-a11y is right about, so the region is named. `CodeBlock`
   * settled on exactly this pair for exactly this reason.
   *
   * `label` exists so the name can be the table's own — "Failing checks"
   * rather than "Table" — for the callers that know it.
  */
  return (
    <TablePresentationContext.Provider value={presentation}>
      <div
        ref={containerRef}
        data-slot="table-container"
        data-more-left={more.left ? '' : undefined}
        data-more-right={more.right ? '' : undefined}
        tabIndex={0}
        role="region"
        aria-label={label}
        className={styles.container({ class: containerClassName })}
      >
        <table data-slot="table" className={styles.table({ class: className })} {...props} />
      </div>
    </TablePresentationContext.Provider>
  );
}

export function TableHeader({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  const styles = tableStyles(useTablePresentation());
  return <thead data-slot="table-header" className={styles.header({ class: className })} {...props} />;
}

export function TableBody({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  const styles = tableStyles(useTablePresentation());
  return <tbody data-slot="table-body" className={styles.body({ class: className })} {...props} />;
}

export function TableFooter({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  const styles = tableStyles(useTablePresentation());
  return <tfoot data-slot="table-footer" className={styles.footer({ class: className })} {...props} />;
}

/**
 * A body row. In a multi-select table (D6-B) it carries two states by
 * attribute: `data-state="selected"` fills it with the opaque selection tint and
 * keeps its text primary, and `data-current="true"` marks the cursor row with a
 * 2px outline. Both can hold at once. Hover draws an inset edge, which is a
 * different device from either.
 */
export function TableRow({
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  const styles = tableStyles(useTablePresentation());
  return <tr data-slot="table-row" className={styles.row({ class: className })} {...props} />;
}

/**
 * A header cell. `scope` defaults to `col`, which is what a cell in
 * `TableHeader` is; pass `scope="row"` for a row header in `TableBody`, which
 * also gives it the body cell's geometry rather than the column header's.
 */
export function TableHead({
  className,
  scope = 'col',
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  const styles = tableStyles(useTablePresentation());
  const slot = scope === 'row' || scope === 'rowgroup' ? styles.rowHead : styles.head;
  return <th data-slot="table-head" scope={scope} className={slot({ class: className })} {...props} />;
}

export function TableCell({
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  const styles = tableStyles(useTablePresentation());
  return <td data-slot="table-cell" className={styles.cell({ class: className })} {...props} />;
}

export function TableCaption({
  className,
  ...props
}: HTMLAttributes<HTMLTableCaptionElement>) {
  const styles = tableStyles(useTablePresentation());
  return <caption data-slot="table-caption" className={styles.caption({ class: className })} {...props} />;
}
