import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react';
import { cn, recipe } from '../lib/recipe';

const tableStyles = recipe({
  slots: {
    container: 'relative w-full overflow-x-auto border-2 border-edge-strong bg-surface-base',
    table: 'w-full caption-bottom text-left font-mono text-sm border-collapse',
    header: 'bg-surface-raised border-b-2 border-edge-strong',
    head: 'h-11 px-4 py-3 text-left align-middle font-display text-xs font-bold uppercase tracking-wider text-accent-primary border-r-2 border-edge-strong last:border-r-0',
    body: 'divide-y-2 divide-edge-strong [&_tr:last-child]:border-0',
    row: 'border-b-2 border-edge-strong transition-colors hover:bg-surface-raised data-[state=selected]:bg-surface-raised',
    cell: 'px-4 py-3 align-middle text-sm text-content-primary border-r-2 border-edge-strong last:border-r-0',
    footer: 'bg-surface-raised border-t-2 border-edge-strong font-mono text-xs font-bold text-content-primary',
    caption: 'mt-3 text-xs font-mono text-content-muted text-center',
  },
});

export function Table({
  className,
  containerClassName,
  ...props
}: TableHTMLAttributes<HTMLTableElement> & { containerClassName?: string }) {
  const styles = tableStyles();
  return (
    <div data-slot="table-container" className={styles.container({ class: containerClassName })}>
      <table data-slot="table" className={styles.table({ class: className })} {...props} />
    </div>
  );
}

export function TableHeader({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  const styles = tableStyles();
  return <thead data-slot="table-header" className={styles.header({ class: className })} {...props} />;
}

export function TableBody({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  const styles = tableStyles();
  return <tbody data-slot="table-body" className={styles.body({ class: className })} {...props} />;
}

export function TableFooter({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  const styles = tableStyles();
  return <tfoot data-slot="table-footer" className={styles.footer({ class: className })} {...props} />;
}

export function TableRow({
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  const styles = tableStyles();
  return <tr data-slot="table-row" className={styles.row({ class: className })} {...props} />;
}

export function TableHead({
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  const styles = tableStyles();
  return <th data-slot="table-head" className={styles.head({ class: className })} {...props} />;
}

export function TableCell({
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  const styles = tableStyles();
  return <td data-slot="table-cell" className={styles.cell({ class: className })} {...props} />;
}

export function TableCaption({
  className,
  ...props
}: HTMLAttributes<HTMLTableCaptionElement>) {
  const styles = tableStyles();
  return <caption className={styles.caption({ class: className })} {...props} />;
}
