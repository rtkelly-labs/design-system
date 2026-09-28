'use client';

import { Badge, DataTable, type Column } from '@rtkelly13/design-system';
import { DEPLOYMENTS, formatDuration, formatStamp, type Deployment } from '@/data/fixtures';

const STATUS_INTENT = {
  LIVE: 'success',
  FAILED: 'danger',
  'ROLLED BACK': 'warning',
  BUILDING: 'info',
} as const;

const columns: Column<Deployment>[] = [
  { header: 'SERVICE', accessor: 'service', rowHeader: true },
  {
    header: 'STATUS',
    accessor: (row) => <Badge accent={STATUS_INTENT[row.status]}>{row.status}</Badge>,
    // Sort on the value, not on the rendered badge.
    sortValue: (row) => row.status,
  },
  {
    header: 'DURATION',
    accessor: (row) => (row.duration ? formatDuration(row.duration) : '—'),
    sortValue: (row) => row.duration,
    className: 'text-right tabular-nums',
  },
  {
    header: 'STARTED',
    accessor: (row) => formatStamp(row.startedAt),
    sortValue: (row) => row.startedAt,
  },
  { header: 'AUTHOR', accessor: 'author', enableSorting: false },
];

export default function RenderedCells() {
  return (
    <DataTable
      caption="Deployments, last 24 hours"
      data={DEPLOYMENTS.slice(0, 8)}
      columns={columns}
      keyExtractor={(row) => row.id}
    />
  );
}
