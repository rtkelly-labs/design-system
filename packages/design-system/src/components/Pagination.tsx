'use client';

import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/recipe';
import { paginationRange } from './paginationRange';

export interface PaginationProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** How many pages there are. The last page's number, not an index. */
  totalPages: number;
  /**
   * The page being shown, counted from 1. Marked `aria-current="page"` in the
   * page list; out-of-range values render the nearest real page as current.
   */
  currentPage: number;
  /**
   * Callback mode: every control is a `<button type="button">` and pressing one
   * calls this with the page it names. Pressing the current page does not call
   * it — there is nowhere to go.
   */
  onPageChange?: (page: number) => void;
  /**
   * Navigation mode: every control is an `<a>` to the URL this returns, so
   * paging survives middle-click and is crawlable. PREV and NEXT carry
   * `rel="prev"` / `rel="next"`. Takes precedence over `onPageChange` when both
   * are given. Deliberately a function rather than a router: the component
   * never imports one.
   */
  getPageHref?: (page: number) => string;
  /** Merged into the root's classes. For placement — margins, width — not colour. */
  className?: string;
}

const activeBtnClasses =
  'border-2 border-edge-strong text-content-inverse px-6 py-3 font-bold uppercase shadow-hard-md hover:shadow-hard-lg active:translate-x-1 active:translate-y-1 active:shadow-none transition-all';
const disabledBtnClasses =
  'cursor-not-allowed opacity-50 border-2 border-edge-strong bg-surface-raised text-content-primary px-6 py-3 font-bold uppercase';

/*
 * A page item shares the ends' press language and swaps their fill for the
 * resting surface. The current page is told apart three ways, only one of them
 * colour: it is bracketed, `[7]`, and it sits pressed in — offset, shadowless —
 * where the others stand proud. Brackets are this system's "this one" cue
 * (`Button`'s `bracketed`), so they read without a legend.
 *
 * The ellipses are `aria-hidden`: a gap is visual shorthand, and the page
 * labels either side of it already say what is missing.
 */
const pageItemClasses = 'inline-block min-w-11 px-2 py-3 text-center font-bold border-2 border-edge-strong';

/*
 * PREV, NEXT and the status never wrap their own text. At a phone's width the
 * ends take half their `md` padding instead, which is what lets the three sit
 * on one line at 412px rather than breaking `<< PREV` over two.
 */
const endClasses = 'whitespace-nowrap px-3 md:px-6';
const pageClasses = cn(activeBtnClasses, pageItemClasses, 'bg-surface-base text-content-primary');
const currentPageClasses = cn(
  pageItemClasses,
  'bg-accent-secondary text-content-inverse translate-x-1 translate-y-1',
);

/**
 * Previous / next paging with a numbered page list, in one of two modes.
 *
 * **Callback mode** — pass `onPageChange` and every control is a button. **Navigation
 * mode** — pass `getPageHref` and every control is a link, the same split `Button`
 * makes: paging with a URL is navigation and should behave like it. Neither mode
 * knows about a router, which is what lets any app use it.
 *
 * The page list is first, last, the current page with one neighbour either side,
 * and at most two ellipses — seven slots once there are more than seven pages,
 * whatever the current page, so the strip never changes width as the reader
 * clicks along it. Below the `md` breakpoint the list gives way to the
 * `[ 7 / 20 ]` status rather than wrapping onto a second line.
 *
 * At the ends PREV and NEXT stay in place and in the tab order, announced as
 * unavailable with `aria-disabled` rather than vanishing from it with `disabled`.
 *
 * ```tsx
 * <Pagination totalPages={20} currentPage={page} onPageChange={setPage} />
 * <Pagination totalPages={20} currentPage={7} getPageHref={(p) => `/blog/page/${p}`} />
 * ```
 */
