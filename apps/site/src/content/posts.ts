import type { ArticleDef } from './types';

/**
 * A post is an `.mdx` page under `src/app/`. Its sections are not declared
 * here: `scripts/generate-docs-data.mts` reads them from the file's `##` and
 * `###` headings, so an anchor cannot drift from the contents rail.
 *
 * Type imports only — the generator loads this file directly under Node.
 */
export interface PostDef extends Omit<ArticleDef, 'sections'> {
  /** Path under `src/app/`. */
  file: string;
}

export const POSTS: readonly PostDef[] = [
  {
    file: 'docs/foundations/colour/page.mdx',
    href: '/docs/foundations/colour',
    title: 'Colour',
    group: 'Foundations',
    lede: 'Colour is addressed by role, and every role pair is held to a contrast floor in CI.',
  },
];
