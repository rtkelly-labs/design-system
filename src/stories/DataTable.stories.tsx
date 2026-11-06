import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Badge } from '../components/Badge';
import { DataTable } from '../components/DataTable';
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

const STATE_ACCENT = { ready: 'success', building: 'info', error: 'danger' } as const;

const meta: Meta<typeof DataTable<Deployment>> = {
  title: 'Foundations/DataTable',
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
