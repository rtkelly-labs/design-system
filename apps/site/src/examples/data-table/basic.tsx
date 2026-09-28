'use client';

import { DataTable } from '@rtkelly13/design-system';
import { DEPLOYMENTS } from '@/data/fixtures';

const rows = DEPLOYMENTS.slice(0, 6);

export default function BasicTable() {
  return (
    <DataTable
      caption="Latest deployments"
      data={[...rows]}
      keyExtractor={(row) => row.id}
      columns={[
        { header: 'SERVICE', accessor: 'service', rowHeader: true },
        { header: 'REGION', accessor: 'region' },
        { header: 'BRANCH', accessor: 'branch' },
        { header: 'COMMIT', accessor: 'commit' },
      ]}
    />
  );
}
