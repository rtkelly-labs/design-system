import { forwardRef, useId } from 'react';
import type { HTMLAttributes } from 'react';
import { recipe } from '../lib/recipe';
import { accentTextClass } from '../lib/accentClasses';
import type { AccentToken } from '../lib/theme';

/**
 * The quadrant: a square edged in `border.subtle` with one quarter drawn in the
 * accent, stepping clockwise round its four positions, one `considered` each
 * (`DESIGN.md` §8). It jumps rather than turns: motion steps, it does not
 * glide, which is the time-domain form of zero radius. The box never changes
 * size, so nothing beside it moves.
 *
 * **The drawing varies by Level; the clock does not** (ADR 0007). On
 * `midnight` the quarter is a lit cell, a block cursor on a CRT. On `sketch` it
 * is hatched in pen with 45° section lines over the square, which reads as a
 * 2H construction line: a solid blue cell on paper is the midnight drawing with
 * the lights turned up. Both drawings are in the markup and the `sketch:`
 * variant shows one, so a nested provider draws its own Level. Box, strokes,
 * steps and period are identical on both, and no prop chooses between them.
 */
const spinner = recipe({
  slots: {
    root: 'inline-flex items-center justify-center align-middle',
    // The square. Its accent is a *text* colour so the quarter can be
    // `currentColor`: one accent map, eight roles, no second table.
    mark: 'relative block flex-none border-edge-subtle',
    /*
     * `motion-reduce:animate-ds-step-slow`, not `motion-reduce:animate-none`.
     *
     * A spinner that has stopped is indistinguishable from a page that has
     * hung, and `prefers-reduced-motion` asks for less vestibular load, not for
     * less information. A quarter jumping inside a 12px box translates nothing
     * across the viewport; what the preference gets is a third of the speed.
     * `Skeleton` is the component where the preference removes the motion
     * outright, because there the motion carries nothing.
     */
    quarter: 'absolute top-0 left-0 block size-1/2',
    cell: 'block size-full bg-current sketch:hidden',
    hatch: 'hidden size-full sketch:block',
  },
  variants: {
    // DESIGN.md §8: one live mark per region. The rest hold the first frame,
    // so a still spinner carries no animation class at all.
    still: {
      false: { quarter: 'animate-ds-step motion-reduce:animate-ds-step-slow' },
      true: { quarter: '' },
    },
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
   * Hold the first frame instead of stepping. Motion is a budget of one live
   * mark per region (`DESIGN.md` §8): a group header steps, and the rows inside
   * it hold still, so their elapsed time is what moves. Default false.
   */
  still?: boolean;
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
  { label = 'Loading', size = 'md', accent = 'primary', still = false, className, ...props },
  ref,
) {
  const styles = spinner({ size, still });
  const hatch = useId();

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
        // Through the recipe's `class` slot rather than appended, so a caller
        // who reaches the mark through `className` still wins the conflict.
        className={styles.mark({
          // `current` is for a spinner on a fill (a pending Button): `edge-subtle`
          // is as light as the quarter there and the mark reads as one flat
          // box, so the square is the text colour at low alpha instead.
          class: accent === 'current' ? 'border-current/30' : accentTextClass(accent),
        })}
      >
        <span data-slot="spinner-quarter" className={styles.quarter()}>
          <span className={styles.cell()} />
          {/*
           * Section hatching, drawn rather than faked with a gradient: a pattern
           * of 45° pen lines inside a pen outline. `non-scaling-stroke` keeps
           * every line one device pixel at all three sizes.
           */}
          <svg className={styles.hatch()} viewBox="0 0 8 8" preserveAspectRatio="none" focusable="false">
            <defs>
              <pattern id={hatch} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="1" height="3" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="8" height="8" fill={`url(#${hatch})`} />
            <rect x="0.5" y="0.5" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </svg>
        </span>
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
});
