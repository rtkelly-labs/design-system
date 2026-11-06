import { useCallback, useMemo } from 'react';
import type { HTMLAttributes, MouseEvent, ReactNode } from 'react';
import { Check, Link2 } from 'lucide-react';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { childrenToText, slugify } from '../../lib/slug';
import { HEADING_EMPHASIS, accentVar } from '../../lib/theme';
import type { AccentToken } from '../../lib/theme';
import { cn } from '../../lib/recipe';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface AnchorHeadingProps
  extends Omit<HTMLAttributes<HTMLHeadingElement>, 'id'> {
  level: HeadingLevel;
  children: ReactNode;
  /**
   * Explicit anchor id. Prefer passing this — build-time sluggers
   * (`rehype-slug`) deduplicate repeated headings across the whole document,
   * which a per-heading component cannot see. Omit it only for one-off headings
   * outside a compiled MDX page.
   */
  id?: string;
  /** Hide the copy-link affordance (e.g. a page title that is not a section). */
  anchor?: boolean;
  /**
   * Emphasis of the anchor affordance. Defaults to the level's place in
   * {@link HEADING_EMPHASIS}, so colour hierarchy tracks document hierarchy
   * without every heading restating it.
   */
  emphasis?: AccentToken;
}

/**
 * A section heading that owns its own anchor.
 *
 * Every heading gets a stable `#slug` id so any section is directly linkable,
 * and the trailing affordance copies the *absolute* url including that hash —
 * the thing people actually want to paste into a ticket or a chat. Clicking
 * also updates `location.hash` via `history.replaceState`, so the address bar
 * agrees with what was copied without pushing a history entry per click.
 *
 * `scroll-margin-top` is applied through the `docs-anchor-heading` class in
 * `prose.css` rather than inline, so a sticky header can retune the offset by
 * setting `--docs-header-height` without this component re-rendering.
 */
export function AnchorHeading({
  level,
  children,
  id,
  anchor = true,
  emphasis,
  className = '',
  ...rest
}: AnchorHeadingProps) {
  const Tag = `h${level}` as const;
  const { copied, copy } = useCopyToClipboard();

  const headingId = useMemo(
    () => id ?? slugify(childrenToText(children)),
    [id, children],
  );

  const onCopyLink = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      // Let modified clicks behave like a normal link (new tab, download, …).
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();

      const url =
        typeof window === 'undefined'
          ? `#${headingId}`
          : `${window.location.origin}${window.location.pathname}${window.location.search}#${headingId}`;

      void copy(url);

      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', `#${headingId}`);
        document.getElementById(headingId)?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    [copy, headingId],
  );

  const color = accentVar(emphasis, HEADING_EMPHASIS[level]);

  return (
    <Tag
      id={headingId}
      className={cn('docs-anchor-heading group', className)}
      {...rest}
    >
      {children}
      {anchor && (
        <a
          href={`#${headingId}`}
          onClick={onCopyLink}
          className="docs-anchor-link"
          style={{ color }}
          aria-label={copied ? 'Link copied' : 'Copy link to this section'}
          title={copied ? 'Copied!' : 'Copy link to this section'}
        >
          {copied ? (
            <>
              <Check size={14} aria-hidden="true" />
              <span>COPIED</span>
            </>
          ) : (
            <>
              <Link2 size={14} aria-hidden="true" />
              <span>COPY LINK</span>
            </>
          )}
        </a>
      )}
    </Tag>
  );
}

/**
 * Factory for the `h1`–`h6` entries of an MDX component map. The compiled MDX
 * supplies `id` (from `rehype-slug`) and `children`; everything else is fixed
 * per level.
 */
export function createAnchorHeading(level: HeadingLevel) {
  const Heading = ({ children, id, ...rest }: HTMLAttributes<HTMLHeadingElement>) => (
    <AnchorHeading level={level} id={id} {...rest}>
      {children}
    </AnchorHeading>
  );
  Heading.displayName = `AnchorHeading${level}`;
  return Heading;
}
