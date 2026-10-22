import { forwardRef } from 'react';
import type { AccentToken } from '../lib/theme';
import { Badge, type BadgeProps } from './Badge';

/** Log levels, OpenTelemetry's severity names in lower case. */
export type LogSeverity = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
/** Alert lifecycle states. */
export type AlertState = 'firing' | 'pending' | 'resolved' | 'silenced';
/** Alert or incident severity. */
export type AlertSeverity = 'critical' | 'warning' | 'info';
/** Every word `SeverityBadge` knows. */
export type Severity = LogSeverity | AlertState | AlertSeverity;

/**
 * The fixed vocabulary, mapped to roles once so every log list, alert table
 * and incident view on a page says "error" in the same colour.
 */
export const SEVERITY_ACCENTS: Readonly<Record<Severity, AccentToken>> = {
  trace: 'quiet',
  debug: 'quiet',
  info: 'info',
  warn: 'warning',
  error: 'danger',
  fatal: 'danger',
  firing: 'danger',
  pending: 'warning',
  resolved: 'success',
  silenced: 'quiet',
  critical: 'danger',
  warning: 'warning',
};

const LABELS: Partial<Record<Severity, string>> = { warn: 'WARN', fatal: 'FATAL' };

/** The role a severity is drawn in. Unknown words fall back to `quiet`. */
export function severityAccent(severity: string): AccentToken {
  return SEVERITY_ACCENTS[severity as Severity] ?? 'quiet';
}

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
  { severity, children, ...props },
  ref,
) {
  return (
    <Badge ref={ref} data-slot="severity-badge" data-severity={severity} accent={severityAccent(severity)} {...props}>
      {children ?? LABELS[severity] ?? severity.toUpperCase()}
    </Badge>
  );
});

SeverityBadge.displayName = 'SeverityBadge';
