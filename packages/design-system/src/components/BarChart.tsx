'use client';

import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridColumns, GridRows } from '@visx/grid';
import { Group } from '@visx/group';
import { ParentSize } from '@visx/responsive';
import { scaleBand, scaleLinear } from '@visx/scale';
import { Bar } from '@visx/shape';
import {
  type ForwardedRef,
  forwardRef,
  type KeyboardEvent,
  type SVGProps,
  useRef,
  useState,
} from 'react';
import { cn } from '../lib/recipe';
import { type AccentToken, accentVar } from '../lib/theme';

export { ParentSize as ResponsiveChartContainer };

export interface BarChartDatum {
  label: string;
  value: number;
  accent?: AccentToken;
}

export interface BarChartProps extends Omit<SVGProps<SVGSVGElement>, 'data'> {
  /** Categorical data points with labels and numeric values. */
  data: BarChartDatum[];
  /** SVG coordinate width (default 500). */
  width?: number;
  /** SVG coordinate height (default 260). */
  height?: number;
  /** Whether chart width dynamically tracks parent container width (default false). */
  responsive?: boolean;
  /** Bar layout orientation (default 'vertical'). */
  orientation?: 'vertical' | 'horizontal';
  /** Default accent token applied to bars without their own accent (default 'primary'). */
  accent?: AccentToken;
  /** Whether to render background coordinate grid lines (default true). */
  showGrid?: boolean;
  /** Whether to render numeric value labels beside or above bars (default true). */
  showValues?: boolean;
  /** Custom fallback message when dataset is empty (default 'NO DATA'). */
  emptyMessage?: string;
  /** Screen reader accessibility label. */
  ariaLabel?: string;
  /** Inset padding between outer canvas and plotting coordinates. */
  margin?: { top: number; right: number; bottom: number; left: number };
  /**
   * Makes the bars interactive. Each bar becomes a button named "LABEL: VALUE":
   * the chart is one tab stop, ←/→ (or ↑/↓, Home, End) move between bars and
   * Enter or Space calls this. Without it the bars are a picture, with no
   * pointer cursor or hover change.
   */
  onBarClick?: (datum: BarChartDatum, index: number) => void;
}

const DEFAULT_VERTICAL_MARGIN = { top: 28, right: 24, bottom: 44, left: 48 };
const DEFAULT_HORIZONTAL_MARGIN = { top: 20, right: 48, bottom: 36, left: 80 };

/** The focus ring an interactive bar draws, matching LatencyHeatmap's chart. */
const INTERACTIVE_BAR =
  'cursor-pointer hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary';

interface InternalCanvasProps extends Omit<BarChartProps, 'responsive'> {
  svgRef?: ForwardedRef<SVGSVGElement>;
}

