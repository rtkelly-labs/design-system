import { Avatar as BaseAvatar } from '@base-ui/react/avatar';
import { forwardRef } from 'react';
import { accentVar } from '../lib/theme';
import type { AccentToken } from '../lib/theme';
import React from 'react';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
  /**
   * Which accent draws the ring and the offset shadow.
   *
   * Roles only: `primary`, `secondary`, `tertiary`, `quiet`, and the four
   * intents. The hue names this used to accept are gone.
   *
   * The hue names also mislead now that `palette` exists. On `sketch`,
   * `accent="primary"` renders `#1450d7` — blue — because it was never asking for
   * cyan, it was asking for the primary accent. Use the role.
   */
  accent?: AccentToken;
}

/**
 * An avatar, on Base UI's `avatar`.
 *
 * The part that matters is the failure path: this rendered a bare `<img src>`
 * with no `onError`, so a URL that 404s showed the browser's broken-image glyph
 * rather than the initials — the one state a fallback exists for, and the one
 * that was never reached. `Avatar.Image` only renders once the image has
 * actually loaded, and `Avatar.Fallback` covers every other case, including the
 * moment before it does.
 */
export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(function Avatar({
  src,
  alt = 'Avatar',
  fallback = 'RK',
  size = 'md',
  accent = 'primary',
  className = '',
  style,
  ...props
}, ref) {
  const getSizePx = () => {
    switch (size) {
      case 'sm': return '32px';
      case 'lg': return '56px';
      default: return '44px';
    }
  };

  // `accentVar` owns the resolution. Duplicating it here as a switch is how the
  // two drifted before: a role added to the token layer rendered as `primary`
  // in this component and nowhere else, silently.
  const accentColor = accentVar(accent);

  const sizePx = getSizePx();

  return (
    <BaseAvatar.Root
      /*
       * The *function* form of `render`, as `Input` uses for `Field.Control`.
       * Base UI's root is typed to a `span`; `AvatarProps extends
       * HTMLAttributes<HTMLDivElement>` is the published type. Spreading
       * div-typed props through the element form is a type error rather than a
       * cosmetic one, and changing the published type to match a library's
       * default element is the tail wagging the dog.
       */
      render={(rootProps) => (
        <div
          {...rootProps}
          {...props}
          ref={ref}
          data-slot="avatar"
          className={className}
          style={{
            width: sizePx,
            height: sizePx,
            border: '2px solid var(--ds-border-strong)',
            boxShadow: `3px 3px 0px 0px ${accentColor}`,
            backgroundColor: 'var(--ds-surface-base)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            boxSizing: 'border-box',
            ...style,
          }}
        />
      )}
    >
      {src && (
        <BaseAvatar.Image
          src={src}
          alt={alt}
          data-slot="avatar-image"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      <BaseAvatar.Fallback
        data-slot="avatar-fallback"
        style={{
            fontFamily: 'var(--font-space-grotesk, "Space Grotesk"), sans-serif',
            fontWeight: 800,
            fontSize: size === 'sm' ? '0.75rem' : size === 'lg' ? '1.2rem' : '0.95rem',
            color: accentColor,
          textTransform: 'uppercase',
        }}
      >
        {fallback}
      </BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
});
