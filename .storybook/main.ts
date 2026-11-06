import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';

/**
 * Composed Storybooks, keyed by the ref id that appears in the sidebar.
 *
 * The blog consumes this package rather than defining tokens of its own, so its
 * Storybook documents a different tier: app-level compositions (Foundations /
 * Atoms / Molecules) built on what ships from here. Composing it means one URL
 * answers both "what does the system provide" and "what does the site do with it".
 *
 * Driven by env, not hardcoded, for two reasons: the URL differs per Vercel
 * environment (production vs the `preview` branch domain), and an unreachable
 * ref renders as a permanently-erroring sidebar entry. Unset — the default for
 * `pnpm storybook` locally — composes nothing and the sidebar is just this repo.
 *
 * The composed Storybook must send `Access-Control-Allow-Origin` on its
 * `index.json`: the manager fetches it cross-origin from the browser.
 */
const REFS: Record<string, { title: string; url: string; expanded: boolean }> = {};

const blogStorybookUrl = process.env.STORYBOOK_REF_BLOG_URL?.trim();
if (blogStorybookUrl) {
  REFS.blog = {
    // Not "Blog" — this repo already has a top-level `Blog/` group of its own
    // (BlogPost, LoremIpsumPost), and two sidebar sections by that name read as
    // a duplicate rather than as two tiers.
    title: 'ryankelly.dev (site)',
    url: blogStorybookUrl.replace(/\/$/, ''),
    // Collapsed by default so this repo's own stories stay the landing view.
    expanded: false,
  };
}

const config: StorybookConfig = {
  /**
   * MDX is listed first because `Manifesto.mdx` is the landing page and the
   * order here is the tiebreak the sidebar falls back on. `storySort` in
   * `preview.ts` is what actually pins it, but a glob that never matched `.mdx`
   * at all was the earlier state: an `.mdx` file added to `src/` was ignored
   * silently, with no error and no sidebar entry.
   */
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  refs: REFS,
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  async viteFinal(config) {
    const { mergeConfig } = await import('vite');
    return mergeConfig(config, {
      plugins: [tailwindcss()],
    });
  },
  docs: {},

  /**
   * `react-docgen-typescript`, not the `react-docgen` default.
   *
   * The default resolves neither a union type nor the `DetailedHTMLProps`
   * intersections inside one, and it emits the component **with no props rather
   * than failing**. `Button` is the case that matters: its props are
   * `ButtonElementProps | ButtonLinkProps`, so the most-copied component in the
   * package published an empty table where `variant`, `size`, `bracketed` and
   * `href` belong — and the long JSDoc on `variant`, which is the entire
   * mitigation for the naming #90 was about, reached no consumer at all.
   * `Table*` failed for the same class of reason.
   *
   * The `propFilter` is not optional and must not be removed: without it every
   * inherited `HTMLAttributes` member lands in every table, and a 250-row props
   * table documents nothing. It keeps a prop only if it is declared in this
   * repo, which is also what makes the tables honest about what a component
   * actually adds.
   *
   * The cost is a slower Storybook build. Grafana and EUI both pay it and both
   * chose this extractor; `docs/storybook-benchmarks.md` § 3 has the comparison.
   */
  /**
   * The components manifest: `manifests/components.json` in the build output.
   *
   * Storybook 10 generates it from static analysis of CSF plus the prop
   * extraction configured below, and 10.4 renamed the flag from
   * `experimentalComponentsManifest` and defaults it to `true`. This repo is on
   * 10.5.5 and a real build emitted **no `manifests/` directory at all**, so the
   * flag is declared rather than relied on — whatever the default is meant to
   * be, nothing was being produced.
   *
   * It matters here more than most: this is the most agent-oriented repo in the
   * estate, `AGENTS.md` is a knowledge base of topic docs each introduced with
   * *when* to load it, and the component catalogue was the one part of it that
   * was not machine-readable. An agent could be told `Button` exists and had no
   * way to be told it takes a `variant`.
   *
   * `check:docgen-props` is what makes the manifest worth having: a manifest
   * built from an extractor that silently emits no props would describe the
   * catalogue as propless and look authoritative doing it.
   */
  features: {
    componentsManifest: true,
  },

  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) => !prop.parent?.fileName.includes('node_modules'),
    },
  },
};

export default config;
