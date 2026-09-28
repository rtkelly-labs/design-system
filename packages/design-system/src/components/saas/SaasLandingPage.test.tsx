import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DEFAULT_PRICING_TIERS, SaasLandingPage } from './SaasLandingPage';

// Issue 248: the landing page is a composition of the exported marketing
// sections, not a second implementation beside them.
describe('SaasLandingPage', () => {
  it('is built from Hero, FeatureGrid and PricingGrid', () => {
    const { container } = render(<SaasLandingPage />);
    expect(container.querySelector('[data-slot="hero"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-slot="feature"]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-slot="pricing-tier"]')).toHaveLength(
      DEFAULT_PRICING_TIERS.length,
    );
  });

  it('maps the tier data onto the component: the badge and the CTA label', () => {
    render(
      <SaasLandingPage
        pricingTiers={[
          { name: 'A', price: '$1', description: 'a', features: [], accent: 'primary', highlighted: true },
          { name: 'B', price: '$2', description: 'b', features: [], accent: 'secondary', ctaText: 'BUY B' },
        ]}
      />,
    );
    expect(screen.getByText('POPULAR')).toBeDefined();
    expect(screen.getByRole('button', { name: /SELECT PLAN/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /BUY B/ })).toBeDefined();
  });

  it('hides the deploy log when it is empty, as its prop documents', () => {
    const { rerender } = render(<SaasLandingPage />);
    expect(screen.getByRole('region', { name: 'Deployment log' })).toBeDefined();
    rerender(<SaasLandingPage deployLog="" />);
    expect(screen.queryByRole('region', { name: 'Deployment log' })).toBeNull();
  });
});
