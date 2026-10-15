import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { ChartTooltip } from './ChartTooltip';

describe('ChartTooltip', () => {
  it('renders title and children with brutalist tokens', () => {
    render(
      <ChartTooltip title="METRICS">
        <span>42 events</span>
      </ChartTooltip>,
    );

    expect(screen.getByText('[ METRICS ]')).toBeDefined();
    expect(screen.getByText('42 events')).toBeDefined();
  });

  it('forwards ref to the root element', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ChartTooltip ref={ref} title="TEST">
        <span>Content</span>
      </ChartTooltip>,
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.getAttribute('data-slot')).toBe('chart-tooltip');
  });

  it('merges custom className', () => {
    const { container } = render(
      <ChartTooltip className="mt-4">
        <span>Content</span>
      </ChartTooltip>,
    );

    expect(container.firstElementChild?.getAttribute('class')).toContain('mt-4');
  });
});
