import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { BarChart, type BarChartDatum } from './BarChart';

const SAMPLE_DATA: BarChartDatum[] = [
  { label: 'ALPHA', value: 45, accent: 'primary' },
  { label: 'BETA', value: 90, accent: 'secondary' },
  { label: 'GAMMA', value: 30, accent: 'danger' },
];

describe('BarChart', () => {
  it('renders SVG with bars and categorical labels', () => {
    const { container } = render(<BarChart data={SAMPLE_DATA} />);

    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
    expect(svg?.getAttribute('data-slot')).toBe('barchart');

    // Categorical labels on the axis
    expect(screen.getByText('ALPHA')).toBeDefined();
    expect(screen.getByText('BETA')).toBeDefined();
    expect(screen.getByText('GAMMA')).toBeDefined();

    // Values rendered
    expect(screen.getAllByText('45').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('90').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('30').length).toBeGreaterThanOrEqual(1);
  });

  it('renders empty fallback message when dataset is empty', () => {
    render(<BarChart data={[]} emptyMessage="NO METRICS" />);

    expect(screen.getByText('[ NO METRICS ]')).toBeDefined();
  });

  it('forwards ref to the root SVG element', () => {
    const ref = createRef<SVGSVGElement>();
    render(<BarChart ref={ref} data={SAMPLE_DATA} />);

    expect(ref.current).toBeInstanceOf(SVGSVGElement);
    expect(ref.current?.getAttribute('data-slot')).toBe('barchart');
  });

  it('merges custom className onto root SVG', () => {
    const { container } = render(
      <BarChart data={SAMPLE_DATA} className="mt-4" />,
    );

    expect(container.querySelector('svg')?.getAttribute('class')).toContain('mt-4');
  });

  it('triggers onBarClick callback when clicking a bar', () => {
    const onBarClick = vi.fn();
    const { container } = render(
      <BarChart data={SAMPLE_DATA} onBarClick={onBarClick} />,
    );

    const bars = container.querySelectorAll('rect.visx-bar');
    expect(bars.length).toBe(3);

    fireEvent.click(bars[1]);
    expect(onBarClick).toHaveBeenCalledWith(SAMPLE_DATA[1], 1);
  });

  it('supports horizontal orientation', () => {
    const { container } = render(
      <BarChart data={SAMPLE_DATA} orientation="horizontal" />,
    );

    const bars = container.querySelectorAll('rect.visx-bar');
    expect(bars.length).toBe(3);
    expect(bars[1].getAttribute('width')).toBeDefined();
  });

  it('leaves bars as a picture without onBarClick', () => {
    const { container } = render(<BarChart data={SAMPLE_DATA} />);

    expect(container.querySelector('svg')?.getAttribute('role')).toBe('img');
    const bar = container.querySelector('rect.visx-bar');
    expect(bar?.getAttribute('tabindex')).toBeNull();
    expect(bar?.getAttribute('class')).not.toContain('cursor-pointer');
  });

  it('makes bars a keyboard-reachable set of buttons with onBarClick (issue 311)', () => {
    const onBarClick = vi.fn();
    render(<BarChart data={SAMPLE_DATA} onBarClick={onBarClick} />);

    const bars = screen.getAllByRole('button');
    expect(bars.map((b) => b.getAttribute('aria-label'))).toEqual(['ALPHA: 45', 'BETA: 90', 'GAMMA: 30']);
    // One tab stop.
    expect(bars.map((b) => b.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);

    bars[0].focus();
    fireEvent.keyDown(bars[0], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(bars[1]);
    expect(bars[1].getAttribute('tabindex')).toBe('0');
    expect(bars[0].getAttribute('tabindex')).toBe('-1');

    fireEvent.keyDown(bars[1], { key: 'End' });
    expect(document.activeElement).toBe(bars[2]);
    fireEvent.keyDown(bars[2], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(bars[2]);

    fireEvent.keyDown(bars[2], { key: 'Enter' });
    expect(onBarClick).toHaveBeenCalledWith(SAMPLE_DATA[2], 2);
    fireEvent.keyDown(bars[2], { key: 'Home' });
    fireEvent.keyDown(bars[0], { key: ' ' });
    expect(onBarClick).toHaveBeenLastCalledWith(SAMPLE_DATA[0], 0);
  });

  it('gives a responsive chart its height in an auto-height parent (issue 306)', () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    const { container } = render(
      <div>
        <BarChart responsive height={240} data={SAMPLE_DATA} />
      </div>,
    );

    const wrapper = container.firstElementChild?.firstElementChild as HTMLElement;
    expect(wrapper.style.height).toBe('240px');
    vi.unstubAllGlobals();
  });
});
