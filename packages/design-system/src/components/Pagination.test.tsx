import { createRef } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './Pagination';

/**
 * The interesting behaviour is that it renders a *link* when given
 * `getPageHref` and a *button* when given `onPageChange`.
 *
 * That is the same distinction `Button` makes and for the same reason: paging is
 * navigation when it has a URL, so it should survive middle-click and announce
 * itself as a link. When there is no URL there is nothing to navigate to and a
 * button is correct.
 *
 * The rest is the contract a numbered strip owes a keyboard and a screen
 * reader: the current page is announced, the ends stay reachable when they have
 * nowhere to go, and no button submits the form it happens to sit in.
 */
describe('Pagination', () => {
  it('keeps the ends in place and reachable, announced as unavailable', () => {
    render(<Pagination totalPages={3} currentPage={1} onPageChange={() => {}} />);
    const prev = screen.getByLabelText('Previous Page');
    expect(prev.getAttribute('aria-disabled')).toBe('true');
    // Not the `disabled` attribute, which would drop it from the tab order.
    expect(prev).toHaveProperty('disabled', false);
    prev.focus();
    expect(document.activeElement).toBe(prev);
  });

  it('marks next unavailable on the last page, and pressing it does nothing', () => {
    const onPageChange = vi.fn();
    render(<Pagination totalPages={3} currentPage={3} onPageChange={onPageChange} />);
    const next = screen.getByLabelText('Next Page');
    expect(next.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(next);
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('marks the ends unavailable in navigation mode too', () => {
    render(<Pagination totalPages={3} currentPage={1} getPageHref={(p) => `/page/${p}`} />);
    expect(screen.getByLabelText('Previous Page').getAttribute('aria-disabled')).toBe('true');
  });

  it('calls onPageChange with the neighbouring page', () => {
    const onPageChange = vi.fn();
    render(<Pagination totalPages={3} currentPage={2} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByLabelText('Previous Page'));
    expect(onPageChange).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByLabelText('Next Page'));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('jumps straight to a numbered page', () => {
    const onPageChange = vi.fn();
    render(<Pagination totalPages={20} currentPage={7} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Page 20' }));
    expect(onPageChange).toHaveBeenCalledWith(20);
  });

  it('does not call onPageChange for the page you are already on', () => {
    const onPageChange = vi.fn();
    render(<Pagination totalPages={20} currentPage={7} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Page 7' }));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('marks exactly one page current, in both modes', () => {
    const { unmount } = render(<Pagination totalPages={20} currentPage={7} onPageChange={() => {}} />);
    let current = document.querySelectorAll('[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0].getAttribute('aria-label')).toBe('Page 7');
    unmount();

    render(<Pagination totalPages={20} currentPage={7} getPageHref={(p) => `/page/${p}`} />);
    current = document.querySelectorAll('[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0].tagName).toBe('A');
    expect(current[0].getAttribute('href')).toBe('/page/7');
  });

  it('distinguishes the current page by more than colour — it is bracketed', () => {
    render(<Pagination totalPages={20} currentPage={7} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Page 7' }).textContent).toBe('[7]');
    expect(screen.getByRole('button', { name: 'Page 8' }).textContent).toBe('8');
  });

  it('renders links, not buttons, when given hrefs — paging is navigation', () => {
    render(<Pagination totalPages={3} currentPage={2} getPageHref={(p) => `/page/${p}`} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    const links = screen.getAllByRole('link');
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/page/1', '/page/1', '/page/2', '/page/3', '/page/3']);
  });

  it('puts rel="prev" and rel="next" on the ends in navigation mode', () => {
    render(<Pagination totalPages={3} currentPage={2} getPageHref={(p) => `/page/${p}`} />);
    expect(screen.getByLabelText('Previous Page').getAttribute('rel')).toBe('prev');
    expect(screen.getByLabelText('Next Page').getAttribute('rel')).toBe('next');
    // Only the ends: a numbered link is not "the previous page" by relation.
    expect(screen.getByRole('link', { name: 'Page 1' }).getAttribute('rel')).toBeNull();
  });

  it('gives every button type="button", so none submits a surrounding form', () => {
    const onSubmit = vi.fn((e: { preventDefault: () => void }) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Pagination totalPages={20} currentPage={1} onPageChange={() => {}} />
      </form>,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) {
      expect(button.getAttribute('type')).toBe('button');
      fireEvent.click(button);
    }
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps the same number of page items wherever the current page is', () => {
    const counts = new Set<number>();
    for (let page = 1; page <= 20; page++) {
      const { container, unmount } = render(
        <Pagination totalPages={20} currentPage={page} onPageChange={() => {}} />,
      );
      counts.add(container.querySelectorAll('[data-slot="pagination-list"] > li').length);
      unmount();
    }
    expect([...counts]).toEqual([7]);
  });

  it('hides the ellipses from assistive tech', () => {
    render(<Pagination totalPages={20} currentPage={10} onPageChange={() => {}} />);
    const gaps = document.querySelectorAll('[data-slot="pagination-ellipsis"]');
    expect(gaps).toHaveLength(2);
    gaps.forEach((gap) => expect(gap.getAttribute('aria-hidden')).toBe('true'));
  });

  it('states where you are, for the narrow layout', () => {
    render(<Pagination totalPages={7} currentPage={4} onPageChange={() => {}} />);
    const status = document.querySelector('[data-slot="pagination-status"]') as HTMLElement;
    expect(within(status).getByText(/4/)).toBeDefined();
    expect(status.textContent).toContain('7');
  });

  it('names its navigation region', () => {
    render(<Pagination totalPages={3} currentPage={2} onPageChange={() => {}} />);
    expect(screen.getByRole('navigation', { name: /pagination/i })).toBeDefined();
  });

  it('forwards its ref and spreads unrecognised props onto the root', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Pagination ref={ref} totalPages={3} currentPage={2} data-testid="pager" onPageChange={() => {}} />);
    expect(ref.current).toBe(screen.getByTestId('pager'));
    expect(ref.current?.getAttribute('data-slot')).toBe('pagination');
  });

  it('derives the end controls and the status from the clamped page, not the raw one', () => {
    // A filter shrank the result set to 3 pages while the caller still says 10.
    const onPageChange = vi.fn();
    render(<Pagination totalPages={3} currentPage={10} onPageChange={onPageChange} />);

    expect(screen.getByRole('button', { name: 'Page 3' }).getAttribute('aria-current')).toBe('page');
    fireEvent.click(screen.getByRole('button', { name: 'Previous Page' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(screen.getByRole('button', { name: 'Next Page' }).getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByText('[ 3 / 3 ]')).toBeTruthy();
  });
});
