'use client';

import { DataTable } from '@rtkelly13/design-system';
import { REGIONS, SERVICES, seeded } from '@/data/fixtures';

interface LogLine {
  seq: number;
  service: string;
  region: string;
  status: number;
  latency: number;
}

// Five thousand request log lines, from a fixed seed, so every render is the same.
const rng = seeded(0xb16);
const LINES: LogLine[] = Array.from({ length: 5000 }, (_, seq) => ({
  seq,
  service: rng.pick(SERVICES),
  region: rng.pick(REGIONS),
  status: rng.next() < 0.96 ? 200 : rng.pick([429, 500, 502, 503]),
  latency: rng.int(4, 900),
}));

export default function VirtualizedTable() {
  return (
    <DataTable
      caption="Request log (5,000 rows)"
      data={LINES}
      virtualize={{ height: 360, rowHeight: 44 }}
      keyExtractor={(row) => row.seq}
      columns={[
        { header: '#', accessor: 'seq', rowHeader: true, className: 'tabular-nums' },
        { header: 'SERVICE', accessor: 'service' },
        { header: 'REGION', accessor: 'region' },
        { header: 'STATUS', accessor: 'status', className: 'tabular-nums' },
        { header: 'LATENCY MS', accessor: 'latency', className: 'text-right tabular-nums' },
      ]}
    />
  );
}
