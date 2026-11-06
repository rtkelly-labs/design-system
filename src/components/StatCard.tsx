import type { ElementType } from 'react';
import { accentHoverEdgeClass, accentTextClass } from '../lib/accentClasses';
import { cn } from '../lib/recipe';
import type { AccentToken } from '../lib/theme';

/**
 * Accepted accents. Widened from the four palette names to the full role set;
 * the old names still resolve to the same roles, so existing call sites keep
 * rendering identically.
 */
export type StatCardAccent = AccentToken;

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
  icon?: ElementType<{ className?: string }>;
  accent?: StatCardAccent;
  className?: string;
}

/**
 * A change is meaning, not decoration, so it reads from the intent roles rather
 * than the card's accent — a card accented `danger` still shows a rise in the
 * success colour.
 */
const CHANGE_CLASS: Record<NonNullable<StatCardProps['changeType']>, string> = {
  positive: 'text-intent-success',
  negative: 'text-intent-danger',
  neutral: 'text-content-muted',
};

export function StatCard({
  title,
  value,
  change,
  changeType = 'positive',
  subtitle,
  icon: Icon,
  accent = 'primary',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-surface-raised border-2 border-edge-strong p-6 transition-all duration-200',
        accentHoverEdgeClass(accent),
        className,
      )}
    >
      <div data-slot="statcard-header" className="flex justify-between items-start mb-2">
        <span data-slot="statcard-label" className="font-mono text-xs font-bold uppercase tracking-wider text-content-muted">
          [ {title} ]
        </span>
        {Icon && <Icon className={cn('h-6 w-6', accentTextClass(accent))} />}
      </div>
      <div data-slot="statcard-value-row" className="flex items-baseline gap-3 my-1">
        <span data-slot="statcard-value" className="font-display text-4xl font-extrabold text-content-primary tracking-tight">
          {value}
        </span>
        {change && (
          <span data-slot="statcard-change" className={cn('font-mono text-xs font-bold', CHANGE_CLASS[changeType])}>
            {change}
          </span>
        )}
      </div>
      {subtitle && (
        <p data-slot="statcard-detail" className="font-mono text-xs text-content-muted mt-2">
          &gt; {subtitle}
        </p>
      )}
    </div>
  );
}
