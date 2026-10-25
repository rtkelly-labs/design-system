import { forwardRef } from 'react';
import { cn } from '../lib/recipe';
import { severityAccent, type Severity } from '../lib/severity';
import { Badge, type BadgeProps } from './Badge';

const LABELS: Partial<Record<Severity, string>> = { warn: 'WARN', fatal: 'FATAL' };

export interface SeverityBadgeProps extends Omit<BadgeProps, 'accent' | 'children'> {
  /** A log level, an alert state or an alert severity. */
  severity: Severity;
  /** Replaces the upper-cased severity as the visible text. */
  children?: BadgeProps['children'];
}

/**
 * A `Badge` whose colour comes from a fixed observability vocabulary — log
 * levels, alert states and severities — rather than from the caller, so
 * "error" cannot be painted as a success anywhere on a page.
 */
export const SeverityBadge = forwardRef<HTMLSpanElement, SeverityBadgeProps>(function SeverityBadge(
  { severity, children, className, ...props },
  ref,
) {
  return (
    <Badge ref={ref} data-slot="severity-badge" data-severity={severity} accent={severityAccent(severity)} {...props} className={cn('whitespace-nowrap', className)}>
      {children ?? LABELS[severity] ?? severity.toUpperCase()}
    </Badge>
  );
});

SeverityBadge.displayName = 'SeverityBadge';
