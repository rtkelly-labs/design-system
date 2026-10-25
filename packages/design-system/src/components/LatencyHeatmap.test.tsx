import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { LatencyCell } from '../lib/latency';
import { LATENCY_HEATMAP_VARIANTS, LatencyHeatmap } from './LatencyHeatmap';
import { TimeRangeProvider, useTimeCursor, useTimeRange, type TimeCursorState, type TimeRangeState } from './TimeRange';

const NOW = Date.UTC(2026, 9, 22, 14, 0);
const HOUR = 3_600_000;
const range = { from: NOW - HOUR, to: NOW };
// 600 points, one every 6s: 20…110ms cycling, and every 50th a 900ms outlier.
const points = Array.from({ length: 600 }, (_, index) => ({ time: range.from + index * 6000, value: index % 50 === 0 ? 900 : 20 + (index % 10) * 10 }));

// Geometry with the 640px fallback width: plot 576 × 208 at (48, 8); 60 columns of 9.6px, 16 rows of 13px.
const at = (column: number, row: number, rows = 16) => ({ clientX: 48 + column * 9.6 + 4, clientY: 8 + (rows - 1 - row) * 13 + 6 });
const grid = () => screen.getByRole('grid');
const description = (element: Element) => document.getElementById(element.getAttribute('aria-describedby') ?? '')?.textContent ?? '';

