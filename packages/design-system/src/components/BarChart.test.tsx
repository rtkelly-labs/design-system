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
});
