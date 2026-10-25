import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { TimeSeries } from '../lib/timeSeries';
import { TimeRangePicker, TimeRangeProvider } from './TimeRange';
import { TIME_SERIES_VARIANTS, TimeSeriesChart } from './TimeSeriesChart';

const NOW = Date.UTC(2026, 9, 22, 14, 0);
const MIN = 60_000;
const t = (minutesAgo: number) => NOW - minutesAgo * MIN;

const latency: TimeSeries[] = [
  { id: 'p50', label: 'p50', unit: 'ms', points: [[t(50), 20], [t(40), 22], [t(30), null], [t(20), 25], [t(10), 21]] },
  { id: 'p99', label: 'p99', unit: 'ms', points: [[t(50), 120], [t(40), 480], [t(30), 650], [t(20), 300], [t(10), 210]] },
];
const range = { from: t(60), to: NOW };

// jsdom has no PointerEvent; React reads clientX off whatever event arrives.
beforeAll(() => {
  if (typeof window.PointerEvent === 'undefined') {
    class FakePointerEvent extends MouseEvent {
      pointerId: number;
      constructor(type: string, init: MouseEventInit & { pointerId?: number } = {}) {
        super(type, init);
        this.pointerId = init.pointerId ?? 1;
      }
    }
    vi.stubGlobal('PointerEvent', FakePointerEvent);
  }
});
afterAll(() => {
  vi.unstubAllGlobals();
});

const plot = () => screen.getByRole('slider');
const svgOf = (container: HTMLElement) => container.querySelector('[data-part="plot"] svg') as SVGSVGElement;
/** Plot x in pixels → clientX; jsdom rects are all zero, so only the left margin applies. */
const atX = (x: number) => ({ clientX: 52 + x, button: 0, pointerId: 1 });
const lineD = (container: HTMLElement, id = 'p50') => container.querySelector(`[data-series="${id}"] [data-part="line"]`)?.getAttribute('d') ?? '';

