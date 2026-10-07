import {
  createContext,
  useContext,
  type HTMLAttributes,
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
    container: 'relative w-full overflow-x-auto border-2 border-edge-strong bg-surface-base',
    table: 'w-full caption-bottom text-left font-mono text-sm border-collapse',
    header: 'bg-surface-raised border-b-2 border-edge-strong',
    head: 'h-11 px-4 py-3 text-left align-middle font-display text-xs font-bold uppercase tracking-wider text-accent-primary border-r-2 border-edge-strong last:border-r-0',
    rowHead: 'px-4 py-3 text-left align-middle text-sm font-bold text-content-primary border-r-2 border-edge-strong last:border-r-0',
    body: 'divide-y-2 divide-edge-strong [&_tr:last-child]:border-0',
    row: 'border-b-2 border-edge-strong transition-colors hover:bg-surface-raised data-[state=selected]:bg-surface-raised',
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
        data-slot="table-container"
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
