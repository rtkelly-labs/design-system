'use client';

import { DataTable } from '@rtkelly13/design-system';
import { DEPLOYMENTS, formatStamp } from '@/data/fixtures';

export default function PaginatedTable() {
  return (
    <DataTable
      caption={`All deployments (${DEPLOYMENTS.length})`}
      data={[...DEPLOYMENTS]}
      pageSize={8}
      keyExtractor={(row) => row.id}
      columns={[
        { header: 'ID', accessor: 'id', rowHeader: true, className: 'font-mono' },
        { header: 'SERVICE', accessor: 'service' },
        { header: 'ENVIRONMENT', accessor: 'environment' },
        { header: 'STARTED', accessor: (row) => formatStamp(row.startedAt), sortValue: (row) => row.startedAt },
      ]}
    />
  );
}
