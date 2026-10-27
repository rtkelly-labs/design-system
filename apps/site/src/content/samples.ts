import { storybookUrl } from '@/lib/links';

/**
 * The sample projects: whole pages composed from the package, each served
 * full-page at `/examples/<slug>/` with no site chrome around it, so they read
 * as the product a consumer would ship rather than as a docs figure.
 *
 * Exported pages and generated canonical admin fixtures resolve all design-system
 * components through the built package, sharing the site providers.
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
  story?: string;
  /** Fills exactly the viewport under the sample bar, scrolling inside itself (an app shell, not a page). */
  fullHeight?: boolean;
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
    title: 'Finance console',
    lede: 'An operations console: a navigation rail, status badges, summary cards, a level switch and a sync action acknowledged with a toast.',
    components: ['AppShell', 'DataTable', 'StatCard', 'Avatar', 'Toast'],
    story: storybookUrl('/story/saas-admindashboard--finance-console'),
  },
  {
    slug: 'observability',
    title: 'Observability console',
    lede: 'An ops console for a checkout service mid-incident: shared time range, latency and throughput charts, a latency heatmap, alerts, an incident timeline, filtered logs that open a replayable trace, and a service map.',
    components: ['ObservabilityConsole', 'TimeSeriesChart', 'LatencyHeatmap', 'LogViewer', 'TraceViewer', 'ServiceMap', 'AlertList', 'IncidentTimeline'],
    story: storybookUrl('/story/saas-observabilityconsole--checkout-incident'),
  },
  {
    slug: 'content-studio',
    title: 'Content studio',
    lede: 'An editorial admin with a navigation rail, publication states and a content queue.',
    components: ['AppShell', 'DataTable', 'Badge', 'Menu'],
    story: storybookUrl('/story/saas-admindashboard--content-studio'),
  },
  {
    slug: 'kanban',
    title: 'Kanban board',
    lede: 'A project board with draggable cards, column menus, filters and a card editor.',
    components: ['Avatar', 'Badge', 'Button', 'Menu', 'Modal', 'Progress'],
  },
  {
    slug: 'inbox',
    title: 'Inbox',
    lede: 'A mail client: folders, a message list with selection and a reading pane.',
    components: ['Button', 'Input', 'Select', 'Menu'],
  },
  {
    slug: 'settings',
    title: 'Settings',
    lede: 'Repository settings, API keys and a danger zone composed from form primitives.',
    components: ['Input', 'Select', 'Tabs', 'Table', 'AlertDialog'],
  },
  {
    slug: 'calendar',
    title: 'Calendar',
    lede: 'A month and week calendar with events and an editor.',
    components: ['Button', 'Modal', 'Select', 'Menu'],
  },
  {
    slug: 'editor',
    title: 'Editor workbench',
    lede: 'A code editor workbench: file tabs, explorer, problems and terminal panels.',
    components: ['Tabs', 'Menu', 'Button'],
    fullHeight: true,
  },
];

export const sampleHref = (sample: SampleDef) => `/examples/${sample.slug}`;