describe('TimeSeriesChart', () => {
  it('renders a named, described plot and forwards its ref', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<TimeSeriesChart ref={ref} series={latency} range={range} title="Checkout latency" data-testid="chart" />);
    expect(ref.current?.getAttribute('data-slot')).toBe('time-series-chart');
    expect(screen.getByTestId('chart')).toBe(ref.current);
    expect(plot().getAttribute('aria-label')).toBe('Checkout latency');
    expect(plot().tabIndex).toBe(0);
    const summary = document.getElementById(plot().getAttribute('aria-describedby')!)!;
    expect(summary.textContent).toContain('p50: min 20 ms, max 25 ms, latest 21 ms.');
    expect(summary.textContent).toContain('p99: min 120 ms, max 650 ms, latest 210 ms.');
    expect(svgOf(container).getAttribute('width')).toBe('640');
    expect(svgOf(container).getAttribute('preserveAspectRatio')).toBeNull();
  });

  it('breaks the line at null values', () => {
    const { container } = render(<TimeSeriesChart series={latency} range={range} />);
    // Two runs → two sub-paths.
    expect(lineD(container).match(/M/g)).toHaveLength(2);
    expect(lineD(container, 'p99').match(/M/g)).toHaveLength(1);
  });

  it('clips to the domain and summarises only what is inside it', () => {
    render(<TimeSeriesChart series={latency} range={{ from: t(25), to: NOW }} />);
    const summary = document.getElementById(plot().getAttribute('aria-describedby')!)!;
    expect(summary.textContent).toContain('p99: min 210 ms, max 300 ms, latest 210 ms.');
  });

  it('draws thresholds, tints the danger band and flags breaching points', () => {
    const { container } = render(
      <TimeSeriesChart series={latency} range={range} unit="ms" thresholds={[{ value: 500, label: 'SLO', intent: 'danger' }, { value: 400, label: 'Warn', intent: 'warning' }]} />,
    );
    expect(container.querySelectorAll('[data-part="threshold"]')).toHaveLength(2);
    expect(container.querySelector('[data-part="danger-band"]')).toBeTruthy();
    expect(container.querySelectorAll('[data-part="breach"]')).toHaveLength(1);
    expect(container.querySelector('[data-slot="time-series-chart"]')!.hasAttribute('data-breach')).toBe(true);
    expect(screen.getByText('SLO · 500 ms')).toBeTruthy();
  });

  it('labels the x axis with UTC clock ticks', () => {
    const { container } = render(<TimeSeriesChart series={latency} range={range} />);
    const ticks = [...container.querySelectorAll('[data-part="x-tick"] text')].map((node) => node.textContent);
    expect(ticks).toContain('13:30');
    expect(ticks.every((tick) => /^\d\d:\d\d$/.test(tick ?? ''))).toBe(true);
  });

  it('hides and shows series from the legend, uncontrolled and controlled', () => {
    const onHiddenSeriesChange = vi.fn();
    const { container, rerender } = render(<TimeSeriesChart series={latency} range={range} onHiddenSeriesChange={onHiddenSeriesChange} />);
    const legend = screen.getByRole('group', { name: 'Time series chart series' });
    const p99 = within(legend).getByRole('button', { name: 'p99' });
    expect(p99.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(p99);
    expect(onHiddenSeriesChange).toHaveBeenLastCalledWith(['p99']);
    expect(p99.getAttribute('aria-pressed')).toBe('false');
    expect(container.querySelector('[data-series="p99"] [data-part="line"]')).toBeNull();

    rerender(<TimeSeriesChart series={latency} range={range} hiddenSeries={['p50']} />);
    expect(container.querySelector('[data-series="p50"] [data-part="line"]')).toBeNull();
    expect(container.querySelector('[data-series="p99"] [data-part="line"]')).toBeTruthy();
  });

  it('says so when nothing is visible', () => {
    const { rerender } = render(<TimeSeriesChart series={[]} title="Errors" />);
    expect(screen.getByText('No data in this range.')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Errors: no data in this range.' })).toBeTruthy();
    rerender(<TimeSeriesChart series={latency} range={{ from: t(500), to: t(400) }} />);
    expect(screen.getByText('No data in this range.')).toBeTruthy();
    rerender(<TimeSeriesChart series={latency} range={range} hiddenSeries={['p50', 'p99']} />);
    expect(screen.getByText('No data in this range.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'p50' })).toBeTruthy();
  });

  it('steps the cursor with the keyboard and reads the values', () => {
    const { container } = render(<TimeSeriesChart series={latency} range={range} />);
    const slider = plot();
    expect(slider.getAttribute('aria-valuetext')).toMatch(/^No time selected/);
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(slider.getAttribute('aria-valuetext')).toBe('Oct 22 13:10:00 UTC. p50 20 ms, p99 120 ms.');
    expect(container.querySelector('[data-part="cursor"]')).toBeTruthy();
    expect(container.querySelector('[data-part="tooltip"]')?.textContent).toContain('p99120 ms');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    // p50 has a gap at 13:30.
    expect(slider.getAttribute('aria-valuetext')).toBe('Oct 22 13:30:00 UTC. p50 no data, p99 650 ms.');
    fireEvent.keyDown(slider, { key: 'End' });
    expect(slider.getAttribute('aria-valuenow')).toBe(String(t(10)));
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(slider.getAttribute('aria-valuenow')).toBe(String(t(10)));
    fireEvent.keyDown(slider, { key: 'Home' });
    expect(slider.getAttribute('aria-valuenow')).toBe(String(t(50)));
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    expect(slider.getAttribute('aria-valuenow')).toBe(String(t(50)));
    fireEvent.keyDown(slider, { key: 'Escape' });
    expect(container.querySelector('[data-part="cursor"]')).toBeNull();
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    expect(slider.getAttribute('aria-valuenow')).toBe(String(t(10)));
  });

  it('follows the pointer and clears on leave', () => {
    const { container } = render(<TimeSeriesChart series={latency} range={range} />);
    const svg = svgOf(container);
    // innerWidth = 640 - 52 - 16 = 572 over 60 minutes; 13:20 is 2/6 across.
    fireEvent.pointerMove(svg, atX((572 * 2) / 6));
    expect(plot().getAttribute('aria-valuenow')).toBe(String(t(40)));
    fireEvent.pointerLeave(svg);
    expect(container.querySelector('[data-part="cursor"]')).toBeNull();
  });

  it('brush-selects a window, and ignores a click', () => {
    const onRangeSelect = vi.fn();
    const { container } = render(<TimeSeriesChart series={latency} range={range} onRangeSelect={onRangeSelect} />);
    const svg = svgOf(container);
    fireEvent.pointerDown(svg, atX(100));
    fireEvent.pointerUp(svg, atX(102));
    expect(onRangeSelect).not.toHaveBeenCalled();
    fireEvent.pointerDown(svg, atX(0));
    fireEvent.pointerMove(svg, atX(286));
    expect(container.querySelector('[data-part="brush"]')?.getAttribute('width')).toBe('286');
    fireEvent.pointerUp(svg, atX(286));
    expect(onRangeSelect).toHaveBeenCalledWith({ from: t(60), to: t(30) });
    expect(container.querySelector('[data-part="brush"]')).toBeNull();
  });

  it('does not brush when zoomable is false', () => {
    const onRangeSelect = vi.fn();
    const { container } = render(<TimeSeriesChart series={latency} range={range} zoomable={false} onRangeSelect={onRangeSelect} />);
    const svg = svgOf(container);
    fireEvent.pointerDown(svg, atX(0));
    fireEvent.pointerUp(svg, atX(300));
    expect(onRangeSelect).not.toHaveBeenCalled();
  });

  it('shares the cursor and the range through a TimeRangeProvider', () => {
    const { container } = render(
      <TimeRangeProvider now={NOW}>
        <TimeRangePicker />
        <TimeSeriesChart series={latency} title="A" />
        <TimeSeriesChart series={latency} title="B" />
      </TimeRangeProvider>,
    );
    const [a, b] = screen.getAllByRole('slider');
    // The provider's 1h preset is the domain.
    expect(a!.getAttribute('aria-valuemin')).toBe(String(t(60)));
    fireEvent.keyDown(a!, { key: 'End' });
    expect(b!.getAttribute('aria-valuenow')).toBe(String(t(10)));
    expect(container.querySelectorAll('[data-part="cursor"]')).toHaveLength(2);

    const svgA = a!.querySelector('svg')!;
    fireEvent.pointerDown(svgA, atX(0));
    fireEvent.pointerMove(svgA, atX(286));
    fireEvent.pointerUp(svgA, atX(286));
    expect(b!.getAttribute('aria-valuemin')).toBe(String(t(60)));
    expect(b!.getAttribute('aria-valuemax')).toBe(String(t(30)));
    expect(screen.getByText(/^Zoomed/)).toBeTruthy();
    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Reset to 1h' })); });
    expect(b!.getAttribute('aria-valuemax')).toBe(String(NOW));
  });

  it('prefers an explicit range over the provider', () => {
    render(
      <TimeRangeProvider now={NOW}>
        <TimeSeriesChart series={latency} range={{ from: t(30), to: NOW }} />
      </TimeRangeProvider>,
    );
    expect(plot().getAttribute('aria-valuemin')).toBe(String(t(30)));
  });

  it('stacks areas, reading raw values', () => {
    const traffic: TimeSeries[] = [
      { id: '2xx', label: '2xx', points: [[t(40), 100], [t(20), 120]] },
      { id: '5xx', label: '5xx', points: [[t(40), 10], [t(20), 30]] },
    ];
    const { container } = render(<TimeSeriesChart series={traffic} range={range} variant="stacked" />);
    expect(container.querySelectorAll('[data-part="area"]')).toHaveLength(2);
    fireEvent.keyDown(plot(), { key: 'End' });
    expect(plot().getAttribute('aria-valuetext')).toBe('Oct 22 13:40:00 UTC. 2xx 120, 5xx 30.');
  });

  describe('design props', () => {
    it('lists every union value', () => {
      expect(TIME_SERIES_VARIANTS.curve).toEqual(['linear', 'monotone', 'step']);
      expect(TIME_SERIES_VARIANTS.legend).toContain('inline');
    });

    it('draws step and monotone curves differently from linear', () => {
      const linear = lineD(render(<TimeSeriesChart series={latency} range={range} />).container, 'p99');
      const step = lineD(render(<TimeSeriesChart series={latency} range={range} curve="step" />).container, 'p99');
      const monotone = lineD(render(<TimeSeriesChart series={latency} range={range} curve="monotone" />).container, 'p99');
      expect(linear).not.toContain('C');
      expect(monotone).toContain('C');
      expect(step).not.toBe(linear);
      expect(step.match(/L/g)!.length).toBe(linear.match(/L/g)!.length * 3);
    });

    it('applies stroke width, fill opacity and point markers', () => {
      const { container } = render(<TimeSeriesChart series={latency} range={range} variant="area" strokeWidth={3} fillOpacity={0.5} points="all" />);
      expect(container.querySelector('[data-part="line"]')!.getAttribute('stroke-width')).toBe('3');
      expect(container.querySelector('[data-part="area"]')!.getAttribute('fill-opacity')).toBe('0.5');
      expect(container.querySelectorAll('[data-series="p50"] [data-part="point"]')).toHaveLength(4);
    });

    it('hides cursor markers with points="none"', () => {
      const { container } = render(<TimeSeriesChart series={latency} range={range} points="none" />);
      fireEvent.keyDown(plot(), { key: 'Home' });
      expect(container.querySelector('[data-part="cursor"]')).toBeTruthy();
      expect(container.querySelector('[data-part="cursor-point"]')).toBeNull();
    });

    it('switches grid lines', () => {
      const none = render(<TimeSeriesChart series={latency} range={range} grid="none" />).container;
      expect(none.querySelector('[data-part="grid-row"]')).toBeNull();
      const both = render(<TimeSeriesChart series={latency} range={range} grid="both" />).container;
      expect(both.querySelector('[data-part="grid-row"]')).toBeTruthy();
      expect(both.querySelector('[data-part="grid-column"]')).toBeTruthy();
    });

    it('skips zero and negative values on a log scale', () => {
      const series: TimeSeries[] = [{ id: 's', label: 's', points: [[t(50), 10], [t(40), 0], [t(30), 1000], [t(20), -5], [t(10), 100]] }];
      const { container } = render(<TimeSeriesChart series={series} range={range} yScale="log" points="all" />);
      expect(container.querySelectorAll('[data-part="point"]')).toHaveLength(3);
      // 10 | 1000 | 100 — three runs, no zero drawn.
      expect(lineD(container, 's').match(/M/g)).toHaveLength(3);
      const ticks = [...container.querySelectorAll('[data-part="y-tick"]')].map((node) => node.textContent);
      expect(ticks).toEqual(expect.arrayContaining(['10', '100', '1k']));
    });

    it('fits the data or takes an explicit domain', () => {
      const zero = [...render(<TimeSeriesChart series={latency} range={range} hiddenSeries={['p50']} />).container.querySelectorAll('[data-part="y-tick"]')].map((n) => n.textContent);
      expect(zero[0]).toBe('0');
      const data = [...render(<TimeSeriesChart series={latency} range={range} hiddenSeries={['p50']} yDomain="data" />).container.querySelectorAll('[data-part="y-tick"]')].map((n) => n.textContent);
      expect(data[0]).not.toBe('0');
      const fixed = [...render(<TimeSeriesChart series={latency} range={range} yDomain={[0, 2000]} />).container.querySelectorAll('[data-part="y-tick"]')].map((n) => n.textContent);
      expect(fixed[fixed.length - 1]).toBe('2k');
    });

    it('places the legend, or labels lines inline', () => {
      const top = render(<TimeSeriesChart series={latency} range={range} legend="top" />).container;
      const root = top.querySelector('[data-slot="time-series-chart"]')!;
      expect(root.firstElementChild!.getAttribute('data-part')).toBe('legend');
      const none = render(<TimeSeriesChart series={latency} range={range} legend="none" />).container;
      expect(none.querySelector('[data-part="legend"]')).toBeNull();
      const inline = render(<TimeSeriesChart series={latency} range={range} legend="inline" />).container;
      expect(inline.querySelector('[data-part="legend"]')).toBeNull();
      const labels = [...inline.querySelectorAll('[data-part="inline-label"]')];
      expect(labels.map((node) => node.textContent)).toEqual(['p50', 'p99']);
      const ys = labels.map((node) => Number(node.getAttribute('y')));
      expect(Math.abs(ys[0]! - ys[1]!)).toBeGreaterThanOrEqual(12);
    });

    it('emphasises one series and mutes the rest', () => {
      const { container } = render(<TimeSeriesChart series={latency} range={range} colorStrategy="emphasis" emphasisSeriesId="p99" />);
      expect(lineD(container, 'p99')).toBeTruthy();
      expect(container.querySelector('[data-series="p99"] [data-part="line"]')!.getAttribute('class')).toContain('stroke-accent-primary');
      expect(container.querySelector('[data-series="p50"] [data-part="line"]')!.getAttribute('class')).toContain('stroke-content-muted');
      // Emphasised series is painted last.
      const order = [...container.querySelectorAll('g[data-series]')].map((node) => node.getAttribute('data-series'));
      expect(order).toEqual(['p50', 'p99']);
    });

    it('reads every series at one sample time, so a sparse series is never shown under another series’ time', () => {
      const uneven: TimeSeries[] = [
        { id: 'sparse', label: 'sparse', unit: 'ms', points: [[t(50), 1], [t(10), 9]] },
        { id: 'dense', label: 'dense', unit: 'ms', points: [[t(50), 2], [t(30), 5], [t(10), 8]] },
      ];
      render(<TimeSeriesChart series={uneven} range={range} />);
      const slider = plot();
      fireEvent.keyDown(slider, { key: 'ArrowRight' });
      fireEvent.keyDown(slider, { key: 'ArrowRight' });
      // At 13:30 only `dense` has a sample. `sparse` must say so, not lend its 13:10 value.
      expect(slider.getAttribute('aria-valuetext')).toBe('Oct 22 13:30:00 UTC. sparse no data, dense 5 ms.');
    });

    it('never paints a series in accent-tertiary', () => {
      const many: TimeSeries[] = Array.from({ length: 7 }, (_, index) => ({ id: `s${index}`, label: `s${index}`, points: [[t(30), index + 1], [t(10), index + 2]] }));
      const { container } = render(<TimeSeriesChart series={many} range={range} />);
      expect(container.innerHTML).not.toContain('accent-tertiary');
      // Two colours that differ on every level, then a neutral; the fourth series reuses
      // primary, told apart by dash rather than a colour that collides or means something.
      const line = (id: string) => container.querySelector(`[data-series="${id}"] [data-part="line"]`)!;
      expect(line('s0').getAttribute('class')).toContain('stroke-accent-primary');
      expect(line('s0').getAttribute('stroke-dasharray')).toBeNull();
      expect(line('s2').getAttribute('class')).toContain('stroke-content-secondary');
      expect(line('s3').getAttribute('class')).toContain('stroke-accent-primary');
      expect(line('s3').getAttribute('stroke-dasharray')).toBe('6 3');
      expect(line('s6').getAttribute('stroke-dasharray')).toBe('2 3');
      expect(container.innerHTML).not.toContain('stroke-intent-info');
    });

    it('pins a series to a role when its colour carries a meaning', () => {
      const status: TimeSeries[] = [
        { id: 'ok', label: '2xx', tone: 'primary', points: [[t(30), 300], [t(10), 310]] },
        { id: 'err', label: '5xx', tone: 'danger', points: [[t(30), 3], [t(10), 9]] },
      ];
      const { container } = render(<TimeSeriesChart series={status} range={range} />);
      expect(container.querySelector('[data-series="err"] [data-part="line"]')!.getAttribute('class')).toContain('stroke-intent-danger');
      expect(container.querySelector('[data-series="ok"] [data-part="line"]')!.getAttribute('class')).toContain('stroke-accent-primary');
    });

    it('renders annotations and reads them in the summary', () => {
      const { container } = render(
        <TimeSeriesChart series={latency} range={range} annotations={[{ time: t(35), label: 'deploy v42' }, { time: t(34), label: 'rollback', intent: 'danger' }, { time: t(500), label: 'outside' }]} />,
      );
      const notes = container.querySelectorAll('[data-part="annotation"]');
      expect(notes).toHaveLength(2);
      expect(notes[1]!.getAttribute('data-intent')).toBe('danger');
      expect(screen.getByText('deploy v42')).toBeTruthy();
      const summary = document.getElementById(plot().getAttribute('aria-describedby')!)!;
      expect(summary.textContent).toContain('deploy v42 at Oct 22 13:25:00 UTC.');
    });

    it('compacts and drops the axes', () => {
      const compact = render(<TimeSeriesChart series={latency} range={range} density="compact" unit="ms" />).container;
      expect(compact.querySelector('[data-slot="time-series-chart"]')!.getAttribute('data-density')).toBe('compact');
      expect(compact.querySelector('[data-part="unit"]')).toBeNull();
      const bare = render(<TimeSeriesChart series={latency} range={range} showAxes={false} />).container;
      expect(bare.querySelector('[data-part="axes"]')).toBeNull();
      expect(bare.querySelector('[data-part="y-tick"]')).toBeNull();
    });
  });
});
