'use client';

import { Search } from 'lucide-react';
import { useSearch } from './Search';

/** Opens the search dialog; the same dialog ⌘K and `/` open from anywhere. */
export function SearchButton() {
  const search = useSearch();
  return (
    <button
      type="button"
      onClick={search.open}
      aria-label="Search documentation"
      className="inline-flex min-h-11 cursor-pointer items-center gap-2 border-2 border-edge-strong bg-surface-base px-3 font-mono text-xs font-bold uppercase tracking-wider text-content-secondary hover:text-accent-primary"
    >
      <Search size={15} aria-hidden="true" />
      <span className="hidden sm:inline">Search</span>
      <kbd className="hidden border border-edge-default px-1.5 py-0.5 text-[0.65rem] sm:inline">⌘K</kbd>
    </button>
  );
}
