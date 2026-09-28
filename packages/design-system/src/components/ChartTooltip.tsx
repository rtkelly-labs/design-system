'use client';

import { TooltipWithBounds, useTooltip } from '@visx/tooltip';
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/recipe';
import type { AccentToken } from '../lib/theme';
import { Card } from './Card';

export { useTooltip as useChartTooltip };

export interface ChartTooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  accent?: AccentToken;
  top?: number;
  left?: number;
  children: ReactNode;
}

/**
 * Themed container for chart inspection overlays.
 *
 * Renders an elevated card with brutalist borders and hard shadows
 * to display data point details on hover or focus without obscuring context.
 */
export const ChartTooltip = forwardRef<HTMLDivElement, ChartTooltipProps>(
  function ChartTooltip(
    { title, accent = 'primary', top, left, children, className, ...props },
    ref,
  ) {
    const content = (
      <div
        ref={ref}
        data-slot="chart-tooltip"
        className={cn('pointer-events-none inline-block align-top', className)}
        {...props}
      >
        <Card
          variant="panel"
          accent={accent}
          className={cn('min-w-32 p-2.5 font-mono text-xs shadow-hard-sm', className)}
        >
          {title && (
            <div
              data-slot="chart-tooltip-title"
              className="mb-1 border-b border-edge-subtle pb-1 font-bold uppercase tracking-wider text-content-muted"
            >
              [ {title} ]
            </div>
          )}
          <div data-slot="chart-tooltip-body" className="space-y-0.5 text-content-primary">
            {children}
          </div>
        </Card>
      </div>
    );

    if (top !== undefined && left !== undefined) {
      return (
        <TooltipWithBounds top={top} left={left} unstyled>
          {content}
        </TooltipWithBounds>
      );
    }

    return content;
  },
);

ChartTooltip.displayName = 'ChartTooltip';
