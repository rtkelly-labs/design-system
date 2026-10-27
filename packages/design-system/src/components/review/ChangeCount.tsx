import * as React from 'react';
import { cn } from '../../lib/recipe';

export interface ChangeCountProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Lines or records added. */
  added: number;
  /** Lines or records removed. */
  removed: number;
  /** Lines or records moved or renamed. Printed only when given. */
  moved?: number;
  /**
   * The thing counted, for the spoken form, singular then plural: `['line', 'lines']` reads
   * "1 line added, 50 lines removed".
   */
  noun?: readonly [one: string, other: string];
  /** Additional classes for the count. */
  className?: string;
}

/**
 * The size of a change as `+77 −50`, in the `delta` roles.
 *
 * Change, not meaning: the added count is green because it was added, not because adding is
 * good. Screen readers hear the words rather than the signs.
 */
export const ChangeCount = React.forwardRef<HTMLSpanElement, ChangeCountProps>(function ChangeCount(
  { added, removed, moved, noun, className, ...rest },
  ref,
) {
  const say = (count: number, verb: string) => (noun ? `${count} ${count === 1 ? noun[0] : noun[1]} ${verb}` : `${count} ${verb}`);
  const spoken = [say(added, 'added'), say(removed, 'removed'), ...(moved != null ? [say(moved, 'moved')] : [])].join(', ');
  return (
    <span ref={ref} data-slot="change-count" {...rest} className={cn('inline-flex gap-2 whitespace-nowrap font-mono text-sm tabular-nums', className)}>
      <span aria-hidden="true" className="text-delta-added">+{added}</span>
      <span aria-hidden="true" className="text-delta-removed">−{removed}</span>
      {moved != null ? <span aria-hidden="true" className="text-delta-moved">→{moved}</span> : null}
      <span className="sr-only">{spoken}</span>
    </span>
  );
});
