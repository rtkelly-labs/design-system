import type { ReactNode } from 'react';
import * as React from 'react';
import { cn } from '../../lib/recipe';
import { STATUS_TONE_TEXT, statusAppearance, type AssessmentOutcome } from './vocabulary';

export interface VerdictBandProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The Assessment's outcome, or `none` when the report carries no Assessment. */
  outcome: AssessmentOutcome;
  /** One line stating the result, read before anything else on the page. */
  title: ReactNode;
  /** One line of context under it: what was assessed, or how to get a verdict. */
  children?: ReactNode;
  /** Replaces the printed outcome word, for a translated page. */
  label?: string;
  /** Additional classes for the band. */
  className?: string;
}

/**
 * The verdict, first: one outcome word in a bordered mark, one line saying what it means, one
 * line of context. Sits above the provenance, the figures and everything else in a report, and
 * is the one object in the review family drawn with a strong border and an offset shadow —
 * everything around it steps down to hairlines so the verdict is the thing that stands up.
 *
 * `none` is a state of its own rather than an absence. A report built from a comparison with no
 * policy applied carries no verdict, and says so instead of leaving the reader to infer it from
 * a missing banner.
 */
export const VerdictBand = React.forwardRef<HTMLDivElement, VerdictBandProps>(function VerdictBand(
  { outcome, title, children, label, className, ...rest },
  ref,
) {
  const look = statusAppearance('outcome', outcome);
  return (
    <div
      ref={ref}
      role="status"
      data-slot="verdict-band"
      data-outcome={outcome}
      {...rest}
      className={cn(
        'grid grid-cols-1 items-center gap-x-4 gap-y-1 border-2 border-edge-strong bg-surface-raised p-4 shadow-hard-md sm:grid-cols-[auto_minmax(0,1fr)]',
        className,
      )}
    >
      <span
        data-slot="verdict-band-outcome"
        className={cn(
          'inline-flex w-fit items-center gap-2 whitespace-nowrap border-2 border-current px-3 py-2 font-mono text-sm font-bold uppercase leading-none tracking-widest sm:row-span-2',
          look.tone === 'hollow' && 'border-dashed',
          STATUS_TONE_TEXT[look.tone],
        )}
      >
        <span aria-hidden="true">{look.glyph}</span>
        <span>{label ?? look.word}</span>
      </span>
      <p data-slot="verdict-band-title" className="m-0 font-semibold text-content-primary">
        {title}
      </p>
      {children != null ? (
        <p data-slot="verdict-band-context" className="m-0 text-sm text-content-secondary">
          {children}
        </p>
      ) : null}
    </div>
  );
});
