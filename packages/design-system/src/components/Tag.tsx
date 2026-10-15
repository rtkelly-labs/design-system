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
  /**
   * Text put before the label, `#` by default. Pass `""` for none, which also
   * leaves the label's spaces alone instead of hyphenating them.
   */
  prefix?: string;
  /** Upper-case the label. On by default; turn it off for a label whose case carries meaning. */
  uppercase?: boolean;
  /**
   * `md` is the default. `sm` is for a tag inside a dense row: a 1px border,
   * tighter padding and a smaller type size.
   *
   * There is deliberately no `onRemove`. The sources conflict: GOV.UK says
   * tags are not interactive, while Carbon allows dismissible tags for filters
   * only. A removable filter chip is a different component, left until there
   * is a consumer for it.
   */
  size?: 'sm' | 'md';
  children?: ReactNode;
}

export const Tag = forwardRef<HTMLAnchorElement | HTMLSpanElement, TagProps>(function Tag(
  { text, href, accent = 'secondary', onClick, className = '', prefix = '#', uppercase = true, size = 'md' },
  ref,
) {
  const baseClasses =
    'inline-block font-mono font-bold border-edge-strong hover:shadow-hard-sm transition-all focus-visible:ring-2 focus-visible:ring-accent-primary';
  const sizeClasses = size === 'sm' ? 'border px-1.5 py-0 text-[0.65rem]' : 'border-2 px-2 py-1 text-xs';
  const accentClass = accentFillClass(accent, 'secondary');
  const combinedClasses = cn(baseClasses, sizeClasses, uppercase && 'uppercase', accentClass, className);
  const label = text.startsWith(prefix) ? text : `${prefix}${text.split(' ').join('-')}`;

  if (href) {
    return (
      <a data-slot="tag" ref={ref as Ref<HTMLAnchorElement>} href={href} className={combinedClasses} onClick={onClick}>
        {label}
      </a>
    );
  }

  return (
    <span data-slot="tag" ref={ref as Ref<HTMLSpanElement>} className={combinedClasses} onClick={onClick}>
      {label}
    </span>
  );
});
