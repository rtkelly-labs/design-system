'use client';

import { useMemo, useState } from 'react';
import { DataTable, Input } from '@rtkelly13/design-system';
import { DEPLOYMENTS } from '@/data/fixtures';

export default function FilteredTable() {
  const [query, setQuery] = useState('');
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DEPLOYMENTS.filter((d) =>
      !q || `${d.service} ${d.branch} ${d.author} ${d.region}`.toLowerCase().includes(q),
    ).slice(0, 10);
  }, [query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="max-w-xs">
        <Input
          label="Filter"
          placeholder="try “fra1” or “zzz”"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <DataTable
        caption="Matching deployments"
        data={rows}
        keyExtractor={(row) => row.id}
        emptyText={`NO DEPLOYMENTS MATCH “${query.trim()}”`}
        columns={[
          { header: 'SERVICE', accessor: 'service', rowHeader: true },
          { header: 'BRANCH', accessor: 'branch' },
          { header: 'AUTHOR', accessor: 'author' },
          { header: 'REGION', accessor: 'region' },
        ]}
      />
    </div>
  );
}
