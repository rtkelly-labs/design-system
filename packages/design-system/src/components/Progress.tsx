import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { Progress as BaseProgress } from '@base-ui/react/progress';
import { recipe } from '../lib/recipe';
import { accentTextClass } from '../lib/accentClasses';
import type { AccentToken } from '../lib/theme';

/**
 * A bar in a box. The track is a hard-edged well and the indicator fills it
 * from the leading edge — the same two-surface treatment `BulletChart` uses for
 * a measure against its range, so the two read as one family.
 *
 * `bg-current` on the indicator, with the accent applied as a text colour: one
 * accent table in `accentClasses` covers `Spinner`'s leading edge and this
 * fill, rather than a second map of `bg-*` classes that can disagree with it.
 */
const progress = recipe({
  slots: {
    root: 'flex w-full flex-col gap-1.5 font-mono',
    header: 'flex items-baseline justify-between gap-3',
    label: 'text-xs font-bold uppercase tracking-wider text-content-secondary',
    value: 'text-xs font-bold tabular-nums text-content-primary',
    /*
     * `overflow-hidden` is load-bearing rather than tidy: the indeterminate
     * indicator is a third of the track's width translated from `-100%` to
     * `400%`, so without it the bar sweeps out through both ends of the well.
     */
    track: 'relative h-3 w-full overflow-hidden border-2 border-edge-strong bg-surface-sunken',
    /*
     * Two states in one slot, switched by the data attributes Base UI sets on
     * every part.
     *
     * Determinate: Base UI writes the width as an inline percentage, so the
     * class only has to supply the height and the fill.
     *
     * Indeterminate: there is no width to write, so the class supplies one and
     * sweeps it. Under `prefers-reduced-motion` the sweep becomes the same
     * opacity pulse `Skeleton` uses and the bar fills the track — a *full*
     * static bar rather than a third of one, because a third of a track
     * sitting still reads as "33% done", which is a number this component does
     * not have. Pulsing says "working, amount unknown", which is what
     * `aria-valuetext` says too.
     */
    indicator:
      'h-full bg-current data-[indeterminate]:w-1/3 data-[indeterminate]:animate-ds-track '
      + 'motion-reduce:data-[indeterminate]:w-full motion-reduce:data-[indeterminate]:animate-ds-pulse',
  },
});

export interface ProgressProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'> {
  /**
   * How far along, between `0` and `max`. Pass `null` — or leave it off — when
   * the fraction is genuinely unknown: that is the indeterminate state, and it
   * is announced as such rather than as zero. A bar pinned at 0% is a claim
   * that no work has been done.
   */
  value?: number | null;
  /** The value that means finished. Defaults to 100, so a bare `value` is a percentage. */
  max?: number;
  /**
   * What is progressing — "Uploading evidence", "Rebuilding tokens". Required,
   * and required as text rather than as a boolean or an id: it is the bar's
   * accessible name, and a progress bar with no name announces a number with
   * nothing attached to it.
   */
  label: string;
  /**
   * Keep the label as the accessible name but take it off the screen, for a bar
   * sitting under a heading that already says the same thing. The name survives;
   * only the second copy of it goes.
   */
  hideLabel?: boolean;
  /**
   * Show the formatted percentage beside the label. Off by default — in a list
   * of bars the numbers compete with the bars, and the bar is the faster read.
   * Indeterminate bars render nothing here, since there is no value to show.
   */
  showValue?: boolean;
  /**
   * Semantic colour for the fill. Accepts an `Emphasis` (`primary`…`quiet`) or
   * an `Intent` (`info`/`success`/`warning`/`danger`) — `intent.success` for a
   * completing job, `intent.warning` for a quota filling up.
   */
  accent?: AccentToken;
  /** Merged onto the wrapper — the width of the whole control, label included. */
  className?: string;
}

/**
 * Determinate and indeterminate progress, on Base UI's `progress`.
 *
 * Use it when a wait has a length: a file uploading, a batch job, a quota
 * filling. When the length is unknown but the wait is short, `Spinner` says the
 * same thing in less space; when the shape of what is arriving is known,
 * `Skeleton` says more than either.
 *
 * ## Why this one takes a primitive and the other three do not
 *
 * `Spinner`, `Skeleton` and `EmptyState` are markup and tokens. This is not:
 * `role="progressbar"` has to carry `aria-valuenow`, `aria-valuemin` and
 * `aria-valuemax` that agree with the drawn width, drop `aria-valuenow`
 * entirely when indeterminate, and expose `aria-valuetext` so a screen reader
 * reads "40%" rather than "40". Hand-rolling that is where it goes wrong — most
 * often as a bar that keeps reporting a stale `aria-valuenow` while the fill
 * animates past it. `@base-ui/react/progress` owns the clamping, the
 * percentage, the formatting and the attributes, and this component owns the
 * surface.
 *
 * Nothing of Base UI's reaches the published API: the props below are this
 * package's own, and the parts are an implementation detail — one wrapper, per
 * the Base UI confinement rule.
 */
export const Progress = forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  {
    value = null,
    max = 100,
    label,
    hideLabel = false,
    showValue = false,
    accent = 'primary',
    className,
    ...props
  },
  ref,
) {
  const styles = progress();

  return (
    <BaseProgress.Root
      ref={ref}
      // `value ?? null` rather than `value`: Base UI reads `undefined` as a
      // missing required prop, and the API here treats "not passed" and
      // "explicitly unknown" as the same indeterminate state.
      value={value ?? null}
      max={max}
      data-slot="progress"
      className={styles.root({ class: className })}
      {...props}
    >
      <div data-slot="progress-header" className={styles.header()}>
        <BaseProgress.Label
          data-slot="progress-label"
          // `sr-only` rather than not rendering it: the label is what
          // `aria-labelledby` points at, so removing it removes the name.
          className={styles.label({ class: hideLabel ? 'sr-only' : undefined })}
        >
          {label}
        </BaseProgress.Label>
        {showValue && (
          <BaseProgress.Value data-slot="progress-value" className={styles.value()} />
        )}
      </div>

      <BaseProgress.Track data-slot="progress-track" className={styles.track()}>
        <BaseProgress.Indicator
          data-slot="progress-indicator"
          className={styles.indicator({ class: accentTextClass(accent) })}
        />
      </BaseProgress.Track>
    </BaseProgress.Root>
  );
});
