'use client';

import { forwardRef } from 'react';
import type { Ref } from 'react';
import type { ReactNode, MouseEventHandler } from 'react';
import type { AccentToken } from '../lib/theme';
import { cn } from '../lib/recipe';
import { useLabelAppearance } from '../lib/labelAppearance';
import type { LabelAppearance } from '../lib/labelAppearance';
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
  /**
   * `default` is the filled tag. `hairline` is the quiet treatment for a label
   * in a table (D11): a 1px `border.subtle` outline, no fill, `text.secondary`,
   * the `sm` size, the label as written and no `#`. Under it `prefix` and
   * `uppercase` default to off, and `accent` colours nothing; pass `prefix` or
   * `uppercase` explicitly to restore either. Unset, it follows the nearest
   * `Table` (hairline inside one, `default` elsewhere), so a tag on a kanban
   * card keeps its look; pass a value to override. The border steps up to
   * `border.default` under the contrast-more preference on its own.
   */
  appearance?: LabelAppearance;
  children?: ReactNode;
}

export const Tag = forwardRef<HTMLAnchorElement | HTMLSpanElement, TagProps>(function Tag(
  { text, href, accent = 'secondary', onClick, className = '', prefix: prefixProp, uppercase: uppercaseProp, size = 'md', appearance },
  ref,
) {
  const hairline = useLabelAppearance(appearance) === 'hairline';
  const prefix = prefixProp ?? (hairline ? '' : '#');
  const uppercase = uppercaseProp ?? !hairline;
  const focus = 'focus-visible:ring-2 focus-visible:ring-accent-primary';
  const combinedClasses = hairline
    ? cn(
        'inline-block font-mono border border-edge-subtle bg-transparent px-1.5 py-0 text-[0.65rem] text-content-secondary',
        focus,
        uppercase && 'uppercase',
        className,
      )
    : cn(
        'inline-block font-mono font-bold border-edge-strong hover:shadow-hard-sm transition-all',
        focus,
        size === 'sm' ? 'border px-1.5 py-0 text-[0.65rem]' : 'border-2 px-2 py-1 text-xs',
        uppercase && 'uppercase',
        accentFillClass(accent, 'secondary'),
        className,
      );
  const label = text.startsWith(prefix) ? text : `${prefix}${text.split(' ').join('-')}`;

  if (href) {
    return (
      <a data-slot="tag" data-appearance={hairline ? 'hairline' : undefined} ref={ref as Ref<HTMLAnchorElement>} href={href} className={combinedClasses} onClick={onClick}>
        {label}
      </a>
    );
  }

  return (
    <span data-slot="tag" data-appearance={hairline ? 'hairline' : undefined} ref={ref as Ref<HTMLSpanElement>} className={combinedClasses} onClick={onClick}>
      {label}
    </span>
  );
});
