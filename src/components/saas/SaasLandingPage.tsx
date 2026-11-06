import React from 'react';
import { accentVar } from '../../lib/theme';
import { ArrowRight, Check, Zap, Shield, Cpu } from 'lucide-react';
import { PageTitle } from '../PageTitle';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { AsciiDivider } from '../AsciiDivider';

export interface PricingTier {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  /**
   * The tier's accent, used three ways — `Card accent`, `accentVar()` for the
   * price, and `Button variant` for the CTA. So it has to be in the
   * intersection of all three, which is the emphasis roles minus `quiet`:
   * `Button` omits `quiet` because inverse text on a quiet fill is not gated.
   */
  accent: 'primary' | 'secondary' | 'tertiary';
  highlighted?: boolean;
  ctaText?: string;
}

/**
 * Placeholder pricing, deliberately generic.
 *
 * This is a layout in a shared package, so the sample copy has to demonstrate
 * the *shape* — three tiers, one highlighted, escalating feature lists — without
 * describing a particular product. The previous defaults were lifted from a
 * personal-finance app (bank reconciliation, sync engines) and read as that
 * product's marketing site rather than as a design-system example.
 */
export const DEFAULT_PRICING_TIERS: PricingTier[] = [
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
  title?: string;
  subtitle?: string;
  pricingTiers?: PricingTier[];
  /** Terminal output for the deploy section. Pass `''` to hide it. */
  deployLog?: string;
}

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
        fontFamily: 'var(--font-inter, "Inter"), sans-serif',
      }}
    >
      {/* ═══════════ 1. HERO SECTION ═══════════ */}
      <section style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <Badge accent="primary" style={{ marginBottom: '1.5rem', display: 'inline-block' }}>
          ⚡ NEXT-GEN SAAS INFRASTRUCTURE
        </Badge>

        <PageTitle subtitle={subtitle} bracketed>
          {title}
        </PageTitle>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
          <Button variant="tertiary" bracketed size="lg">
            LAUNCH APPLICATION <ArrowRight size={18} />
          </Button>
          <Button variant="default" bracketed size="lg">
            EXPLORE ARCHITECTURE
          </Button>
        </div>

        {/* Terminal Hero Preview */}
        <div
          style={{
            maxWidth: '800px',
            margin: '3.5rem auto 0 auto',
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
              fontFamily: 'var(--font-ibm-plex-mono, "IBM Plex Mono"), monospace',
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
          {/* Scrollable at narrow widths — see `CodeBlock` for why this needs a tabIndex. */}
          <pre
            tabIndex={0}
            role="region"
            aria-label="Deployment log"
            style={{
              padding: '1.5rem',
              fontFamily: 'var(--font-ibm-plex-mono, "IBM Plex Mono"), monospace',
              fontSize: '0.9rem',
              color: 'var(--ds-intent-success)',
              textAlign: 'left',
              overflowX: 'auto',
              margin: 0,
              lineHeight: 1.6,
            }}
          >
{deployLog}
          </pre>
        </div>
      </section>

      <AsciiDivider style={{ margin: '3rem 0', color: 'var(--ds-accent-primary)', fontFamily: 'var(--font-ibm-plex-mono, "IBM Plex Mono"), monospace', fontSize: '0.85rem' }} />

      {/* ═══════════ 2. FEATURE CARDS ═══════════ */}
      <section style={{ margin: '3rem 0' }}>
        <h2
          style={{
            textAlign: 'center',
            fontFamily: 'var(--font-space-grotesk, "Space Grotesk"), sans-serif',
            fontSize: '2rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--ds-text-primary)',
            marginBottom: '3rem',
          }}
        >
          [ BUILT FOR EXTREME PERFORMANCE & CONTROL ]
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '2rem',
          }}
        >
          {[
            { title: 'REAL-TIME SYNC', accent: 'primary' as const, icon: <Cpu size={28} style={{ color: accentVar('primary') }} />, desc: 'Automatic delta reconciliation between live banking APIs and local single-player SQLite databases.' },
            { title: 'RULE ENGINE', accent: 'tertiary' as const, icon: <Zap size={28} style={{ color: accentVar('tertiary') }} />, desc: 'Custom automated regex & payee matching rules to categorize statement imports effortlessly.' },
            { title: 'DRIVE BACKUPS', accent: 'secondary' as const, icon: <Shield size={28} style={{ color: accentVar('secondary') }} />, desc: 'Periodic, atomic SQLite file backups synced directly to Google Drive without external vendor lock-in.' },
          ].map((feature) => (
            <Card key={feature.title} panel accent={feature.accent} title={feature.title}>
              <div style={{ marginTop: '0.5rem' }}>
                {feature.icon}
                <p
                  style={{
                    marginTop: '0.75rem',
                    fontFamily: 'var(--font-ibm-plex-mono, "IBM Plex Mono"), monospace',
                    fontSize: '0.85rem',
                    color: 'var(--ds-text-primary)',
                    opacity: 0.9,
                    lineHeight: 1.6,
                  }}
                >
                  {feature.desc}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <AsciiDivider style={{ margin: '3rem 0', color: 'var(--ds-accent-primary)', fontFamily: 'var(--font-ibm-plex-mono, "IBM Plex Mono"), monospace', fontSize: '0.85rem' }} />

      {/* ═══════════ 3. PRICING TIERS ═══════════ */}
      <section style={{ margin: '3rem 0' }}>
        <h2
          style={{
            textAlign: 'center',
            fontFamily: 'var(--font-space-grotesk, "Space Grotesk"), sans-serif',
            fontSize: '2rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--ds-text-primary)',
            marginBottom: '3rem',
          }}
        >
          [ TRANSPARENT PRICING ]
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '2rem',
            alignItems: 'stretch',
          }}
        >
          {pricingTiers.map((tier) => (
            <Card
              key={tier.name}
              panel
              accent={tier.accent}
              badge={tier.highlighted ? 'POPULAR' : undefined}
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              {/* Tier Header */}
              <div>
                <h3
                  style={{
                    fontFamily: 'var(--font-space-grotesk, "Space Grotesk"), sans-serif',
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: 'var(--ds-text-primary)',
                    marginBottom: '0.5rem',
                  }}
                >
                  {tier.name}
                </h3>

                {/* Price */}
                <div style={{ marginBottom: '1rem' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-space-grotesk, "Space Grotesk"), sans-serif',
                      fontSize: '3rem',
                      fontWeight: 900,
                      color: accentVar(tier.accent),
                    }}
                  >
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span
                      style={{
                        fontFamily: 'var(--font-ibm-plex-mono, "IBM Plex Mono"), monospace',
                        fontSize: '0.85rem',
                        // `text.muted` at full strength, not `text.primary` dimmed.
                        // An opacity on text is an undeclared colour: it moves the
                        // foreground after `check:contrast` has read the pair, and
                        // `text.primary` at 0.6 renders 3.98:1 on `sketch` against a
                        // declared 13.63. `text.muted` is the role this was
                        // approximating, and it is audited — 5.43:1 there, 5.90 on
                        // `midnight`.
                        color: 'var(--ds-text-muted)',
                      }}
                    >
                      {tier.period}
                    </span>
                  )}
                </div>

                <p
                  style={{
                    fontFamily: 'var(--font-ibm-plex-mono, "IBM Plex Mono"), monospace',
                    fontSize: '0.75rem',
                    color: 'var(--ds-text-primary)',
                    opacity: 0.8,
                    lineHeight: 1.5,
                    marginBottom: '1.5rem',
                  }}
                >
                  {tier.description}
                </p>

                {/* Feature list */}
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0' }}>
                  {tier.features.map((feat) => (
                    <li
                      key={feat}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                        fontFamily: 'var(--font-ibm-plex-mono, "IBM Plex Mono"), monospace',
                        fontSize: '0.8rem',
                        color: 'var(--ds-text-primary)',
                        opacity: 0.9,
                        marginBottom: '0.6rem',
                      }}
                    >
                      <Check size={14} style={{ color: 'var(--ds-intent-success)', flexShrink: 0, marginTop: '2px' }} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Button */}
              <div
                style={{
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--ds-border-strong)',
                  marginTop: 'auto',
                }}
              >
                <Button
                  // Was a three-way ternary mapping tier hue names onto Button
                  // hue names. Both vocabularies are roles now, and Button takes
                  // the full set, so the mapping is the identity.
                  variant={tier.accent}
                  bracketed
                  style={{ width: '100%', justifyContent: 'center', display: 'flex' }}
                >
                  {tier.ctaText || 'SELECT PLAN'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};
