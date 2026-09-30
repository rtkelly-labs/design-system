import { ArrowRight, Check, Lock } from 'lucide-react';
import { type CSSProperties, forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../lib/recipe';

export type TrackItemStatus = 'completed' | 'current' | 'upcoming';

export interface TrackItem {
  /** Unique milestone identifier. */
  id: string;
  /** Formatted numerical index (e.g. "01", "02"). */
  number: string;
  /** Milestone title. */
  title: string;
  /** Estimated duration or word count (e.g. "15 min"). */
  duration?: string;
  /** Current completion status. */
  status: TrackItemStatus;
  /** Destination link for available milestone articles. */
  href?: string;
  /** Optional summary or key topic description. */
  summary?: string;
}

export interface TrackCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Track sequence identifier (e.g. "01" or "02"). */
  trackNumber: string | number;
  /** Curriculum or series title (e.g. "DISTRIBUTED LOG ARCHITECTURES"). */
  title: string;
  /** Short curriculum or learning path summary. */
  description?: string;
  /** Ordered list of milestones in the series. */
  items: TrackItem[];
}

/**
 * Multi-part curriculum and learning track card.
 *
 * Implements structured learning navigation with brutalist segmented progress bars,
 * numbered milestones, and hover-elevated task item rows with hard offset shadows.
 *
 * @example
 * ```tsx
 * <TrackCard
 *   trackNumber="01"
 *   title="MINI-KAFKA ENGINE"
 *   description="A comprehensive deep-dive into append-only commit logs."
 *   items={[
 *     { id: '1', number: '01', title: 'Segment Storage', status: 'completed' },
 *     { id: '2', number: '02', title: 'Index Memory Maps', status: 'current' },
 *   ]}
 * />
 * ```
 */
export const TrackCard = forwardRef<HTMLDivElement, TrackCardProps>(
  function TrackCard(
    {
      trackNumber,
      title,
      description,
      items,
      className,
      ...props
    },
    ref,
  ) {
    const completedCount = items.filter((i) => i.status === 'completed').length;
    const totalCount = items.length;
    const progressPct =
      totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const progressStyle: CSSProperties = { width: `${progressPct}%` };

    return (
      <div
        ref={ref}
        data-slot="track-card"
        className={cn(
          'border-2 border-edge-strong bg-surface-base font-mono text-content-primary shadow-hard-lg',
          className,
        )}
        {...props}
      >
        {/* Top Track Header Bar */}
        <div
          data-slot="track-card-header"
          className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-edge-strong bg-surface-raised px-4 py-3"
        >
          <div className="flex items-center gap-2.5">
            <span
              data-slot="track-card-badge"
              className="px-2 py-0.5 text-xs font-black bg-accent-primary text-content-inverse"
            >
              TRACK {trackNumber}
            </span>
            <span
              data-slot="track-card-title"
              className="text-xs font-bold text-content-secondary tracking-wider"
            >
              {'// '}
              {title}
            </span>
          </div>
          <div
            data-slot="track-card-stats"
            className="text-xs font-bold text-content-muted"
          >
            {completedCount}/{totalCount} COMPLETED ({progressPct}%)
          </div>
        </div>

        {/* Description & Progress Section */}
        <div
          data-slot="track-card-summary"
          className="border-b-2 border-edge-strong bg-surface-raised/40 p-4 space-y-3"
        >
          {description && (
            <p
              data-slot="track-card-description"
              className="font-sans text-sm text-content-secondary leading-relaxed"
            >
              {description}
            </p>
          )}

          {/* Brutalist Progress Bar */}
          <div className="space-y-1">
            <div
              data-slot="track-card-progress-bar"
              className="h-3 w-full border border-edge-strong bg-surface-base p-0.5"
            >
              <div
                data-slot="track-card-progress-fill"
                className="h-full bg-intent-success transition-all duration-500 ease-out"
                style={progressStyle}
              />
            </div>
            <div className="flex justify-between text-[10px] text-content-muted font-bold uppercase">
              <span>0% START</span>
              <span>TARGET: COMPLETE {totalCount} UNITS</span>
              <span>100% READY</span>
            </div>
          </div>
        </div>

        {/* Track Milestones / Item Rows */}
        <div
          data-slot="track-card-items"
          className="divide-y divide-edge-subtle p-2 space-y-2"
        >
          {items.map((item) => {
            const isCompleted = item.status === 'completed';
            const isCurrent = item.status === 'current';
            const isUpcoming = item.status === 'upcoming';

            const content = (
              <div
                data-slot="track-card-item-row"
                className={cn(
                  'group flex items-center justify-between gap-4 p-3 border border-edge-subtle transition-all duration-150',
                  isCurrent
                    ? 'bg-surface-raised border-accent-primary shadow-hard-sm'
                    : isCompleted
                      ? 'bg-surface-raised/80 hover:bg-surface-raised'
                      : 'bg-surface-base border-dashed hover:bg-surface-raised/40',
                  'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm',
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Index / Status Icon */}
                  <div
                    data-slot="track-card-item-icon"
                    className={cn(
                      'w-6 h-6 shrink-0 flex items-center justify-center font-bold text-xs border',
                      isCompleted
                        ? 'bg-intent-success border-intent-success text-content-inverse'
                        : isCurrent
                          ? 'bg-accent-primary border-accent-primary text-content-inverse'
                          : 'border-edge-default text-content-muted',
                    )}
                  >
                    {isCompleted ? (
                      <Check size={14} strokeWidth={3} />
                    ) : isUpcoming ? (
                      <Lock size={12} strokeWidth={2} />
                    ) : (
                      item.number
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'text-xs font-bold truncate',
                          isCurrent
                            ? 'text-content-primary'
                            : isCompleted
                              ? 'text-content-secondary'
                              : 'text-content-muted',
                        )}
                      >
                        {item.title}
                      </span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 text-[9px] font-black bg-accent-secondary text-content-inverse uppercase tracking-wider">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    {item.summary && (
                      <p className="font-sans text-xs text-content-muted line-clamp-1 mt-0.5">
                        {item.summary}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {item.duration && (
                    <span className="text-[11px] text-content-muted font-bold">
                      {item.duration}
                    </span>
                  )}
                  {item.href ? (
                    <ArrowRight
                      size={14}
                      className="text-content-muted group-hover:text-accent-primary group-hover:translate-x-0.5 transition-all"
                    />
                  ) : (
                    <span className="text-[10px] text-content-muted font-bold">
                      COMING SOON
                    </span>
                  )}
                </div>
              </div>
            );

            if (item.href) {
              return (
                <a
                  key={item.id}
                  href={item.href}
                  className="block no-underline"
                >
                  {content}
                </a>
              );
            }

            return <div key={item.id}>{content}</div>;
          })}
        </div>
      </div>
    );
  },
);

TrackCard.displayName = 'TrackCard';
