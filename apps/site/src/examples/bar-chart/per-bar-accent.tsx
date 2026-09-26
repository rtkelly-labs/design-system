'use client';

import { BarChart, type BarChartDatum } from '@rtkelly13/design-system';
import { REGION_LATENCY } from '@/data/fixtures';

const SLO_MS = 150;

// Meaning, not decoration: a bar over the objective takes the danger intent.
const data: BarChartDatum[] = REGION_LATENCY.map((d) => ({
  ...d,
  accent: d.value > SLO_MS ? 'danger' : 'quiet',
}));

export default function PerBarAccent() {
  const breaches = data.filter((d) => d.value > SLO_MS).map((d) => d.label);
  return (
    <figure className="m-0 flex flex-col gap-3">
      <BarChart
        data={data}
        width={560}
        height={280}
        ariaLabel={`p95 latency by region. ${breaches.join(', ')} over the ${SLO_MS} ms objective`}
      />
      <figcaption className="font-mono text-xs uppercase text-content-muted">
        &gt; over {SLO_MS} ms: {breaches.join(', ') || 'none'}
      </figcaption>
    </figure>
  );
}
