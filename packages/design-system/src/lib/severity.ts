/**
 * The observability severity vocabulary — log levels, alert states and alert
 * severities — and the role each is drawn in. Kept beside `SeverityBadge`'s
 * module rather than in it so non-React callers (a chart legend, a CSV export)
 * can map a word to a role without importing a component.
 */

import type { AccentToken } from './theme';

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

/** The role a severity is drawn in. Unknown words fall back to `quiet`. */
export function severityAccent(severity: string): AccentToken {
  return SEVERITY_ACCENTS[severity as Severity] ?? 'quiet';
}

