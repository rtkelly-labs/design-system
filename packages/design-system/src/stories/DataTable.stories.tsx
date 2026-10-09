import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Badge } from '../components/Badge';
import { DataTable, type Column } from '../components/DataTable';
import { ThemeProvider } from '../components/ThemeProvider';
import { LEVELS, THEME_LEVELS } from '../theme/levels';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/Table';

interface Deployment {
  id: string;
  branch: string;
  state: 'ready' | 'building' | 'error';
  duration: string;
  commits: number;
}

const rows: Deployment[] = [
  { id: 'dpl_1', branch: 'main', state: 'ready', duration: '1m 12s', commits: 42 },
  { id: 'dpl_2', branch: 'preview', state: 'building', duration: '—', commits: 18 },
  { id: 'dpl_3', branch: 'fix/theme', state: 'error', duration: '0m 41s', commits: 5 },
  { id: 'dpl_4', branch: 'feat/headless-primitives', state: 'ready', duration: '2m 04s', commits: 99 },
];

const appearanceColumns: Column<Deployment>[] = [
  { header: 'BRANCH', accessor: 'branch', rowHeader: true },
  { header: 'STATE', accessor: 'state' },
  { header: 'DURATION', accessor: 'duration' },
  { header: 'COMMITS', accessor: 'commits' },
];

const STATE_ACCENT = { ready: 'success', building: 'info', error: 'danger' } as const;

