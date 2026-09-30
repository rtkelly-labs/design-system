import { forwardRef, type HTMLAttributes } from 'react';
import { accentTextClass } from '../lib/accentClasses';
import { cn } from '../lib/recipe';
import type { AccentToken } from '../lib/theme';

export type AsciiGaugeVariant =
  | 'block'
  | 'shade'
  | 'line'
  | 'ascii'
  | 'braille';

export interface AsciiGaugeProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Accessible label describing what the meter measures (default 'Progress'). */
  label?: string;
  /** Current value between min and max. */
  value: number;
  /** Minimum value range (default 0). */
  min?: number;
  /** Maximum value range (default 100). */
  max?: number;
  /** Optional target or benchmark threshold value. When provided, renders a target pin inside the bar. */
  target?: number;
  /** Total character length of inner bar (excluding brackets, default 10). */
  length?: number;
  /** Enclosing boundary characters (default ['[', ']']). Pass null for bare meter. */
  brackets?: [string, string] | null;
  /** Visual glyph set (default 'block'). */
  variant?: AsciiGaugeVariant;
  /** Accent role token for filled glyphs (default 'primary'). */
  accent?: AccentToken;
  /** Show numeric percentage readout after bar (default false). */
  showValue?: boolean;
  /** Custom formatter for numeric readout. */
  valueFormat?: (value: number, ratio: number) => string;
}

const GLYPH_SETS: Record<
  AsciiGaugeVariant,
  { fill: string; empty: string; target: string; shades?: string[] }
> = {
  block: { fill: '█', empty: '░', target: '|' },
  shade: { fill: '▓', empty: '░', target: '|', shades: ['▓', '▒', '░'] },
  line: { fill: '=', empty: '-', target: '|' },
  ascii: { fill: '#', empty: '-', target: '|' },
  braille: { fill: '⣿', empty: '⠀', target: '⡇' },
};

/**
 * Foundational zero-dependency monospace meter primitive.
 *
 * Emits pure UTF-8 character progress bars and benchmark comparisons for terminal HUDs,
 * CLI logs, and table cells. Co-exists alongside SVG BulletChart by addressing text-mode
 * environments and compact monospace contexts. Conforms to 0px border radius and
 * accessible role="meter".
 *
 * @example
 * ```tsx
 * <AsciiGauge value={68} target={80} variant="block" accent="primary" showValue />
 * ```
 */
export const AsciiGauge = forwardRef<HTMLSpanElement, AsciiGaugeProps>(
  function AsciiGauge(
    {
      label = 'Progress',
      value,
      min = 0,
      max = 100,
      target,
      length = 10,
      brackets = ['[', ']'],
      variant = 'block',
      accent = 'primary',
      showValue = false,
      valueFormat,
      className,
      ...props
    },
    ref,
  ) {
    const span = Math.max(0.0001, max - min);
    const clampedValue = Math.min(max, Math.max(min, value));
    const ratio = Math.min(1, Math.max(0, (clampedValue - min) / span));
    const filledCount = Math.round(ratio * length);

    const glyphs = GLYPH_SETS[variant] ?? GLYPH_SETS.block;
    const targetIndex =
      target !== undefined && target >= min && target <= max
        ? Math.min(
            length - 1,
            Math.max(0, Math.round(((target - min) / span) * length)),
          )
        : null;

    // Build character array
    const chars: { char: string; isFilled: boolean; isTarget: boolean }[] = [];

    for (let i = 0; i < length; i++) {
      const isTarget = targetIndex !== null && i === targetIndex;
      if (isTarget && i >= filledCount) {
        chars.push({ char: glyphs.target, isFilled: false, isTarget: true });
      } else if (i < filledCount) {
        if (variant === 'shade' && glyphs.shades) {
          const shadeIndex = Math.min(
            glyphs.shades.length - 1,
            Math.floor((1 - i / filledCount) * glyphs.shades.length),
          );
          chars.push({
            char: glyphs.shades[shadeIndex],
            isFilled: true,
            isTarget,
          });
        } else {
          chars.push({ char: glyphs.fill, isFilled: true, isTarget });
        }
      } else {
        chars.push({ char: glyphs.empty, isFilled: false, isTarget });
      }
    }

    const [openBracket, closeBracket] = brackets ?? ['', ''];
    const formattedValue = valueFormat
      ? valueFormat(clampedValue, ratio)
      : `${Math.round(ratio * 100)}%`;

    const accentClass = accentTextClass(accent);

    return (
      <span
        ref={ref}
        role="meter"
        aria-label={label ?? (props['aria-label'] || 'Progress')}
        aria-valuenow={clampedValue}
        aria-valuemin={min}
        aria-valuemax={max}
        data-slot="ascii-gauge"
        className={cn(
          'inline-flex items-center font-mono text-xs select-none tracking-tight',
          className,
        )}
        {...props}
      >
        {openBracket && (
          <span
            data-slot="ascii-gauge-bracket"
            aria-hidden="true"
            className="text-content-muted"
          >
            {openBracket}
          </span>
        )}
        <span
          data-slot="ascii-gauge-bar"
          aria-hidden="true"
          className="inline-flex"
        >
          {chars.map((item, idx) => (
            <span
              key={`gauge-char-${idx}`}
              className={
                item.isTarget
                  ? 'text-intent-warning font-bold'
                  : item.isFilled
                    ? accentClass
                    : 'text-content-muted'
              }
            >
              {item.char}
            </span>
          ))}
        </span>
        {closeBracket && (
          <span
            data-slot="ascii-gauge-bracket"
            aria-hidden="true"
            className="text-content-muted"
          >
            {closeBracket}
          </span>
        )}
        {showValue && (
          <span
            data-slot="ascii-gauge-value"
            className="ml-1.5 font-mono text-xs font-bold text-content-primary"
          >
            {formattedValue}
          </span>
        )}
      </span>
    );
  },
);

AsciiGauge.displayName = 'AsciiGauge';
