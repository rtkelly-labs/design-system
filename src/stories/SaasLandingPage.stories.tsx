import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SaasLandingPage } from '../components/saas/SaasLandingPage';
import { ThemeProvider } from '../components/ThemeProvider';

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
