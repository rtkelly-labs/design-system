import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BlogPost } from '../components/blog/BlogPost';
import { Avatar } from '../components/Avatar';
import { Card } from '../components/Card';

const meta: Meta<typeof BlogPost> = {
  title: 'Blog/BlogPost',
  component: BlogPost,
  tags: ['autodocs', 'stable'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof BlogPost>;

/**
 * The minimum: a title, a date and a body. The byline row carries the author
 * and the date and nothing else — no reading time, no tags — because neither
 * was supplied and neither is invented. The author card under the body is the
 * default one, because no `author` was given either.
 */
export const Default: Story = {
  args: {
    title: 'Where a theme stops applying',
    date: '2026-08-11',
    children: (
      <p>
        A custom property substitutes where it is declared, not where it is used — which decides
        whether a nested panel keeps its own theme or inherits the root&rsquo;s.
      </p>
    ),
  },
};

/**
 * Every header field supplied: subtitle, author, date, reading time and tags.
 * `author="Ryan Kelly"` names the default author, so the card under the body is
 * the same default card `Default` shows.
 */
export const FullMetadata: Story = {
  args: {
    title: 'Where a theme stops applying',
    subtitle: 'Nested panels, var() substitution, and one line of CSS',
    author: 'Ryan Kelly',
    date: '2026-08-11',
    readingTime: '6 min read',
    tags: ['css', 'design-systems'],
    children: (
      <>
        <p>Re-declaring the indirected tokens on the mode classes re-runs substitution at the panel.</p>
        <p>Without it, utilities resolve to whatever the root theme happened to compute.</p>
      </>
    ),
  },
};

/**
 * Partial metadata: tags but no reading time.
 *
 * The two are independent, and each simply disappears when absent. Until #93
 * they did not — a post omitting them rendered `5 min read` and three sample
 * topics, indistinguishable from a post that had supplied them. Absent
 * metadata now looks absent, which is the only honest option for a value only
 * the author can know.
 */
export const PartialMetadata: Story = {
  args: {
    title: 'A post that supplied only some metadata',
    date: '2026-08-30',
    tags: ['css'],
    children: (
      <p>
        The byline row carries an author, a date and one tag. No reading time is shown, because
        none was measured.
      </p>
    ),
  },
};

/**
 * A guest post: a `BlogAuthor` object names someone else, and the whole card
 * follows it. The initials are derived — first and last word, so `Ada King
 * Lovelace` is `AL` — the name links to `url`, and the line under it is the
 * guest's own `description` rather than the site owner's.
 */
export const GuestAuthor: Story = {
  args: {
    title: 'Notes on the Analytical Engine',
    date: '2026-09-01',
    author: {
      name: 'Ada King Lovelace',
      url: 'https://example.com/ada',
      description: 'Guest post • Analyst, Analytical Engine',
    },
    children: <p>The engine weaves algebraical patterns just as the loom weaves flowers and leaves.</p>,
  },
};

// A two-tone head-and-shoulders silhouette, inline so the picture loads without
// a network request and renders the same on every run.
const PORTRAIT =
  'data:image/svg+xml,' +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'>" +
      "<rect width='32' height='32' fill='silver'/>" +
      "<circle cx='16' cy='12' r='6' fill='dimgray'/>" +
      "<path d='M4 32c0-7 5-11 12-11s12 4 12 11z' fill='dimgray'/>" +
      '</svg>',
  );

/**
 * An author with a picture: `avatar` takes the square the initials would
 * occupy. Pass an `Avatar` at `size="sm"`, which keeps the card's 40px rhythm
 * and falls back to its own initials if the image fails to load. The picture's
 * `alt` is empty because the name sits beside it.
 */
export const WithAvatar: Story = {
  args: {
    title: 'Notes on the Analytical Engine',
    date: '2026-09-01',
    author: {
      name: 'Ada Lovelace',
      url: 'https://example.com/ada',
      description: 'Guest post • Analyst, Analytical Engine',
      avatar: <Avatar size="sm" src={PORTRAIT} alt="" fallback="AL" accent="secondary" />,
    },
    children: <p>The engine weaves algebraical patterns just as the loom weaves flowers and leaves.</p>,
  },
};

/**
 * An author with only a name: no `url`, so the name is plain text rather than
 * a link, and no `description`, so the line under it is omitted rather than
 * borrowed from the default. A one-word name derives one initial.
 */
export const WithoutUrl: Story = {
  args: {
    title: 'A post by someone without a homepage',
    date: '2026-09-02',
    author: { name: 'Anonymous' },
    children: <p>The card says who wrote this and nothing it was not told.</p>,
  },
};

/**
 * The `authorCard` slot, for what a `BlogAuthor` cannot express — here two
 * authors. It replaces the whole card inside the post's footer; the byline row
 * still reads `author`. Pass `null` to drop the footer altogether.
 */
export const CustomAuthorCard: Story = {
  args: {
    title: 'A post with two authors',
    date: '2026-09-03',
    author: 'Ada Lovelace & Charles Babbage',
    authorCard: (
      <Card>
        <p style={{ margin: 0, fontFamily: 'var(--ds-font-mono)', fontSize: '0.85rem' }}>
          Written by Ada Lovelace, from notes by Charles Babbage. Both are guests of this site.
        </p>
      </Card>
    ),
    children: <p>Two names in the byline, one card that can say how they divided the work.</p>,
  },
};
