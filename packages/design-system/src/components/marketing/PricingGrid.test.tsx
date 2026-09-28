import { createRef } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PricingGrid, PricingTier } from './PricingGrid';

describe('PricingGrid', () => {
  it('is a region named by its heading, with the tiers inside', () => {
    render(
      <PricingGrid title="Pricing" columns={2}>
        <PricingTier name="Solo" price="$0" />
        <PricingTier name="Team" price="$9" />
      </PricingGrid>,
    );
    const region = screen.getByRole('region', { name: 'Pricing' });
    expect(within(region).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Solo',
      'Team',
    ]);
    expect(region.querySelector('[data-slot="pricing-grid-items"]')?.className).toContain('md:grid-cols-2');
  });

  it('forwards its ref, merges className and spreads the rest', () => {
    const ref = createRef<HTMLElement>();
    render(<PricingGrid ref={ref} className="mt-0" data-testid="g" />);
    const root = screen.getByTestId('g');
    expect(ref.current).toBe(root);
    expect(root.dataset.slot).toBe('pricing-grid');
    expect(root.className).toContain('mt-0');
  });
});

describe('PricingTier', () => {
  it('renders the name, price, period, description and a ticked list', () => {
    const { container } = render(
      <PricingTier
        name="Team"
        price="$12"
        period="/seat"
        description="For a team."
        features={['Shared workspaces', 'Audit log']}
      />,
    );
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Team');
    expect(container.querySelector('[data-slot="pricing-tier-price"]')?.textContent).toBe('$12/seat');
    expect(screen.getByText('For a team.')).toBeDefined();
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual(['Shared workspaces', 'Audit log']);
    expect(items[0].querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('decides no label for the caller: no badge, no action, no list unless given', () => {
    const { container } = render(<PricingTier name="Free" price="$0" />);
    expect(container.textContent).toBe('Free$0');
    expect(screen.queryByRole('list')).toBeNull();
    expect(container.querySelector('[data-slot="pricing-tier-action"]')).toBeNull();
  });

  it('shows the badge and pins the action below a rule', () => {
    const { container } = render(
      <PricingTier
        name="Team"
        price="$9"
        badge="POPULAR"
        action={<button type="button">Choose</button>}
      />,
    );
    expect(screen.getByText('POPULAR')).toBeDefined();
    const action = container.querySelector('[data-slot="pricing-tier-action"]');
    expect(action?.className).toContain('mt-auto');
    expect(within(action as HTMLElement).getByRole('button', { name: 'Choose' })).toBeDefined();
  });

  it('colours the price by its accent', () => {
    const { container } = render(<PricingTier name="T" price="$1" accent="secondary" />);
    const price = container.querySelector('[data-slot="pricing-tier-price"] span');
    expect(price?.className).toContain('text-accent-secondary');
  });

  it('forwards its ref, merges className and spreads the rest', () => {
    const ref = createRef<HTMLDivElement>();
    render(<PricingTier ref={ref} name="T" price="$1" data-testid="t" className="h-full" />);
    const root = screen.getByTestId('t');
    expect(ref.current).toBe(root);
    expect(root.dataset.slot).toBe('pricing-tier');
    expect(root.className).toContain('h-full');
    expect(root.className).toContain('flex-col');
  });
});
