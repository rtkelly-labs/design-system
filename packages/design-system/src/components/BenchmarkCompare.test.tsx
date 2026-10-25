import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BenchmarkCompare } from './BenchmarkCompare';
import { compareBenchmarks, mulberry32 } from '../lib/benchmark';

function around(seed: number, count: number, centre: number, spread = 0.02): number[] {
  const random = mulberry32(seed);
  return Array.from({ length: count }, () => centre * (1 + (random() * 2 - 1) * spread));
}

const base = around(1, 30, 10_000);
const comparisons = compareBenchmarks([
  { name: 'Alpha.Noise', unit: 'ns', direction: 'lower-is-better', baseline: base, candidate: around(2, 30, 10_010) },
  { name: 'Beta.Regression', unit: 'ns', direction: 'lower-is-better', baseline: base, candidate: around(3, 30, 12_000) },
  { name: 'Gamma.Small', unit: 'ns', direction: 'lower-is-better', baseline: base, candidate: [9000, 9100, 9200] },
  { name: 'Delta.Improvement', unit: 'ns', direction: 'lower-is-better', baseline: base, candidate: around(4, 30, 8000) },
]);
const rowNames = (root: ParentNode) => Array.from(root.querySelectorAll('[data-slot="benchmark-compare-row"] th')).map((th) => th.textContent);

describe('BenchmarkCompare', () => {
  it('carries its slot, ref, className and spread props', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<BenchmarkCompare ref={ref} comparisons={comparisons} className="mt-4" data-testid="bench" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset.slot).toBe('benchmark-compare');
    expect(ref.current).toBe(root);
    expect(root.className).toContain('mt-4');
    expect(root.dataset.testid).toBe('bench');
  });

  it('renders statically, sorted by impact, with plots and no sort buttons', () => {
    const html = renderToStaticMarkup(<BenchmarkCompare comparisons={comparisons} />);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(rowNames(doc)).toEqual(['Beta.Regression', 'Delta.Improvement', 'Gamma.Small', 'Alpha.Noise']);
    // One plot per table row and one per panel: `auto` renders both and a container query shows one.
    expect(doc.querySelectorAll('[data-part="table"] [data-slot="benchmark-compare-interval"]')).toHaveLength(4);
    expect(doc.querySelectorAll('[data-slot="benchmark-compare-panel"]')).toHaveLength(4);
    expect(doc.querySelector('button')).toBeNull();
    expect(doc.querySelector('[data-part="summary"]')?.textContent).toContain('1 slower');
  });

  it('labels classifications with StatusMark and says why a row is inconclusive', () => {
    const { container } = render(<BenchmarkCompare comparisons={comparisons} />);
    const small = container.querySelector('[data-classification="inconclusive"]')!;
    expect(small.getAttribute('data-reason')).toBe('too-few-samples');
    expect(small.textContent).toContain('too few samples');
    expect(small.querySelector('[data-slot="status-mark"]')?.getAttribute('data-status')).toBe('inconclusive');
    const slower = container.querySelector('[data-classification="slower"] [data-slot="status-mark"]')!;
    expect(slower.textContent).toContain('slower');
    // The inconclusive point is hollow, its whisker dashed.
    expect(small.querySelector('[data-part="whisker"]')?.getAttribute('stroke-dasharray')).toBe('3 2');
  });

  it('withholds the direction emphasis from rows that are not conclusive', () => {
    const { container } = render(<BenchmarkCompare comparisons={comparisons} />);
    expect(container.querySelector('[data-classification="slower"] [data-slot="delta-value"]')?.getAttribute('data-trend')).toBe('against');
    expect(container.querySelector('[data-classification="inconclusive"] [data-slot="delta-value"]')?.hasAttribute('data-trend')).toBe(false);
  });

  it('re-sorts from the headers once hydrated', () => {
    const { container } = render(<BenchmarkCompare comparisons={comparisons} />);
    fireEvent.click(screen.getByRole('button', { name: 'Benchmark' }));
    expect(rowNames(container)).toEqual(['Alpha.Noise', 'Beta.Regression', 'Delta.Improvement', 'Gamma.Small']);
    expect(screen.getByRole('columnheader', { name: 'Benchmark' }).getAttribute('aria-sort')).toBe('ascending');
    fireEvent.click(screen.getByRole('button', { name: 'Benchmark' }));
    expect(rowNames(container)).toEqual(['Alpha.Noise', 'Beta.Regression', 'Gamma.Small', 'Delta.Improvement']);
  });

  it('draws panels in impact order, with a state for a removed benchmark', () => {
    const removed = compareBenchmarks([{ name: 'Epsilon.Gone', unit: 'ns', direction: 'lower-is-better', baseline: base }]);
    const { container } = render(<BenchmarkCompare comparisons={[...comparisons, ...removed]} layout="panels" />);
    expect(container.querySelector('[data-part="table"]')).toBeNull();
    const panels = Array.from(container.querySelectorAll('[data-slot="benchmark-compare-panel"]'));
    expect(panels.map((panel) => panel.querySelector('[data-part="headline"] span')?.textContent)).toEqual(['+20.2%', '−19.9%', '−9.0%', 'removed', '+0.1%'].map((text) => expect.stringMatching(text === 'removed' ? /^removed$/ : /%$/)));
    expect(panels[3]!.getAttribute('data-reason')).toBe('missing-candidate');
    expect(panels[3]!.querySelector('[data-slot="delta-value"]')?.getAttribute('data-state')).toBe('missing');
    fireEvent.click(screen.getByRole('button', { name: 'name' }));
    expect(container.querySelector('[data-slot="benchmark-compare-panel"] p')?.textContent).toBe('Alpha.Noise');
  });

  it('forces the table alone', () => {
    const { container } = render(<BenchmarkCompare comparisons={comparisons} layout="table" />);
    expect(container.querySelector('[data-part="panels"]')).toBeNull();
  });

  it('shows the empty state', () => {
    render(<BenchmarkCompare comparisons={[]} />);
    expect(screen.getByText('No benchmarks.')).toBeTruthy();
  });
});
