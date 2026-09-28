import { createRef } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LinkProvider } from './LinkProvider';
import { MobileNav } from './MobileNav';
import { SiteHeader } from './SiteHeader';
import { SiteNav, SiteNavItem } from './SiteNav';

function Page(props: Partial<Parameters<typeof SiteHeader>[0]>) {
  const items = (
    <>
      <SiteNavItem href="/work">Work</SiteNavItem>
      <SiteNavItem href="/writing">Writing</SiteNavItem>
    </>
  );
  return (
    <SiteHeader
      brand="Site"
      nav={<SiteNav label="Primary">{items}</SiteNav>}
      mobileNav={<MobileNav label="Primary">{items}</MobileNav>}
      {...props}
    />
  );
}

describe('SiteHeader', () => {
  it('is the banner landmark', () => {
    render(<Page />);
    expect(screen.getByRole('banner').tagName).toBe('HEADER');
  });

  it('opens with a skip link to the main content, first in the tab order', () => {
    render(<Page />);
    const banner = screen.getByRole('banner');
    const skip = within(banner).getByRole('link', { name: 'Skip to content' });
    expect(skip.getAttribute('href')).toBe('#main-content');
    const focusable = banner.querySelectorAll('a[href], button');
    expect(focusable[0]).toBe(skip);
  });

  it('accepts the skip target with or without its hash, and can omit the link', () => {
    const { rerender } = render(<Page skipTo="#content" skipLabel="Skip ahead" />);
    expect(screen.getByRole('link', { name: 'Skip ahead' }).getAttribute('href')).toBe('#content');
    rerender(<Page skipTo="content" skipLabel="Skip ahead" />);
    expect(screen.getByRole('link', { name: 'Skip ahead' }).getAttribute('href')).toBe('#content');
    rerender(<Page skipTo={false} />);
    expect(screen.queryByRole('link', { name: /skip/i })).toBeNull();
  });

  it('links the brand home, and never marks it as the current page', () => {
    render(
      <LinkProvider isCurrent={() => true}>
        <Page brandHref="/home" />
      </LinkProvider>,
    );
    const brand = screen.getByRole('link', { name: 'Site' });
    expect(brand.getAttribute('href')).toBe('/home');
    expect(brand.hasAttribute('aria-current')).toBe(false);
  });

  // The breakpoint is the point of the component, and jsdom has no layout, so
  // the classes are the observable contract: each slot is hidden on one side
  // of the breakpoint and shown on the other, and never both.
  it.each([
    ['sm', 'sm:block', 'sm:hidden'],
    ['md', 'md:block', 'md:hidden'],
    ['lg', 'lg:block', 'lg:hidden'],
  ] as const)('swaps the navs at %s', (collapseAt, navShown, mobileHidden) => {
    const { container } = render(<Page collapseAt={collapseAt} />);
    const nav = container.querySelector('[data-slot="site-header-nav"]') as HTMLElement;
    const mobile = container.querySelector('[data-slot="site-header-mobile-nav"]') as HTMLElement;
    expect(nav.className.split(' ')).toEqual(expect.arrayContaining(['hidden', navShown]));
    expect(mobile.className.split(' ')).toContain(mobileHidden);
    expect(mobile.className.split(' ')).not.toContain('hidden');
  });

  it('collapses at md by default', () => {
    const { container } = render(<Page />);
    expect(container.querySelector('[data-slot="site-header-nav"]')?.className).toContain('md:block');
  });

  it('hides the inactive nav with display, never with aria-hidden', () => {
    // A focusable link under an `aria-hidden` ancestor is announced as
    // nothing and still reached by Tab — the defect axe calls
    // `aria-hidden-focus`. `display: none` removes both at once.
    const { container } = render(<Page />);
    expect(container.querySelector('[aria-hidden="true"] a, [aria-hidden="true"] button')).toBeNull();
  });

  it('renders actions, and no slot it was not given', () => {
    const { container, rerender } = render(<Page actions={<button type="button">GO</button>} />);
    expect(screen.getByRole('button', { name: 'GO' })).toBeDefined();
    rerender(<SiteHeader brand="Site" />);
    for (const slot of ['nav', 'mobile-nav', 'actions']) {
      expect(container.querySelector(`[data-slot="site-header-${slot}"]`)).toBeNull();
    }
  });

  it('sticks only when asked', () => {
    const { rerender } = render(<Page />);
    expect(screen.getByRole('banner').className).not.toContain('sticky');
    rerender(<Page sticky />);
    expect(screen.getByRole('banner').className).toContain('sticky');
  });

  it('forwards its ref, merges className and spreads the rest', () => {
    const ref = createRef<HTMLElement>();
    render(<Page ref={ref} className="mb-8" data-testid="hdr" />);
    expect(ref.current?.tagName).toBe('HEADER');
    expect(screen.getByTestId('hdr').className).toContain('mb-8');
  });
});
