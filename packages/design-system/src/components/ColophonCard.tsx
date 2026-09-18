import { ArrowUpRight, Code2, Globe, Rss, Share2 } from 'lucide-react';
import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../lib/recipe';

export interface ColophonLink {
  /** Display label for the link chip. */
  label: string;
  /** Destination URL. */
  href: string;
  /** Predefined glyph category icon. */
  icon?: 'code' | 'globe' | 'share' | 'rss' | 'external';
}

export interface ColophonCardProps extends HTMLAttributes<HTMLElement> {
  /** Author name heading (default 'RYAN KELLY'). */
  authorName?: string;
  /** Technical role or title (default 'STAFF ENGINEER // DISTRIBUTED SYSTEMS & TOOLING'). */
  authorRole?: string;
  /** Biographic prose summary. */
  bio?: string;
  /** Oversized background watermark and emblem glyph (default '§'). */
  sectionMarker?: string;
  /** Array of social, source, or feed links. */
  links?: ColophonLink[];
}

const ICON_MAP = {
  code: Code2,
  globe: Globe,
  share: Share2,
  rss: Rss,
  external: ArrowUpRight,
};

/**
 * Editorial author endnote colophon card.
 *
 * Implements a literary and technical signoff block placed at the end of essays
 * and articles. Features a prominent section mark (§), monospace bio block,
 * and brutalist action chips with hover lift.
 *
 * @example
 * ```tsx
 * <ColophonCard
 *   authorName="RYAN KELLY"
 *   authorRole="STAFF ENGINEER"
 *   bio="Distributed systems engineer building retro-brutalist tooling."
 *   links={[{ label: 'GITHUB', href: 'https://github.com/rtkelly13', icon: 'code' }]}
 * />
 * ```
 */
export const ColophonCard = forwardRef<HTMLElement, ColophonCardProps>(
  function ColophonCard(
    {
      authorName = 'RYAN KELLY',
      authorRole = 'STAFF ENGINEER // DISTRIBUTED SYSTEMS & TOOLING',
      bio = 'I build high-throughput data engines, compiler extensions, and retro-brutalist developer tooling.',
      sectionMarker = '§',
      links = [
        { label: 'GITHUB', href: 'https://github.com/rtkelly13', icon: 'code' },
        { label: 'BLOG', href: 'https://ryankelly.dev', icon: 'globe' },
        { label: 'SHARE', href: 'https://twitter.com', icon: 'share' },
        { label: 'RSS FEED', href: '/feed.xml', icon: 'rss' },
      ],
      className,
      ...props
    },
    ref,
  ) {
    return (
      <aside
        ref={ref}
        data-slot="colophon-card"
        className={cn(
          'border-2 border-edge-strong bg-surface-base font-mono text-content-primary p-6 shadow-hard-md relative overflow-hidden',
          className,
        )}
        {...props}
      >
        {/* Background oversized section watermark */}
        <div
          data-slot="colophon-card-watermark"
          className="absolute -right-2 -bottom-6 text-9xl font-black text-content-primary/5 select-none pointer-events-none font-serif"
          aria-hidden="true"
        >
          {sectionMarker}
        </div>

        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
          {/* Section glyph marker box */}
          <div
            data-slot="colophon-card-marker"
            className="w-12 h-12 shrink-0 border-2 border-accent-primary bg-surface-raised flex items-center justify-center text-accent-primary font-black text-2xl shadow-hard-sm"
          >
            {sectionMarker}
          </div>

          {/* Content & Bio block */}
          <div className="flex-1 space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4
                  data-slot="colophon-card-name"
                  className="text-sm font-black tracking-widest text-content-primary uppercase"
                >
                  {authorName}
                </h4>
                <span className="w-1.5 h-3 bg-accent-primary animate-pulse" />
              </div>
              <div
                data-slot="colophon-card-role"
                className="text-xs font-bold text-accent-secondary"
              >
                {authorRole}
              </div>
            </div>

            <p
              data-slot="colophon-card-bio"
              className="font-sans text-sm text-content-secondary leading-relaxed max-w-2xl"
            >
              {bio}
            </p>

            {/* Action Chips */}
            {links && links.length > 0 && (
              <div
                data-slot="colophon-card-links"
                className="flex flex-wrap gap-2 pt-2"
              >
                {links.map((link) => {
                  const Icon = link.icon ? ICON_MAP[link.icon] : ArrowUpRight;
                  return (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 px-3 py-1.5 border border-edge-default bg-surface-raised text-xs font-bold text-content-primary hover:bg-surface-overlay hover:text-content-inverse hover:border-edge-strong transition-all shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5"
                    >
                      <Icon size={12} className="group-hover:stroke-[2.5]" />
                      <span>{link.label}</span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </aside>
    );
  },
);

ColophonCard.displayName = 'ColophonCard';
