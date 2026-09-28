import type { ReactNode } from 'react';
import { BookOpen, Contrast, GitBranch, Layers, Package, ShieldCheck, Ruler, Terminal, Zap } from 'lucide-react';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LinkProvider } from '../../components/LinkProvider';
import { MobileNav } from '../../components/MobileNav';
import { SiteFooter } from '../../components/SiteFooter';
import { SiteHeader } from '../../components/SiteHeader';
import { SiteNav } from '../../components/SiteNav';
import { CodeBlock } from '../../components/docs/CodeBlock';
import { CTASection } from '../../components/marketing/CTASection';
import type { CTASectionAccent } from '../../components/marketing/CTASection';
import { Feature, FeatureGrid } from '../../components/marketing/FeatureGrid';
import { Hero } from '../../components/marketing/Hero';
import { PricingGrid, PricingTier } from '../../components/marketing/PricingGrid';
import type { PricingTierAccent } from '../../components/marketing/PricingGrid';
import type { AccentToken } from '../../lib/theme';
import { footerNav, marketing, navItems, projectSite } from '../siteChrome/fixtures';
import type { SiteFixture } from '../siteChrome/fixtures';

// The copy for the marketing-section stories, and the two landing pages issue
// 248 asks the sections to build.
//
// Every product name, price and line below is a fixture. `Hero`, `FeatureGrid`,
// `Feature`, `PricingGrid`, `PricingTier` and `CTASection` hold none of it —
// the stories import it from here. The chrome is the site-chrome fixtures'
// `marketing` and `projectSite` sites, so the header and footer are the ones
// `Components/Navigation/SiteHeader` already documents.

export interface FeatureFixture {
  title: string;
  icon: ReactNode;
  accent: AccentToken;
  body: string;
}

export interface TierFixture {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: readonly string[];
  accent: PricingTierAccent;
  badge?: string;
  action: string;
  href: string;
}

export interface CtaFixture {
  title: string;
  body: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  accent?: CTASectionAccent;
}

/** A theming product's three selling points. */
export const launchFeatures: readonly FeatureFixture[] = [
  {
    title: 'Audited contrast',
    icon: <Contrast size={28} />,
    accent: 'primary',
    body: 'Every role pair on every level measured as arithmetic before it ships, not eyeballed after.',
  },
  {
    title: 'Two levels, one API',
    icon: <Layers size={28} />,
    accent: 'tertiary',
    body: 'A dark and a light level authored independently, addressed by the same role names.',
  },
  {
    title: 'Exports everywhere',
    icon: <Package size={28} />,
    accent: 'secondary',
    body: 'Tokens as CSS, DTCG JSON and terminal schemes, generated from one source.',
  },
];

/** Three plans, the middle one recommended. */
export const launchTiers: readonly TierFixture[] = [
  {
    name: 'Solo',
    price: '$0',
    period: '/month',
    description: 'One project, both levels, the full token export.',
    features: ['One project', 'Both levels', 'CSS and JSON tokens'],
    accent: 'primary',
    action: 'START FREE',
    href: '/signup',
  },
  {
    name: 'Studio',
    price: '$19',
    period: '/month',
    description: 'For a small team theming several products.',
    features: ['Unlimited projects', 'Custom levels', 'Contrast reports', 'Terminal schemes'],
    accent: 'tertiary',
    badge: 'POPULAR',
    action: 'START TRIAL',
    href: '/signup?plan=studio',
  },
  {
    name: 'Agency',
    price: '$79',
    period: '/month',
    description: 'Client workspaces, audit history and a support line.',
    features: ['Client workspaces', 'Audit history', 'Priority support'],
    accent: 'secondary',
    action: 'TALK TO US',
    href: '/contact',
  },
];

export const launchCta: CtaFixture = {
  title: 'Theme it once',
  body: 'Start on the free plan and move up when a second product needs its own level. No card required.',
  primary: { label: 'START FREE', href: '/signup' },
  secondary: { label: 'SEE THE DOCS', href: '/guides' },
  accent: 'tertiary',
};

/** An open-source project's four principles. */
export const projectPrinciples: readonly FeatureFixture[] = [
  {
    title: 'Roles, not hues',
    icon: <Ruler size={28} />,
    accent: 'primary',
    body: 'Components ask for a job — surface, accent, danger — never a colour.',
  },
  {
    title: 'Gated',
    icon: <ShieldCheck size={28} />,
    accent: 'success',
    body: 'Contrast, bundle size and the public API are all checked on every change.',
  },
  {
    title: 'One primitive layer',
    icon: <GitBranch size={28} />,
    accent: 'tertiary',
    body: 'Focus, popups and keyboard handling come from a single library.',
  },
  {
    title: 'Fast',
    icon: <Zap size={28} />,
    accent: 'secondary',
    body: 'Tree-shakeable exports and no runtime theme engine.',
  },
];

