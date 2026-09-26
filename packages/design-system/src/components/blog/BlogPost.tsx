import type React from 'react';
import { Calendar, Clock, User, Tag as TagIcon } from 'lucide-react';
import { PageTitle } from '../PageTitle';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { AsciiDivider } from '../AsciiDivider';
import { SiteLink } from '../LinkProvider';
import { deriveInitials, resolveAuthor } from './author';
import type { BlogAuthor } from './author';

export type { BlogAuthor } from './author';

export interface BlogPostProps {
  /** The post's title, set as a bracketed `PageTitle`. */
  title: string;
  /** A line under the title — the standfirst. Omitted when not supplied. */
  subtitle?: string;
  /**
   * Who wrote it. Omit it for the site's own author — the byline and author
   * card render exactly as they always have. A string is a name: the default
   * author's name gets the default card whole, any other gets just that name,
   * with derived initials and no description. A `BlogAuthor` object sets every
   * field the card shows, and only those it sets are shown.
   */
  author?: string | BlogAuthor;
  /**
   * Replaces the author card under the body — the slot for anything an
   * `BlogAuthor` cannot express, such as a bio with links or several authors. It
   * is rendered inside the post's `<footer>`; `null` or `false` removes the
   * footer. The byline row still reads `author`.
   */
  authorCard?: React.ReactNode;
  /** The publication date, shown in the byline row exactly as given. */
  date: string;
  /**
   * Reading time, e.g. `'9 min read'`. Omitted from the byline row when not
   * supplied — there is no default, because a reading time nobody measured is
   * worse than no reading time at all.
   */
  readingTime?: string;
  /** Topic tags in the header. Omitted entirely when not supplied or empty. */
  tags?: string[];
  /** The article body. Wrap Markdown output in `Prose`; this applies no typography. */
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
 * `author` *does* default, to the site's own author. That is defensible where
 * the other two are not: the byline of a personal site is the same on almost
 * every post, where a reading time and a topic list differ on all of them. The
 * default lives outside this file, and every field of it — name, initials,
 * avatar, link, description — is overridable: pass a `BlogAuthor` for a guest
 * post, or `authorCard` for a card a `BlogAuthor` cannot describe.
 *
 * ```tsx
 * <BlogPost title="Where a theme stops applying" date="2026-08-11"
 *           readingTime="9 min read" tags={['CSS', 'Design systems']}>
 *   <Prose>{content}</Prose>
 * </BlogPost>
 *
 * <BlogPost title="A guest post" date="2026-09-01"
 *           author={{ name: 'Ada King Lovelace', url: 'https://example.com',
 *                     description: 'Analyst, Analytical Engine' }}>
 *   <Prose>{content}</Prose>
 * </BlogPost>
 * ```
 */
export const BlogPost: React.FC<BlogPostProps> = ({
  title,
  subtitle,
  author: authorProp,
  authorCard,
  date,
  readingTime,
  tags,
  children,
}) => {
  const author = resolveAuthor(authorProp);
  const initials = author.initials ?? deriveInitials(author.name);
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
            fontFamily: 'var(--ds-font-mono)',
            fontSize: '0.85rem',
            color: 'var(--ds-accent-primary)',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <User size={15} />
            <span>{author.name}</span>
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
          fontFamily: 'var(--ds-font-body)',
          fontSize: '1.125rem',
          lineHeight: 1.8,
        }}
      >
        {children}
      </div>

      <AsciiDivider />

      {/* Author Bio Footer */}
      {authorCard !== null && authorCard !== false && (
        <footer style={{ marginTop: '3rem' }}>
          {authorCard === undefined ? (
            <Card style={{ borderColor: 'var(--ds-accent-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                {author.avatar ?? (
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
                      fontFamily: 'var(--ds-font-display)',
                    }}
                  >
                    {initials}
                  </div>
                )}
                <div>
                  <h4 style={{ fontFamily: 'var(--ds-font-display)', margin: 0, fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase' }}>
                    Written by {author.url ? (
                      <SiteLink href={author.url} className="text-inherit underline decoration-2 underline-offset-4">
                        {author.name}
                      </SiteLink>
                    ) : (
                      author.name
                    )}
                  </h4>
                  {author.description ? (
                    <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.8rem', color: 'var(--ds-accent-secondary)' }}>
                      {author.description}
                    </span>
                  ) : null}
                </div>
              </div>
            </Card>
          ) : (
            authorCard
          )}
        </footer>
      )}
    </article>
  );
};
