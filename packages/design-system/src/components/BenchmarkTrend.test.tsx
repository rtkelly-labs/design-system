import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BenchmarkTrend } from './BenchmarkTrend';

describe('BenchmarkTrend', () => {
  const points = Array.from({ length: 6 }, (_, i) => ({ commit: `c${i}abcdef0`, timestamp: `2026-09-0${i + 1}T00:00:00Z`, value: 1000 + i, tag: i === 2 ? 'v1.0.0' : undefined, low: 990 + i, high: 1010 + i }));

  it('draws history, tags, the band and the candidate, and says whether it left the band', () => {
    const { container } = render(<BenchmarkTrend points={points} candidate={{ commit: 'feedface', timestamp: '2026-09-09T00:00:00Z', value: 1200 }} unit="ns" threshold={0.05} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset.slot).toBe('benchmark-trend');
    expect(root.dataset.outsideBand).toBe('true');
    expect(container.querySelectorAll('[data-part="point"]')).toHaveLength(6);
    expect(container.querySelector('[data-part="tag"]')?.textContent).toBe('v1.0.0');
    expect(container.querySelector('[data-part="band"]')).not.toBeNull();
    expect(container.querySelector('[data-part="readout"]')?.textContent).toContain('outside the noise band');
  });

  it('shows the empty state', () => {
    render(<BenchmarkTrend points={[]} unit="ns" />);
    expect(screen.getByText('No history.')).toBeTruthy();
  });
});