/** What a consumer gets on install. */
export const projectContents: readonly FeatureFixture[] = [
  {
    title: 'Components',
    icon: <BookOpen size={28} />,
    accent: 'primary',
    body: 'Layouts, controls, charts and the site chrome, each documented with its own page.',
  },
  {
    title: 'Terminal themes',
    icon: <Terminal size={28} />,
    accent: 'tertiary',
    body: 'The same palette for iTerm, Ghostty, Alacritty and Windows Terminal.',
  },
];

export const projectCta: CtaFixture = {
  title: 'Read the docs',
  body: 'Install the package, import the stylesheet, and wrap the app in a ThemeProvider.',
  primary: { label: 'GET STARTED', href: '/docs' },
  secondary: { label: 'VIEW SOURCE', href: 'https://github.com/rtkelly13/design-system' },
  accent: 'secondary',
};

export const installSnippet = 'pnpm add @rtkelly13/design-system';

export function features(items: readonly FeatureFixture[]) {
  return items.map((item) => (
    <Feature key={item.title} title={item.title} icon={item.icon} accent={item.accent}>
      {item.body}
    </Feature>
  ));
}

export function tiers(items: readonly TierFixture[]) {
  return items.map((tier) => (
    <PricingTier
      key={tier.name}
      name={tier.name}
      price={tier.price}
      period={tier.period}
      description={tier.description}
      features={tier.features}
      accent={tier.accent}
      badge={tier.badge}
      action={
        <Button href={tier.href} variant={tier.accent} bracketed className="flex w-full">
          {tier.action}
        </Button>
      }
    />
  ));
}

export function ctaActions(cta: CtaFixture) {
  return (
    <>
      <Button href={cta.primary.href} variant={cta.accent ?? 'primary'} bracketed>
        {cta.primary.label}
      </Button>
      {cta.secondary ? (
        <Button href={cta.secondary.href} variant="inverse" bracketed>
          {cta.secondary.label}
        </Button>
      ) : null}
    </>
  );
}

export function ctaSection(cta: CtaFixture, align?: 'center' | 'start') {
  return (
    <CTASection title={cta.title} accent={cta.accent} align={align} actions={ctaActions(cta)}>
      {cta.body}
    </CTASection>
  );
}

interface MarketingPageProps {
  site: SiteFixture;
  children: ReactNode;
}

/** The site chrome around a landing page: header, a `<main>` the skip link targets, footer. */
function MarketingPage({ site, children }: MarketingPageProps) {
  const items = navItems(site.nav);
  return (
    <LinkProvider isCurrent={() => false}>
      <div className="flex min-h-screen flex-col bg-surface-base text-content-primary">
        <SiteHeader
          brand={site.brand}
          collapseAt={site.collapseAt}
          nav={<SiteNav label="Primary">{items}</SiteNav>}
          mobileNav={<MobileNav label="Primary">{items}</MobileNav>}
          actions={site.actions}
        />
        <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 md:px-6">
          {children}
        </main>
        <SiteFooter
          nav={site.footerColumns?.length ? footerNav(site.footerColumns) : undefined}
          meta={site.footerMeta}
        >
          {site.footerLead}
        </SiteFooter>
      </div>
    </LinkProvider>
  );
}

/**
 * A product launch: centred hero, three features, three price plans, and a
 * closing call to action. The page with pricing.
 */
export function ProductLaunchPage() {
  return (
    <MarketingPage site={marketing}>
      <Hero
        eyebrow={<Badge accent="tertiary">NOW IN BETA</Badge>}
        title="Themes you can audit"
        subtitle="A contrast-checked palette, two levels and every export, from one source file."
        actions={
          <>
            <Button href="/signup" variant="tertiary" bracketed size="lg">
              START FREE
            </Button>
            <Button href="/features" variant="inverse" bracketed size="lg">
              TOUR
            </Button>
          </>
        }
      />
      <FeatureGrid title="Why Ladder" description="Three things a theme should never make you check by hand.">
        {features(launchFeatures)}
      </FeatureGrid>
      <PricingGrid title="Pricing" description="Billed monthly. Cancel from the dashboard.">
        {tiers(launchTiers)}
      </PricingGrid>
      {ctaSection(launchCta)}
    </MarketingPage>
  );
}

/**
 * An open-source project site: a start-aligned hero with an install command,
 * four principles, a call to action mid-page, then what ships. No pricing.
 */
export function ProjectSitePage() {
  return (
    <MarketingPage site={projectSite}>
      <Hero
        align="start"
        bracketed={false}
        eyebrow={<Badge accent="success">v0.9 · MIT</Badge>}
        title="A brutalist design system"
        subtitle="Tokens, components and the gates that hold them."
        actions={
          <Button href="/docs" variant="primary" bracketed>
            READ THE DOCS
          </Button>
        }
      >
        <CodeBlock language="bash" title="Install">
          {installSnippet}
        </CodeBlock>
      </Hero>
      <FeatureGrid title="Principles" align="start" columns={4}>
        {features(projectPrinciples)}
      </FeatureGrid>
      {ctaSection(projectCta, 'start')}
      <FeatureGrid title="In the box" align="start" columns={2}>
        {features(projectContents)}
      </FeatureGrid>
    </MarketingPage>
  );
}
