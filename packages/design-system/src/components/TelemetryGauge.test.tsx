import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { TelemetryGauge } from './TelemetryGauge';

describe('TelemetryGauge', () => {
  it('renders status badge pill, metric label, and meter', () => {
    render(
      <TelemetryGauge
        state="cruise"
        value={66}
        metricLabel="52px/s"
        target={80}
      />,
    );

    expect(screen.getByText('CRUISE')).toBeDefined();
    expect(screen.getByText('52px/s')).toBeDefined();
    expect(screen.getByRole('meter')).toBeDefined();
  });

  it('allows custom stateLabel override', () => {
    render(<TelemetryGauge state="spooling" stateLabel="WARMING UP" value={20} />);
    expect(screen.getByText('WARMING UP')).toBeDefined();
  });

  it('hides state pill in compact mode', () => {
    render(<TelemetryGauge state="cruise" value={50} compact />);
    expect(screen.queryByText('CRUISE')).toBeNull();
  });

  it('forwards ref to root container', () => {
    const ref = createRef<HTMLDivElement>();
    render(<TelemetryGauge ref={ref} value={50} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges caller className', () => {
    const { container } = render(
      <TelemetryGauge value={50} className="opacity-50" />,
    );
    expect(container.firstElementChild?.className).toContain('opacity-50');
  });

  it('emits no palette-pinned class', () => {
    const FORBIDDEN =
      /brutalist-|--color-white|--border-color|zinc-|-red-\d|bg-black|text-white|border-white/;
    const { container } = render(
      <TelemetryGauge state="braking" value={45} metricLabel="45 MB/s" />,
    );

    for (const node of container.querySelectorAll<HTMLElement>('*')) {
      const cls = typeof node.className === 'string' ? node.className : (node.getAttribute('class') ?? '');
      expect(cls, `${node.tagName} pins a palette entry`).not.toMatch(
        FORBIDDEN,
      );
    }
  });
});
