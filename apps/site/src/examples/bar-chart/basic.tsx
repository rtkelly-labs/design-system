'use client';

import { BarChart } from '@rtkelly13/design-system';
import { REGION_LATENCY } from '@/data/fixtures';

export default function BasicBarChart() {
  return (
    <BarChart
      data={[...REGION_LATENCY]}
      width={560}
      height={280}
      ariaLabel="p95 latency by region, last 7 days, in milliseconds"
    />
  );
}
