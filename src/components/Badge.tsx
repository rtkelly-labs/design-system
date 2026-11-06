import { forwardRef } from 'react';
import React from 'react';
import { accentVar } from '../lib/theme';
import type { AccentToken } from '../lib/theme';
import { cn } from '../lib/recipe';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  /**
   * Semantic role. Accepts an `Emphasis` (`primary`…`quiet`) or an `Intent`
   * (`info`/`success`/`warning`/`danger`); the legacy palette names still
   * resolve to the same values.
   */
  accent?: AccentToken;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { children, accent = 'primary', className = '', style, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-[0.4rem] border-2 border-edge-strong bg-surface-base px-[0.6rem] py-[0.2rem] font-mono text-[0.75rem] font-bold',
        className
      )}
      // `text-[0.75rem]` rather than `text-xs`: the named size ships a paired
      // line-height, and the class this replaced set font-size alone so the
      // badge inherited the article's unitless 1.5. Pinning any explicit
      // leading changes the line box. The accent is a runtime value, so it
      // stays an inline custom style rather than a build-time utility.
      style={{ color: accentVar(accent), ...style }}
      {...props}
    >
      {children}
    </span>
  );
});
