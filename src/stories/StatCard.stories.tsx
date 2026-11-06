import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatCard } from '../components/StatCard';
import { Activity, Cpu, ShieldCheck, DollarSign } from 'lucide-react';

const meta: Meta<typeof StatCard> = {
  title: 'Foundations/StatCard',
  component: StatCard,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof StatCard>;

export const SystemHealth: Story = {
  args: {
    title: 'SYSTEM HEALTH',
    value: '99.98%',
    change: '+0.04%',
    changeType: 'positive',
    subtitle: '42 Nodes Healthy',
    icon: Activity,
    accent: 'primary',
  },
};

export const ComputeLatency: Story = {
  args: {
    title: 'COMPUTE LATENCY',
    value: '14.2 ms',
    change: '-3.1 ms',
    changeType: 'positive',
    subtitle: 'Sub-20ms SLA MET',
    icon: Cpu,
    accent: 'tertiary',
  },
};

export const SecurityAudit: Story = {
  args: {
    title: 'SECURITY AUDIT',
    value: '100%',
    change: 'PASSED',
    changeType: 'positive',
    icon: ShieldCheck,
    accent: 'success',
    subtitle: '0 Critical Alerts',
  },
};
