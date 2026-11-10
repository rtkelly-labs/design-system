import { act, fireEvent, render, type RenderResult } from '@testing-library/react';
import { afterAll, beforeAll, bench, describe } from 'vitest';
import { makeRows, stubLayout, type BenchRow } from './fixtures';
import { DataTable, type Column } from '../components/DataTable';

/*
 * Mount + unmount, a sort, and a filtered `data` prop, at two sizes, for the
 * whole body and for the windowed one. See vitest.bench.config.mts for what a
 * jsdom number does and does not include.
 */

const columns: Column<BenchRow>[] = [
  { header: 'Host', accessor: 'host', rowHeader: true },
  { header: 'Region', accessor: 'region' },
  { header: 'Latency', accessor: 'latency' },
  { header: 'Errors', accessor: 'errors' },
];
const key = (row: BenchRow) => row.id;
const OPTS = { time: 400, warmupTime: 100, warmupIterations: 2, iterations: 10 };

let restore: () => void = () => {};
beforeAll(() => {
  restore = stubLayout(480);
});
afterAll(() => restore());

for (const [mode, virtualize] of [['full body', undefined], ['virtualized', { rowHeight: 44 }]] as const) {
  for (const size of mode === 'full body' ? [100, 1000] : [1000, 10_000]) {
    const rows = makeRows(size);
    const half = rows.filter((row) => row.errors % 2 === 0);

    describe(`DataTable ${mode}, ${size} rows`, () => {
      bench(
        'mount + unmount',
        () => {
          render(<DataTable columns={columns} data={rows} keyExtractor={key} virtualize={virtualize} />).unmount();
        },
        OPTS,
      );

      let mounted: RenderResult | null = null;
      let sortButton: HTMLElement | null = null;
      bench(
        'sort (one header press)',
        () => {
          act(() => {
            fireEvent.click(sortButton!);
          });
        },
        {
          ...OPTS,
          setup: () => {
            mounted = render(<DataTable columns={columns} data={rows} keyExtractor={key} virtualize={virtualize} />);
            sortButton = mounted.getAllByRole('button', { name: /Latency/ })[0];
          },
          teardown: () => mounted?.unmount(),
        },
      );

      let flip = false;
      bench(
        'filter (data prop swapped)',
        () => {
          flip = !flip;
          mounted!.rerender(
            <DataTable columns={columns} data={flip ? half : rows} keyExtractor={key} virtualize={virtualize} />,
          );
        },
        {
          ...OPTS,
          setup: () => {
            mounted = render(<DataTable columns={columns} data={rows} keyExtractor={key} virtualize={virtualize} />);
          },
          teardown: () => mounted?.unmount(),
        },
      );
    });
  }
}
