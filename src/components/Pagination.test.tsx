import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './Pagination';

/**
 * Three behaviours, and the interesting one is that it renders a *link* when
 * given `getPageHref` and a *button* when given `onPageChange`.
 *
 * That is the same distinction `Button` makes and for the same reason: paging is
 * navigation when it has a URL, so it should survive middle-click and announce
 * itself as a link. When there is no URL there is nothing to navigate to and a
 * button is correct.
 */
describe('Pagination', () => {
  it('disables the ends rather than hiding them', () => {
    render(<Pagination totalPages={3} currentPage={1} onPageChange={() => {}} />);
    expect(screen.getByLabelText('Previous Page')).toHaveProperty('disabled', true);
  });

  it('disables next on the last page', () => {
    render(<Pagination totalPages={3} currentPage={3} onPageChange={() => {}} />);
    expect(screen.getByLabelText('Next Page')).toHaveProperty('disabled', true);
  });

  it('calls onPageChange with the neighbouring page', () => {
    const onPageChange = vi.fn();
    render(<Pagination totalPages={3} currentPage={2} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByLabelText('Previous Page'));
    expect(onPageChange).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByLabelText('Next Page'));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('renders links, not buttons, when given hrefs — paging is navigation', () => {
    render(<Pagination totalPages={3} currentPage={2} getPageHref={(p) => `/page/${p}`} />);
    const links = screen.getAllByRole('link');
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/page/1', '/page/3']);
  });

  it('states where you are', () => {
    render(<Pagination totalPages={7} currentPage={4} onPageChange={() => {}} />);
    expect(screen.getByText(/4/)).toBeDefined();
    expect(screen.getByText(/7/)).toBeDefined();
  });

  it('names its navigation region', () => {
    render(<Pagination totalPages={3} currentPage={2} onPageChange={() => {}} />);
    expect(screen.getByRole('navigation', { name: /pagination/i })).toBeDefined();
  });
});
