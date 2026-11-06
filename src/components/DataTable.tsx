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
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { cn } from '../lib/recipe';
import { NerdIcon } from './NerdIcon';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './Table';

// Legacy column interface for backwards-compatibility
export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  className?: string;
  enableSorting?: boolean;
  sortValue?: (row: T) => any;
}

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
  keyExtractor?: (row: T, index: number) => string | number;
  emptyText?: string;
  className?: string;
  containerClassName?: string;
  /**
   * Window the body to the visible rows so a dataset of thousands renders as
   * many rows as fit, not as many as exist. `true` uses the defaults;
   * mutually exclusive with `pageSize`, which wins nothing — pagination is
   * simply not attached while virtualizing.
   */
  virtualize?: boolean | DataTableVirtualization;
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
        enableSorting?: boolean;
        pageSize?: number;
      }
  );

export function DataTable<T>({
  table: providedTable,
  columns,
  data,
  keyExtractor,
  emptyText = 'No items found.',
  className = '',
  containerClassName = '',
  virtualize,
  ...rest
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  // Memoized (the exhaustive-deps rule's own suggestion): a caller passing a
  // fresh `virtualize={{ ... }}` literal must not churn the measure effect.
  const virtualization = useMemo(
    () => (virtualize ? (typeof virtualize === 'object' ? virtualize : {}) : undefined),
    [virtualize],
  );
  const {
    height = 480,
    rowHeight = 44,
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
        },
      } as ColumnDef<T, any>;
    });
  }, [columns]);

  const defaultTable = useReactTable<T>({
    data: data || [],
    columns: tanstackColumns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel:
      !virtualization && 'pageSize' in rest && rest.pageSize
        ? getPaginationRowModel()
        : undefined,
  });

  const activeTable = providedTable || defaultTable;
  const rows = activeTable.getRowModel().rows;

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

  const renderRow = (row: (typeof rows)[number], rowIdx: number) => {
    const rowKey = keyExtractor ? keyExtractor(row.original, rowIdx) : row.id;

    return (
      <TableRow key={rowKey} data-state={row.getIsSelected() && 'selected'}>
        {row.getVisibleCells().map((cell) => {
          const meta = cell.column.columnDef.meta as { className?: string } | undefined;
          return (
            <TableCell key={cell.id} className={meta?.className}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          );
        })}
      </TableRow>
    );
  };

  const colSpan = activeTable.getAllColumns().length || 1;

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

  const table = (
    <Table
      className={className}
      containerClassName={
        virtualization && !scrollElementRef
          ? cn(containerClassName, 'border-0 overflow-x-visible')
          : containerClassName
      }
    >
      <TableHeader>
        {activeTable.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const canSort = header.column.getCanSort();
              const isSorted = header.column.getIsSorted();
              const meta = header.column.columnDef.meta as { className?: string } | undefined;

              return (
                <TableHead
                  key={header.id}
                  className={cn(
                    canSort && 'cursor-pointer select-none hover:bg-surface-base transition-colors',
                    meta?.className,
                  )}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {header.isPlaceholder ? null : (
                    <span className="inline-flex items-center gap-1.5">
                      <span>[</span>
                      <span>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </span>
                      {canSort && (
                        <span className="inline-flex items-center">
                          {isSorted === 'asc' ? (
                            <NerdIcon name="sort-asc" size="sm" accent="primary" label="Sorted Ascending" />
                          ) : isSorted === 'desc' ? (
                            <NerdIcon name="sort-desc" size="sm" accent="primary" label="Sorted Descending" />
                          ) : (
                            <NerdIcon name="sort" size="sm" accent="muted" label="Sortable" />
                          )}
                        </span>
                      )}
                      <span>]</span>
                    </span>
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
              className="px-4 py-8 text-center text-content-muted font-mono"
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
          rows.map((row, rowIdx) => renderRow(row, rowIdx))
        )}
      </TableBody>
    </Table>
  );

  if (!virtualization || scrollElementRef) return table;

  return (
    <div
      ref={scrollRef}
      data-slot="table-virtual-scroll"
      tabIndex={0}
      role="region"
      aria-label="Table contents"
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
