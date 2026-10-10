import type { ReactNode } from 'react';
import * as React from 'react';
import { cn } from '../../../lib/recipe';

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

/** Row reference for an index — drawing-sheet convention skips I and O, which read as 1 and 0. */
function sheetRowLabel(index: number): string {
  const letter = LETTERS[index % LETTERS.length] ?? 'A';
  return index < LETTERS.length ? letter : `${letter}${Math.floor(index / LETTERS.length) + 1}`;
}

export interface DrawingSheetProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Grid references across the top edge, numbered from 1. `0` hides the top ruler. */
  columns?: number;
  /** Grid references down the left edge, lettered from A. `0` hides the side ruler. */
  rows?: number;
  /** Sheet content, usually one or more `SheetSection`s. */
  children?: ReactNode;
  /** Additional classes for the root. */
  className?: string;
}

/**
 * An engineering drawing sheet: a hard border with numbered columns along the top and lettered
 * rows down the side, so a review can point at "B2" rather than "the second box on the left".
 *
 * The references divide the sheet evenly and are decorative — they are hidden from assistive
 * technology, which navigates by the sections' headings instead.
 */
export const DrawingSheet = React.forwardRef<HTMLDivElement, DrawingSheetProps>(function DrawingSheet({ columns = 4, rows = 3, children, className, ...rest }, ref) {
  const top = Math.max(0, Math.floor(columns));
  const side = Math.max(0, Math.floor(rows));
  return (
    <div
      ref={ref}
      {...rest}
      data-slot="drawing-sheet"
      className={cn(
        'grid w-full border-2 border-edge-strong bg-surface-base text-content-primary',
        side > 0 ? 'grid-cols-[1.75rem_minmax(0,1fr)]' : 'grid-cols-[minmax(0,1fr)]',
        top > 0 ? 'grid-rows-[auto_1fr]' : 'grid-rows-[1fr]',
        className,
      )}
    >
      {top > 0 && side > 0 ? <span aria-hidden="true" className="border-b-2 border-r-2 border-edge-strong" /> : null}
      {top > 0 ? (
        <div aria-hidden="true" data-slot="drawing-sheet-columns" className="flex select-none border-b-2 border-edge-strong font-mono text-xs text-content-muted">
          {Array.from({ length: top }, (_, index) => (
            <span key={index} className={cn('flex-1 py-1 text-center', index > 0 && 'border-l border-edge-default')}>
              {index + 1}
            </span>
          ))}
        </div>
      ) : null}
      {side > 0 ? (
        <div aria-hidden="true" data-slot="drawing-sheet-rows" className="flex select-none flex-col border-r-2 border-edge-strong font-mono text-xs text-content-muted">
          {Array.from({ length: side }, (_, index) => (
            <span key={index} className={cn('flex flex-1 items-center justify-center', index > 0 && 'border-t border-edge-default')}>
              {sheetRowLabel(index)}
            </span>
          ))}
        </div>
      ) : null}
      <div data-slot="drawing-sheet-body" className="flex min-w-0 flex-col gap-6 p-3 sm:p-6">
        {children}
      </div>
    </div>
  );
});

export interface SheetSectionProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /** Short reference drawn in the solid tab, such as `A` or `B2`. */
  index: ReactNode;
  /** Section heading. */
  title: ReactNode;
  /** Heading level for `title`, so the section sits correctly in the page outline. */
  headingLevel?: 2 | 3 | 4;
  /** Controls drawn at the right of the header, such as a comment button. */
  actions?: ReactNode;
  /** Section content. */
  children?: ReactNode;
  /** Additional classes for the root. */
  className?: string;
}

/**
 * One boxed, referenced section of a sheet: a solid index tab, a heading, an optional actions
 * slot, and a hard-ruled body. Works on its own or inside a `DrawingSheet`.
 */
export const SheetSection = React.forwardRef<HTMLElement, SheetSectionProps>(function SheetSection({ index, title, headingLevel = 3, actions, children, className, ...rest }, ref) {
  const headingId = React.useId();
  const Heading = `h${headingLevel}` as const;
  return (
    <section ref={ref} aria-labelledby={headingId} {...rest} data-slot="sheet-section" className={cn('flex min-w-0 flex-col border-2 border-edge-strong bg-surface-base', className)}>
      <header data-slot="sheet-section-header" className="flex items-stretch border-b-2 border-edge-strong">
        <span data-slot="sheet-section-index" className="flex min-w-12 items-center justify-center bg-content-primary px-3 font-mono text-lg font-bold text-content-inverse">
          {index}
        </span>
        <Heading id={headingId} className="m-0 flex flex-1 items-center px-4 py-3 font-display text-xl font-bold text-content-primary">
          {title}
        </Heading>
        {actions != null ? <div data-slot="sheet-section-actions" className="flex items-center gap-2 px-3">{actions}</div> : null}
      </header>
      <div data-slot="sheet-section-body" className="min-w-0 p-4 sm:p-6">
        {children}
      </div>
    </section>
  );
});
