'use client';

import { BarChart, SeriesLegend } from '@rtkelly13/design-system';
import type { BarChartDatum, SeriesLegendItem, SeriesIndex } from '@rtkelly13/design-system';
import { REGION_LATENCY } from '@/data/fixtures';

// Six regions, one series member each. Colour comes from the series group and the
// name is written twice in text: on the axis, and in the legend below.
const data: BarChartDatum[] = REGION_LATENCY.slice(0, 6).map((d, i) => ({
  ...d,
  series: (i + 1) as SeriesIndex,
}));

const legend: SeriesLegendItem[] = data.map((d) => ({ label: d.label, series: d.series! }));

export default function Series() {
  return (
    <figure className="m-0 flex flex-col gap-3">
      <BarChart data={data} width={560} height={300} ariaLabel="p95 latency by region, six series" />
      <SeriesLegend items={legend} aria-label="Regions" />
      <figcaption className="font-mono text-xs uppercase text-content-muted">
        &gt; open the accessibility menu and choose Patterns to add a shape and letter to each bar
      </figcaption>
    </figure>
  );
}
