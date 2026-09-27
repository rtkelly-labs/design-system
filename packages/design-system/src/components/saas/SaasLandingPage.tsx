import React from 'react';
import { ArrowRight, Zap, Shield, Cpu } from 'lucide-react';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { AsciiDivider } from '../AsciiDivider';
import { Hero } from '../marketing/Hero';
import { FeatureGrid, Feature } from '../marketing/FeatureGrid';
import { PricingGrid, PricingTier } from '../marketing/PricingGrid';
import type { PricingTier as PricingTierData } from '../marketing/PricingGrid';

/**
 * Placeholder pricing, deliberately generic.
 *
 * This is a layout in a shared package, so the sample copy has to demonstrate
 * the *shape* — three tiers, one highlighted, escalating feature lists — without
 * describing a particular product. The previous defaults were lifted from a
 * personal-finance app (bank reconciliation, sync engines) and read as that
 * product's marketing site rather than as a design-system example.
 */
export const DEFAULT_PRICING_TIERS: PricingTierData[] = [
  {
    name: 'STARTER',
    price: '$0',
    period: '/month',
    description: 'Local-first storage and the core workflow, for a single user',
    features: ['Single Workspace', 'Local-First Storage', 'Core Workflow', 'Community Support'],
    accent: 'primary',
    ctaText: 'START FREE'
  },
  {
    name: 'PRO ENGINE',
    price: '$29',
    period: '/month',
    description: 'Automation, scheduled jobs, and versioned backups',
    features: ['Everything in Starter', 'Automation Rules', 'Scheduled Jobs', 'Versioned Backups', 'Usage Analytics'],
    accent: 'tertiary',
    highlighted: true,
    ctaText: 'DEPLOY PRO ENGINE'
  },
  {
    name: 'ENTERPRISE DECK',
    price: '$99',
    period: '/month',
    description: 'Multi-workspace deployment, SSO, and a custom SLA',
    features: ['Unlimited Workspaces', 'SSO & Audit Log', 'Custom Design System Themes', 'Dedicated Support & SLAs', 'Self-Hosted Options'],
    accent: 'secondary',
    ctaText: 'CONTACT SALES'
  }
];

/**
 * Sample terminal output for the deploy section. A prop rather than inline JSX
 * so a consumer can show their own build, and generic for the same reason as the
 * pricing above.
 */
export const DEFAULT_DEPLOY_LOG = `$ platform deploy --environment production
[✓] Connecting to local datastore... OK
[✓] Verifying 1,420 records against checksum... OK
[✓] Running automation rules... APPLIED
[✓] Versioned backup written to ./backups/2026-01-01/
[*] Surface ready! Server active on http://localhost:8000`;

export interface SaasLandingPageProps {
  /** The hero's headline. */
  title?: string;
  /** The line under the headline. */
  subtitle?: string;
  /** The plans, as data — one `PricingTier` each. `DEFAULT_PRICING_TIERS` by default. */
  pricingTiers?: PricingTierData[];
  /** Terminal output for the deploy section. Pass `''` to hide it. */
  deployLog?: string;
}

const MONO = 'var(--ds-font-mono)';

const DIVIDER_STYLE: React.CSSProperties = {
  margin: '3rem 0',
  color: 'var(--ds-accent-primary)',
  fontFamily: MONO,
  fontSize: '0.85rem',
};

// This page's feature copy. It lives here rather than in `Feature`, which holds
// none: the landing page is one composition of the marketing sections, and its
// words are its own.
const FEATURES = [
  {
    title: 'REAL-TIME SYNC',
    accent: 'primary',
    icon: <Cpu size={28} />,
    desc: 'Automatic delta reconciliation between live banking APIs and local single-player SQLite databases.',
  },
  {
    title: 'RULE ENGINE',
    accent: 'tertiary',
    icon: <Zap size={28} />,
    desc: 'Custom automated regex & payee matching rules to categorize statement imports effortlessly.',
  },
  {
    title: 'DRIVE BACKUPS',
    accent: 'secondary',
    icon: <Shield size={28} />,
    desc: 'Periodic, atomic SQLite file backups synced directly to Google Drive without external vendor lock-in.',
  },
] as const;

