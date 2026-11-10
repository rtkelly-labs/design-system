import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Profiler, type ProfilerOnRenderCallback, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeBars, makeLogs, makeRows, stubLayout, type BenchRow } from './bench/fixtures';
import { BarChart } from './components/BarChart';
import { DataTable } from './components/DataTable';
import { LogViewer } from './components/LogViewer';
import { TimeRangeProvider } from './components/TimeRange';

/**
 * Render counts: how much work an interaction causes, as numbers that do not
 * move between machines. The benchmarks (`pnpm bench`) say how long; these say
 * how many — commits under a `<Profiler>`, cell renderers called, accessors
 * run — and a regression in either memoisation or windowing changes them.
 *
 * Bounds are the measured value or the arithmetic of the window, not a guess
 * with headroom: a bound with slack is a bound a regression fits under.
 */

/** Wraps `ui` in a Profiler and counts its commits. */
function profiled(ui: ReactNode) {
  const commits: string[] = [];
  const onRender: ProfilerOnRenderCallback = (_id, phase) => {
    commits.push(phase);
  };
  const result = render(
    <Profiler id="subject" onRender={onRender}>
      {ui}
    </Profiler>,
  );
  return {
    ...result,
    commits,
    /** Commits since the last call. */
    take: () => commits.splice(0).length,
    rerenderProfiled: (next: ReactNode) =>
      result.rerender(
        <Profiler id="subject" onRender={onRender}>
          {next}
        </Profiler>,
      ),
  };
}

let restoreLayout: () => void = () => {};
beforeEach(() => {
  restoreLayout = stubLayout(480);
});
afterEach(() => restoreLayout());

describe('DataTable render counts', () => {
  const key = (row: BenchRow) => row.id;
  /** TanStack columns whose accessor and cell renderer count their calls. */
  function countedColumns() {
    const calls = { accessor: 0, cell: 0 };
    const columns: ColumnDef<BenchRow, number>[] = [
      {
        id: 'latency',
        header: 'Latency',
        accessorFn: (row) => {
          calls.accessor += 1;
          return row.latency;
        },
        cell: (info) => {
          calls.cell += 1;
          return info.getValue();
        },
      },
      { id: 'errors', header: 'Errors', accessorFn: (row) => row.errors, enableSorting: false },
    ];
    return { columns, calls };
  }
  const reset = (calls: { accessor: number; cell: number }) => {
    calls.accessor = 0;
    calls.cell = 0;
  };
  const sortBy = (name: RegExp) =>
    act(() => {
      fireEvent.click(screen.getByRole('button', { name }));
    });

  it('a parent re-render of a sorted table re-runs no accessor', () => {
    const rows = makeRows(200);
    const { columns, calls } = countedColumns();
    const ui = () => <DataTable columns={columns} data={rows} keyExtractor={key} />;
    const view = profiled(ui());
    sortBy(/Latency/);
    reset(calls);
    view.take();
    // Same `columns`, same `data`: the normalised columns are memoised, so
    // TanStack keeps its core and sorted row models and every row's value
    // cache. Cells render again — DataTable does not memoise rows — but
    // nothing is re-sorted.
    view.rerenderProfiled(ui());
    expect(view.take()).toBe(1);
    expect(calls.accessor).toBe(0);
    expect(calls.cell).toBe(200);
  });

  it('sorting 1,000 rows runs no accessor, and renders each cell once', () => {
    const rows = makeRows(1000);
    const { columns, calls } = countedColumns();
    const view = profiled(<DataTable columns={columns} data={rows} keyExtractor={key} />);
    // Mounting reads every value once, through the cells.
    expect(calls.accessor).toBe(1000);
    reset(calls);
    view.take();
    // The sort reads the same values from each row's cache: no accessor runs,
    // and each cell renders once in its new position.
    sortBy(/Latency/);
    expect(view.take()).toBe(1);
    expect(calls.accessor).toBe(0);
    expect(calls.cell).toBe(1000);
  });

  it('a virtualized sort of 10,000 rows renders only the window', () => {
    const rows = makeRows(10_000);
    const { columns, calls } = countedColumns();
    const view = profiled(
      <DataTable columns={columns} data={rows} keyExtractor={key} virtualize={{ rowHeight: 44, overscan: 8 }} />,
    );
    reset(calls);
    view.take();
    sortBy(/Latency/);
    // 480px / 44px is 11 rows in view, plus 8 overscan past the bottom edge:
    // the bound is the window's arithmetic, so it cannot drift towards N.
    const window = Math.ceil(480 / 44) + 8;
    expect(calls.cell).toBeGreaterThan(0);
    expect(calls.cell).toBeLessThanOrEqual(window);
    expect(view.take()).toBe(1);
  });
});

describe('BarChart render counts', () => {
  it('hovering a bar re-renders nothing; the hover is CSS', () => {
    const view = profiled(<BarChart data={makeBars(24)} onBarClick={() => {}} />);
    view.take();
    const bars = screen.getAllByRole('button');
    for (const bar of bars.slice(0, 6)) {
      fireEvent.pointerOver(bar);
      fireEvent.mouseOver(bar);
      fireEvent.mouseEnter(bar);
      fireEvent.pointerOut(bar);
      fireEvent.mouseLeave(bar);
    }
    expect(view.take()).toBe(0);
  });

  it('an arrow key moves the roving stop in one commit', () => {
    const view = profiled(<BarChart data={makeBars(24)} onBarClick={() => {}} />);
    view.take();
    const [first] = screen.getAllByRole('button');
    act(() => {
      first.focus();
    });
    expect(view.take()).toBe(0);
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    expect(view.take()).toBe(1);
  });
});

describe('LogViewer render counts', () => {
  it('hovering lines outside a TimeRangeProvider re-renders nothing', () => {
    const view = profiled(<LogViewer entries={makeLogs(5000)} />);
    view.take();
    const lines = view.container.querySelectorAll('[data-slot="log-viewer-row"]');
    expect(lines.length).toBeGreaterThan(0);
    lines.forEach((line) => fireEvent.mouseEnter(line));
    expect(view.take()).toBe(0);
  });

  it('inside a provider, a hover is one commit, and hovering the same line again is not one per hover', () => {
    const view = profiled(
      <TimeRangeProvider now={Date.UTC(2026, 9, 23)}>
        <LogViewer entries={makeLogs(5000)} followRange={false} />
      </TimeRangeProvider>,
    );
    view.take();
    const [first, second] = view.container.querySelectorAll('[data-slot="log-viewer-row"]');
    fireEvent.mouseEnter(first);
    expect(view.take()).toBe(1);
    // The cursor is already this line's time. React may render the provider
    // once more before it bails out on an unchanged state, never once per hover.
    for (let i = 0; i < 5; i++) fireEvent.mouseEnter(first);
    expect(view.take()).toBeLessThanOrEqual(1);
    fireEvent.mouseEnter(second);
    expect(view.take()).toBe(1);
  });
});