export const Pagination = forwardRef<HTMLDivElement, PaginationProps>(function Pagination(
  { totalPages, currentPage, onPageChange, getPageHref, className = '', ...props },
  ref,
) {
  // Normalised once, and everything below derives from it: the list, the end
  // controls and the compact status. Clamping only the list left PREV asking
  // for page 9 of 3 when a filter shrank `totalPages` under the caller.
  const current = Math.min(Math.max(currentPage, 1), totalPages);
  const hasPrev = current > 1;
  const hasNext = current < totalPages;
  const prevPageNum = current - 1;
  const nextPageNum = current + 1;
  const items = paginationRange(totalPages, current);

  const go = (page: number) => {
    if (onPageChange) onPageChange(page);
  };

  /*
   * An end with nowhere to go. A button in both modes — a link with no
   * destination is not a link — and `aria-disabled` rather than `disabled`, so
   * it stays focusable and a screen reader meets it and hears that it is
   * unavailable instead of finding it missing.
   */
  const renderDisabledEnd = (label: string, text: ReactNode): ReactNode => (
    <button type="button" className={cn(disabledBtnClasses, endClasses)} aria-disabled="true" aria-label={label}>
      {text}
    </button>
  );

  const renderEnd = (
    page: number,
    rel: 'prev' | 'next',
    label: string,
    text: ReactNode,
    fill: string,
  ): ReactNode => {
    if (getPageHref) {
      return (
        <a href={getPageHref(page)} rel={rel} aria-label={label} className={cn(activeBtnClasses, endClasses, fill)}>
          {text}
        </a>
      );
    }
    return (
      <button type="button" onClick={() => go(page)} className={cn(activeBtnClasses, endClasses, fill)} aria-label={label}>
        {text}
      </button>
    );
  };

  const renderPage = (page: number): ReactNode => {
    const isCurrent = page === current;
    const label = `Page ${page}`;
    const text = isCurrent ? (
      <>
        <span aria-hidden="true">[</span>
        {page}
        <span aria-hidden="true">]</span>
      </>
    ) : (
      page
    );
    const className = isCurrent ? currentPageClasses : pageClasses;

    if (getPageHref) {
      return (
        <a
          href={getPageHref(page)}
          aria-label={label}
          aria-current={isCurrent ? 'page' : undefined}
          className={className}
          data-slot="pagination-page"
        >
          {text}
        </a>
      );
    }
    return (
      <button
        type="button"
        onClick={isCurrent ? undefined : () => go(page)}
        aria-label={label}
        aria-current={isCurrent ? 'page' : undefined}
        className={className}
        data-slot="pagination-page"
      >
        {text}
      </button>
    );
  };

  return (
    <div
      ref={ref}
      data-slot="pagination"
      className={cn('pt-6 pb-8 space-y-2 md:space-y-5', className)}
      {...props}
    >
      <nav data-slot="pagination-nav" className="flex justify-between items-center gap-4 font-mono" aria-label="Pagination Navigation">
        {hasPrev
          ? renderEnd(prevPageNum, 'prev', 'Previous Page', <>&lt;&lt; PREV</>, 'bg-accent-primary')
          : renderDisabledEnd('Previous Page', <>&lt;&lt; PREV</>)}
        <span data-slot="pagination-status" className="md:hidden whitespace-nowrap text-content-primary font-bold border-2 border-edge-strong px-3 py-3 bg-surface-base">
          [ {current} / {totalPages} ]
        </span>
        <ul data-slot="pagination-list" className="hidden md:flex items-center gap-2">
          {items.map((item) =>
            typeof item === 'number' ? (
              <li key={item}>{renderPage(item)}</li>
            ) : (
              <li key={item} aria-hidden="true" data-slot="pagination-ellipsis" className="min-w-11 px-2 py-3 text-center font-bold text-content-primary">
                ...
              </li>
            ),
          )}
        </ul>
        {hasNext
          ? renderEnd(nextPageNum, 'next', 'Next Page', <>NEXT &gt;&gt;</>, 'bg-accent-tertiary')
          : renderDisabledEnd('Next Page', <>NEXT &gt;&gt;</>)}
      </nav>
    </div>
  );
});
