import {
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DataTable } from './DataTable';

interface TestItem {
  id: string;
  name: string;
  count: number;
}

const testData: TestItem[] = [
  { id: '1', name: 'Zeta', count: 42 },
  { id: '2', name: 'Alpha', count: 10 },
  { id: '3', name: 'Beta', count: 99 },
];

describe('DataTable', () => {
  it('renders simple column definitions and data rows', () => {
    render(
      <DataTable
        columns={[
          { header: 'Name', accessor: 'name' },
          { header: 'Count', accessor: 'count' },
        ]}
        data={testData}
        keyExtractor={(row) => row.id}
      />,
    );

    expect(screen.getByText('Name')).toBeDefined();
    expect(screen.getByText('Count')).toBeDefined();
    expect(screen.getByText('Zeta')).toBeDefined();
    expect(screen.getByText('Alpha')).toBeDefined();
    expect(screen.getByText('Beta')).toBeDefined();
  });

  it('renders custom empty message when data is empty', () => {
    render(
      <DataTable
        columns={[{ header: 'Name', accessor: 'name' }]}
        data={[]}
        emptyText="Nothing in the registry."
      />,
    );

    expect(screen.getByText('> Nothing in the registry.')).toBeDefined();
  });

  it('sorts rows when clicking sortable column header', () => {
    render(
      <DataTable
        columns={[
          { header: 'Name', accessor: 'name' },
          { header: 'Count', accessor: 'count' },
        ]}
        data={testData}
      />,
    );

    const nameHeader = screen.getByText('Name');

    // Click to sort ASC (Alpha, Beta, Zeta). The state is read off the header
    // cell's aria-sort now: the icon that used to carry it as a label is
    // decorative, so a screen reader hears the state once rather than twice.
    fireEvent.click(nameHeader);
    expect(screen.getByRole('columnheader', { name: 'Name' }).getAttribute('aria-sort')).toBe('ascending');

    const rowsAfterAsc = screen.getAllByRole('row');
    // First row is the header row, so row 1 is Alpha
    expect(rowsAfterAsc[1].textContent).toContain('Alpha');
    expect(rowsAfterAsc[2].textContent).toContain('Beta');
    expect(rowsAfterAsc[3].textContent).toContain('Zeta');

    // Click to sort DESC (Zeta, Beta, Alpha)
    fireEvent.click(nameHeader);
    expect(screen.getByRole('columnheader', { name: 'Name' }).getAttribute('aria-sort')).toBe('descending');

    const rowsAfterDesc = screen.getAllByRole('row');
    expect(rowsAfterDesc[1].textContent).toContain('Zeta');
    expect(rowsAfterDesc[2].textContent).toContain('Beta');
    expect(rowsAfterDesc[3].textContent).toContain('Alpha');
  });

  it('accepts an externally controlled TanStack table instance', () => {
    function ControlledTableWrapper() {
      const table = useReactTable({
        data: testData,
        columns: [
          {
            accessorKey: 'name',
            header: 'Cluster Node',
          },
          {
            accessorKey: 'count',
            header: 'Cores',
          },
        ],
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
      });

      return <DataTable table={table} />;
    }

    render(<ControlledTableWrapper />);

    expect(screen.getByText('Cluster Node')).toBeDefined();
    expect(screen.getByText('Zeta')).toBeDefined();
    expect(screen.getByText('42')).toBeDefined();
  });

  it('addresses semantic roles and emits no forbidden colour literals', () => {
    const FORBIDDEN =
      /brutalist-|--color-white|--border-color|zinc-|-red-\d|bg-black|text-white|border-white/;

    const { container } = render(
      <DataTable
        columns={[
          { header: 'Node', accessor: 'name' },
          { header: 'Value', accessor: 'count' },
        ]}
        data={testData}
      />,
    );

    for (const node of container.querySelectorAll<HTMLElement | SVGElement>('*')) {
      const className = typeof node.className === 'string' ? node.className : (node.className as any)?.baseVal ?? '';
      expect(className, `${node.tagName} pins a palette entry`).not.toMatch(
        FORBIDDEN,
      );
    }
  });

  // jsdom has no layout: every rect is 0×0, and the virtualizer computes no
  // window for a zero-height viewport (`calculateRange` bails at size 0).
  // Stubs give the scroll box the height the component declared for it.
  // Restored by `vitest`'s unstubGlobals between files — stubbed per test
  // here because the non-virtualized cases assert DOM that is not affected.
  function stubViewport(height: number) {
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(height);
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(800);
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders only a windowed slice of a large dataset when virtualized', () => {
    stubViewport(480);
    const bigData: TestItem[] = Array.from({ length: 5000 }, (_, i) => ({
      id: `id-${i}`,
      name: `row-${i}`,
      count: i,
    }));

    const { container } = render(
      <DataTable
        columns={[{ header: 'Name', accessor: 'name' }]}
        data={bigData}
        keyExtractor={(row) => row.id}
        virtualize={{ rowHeight: 44 }}
      />,
    );

    // Every real row carries a data-slot; two spacer rows bracket the window.
    // 5000 rendered rows would be 5000 slots — the window must be tiny.
    const rendered = container.querySelectorAll('tbody [data-slot="table-row"]');
    expect(rendered.length).toBeLessThan(50);
    // The empty state must NOT be the reason there are so few rows.
    expect(container.querySelector('[data-slot="table-body"]')?.textContent).toContain('row-0');
  });

  it('keeps pagination off the row model while virtualizing', () => {
    stubViewport(480);
    const bigData: TestItem[] = Array.from({ length: 300 }, (_, i) => ({
      id: `id-${i}`,
      name: `row-${i}`,
      count: i,
    }));

    render(
      <DataTable
        columns={[{ header: 'Name', accessor: 'name' }]}
        data={bigData}
        keyExtractor={(row) => row.id}
        pageSize={2}
        virtualize={{ rowHeight: 44 }}
      />,
    );

    // With pagination attached, the row model would hold 2 rows and virtualize
    // to a 2-row window. Instead the first window reaches past both.
    expect(screen.getByText('row-5')).toBeDefined();
  });

  it('honours pageSize and reaches every page through Pagination (issue 276)', () => {
    const thirty: TestItem[] = Array.from({ length: 30 }, (_, i) => ({
      id: `id-${i}`,
      name: `row-${i}`,
      count: i,
    }));
    const { container } = render(
      <DataTable
        columns={[{ header: 'Name', accessor: 'name' }]}
        data={thirty}
        keyExtractor={(row) => row.id}
        pageSize={25}
      />,
    );
    const bodyRows = () => container.querySelectorAll('[data-slot="table-body"] tr');

    // 25, not TanStack's default of 10.
    expect(bodyRows()).toHaveLength(25);
    expect(screen.getByText('row-24')).toBeDefined();
    expect(screen.queryByText('row-25')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(bodyRows()).toHaveLength(5);
    expect(screen.getByText('row-29')).toBeDefined();

    // The windowed-body semantics still tell the truth on page 2.
    const table = container.querySelector('table')!;
    expect(table.getAttribute('aria-rowcount')).toBe('31');
    expect(bodyRows()[0]?.getAttribute('aria-rowindex')).toBe('27');
  });

  it('follows a pageSize that changes after mount, starting again at page one', () => {
    const thirty: TestItem[] = Array.from({ length: 30 }, (_, i) => ({
      id: `id-${i}`,
      name: `row-${i}`,
      count: i,
    }));
    const props = {
      columns: [{ header: 'Name', accessor: 'name' as const }],
      data: thirty,
      keyExtractor: (row: TestItem) => row.id,
    };
    const { container, rerender } = render(<DataTable {...props} pageSize={5} />);
    const bodyRows = () => container.querySelectorAll('[data-slot="table-body"] tr');
    expect(bodyRows()).toHaveLength(5);

    fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(screen.getByText('row-10')).toBeDefined();

    // initialState is read once; the prop must win on every render.
    rerender(<DataTable {...props} pageSize={20} />);
    expect(bodyRows()).toHaveLength(20);
    expect(screen.getByText('row-0')).toBeDefined();
  });

  it('renders no pager when everything fits on one page', () => {
    render(
      <DataTable columns={[{ header: 'Name', accessor: 'name' }]} data={testData} pageSize={25} />,
    );
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it('renders every row unchanged when not virtualized', () => {
    const manyData: TestItem[] = Array.from({ length: 200 }, (_, i) => ({
      id: `id-${i}`,
      name: `row-${i}`,
      count: i,
    }));

    const { container } = render(
      <DataTable
        columns={[{ header: 'Name', accessor: 'name' }]}
        data={manyData}
        keyExtractor={(row) => row.id}
      />,
    );

    const rendered = container.querySelectorAll('tbody [data-slot="table-row"]');
    expect(rendered.length).toBe(200);
    expect(container.querySelector('[data-slot="table-virtual-scroll"]')).toBeNull();
  });
});

/**
 * #245: the semantics TanStack does not supply. Each case here fails against
 * the pre-#245 component — a clickable `<th>` with no button, no `scope`, no
 * `aria-sort`, no caption, no row count, and keys taken from screen position.
 */
describe('DataTable semantics', () => {
  const columns = [
    { header: 'Name', accessor: 'name' as const },
    { header: 'Count', accessor: 'count' as const },
  ];

  const sortStates = () =>
    screen.getAllByRole('columnheader').map((th) => th.getAttribute('aria-sort'));

  it('scopes every header cell to its column', () => {
    render(<DataTable columns={columns} data={testData} />);
    for (const th of screen.getAllByRole('columnheader')) {
      expect(th.getAttribute('scope')).toBe('col');
    }
  });

  it('renders a row-header column as th scope="row", legacy or ColumnDef', () => {
    const { unmount } = render(
      <DataTable columns={[{ ...columns[0], rowHeader: true }, columns[1]]} data={testData} />,
    );
    const legacy = screen.getAllByRole('rowheader');
    expect(legacy.map((th) => th.textContent)).toEqual(['Zeta', 'Alpha', 'Beta']);
    expect(legacy.every((th) => th.getAttribute('scope') === 'row')).toBe(true);
    unmount();

    render(
      <DataTable<TestItem>
        columns={[
          { accessorKey: 'name', header: 'Name', meta: { rowHeader: true } },
          { accessorKey: 'count', header: 'Count' },
        ]}
        data={testData}
      />,
    );
    expect(screen.getAllByRole('rowheader')).toHaveLength(3);
    expect(screen.getAllByRole('cell')).toHaveLength(3);
  });

  it('puts aria-sort on the sorted column only, and moves it with the sort', () => {
    render(<DataTable columns={columns} data={testData} />);
    // Unsorted: no header claims an order, not even "none".
    expect(sortStates()).toEqual([null, null]);

    fireEvent.click(screen.getByRole('button', { name: 'Name' }));
    expect(sortStates()).toEqual(['ascending', null]);

    // Count is numeric, so TanStack sorts it descending first.
    fireEvent.click(screen.getByRole('button', { name: 'Count' }));
    expect(sortStates()).toEqual([null, 'descending']);
  });

  it('gives aria-sort to the primary key only under a multi-column sort', () => {
    function MultiSorted() {
      const table = useReactTable({
        data: testData,
        columns: [
          { accessorKey: 'name', header: 'Name' },
          { accessorKey: 'count', header: 'Count' },
        ],
        state: { sorting: [{ id: 'count', desc: false }, { id: 'name', desc: true }] },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
      });
      return <DataTable table={table} />;
    }
    render(<MultiSorted />);
    expect(sortStates()).toEqual([null, 'ascending']);
  });

  it('scopes a grouped header to its column group, and leaf headers to their column', () => {
    render(
      <DataTable
        data={testData}
        columns={[
          {
            id: 'identity',
            header: 'Identity',
            columns: [
              { accessorKey: 'name', header: 'Name' },
              { accessorKey: 'count', header: 'Count' },
            ],
          },
        ]}
      />,
    );
    const group = screen.getByRole('columnheader', { name: /Identity/ });
    expect(group.getAttribute('colspan')).toBe('2');
    expect(group.getAttribute('scope')).toBe('colgroup');
    expect(screen.getByRole('columnheader', { name: /Name/ }).getAttribute('scope')).toBe('col');
  });

  it('sorts through a real, focusable button named by its column', () => {
    render(<DataTable columns={columns} data={testData} />);

    // The button's name is the column's alone — the brackets and the icon are
    // hidden — and what a press will do is its description.
    const button = screen.getByRole('button', { name: 'Name', description: 'Sort ascending' });
    expect(button.tagName).toBe('BUTTON');
    expect(button.getAttribute('type')).toBe('button');
    expect(screen.getByRole('columnheader', { name: 'Name' }).contains(button)).toBe(true);

    // Keyboard reachable: a native button takes focus, and Enter/Space
    // activation is the browser's (driven for real in tests/a11y.spec.ts).
    button.focus();
    expect(document.activeElement).toBe(button);

    fireEvent.click(button);
    expect(screen.getByRole('button', { name: 'Name', description: 'Sort descending' })).toBe(button);
    fireEvent.click(button);
    expect(screen.getByRole('button', { name: 'Name', description: 'Remove sort' })).toBe(button);
    fireEvent.click(button);
    expect(sortStates()).toEqual([null, null]);
  });

  it('renders no sort button where sorting is off', () => {
    const { unmount } = render(
      <DataTable columns={[{ ...columns[0], enableSorting: false }, columns[1]]} data={testData} />,
    );
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      expect.stringContaining('Count'),
    ]);
    unmount();

    render(<DataTable columns={columns} data={testData} enableSorting={false} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('names the table, and its scroll region, with a caption', () => {
    render(<DataTable columns={columns} data={testData} caption="Cluster nodes" />);
    expect(screen.getByRole('table', { name: 'Cluster nodes' })).toBeDefined();
    expect(screen.getByRole('region', { name: 'Cluster nodes' })).toBeDefined();
  });

  it('keeps an index-built key with its row through a sort', () => {
    const keyExtractor = vi.fn((_row: TestItem, index: number) => index);
    render(<DataTable columns={columns} data={testData} keyExtractor={keyExtractor} />);

    const zetaRow = screen.getByText('Zeta').closest('tr');
    fireEvent.click(screen.getByRole('button', { name: 'Name' }));

    // Keyed by screen position, React would reuse the first <tr> for Alpha and
    // rewrite its text; keyed by data position, the Zeta row itself moves.
    expect(screen.getByText('Zeta').closest('tr')).toBe(zetaRow);
    expect(keyExtractor).toHaveBeenCalledWith(testData[1], 1);
    expect(keyExtractor).not.toHaveBeenCalledWith(testData[1], 0);
  });

  it('adds no row count to a table that renders every row', () => {
    render(<DataTable columns={columns} data={testData} />);
    expect(screen.getByRole('table').hasAttribute('aria-rowcount')).toBe(false);
    for (const row of screen.getAllByRole('row')) {
      expect(row.hasAttribute('aria-rowindex')).toBe(false);
    }
  });
});

describe('DataTable virtualized row count', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const bigData: TestItem[] = Array.from({ length: 5000 }, (_, i) => ({
    id: `id-${i}`,
    name: `row-${String(i).padStart(4, '0')}`,
    count: i,
  }));

  function renderVirtualized() {
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(480);
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(800);
    return render(
      <DataTable
        columns={[{ header: 'Name', accessor: 'name' }]}
        data={bigData}
        keyExtractor={(row) => row.id}
        virtualize={{ rowHeight: 44 }}
      />,
    );
  }

  const dataRows = () => screen.getAllByRole('row').slice(1);

  it('reports the dataset, not the window, on the table element', () => {
    renderVirtualized();
    // 5000 data rows and one header row; the DOM holds a few dozen.
    const table = screen.getByRole('table');
    expect(table.tagName).toBe('TABLE');
    expect(table.getAttribute('aria-rowcount')).toBe('5001');
    expect(dataRows().length).toBeLessThan(50);
  });

  it('numbers each rendered row by its place in the whole table', () => {
    renderVirtualized();
    const [header] = screen.getAllByRole('row');
    expect(header.getAttribute('aria-rowindex')).toBe('1');
    const indices = dataRows().map((r) => Number(r.getAttribute('aria-rowindex')));
    expect(indices[0]).toBe(2);
    expect(indices).toEqual(indices.map((_, i) => i + 2));
  });

  it('keeps the count and the numbering true after a sort', () => {
    renderVirtualized();
    const button = screen.getByRole('button', { name: 'Name' });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(screen.getByRole('columnheader', { name: 'Name' }).getAttribute('aria-sort')).toBe('descending');
    expect(screen.getByRole('table').getAttribute('aria-rowcount')).toBe('5001');
    const [first] = dataRows();
    expect(first.textContent).toBe('row-4999');
    expect(first.getAttribute('aria-rowindex')).toBe('2');
  });

  it('counts a paginated window from its page offset', () => {
    const manyData = bigData.slice(0, 25);
    function Paged() {
      const table = useReactTable({
        data: manyData,
        columns: [{ accessorKey: 'name', header: 'Name' }],
        state: { pagination: { pageIndex: 1, pageSize: 10 } },
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
      });
      return <DataTable table={table} />;
    }
    render(<Paged />);
    expect(screen.getByRole('table').getAttribute('aria-rowcount')).toBe('26');
    const indices = dataRows().map((r) => r.getAttribute('aria-rowindex'));
    // Page two holds data rows 11-20, which are table rows 12-21.
    expect(indices).toEqual(Array.from({ length: 10 }, (_, i) => String(i + 12)));
    expect(dataRows()[0].textContent).toBe('row-0010');
  });
});

describe('DataTable selection', () => {
  const columns = [
    { header: 'Name', accessor: 'name' as const, rowHeader: true },
    { header: 'Count', accessor: 'count' as const },
  ];
  const twelve: TestItem[] = Array.from({ length: 12 }, (_, i) => ({
    id: `id-${i}`,
    name: `row-${String(i).padStart(2, '0')}`,
    count: i,
  }));

  interface SelectableProps {
    initial?: string[];
    onReport?: (keys: Set<string>) => void;
    rows?: TestItem[];
    columns?: typeof columns | { header: string; accessor: 'name' }[];
    pageSize?: number;
    virtualize?: { rowHeight: number };
    isRowSelectable?: (row: TestItem) => boolean | string;
    selectionLabel?: (row: TestItem) => string;
  }

  /** A real controlled owner, so a toggle round-trips through the props. */
  function Selectable({
    initial = [],
    onReport,
    rows = testData,
    columns: cols = columns,
    ...rest
  }: SelectableProps) {
    const [keys, setKeys] = useState<ReadonlySet<string>>(new Set(initial));
    return (
      <DataTable<TestItem>
        columns={cols}
        data={rows}
        keyExtractor={(row) => row.id}
        selectedKeys={keys}
        onSelectionChange={(next) => {
          onReport?.(next);
          setKeys(next);
        }}
        {...rest}
      />
    );
  }

  const box = (name: string) => screen.getByRole('checkbox', { name });
  const checked = (el: HTMLElement) => el.getAttribute('aria-checked');

  it('renders no selection column unless onSelectionChange is given', () => {
    render(<DataTable columns={columns} data={testData} keyExtractor={(row) => row.id} />);
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('names each row checkbox by its row header, and the header box by its scope', () => {
    render(<Selectable />);
    expect(box('Select Zeta')).toBeDefined();
    expect(box('Select Alpha')).toBeDefined();
    expect(box('Select all rows')).toBeDefined();
  });

  it('falls back to the key without a row header, or takes selectionLabel', () => {
    const { unmount } = render(<Selectable columns={[{ header: 'Name', accessor: 'name' }]} />);
    expect(box('Select 1')).toBeDefined();
    unmount();
    render(<Selectable selectionLabel={(row) => `Pick ${row.name} (${row.count})`} />);
    expect(box('Pick Beta (99)')).toBeDefined();
  });

  it('toggles a row, reports keys, and marks the row selected without aria-selected', () => {
    const onReport = vi.fn();
    const { container } = render(<Selectable onReport={onReport} />);
    fireEvent.click(box('Select Alpha'));
    expect(onReport).toHaveBeenLastCalledWith(new Set(['2']));
    expect(checked(box('Select Alpha'))).toBe('true');
    const row = box('Select Alpha').closest('tr')!;
    expect(row.getAttribute('data-state')).toBe('selected');
    // aria-selected belongs to a grid's rows, not a plain table's.
    expect(container.querySelector('[aria-selected]')).toBeNull();

    fireEvent.click(box('Select Alpha'));
    expect(onReport).toHaveBeenLastCalledWith(new Set());
    expect(row.hasAttribute('data-state')).toBe(false);
  });

  it('is reachable by Tab and toggled by Space', () => {
    render(<Selectable />);
    const alpha = box('Select Alpha');
    expect(alpha.tabIndex).toBe(0);
    alpha.focus();
    fireEvent.keyDown(alpha, { key: ' ' });
    fireEvent.keyUp(alpha, { key: ' ' });
    expect(checked(alpha)).toBe('true');
  });

  it('lets a sub-row from getSubRows be selected', () => {
    interface Node extends TestItem { children?: Node[] }
    const tree: Node[] = [{ id: 'p', name: 'Parent', count: 1, children: [{ id: 'c', name: 'Child', count: 2 }] }];
    const onReport = vi.fn();
    function Tree() {
      const [keys, setKeys] = useState<ReadonlySet<string>>(new Set());
      const table = useReactTable<Node>({
        data: tree,
        columns: [{ accessorKey: 'name', header: 'Name', meta: { rowHeader: true } }],
        getSubRows: (row) => row.children,
        state: { expanded: true },
        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
      });
      return (
        <DataTable<Node>
          table={table}
          keyExtractor={(row) => row.id}
          selectedKeys={keys}
          onSelectionChange={(next) => {
            onReport(next);
            setKeys(next);
          }}
        />
      );
    }
    render(<Tree />);
    fireEvent.click(box('Select Child'));
    expect(onReport).toHaveBeenLastCalledWith(new Set(['c']));
    expect(checked(box('Select Child'))).toBe('true');
  });

  it('keeps a selection with its row through a sort', () => {
    render(<Selectable initial={['3']} />);
    fireEvent.click(screen.getByRole('button', { name: 'Name' }));
    expect(screen.getAllByRole('row')[1].textContent).toContain('Alpha');
    expect(checked(box('Select Beta'))).toBe('true');
    expect(checked(box('Select Alpha'))).toBe('false');
  });

  it('shows the header box as mixed on a partial selection, and fills it on press', () => {
    const onReport = vi.fn();
    render(<Selectable initial={['1']} onReport={onReport} />);
    const all = box('Select all rows');
    expect(checked(all)).toBe('mixed');
    fireEvent.click(all);
    expect(onReport).toHaveBeenLastCalledWith(new Set(['1', '2', '3']));
    expect(checked(all)).toBe('true');
    fireEvent.click(all);
    expect(onReport).toHaveBeenLastCalledWith(new Set());
    expect(checked(all)).toBe('false');
  });

  it('selects the current page only when paginated, and keeps other pages', () => {
    const onReport = vi.fn();
    render(<Selectable rows={twelve} pageSize={5} initial={['id-11']} onReport={onReport} />);
    const all = box('Select all rows on this page');
    expect(checked(all)).toBe('false');
    fireEvent.click(all);
    expect(onReport).toHaveBeenLastCalledWith(
      new Set(['id-11', 'id-0', 'id-1', 'id-2', 'id-3', 'id-4']),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(checked(box('Select all rows on this page'))).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: 'Page 1' }));
    expect(checked(box('Select row-03'))).toBe('true');
    expect(checked(box('Select all rows on this page'))).toBe('true');
  });

  it('disables a refused row, describes why, and leaves it out of select-all', () => {
    const onReport = vi.fn();
    render(
      <Selectable
        onReport={onReport}
        isRowSelectable={(row) => (row.id === '1' ? 'Has uncommitted changes' : row.id !== '3')}
      />,
    );
    const zeta = box('Select Zeta');
    expect(zeta.getAttribute('aria-disabled')).toBe('true');
    const describedBy = zeta.getAttribute('aria-describedby') ?? '';
    const reasons = describedBy.split(' ').map((id) => document.getElementById(id)?.textContent);
    expect(reasons).toContain('Has uncommitted changes');

    // `false` disables without a reason to give.
    const beta = box('Select Beta');
    expect(beta.getAttribute('aria-disabled')).toBe('true');
    expect(beta.hasAttribute('aria-describedby')).toBe(false);

    fireEvent.click(zeta);
    expect(onReport).not.toHaveBeenCalled();

    fireEvent.click(box('Select all rows'));
    expect(onReport).toHaveBeenLastCalledWith(new Set(['2']));
    expect(checked(box('Select all rows'))).toBe('true');
  });

  it('disables the header box when nothing on the page can be selected', () => {
    render(<Selectable isRowSelectable={() => false} />);
    expect(box('Select all rows').getAttribute('aria-disabled')).toBe('true');
  });

  it('drops keys of rows that have left the data from the next report', () => {
    const onReport = vi.fn();
    render(<Selectable rows={testData.slice(1)} initial={['1', '2', 'gone']} onReport={onReport} />);
    fireEvent.click(box('Select Beta'));
    expect(onReport).toHaveBeenLastCalledWith(new Set(['2', '3']));
  });

  it('widens the empty state over the selection column', () => {
    const { container } = render(<Selectable rows={[]} />);
    const cell = container.querySelector('[data-slot="table-body"] td');
    expect(cell?.getAttribute('colspan')).toBe('3');
  });

  it('selects every row, not the window, in a virtualized table', () => {
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(480);
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(800);
    const many: TestItem[] = Array.from({ length: 500 }, (_, i) => ({
      id: `id-${i}`,
      name: `row-${i}`,
      count: i,
    }));
    const onReport = vi.fn();
    render(<Selectable rows={many} virtualize={{ rowHeight: 44 }} onReport={onReport} />);
    expect(screen.getAllByRole('checkbox').length).toBeLessThan(60);
    fireEvent.click(box('Select all rows'));
    expect((onReport.mock.lastCall?.[0] as Set<string>).size).toBe(500);
    vi.restoreAllMocks();
  });
});
