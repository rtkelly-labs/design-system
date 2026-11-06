import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '../lib/recipe';

/**
 * Draws a colour and names it.
 *
 * This existed as a private `Swatch` inside `SemanticTokens.stories.tsx` —
 * declared there, exported nowhere, and therefore unavailable to the two places
 * that most need it: the docs portal, which #74 notes demonstrates chrome and
 * never the package's own integration, and the blog's design sandbox.
 *
 * A design system that cannot draw its own palette outside a story file is
 * asking every consumer to reimplement the one drawing it definitely owns.
 *
 * The story version used two dozen lines of inline `style` objects, which is the
 * third idiom #47 is about and is unreachable by a consumer's `className`. This
 * is utilities throughout.
 */
export interface SwatchProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  /** The colour to draw. Any CSS colour — usually a `var(--ds-*)` read. */
  value: string;
  /** What the colour is called. Rendered in mono beside the well. */
  name: string;
  /** Optional second line — a contrast ratio, a hex, a note. */
  detail?: string;
  /** `md` is the reference grid; `sm` suits a dense inline list. */
  size?: 'sm' | 'md';
}

export const Swatch = forwardRef<HTMLDivElement, SwatchProps>(function Swatch(
  { value, name, detail, size = 'md', className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-slot="swatch"
      className={cn('flex items-center gap-3 font-mono', className)}
      {...props}
    >
      <span
        data-slot="swatch-well"
        aria-hidden="true"
        className={cn(
          'flex-none border-2 border-edge-strong',
          size === 'sm' ? 'h-6 w-6' : 'h-10 w-10',
        )}
        style={{ backgroundColor: value }}
      />
      <span data-slot="swatch-label" className="flex min-w-0 flex-col">
        <span className="truncate text-xs text-content-secondary">{name}</span>
        {detail && <span className="truncate text-xs text-content-muted">{detail}</span>}
      </span>
    </div>
  );
});

export interface SwatchGroupProps extends HTMLAttributes<HTMLElement> {
  /** Bracketed and uppercased, matching the rest of the system's headings. */
  title: string;
  /** Name → colour. Insertion order is preserved, so declare it meaningfully. */
  entries: Record<string, string>;
  size?: SwatchProps['size'];
}

/**
 * A titled block of swatches.
 *
 * `entries` is a record rather than an array because every caller has one to
 * hand — `LEVELS[level].accent`, `semanticTokens.text`, a `palette` — and
 * turning it into an array at each call site is the kind of ceremony that gets
 * copy-pasted wrong.
 */
export const SwatchGroup = forwardRef<HTMLElement, SwatchGroupProps>(function SwatchGroup(
  { title, entries, size, className, ...props },
  ref,
) {
  return (
    <section ref={ref} data-slot="swatch-group" className={cn('mb-8', className)} {...props}>
      <h3
        data-slot="swatch-group-title"
        className="mb-3 font-display text-xs font-extrabold uppercase tracking-widest text-accent-secondary"
      >
        [ {title} ]
      </h3>
      <div data-slot="swatch-group-items" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(entries).map(([name, value]) => (
          <Swatch key={name} name={name} value={value} size={size} />
        ))}
      </div>
    </section>
  );
});
