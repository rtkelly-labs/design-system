import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { fireEvent, render, screen } from '@testing-library/react';
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

    // Click to sort ASC (Alpha, Beta, Zeta)
    fireEvent.click(nameHeader);
    expect(screen.getByLabelText('Sorted Ascending')).toBeDefined();

    const rowsAfterAsc = screen.getAllByRole('row');
    // First row is the header row, so row 1 is Alpha
    expect(rowsAfterAsc[1].textContent).toContain('Alpha');
    expect(rowsAfterAsc[2].textContent).toContain('Beta');
    expect(rowsAfterAsc[3].textContent).toContain('Zeta');

    // Click to sort DESC (Zeta, Beta, Alpha)
    fireEvent.click(nameHeader);
    expect(screen.getByLabelText('Sorted Descending')).toBeDefined();

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
