import * as React from 'react';
import { cn } from '../../lib/recipe';
import { STATUS_TONE_TEXT, statusAppearance, type StatusVocabularies, type StatusVocabulary } from './vocabulary';

type StatusMarkOwnProps = {
  [V in StatusVocabulary]: {
    /** Which document's words this status is from. */
    vocabulary: V;
    /** The status itself. The glyph, word and colour all follow from it. */
    status: StatusVocabularies[V];
  };
}[StatusVocabulary];

export type StatusMarkProps = StatusMarkOwnProps &
  Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> & {
    /** Replaces the printed word, for a translated page. The glyph and colour stay. */
    label?: string;
    /** Additional classes for the mark. */
    className?: string;
  };

/**
 * One status from a review's closed vocabularies — an Assessment outcome, a Delta or Evidence
 * status, or a Baseline's trust — drawn as a fixed glyph and word in a hairline mark — light enough to sit in a table cell
 * or a list row many times over.
 *
 * The colour repeats what the word says and never replaces it: `inconclusive`, `missing` and
 * `unavailable` share one dashed, muted treatment and are told apart by their words.
 */
export const StatusMark = React.forwardRef<HTMLSpanElement, StatusMarkProps>(function StatusMark(
  { vocabulary, status, label, className, ...rest },
  ref,
) {
  const look = statusAppearance(vocabulary, status as never);
  return (
    <span
      ref={ref}
      data-slot="status-mark"
      data-vocabulary={vocabulary}
      data-status={status}
      {...rest}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap border border-current px-1.5 py-0.5 font-mono text-xs font-bold uppercase leading-none tracking-wider',
        look.tone === 'hollow' && 'border-dashed',
        STATUS_TONE_TEXT[look.tone],
        className,
      )}
    >
      <span aria-hidden="true">{look.glyph}</span>
      <span>{label ?? look.word}</span>
    </span>
  );
});
