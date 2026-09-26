import { storybookUrl } from '@/lib/links';

/**
 * The sample projects: whole pages composed from the package, each served
 * full-page at `/examples/<slug>/` with no site chrome around it, so they read
 * as the product a consumer would ship rather than as a docs figure.
 *
 * Only compositions the package itself exports belong here. The site builds
 * against the package's `dist/` as an npm consumer does, so the story fixtures
 * under `packages/design-system/src/stories/` — which import components from
 * source by relative path — cannot be imported without compiling a second copy
 * of the library into the site. See docs/hosting.md, "Sample projects".
 *
 * Metadata only: the page components live in `src/samples/`, keyed by slug, so
 * the root layout can read this for search without importing client code.
 */
export interface SampleDef {
  /** URL segment under `/examples/`. */
  slug: string;
  title: string;
  /** One sentence for the index card and the page's meta description. */
  lede: string;
  /** The package exports the page is built from. */
  components: readonly string[];
  /** The same composition in Storybook. */
  story: string;
}

export const SAMPLES: readonly SampleDef[] = [
  {
    slug: 'landing-page',
    title: 'SaaS landing page',
    lede: 'A product marketing page: hero, feature grid, a deploy log, three price plans and a closing call to action.',
    components: ['SaasLandingPage', 'Hero', 'FeatureGrid', 'PricingGrid'],
    story: storybookUrl('/story/saas-landingpage--dark-mode'),
  },
  {
    slug: 'admin-dashboard',
    title: 'Admin dashboard',
    lede: 'An operations console: a navigation rail, status badges, summary cards, a level switch and a sync action acknowledged with a toast.',
    components: ['AdminDashboardLayout', 'Card', 'Badge', 'Avatar', 'Toast'],
    story: storybookUrl('/story/saas-admindashboardlayout--with-notifications'),
  },
];

export const sampleHref = (sample: SampleDef) => `/examples/${sample.slug}`;
