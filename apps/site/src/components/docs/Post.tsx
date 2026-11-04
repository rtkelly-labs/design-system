import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { POSTS } from '@/content/posts';
import { postArticle } from '@/content/registry';
import { Article } from './Article';

function find(href: string) {
  const def = POSTS.find((p) => p.href === href);
  if (!def) throw new Error(`No post registered at ${href} — add it to src/content/posts.ts`);
  return def;
}

/** Title and description for a post's `export const metadata`. */
export function postMetadata(href: string): Metadata {
  const { title, lede } = find(href);
  return { title, description: lede };
}

/**
 * The frame an `.mdx` post renders inside. Headings come from the MDX
 * components (`AnchorHeading`), so the sections here are only the ones the
 * generator read from the same file, for the rail, the pager and search.
 */
export function Post({ href, children }: { href: string; children: ReactNode }) {
  return <Article article={postArticle(find(href))}>{children}</Article>;
}
