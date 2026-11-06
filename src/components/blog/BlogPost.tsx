import React from 'react';
import { Calendar, Clock, User, Tag as TagIcon } from 'lucide-react';
import { PageTitle } from '../PageTitle';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { AsciiDivider } from '../AsciiDivider';

export interface BlogPostProps {
  title: string;
  subtitle?: string;
  author?: string;
  date: string;
  /**
   * Reading time, e.g. `'9 min read'`. Omitted from the byline row when not
   * supplied — there is no default, because a reading time nobody measured is
   * worse than no reading time at all.
   */
  readingTime?: string;
  /** Topic tags in the header. Omitted entirely when not supplied or empty. */
  tags?: string[];
  children: React.ReactNode;
}

/**
 * The editorial article shell: title, byline row, tags, rule, body.
 *
 * It composes `PageTitle`, `Badge` and `Divider` into the standard post header
 * so every article on the site agrees about where the date sits. The body is
 * yours — it applies no typography of its own, so Markdown output should be
 * wrapped in `Prose` inside it.
 *
 * `readingTime` and `tags` have no defaults, and that is deliberate: they are
 * content, not configuration, so inventing them would publish a claim nobody
 * made — a nine-thousand-word article confidently advertising "5 min read".
 * Each is simply omitted from the header when absent.
 *
 * `author` *does* default, to `'Ryan Kelly'`. That is defensible where the
 * other two are not: the byline of a personal site is the same on almost every
 * post, where a reading time and a topic list differ on all of them. Override
 * it for a guest post.
 *
 * ```tsx
 * <BlogPost title="Where a theme stops applying" date="2026-08-11"
 *           readingTime="9 min read" tags={['CSS', 'Design systems']}>
 *   <Prose>{content}</Prose>
 * </BlogPost>
 * ```
 */
export const BlogPost: React.FC<BlogPostProps> = ({
  title,
  subtitle,
  author = 'Ryan Kelly',
  date,
  readingTime,
  tags,
  children,
}) => {
  return (
    <article
      style={{
        maxWidth: '840px',
        margin: '0 auto',
        padding: '2rem 1.5rem',
        color: 'var(--ds-text-primary)',
      }}
    >
      {/* Blog Post Header */}
      <header style={{ marginBottom: '2.5rem' }}>
        <PageTitle subtitle={subtitle} bracketed>
          {title}
        </PageTitle>

        {/* Metadata Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1.5rem',
            padding: '1rem 0',
            borderTop: '2px solid var(--ds-border-strong)',
            borderBottom: '2px solid var(--ds-border-strong)',
            fontFamily: 'var(--font-ibm-plex-mono, "IBM Plex Mono"), monospace',
            fontSize: '0.85rem',
            color: 'var(--ds-accent-primary)',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <User size={15} />
            <span>{author}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={15} />
            <span>{date}</span>
          </div>

          {readingTime && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={15} />
              <span>{readingTime}</span>
            </div>
          )}

          {tags && tags.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
              {tags.map((t) => (
                <Badge key={t} accent="primary">
                  #{t}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Narrative Body */}
      <div
        style={{
          fontFamily: 'var(--font-inter, "Inter"), sans-serif',
          fontSize: '1.125rem',
          lineHeight: 1.8,
        }}
      >
        {children}
      </div>

      <AsciiDivider />

      {/* Author Bio Footer */}
      <footer style={{ marginTop: '3rem' }}>
        <Card style={{ borderColor: 'var(--ds-accent-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'var(--ds-accent-primary)',
                color: 'var(--ds-text-inverse)',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-space-grotesk, "Space Grotesk"), sans-serif',
              }}
            >
              RK
            </div>
            <div>
              <h4 style={{ fontFamily: 'var(--font-space-grotesk, "Space Grotesk"), sans-serif', margin: 0, fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase' }}>
                Written by {author}
              </h4>
              <span style={{ fontFamily: 'var(--font-ibm-plex-mono, "IBM Plex Mono"), monospace', fontSize: '0.8rem', color: 'var(--ds-accent-secondary)' }}>
                ryankelly.dev • Systems Architecture & Brutalist UI
              </span>
            </div>
          </div>
        </Card>
      </footer>
    </article>
  );
};
