import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SaasLandingPage } from '../components/saas/SaasLandingPage';
import { ThemeProvider } from '../components/ThemeProvider';
import { ProductLaunchPage, ProjectSitePage } from './marketing/fixtures';

const meta: Meta<typeof SaasLandingPage> = {
  title: 'SaaS/LandingPage',
  tags: ['experimental'],
  component: SaasLandingPage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof SaasLandingPage>;

/** `SaasLandingPage` whole, pinned to `midnight` — its defaults, composed from the marketing sections. */
export const DarkMode: Story = {
  render: () => (
    <ThemeProvider defaultLevel="midnight" persist={false} followSystem={false}>
      <div className="bg-surface-base min-h-screen text-content-primary">
        <SaasLandingPage />
      </div>
    </ThemeProvider>
  ),
};

/**
 * The light half of the pair — warm paper and pen ink. Since the collapse this
 * is the only light level, so it is also the light baseline.
 */
export const SketchMode: Story = {
  render: () => (
    <ThemeProvider defaultLevel="sketch" scoped persist={false} followSystem={false} className="min-h-screen bg-surface-base text-content-primary">
      <div>
        <SaasLandingPage />
      </div>
    </ThemeProvider>
  ),
};

/**
 * A product launch built from the marketing sections directly — `SiteHeader`,
 * a centred `Hero`, a `FeatureGrid`, a `PricingGrid` and a closing
 * `CTASection`, then `SiteFooter`. The page with pricing. It follows the
 * toolbar's Level rather than pinning one, so the accessibility suite axes it
 * on both.
 */
export const ProductLaunch: Story = {
  render: () => <ProductLaunchPage />,
};

/**
 * An open-source project site from the same parts in a different order and a
 * different set: a start-aligned `Hero` with an install command, four
 * principles, the `CTASection` mid-page, then a second `FeatureGrid`. No
 * pricing.
 */
export const ProjectSite: Story = {
  render: () => <ProjectSitePage />,
};
