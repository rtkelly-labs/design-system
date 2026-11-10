import { act, fireEvent, render, type RenderResult } from '@testing-library/react';
import { afterAll, beforeAll, bench, describe } from 'vitest';
import { makeLogs, stubLayout } from './fixtures';
import { LogViewer } from '../components/LogViewer';

/*
 * The virtualised list. Above 200 lines LogViewer windows itself, so both
 * sizes here are windowed; what grows with the stream is the filter and sort
 * in `rows`, not the DOM. See vitest.bench.config.mts for what jsdom measures.
 */

const OPTS = { time: 400, warmupTime: 100, warmupIterations: 2, iterations: 10 };

let restore: () => void = () => {};
beforeAll(() => {
  restore = stubLayout(360);
});
afterAll(() => restore());

for (const size of [1000, 10_000]) {
  const entries = makeLogs(size);

  describe(`LogViewer, ${size} lines`, () => {
    bench('mount + unmount', () => {
      render(<LogViewer entries={entries} />).unmount();
    }, OPTS);

    let mounted: RenderResult | null = null;
    let flip = false;
    const mount = () => {
      mounted = render(<LogViewer entries={entries} />);
    };
    const unmount = () => mounted?.unmount();

    bench('filter (severities prop toggled)', () => {
      flip = !flip;
      mounted!.rerender(<LogViewer entries={entries} severities={flip ? ['warn', 'error'] : undefined} />);
    }, { ...OPTS, setup: mount, teardown: unmount });

    bench('highlight (query prop toggled)', () => {
      flip = !flip;
      mounted!.rerender(<LogViewer entries={entries} query={flip ? 'orders' : undefined} />);
    }, { ...OPTS, setup: mount, teardown: unmount });

    bench('expand + collapse one line', () => {
      const first = mounted!.container.querySelector<HTMLButtonElement>('[data-slot="log-viewer-row"] button')!;
      act(() => {
        fireEvent.click(first);
      });
      act(() => {
        fireEvent.click(first);
      });
    }, { ...OPTS, setup: mount, teardown: unmount });
  });
}
