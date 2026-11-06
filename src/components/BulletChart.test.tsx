import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { BulletChart } from './BulletChart';

describe('BulletChart', () => {
  it('renders bullet chart with target and value', () => {
    const { container } = render(
      <BulletChart value={75} target={90} bands={[50, 80, 100]} title="SLA Compliance" />,
    );

    const root = container.firstElementChild;
    expect(root).toBeDefined();
    expect(root?.getAttribute('data-slot')).toBe('bullet-chart');
    expect(container.querySelector('svg')).toBeDefined();
  });

  it('forwards ref to root wrapper', () => {
    const ref = createRef<HTMLDivElement>();
    render(<BulletChart ref={ref} value={60} target={80} />);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.getAttribute('data-slot')).toBe('bullet-chart');
  });

  it('merges custom className', () => {
    const { container } = render(
      <BulletChart value={50} target={70} className="mt-4" />,
    );

    expect(container.firstElementChild?.getAttribute('class')).toContain('mt-4');
  });
});
