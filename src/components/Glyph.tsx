import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/recipe';
import { NerdIcon, type NerdIconAccent, type NerdIconName } from './NerdIcon';

export interface GlyphProps extends HTMLAttributes<HTMLSpanElement> {
  /** Named Nerd Font glyph or custom ASCII character */
  name?: NerdIconName;
  /** Semantic role accent color */
  accent?: NerdIconAccent;
  /** Size scale */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Wrap with brutalist brackets: `[  ]` */
  bracketed?: boolean;
  /** Custom character or text child */
  children?: ReactNode;
  /** Screen-reader accessible label */
  label?: string;
}

/**
 * Unified Glyph primitive for typographic and Nerd Font icons.
 *
 * Supports both named developer icons (`name="git-branch"`) and pure ASCII symbols (`children="->"`).
 *
 * @example
 * ```tsx
 * // Named Nerd Font
 * <Glyph name="git-branch" accent="primary" />
 *
 * // Typographic ASCII
 * <Glyph bracketed accent="secondary">-></Glyph>
 * ```
 */
export function Glyph({
  name,
  accent,
  size = 'md',
  bracketed = false,
  children,
  label,
  className,
  ...props
}: GlyphProps) {
  if (name) {
    return (
      <NerdIcon
        name={name}
        accent={accent}
        size={size}
        bracketed={bracketed}
        label={label}
        className={className}
        {...props}
      />
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-mono select-none',
        accent === 'primary' && 'text-accent-primary',
        accent === 'secondary' && 'text-accent-secondary',
        accent === 'tertiary' && 'text-accent-tertiary',
        accent === 'success' && 'text-intent-success',
        accent === 'warning' && 'text-intent-warning',
        accent === 'danger' && 'text-intent-danger',
        accent === 'info' && 'text-intent-info',
        accent === 'muted' && 'text-content-muted',
        className,
      )}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={!label}
      {...props}
    >
      {bracketed && <span className="text-content-muted font-bold mr-0.5">[</span>}
      <span className="font-mono text-center inline-block leading-none">{children}</span>
      {bracketed && <span className="text-content-muted font-bold ml-0.5">]</span>}
    </span>
  );
}
