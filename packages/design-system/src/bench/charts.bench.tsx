import { act, fireEvent, render, type RenderResult } from '@testing-library/react';
import { afterAll, beforeAll, bench, describe, vi } from 'vitest';
import { LOG_EPOCH, makeBars, makeSeries } from './fixtures';
import { BarChart } from '../components/BarChart';
import { TimeSeriesChart } from '../components/TimeSeriesChart';

/*
 * The visx charts. BarChart's cost is per bar (a scale lookup, a <rect>, a
 * value label); TimeSeriesChart's is per sample (path strings), and its
 * crosshair re-renders on every pointer move, so that is the update measured.
 */

const OPTS = { time: 400, warmupTime: 100, warmupIterations: 2, iterations: 10 };

beforeAll(() => {
  // jsdom has no PointerEvent; React reads clientX off whatever arrives.
  if (typeof window.PointerEvent === 'undefined') {
    vi.stubGlobal('PointerEvent', class extends MouseEvent {
      pointerId = 1;
    });
  }
});
afterAll(() => {
  vi.unstubAllGlobals();
});

for (const size of [20, 200]) {
  const data = makeBars(size);
  const shifted = data.map((d) => ({ ...d, value: d.value + 10 }));

  describe(`BarChart, ${size} bars`, () => {
    bench('mount + unmount', () => {
      render(<BarChart data={data} onBarClick={() => {}} />).unmount();
    }, OPTS);

    let mounted: RenderResult | null = null;
    let flip = false;
    bench('update (data prop swapped)', () => {
      flip = !flip;
      mounted!.rerender(<BarChart data={flip ? shifted : data} onBarClick={() => {}} />);
    }, {
      ...OPTS,
      setup: () => {
        mounted = render(<BarChart data={data} onBarClick={() => {}} />);
      },
      teardown: () => mounted?.unmount(),
    });
  });
}

for (const size of [100, 1000]) {
  const series = makeSeries(size);
  const range = { from: LOG_EPOCH - (size + 1) * 60_000, to: LOG_EPOCH };

  describe(`TimeSeriesChart, 3 series × ${size} points`, () => {
    bench('mount + unmount', () => {
      render(<TimeSeriesChart series={series} range={range} title="Latency" />).unmount();
    }, OPTS);

    let mounted: RenderResult | null = null;
    let svg: SVGSVGElement | null = null;
    let x = 0;
    bench('crosshair (one pointer move)', () => {
      x = (x + 37) % 500;
      act(() => {
        fireEvent.pointerMove(svg!, { clientX: 52 + x, pointerId: 1 });
      });
    }, {
      ...OPTS,
      setup: () => {
        mounted = render(<TimeSeriesChart series={series} range={range} title="Latency" />);
        svg = mounted.container.querySelector<SVGSVGElement>('[data-part="plot"] svg');
      },
      teardown: () => mounted?.unmount(),
    });
  });
}
