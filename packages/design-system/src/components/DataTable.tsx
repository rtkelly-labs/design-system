'use client';

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type Table as TanStackTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { cn } from '../lib/recipe';
import { Checkbox } from './Checkbox';
import { NerdIcon } from './NerdIcon';
import { Pagination } from './Pagination';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type TableAppearance,
  type TableDensity,
} from './Table';
import { Tooltip } from './Tooltip';

// Legacy column interface for backwards-compatibility
export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  className?: string;
  enableSorting?: boolean;
  sortValue?: (row: T) => any;
  /**
   * The column that names each row — a hostname, a branch. Its body cells
   * render as `<th scope="row">`, so a screen reader announces the row by it
   * while moving across. On a TanStack `ColumnDef`, set `meta.rowHeader`.
   */
  rowHeader?: boolean;
}

interface DataTableColumnMeta {
  className?: string;
  rowHeader?: boolean;
}

// What a press on a sort button does, keyed by the column's next order so the
// description cannot disagree with the click.
const SORT_HINT = { asc: 'Sort ascending', desc: 'Sort descending' } as const;

// A stable default, so an unselected table does not build a new Set per render.
const EMPTY_KEYS: ReadonlySet<string> = new Set();

/** Virtualization geometry is runtime arithmetic; hoisted objects (the
 * `ATTACHED_STYLE` convention from CodeBlock) keep it off the inline-style
 * sites the contract counts. */
const SPACER_STYLE_BASE = { padding: 0, border: 0 } as const;
function spacerStyle(height: number) {
  return { height, ...SPACER_STYLE_BASE };
}
function scrollBoxStyle(height: number) {
  return { height };
}

/**
 * Row virtualization is planned against a fixed row height rather than measured
 * rows: deterministic rendering is a contract here (docs/deterministic-rendering.md),
 * and a measured engine would make the snapshot of a 10k-row table depend on font
 * loading. Multi-line cell content is therefore clipped to `rowHeight`.
 */
export interface DataTableVirtualization {
  /**
   * Viewport height, in px, of the scroll box the table builds for itself.
   * Ignored when `scrollElementRef` is provided. Defaults to 480.
   */
  height?: number;
  /** Fixed row height, in px, the virtualizer plans against. Defaults to 44. */
  rowHeight?: number;
  /** Rows rendered beyond each edge of the viewport. Defaults to 8. */
  overscan?: number;
  /**
   * Scroll inside an existing scrollable element instead of building one. When
   * provided, no wrapper is rendered and this element owns both axes — and it
   * must be keyboard-reachable itself (`tabIndex={0}`), or the window cannot be
   * scrolled without a mouse.
   */
  scrollElementRef?: RefObject<HTMLElement | null>;
}

type DataTableSharedProps<T> = {
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
  /**
   * `index` is the row's position in `data`, not on screen, so a key built
   * from it follows its row through a sort rather than staying with the slot.
   */
  keyExtractor?: (row: T, index: number) => string | number;
  /**
   * What the table is a table of. Rendered as the `<caption>`, which is the
   * table's accessible name; a string caption also names the scroll regions.
   */
  caption?: ReactNode;
  emptyText?: string;
  className?: string;
  containerClassName?: string;
  /**
   * Window the body to the visible rows so a dataset of thousands renders as
   * many rows as fit, not as many as exist. `true` uses the defaults;
   * mutually exclusive with `pageSize`, which wins nothing — pagination is
   * simply not attached while virtualizing. The table still reports the whole
   * dataset to assistive tech, through `aria-rowcount` and `aria-rowindex`.
   */
  virtualize?: boolean | DataTableVirtualization;
  /**
   * The keys of the selected rows, as `keyExtractor` produces them (numbers
   * are compared as strings). Controlled: the table never changes it, it
   * reports the next set through `onSelectionChange`. Because selection is
   * keyed rather than positional it survives a sort, a page change and a
   * windowed scroll. Without a `keyExtractor` the key is TanStack's row id,
   * which is the row's index in `data` and does not follow a row when
   * `data` changes — pass one.
   */
  selectedKeys?: ReadonlySet<string>;
  /**
   * Turns selection on: a leading column of checkboxes, one per row, and one
   * in the header. Called with the whole next selection on every toggle.
   * The set it reports holds only keys of rows that are still in the data
   * and still selectable, so a key whose row has gone, or has become
   * unselectable, drops out on the next change rather than lingering.
   */
  onSelectionChange?: (keys: Set<string>) => void;
  /**
   * Whether a row may be selected. `false` disables its checkbox; a string
   * disables it *and* says why, as the checkbox's accessible description and
   * as a tooltip on hover. Every row is selectable when omitted.
   */
  isRowSelectable?: (row: T) => boolean | string;
  /**
   * The accessible name of a row's checkbox. Defaults to "Select" followed by
   * the row-header column's value (`rowHeader` / `meta.rowHeader`), or by
   * the row's key when there is no row header — so mark a row header, or
   * pass this, or every checkbox is named by an id.
   */
  selectionLabel?: (row: T) => string;
};

