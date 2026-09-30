import type { Meta, StoryObj } from '@storybook/react-vite';
import { TelemetryGauge } from '../components/TelemetryGauge';
import { TickerTape } from '../components/TickerTape';

const meta: Meta<typeof TickerTape> = {
  title: 'Foundations/TickerTape',
  component: TickerTape,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof TickerTape>;

/**
 * The default ticker tape with pinned state for deterministic rendering and telemetry addon.
 */
export const Default: Story = {
  args: {
    paused: true,
    items: [
      'DISTRIBUTED CONSENSUS: RAFT CLUSTER ONLINE',
      'EVENT LOG: 1.2M OPS/SEC SUSTAINED',
      'COMPILER EXTENSION: SOURCE GEN v0.8.0 PROMOTED',
      'DESIGN SYSTEM: BRUTALIST TOKENS VERIFIED',
    ],
    endAddon: (
      <TelemetryGauge
        state="cruise"
        value={100}
        metricLabel="100%"
        className="border-none shadow-none"
      />
    ),
  },
};

/**
 * Live rolling marquee demonstrating continuous virtual RAF motion and momentum braking on hover.
 */
export const Live: Story = {
  args: {
    items: [
      'DISTRIBUTED CONSENSUS: RAFT CLUSTER ONLINE',
      'EVENT LOG: 1.2M OPS/SEC SUSTAINED',
      'COMPILER EXTENSION: SOURCE GEN v0.8.0 PROMOTED',
      'DESIGN SYSTEM: BRUTALIST TOKENS VERIFIED',
    ],
    paused: false,
    endAddon: (
      <TelemetryGauge
        state="cruise"
        value={100}
        metricLabel="100%"
        className="border-none shadow-none"
      />
    ),
  },
};

/**
 * Ticker tape configured with custom section prefix title and contextual alert dispatches.
 */
export const CustomTitle: Story = {
  args: {
    paused: true,
    title: 'CRITICAL ALERTS // SRE',
    items: [
      'INGEST NODE 04 DEGRADED (AUTO-REBALANCING)',
      'MEMORY PRESSURE NORMALIZED',
      'ALL GATE INVARIANTS SATISFIED',
    ],
    endAddon: (
      <TelemetryGauge
        state="braking"
        value={40}
        metricLabel="14 MB/s"
        target={80}
        className="border-none shadow-none"
      />
    ),
  },
};
