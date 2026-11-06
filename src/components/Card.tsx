import type { ReactNode, HTMLAttributes, CSSProperties } from 'react';
import { cn } from '../lib/recipe';
import { accentVar, semanticTokens } from '../lib/theme';
import type { AccentToken } from '../lib/theme';


/**
 * The two shapes a `Card` renders.
 *
 * `panel` is the general container — border, padding, optional accent stripe.
 * `card` is the blog/project card: a filename bar, an optional cover image and
 * a `[ Learn More → ]` footer, carrying its own width and float classes.
 */
export type CardVariant = 'panel' | 'card';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Card heading. With no `variant` set, its presence is also what selects the
   * full card form over the panel form — see the note on `variant`.
   */
  title?: string;
  description?: string;
  imgSrc?: string;
  href?: string;
  asciiArt?: string;
  filename?: string;
  children?: ReactNode;
  className?: string;
  /** Semantic accent for the left border highlight. */
  accent?: AccentToken;
  /** Badge text shown in the card header */
  badge?: string;
  /**
   * Render the plain panel.
   *
   * @deprecated Use `variant="panel"`. This is kept because it is what existing
   * call sites pass, and `variant` takes precedence over it.
   */
  panel?: boolean;
  /**
   * Which of the component's two forms to render.
   *
   * Setting it is the whole point: with `variant` omitted the form is
   * *inferred* — panel when there is no `title`, full card otherwise — so a
   * panel that later gains a title silently becomes a floated blog card with a
   * filename bar. Nothing in the diff that adds the title says so.
   *
   * Omitting it keeps that inference exactly as it was, for the call sites that
   * already rely on it. New code should say which form it wants.
   */
  variant?: CardVariant;
}

/**
 * A bordered container, in two forms.
 *
 * **`variant="panel"`** is the general one: border, 1.5rem of padding, an
 * optional accent stripe down the left edge, and whatever you put in it. Reach
 * for this unless you specifically want the other.
 *
 * **`variant="card"`** is the blog/project card — a filename bar across the top
 * reading `some_title.md`, an optional cover image, then title, description and
 * a `[ Learn More → ]` link. It is opinionated on purpose and carries its own
 * width and float classes, so it belongs in a card grid rather than as a
 * general-purpose box.
 *
 * **Say which one you want.** With `variant` omitted the form is inferred from
 * whether a `title` is present, which means adding a title to a panel silently
 * turns it into a floated blog card. The inference is kept for the call sites
 * that predate `variant`; new code should not rely on it.
 *
 * The accent is a *stripe*, not a fill: `accent` thickens the left border to
 * 4px and colours it. That is the whole colour budget of the component, which
 * is why a card conveys category rather than status.
 *
 * ```tsx
 * <Card variant="panel" accent="info" badge="DRAFT">
 *   <p>Anything.</p>
 * </Card>
 *
 * <Card variant="card" title="Where a theme stops applying" href="/posts/theme" />
 * ```
 */
