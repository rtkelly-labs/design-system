import createMDX from '@next/mdx';
import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'export',
  experimental: { optimizePackageImports: ['@rtkelly13/design-system'] },
  // The site is served from inside the Storybook deployment, under `/site`
  // (docs/hosting.md, "The applied site, embedded"). `next/link` and the asset
  // URLs carry the prefix; `out/` itself does not, and the assembly step
  // (`scripts/assemble-deploy.mjs`) copies it to `site/` in the output.
  basePath: '/site',
  // Emit `docs/index.html` rather than `docs.html`. The deployment runs with
  // `cleanUrls: false` (Storybook needs it), so an extensionless URL can only
  // resolve to a directory index, never to a sibling `.html` file.
  trailingSlash: true,
  reactStrictMode: true,
  images: { unoptimized: true },
  // Posts are `page.mdx` files (see `src/content/posts.ts`).
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
};

// Plugins are named by string, not imported: Turbopack cannot take functions.
const withMDX = createMDX({ options: { remarkPlugins: ['remark-gfm'] } });

export default withMDX(config);
