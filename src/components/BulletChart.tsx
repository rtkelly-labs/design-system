import { Bullet as MicroBullet } from '@microcharts/react/bullet';
import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../lib/recipe';
import { type AccentToken, accentVar } from '../lib/theme';

export interface BulletChartProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'color'> {
  /** Current actual metric value. */
  value: number;
  /** Target or benchmark value to compare against. */
  target: number;
  /** Qualitative comparative range thresholds (e.g. [40, 70, 100]). */
  bands?: number[];
  /** Accent role token controlling the main value bar color (default 'primary'). */
  accent?: AccentToken;
  /** Display width in pixels (default 140). */
  width?: number;
  /** Display height in pixels (default 20). */
  height?: number;
  /** Accessible chart title. */
  title?: string;
  /** Accessible prose summary. */
  summary?: string;
  /** How to format numeric labels ('none' | 'value' | 'both'). */
  label?: 'none' | 'value' | 'both';
}

/**
 * High-density KPI benchmark comparison indicator.
 *
 * Wraps @microcharts/react Bullet to render a qualitative target-versus-actual
 * comparison. Sits cleanly inside StatCards, table cells, or dashboard summaries
 * with zero client JS runtime requirements and theme ladder token awareness.
 */
export const BulletChart = forwardRef<HTMLDivElement, BulletChartProps>(function BulletChart(
  {
    value,
    target,
    bands,
    accent = 'primary',
    width = 140,
    height = 20,
    title,
    summary,
    label = 'none',
    className,
    ...props
  },
  ref,
) {
  const barColor = accentVar(accent);

  return (
    <div
      ref={ref}
      data-slot="bullet-chart"
      className={cn('inline-flex items-center font-mono', className)}
      {...props}
    >
      <MicroBullet
        value={value}
        target={target}
        bands={bands}
        color={barColor}
        width={width}
        height={height}
        title={title}
        summary={summary}
        label={label}
        className="overflow-visible"
      />
    </div>
  );
});

BulletChart.displayName = 'BulletChart';
