import { createRef, forwardRef } from 'react';
import type { AnchorHTMLAttributes } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LinkProvider, SiteLink, isExternalHref, useIsCurrentHref } from './LinkProvider';
import { DocsLink, DocsLinkProvider } from './docs/DocsLinkProvider';

// A stand-in for a router's `Link`: marks what it rendered so a test can tell
// the injected component from a plain anchor.
const RouterLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(
  function RouterLink({ children, ...props }, ref) {
    return (
      <a ref={ref} data-router="" {...props}>
        {children}
      </a>
    );
  },
);

describe('LinkProvider', () => {
  it('renders a plain anchor when nothing is injected', () => {
    render(<SiteLink href="/work">Work</SiteLink>);
    const link = screen.getByRole('link', { name: 'Work' });
    expect(link.getAttribute('href')).toBe('/work');
    expect(link.hasAttribute('data-router')).toBe(false);
  });

  it('routes internal hrefs through the injected component and keeps the rest plain', () => {
    render(
      <LinkProvider component={RouterLink}>
        <SiteLink href="/work">Work</SiteLink>
        <SiteLink href="https://github.com/example">Repo</SiteLink>
        <SiteLink href="#main">Skip</SiteLink>
        <SiteLink href="mailto:someone@example.com">Mail</SiteLink>
      </LinkProvider>,
    );
    expect(screen.getByRole('link', { name: 'Work' }).hasAttribute('data-router')).toBe(true);
    for (const name of ['Repo', 'Skip', 'Mail']) {
      expect(screen.getByRole('link', { name }).hasAttribute('data-router')).toBe(false);
    }
    const external = screen.getByRole('link', { name: 'Repo' });
    expect(external.getAttribute('target')).toBe('_blank');
    expect(external.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('marks the link the consumer route names as the current page, on the anchor', () => {
    render(
      <LinkProvider isCurrent={(href) => href === '/writing'}>
        <SiteLink href="/work">Work</SiteLink>
        <SiteLink href="/writing">Writing</SiteLink>
      </LinkProvider>,
    );
    expect(screen.getByRole('link', { name: 'Writing' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Work' }).hasAttribute('aria-current')).toBe(false);
  });

  it('never asks the route about an external or in-page href', () => {
    const isCurrent = vi.fn(() => true);
    render(
      <LinkProvider isCurrent={isCurrent}>
        <SiteLink href="https://example.com">Out</SiteLink>
        <SiteLink href="#top">Top</SiteLink>
      </LinkProvider>,
    );
    expect(isCurrent).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Out' }).hasAttribute('aria-current')).toBe(false);
  });

  it('does not guess the current page from window.location', () => {
    // The href is the page jsdom is on. Without an `isCurrent`, that is not
    // evidence of anything: the route is the router's to report.
    render(<SiteLink href={window.location.pathname}>Here</SiteLink>);
    expect(screen.getByRole('link', { name: 'Here' }).hasAttribute('aria-current')).toBe(false);
  });

  it('lets an item override the route, in both directions', () => {
    render(
      <LinkProvider isCurrent={() => true}>
        <SiteLink href="/a" current={false}>
          A
        </SiteLink>
      </LinkProvider>,
    );
    render(<SiteLink href="/b" current>B</SiteLink>);
    expect(screen.getByRole('link', { name: 'A' }).hasAttribute('aria-current')).toBe(false);
    expect(screen.getByRole('link', { name: 'B' }).getAttribute('aria-current')).toBe('page');
  });

  it('keeps a caller aria-current when the link is not the current page', () => {
    render(
      <SiteLink href="/step-2" aria-current="step">
        Step 2
      </SiteLink>,
    );
    expect(screen.getByRole('link', { name: 'Step 2' }).getAttribute('aria-current')).toBe('step');
  });

  it('inherits what a nested provider does not set', () => {
    render(
      <LinkProvider isCurrent={(href) => href === '/work'}>
        <LinkProvider component={RouterLink}>
          <SiteLink href="/work">Work</SiteLink>
        </LinkProvider>
      </LinkProvider>,
    );
    const link = screen.getByRole('link', { name: 'Work' });
    expect(link.hasAttribute('data-router')).toBe(true);
    expect(link.getAttribute('aria-current')).toBe('page');
  });

  it('forwards its ref to the anchor', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <SiteLink ref={ref} href="/work">
        Work
      </SiteLink>,
    );
    expect(ref.current?.tagName).toBe('A');
  });

  it('exposes the route test to custom chrome through useIsCurrentHref', () => {
    function Probe({ href }: { href: string }) {
      return <span>{useIsCurrentHref(href) ? 'current' : 'not'}</span>;
    }
    render(
      <LinkProvider isCurrent={(href) => href === '/x'}>
        <Probe href="/x" />
      </LinkProvider>,
    );
    expect(screen.getByText('current')).toBeDefined();
  });

  it('classifies hrefs', () => {
    expect(isExternalHref('https://example.com')).toBe(true);
    expect(isExternalHref('//cdn.example.com')).toBe(true);
    expect(isExternalHref('tel:123')).toBe(true);
    expect(isExternalHref('/docs')).toBe(false);
  });
});

// One adapter, two chromes (issue 246): the docs family's provider and the
// site family's write to the same context, so a router injected through either
// reaches links in both.
describe('the docs and site chrome share one link adapter', () => {
  it('DocsLinkProvider reaches SiteLink', () => {
    render(
      <DocsLinkProvider component={RouterLink}>
        <SiteLink href="/work">Work</SiteLink>
      </DocsLinkProvider>,
    );
    expect(screen.getByRole('link', { name: 'Work' }).hasAttribute('data-router')).toBe(true);
  });

  it('LinkProvider reaches DocsLink', () => {
    render(
      <LinkProvider component={RouterLink}>
        <DocsLink href="/docs">Docs</DocsLink>
      </LinkProvider>,
    );
    expect(screen.getByRole('link', { name: 'Docs' }).hasAttribute('data-router')).toBe(true);
  });

  it('DocsLink does not start marking current pages from isCurrent', () => {
    // The docs chrome marks its own current items (`DocsSidebar`'s
    // `currentPath`, `DocsNavItem.active`); an `isCurrent` given for the site
    // chrome must not change what it renders.
    render(
      <LinkProvider isCurrent={() => true}>
        <DocsLink href="/docs">Docs</DocsLink>
      </LinkProvider>,
    );
    expect(screen.getByRole('link', { name: 'Docs' }).hasAttribute('aria-current')).toBe(false);
  });
});
