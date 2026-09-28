import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { recipe } from '../lib/recipe';
import { accentTextClass } from '../lib/accentClasses';
import type { AccentToken } from '../lib/theme';

/**
 * A square that turns. No radius, no arc, no gradient — the mark is the border
 * of a box with one edge picked out in the accent, which is the same treatment
 * `Card` and `Button` give an edge and the only rotation in the package.
 *
 * `border-t-current` rather than a second accent map: the accent is already on
 * the element as a colour, so the leading edge inherits it and the eight roles
 * stay one table in `accentClasses`. `border-edge-subtle` is the rest of the
 * box, so the mark reads as a ring at rest rather than as three missing sides.
 */
const spinner = recipe({
  slots: {
    root: 'inline-flex items-center justify-center align-middle',
    /*
     * `motion-reduce:animate-ds-spin-slow`, not `motion-reduce:animate-none`.
     *
     * A spinner that has stopped is indistinguishable from a page that has
     * hung, and `prefers-reduced-motion` asks for less vestibular load, not for
     * less information. A rotation this small translates nothing across the
     * viewport; what the preference gets is a third of the angular speed.
     * `Skeleton` is the component where the preference removes the motion
     * outright, because there the motion carries nothing.
     */
    mark: 'block animate-ds-spin border-edge-subtle border-t-current motion-reduce:animate-ds-spin-slow',
  },
  variants: {
    /** Stroke scales with the box: a 4px border on a 12px square is a blob. */
    size: {
      sm: { mark: 'size-3 border-2' },
      md: { mark: 'size-5 border-2' },
      lg: { mark: 'size-8 border-4' },
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export interface SpinnerProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'className'> {
  /**
   * What is being waited for, as a screen reader hears it — "Loading results",
   * not "Loading". It is rendered for assistive technology only, so it may be
   * longer than anything that would fit beside the mark, and it is the whole
   * reason this component exists rather than a rotating `div`.
   */
  label?: string;
  /**
   * `sm` sits inside a control's line box, `md` beside a sentence, `lg` alone
   * in an empty panel. Anything larger is a `Skeleton`: past a point the honest
   * thing to show is the shape of the content, not that work is happening.
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Semantic colour for the leading edge. Accepts an `Emphasis`
   * (`primary`…`quiet`) or an `Intent` (`info`/`success`/`warning`/`danger`).
   *
   * `current` takes the ink of whatever the spinner sits in, for a spinner
   * inside a control: on a filled `Button` every accent is either the fill
   * itself or a clash with it, and the button's own text colour is the one
   * already measured against that fill.
   */
  accent?: AccentToken | 'current';
  /**
   * Merged onto the wrapper, which is what positions the spinner. The mark
   * itself is sized by `size`.
   */
  className?: string;
}

/**
 * Indeterminate activity in a small space — a control that is working, a panel
 * that is fetching, a form mid-submit.
 *
 * Reach for it when the wait is short and its length is unknown. When the shape
 * of what is arriving is known, `Skeleton` says more; when the fraction done is
 * known, `Progress` says more still. A spinner is the weakest of the three
 * claims: *something is happening*.
 *
 * ## It announces itself
 *
 * The wrapper is `role="status"` and carries a visually hidden `label`, so the
 * wait is spoken rather than merely drawn. A spinner announced as nothing is a
 * spinner a screen reader user sits through in silence, and `role="status"` is
 * a polite live region — it interrupts nothing, and it is read when the region
 * appears. That is why the label lives in the DOM as text rather than as an
 * `aria-label` on an empty element: text in a live region is announced on
 * insertion, and an attribute on an empty node is not reliably.
 *
 * The mark itself is `aria-hidden`. It is the same fact twice otherwise, once
 * as a name and once as an unlabelled box.
 */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { label = 'Loading', size = 'md', accent = 'primary', className, ...props },
  ref,
) {
  const styles = spinner({ size });

  return (
    <span
      ref={ref}
      // `role="status"` rather than `role="progressbar"`: nothing here has a
      // value, and a progressbar with no `aria-valuenow` is a control that
      // reports an unknown position rather than a region that reports activity.
      role="status"
      data-slot="spinner"
      className={styles.root({ class: className })}
      {...props}
    >
      <span
        aria-hidden="true"
        data-slot="spinner-mark"
        // The accent is a *text* colour so the leading edge can be
        // `border-t-current`. One map, eight roles, no second table to drift.
        // Through the recipe's `class` slot rather than appended, so a caller
        // who reaches the mark through `className` still wins the conflict.
        className={styles.mark({
          class: accent === 'current' ? undefined : accentTextClass(accent),
        })}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
});
