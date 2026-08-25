import type { ReactNode, MouseEventHandler } from 'react';
import type { AccentToken } from '../lib/theme';
import { cn } from '../lib/recipe';

/** @deprecated Use {@link AccentToken}. Retained for existing call sites. */
export type TagAccent = 'yellow' | 'cyan' | 'pink' | 'green';

export interface TagProps {
  /** Tag text string or custom element. */
  text: string;
  /** Optional custom URL href. If provided, renders as an `<a>` anchor tag. */
  href?: string;
  /** Background accent color. Defaults to yellow. */
  accent?: AccentToken;
  /** Click event handler. */
  onClick?: MouseEventHandler<HTMLElement>;
  /** Optional custom CSS classes. */
  className?: string;
  /** Prefix character, defaults to '#'. */
  prefix?: string;
  children?: ReactNode;
}

const ACCENT_CLASSES: Record<string, string> = {
  primary: 'bg-accent-primary text-content-inverse hover:bg-accent-secondary',
  secondary: 'bg-accent-secondary text-content-inverse hover:bg-accent-tertiary',
  tertiary: 'bg-accent-tertiary text-content-inverse hover:bg-accent-primary',
  quiet: 'bg-accent-quiet text-content-inverse hover:bg-accent-primary',
  info: 'bg-intent-info text-content-inverse hover:bg-accent-secondary',
  success: 'bg-intent-success text-content-inverse hover:bg-accent-secondary',
  warning: 'bg-intent-warning text-content-inverse hover:bg-accent-tertiary',
  danger: 'bg-intent-danger text-content-inverse hover:bg-accent-primary',
  yellow: 'bg-accent-secondary text-content-inverse hover:bg-accent-tertiary',
  cyan: 'bg-accent-primary text-content-inverse hover:bg-accent-secondary',
  pink: 'bg-accent-tertiary text-content-inverse hover:bg-accent-primary',
  green: 'bg-intent-success text-content-inverse hover:bg-accent-secondary',
};

export function Tag({
  text,
  href,
  accent = 'secondary',
  onClick,
  className = '',
  prefix = '#',
}: TagProps) {
  const baseClasses =
    'inline-block font-mono text-xs font-bold uppercase border-2 border-edge-strong px-2 py-1 hover:shadow-hard-sm transition-all focus-visible:ring-2 focus-visible:ring-accent-primary';
  const accentClass = ACCENT_CLASSES[accent] ?? ACCENT_CLASSES.secondary;
  const combinedClasses = cn(baseClasses, accentClass, className);
  const label = text.startsWith(prefix) ? text : `${prefix}${text.split(' ').join('-')}`;

  if (href) {
    return (
      <a href={href} className={combinedClasses} onClick={onClick}>
        {label}
      </a>
    );
  }

  return (
    <span className={combinedClasses} onClick={onClick}>
      {label}
    </span>
  );
}
