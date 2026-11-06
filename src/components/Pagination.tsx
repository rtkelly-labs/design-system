import type { ReactNode } from 'react';
import { cn } from '../lib/recipe';

export interface PaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange?: (page: number) => void;
  getPageHref?: (page: number) => string;
  className?: string;
}

export function Pagination({
  totalPages,
  currentPage,
  onPageChange,
  getPageHref,
  className = '',
}: PaginationProps) {
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;
  const prevPageNum = currentPage - 1;
  const nextPageNum = currentPage + 1;

  const handlePrevClick = () => {
    if (hasPrev && onPageChange) {
      onPageChange(prevPageNum);
    }
  };

  const handleNextClick = () => {
    if (hasNext && onPageChange) {
      onPageChange(nextPageNum);
    }
  };

  const activeBtnClasses =
    'border-2 border-edge-strong text-content-inverse px-6 py-3 font-bold uppercase shadow-hard-md hover:shadow-hard-lg active:translate-x-1 active:translate-y-1 active:shadow-none transition-all';
  const disabledBtnClasses =
    'cursor-not-allowed opacity-50 border-2 border-edge-strong bg-surface-raised text-content-primary px-6 py-3 font-bold uppercase';

  const renderPrevButton = (): ReactNode => {
    if (!hasPrev) {
      return (
        <button className={disabledBtnClasses} disabled aria-label="Previous Page">
          &lt;&lt; PREV
        </button>
      );
    }

    if (getPageHref) {
      return (
        <a href={getPageHref(prevPageNum)} className={cn(activeBtnClasses, 'bg-accent-primary')}>
          &lt;&lt; PREV
        </a>
      );
    }

    return (
      <button
        onClick={handlePrevClick}
        className={cn(activeBtnClasses, 'bg-accent-primary')}
        aria-label="Previous Page"
      >
        &lt;&lt; PREV
      </button>
    );
  };

  const renderNextButton = (): ReactNode => {
    if (!hasNext) {
      return (
        <button className={disabledBtnClasses} disabled aria-label="Next Page">
          NEXT &gt;&gt;
        </button>
      );
    }

    if (getPageHref) {
      return (
        <a href={getPageHref(nextPageNum)} className={cn(activeBtnClasses, 'bg-accent-tertiary')}>
          NEXT &gt;&gt;
        </a>
      );
    }

    return (
      <button
        onClick={handleNextClick}
        className={cn(activeBtnClasses, 'bg-accent-tertiary')}
        aria-label="Next Page"
      >
        NEXT &gt;&gt;
      </button>
    );
  };

  return (
    <div data-slot="pagination" className={cn('pt-6 pb-8 space-y-2 md:space-y-5', className)}>
      <nav data-slot="pagination-nav" className="flex justify-between items-center font-mono" aria-label="Pagination Navigation">
        {renderPrevButton()}
        <span data-slot="pagination-status" className="text-content-primary font-bold border-2 border-edge-strong px-6 py-3 bg-surface-base">
          [ {currentPage} / {totalPages} ]
        </span>
        {renderNextButton()}
      </nav>
    </div>
  );
}
