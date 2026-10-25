'use client';

import type React from 'react';
import { LEVELS, DEFAULT_LEVEL } from '../theme/levels';
import type { Polarity } from '../theme/levels';
import { useOptionalTheme } from './ThemeProvider';
import { cn } from '../lib/recipe';

/**
 * A rule drawn in characters rather than pixels.
 *
 * The glyph is part of the design, and it is not the same glyph on every level.
 * The dark end of the ladder leans on terminal devices — scanlines, `>`
 * prompts, `//====//` rules. The light end is paper, where the equivalent
 * device is a hand-ruled pencil dash. Same component, same role, different
 * mark.
 *
 * ## Why this exists as its own component
 *
 * That behaviour used to live in the *consumer's* stylesheet, as
 * `.sketch .ascii-divider::after { content: "· ─ ─ ·" }` in the blog, overriding
 * a `::after` in the design system. Three things were wrong with that:
 *
 *   - The design intent — "this rule is drawn differently on paper" — was
 *     stated in a downstream repo, so the system did not actually own its own
 *     divider.
 *   - It keyed off `.sketch`, a level name that no longer exists. Anything
 *     built that way silently stops matching when the ladder changes, because
 *     a selector that matches nothing fails quietly.
 *   - It forced the design system to keep a bare `.ascii-divider` class as a
 *     styling hook purely so a pseudo-element had something to attach to,
 *     which was the last hole in the styling-lives-in-TSX rule.
 *
 * Encoding it here closes all three: the mapping is a `Record<Polarity, …>`, so
 * it is exhaustive by type, and the glyph is real text rather than generated
 * content — which means it is selectable, searchable, and readable by a screen
 * reader if it ever needed to be (it is `aria-hidden`, being decoration).
 */

/** Which mark to draw. `auto` follows the current level's polarity. */
export type DividerVariant = 'auto' | 'terminal' | 'pencil';

/**
 * The mark each polarity draws.
 *
 * A `Record<Polarity, …>` rather than a conditional, for the same reason the
 * rest of the ladder is: a third polarity would be a compile error here rather
 * than a silent fallthrough.
 */
export const DIVIDER_PATTERNS: Readonly<Record<Polarity, string>> = {
  dark: '//====================================================//',
  light: '· ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ·',
};

/**
 * The same marks, as a start cap, a repeating fill and an end cap, so a rule can run the full
 * width of its container instead of stopping where a fixed string happens to end.
 *
 * `step` is the fill unit's length in characters and `caps` the two caps' total; both feed the
 * width calculation below, so a mark changed here must change its numbers with it.
 */
export const DIVIDER_MARKS: Readonly<Record<Polarity, { start: string; fill: string; end: string }>> = {
  dark: { start: '//', fill: '=', end: '//' },
  light: { start: '·', fill: ' ─', end: ' ·' },
};

/**
 * The fill's width: the container less the caps, rounded **down to a whole fill unit**, so the
 * last glyph is never cut in half and the end cap sits flush against the fill. One character's
 * advance is `1ch` plus the `0.2em` tracking. CSS `round()` does the arithmetic with no script, so
 * the rule also fills a static `ds-report` page; a browser without `round()` drops the width and
 * the fill is simply clipped, which is how every divider behaved before.
 *
 * Written out per polarity, not built from the numbers: Tailwind reads class names from source
 * text, and a template literal emits no CSS.
 */
const FILL_WIDTH: Readonly<Record<Polarity, string>> = {
  dark: '[width:round(down,calc(100%_-_4*(1ch_+_0.2em)),calc(1ch_+_0.2em))]',
  light: '[width:round(down,calc(100%_-_3*(1ch_+_0.2em)),calc(2*(1ch_+_0.2em)))]',
};

/** Enough fill for a 4K-wide container; the width above trims it to the container. */
const FILL_REPEAT = 400;

const VARIANT_POLARITY: Readonly<Record<Exclude<DividerVariant, 'auto'>, Polarity>> = {
  terminal: 'dark',
  pencil: 'light',
};

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Which mark to draw. Defaults to `auto`, which follows the level's declared
   * polarity — terminal on `midnight`/`dim`, pencil on `bright`/`white`.
   */
  variant?: DividerVariant;
  /** An explicit mark, overriding both the variant and the level. */
  pattern?: string;
}

export const Divider: React.FC<DividerProps> = ({
  variant = 'auto',
  pattern,
  className = '',
  ...props
}) => {
  // Optional on purpose: a divider must still draw something sensible in a
  // story with no decorator, or under a consumer that sets `data-theme` on the
  // document and never mounts a provider.
  const theme = useOptionalTheme();
  const polarity =
    variant === 'auto'
      ? (theme?.polarity ?? LEVELS[DEFAULT_LEVEL].polarity)
      : VARIANT_POLARITY[variant];

  const base = 'font-mono text-accent-primary tracking-[0.2em] select-none my-6 overflow-hidden whitespace-nowrap';

  // An explicit pattern is drawn as given and clipped, as it always was.
  if (pattern != null) {
    return (
      <div data-slot="divider" className={cn(base, className)} aria-hidden="true" {...props}>
        {pattern}
      </div>
    );
  }

  // Clipped, not truncated: an ellipsis on a rule reads as a broken string. The mark is
  // decoration, so `aria-hidden` keeps it out of the accessibility tree.
  const mark = DIVIDER_MARKS[polarity];
  return (
    <div data-slot="divider" className={cn(base, 'flex', className)} aria-hidden="true" {...props}>
      <span className="shrink-0">{mark.start}</span>
      <span data-slot="divider-fill" className={cn('min-w-0 overflow-hidden', FILL_WIDTH[polarity])}>
        {mark.fill.repeat(FILL_REPEAT)}
      </span>
      <span className="shrink-0">{mark.end}</span>
    </div>
  );
};
