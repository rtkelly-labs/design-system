import type { HTMLAttributes } from 'react';
import { cn, recipe } from '../lib/recipe';

/**
 * Nerd Font Unicode Private Use Area (PUA) symbol codepoints.
 *
 * Sourced from standard Nerd Fonts v3 (Font Awesome, Devicons, Octicons, Codicons, Material Design).
 * Occupies exactly 1 character width (1ch) in monospace typography, guaranteeing
 * zero baseline drift and pixel-perfect terminal alignment.
 */
export const NERD_GLYPHS = {
  // Navigation & Sorting
  'sort': '\uf0dc',            // 
  'sort-asc': '\uf0de',        // 
  'sort-desc': '\uf0dd',       // 
  'chevron-right': '\uf054',   // 
  'chevron-left': '\uf053',    // 
  'chevron-up': '\uf077',      // 
  'chevron-down': '\uf078',    // 
  'arrow-right': '\uf061',     // 
  'arrow-left': '\uf060',      // 
  'arrow-up': '\uf062',        // 
  'arrow-down': '\uf063',      // 
  'expand': '\uf065',          // 
  'compress': '\uf066',        // 

  // Git & DevOps
  'git-branch': '\uf126',      // 
  'git-commit': '\uf417',      // 
  'git-merge': '\uf408',       // 
  'git-pull-request': '\uf407',// 
  'docker': '\uf308',          // 
  'kubernetes': '\udb84\udc39',
  'aws': '\udb80\udf5d',
  'linux': '\uf17c',           // 
  'apple': '\uf179',           // 
  'windows': '\uf17a',         // 
  'database': '\uf1c0',        // 
  'server': '\uf233',          // 
  'terminal': '\uf120',        // 
  'code': '\uf121',            // 
  'bug': '\uf188',             // 
  'cpu': '\udb80\udf22',
  'ram': '\udb80\udf23',

  // System & Chrome Actions
  'search': '\uf002',          // 
  'settings': '\uf013',        // 
  'check': '\uf00c',           // 
  'close': '\uf00d',           // 
  'alert': '\uf071',           // 
  'info': '\uf05a',            // 
  'help': '\uf059',            // 
  'refresh': '\uf021',         // 
  'sync': '\uf46a',            // 
  'copy': '\uf0c5',            // 
  'external-link': '\uf08e',   // 
  'trash': '\uf1f8',           // 
  'edit': '\uf044',            // 
  'plus': '\uf067',            // 
  'minus': '\uf068',           // 
  'filter': '\uf0b0',          // 
  'folder': '\uf07b',          // 
  'folder-open': '\uf07c',     // 📂
  'file': '\uf15b',            // 
  'file-code': '\uf1c9',       // 
  'lock': '\uf023',            // 
  'unlock': '\uf09c',          // 
  'link': '\uf0c1',            // 
  'play': '\uf04b',            // 
  'pause': '\uf04c',           // 
  'stop': '\uf04d',            // 
} as const;

export type NerdIconName = keyof typeof NERD_GLYPHS;

export type NerdIconAccent =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'muted';

const iconStyles = recipe({
  slots: {
    root: 'inline-flex items-center font-mono select-none',
    symbol: 'font-mono text-center inline-block leading-none',
  },
  variants: {
    accent: {
      primary: { symbol: 'text-accent-primary' },
      secondary: { symbol: 'text-accent-secondary' },
      tertiary: { symbol: 'text-accent-tertiary' },
      success: { symbol: 'text-intent-success' },
      warning: { symbol: 'text-intent-warning' },
      danger: { symbol: 'text-intent-danger' },
      info: { symbol: 'text-intent-info' },
      muted: { symbol: 'text-content-muted' },
    },
    size: {
      xs: { symbol: 'text-[10px]' },
      sm: { symbol: 'text-xs' },
      md: { symbol: 'text-sm' },
      lg: { symbol: 'text-base' },
      xl: { symbol: 'text-lg' },
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export interface NerdIconProps extends HTMLAttributes<HTMLSpanElement> {
  /** The named Nerd Font icon identifier. */
  name: NerdIconName;
  /** Optional semantic role accent color. */
  accent?: NerdIconAccent;
  /** Size scale of the icon symbol. */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to enclose the glyph in brutalist monospace brackets: `[  ]` */
  bracketed?: boolean;
  /** Accessible label for screen readers. If omitted, icon is aria-hidden. */
  label?: string;
}

/**
 * Monospace Nerd Font developer glyph primitive.
 *
 * Renders high-density developer and system icons mapped directly into monospace
 * font metrics (1ch grid) with zero SVG layout shift.
 *
 * @example
 * ```tsx
 * // Inline Git branch glyph
 * <NerdIcon name="git-branch" accent="primary" />
 *
 * // Bracketed terminal button icon
 * <Button>
 *   <NerdIcon name="terminal" bracketed accent="secondary" /> EXECUTE RUNTIME
 * </Button>
 * ```
 */
export function NerdIcon({
  name,
  accent,
  size,
  bracketed = false,
  label,
  className,
  ...props
}: NerdIconProps) {
  const glyph = NERD_GLYPHS[name] || '?';
  const styles = iconStyles({ accent, size });

  return (
    <span
      className={styles.root({ class: className })}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={!label}
      {...props}
    >
      {bracketed && <span className="text-content-muted font-bold mr-0.5">[</span>}
      <span className={styles.symbol()}>{glyph}</span>
      {bracketed && <span className="text-content-muted font-bold ml-0.5">]</span>}
    </span>
  );
}
