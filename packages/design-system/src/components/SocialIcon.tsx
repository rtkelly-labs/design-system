import { forwardRef, type AnchorHTMLAttributes, type Ref, type SVGProps } from 'react';
import type { AccentToken } from '../lib/theme';
import { accentTextClass } from '../lib/accentClasses';
import { cn } from '../lib/recipe';

/** Brand names supported by {@link SocialIcon}. */
export type SocialIconName = 'github' | 'linkedin' | 'bluesky' | 'x' | 'mail';

const LABELS: Record<SocialIconName, string> = {
  github: 'GitHub',
  linkedin: 'LinkedIn',
  bluesky: 'Bluesky',
  x: 'X',
  mail: 'Email',
};

/**
 * Paths are kept here rather than pulled from a second icon package. Social
 * marks are rendering primitives, and the design system owns their accessible
 * name, current-colour treatment, and link behaviour.
 */
const PATHS: Record<SocialIconName, string> = {
  github:
    'M12 2C6.477 2 2 6.477 2 12c0 4.419 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.091-.647.35-1.087.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.682-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844a9.58 9.58 0 0 1 2.504.337c1.909-1.294 2.748-1.025 2.748-1.025.546 1.377.202 2.394.1 2.647.64.698 1.028 1.591 1.028 2.682 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.744 0 .267.18.578.688.48A10.003 10.003 0 0 0 22 12c0-5.523-4.477-10-10-10Z',
  linkedin:
    'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.35V8.999h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.602 0 4.267 2.37 4.267 5.455v6.287ZM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124ZM7.119 20.452H3.555V8.999h3.564v11.453ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0Z',
  bluesky:
    'M12 10.8C10.5 7.9 6.42 2.5 2.62 2.5 1.1 2.5.5 3.4.5 4.6c0 1.1.6 6.4 1 7.4.7 1.7 3.1 2.3 5.8 1.9-4.4.7-8.1 2.4-5.6 5.3 2.6 3 6.9-.7 10.3-3.6 3.4 2.9 7.7 6.6 10.3 3.6 2.5-2.9-1.2-4.6-5.6-5.3 2.7.4 5.1-.2 5.8-1.9.4-1 1-6.3 1-7.4 0-1.2-.6-2.1-2.12-2.1-3.8 0-7.88 5.4-9.38 8.3Z',
  x: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817-5.965 6.817H1.681l7.73-8.835L1.255 2.25h6.826l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z',
  mail: 'M2.5 4.5h19a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-19a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1Zm0 1.8v.35l9.5 6.1 9.5-6.1V6.3L12.54 12.4a1 1 0 0 1-1.08 0L2.5 6.3Zm19 11.4V8.8l-8.54 5.48a1.8 1.8 0 0 1-1.92 0L2.5 8.8v8.9h19Z',
};

export interface SocialIconProps extends Omit<SVGProps<SVGSVGElement>, 'color'> {
  /** Brand mark to render. */
  name: SocialIconName;
  /** Semantic role used for the current-colour mark. */
  accent?: AccentToken;
  /** Accessible name. Defaults to the brand name. */
  label?: string;
  /** Optional destination. When set, the icon is wrapped in an anchor. */
  href?: string;
  /** Link target. `_blank` automatically receives a safe `rel` value. */
  target?: AnchorHTMLAttributes<HTMLAnchorElement>['target'];
  /** Explicit link relationship, overriding the `_blank` default. */
  rel?: string;
}

/**
 * Accessible brand SVG for estate social and contact links.
 *
 * Without `href` this is a labelled image. With `href` it becomes a labelled
 * link and the SVG is hidden from assistive technology to avoid two names.
 * All marks use semantic accent roles and `currentColor`, so both theme levels
 * resolve through the design-system token ladder.
 */
export const SocialIcon = forwardRef<SVGSVGElement | HTMLAnchorElement, SocialIconProps>(
  function SocialIcon(
    { name, accent = 'primary', label, href, target, rel, className, ...svgProps },
    ref,
  ) {
    const accessibleName = label ?? svgProps['aria-label'] ?? LABELS[name];
    const svg = (
      <svg
        {...svgProps}
        // The ref follows the rendered root only: inside an anchor the SVG is
        // decoration, and a callback ref fired on both would run element
        // setup/cleanup logic against the nested mark first.
        ref={href ? undefined : (ref as Ref<SVGSVGElement>)}
        data-slot="social-icon"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden={href ? true : undefined}
        aria-label={href ? undefined : accessibleName}
        role={href ? undefined : 'img'}
        className={cn('inline-block size-5 shrink-0', accentTextClass(accent), className)}
      >
        <path d={PATHS[name]} />
      </svg>
    );

    if (!href) return svg;

    return (
      <a
        ref={ref as Ref<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined)}
        aria-label={accessibleName}
        className="inline-flex items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
      >
        {svg}
      </a>
    );
  },
);

SocialIcon.displayName = 'SocialIcon';

export type NamedSocialIconProps = Omit<SocialIconProps, 'name'>;

/** GitHub brand mark. */
export function GitHubIcon(props: NamedSocialIconProps) {
  return <SocialIcon name="github" {...props} />;
}

/** LinkedIn brand mark. */
export function LinkedInIcon(props: NamedSocialIconProps) {
  return <SocialIcon name="linkedin" {...props} />;
}

/** Bluesky brand mark. */
export function BlueskyIcon(props: NamedSocialIconProps) {
  return <SocialIcon name="bluesky" {...props} />;
}

/** X brand mark. */
export function XIcon(props: NamedSocialIconProps) {
  return <SocialIcon name="x" {...props} />;
}

/** Email envelope mark. */
export function MailIcon(props: NamedSocialIconProps) {
  return <SocialIcon name="mail" {...props} />;
}
