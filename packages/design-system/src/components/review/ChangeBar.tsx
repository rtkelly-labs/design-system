import * as React from 'react';
import { cn } from '../../lib/recipe';

export interface ChangeBarProps extends Omit<React.SVGAttributes<SVGSVGElement>, 'children'> {
  /** Lines or records added. */
  added: number;
  /** Lines or records removed. */
  removed: number;
  /**
   * The size of a full bar. Pass the largest change in the list so sibling bars share a scale;
   * defaults to this change alone, which fills the bar.
   */
  max?: number;
  /** Accessible name. Without one the bar is decorative, and a `ChangeCount` beside it carries the figures. */
  label?: string;
  /** Additional classes for the bar. */
  className?: string;
}

/**
 * The share of a change, added then removed, on a track scaled to the largest change beside it.
 *
 * Drawn as SVG so the proportion is geometry rather than an inline style, and the fills take the
 * `delta` roles. Decorative by default: it repeats a count printed next to it.
 */
export const ChangeBar = React.forwardRef<SVGSVGElement, ChangeBarProps>(function ChangeBar(
  { added, removed, max, label, className, ...rest },
  ref,
) {
  const scale = Math.max(max ?? added + removed, 1);
  const a = Math.min((added / scale) * 100, 100);
  const d = Math.min((removed / scale) * 100, 100 - a);
  return (
    <svg
      ref={ref}
      data-slot="change-bar"
      viewBox="0 0 100 10"
      preserveAspectRatio="none"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      {...rest}
      className={cn('inline-block h-2.5 w-[4.5rem] shrink-0 border border-edge-default bg-surface-sunken align-middle', className)}
    >
      <rect data-slot="change-bar-added" x="0" y="0" width={a} height="10" className="fill-delta-added" />
      <rect data-slot="change-bar-removed" x={a} y="0" width={d} height="10" className="fill-delta-removed" />
    </svg>
  );
});