export function Card({
  title,
  description,
  imgSrc,
  href,
  asciiArt,
  filename,
  children,
  className = '',
  accent,
  badge,
  panel = false,
  variant,
  style,
  ...props
}: CardProps) {
  const accentColor = accent ? accentVar(accent) : undefined;

  /**
   * An explicit `variant` decides; otherwise fall back to the historical
   * inference, unchanged, so nothing that renders today renders differently.
   *
   * Written as one resolved value rather than left inline in the branch below,
   * because the inference is the part worth being able to point at — and worth
   * being able to delete in one place when it goes in a major.
   */
  const form: CardVariant = variant ?? (panel || (!title && children) ? 'panel' : 'card');

  const baseCardStyle: CSSProperties = {
    backgroundColor: semanticTokens.surface.base,
    color: semanticTokens.text.primary,
    border: `2px solid ${semanticTokens.border.strong}`,
    transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
    ...(accentColor ? { borderLeftWidth: '4px', borderLeftColor: accentColor } : {}),
    ...style,
  };

  // Simple panel mode: no filename header, no width constraints
  if (form === 'panel') {
    return (
      <div
        className={cn(className)}
        style={{ ...baseCardStyle, padding: '1.5rem' }}
        {...props}
      >
        {badge && (
          <span
            style={{
              display: 'inline-block',
              padding: '0.15rem 0.5rem',
              fontSize: '0.65rem',
              fontFamily: semanticTokens.font.mono,
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--ds-text-inverse)',
              backgroundColor: accentColor ?? semanticTokens.accent.tertiary,
              marginBottom: '0.75rem',
            }}
          >
            {badge}
          </span>
        )}
        {title && (
          <h3
            style={{
              fontFamily: semanticTokens.font.display,
              fontSize: '1.1rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: accentColor || semanticTokens.text.primary,
              marginBottom: '0.75rem',
              letterSpacing: '0.025em',
            }}
          >
            {title}
          </h3>
        )}
        {description && (
          <p style={{ fontFamily: semanticTokens.font.mono, fontSize: '0.85rem', color: semanticTokens.text.primary, opacity: 0.9, lineHeight: 1.6 }}>
            {description}
          </p>
        )}
        {children}
      </div>
    );
  }

  // Full card mode with filename header bar (blog/project card style)
  const computedFilename = filename || (title ? `${title.toLowerCase().replace(/\s+/g, '_')}.md` : 'card.md');

  return (
    <div className={cn('p-4 md:w-1/2', className)} style={{ maxWidth: '544px' }} {...props}>
      <div
        style={{
          height: '100%',
          ...baseCardStyle,
        }}
      >
        <div
          style={{
            borderBottom: `2px solid ${semanticTokens.border.strong}`,
            padding: '0.5rem 1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: semanticTokens.surface.base,
          }}
        >
          <span
            style={{
              fontFamily: semanticTokens.font.mono,
              fontSize: '0.85rem',
              color: semanticTokens.accent.secondary,
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {computedFilename}
          </span>
          {asciiArt && (
            <pre style={{ fontSize: '0.7rem', color: semanticTokens.accent.primary, lineHeight: 1 }}>
              {asciiArt}
            </pre>
          )}
        </div>

        {imgSrc && (
          <div style={{ borderBottom: `2px solid ${semanticTokens.border.strong}` }}>
            {href ? (
              <a href={href} aria-label={`Link to ${title || 'card'}`}>
                <img
                  alt={title || 'Card Image'}
                  src={imgSrc}
                  style={{ objectFit: 'cover', objectPosition: 'center', width: '100%', maxHeight: '192px' }}
                />
              </a>
            ) : (
              <img
                alt={title || 'Card Image'}
                src={imgSrc}
                style={{ objectFit: 'cover', objectPosition: 'center', width: '100%', maxHeight: '192px' }}
              />
            )}
          </div>
        )}

        <div style={{ padding: '1.5rem' }}>
          {title && (
            <h2
              style={{
                marginBottom: '0.75rem',
                fontSize: '1.5rem',
                fontFamily: semanticTokens.font.display,
                fontWeight: 700,
                lineHeight: 1.3,
                letterSpacing: '-0.01em',
                textTransform: 'uppercase',
                color: semanticTokens.text.primary,
              }}
            >
              {href ? (
                <a href={href} aria-label={`Link to ${title}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {title}
                </a>
              ) : (
                title
              )}
            </h2>
          )}
          {description && (
            <p style={{ marginBottom: '0.75rem', fontFamily: semanticTokens.font.body, fontSize: '0.9rem', color: semanticTokens.text.primary, opacity: 0.7, lineHeight: 1.6 }}>
              {description}
            </p>
          )}
          {children}
          {href && (
            <a
              href={href}
              style={{
                fontFamily: semanticTokens.font.mono,
                fontWeight: 700,
                color: semanticTokens.accent.primary,
                textDecoration: 'none',
                textTransform: 'uppercase',
                display: 'inline-block',
                transition: 'transform 0.15s ease',
              }}
              aria-label={`Link to ${title || 'details'}`}
            >
              [ Learn More &rarr; ]
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
