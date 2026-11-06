import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { Sparkline } from './Sparkline';

describe('Sparkline', () => {
  it('renders SVG with data points', () => {
    const { container } = render(<Sparkline data={[10, 20, 15, 30, 25]} />);

    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
    expect(svg?.getAttribute('data-slot')).toBe('sparkline');
    expect(svg?.getAttribute('width')).toBe('120');
    expect(svg?.getAttribute('height')).toBe('32');
  });

  it('renders a fallback dashed line when data is empty', () => {
    const { container } = render(<Sparkline data={[]} />);

    const line = container.querySelector('line');
    expect(line).toBeDefined();
    expect(line?.getAttribute('stroke')).toBe('var(--ds-border-subtle)');
  });

  it('forwards ref to SVG element', () => {
    const ref = createRef<SVGSVGElement>();
    render(<Sparkline ref={ref} data={[1, 2, 3]} />);

    expect(ref.current).toBeInstanceOf(SVGSVGElement);
  });

  it('merges custom className', () => {
    const { container } = render(<Sparkline data={[1, 2, 3]} className="mt-4" />);

    expect(container.querySelector('svg')?.getAttribute('class')).toContain('mt-4');
  });

  it('applies accent tokens to line stroke', () => {
    const { container } = render(<Sparkline data={[5, 10, 15]} accent="danger" />);

    const path = container.querySelector('path.visx-linepath');
    expect(path?.getAttribute('stroke')).toBe('var(--ds-intent-danger)');
  });
});
