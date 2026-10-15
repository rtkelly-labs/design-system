import { forwardRef } from 'react';
import type React from 'react';
import { accentVar } from '../lib/theme';
import type { AccentToken } from '../lib/theme';
import { cn } from '../lib/recipe';

/**
 * What each intent draws under the `patterns` preference, so danger and success
 * differ by more than hue: a check, a cross, a triangle and a bar, as one path
 * each in a 12px box. Inline rather than icons from a library, because every
 * consumer that renders a `Badge` pays for these whether or not it ever sees them.
 */
const INTENT_GLYPH = {
  success: 'M2 6.5l3 3 5-7',
  danger: 'M2 2l8 8M10 2l-8 8',
  warning: 'M6 1.5l5 9H1z',
  info: 'M6 3v7',
} as const;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * The label: a state, a count, a category. Short by construction: the badge
   * does not wrap, so anything long enough to need two lines is a `Tag` or
   * prose, not a badge.
   */
  children: React.ReactNode;
  /**
   * Semantic role. Accepts an `Emphasis` (`primary`…`quiet`) or an `Intent`
   * (`info`/`success`/`warning`/`danger`); the legacy palette names still
   * resolve to the same values.
   */
  accent?: AccentToken;
  /**
   * `md` is the default. `sm` is for a badge inside a dense row — a table
   * cell, a list item: a 1px border, tighter padding and a smaller type size,
   * so it stops outweighing the data beside it.
   */
  size?: 'sm' | 'md';
}

/**
 * A short, inline status marker — `STABLE`, `3 FAILING`, `DRAFT`.
 *
 * It states what something *is*, and nothing about it is interactive: no
 * click, no focus, no keyboard affordance. A badge that needs to be pressed is
 * a `Button`, and one that needs to be removed is a `Tag`.
 *
 * The accent carries the meaning, so choose it by role rather than by colour —
 * `intent.danger` for a failure, `quiet` for a neutral count. On `midnight`
 * that is pink and grey; on another level it is whatever those roles resolve
 * to, and the badge stays correct because it never names a hue.
 *
 * An intent accent also carries an icon (check, cross, triangle, info) that the
 * `patterns` preference reveals, so danger and success are told apart by more
 * than hue for a reader who has asked for that.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { children, accent = 'primary', size = 'md', className = '', style, ...props },
  ref,
) {
  const path = accent in INTENT_GLYPH ? INTENT_GLYPH[accent as keyof typeof INTENT_GLYPH] : undefined;
  const glyph = path ? (
    <svg
      viewBox="0 0 12 12"
      className={size === 'sm' ? 'size-2.5' : 'size-3'}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <path d={path} />
    </svg>
  ) : null;
  return (
    <span data-slot="badge"
      ref={ref}
      className={cn(
        'inline-flex items-center border-edge-strong bg-surface-base font-mono font-bold',
        size === 'sm'
          ? 'gap-1 border px-1.5 py-0 text-[0.65rem]'
          : 'gap-[0.4rem] border-2 px-[0.6rem] py-[0.2rem] text-[0.75rem]',
        className
      )}
      // `text-[0.75rem]` rather than `text-xs`: the named size ships a paired
      // line-height, and the class this replaced set font-size alone so the
      // badge inherited the article's unitless 1.5. Pinning any explicit
      // leading changes the line box. The accent is a runtime value, so it
      // stays an inline custom style rather than a build-time utility.
      style={{ color: accentVar(accent), ...style }}
      {...props}
    >
      {glyph ? (
        <span data-slot="intent-glyph" aria-hidden="true">
          {glyph}
        </span>
      ) : null}
      {children}
    </span>
  );
});