describe('LatencyHeatmap', () => {
  it('carries its slot, ref, className and spread props', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<LatencyHeatmap ref={ref} points={points} range={range} className="mt-2" data-testid="heat" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset.slot).toBe('latency-heatmap');
    expect(ref.current).toBe(root);
    expect(root.className).toContain('mt-2');
    expect(root.dataset.testid).toBe('heat');
  });

  it('draws a columns × rows grid of cells and summarises it', () => {
    const { container } = render(<LatencyHeatmap points={points} range={range} title="API latency" />);
    expect(container.querySelectorAll('[role="row"]')).toHaveLength(16);
    expect(container.querySelectorAll('[role="gridcell"]')).toHaveLength(960);
    expect(grid().getAttribute('aria-label')).toBe('API latency');
    expect(description(grid())).toMatch(/^600 requests between 13:00 – 14:00 UTC\. Busiest cell: .+\. Overall p99 900ms\.$/);
  });

  it('shows the empty state', () => {
    render(<LatencyHeatmap points={[]} />);
    expect(screen.getByText('No samples.')).toBeTruthy();
  });

  it('moves a focus cell with the arrow keys and selects it with Enter', () => {
    const onCellSelect = vi.fn<(cell: LatencyCell) => void>();
    const { container } = render(<LatencyHeatmap points={points} range={range} onCellSelect={onCellSelect} />);
    const chart = grid();
    fireEvent.focus(chart);
    const first = chart.getAttribute('aria-activedescendant')!;
    expect(first).toBeTruthy();
    fireEvent.keyDown(chart, { key: 'ArrowRight' });
    fireEvent.keyDown(chart, { key: 'ArrowUp' });
    const moved = chart.getAttribute('aria-activedescendant')!;
    expect(moved).not.toBe(first);
    expect(document.getElementById(moved)).toBeTruthy();
    fireEvent.keyDown(chart, { key: 'Home' });
    fireEvent.keyDown(chart, { key: 'PageDown' });
    fireEvent.keyDown(chart, { key: 'Enter' });
    expect(onCellSelect).toHaveBeenCalledTimes(1);
    expect(onCellSelect.mock.calls[0]![0]).toMatchObject({ column: 0, row: 0 });
    expect(container.querySelector('[data-part="selected"]')).toBeTruthy();
    expect(container.querySelector('[data-part="focus"]')).toBeTruthy();
  });

  it('selects the clicked cell and reads out the hovered one', () => {
    const onCellSelect = vi.fn<(cell: LatencyCell) => void>();
    render(<LatencyHeatmap points={points} range={range} onCellSelect={onCellSelect} />);
    fireEvent.mouseMove(grid(), at(3, 2));
    expect(screen.getByText(/^13:03–13:04 · .+ · \d+ requests?$/)).toBeTruthy();
    fireEvent.mouseDown(grid(), { ...at(3, 2), button: 0 });
    fireEvent.mouseUp(grid(), at(3, 2));
    expect(onCellSelect.mock.calls[0]![0]).toMatchObject({ column: 3, row: 2, timeRange: { from: range.from + 3 * 60_000, to: range.from + 4 * 60_000 } });
  });

  it('reports a drag across columns standalone', () => {
    const onRangeSelect = vi.fn();
    const { container } = render(<LatencyHeatmap points={points} range={range} onRangeSelect={onRangeSelect} />);
    fireEvent.mouseDown(grid(), { ...at(10, 5), button: 0 });
    fireEvent.mouseMove(grid(), at(19, 5));
    expect(container.querySelector('[data-part="brush"]')).toBeTruthy();
    fireEvent.mouseUp(grid(), at(19, 5));
    expect(onRangeSelect).toHaveBeenCalledWith({ from: range.from + 10 * 60_000, to: range.from + 20 * 60_000 });
    expect(container.querySelector('[data-part="brush"]')).toBeNull();
  });

  it('does not zoom when zoomable is false', () => {
    const onRangeSelect = vi.fn();
    render(<LatencyHeatmap points={points} range={range} onRangeSelect={onRangeSelect} zoomable={false} />);
    fireEvent.mouseDown(grid(), { ...at(10, 5), button: 0 });
    fireEvent.mouseUp(grid(), at(19, 5));
    expect(onRangeSelect).not.toHaveBeenCalled();
  });

  it('follows the provider: its range, its cursor, and zooming it', () => {
    let state: TimeRangeState | null = null;
    let cursor: TimeCursorState | null = null;
    function Probe() {
      state = useTimeRange();
      cursor = useTimeCursor();
      return null;
    }
    const { container } = render(
      <TimeRangeProvider now={NOW}>
        <Probe />
        <LatencyHeatmap points={points} />
      </TimeRangeProvider>,
    );
    expect(description(grid())).toMatch(/13:00 – 14:00/);
    fireEvent.mouseMove(grid(), at(30, 3));
    expect(cursor!.cursor).toBe(range.from + 30.5 * 60_000);
    expect(container.querySelector('[data-part="cursor"]')).toBeTruthy();
    fireEvent.mouseLeave(grid());
    expect(cursor!.cursor).toBeNull();
    expect(container.querySelector('[data-part="cursor"]')).toBeNull();
    // A cursor set by another view is drawn here too.
    act(() => cursor!.setCursor(range.from + 15 * 60_000));
    expect(container.querySelector('[data-part="cursor"]')).toBeTruthy();
    fireEvent.mouseDown(grid(), { ...at(0, 3), button: 0 });
    fireEvent.mouseUp(grid(), at(29, 3));
    expect(state!.range).toEqual({ from: range.from, to: range.from + 30 * 60_000 });
    expect(state!.presetId).toBeNull();
  });

  it('steps the colour scale and draws its legend', () => {
    const { container, rerender } = render(<LatencyHeatmap points={points} range={range} colorSteps={3} />);
    expect(container.querySelectorAll('[data-part="legend"] rect')).toHaveLength(3);
    const levels = () => new Set([...container.querySelectorAll('[role="gridcell"]')].map((cell) => cell.getAttribute('data-level')));
    expect([...levels()].every((level) => Number(level) <= 3)).toBe(true);
    rerender(<LatencyHeatmap points={points} range={range} colorSteps={20} />);
    expect(container.querySelectorAll('[data-part="legend"] rect')).toHaveLength(9);
    rerender(<LatencyHeatmap points={points} range={range} showLegend={false} />);
    expect(container.querySelector('[data-part="legend"]')).toBeNull();
  });

  it('maps counts by the chosen colour scale', () => {
    const levelsFor = (colorScale: 'sqrt' | 'linear' | 'log' | 'quantile') => {
      const { container, unmount } = render(<LatencyHeatmap points={points} range={range} colorScale={colorScale} />);
      const result = [...container.querySelectorAll('[role="gridcell"]')].map((cell) => cell.getAttribute('data-level')).join('');
      unmount();
      return result;
    };
    const variants = LATENCY_HEATMAP_VARIANTS.colorScale.map(levelsFor);
    expect(new Set(variants).size).toBeGreaterThan(1);
  });

  it('sets the gap between cells, compact density and percentile overlays', () => {
    const { container, rerender } = render(<LatencyHeatmap points={points} range={range} cellGap={0} />);
    expect(Number(container.querySelector('[role="gridcell"]')!.getAttribute('width'))).toBeCloseTo(9.6);
    rerender(<LatencyHeatmap points={points} range={range} cellGap={3} />);
    expect(Number(container.querySelector('[role="gridcell"]')!.getAttribute('width'))).toBeCloseTo(6.6);
    rerender(<LatencyHeatmap points={points} range={range} density="compact" percentileOverlay={[50, 99]} />);
    expect(grid().getAttribute('height')).toBe('160');
    const overlays = container.querySelectorAll('[data-part="percentile-overlay"]');
    expect(overlays).toHaveLength(2);
    expect(overlays[1]!.querySelector('path')!.getAttribute('d')).toMatch(/^M[\d.]+,[\d.]+(L[\d.]+,[\d.]+)+$/);
    expect(overlays[1]!.textContent).toBe('p99');
  });
});
