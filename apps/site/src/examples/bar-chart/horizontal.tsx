'use client';

import { BarChart } from '@rtkelly13/design-system';
import { SERVICES, seeded } from '@/data/fixtures';

const rng = seeded(0xc0de);
const BUILD_MINUTES = SERVICES.map((service) => ({ label: service, value: rng.int(40, 610) })).sort(
  (a, b) => b.value - a.value,
);

export default function HorizontalBarChart() {
  return (
    <BarChart
      data={BUILD_MINUTES}
      orientation="horizontal"
      accent="secondary"
      width={560}
      height={320}
      margin={{ top: 16, right: 56, bottom: 36, left: 128 }}
      ariaLabel="Build minutes per service this month"
    />
  );
}
