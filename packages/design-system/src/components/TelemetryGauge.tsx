import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../lib/recipe';
import type { AccentToken } from '../lib/theme';
import { AsciiGauge, type AsciiGaugeVariant } from './AsciiGauge';

export type TelemetryMachineState =
  | 'cruise'
  | 'braking'
  | 'halted'
  | 'spooling'
  | 'idle'
  | 'online';

export interface TelemetryGaugeProps extends HTMLAttributes<HTMLDivElement> {
  /** Current machine operating state. */
  state?: TelemetryMachineState;
  /** Custom label override for state pill. Defaults to uppercase state name. */
  stateLabel?: string;
  /** Current value between min and max (0..100). */
  value: number;
  /** Target or benchmark value. */
  target?: number;
  /** Human-readable metric text (e.g. "52px/s", "100%", "4.2 MB/s"). */
  metricLabel?: string;
  /** Total character length of inner ASCII meter (default 8). */
  barSegments?: number;
  /** Visual glyph variant for underlying AsciiGauge. */
  gaugeVariant?: AsciiGaugeVariant;
  /** Responsive compact mode hiding the status pill on narrow viewports. */
  compact?: boolean;
  /** Accent role override for the meter. */
  accent?: AccentToken;
}

interface StateBadgeConfig {
  bg: string;
  text: string;
  label: string;
  accent: AccentToken;
}

const STATE_BADGE_STYLES: Record<TelemetryMachineState, StateBadgeConfig> = {
  cruise: {
    bg: 'bg-intent-success',
    text: 'text-content-inverse',
    label: 'CRUISE',
    accent: 'success',
  },
  braking: {
    bg: 'bg-intent-warning',
    text: 'text-content-inverse',
    label: 'BRAKING',
    accent: 'warning',
  },
  halted: {
    bg: 'bg-intent-danger',
    text: 'text-content-inverse',
    label: 'HALTED',
    accent: 'danger',
  },
  spooling: {
    bg: 'bg-accent-primary',
    text: 'text-content-inverse',
    label: 'SPOOLING',
    accent: 'primary',
  },
  idle: {
    bg: 'bg-surface-sunken',
    text: 'text-content-muted',
    label: 'IDLE',
    accent: 'quiet',
  },
  online: {
    bg: 'bg-intent-success',
    text: 'text-content-inverse',
    label: 'ONLINE',
    accent: 'success',
  },
};

/**
 * Composite terminal telemetry instrument HUD.
 *
 * Combines machine operational status pills, live numeric metric readouts,
 * and an embedded AsciiGauge. Designed for header docking, ticker tape end-slots,
 * and real-time talk presence widgets.
 *
 * @example
 * ```tsx
 * <TelemetryGauge state="cruise" value={52} metricLabel="52px/s" target={80} />
 * ```
 */
export const TelemetryGauge = forwardRef<HTMLDivElement, TelemetryGaugeProps>(
  function TelemetryGauge(
    {
      state = 'cruise',
      stateLabel,
      value,
      target,
      metricLabel,
      barSegments = 8,
      gaugeVariant = 'block',
      compact = false,
      accent,
      className,
      ...props
    },
    ref,
  ) {
    const badgeConfig = STATE_BADGE_STYLES[state] ?? STATE_BADGE_STYLES.cruise;
    const displayLabel = stateLabel ?? badgeConfig.label;
    const displayMetric = metricLabel ?? `${Math.round(value)}%`;

    return (
      <div
        ref={ref}
        data-slot="telemetry-gauge"
        className={cn(
          'inline-flex items-center gap-2.5 px-2.5 py-1 border border-edge-subtle bg-surface-raised font-mono text-xs select-none shadow-hard-sm',
          className,
        )}
        {...props}
      >
        {/* State badge pill */}
        {!compact && (
          <span
            data-slot="telemetry-gauge-pill"
            className={cn(
              'px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider',
              badgeConfig.bg,
              badgeConfig.text,
            )}
          >
            {displayLabel}
          </span>
        )}

        {/* Numeric readout */}
        <span
          data-slot="telemetry-gauge-metric"
          className="font-mono text-xs font-bold text-content-primary min-w-[32px] text-right"
        >
          {displayMetric}
        </span>

        {/* ASCII meter */}
        <AsciiGauge
          value={value}
          target={target}
          length={barSegments}
          variant={gaugeVariant}
          accent={accent ?? badgeConfig.accent}
          className="text-xs"
        />
      </div>
    );
  },
);

TelemetryGauge.displayName = 'TelemetryGauge';
