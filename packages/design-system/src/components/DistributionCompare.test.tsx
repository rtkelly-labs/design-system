import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DistributionCompare } from './DistributionCompare';
import { mulberry32 } from '../lib/benchmark';

function around(seed: number, count: number, centre: number, spread = 0.02): number[] {
  const random = mulberry32(seed);
  return Array.from({ length: count }, () => centre * (1 + (random() * 2 - 1) * spread));
}

const base = around(1, 30, 10_000);

describe('DistributionCompare', () => {
  it('draws every sample as a dot by default, with medians and a summary', () => {
    const { container } = render(<DistributionCompare baseline={base} candidate={around(3, 30, 12_000)} unit="ns" title="Beta" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset.slot).toBe('distribution-compare');
    expect(root.dataset.classification).toBe('slower');
    expect(container.querySelectorAll('circle')).toHaveLength(60);
    expect(container.querySelectorAll('[data-part="median"]')).toHaveLength(2);
    expect(screen.getByRole('img', { name: 'Beta' })).toBeTruthy();
    expect(container.querySelector('[data-part="readout"]')?.textContent).toContain('slower');
  });

  it('draws densities for violin, keeping dots for a side too small for one', () => {
    const { container } = render(<DistributionCompare baseline={base} candidate={[9000, 9100, 9200]} unit="ns" variant="violin" />);
    expect(container.querySelector('[data-side="baseline"] [data-part="density"]')).not.toBeNull();
    expect(container.querySelector('[data-side="candidate"] [data-part="density"]')).toBeNull();
    expect(container.querySelectorAll('[data-side="candidate"] circle')).toHaveLength(3);
    expect(container.querySelector('[data-part="readout"]')?.textContent).toContain('too few samples');
  });

  it('shows the empty state', () => {
    render(<DistributionCompare baseline={[]} candidate={[]} unit="ns" />);
    expect(screen.getByText('No samples.')).toBeTruthy();
  });
});
