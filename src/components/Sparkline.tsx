import { AreaClosed, LinePath } from '@visx/shape';
import { scaleLinear } from '@visx/scale';
import { forwardRef, type SVGProps } from 'react';
import { cn } from '../lib/recipe';
import { type AccentToken, accentVar } from '../lib/theme';

export interface SparklineProps extends Omit<SVGProps<SVGSVGElement>, 'data'> {
  /** Ordered series of numerical values to plot across the trend line. */
  data: number[];
  /** Display width in pixels or coordinate units (default 120). */
  width?: number;
  /** Display height in pixels or coordinate units (default 32). */
  height?: number;
  /** Role accent controlling line stroke and area wash (default 'primary'). */
  accent?: AccentToken;
  /** Whether to render a semi-transparent area fill beneath the trend line (default true). */
  showArea?: boolean;
  /** Screen reader accessibility label. */
  ariaLabel?: string;
}

/**
 * Compact brutalist metric trend indicator.
 *
 * Renders an inline, unopinionated linear SVG trend line with an optional area wash.
 * Engineered for data density inside StatCards, table cells, and summary badges
 * without axis decoration or DOM layout overhead.
 */
export const Sparkline = forwardRef<SVGSVGElement, SparklineProps>(function Sparkline(
  {
    data,
    width = 120,
    height = 32,
    accent = 'primary',
    showArea = true,
    ariaLabel,
    className,
    ...props
  },
  ref,
) {
  const strokeColor = accentVar(accent);

  if (!data || data.length === 0) {
    return (
      <svg
        ref={ref}
        data-slot="sparkline"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel ?? 'Empty sparkline'}
        className={cn('inline-block overflow-visible', className)}
        {...props}
      >
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="var(--ds-border-subtle)"
          strokeWidth={1}
          strokeDasharray="2 2"
        />
      </svg>
    );
  }

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const padding = 2;

  const xScale = scaleLinear<number>({
    domain: [0, Math.max(1, data.length - 1)],
    range: [padding, width - padding],
  });

  const yScale = scaleLinear<number>({
    domain: minVal === maxVal ? [minVal - 1, maxVal + 1] : [minVal, maxVal],
    range: [height - padding, padding],
  });

  return (
    <svg
      ref={ref}
      data-slot="sparkline"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel ?? `Trend from ${data[0]} to ${data[data.length - 1]}`}
      className={cn('inline-block overflow-visible', className)}
      {...props}
    >
      {showArea && data.length > 1 && (
        <AreaClosed
          data={data}
          x={(_, i) => xScale(i) ?? 0}
          y={(d) => yScale(d) ?? 0}
          yScale={yScale}
          fill={strokeColor}
          fillOpacity={0.12}
        />
      )}

      <LinePath
        data={data}
        x={(_, i) => xScale(i) ?? 0}
        y={(d) => yScale(d) ?? 0}
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
});

Sparkline.displayName = 'Sparkline';
