import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '../lib/recipe';
import type { SeriesIndex } from '../lib/theme';
import { SERIES_LETTERS, SERIES_SHAPES } from './seriesMarks';
import { SeriesShape } from './seriesShape';

export { SERIES_LETTERS, SERIES_SHAPES } from './seriesMarks';
export type { SeriesShapeName } from './seriesMarks';

// Written out in full, one per member, because Tailwind's scanner reads source
// text: `bg-series-${n}` would generate no CSS at all.
const SERIES_CHIP: Record<SeriesIndex, string> = {
  1: 'bg-series-1',
  2: 'bg-series-2',
  3: 'bg-series-3',
  4: 'bg-series-4',
  5: 'bg-series-5',
  6: 'bg-series-6',
};

export interface SeriesMarkProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Which series member, 1 to 6. Picks the colour, the shape and the letter. */
  series: SeriesIndex;
  /**
   * Draw the colour chip. On by default; turn it off where the surrounding
   * element is already that colour, or is coloured by something else and the
   * mark is only there to carry the shape.
   */
  swatch?: boolean;
  /** Replace the letter, when the series already has a code the reader sees elsewhere (a calendar's `W`). */
  letter?: string;
}

/**
 * A categorical series key: a colour chip, and — only when the reader has asked
 * for it — a shape and a letter.
 *
 * The shape and letter are in the markup always and hidden by the stylesheet
 * until `data-a11y-cvd="patterns"` is on the document, so there is no state to
 * read, no flash, and nothing to hydrate. They are redundancy and never the only
 * cue: pair every mark with the series' name in text (a legend, a direct label),
 * because WCAG 1.4.1 asks for a non-colour cue that is there by default, and a
 * preference that has to be found first does not meet it. {@link SeriesLegend}
 * does the pairing.
 *
 * The whole mark is `aria-hidden`: it repeats what the adjacent text says.
 */
export const SeriesMark = forwardRef<HTMLSpanElement, SeriesMarkProps>(function SeriesMark(
  { series, swatch = true, letter, className, ...props },
  ref,
) {
  const index = series - 1;
  return (
    <span
      ref={ref}
      data-slot="series-mark"
      aria-hidden="true"
      className={cn('inline-flex shrink-0 items-center gap-1 whitespace-nowrap align-middle leading-none', className)}
      {...props}
    >
      {swatch ? <span className={cn('inline-block size-3 shrink-0', SERIES_CHIP[series])} /> : null}
      <span data-slot="series-glyph" className="items-center gap-1 font-mono text-[11px] font-bold leading-none">
        <svg viewBox="0 0 10 10" className="inline-block size-3 shrink-0 align-middle" fill="currentColor">
          <SeriesShape shape={SERIES_SHAPES[index]!} />
        </svg>
        <span className="align-middle">{letter ?? SERIES_LETTERS[index]}</span>
      </span>
    </span>
  );
});

SeriesMark.displayName = 'SeriesMark';

export interface SeriesLegendItem {
  /** The series' name, in text. Always shown: it is the cue that does not depend on a preference. */
  label: string;
  /** Which series member, 1 to 6. */
  series: SeriesIndex;
  /** Passed to {@link SeriesMark}. */
  letter?: string;
}

export interface SeriesLegendProps extends Omit<HTMLAttributes<HTMLUListElement>, 'children'> {
  /** One entry per series: its name in text and which member it is. */
  items: readonly SeriesLegendItem[];
}

/**
 * A legend for a categorical chart: each series' {@link SeriesMark} beside its
 * name in text. The names are what satisfy WCAG 1.4.1 by default; the mark's
 * shape and letter are what the `patterns` preference adds on top.
 */
export const SeriesLegend = forwardRef<HTMLUListElement, SeriesLegendProps>(function SeriesLegend(
  { items, className, ...props },
  ref,
) {
  return (
    <ul
      ref={ref}
      data-slot="series-legend"
      className={cn(
        'm-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 font-mono text-xs text-content-primary',
        className,
      )}
      {...props}
    >
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <SeriesMark series={item.series} letter={item.letter} />
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
});

SeriesLegend.displayName = 'SeriesLegend';
