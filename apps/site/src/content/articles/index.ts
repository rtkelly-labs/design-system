import { catalogueSections } from '../catalogue';
import type { ArticleDef } from '../types';

/**
 * The hand-written pages. Their headings are declared here rather than read
 * out of the rendered page, so the contents rail and the search index exist at
 * build time and the page renders its headings from the same list.
 */

export const overview: ArticleDef = {
  href: '/docs',
  title: 'Overview',
  group: 'Getting started',
  lede:
    'A brutalist component library for React. It has two independently drawn levels, colour addressed by role, and contrast checked in CI. This site is built with it.',
  sections: [
    { id: 'what-it-is', title: 'What it is', depth: 2 },
    { id: 'principles', title: 'Principles', depth: 2 },
    { id: 'this-site', title: 'How this site is built', depth: 2 },
    { id: 'where-next', title: 'Where next', depth: 2 },
  ],
  keywords: 'introduction about principles roles levels midnight sketch',
};

export const installation: ArticleDef = {
  href: '/docs/installation',
  title: 'Installation',
  group: 'Getting started',
  lede:
    'Install the package, import one stylesheet, and mount the provider. Then set up Next.js with Server Components and client islands.',
  sections: [
    { id: 'install', title: 'Install the package', depth: 2 },
    { id: 'stylesheet', title: 'Import the stylesheet', depth: 2 },
    { id: 'provider', title: 'Mount the provider', depth: 2 },
    { id: 'flash', title: 'Prevent the theme flash', depth: 2 },
    { id: 'nextjs', title: 'Next.js App Router', depth: 2 },
    { id: 'client-boundary', title: 'The client boundary', depth: 3 },
    { id: 'router-links', title: 'Router links', depth: 3 },
    { id: 'first-component', title: 'Your first component', depth: 2 },
  ],
  keywords: 'install setup getting started npm pnpm yarn tailwind css theme provider next.js nextjs app router use client ssr',
};

export const catalogue: ArticleDef = {
  href: '/docs/components',
  title: 'All components',
  group: 'Getting started',
  lede:
    'Every component with a story, filed exactly as Storybook files it. Components with a page here link to it. The rest link to their Storybook docs until their page is written.',
  sections: catalogueSections().map((s) => ({ id: s.id, title: s.title, depth: 2 as const })),
  keywords: 'catalogue catalog index list storybook every component',
};

/**
 * The first foundations page, and the pattern the rest follow: a specimen of
 * one design decision, drawn on both levels (`components/specimen`).
 */
export const codeSyntax: ArticleDef = {
  href: '/docs/foundations/code',
  title: 'Code & syntax',
  group: 'Foundations',
  lede:
    'How code reads in the system: one editor theme on both levels, with token roles for syntax and a role each for selection, find, the current line, brackets, diagnostics and diffs.',
  sections: [
    { id: 'theme', title: 'The theme on both levels', depth: 2 },
    { id: 'legend', title: 'Legend', depth: 2 },
    { id: 'structure', title: "How it's structured", depth: 2 },
    { id: 'checks', title: 'Checks', depth: 2 },
    { id: 'surfaces', title: 'On other surfaces', depth: 2 },
    { id: 'metrics', title: 'Type metrics', depth: 2 },
  ],
  keywords: 'code syntax highlighting editor theme selection find bracket diagnostics diff terminal shiki codeblock monospace tokens contrast',
};

export const ARTICLES: readonly ArticleDef[] = [overview, installation, catalogue, codeSyntax];
