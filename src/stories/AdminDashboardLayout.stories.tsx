import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminDashboardLayout } from '../components/admin/AdminDashboardLayout';
import { ThemeProvider } from '../components/ThemeProvider';

const meta: Meta<typeof AdminDashboardLayout> = {
  title: 'SaaS/AdminDashboardLayout',
  tags: ['experimental'],
  component: AdminDashboardLayout,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof AdminDashboardLayout>;

export const DarkMode: Story = {
  render: () => (
    <ThemeProvider defaultLevel="midnight" persist={false} followSystem={false}>
      <div className="bg-surface-base min-h-screen text-content-primary">
        <AdminDashboardLayout />
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
        <AdminDashboardLayout />
      </div>
    </ThemeProvider>
  ),
};
