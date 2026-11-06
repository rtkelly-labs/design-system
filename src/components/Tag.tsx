import { forwardRef } from 'react';
import type { Ref } from 'react';
import type { ReactNode, MouseEventHandler } from 'react';
import type { AccentToken } from '../lib/theme';
import { cn } from '../lib/recipe';
import { accentFillClass } from '../lib/accentClasses';


export interface TagProps {
  /** Tag text string or custom element. */
  text: string;
  /** Optional custom URL href. If provided, renders as an `<a>` anchor tag. */
  href?: string;
  /** Background accent role. Defaults to `secondary`. */
  accent?: AccentToken;
  /** Click event handler. */
  onClick?: MouseEventHandler<HTMLElement>;
  /** Optional custom CSS classes. */
  className?: string;
  /** Prefix character, defaults to '#'. */
  prefix?: string;
  children?: ReactNode;
}

export const Tag = forwardRef<HTMLAnchorElement | HTMLSpanElement, TagProps>(function Tag(
  { text, href, accent = 'secondary', onClick, className = '', prefix = '#' },
  ref,
) {
  const baseClasses =
    'inline-block font-mono text-xs font-bold uppercase border-2 border-edge-strong px-2 py-1 hover:shadow-hard-sm transition-all focus-visible:ring-2 focus-visible:ring-accent-primary';
  const accentClass = accentFillClass(accent, 'secondary');
  const combinedClasses = cn(baseClasses, accentClass, className);
  const label = text.startsWith(prefix) ? text : `${prefix}${text.split(' ').join('-')}`;

  if (href) {
    return (
      <a ref={ref as Ref<HTMLAnchorElement>} href={href} className={combinedClasses} onClick={onClick}>
        {label}
      </a>
    );
  }

  return (
    <span ref={ref as Ref<HTMLSpanElement>} className={combinedClasses} onClick={onClick}>
      {label}
    </span>
  );
});
