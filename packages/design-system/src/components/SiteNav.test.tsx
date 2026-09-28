import { createRef, forwardRef } from 'react';
import type { AnchorHTMLAttributes } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LinkProvider } from './LinkProvider';
import { SiteNav, SiteNavItem } from './SiteNav';
import { ThemeProvider } from './ThemeProvider';

const RouterLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(
  function RouterLink({ children, ...props }, ref) {
    return (
      <a ref={ref} data-router="" {...props}>
        {children}
      </a>
    );
  },
);

describe('SiteNav', () => {
  it('is a navigation landmark named on the <nav> itself', () => {
    render(
      <SiteNav label="Primary">
        <SiteNavItem href="/a">A</SiteNavItem>
      </SiteNav>,
    );
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(nav.tagName).toBe('NAV');
    expect(nav.getAttribute('aria-label')).toBe('Primary');
  });

  it('keeps its label when a caller passes an aria-label through the rest props', () => {
    // `aria-label` is omitted from the props type; this is the runtime half.
    const stray = { 'aria-label': 'Wrong' } as Record<string, string>;
    render(
      <SiteNav label="Primary" {...stray}>
        <SiteNavItem href="/a">A</SiteNavItem>
      </SiteNav>,
    );
    expect(screen.getByRole('navigation').getAttribute('aria-label')).toBe('Primary');
  });

  it('renders its items as a list, and none of its own', () => {
    const { rerender } = render(
      <SiteNav label="Primary">
        <SiteNavItem href="/a">A</SiteNavItem>
        <SiteNavItem href="/b">B</SiteNavItem>
      </SiteNav>,
    );
    const list = within(screen.getByRole('navigation')).getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);

    rerender(<SiteNav label="Primary">{null}</SiteNav>);
    expect(within(screen.getByRole('navigation')).queryAllByRole('link')).toHaveLength(0);
  });

  it('puts aria-current on the anchor of the current item, not its list item', () => {
    render(
      <SiteNav label="Primary">
        <SiteNavItem href="/a" current>
          A
        </SiteNavItem>
        <SiteNavItem href="/b">B</SiteNavItem>
      </SiteNav>,
    );
    const current = screen.getByRole('link', { name: 'A' });
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(current.closest('li')?.hasAttribute('aria-current')).toBe(false);
    expect(screen.getByRole('link', { name: 'B' }).hasAttribute('aria-current')).toBe(false);
  });

  it('takes the current item from the consumer route through the LinkProvider', () => {
    render(
      <LinkProvider component={RouterLink} isCurrent={(href) => href === '/b'}>
        <SiteNav label="Primary">
          <SiteNavItem href="/a">A</SiteNavItem>
          <SiteNavItem href="/b">B</SiteNavItem>
        </SiteNav>
      </LinkProvider>,
    );
    const b = screen.getByRole('link', { name: 'B' });
    expect(b.getAttribute('aria-current')).toBe('page');
    expect(b.hasAttribute('data-router')).toBe(true);
  });

  it('keys the current styling off the attribute, so the two cannot disagree', () => {
    render(
      <SiteNav label="Primary">
        <SiteNavItem href="/a" current>
          A
        </SiteNavItem>
      </SiteNav>,
    );
    const link = screen.getByRole('link', { name: 'A' });
    expect(link.className).toContain('aria-[current=page]:border-accent-primary');
  });

  it('lays out as a column when vertical', () => {
    render(
      <SiteNav label="Footer" orientation="vertical">
        <SiteNavItem href="/a">A</SiteNavItem>
      </SiteNav>,
    );
    const nav = screen.getByRole('navigation', { name: 'Footer' });
    expect(nav.getAttribute('data-orientation')).toBe('vertical');
    expect(within(nav).getByRole('list').className).toContain('flex-col');
    expect(screen.getByRole('link', { name: 'A' }).className).toContain('border-l-4');
  });

  it('merges a caller className and spreads the rest onto the <nav>', () => {
    const ref = createRef<HTMLElement>();
    render(
      <SiteNav ref={ref} label="Primary" className="mt-4" data-testid="nav">
        <SiteNavItem href="/a">A</SiteNavItem>
      </SiteNav>,
    );
    expect(ref.current?.tagName).toBe('NAV');
    expect(screen.getByTestId('nav').className).toContain('mt-4');
  });

  it('still calls an item onClick', () => {
    const onClick = vi.fn();
    render(
      <SiteNav label="Primary">
        <SiteNavItem href="#a" onClick={onClick}>
          A
        </SiteNavItem>
      </SiteNav>,
    );
    fireEvent.click(screen.getByRole('link', { name: 'A' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('SiteNavItem with children', () => {
  afterEach(() => document.documentElement.removeAttribute('data-theme'));

  function Nav({ defaultOpen = false }: { defaultOpen?: boolean }) {
    return (
      <LinkProvider component={RouterLink} isCurrent={(href) => href === '/guides'}>
        <SiteNav label="Primary">
          <SiteNavItem href="/pricing">Pricing</SiteNavItem>
          <SiteNavItem label="Resources" defaultOpen={defaultOpen}>
            <SiteNavItem href="/guides">Guides</SiteNavItem>
            {/* jsdom cannot navigate; the router a consumer injects would not either. */}
            <SiteNavItem href="/changelog" onClick={(event) => event.preventDefault()}>
              Changelog
            </SiteNavItem>
          </SiteNavItem>
        </SiteNav>
      </LinkProvider>
    );
  }

  it('is a Menu: a trigger button that opens a menu named by it', async () => {
    render(<Nav />);
    const trigger = screen.getByRole('button', { name: 'Resources' });
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(screen.queryByRole('menu')).toBeNull();

    fireEvent.click(trigger);
    const menu = await screen.findByRole('menu');
    expect(menu.getAttribute('aria-labelledby')).toBe(trigger.id);
  });

  it('renders its children as menu links through the LinkProvider, current one marked', async () => {
    render(<Nav defaultOpen />);
    const menu = await screen.findByRole('menu');
    const items = within(menu).getAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual(['Guides', 'Changelog']);
    for (const item of items) {
      expect(item.tagName).toBe('A');
      expect(item.hasAttribute('data-router')).toBe(true);
    }
    expect(items[0].getAttribute('href')).toBe('/guides');
    expect(items[0].getAttribute('aria-current')).toBe('page');
    expect(items[1].hasAttribute('aria-current')).toBe(false);
  });

  it('closes the menu when a link in it is followed', async () => {
    render(<Nav defaultOpen />);
    const menu = await screen.findByRole('menu');
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Changelog' }));
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  });

  it('opens with the scoped Level, not the document one', async () => {
    document.documentElement.setAttribute('data-theme', 'midnight');
    render(
      <ThemeProvider scoped defaultLevel="sketch">
        <Nav defaultOpen />
      </ThemeProvider>,
    );
    const menu = await screen.findByRole('menu');
    expect(menu.closest('[data-theme]')?.getAttribute('data-theme')).toBe('sketch');
  });
});
