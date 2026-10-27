import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { LATENCY_HISTOGRAM_VARIANTS, LatencyHistogram } from './LatencyHistogram';

// 1…100ms, one sample each: p50 50.5, p90 90.1, p99 99.01.
const samples = Array.from({ length: 100 }, (_, index) => index + 1);
const grid = () => screen.getByRole('grid');
const description = (element: Element) => document.getElementById(element.getAttribute('aria-describedby') ?? '')?.textContent;
const active = (element: Element) => document.getElementById(element.getAttribute('aria-activedescendant') ?? '')?.getAttribute('aria-label');

describe('LatencyHistogram', () => {
  it('sorts the raw samples for percentiles once, not on every hover', () => {
    render(<LatencyHistogram samples={samples} />);
    const sort = vi.spyOn(Array.prototype, 'sort');
    fireEvent.mouseMove(grid(), { clientX: 120, clientY: 40 });
    fireEvent.mouseMove(grid(), { clientX: 240, clientY: 40 });
    const sortedSamples = sort.mock.contexts.filter((array) => (array as unknown[]).length === samples.length);
    sort.mockRestore();
    expect(sortedSamples).toHaveLength(0);
  });

  it('carries its slot, ref, className and spread props', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<LatencyHistogram ref={ref} samples={samples} className="mt-4" data-testid="hist" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset.slot).toBe('latency-histogram');
    expect(ref.current).toBe(root);
    expect(root.className).toContain('mt-4');
    expect(root.dataset.testid).toBe('hist');
  });

  it('summarises count, percentiles and the share over the SLO for a screen reader', () => {
    render(<LatencyHistogram samples={samples} slo={{ value: 80 }} title="Checkout latency" />);
    expect(grid().getAttribute('aria-label')).toBe('Checkout latency');
    expect(description(grid())).toBe('100 requests. p50 51ms, p90 90ms, p99 99ms. 20% over the 80ms objective.');
  });

  it('draws percentile markers and an SLO line, tinting the bars past it', () => {
    const { container } = render(<LatencyHistogram samples={samples} slo={{ value: 50, label: 'Target' }} />);
    expect(container.querySelectorAll('[data-part="percentile"]')).toHaveLength(3);
    expect(container.querySelector('[data-part="slo"]')?.textContent).toContain('Target');
    const over = container.querySelectorAll('[data-over-slo]');
    expect(over.length).toBeGreaterThan(0);
    over.forEach((rect) => expect(rect.getAttribute('class')).toContain('fill-intent-danger'));
  });

  it('shows the empty state', () => {
    render(<LatencyHistogram samples={[]} />);
    expect(screen.getByText('No samples.')).toBeTruthy();
    expect(screen.queryByRole('grid')).toBeNull();
  });

  it('is one tab stop whose Left and Right read the buckets', () => {
    render(<LatencyHistogram buckets={[{ from: 10, to: 20, count: 5 }, { from: 20, to: 40, count: 9 }, { from: 40, to: 80, count: 1 }]} />);
    const chart = grid();
    expect(chart.getAttribute('tabindex')).toBe('0');
    fireEvent.focus(chart);
    // Starts on the busiest bucket.
    expect(active(chart)).toBe('20–40ms · 9 requests');
    fireEvent.keyDown(chart, { key: 'ArrowRight' });
    expect(active(chart)).toBe('40–80ms · 1 request');
    expect(screen.getByText('40–80ms · 1 request')).toBeTruthy();
    fireEvent.keyDown(chart, { key: 'Home' });
    expect(screen.getByText('10–20ms · 5 requests')).toBeTruthy();
  });

  it('reads out the bar under the pointer', () => {
    // Linear 0–100 over the 580px plot (640 fallback minus margins), so x = 44 + value × 5.8.
    render(<LatencyHistogram buckets={[{ from: 0, to: 50, count: 3 }, { from: 50, to: 100, count: 7 }]} scale="linear" percentiles={[]} />);
    fireEvent.mouseMove(grid(), { clientX: 44 + 75 * 5.8, clientY: 60 });
    expect(screen.getByText('50–100ms · 7 requests')).toBeTruthy();
    fireEvent.mouseLeave(grid());
    expect(screen.queryByText('50–100ms · 7 requests')).toBeNull();
  });

  it('bins logarithmically by default and linearly on request', () => {
    const { container, rerender } = render(<LatencyHistogram samples={samples} bins={4} />);
    const widths = () => [...container.querySelectorAll('[role="gridcell"]')].map((rect) => Number(rect.getAttribute('width')));
    // Log bins on a log axis draw equal widths; linear bins on a log axis do not.
    const log = widths();
    expect(Math.max(...log) / Math.min(...log)).toBeLessThan(1.6);
    rerender(<LatencyHistogram samples={samples} bins={4} binning="linear" />);
    const linear = widths();
    expect(Math.max(...linear) / Math.min(...linear)).toBeGreaterThan(3);
  });

  it('draws steps, outlines and a cumulative overlay', () => {
    const { container, rerender } = render(<LatencyHistogram samples={samples} bar="steps" cumulative />);
    expect(container.querySelector('[data-part="steps"]')?.querySelectorAll('path').length).toBeGreaterThan(0);
    expect(container.querySelector('[data-part="cumulative"] path')?.getAttribute('d')).toMatch(/^M/);
    expect(container.querySelector('[data-part="cumulative"]')?.textContent).toContain('100%');
    rerender(<LatencyHistogram samples={samples} bar="outline" />);
    expect(container.querySelector('[data-part="steps"]')).toBeNull();
    expect(container.querySelector('[role="gridcell"]')?.getAttribute('class')).toContain('stroke-accent-primary');
  });

  it('marks percentiles as lines, labels only, or not at all', () => {
    const { container, rerender } = render(<LatencyHistogram samples={samples} markers="labels" />);
    const line = container.querySelector('[data-part="percentile"] line')!;
    expect(Number(line.getAttribute('y2'))).toBe(42);
    rerender(<LatencyHistogram samples={samples} markers="none" />);
    expect(container.querySelectorAll('[data-part="percentile"]')).toHaveLength(0);
    expect(description(grid())).toMatch(/p99/);
  });

  it('is shorter when compact, unless a height is given', () => {
    const { rerender } = render(<LatencyHistogram samples={samples} density="compact" />);
    expect(grid().getAttribute('height')).toBe('120');
    rerender(<LatencyHistogram samples={samples} density="compact" height={200} />);
    expect(grid().getAttribute('height')).toBe('200');
    rerender(<LatencyHistogram samples={samples} />);
    expect(grid().getAttribute('height')).toBe('180');
  });

  it('lists every variant value, default first', () => {
    expect(LATENCY_HISTOGRAM_VARIANTS.bar).toEqual(['bars', 'steps', 'outline']);
    expect(LATENCY_HISTOGRAM_VARIANTS.markers[0]).toBe('lines');
    expect(LATENCY_HISTOGRAM_VARIANTS.cumulative[0]).toBe(false);
  });

  it('bins a day of raw samples on a linear scale without overrunning the argument limit', () => {
    const many = Array.from({ length: 300_000 }, (_, index) => 20 + (index % 500));
    expect(() => render(<LatencyHistogram samples={many} scale="linear" binning="linear" title="a day" />)).not.toThrow();
  });
});
