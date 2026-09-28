import { createRef } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SiteFooter } from './SiteFooter';
import { SiteNav, SiteNavItem } from './SiteNav';

describe('SiteFooter', () => {
  it('is the contentinfo landmark', () => {
    render(<SiteFooter meta="© Site" />);
    expect(screen.getByRole('contentinfo').tagName).toBe('FOOTER');
  });

  it('renders nothing of its own: no copy, no links, when given no slots', () => {
    render(<SiteFooter data-testid="f" />);
    const footer = screen.getByTestId('f');
    expect(footer.textContent).toBe('');
    expect(footer.children).toHaveLength(0);
  });

  it('places the lead, the link columns and the strip', () => {
    render(
      <SiteFooter
        meta="© Site"
        nav={
          <>
            <SiteNav label="Product" orientation="vertical">
              <SiteNavItem href="/features">Features</SiteNavItem>
            </SiteNav>
            <SiteNav label="Legal" orientation="vertical">
              <SiteNavItem href="/terms">Terms</SiteNavItem>
            </SiteNav>
          </>
        }
      >
        A line about the site.
      </SiteFooter>,
    );
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByText('A line about the site.')).toBeDefined();
    expect(within(footer).getByRole('navigation', { name: 'Product' })).toBeDefined();
    expect(within(footer).getByRole('navigation', { name: 'Legal' })).toBeDefined();
    expect(within(footer).getByText('© Site')).toBeDefined();
  });

  it('draws the rule over the strip only when there is something above it', () => {
    const { container, rerender } = render(<SiteFooter meta="© Site" />);
    expect(container.querySelector('[data-slot="site-footer-meta"]')?.className ?? '').not.toContain(
      'border-t-2',
    );
    rerender(<SiteFooter meta="© Site">Lead</SiteFooter>);
    expect(container.querySelector('[data-slot="site-footer-meta"]')?.className).toContain('border-t-2');
  });

  it('forwards its ref, merges className and spreads the rest', () => {
    const ref = createRef<HTMLElement>();
    render(<SiteFooter ref={ref} className="mt-16" data-testid="f" meta="x" />);
    expect(ref.current?.tagName).toBe('FOOTER');
    expect(screen.getByTestId('f').className).toContain('mt-16');
  });
});
