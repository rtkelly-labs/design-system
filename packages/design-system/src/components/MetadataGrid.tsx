import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/recipe';

export interface MetadataGridSeries {
  /** Series title or name. */
  name: string;
  /** Current part index (e.g. 2). */
  part?: number;
  /** Total parts in the series (e.g. 5). */
  totalParts?: number;
  /** Optional destination link for the series catalog. */
  href?: string;
}

export interface MetadataGridCustomItem {
  /** Column category label (e.g. "STATUS", "AUTHOR"). */
  label: string;
  /** Primary cell content. */
  value: ReactNode;
  /** Optional link destination for the value. */
  href?: string;
}

export interface MetadataGridProps extends HTMLAttributes<HTMLDivElement> {
  /** Publication date string (e.g. "2026-09-14" or "September 14, 2026"). */
  published?: string;
  /** Estimated reading time or word count (e.g. "12 MIN READ" or "~3,400 WORDS"). */
  readTime?: string;
  /** Optional series context (e.g. { name: "DISTRIBUTED // PART 02", part: 2, totalParts: 5 }). */
  series?: MetadataGridSeries;
  /** List of topic or technology tags. */
  tags?: string[];
  /** Arbitrary custom cells to override or augment standard editorial cells. */
  items?: MetadataGridCustomItem[];
}

/**
 * High-density 4-column brutalist metadata grid.
 *
 * Formats frontmatter, series hierarchy, and article taxonomy into a structured
 * key/value matrix. Features hard cell borders, monospace category headers, and
 * responsive 2-to-4 column reflow.
 *
 * @example
 * ```tsx
 * <MetadataGrid
 *   published="SEPTEMBER 16, 2026"
 *   readTime="14 MIN READ"
 *   series={{ name: "DISTRIBUTED SYSTEMS", part: 2, totalParts: 4 }}
 *   tags={["rust", "consensus", "raft"]}
 * />
 * ```
 */
export const MetadataGrid = forwardRef<HTMLDivElement, MetadataGridProps>(
  function MetadataGrid(
    {
      published,
      readTime,
      series,
      tags,
      items,
      className,
      ...props
    },
    ref,
  ) {
    return (
      <div
        ref={ref}
        data-slot="metadata-grid"
        className={cn(
          'grid grid-cols-2 md:grid-cols-4 border-2 border-edge-strong bg-surface-base font-mono text-xs text-content-primary divide-y-2 md:divide-y-0 md:divide-x-2 divide-edge-strong shadow-hard-sm',
          className,
        )}
        {...props}
      >
        {items ? (
          items.map((item, idx) => (
            <div
              key={`grid-custom-${idx}`}
              data-slot="metadata-grid-cell"
              className="p-3.5 flex flex-col justify-between hover:bg-surface-raised transition-colors"
            >
              <span
                data-slot="metadata-grid-label"
                className="text-[10px] font-black uppercase text-content-muted tracking-wider mb-1"
              >
                [ {item.label} ]
              </span>
              {item.href ? (
                <a
                  href={item.href}
                  className="text-xs font-bold text-accent-secondary hover:underline truncate"
                >
                  {item.value}
                </a>
              ) : (
                <span className="text-xs font-bold text-content-primary tracking-wide">
                  {item.value}
                </span>
              )}
            </div>
          ))
        ) : (
          <>
            {/* 1. PUBLISHED */}
            <div
              data-slot="metadata-grid-cell"
              className="p-3.5 flex flex-col justify-between hover:bg-surface-raised transition-colors"
            >
              <span
                data-slot="metadata-grid-label"
                className="text-[10px] font-black uppercase text-content-muted tracking-wider mb-1"
              >
                [ PUBLISHED ]
              </span>
              <span
                data-slot="metadata-grid-value"
                className="text-xs font-bold text-content-primary tracking-wide"
              >
                {published ?? '—'}
              </span>
            </div>

            {/* 2. READ TIME */}
            <div
              data-slot="metadata-grid-cell"
              className="p-3.5 flex flex-col justify-between hover:bg-surface-raised transition-colors"
            >
              <span
                data-slot="metadata-grid-label"
                className="text-[10px] font-black uppercase text-content-muted tracking-wider mb-1"
              >
                [ READ TIME ]
              </span>
              <span
                data-slot="metadata-grid-value"
                className="text-xs font-bold text-accent-primary tracking-wide"
              >
                {readTime ?? '—'}
              </span>
            </div>

            {/* 3. SERIES */}
            <div
              data-slot="metadata-grid-cell"
              className="p-3.5 flex flex-col justify-between hover:bg-surface-raised transition-colors"
            >
              <span
                data-slot="metadata-grid-label"
                className="text-[10px] font-black uppercase text-content-muted tracking-wider mb-1"
              >
                [ SERIES TRACK ]
              </span>
              {series ? (
                series.href ? (
                  <a
                    href={series.href}
                    className="text-xs font-bold text-accent-secondary hover:underline truncate"
                    title={series.name}
                  >
                    {series.name}
                    {series.part !== undefined &&
                      ` (${series.part}/${series.totalParts ?? '?'})`}
                  </a>
                ) : (
                  <span
                    className="text-xs font-bold text-accent-secondary truncate"
                    title={series.name}
                  >
                    {series.name}
                    {series.part !== undefined &&
                      ` (${series.part}/${series.totalParts ?? '?'})`}
                  </span>
                )
              ) : (
                <span className="text-xs font-bold text-content-muted">
                  STANDALONE
                </span>
              )}
            </div>

            {/* 4. TAGS */}
            <div
              data-slot="metadata-grid-cell"
              className="p-3.5 flex flex-col justify-between hover:bg-surface-raised transition-colors"
            >
              <span
                data-slot="metadata-grid-label"
                className="text-[10px] font-black uppercase text-content-muted tracking-wider mb-1"
              >
                [ TOPICS ]
              </span>
              {tags && tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-0.5">
                  {tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 text-[10px] font-bold bg-surface-sunken text-content-secondary border border-edge-subtle hover:border-accent-primary hover:text-accent-primary transition-colors"
                    >
                      #{tag.toUpperCase()}
                    </span>
                  ))}
                  {tags.length > 3 && (
                    <span className="text-[10px] font-bold text-content-muted self-center">
                      +{tags.length - 3}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs font-bold text-content-muted">—</span>
              )}
            </div>
          </>
        )}
      </div>
    );
  },
);

MetadataGrid.displayName = 'MetadataGrid';
