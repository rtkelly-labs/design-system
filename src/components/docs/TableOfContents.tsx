import { useCallback, useMemo } from 'react';
import type { MouseEvent } from 'react';
import { useActiveHeading } from '../../hooks/useActiveHeading';
import { cn } from '../../lib/recipe';

export interface TocEntry {
  /** Anchor id, without the leading `#`. */
  id: string;
  title: string;
  /** Heading level, 1–6. */
  depth: number;
}

export interface TableOfContentsProps {
  /** Flat, document-ordered heading list. Nesting is derived from `depth`. */
  toc: readonly TocEntry[];
  /** Shallowest heading level to include. Defaults to 2 — `h1` is the page title. */
  fromDepth?: number;
  /** Deepest heading level to include. Defaults to 3. */
  toDepth?: number;
  /** Heading above the list. Pass `null` to omit it. */
  label?: string | null;
  /** Disable scroll-spy — useful in Storybook and other non-scrolling frames. */
  spy?: boolean;
  className?: string;
}

/**
 * Right-rail contents list with scroll-spy.
 *
 * Anchor clicks are intercepted so the hash lands in the address bar via
 * `replaceState` instead of `pushState`: scrubbing a long page through the
 * contents list would otherwise stack a history entry per section and turn the
 * browser back button into a section-by-section rewind.
 */
export function TableOfContents({
  toc,
  fromDepth = 2,
  toDepth = 3,
  label = 'ON THIS PAGE',
  spy = true,
  className = '',
}: TableOfContentsProps) {
  const visible = useMemo(
    () => toc.filter((e) => e.depth >= fromDepth && e.depth <= toDepth),
    [toc, fromDepth, toDepth],
  );

  const ids = useMemo(() => visible.map((e) => e.id), [visible]);
  const active = useActiveHeading(ids, { enabled: spy });

  const onClick = useCallback((event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();

    const target = document.getElementById(id);
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth' });
    window.history.replaceState(null, '', `#${id}`);

    // scrollIntoView does not move focus, so a keyboard user would stay
    // parked in the contents list. Focus the heading without a second scroll.
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }, []);

  if (visible.length === 0) return null;

  return (
    <nav className={cn('not-prose', className)} aria-label="Table of contents">
      {label && <p className="docs-toc-label">[ {label} ]</p>}
      <ul className="docs-toc-list">
        {visible.map((entry) => (
          <li
            key={entry.id}
            style={{ paddingLeft: `${(entry.depth - fromDepth) * 0.75}rem` }}
          >
            <a
              href={`#${entry.id}`}
              onClick={(event) => onClick(event, entry.id)}
              className="docs-toc-link"
              data-active={active === entry.id ? 'true' : undefined}
              {...(active === entry.id ? { 'aria-current': 'location' as const } : {})}
            >
              {entry.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Build a {@link TocEntry} list by reading headings out of the rendered DOM.
 *
 * Use when the content pipeline does not already hand you a TOC (a build-time
 * `remark` plugin is cheaper and works during SSR). Headings without an `id`
 * are skipped rather than assigned one — a generated id here would not match
 * the anchors elsewhere on the page.
 */
export function collectHeadings(
  container: ParentNode | null | undefined,
  selector = 'h2, h3, h4',
): TocEntry[] {
  if (!container) return [];

  return Array.from(container.querySelectorAll<HTMLHeadingElement>(selector))
    .filter((el) => el.id)
    .map((el) => ({
      id: el.id,
      title: el.textContent?.replace(/COPY LINK|COPIED/g, '').trim() ?? '',
      depth: Number(el.tagName.slice(1)),
    }));
}