export type DataTableProps<T> = DataTableSharedProps<T> &
  (
    | {
        /** Pre-configured TanStack table instance */
        table: TanStackTable<T>;
        columns?: never;
        data?: never;
      }
    | {
        table?: never;
        /** Column definitions (either simple Column<T>[] or TanStack ColumnDef<T>[]) */
        columns: Column<T>[] | ColumnDef<T, any>[];
        data: T[];
        /** `false` turns sorting off for every column. Defaults to `true`. */
        enableSorting?: boolean;
        pageSize?: number;
      }
  );

/**
 * A data table on `@tanstack/react-table`, with the semantics TanStack does not
 * supply written here: `scope` on every header, `aria-sort` on the sorted
 * column, a real sort button per sortable header, an optional `caption`, and a
 * true row count when the body is windowed.
 */
export function DataTable<T>({
  table: providedTable,
  columns,
  data,
  keyExtractor,
  caption,
  appearance = 'grid',
  density = 'comfortable',
  emptyText = 'No items found.',
  className = '',
  containerClassName = '',
  virtualize,
  selectedKeys = EMPTY_KEYS,
  onSelectionChange,
  isRowSelectable,
  selectionLabel,
  ...rest
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const uid = useId();
  // Memoized (the exhaustive-deps rule's own suggestion): a caller passing a
  // fresh `virtualize={{ ... }}` literal must not churn the measure effect.
  const virtualization = useMemo(
    () => (virtualize ? (typeof virtualize === 'object' ? virtualize : {}) : undefined),
    [virtualize],
  );
  const {
    height = 480,
    rowHeight = density === 'compact' ? 36 : 44,
    overscan = 8,
    scrollElementRef,
  } = virtualization ?? {};
  const [globalFilter, setGlobalFilter] = useState('');

  // Normalize columns if legacy format is provided
  const tanstackColumns = useMemo<ColumnDef<T, any>[]>(() => {
    if (!columns) return [];

    return columns.map((col: any) => {
      // Check if it's already a TanStack ColumnDef
      if ('accessorKey' in col || 'accessorFn' in col || 'id' in col) {
        return col as ColumnDef<T, any>;
      }

      // Convert legacy Column<T> to ColumnDef<T>
      const legacy = col as Column<T>;
      return {
        id: typeof legacy.accessor === 'string' ? legacy.accessor : legacy.header,
        header: legacy.header,
        enableSorting: legacy.enableSorting ?? true,
        accessorFn: (row: T) => {
          if (legacy.sortValue) {
            return legacy.sortValue(row);
          }
          if (typeof legacy.accessor === 'function') {
            const res = legacy.accessor(row);
            if (res && typeof res === 'object' && 'props' in (res as any)) {
              const children = (res as any).props?.children;
              if (typeof children === 'string' || typeof children === 'number') {
                return children;
              }
            }
            return typeof res === 'string' || typeof res === 'number' ? res : '';
          }
          return row[legacy.accessor];
        },
        cell: (info: any) => {
          if (typeof legacy.accessor === 'function') {
            return legacy.accessor(info.row.original);
          }
          return info.getValue() as ReactNode;
        },
        meta: {
          className: legacy.className,
          rowHeader: legacy.rowHeader,
        },
      } as ColumnDef<T, any>;
    });
  }, [columns]);

  // `pageSize` used to switch the pagination model on and nothing else, so
  // TanStack's default of 10 applied whatever was asked for (#276). It is read
  // from the prop on every render, not handed to `initialState` once, so a
  // later change is honoured; only the page index is state. A new size starts
  // again at page one rather than stranding the reader past the last page.
  const paginated = !virtualization && 'pageSize' in rest && Boolean(rest.pageSize);
  const requestedPageSize = paginated ? (rest as { pageSize: number }).pageSize : 10;
  const [pageIndexState, setPageIndexState] = useState(0);
  const [pageSizeSeen, setPageSizeSeen] = useState(requestedPageSize);
  if (pageSizeSeen !== requestedPageSize) {
    setPageSizeSeen(requestedPageSize);
    setPageIndexState(0);
  }
  const pagination = { pageIndex: pageIndexState, pageSize: requestedPageSize };
  const defaultTable = useReactTable<T>({
    data: data || [],
    columns: tanstackColumns,
    state: {
      sorting,
      globalFilter,
      ...(paginated ? { pagination } : {}),
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater(pagination) : updater;
      setPageIndexState(next.pageIndex);
    },
    enableSorting: 'enableSorting' in rest ? rest.enableSorting !== false : true,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: paginated ? getPaginationRowModel() : undefined,
  });

  const activeTable = providedTable || defaultTable;
  const rows = activeTable.getRowModel().rows;
  const headerGroups = activeTable.getHeaderGroups();

  // A windowed body — virtualized, or one page of a paginated model — holds
  // fewer rows than the data, and a screen reader counts what it is given. So
  // the table states the real count and each row its real position, all from
  // one total. aria-rowcount counts every row, header rows included.
  const totalRows = activeTable.getRowCount();
  const windowed = Boolean(virtualization) || rows.length < totalRows;
  const { pageIndex, pageSize } = activeTable.getState().pagination;
  const pageOffset = virtualization
    ? 0
    : Math.min(pageIndex * pageSize, Math.max(0, totalRows - rows.length));

  const scrollRef = useRef<HTMLDivElement>(null);
  // The virtualizer measures from the top of the scroll element, which on a
  // table is the header's top-left — but rows begin below it. Measuring the
  // body's offset once (the header's height is static by recipe) removes the
  // scrollMargin error that would otherwise offset every window by ~46px.
  const [scrollMargin, setScrollMargin] = useState(0);
  useLayoutEffect(() => {
    if (!virtualization) return;
    const scrollEl = scrollElementRef?.current ?? scrollRef.current;
    const body = scrollEl?.querySelector('[data-slot="table-body"]');
    if (!scrollEl || !body) return;
    setScrollMargin(
      body.getBoundingClientRect().top -
        scrollEl.getBoundingClientRect().top +
        scrollEl.scrollTop,
    );
  }, [virtualization, scrollElementRef, rows.length]);

  const virtualizer = useVirtualizer({
    count: virtualization ? rows.length : 0,
    estimateSize: () => rowHeight,
    overscan,
    getScrollElement: () => scrollElementRef?.current ?? scrollRef.current,
    scrollMargin,
  });

  // `row.index`, not the on-screen position: a key built from the position
  // would stay with the slot while the rows move through it on a sort.
  const keyOf = (row: (typeof rows)[number]) =>
    String(keyExtractor ? keyExtractor(row.original, row.index) : row.id);

  // Selection is drawn outside TanStack's column model, so a caller's columns,
  // header groups and `table` instance are untouched by it.
  const selectable = Boolean(onSelectionChange);
  const rowSelectability = (row: (typeof rows)[number]) => {
    const verdict = isRowSelectable ? isRowSelectable(row.original) : true;
    return verdict === true
      ? { ok: true as const, reason: undefined }
      : { ok: false as const, reason: typeof verdict === 'string' && verdict ? verdict : undefined };
  };
  // Every report is pruned against the data as it is now — the core model,
  // so a row hidden by a filter keeps its selection.
  const report = (next: Set<string>) => {
    if (!onSelectionChange) return;
    const valid = new Set(
      activeTable
        .getCoreRowModel()
        .rows.filter((row) => rowSelectability(row).ok)
        .map(keyOf),
    );
    onSelectionChange(new Set([...next].filter((key) => valid.has(key))));
  };
  const rowHeaderColumn = activeTable
    .getAllLeafColumns()
    .find((column) => (column.columnDef.meta as DataTableColumnMeta | undefined)?.rowHeader);
  const labelOf = (row: (typeof rows)[number], key: string) => {
    if (selectionLabel) return selectionLabel(row.original);
    const name = rowHeaderColumn ? row.getValue(rowHeaderColumn.id) : undefined;
    return `Select ${typeof name === 'string' || typeof name === 'number' ? name : key}`;
  };

  // The header box acts on the rows the body holds: one page when paginated,
  // every row otherwise (a virtualized body holds all of them, windowed).
  // Selecting rows on pages the reader cannot see is how a bulk delete takes
  // more than was meant, so it is never done implicitly.
  const pageKeys = selectable ? rows.filter((row) => rowSelectability(row).ok).map(keyOf) : [];
  const pageSelected = pageKeys.filter((key) => selectedKeys.has(key)).length;
  const allLabel = rows.length < totalRows && !virtualization ? 'Select all rows on this page' : 'Select all rows';

  // A refused row's checkbox is disabled, and a disabled control takes no
  // focus — so the reason cannot live only in the tooltip. It is also the
  // checkbox's description, read wherever the checkbox is.
  const renderSelectCell = (row: (typeof rows)[number], rowKey: string, isSelected: boolean) => {
    const verdict = rowSelectability(row);
    const reasonId = `${uid}-why-${rowKey}`;
    const box = (
      <Checkbox
        aria-label={labelOf(row, rowKey)}
        aria-describedby={verdict.reason ? reasonId : undefined}
        checked={isSelected}
        disabled={!verdict.ok}
        onCheckedChange={(checked) => {
          const next = new Set(selectedKeys);
          if (checked) next.add(rowKey);
          else next.delete(rowKey);
          report(next);
        }}
      />
    );
    return (
      <TableCell data-slot="datatable-select" className="w-0">
        {verdict.reason ? (
          <>
            <Tooltip content={verdict.reason}>{box}</Tooltip>
            <span id={reasonId} hidden>
              {verdict.reason}
            </span>
          </>
        ) : (
          box
        )}
      </TableCell>
    );
  };

  const renderRow = (row: (typeof rows)[number], position: number) => {
    const rowKey = keyOf(row);
    const isSelected = selectable ? selectedKeys.has(rowKey) : row.getIsSelected();

    return (
      <TableRow
        key={rowKey}
        aria-rowindex={windowed ? headerGroups.length + pageOffset + position + 1 : undefined}
        data-state={isSelected ? 'selected' : undefined}
      >
        {selectable && renderSelectCell(row, rowKey, isSelected)}
        {row.getVisibleCells().map((cell) => {
          const meta = cell.column.columnDef.meta as DataTableColumnMeta | undefined;
          const content = flexRender(cell.column.columnDef.cell, cell.getContext());
          return meta?.rowHeader ? (
            <TableHead key={cell.id} scope="row" className={meta.className}>
              {content}
            </TableHead>
          ) : (
            <TableCell key={cell.id} className={meta?.className}>
              {content}
            </TableCell>
          );
        })}
      </TableRow>
    );
  };

  const colSpan = activeTable.getAllLeafColumns().length + (selectable ? 1 : 0) || 1;

  const virtualItems = virtualization ? virtualizer.getVirtualItems() : [];
  // `getVirtualItems` positions are relative to the scroll element and already
  // include `scrollMargin`; the gaps are what remains of the total column
  // above the first rendered row and below the last.
  const firstItem = virtualItems[0];
  const lastItem = virtualItems[virtualItems.length - 1];
  const topGap = virtualization && firstItem ? firstItem.start - scrollMargin : 0;
  const bottomGap =
    virtualization && lastItem
      ? virtualizer.getTotalSize() - lastItem.end
      : 0;

  const regionLabel = typeof caption === 'string' ? caption : undefined;

  const table = (
    <Table
      className={className}
      label={regionLabel}
      appearance={appearance}
      density={density}
      aria-rowcount={windowed ? headerGroups.length + totalRows : undefined}
      containerClassName={
        virtualization && !scrollElementRef
          ? cn(containerClassName, 'border-0 overflow-x-visible')
          : containerClassName
      }
    >
      {caption != null && <TableCaption>{caption}</TableCaption>}
      <TableHeader>
        {headerGroups.map((headerGroup, groupIdx) => (
          <TableRow key={headerGroup.id} aria-rowindex={windowed ? groupIdx + 1 : undefined}>
            {selectable && groupIdx === 0 && (
              <TableHead
                data-slot="datatable-select-all"
                rowSpan={headerGroups.length > 1 ? headerGroups.length : undefined}
                className="w-0"
              >
                <Checkbox
                  aria-label={allLabel}
                  checked={pageKeys.length > 0 && pageSelected === pageKeys.length}
                  indeterminate={pageSelected > 0 && pageSelected < pageKeys.length}
                  disabled={pageKeys.length === 0}
                  onCheckedChange={(checked) => {
                    const next = new Set(selectedKeys);
                    for (const key of pageKeys) {
                      if (checked) next.add(key);
                      else next.delete(key);
                    }
                    report(next);
                  }}
                />
              </TableHead>
            )}
            {headerGroup.headers.map((header, headerIdx) => {
              const canSort = !header.isPlaceholder && header.column.getCanSort();
              const isSorted = !header.isPlaceholder && header.column.getIsSorted();
              const meta = header.column.columnDef.meta as DataTableColumnMeta | undefined;
              // One header carries aria-sort at a time (ARIA 1.2); under a
              // multi-column sort it is the primary key's.
              const ariaSort =
                isSorted && header.column.getSortIndex() === 0
                  ? isSorted === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : undefined;
              const next = canSort ? header.column.getNextSortingOrder() : false;
              const hintId = `${uid}-sort-${groupIdx}-${headerIdx}`;
              // The icon is decorative: the state it draws is aria-sort's.
              const label = header.isPlaceholder ? null : (
                <>
                  <span aria-hidden="true">[</span>
                  <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                  {canSort && (
                    <span aria-hidden="true" className="inline-flex items-center">
                      <NerdIcon
                        name={isSorted === 'asc' ? 'sort-asc' : isSorted === 'desc' ? 'sort-desc' : 'sort'}
                        size="sm"
                        accent={isSorted ? 'primary' : 'muted'}
                      />
                    </span>
                  )}
                  <span aria-hidden="true">]</span>
                </>
              );

              // A sortable header holds a native button, so sorting is
              // reachable by Tab and fired by Enter or Space. Its name is the
              // column's; what a press does is its description, which keeps
              // "sort ascending" out of the header name read before every
              // cell. `::after` stretches the hit area over the cell, as the
              // old whole-cell click had it.
              return (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan > 1 ? header.colSpan : undefined}
                  // A group heading spanning several columns heads all of them;
                  // `col`, the default, would tie it to the first one only.
                  scope={header.colSpan > 1 && !header.isPlaceholder ? 'colgroup' : undefined}
                  aria-sort={ariaSort}
                  className={cn(
                    canSort && 'relative cursor-pointer select-none hover:bg-surface-base transition-colors',
                    meta?.className,
                  )}
                >
                  {canSort ? (
                    <button
                      type="button"
                      aria-describedby={hintId}
                      onClick={header.column.getToggleSortingHandler()}
                      className="inline-flex cursor-pointer items-center gap-1.5 uppercase after:absolute after:inset-0"
                    >
                      {label}
                      <span id={hintId} hidden>
                        {next ? SORT_HINT[next] : 'Remove sort'}
                      </span>
                    </button>
                  ) : (
                    label && <span className="inline-flex items-center gap-1.5">{label}</span>
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={colSpan}
              className={cn(
                density === 'compact' ? 'px-3 py-4' : 'px-4 py-8',
                'text-center text-content-muted font-mono',
              )}
            >
              &gt; {emptyText}
            </TableCell>
          </TableRow>
        ) : virtualization ? (
          <>
            {topGap > 0 && <SpacerRow height={topGap} colSpan={colSpan} />}
            {virtualItems.map((item) => renderRow(rows[item.index], item.index))}
            {bottomGap > 0 && <SpacerRow height={bottomGap} colSpan={colSpan} />}
          </>
        ) : (
          rows.map((row, position) => renderRow(row, position))
        )}
      </TableBody>
    </Table>
  );

  // A paginated body needs a way to the other pages, or every row past the
  // first page is unreachable. It is the system's own `Pagination`, in its
  // callback mode, rather than a second pager written here. Only for the
  // table this component builds: a caller passing `table` owns its state.
  const pageCount = activeTable.getPageCount();
  if (paginated && !providedTable && pageCount > 1) {
    return (
      <div data-slot="datatable-paginated" className="flex flex-col gap-4">
        {table}
        <Pagination
          totalPages={pageCount}
          currentPage={pageIndex + 1}
          onPageChange={(page) => activeTable.setPageIndex(page - 1)}
        />
      </div>
    );
  }

  if (!virtualization || scrollElementRef) return table;

  return (
    <div
      ref={scrollRef}
      data-slot="table-virtual-scroll"
      tabIndex={0}
      role="region"
      aria-label={regionLabel ?? 'Table contents'}
      className="relative w-full overflow-y-auto"
      style={scrollBoxStyle(height)}
    >
      {table}
    </div>
  );
}

/**
 * Splits the difference between a windowed tbody and the table's own grid:
 * the row contributes height, contributes nothing to column sizing, and is
 * hidden from assistive tech because the rows it stands in for are absent.
 */
function SpacerRow({ height, colSpan }: { height: number; colSpan: number }) {
  return (
    <tr aria-hidden="true">
      <td aria-hidden="true" colSpan={colSpan} style={spacerStyle(height)} />
    </tr>
  );
}
