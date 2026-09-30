import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { AsciiGauge } from './AsciiGauge';

describe('AsciiGauge', () => {
  it('renders standard block gauge with brackets and role="meter"', () => {
    render(<AsciiGauge value={50} showValue />);

    const meter = screen.getByRole('meter');
    expect(meter).toBeDefined();
    expect(meter.getAttribute('aria-valuenow')).toBe('50');
    expect(meter.getAttribute('aria-valuemin')).toBe('0');
    expect(meter.getAttribute('aria-valuemax')).toBe('100');
    expect(screen.getByText('50%')).toBeDefined();
    expect(screen.getAllByText('[').length).toBeGreaterThan(0);
    expect(screen.getAllByText(']').length).toBeGreaterThan(0);
  });

  it('clamps value between min and max', () => {
    render(<AsciiGauge value={150} min={0} max={100} showValue />);
    const meter = screen.getByRole('meter');
    expect(meter.getAttribute('aria-valuenow')).toBe('100');
    expect(screen.getByText('100%')).toBeDefined();
  });

  it('supports bare meter without brackets', () => {
    const { container } = render(<AsciiGauge value={50} brackets={null} />);
    expect(container.textContent).not.toContain('[');
    expect(container.textContent).not.toContain(']');
  });

  it('renders target pin glyph', () => {
    const { container } = render(
      <AsciiGauge value={30} target={70} length={10} />,
    );
    expect(container.textContent).toContain('|');
  });

  it('renders alternative glyph variants', () => {
    const { container: lineContainer } = render(
      <AsciiGauge value={50} variant="line" length={10} />,
    );
    expect(lineContainer.textContent).toContain('=');

    const { container: asciiContainer } = render(
      <AsciiGauge value={50} variant="ascii" length={10} />,
    );
    expect(asciiContainer.textContent).toContain('#');
  });

  it('formats custom value readout', () => {
    render(
      <AsciiGauge
        value={42}
        showValue
        valueFormat={(val) => `${val} ms`}
      />,
    );
    expect(screen.getByText('42 ms')).toBeDefined();
  });

  it('forwards ref to root span', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<AsciiGauge ref={ref} value={50} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('merges caller className', () => {
    const { container } = render(
      <AsciiGauge value={50} className="opacity-50" />,
    );
    expect(container.firstElementChild?.className).toContain('opacity-50');
  });

  it('emits no palette-pinned class', () => {
    const FORBIDDEN =
      /brutalist-|--color-white|--border-color|zinc-|-red-\d|bg-black|text-white|border-white/;
    const { container } = render(
      <AsciiGauge value={50} target={80} accent="primary" showValue />,
    );

    for (const node of container.querySelectorAll<HTMLElement>('*')) {
      const cls = typeof node.className === 'string' ? node.className : (node.getAttribute('class') ?? '');
      expect(cls, `${node.tagName} pins a palette entry`).not.toMatch(
        FORBIDDEN,
      );
    }
  });
});