// The hero's media: a terminal window replaying `deployLog`. Specific to this
// page, so it is passed to `Hero` as children rather than being a slot of it.
// The log scrolls at narrow widths, which is why the `<pre>` takes a tabIndex —
// see `CodeBlock`.
function DeployPreview({ log }: { log: string }) {
  return (
    <div
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        border: '3px solid var(--ds-border-strong)',
        backgroundColor: 'var(--ds-surface-base)',
        boxShadow: '8px 8px 0px 0px var(--ds-accent-primary)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '0.6rem 1rem',
          borderBottom: '2px solid var(--ds-border-strong)',
          backgroundColor: 'var(--ds-text-primary)',
          color: 'var(--ds-surface-base)',
          fontFamily: MONO,
          fontWeight: 800,
          fontSize: '0.85rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>// TERMINAL_ENGINE_DEMO.sh</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--ds-intent-success)', display: 'inline-block' }} />
          STATUS: ACTIVE
        </span>
      </div>
      <pre
        tabIndex={0}
        role="region"
        aria-label="Deployment log"
        style={{
          padding: '1.5rem',
          fontFamily: MONO,
          fontSize: '0.9rem',
          color: 'var(--ds-intent-success)',
          textAlign: 'left',
          overflowX: 'auto',
          margin: 0,
          lineHeight: 1.6,
        }}
      >
{log}
      </pre>
    </div>
  );
}

/**
 * A complete SaaS landing page — hero, features and pricing — composed from
 * the marketing sections: `Hero`, a `FeatureGrid` of `Feature`s and a
 * `PricingGrid` of `PricingTier`s.
 *
 * It is one composition of those parts with its copy filled in, kept for the
 * call sites that render it whole. A page that needs a different order, a
 * different set of sections or its own words should compose the sections
 * directly — the `SaaS/LandingPage` stories build two such pages from the same
 * parts.
 */
export const SaasLandingPage: React.FC<SaasLandingPageProps> = ({
  title = 'HIGH-PERFORMANCE BRUTALIST SAAS PLATFORM',
  subtitle = 'Ship faster with real-time sync, automated rules, and zero-compromise design',
  pricingTiers = DEFAULT_PRICING_TIERS,
  deployLog = DEFAULT_DEPLOY_LOG,
}) => {
  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '3rem 1.5rem',
        color: 'var(--ds-text-primary)',
        fontFamily: 'var(--ds-font-body)',
      }}
    >
      <Hero
        eyebrow={<Badge accent="primary">⚡ NEXT-GEN SAAS INFRASTRUCTURE</Badge>}
        title={title}
        subtitle={subtitle}
        actions={
          <>
            <Button variant="tertiary" bracketed size="lg">
              LAUNCH APPLICATION <ArrowRight size={18} />
            </Button>
            <Button variant="default" bracketed size="lg">
              EXPLORE ARCHITECTURE
            </Button>
          </>
        }
      >
        {deployLog ? <DeployPreview log={deployLog} /> : null}
      </Hero>

      <AsciiDivider style={DIVIDER_STYLE} />

      <FeatureGrid title="[ BUILT FOR EXTREME PERFORMANCE & CONTROL ]">
        {FEATURES.map((feature) => (
          <Feature key={feature.title} title={feature.title} accent={feature.accent} icon={feature.icon}>
            {feature.desc}
          </Feature>
        ))}
      </FeatureGrid>

      <AsciiDivider style={DIVIDER_STYLE} />

      <PricingGrid title="[ TRANSPARENT PRICING ]">
        {pricingTiers.map((tier) => (
          <PricingTier
            key={tier.name}
            name={tier.name}
            price={tier.price}
            period={tier.period}
            description={tier.description}
            features={tier.features}
            accent={tier.accent}
            badge={tier.highlighted ? 'POPULAR' : undefined}
            action={
              <Button
                variant={tier.accent}
                bracketed
                style={{ width: '100%', justifyContent: 'center', display: 'flex' }}
              >
                {tier.ctaText || 'SELECT PLAN'}
              </Button>
            }
          />
        ))}
      </PricingGrid>
    </div>
  );
};
