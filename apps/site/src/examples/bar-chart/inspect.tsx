'use client';

import { useState } from 'react';
import { BarChart, type BarChartDatum } from '@rtkelly13/design-system';
import { REGION_LATENCY } from '@/data/fixtures';

export default function InspectBars() {
  const [picked, setPicked] = useState<BarChartDatum | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <BarChart
        data={[...REGION_LATENCY]}
        width={560}
        height={260}
        accent="secondary"
        onBarClick={(datum) => setPicked(datum)}
        ariaLabel="p95 latency by region. Select a bar for detail"
      />
      <p role="status" className="m-0 font-mono text-sm text-content-secondary">
        {picked ? `> ${picked.label}: ${picked.value} ms p95` : '> click a bar'}
      </p>
    </div>
  );
}