function BarChartCanvas({
  data,
  width = 500,
  height = 260,
  orientation = 'vertical',
  accent = 'primary',
  showGrid = true,
  showValues = true,
  emptyMessage = 'NO DATA',
  ariaLabel,
  margin: customMargin,
  onBarClick,
  className,
  svgRef,
  ...props
}: InternalCanvasProps) {
  // Roving tabindex: one bar is the tab stop, the arrows move it.
  const [active, setActive] = useState(0);
  const bars = useRef<(SVGRectElement | null)[]>([]);
  const interactive = onBarClick !== undefined;

  const isHorizontal = orientation === 'horizontal';
  const margin =
    customMargin ?? (isHorizontal ? DEFAULT_HORIZONTAL_MARGIN : DEFAULT_VERTICAL_MARGIN);

  const xMax = Math.max(0, width - margin.left - margin.right);
  const yMax = Math.max(0, height - margin.top - margin.bottom);

  if (!data || data.length === 0) {
    return (
      <svg
        ref={svgRef}
        data-slot="barchart"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel ?? 'Empty chart'}
        className={cn(
          'w-full max-w-full overflow-visible border-2 border-edge-strong bg-surface-base',
          className,
        )}
        {...props}
      >
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--ds-text-muted)"
          fontFamily="var(--ds-font-mono)"
          fontSize={12}
          fontWeight="bold"
        >
          [ {emptyMessage} ]
        </text>
      </svg>
    );
  }

  const values = data.map((d) => d.value);
  const maxValue = Math.max(1, ...values);

  const categoryScale = scaleBand<string>({
    domain: data.map((d) => d.label),
    range: isHorizontal ? [0, yMax] : [0, xMax],
    padding: 0.3,
  });

  const stop = Math.min(active, data.length - 1);
  const moveTo = (index: number) => {
    setActive(index);
    bars.current[index]?.focus();
  };
  const onBarKeyDown = (event: KeyboardEvent<SVGRectElement>, index: number) => {
    const last = data.length - 1;
    let next: number | null = null;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = Math.min(last, index + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = Math.max(0, index - 1);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = last;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        onBarClick?.(data[index], index);
        return;
      default:
        return;
    }
    event.preventDefault();
    moveTo(next);
  };
  const barProps = (d: BarChartDatum, index: number) =>
    interactive
      ? {
          innerRef: (el: SVGRectElement | null) => {
            bars.current[index] = el;
          },
          role: 'button',
          tabIndex: index === stop ? 0 : -1,
          'aria-label': `${d.label}: ${d.value}`,
          className: INTERACTIVE_BAR,
          onClick: () => {
            setActive(index);
            onBarClick(d, index);
          },
          onKeyDown: (event: KeyboardEvent<SVGRectElement>) => onBarKeyDown(event, index),
        }
      : {};

  const valueScale = scaleLinear<number>({
    domain: [0, maxValue],
    range: isHorizontal ? [0, xMax] : [yMax, 0],
    nice: true,
  });

  return (
    <svg
      ref={svgRef}
      data-slot="barchart"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      // A picture until the bars take input; then a group of buttons, since an
      // `img` hides its children from assistive technology.
      role={interactive ? 'group' : 'img'}
      aria-label={ariaLabel ?? `Bar chart with ${data.length} categories`}
      className={cn(
        'w-full max-w-full overflow-visible border-2 border-edge-strong bg-surface-base',
        className,
      )}
      {...props}
    >
      <Group left={margin.left} top={margin.top}>
        {showGrid &&
          (isHorizontal ? (
            <GridColumns
              scale={valueScale}
              height={yMax}
              stroke="var(--ds-border-subtle)"
              strokeWidth={1}
            />
          ) : (
            <GridRows
              scale={valueScale}
              width={xMax}
              stroke="var(--ds-border-subtle)"
              strokeWidth={1}
            />
          ))}

        {data.map((d, index) => {
          const barAccent = d.accent ?? accent;
          const fillColor = accentVar(barAccent);

          if (isHorizontal) {
            const barY = categoryScale(d.label) ?? 0;
            const barHeight = categoryScale.bandwidth();
            const barWidth = Math.max(0, valueScale(d.value));

            return (
              <Group key={`bar-h-${d.label}-${index}`}>
                <Bar
                  x={0}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  fill={fillColor}
                  stroke="var(--ds-border-strong)"
                  strokeWidth={2}
                  {...barProps(d, index)}
                />
                {showValues && (
                  <text
                    x={barWidth + 6}
                    y={barY + barHeight / 2}
                    dominantBaseline="central"
                    fill="var(--ds-text-primary)"
                    fontFamily="var(--ds-font-mono)"
                    fontSize={11}
                    fontWeight="bold"
                  >
                    {d.value}
                  </text>
                )}
              </Group>
            );
          }

          const barX = categoryScale(d.label) ?? 0;
          const barWidth = categoryScale.bandwidth();
          const barHeight = Math.max(0, yMax - (valueScale(d.value) ?? 0));
          const barY = yMax - barHeight;

          return (
            <Group key={`bar-v-${d.label}-${index}`}>
              <Bar
                x={barX}
                y={barY}
                width={barWidth}
                height={barHeight}
                fill={fillColor}
                stroke="var(--ds-border-strong)"
                strokeWidth={2}
                {...barProps(d, index)}
              />
              {showValues && (
                <text
                  x={barX + barWidth / 2}
                  y={barY - 6}
                  textAnchor="middle"
                  fill="var(--ds-text-primary)"
                  fontFamily="var(--ds-font-mono)"
                  fontSize={11}
                  fontWeight="bold"
                >
                  {d.value}
                </text>
              )}
            </Group>
          );
        })}

        {isHorizontal ? (
          <>
            <AxisLeft
              scale={categoryScale}
              stroke="var(--ds-border-strong)"
              strokeWidth={2}
              tickStroke="var(--ds-border-strong)"
              tickLength={4}
              tickLabelProps={{
                fill: 'var(--ds-text-secondary)',
                fontFamily: 'var(--ds-font-mono)',
                fontSize: 11,
                textAnchor: 'end',
                dominantBaseline: 'central',
                dx: '-0.25em',
              }}
            />
            <AxisBottom
              top={yMax}
              scale={valueScale}
              stroke="var(--ds-border-strong)"
              strokeWidth={2}
              tickStroke="var(--ds-border-strong)"
              tickLength={4}
              tickLabelProps={{
                fill: 'var(--ds-text-secondary)',
                fontFamily: 'var(--ds-font-mono)',
                fontSize: 10,
                textAnchor: 'middle',
                dominantBaseline: 'hanging',
                dy: '0.25em',
              }}
            />
          </>
        ) : (
          <>
            <AxisBottom
              top={yMax}
              scale={categoryScale}
              stroke="var(--ds-border-strong)"
              strokeWidth={2}
              tickStroke="var(--ds-border-strong)"
              tickLength={4}
              tickLabelProps={{
                fill: 'var(--ds-text-secondary)',
                fontFamily: 'var(--ds-font-mono)',
                fontSize: 11,
                textAnchor: 'middle',
                dominantBaseline: 'hanging',
                dy: '0.25em',
              }}
            />
            <AxisLeft
              scale={valueScale}
              stroke="var(--ds-border-strong)"
              strokeWidth={2}
              tickStroke="var(--ds-border-strong)"
              tickLength={4}
              tickLabelProps={{
                fill: 'var(--ds-text-secondary)',
                fontFamily: 'var(--ds-font-mono)',
                fontSize: 10,
                textAnchor: 'end',
                dominantBaseline: 'central',
                dx: '-0.25em',
              }}
            />
          </>
        )}
      </Group>
    </svg>
  );
}

/**
 * Brutalist categorical bar chart built with Visx primitives.
 *
 * Emits high-contrast, deterministic SVG geometry with 2px borders, theme-driven fills,
 * and monospace axis coordinates. Supports vertical and horizontal layouts and
 * responds dynamically to theme ladder swaps without canvas re-renders.
 */
export const BarChart = forwardRef<SVGSVGElement, BarChartProps>(function BarChart(
  { responsive = false, ...props },
  ref,
) {
  if (responsive) {
    return (
      // ParentSize fills 100% of its parent's height, which is zero in an
      // auto-height parent, and clips the chart (#306). Give it the chart's own.
      <ParentSize
        className={cn('w-full', props.className)}
        parentSizeStyles={{ width: '100%', height: props.height ?? 260 }}
      >
        {({ width: parentWidth }) => (
          <BarChartCanvas
            {...props}
            width={parentWidth > 0 ? parentWidth : (props.width ?? 500)}
            svgRef={ref}
          />
        )}
      </ParentSize>
    );
  }

  return <BarChartCanvas {...props} svgRef={ref} />;
});

BarChart.displayName = 'BarChart';
