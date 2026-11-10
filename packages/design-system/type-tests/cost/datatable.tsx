/*
 * The heaviest generic on the surface: `DataTable<T>` over a row type, with
 * both column forms — the legacy `Column<T>` and TanStack's `ColumnDef<T>` —
 * and every row callback. `check:type-cost` counts what compiling this costs.
 */
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, type Column } from '@rtkelly-labs/design-system';

interface Deploy {
  sha: string;
  service: string;
  status: 'ok' | 'failed' | 'running';
  durationMs: number;
}

const legacy: Column<Deploy>[] = [
  { header: 'SHA', accessor: 'sha', rowHeader: true },
  { header: 'Service', accessor: 'service', enableSorting: true },
  { header: 'Took', accessor: (row) => `${row.durationMs} ms`, sortValue: (row) => row.durationMs },
];

const tanstack: ColumnDef<Deploy>[] = [
  { accessorKey: 'sha', header: 'SHA', meta: { rowHeader: true } },
  { accessorKey: 'status', header: 'Status', cell: (info) => info.getValue<string>().toUpperCase() },
  { accessorFn: (row) => row.durationMs / 1000, id: 'seconds', header: 'Seconds' },
];

export function Deploys({ rows, selected }: { rows: Deploy[]; selected: ReadonlySet<string> }) {
  return (
    <>
      <DataTable data={rows} columns={legacy} keyExtractor={(row) => row.sha} caption="Deploys" />
      <DataTable
        data={rows}
        columns={tanstack}
        keyExtractor={(row) => row.sha}
        selectedKeys={selected}
        onSelectionChange={(keys) => keys.size}
        isRowSelectable={(row) => (row.status === 'running' ? 'Still running' : true)}
        selectionLabel={(row) => `Select ${row.sha}`}
        virtualize
      />
    </>
  );
}
