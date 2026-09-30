import type { Meta, StoryObj } from '@storybook/react-vite';
import { TelemetryGauge } from '../components/TelemetryGauge';

const meta: Meta<typeof TelemetryGauge> = {
  title: 'Foundations/TelemetryGauge',
  component: TelemetryGauge,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof TelemetryGauge>;

/**
 * Default telemetry HUD instrument in steady-state cruise mode with target pin.
 */
export const Default: Story = {
  args: {
    state: 'cruise',
    value: 72,
    target: 90,
    metricLabel: '52px/s',
  },
};

/**
 * All six machine operating states showing semantic status badges and corresponding accent treatments.
 */
export const MachineStates: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <TelemetryGauge state="cruise" value={80} metricLabel="100%" />
      <TelemetryGauge state="braking" value={35} metricLabel="14px/s" target={80} />
      <TelemetryGauge state="halted" value={0} metricLabel="0.0 MB/s" />
      <TelemetryGauge state="spooling" value={45} metricLabel="45%" target={90} />
      <TelemetryGauge state="idle" value={10} metricLabel="STANDBY" />
      <TelemetryGauge state="online" value={100} metricLabel="HEALTHY" />
    </div>
  ),
};

/**
 * Compact mode omitting the state badge pill for dense layouts or narrow viewports.
 */
export const Compact: Story = {
  args: {
    state: 'cruise',
    value: 65,
    metricLabel: '4.2 MB/s',
    compact: true,
  },
};
