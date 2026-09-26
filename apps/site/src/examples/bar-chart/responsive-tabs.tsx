'use client';

import { useState } from 'react';
import { BarChart, Tabs, TabsList, TabsPanel, TabsTab } from '@rtkelly13/design-system';
import { REGION_TRAFFIC } from '@/data/fixtures';

const WINDOWS = ['24h', '7d', '30d'] as const;

export default function TrafficByWindow() {
  const [range, setRange] = useState<string>('7d');

  return (
    <Tabs value={range} onValueChange={setRange} className="w-full">
      <TabsList label="Time window">
        {WINDOWS.map((w) => (
          <TabsTab key={w} value={w}>
            {w.toUpperCase()}
          </TabsTab>
        ))}
      </TabsList>
      {WINDOWS.map((w) => (
        <TabsPanel key={w} value={w} className="pt-4">
          {/* `responsive` tracks the container's width; `height` stays fixed.
              The wrapper's height is needed until issue 306 is fixed. */}
          <div className="h-[260px]">
            <BarChart
              responsive
              data={[...REGION_TRAFFIC[w]]}
              height={260}
              accent="tertiary"
              ariaLabel={`Requests by region over ${w}, in thousands`}
            />
          </div>
        </TabsPanel>
      ))}
    </Tabs>
  );
}