const meta: Meta<typeof DataTable<Deployment>> = {
  title: 'Components/Data/DataTable',
  component: DataTable,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof DataTable<Deployment>>;

export const Default: Story = {
  args: {
    data: rows,
    keyExtractor: (row) => row.id,
    columns: [
      { header: 'BRANCH', accessor: 'branch' },
      { header: 'STATE', accessor: 'state' },
      { header: 'DURATION', accessor: 'duration' },
    ],
  },
};

/** An `accessor` function renders arbitrary nodes, not just field values. */
export const WithRenderedCells: Story = {
  args: {
    data: rows,
    keyExtractor: (row) => row.id,
    columns: [
      { header: 'BRANCH', accessor: 'branch' },
      {
        header: 'STATE',
        accessor: (row) => <Badge accent={STATE_ACCENT[row.state]}>{row.state.toUpperCase()}</Badge>,
      },
      { header: 'COMMITS', accessor: 'commits' },
      { header: 'DURATION', accessor: 'duration' },
    ],
  },
};

export const Empty: Story = {
  args: {
    data: [],
    keyExtractor: (row) => row.id,
    emptyText: 'NO DEPLOYMENTS YET',
    columns: [
      { header: 'BRANCH', accessor: 'branch' },
      { header: 'STATE', accessor: 'state' },
    ],
  },
};

/**
 * Ten thousand deployments — the dataset size where the issue #204 said
 * pagination stops being an answer. The data is generated deterministically
 * (no `Math.random`, no clock) per docs/deterministic-rendering.md, because
 * this story carries a snapshot.
 */
const bigRows: Deployment[] = Array.from({ length: 10_000 }, (_, i) => ({
  id: `dpl_${i}`,
  branch: `deploy/batch-${Math.floor(i / 500)}-${i}`,
  state: i % 17 === 0 ? 'error' : i % 5 === 0 ? 'building' : 'ready',
  duration: `${Math.floor(i / 60) % 10}m ${String(i % 60).padStart(2, '0')}s`,
  commits: i,
}));

/** Rows are windowed: the DOM holds the viewport, not the dataset. */
export const Virtualized: Story = {
  args: {
    data: bigRows,
    keyExtractor: (row) => row.id,
    columns: [
      { header: 'BRANCH', accessor: 'branch' },
      { header: 'STATE', accessor: 'state' },
      { header: 'DURATION', accessor: 'duration' },
      { header: 'COMMITS', accessor: 'commits' },
    ],
    virtualize: { height: 480 },
  },
};

/**
 * `pageSize` shows that many rows and puts the system's `Pagination` under the
 * table, so every page is reachable. The table still states the full row count
 * and each row's real position to assistive tech.
 */
export const Paginated: Story = {
  args: {
    data: bigRows.slice(0, 60),
    keyExtractor: (row) => row.id,
    columns: [
      { header: 'BRANCH', accessor: 'branch' },
      { header: 'STATE', accessor: 'state' },
      { header: 'DURATION', accessor: 'duration' },
      { header: 'COMMITS', accessor: 'commits' },
    ],
    pageSize: 8,
  },
};

/** Controlled TanStack Table with multi-column sorting. */
export const HeadlessTanStackTable: Story = {
  render: () => {
    function ControlledExample() {
      const [sorting, setSorting] = useState<SortingState>([]);
      const table = useReactTable({
        data: rows,
        columns: [
          {
            accessorKey: 'branch',
            header: 'BRANCH',
          },
          {
            accessorKey: 'state',
            header: 'STATUS',
            cell: (info) => {
              const state = info.getValue() as Deployment['state'];
              return <Badge accent={STATE_ACCENT[state]}>{state.toUpperCase()}</Badge>;
            },
          },
          {
            accessorKey: 'commits',
            header: 'COMMITS',
          },
          {
            accessorKey: 'duration',
            header: 'DURATION',
          },
        ],
        state: {
          sorting,
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
      });

      return <DataTable table={table} />;
    }

    return <ControlledExample />;
  },
};

/**
 * The semantics at rest, sorted. A `caption` states what the table is of and
 * names it; the branch column is a row header (`meta.rowHeader`), so moving
 * across a row announces whose row it is; and the commits column is sorted, so
 * its header carries `aria-sort="descending"` — the only header that does.
 * Every sortable header is a real button: Tab to it, Enter or Space to sort.
 */
export const SortedWithCaption: Story = {
  render: () => {
    function SortedExample() {
      const table = useReactTable({
        data: rows,
        columns: [
          { accessorKey: 'branch', header: 'BRANCH', meta: { rowHeader: true } },
          { accessorKey: 'state', header: 'STATE' },
          { accessorKey: 'commits', header: 'COMMITS' },
          { accessorKey: 'duration', header: 'DURATION', enableSorting: false },
        ],
        initialState: { sorting: [{ id: 'commits', desc: true }] },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
      });

      return <DataTable table={table} caption="Deployments by commit count" />;
    }

    return <SortedExample />;
  },
};

/** Direct use of compound <Table> primitives. */
export const CompoundTable: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>[ CLUSTER ]</TableHead>
          <TableHead>[ HEALTH ]</TableHead>
          <TableHead>[ LATENCY ]</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>us-east-edge-1</TableCell>
          <TableCell><Badge accent="success">HEALTHY</Badge></TableCell>
          <TableCell>12ms</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>eu-west-edge-2</TableCell>
          <TableCell><Badge accent="warning">DEGRADED</Badge></TableCell>
          <TableCell>145ms</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

/**
 * Compares the quiet ruled and keyline index appearances at compact density.
 * Each panel scopes the same two tables to one theme level, so their contrast
 * and hierarchy can be reviewed together without changing the Storybook toolbar.
 */
export const AppearanceMatrix: Story = {
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'Use Quiet ruled when the data should carry the hierarchy. Use Keyline index when readers need a stronger row-name anchor. Both appearances keep the same table semantics and sort controls.',
      },
    },
  },
  render: () => (
    <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-2">
      {THEME_LEVELS.map((level) => (
        <ThemeProvider
          key={level}
          scoped
          defaultLevel={level}
          persist={false}
          followSystem={false}
          className="flex min-w-0 flex-col gap-4 border-2 border-edge-strong bg-surface-base p-4 text-content-primary"
        >
          <div className="flex items-baseline justify-between gap-4 border-b border-edge-subtle pb-2">
            <h2 className="font-display text-xl font-bold">[ {LEVELS[level].label} ]</h2>
            <span className="font-mono text-xs uppercase text-content-muted">
              {LEVELS[level].polarity} level
            </span>
          </div>

          <section className="space-y-2">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-content-secondary">
              01 // Quiet ruled
            </h3>
            <DataTable
              appearance="quiet"
              density="compact"
              columns={appearanceColumns}
              data={rows}
              keyExtractor={(row) => row.id}
              caption="Deployments with horizontal rules only"
            />
          </section>

          <section className="space-y-2">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-content-secondary">
              02 // Keyline index
            </h3>
            <DataTable
              appearance="index"
              density="compact"
              columns={appearanceColumns}
              data={rows}
              keyExtractor={(row) => row.id}
              caption="Deployments anchored by row headers"
            />
          </section>
        </ThemeProvider>
      ))}
    </div>
  ),
};
