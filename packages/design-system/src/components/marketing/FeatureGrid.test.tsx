import { createRef } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Feature, FeatureGrid } from './FeatureGrid';

describe('FeatureGrid', () => {
  it('is a region named by its heading, with the features inside', () => {
    render(
      <FeatureGrid title="Why" description="Because.">
        <Feature title="Sync">Fast.</Feature>
        <Feature title="Backups">Safe.</Feature>
      </FeatureGrid>,
    );
    const region = screen.getByRole('region', { name: 'Why' });
    expect(within(region).getByText('Because.')).toBeDefined();
    expect(within(region).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Sync',
      'Backups',
    ]);
  });

  it('is not a landmark, and draws no header, without a title', () => {
    const { container } = render(<FeatureGrid data-testid="g" />);
    expect(screen.queryByRole('region')).toBeNull();
    expect(container.querySelector('[data-slot="feature-grid-header"]')).toBeNull();
    expect(container.textContent).toBe('');
  });

  it('is one column below md and `columns` wide above it', () => {
    const { container, rerender } = render(<FeatureGrid />);
    const items = () => container.querySelector('[data-slot="feature-grid-items"]')?.className ?? '';
    expect(items()).toContain('grid-cols-1');
    expect(items()).toContain('md:grid-cols-3');
    rerender(<FeatureGrid columns={4} />);
    expect(items()).toContain('lg:grid-cols-4');
    rerender(<FeatureGrid columns={2} />);
    expect(items()).toContain('md:grid-cols-2');
    expect(items()).not.toContain('md:grid-cols-3');
  });

  it('forwards its ref, merges className and spreads the rest', () => {
    const ref = createRef<HTMLElement>();
    render(<FeatureGrid ref={ref} className="my-4" data-testid="g" />);
    const root = screen.getByTestId('g');
    expect(ref.current).toBe(root);
    expect(root.dataset.slot).toBe('feature-grid');
    expect(root.className).toContain('my-4');
    expect(root.className).not.toContain('my-12');
  });
});

describe('Feature', () => {
  it('colours a decorative icon by its accent', () => {
    const { container } = render(
      <Feature title="Sync" accent="tertiary" icon={<svg data-testid="icon" />}>
        Fast.
      </Feature>,
    );
    const icon = container.querySelector('[data-slot="feature-icon"]');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
    expect(icon?.className).toContain('text-accent-tertiary');
    expect(container.querySelector('[data-slot="feature-description"]')?.textContent).toBe('Fast.');
  });

  it('renders no icon or description wrapper when given none', () => {
    const { container } = render(<Feature title="Bare" />);
    expect(container.querySelector('[data-slot="feature-icon"]')).toBeNull();
    expect(container.querySelector('[data-slot="feature-description"]')).toBeNull();
  });

  it('forwards its ref to the panel and spreads the rest', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Feature ref={ref} title="Sync" data-testid="f" className="h-full" />);
    const root = screen.getByTestId('f');
    expect(ref.current).toBe(root);
    expect(root.dataset.slot).toBe('feature');
    expect(root.className).toContain('h-full');
  });
});
