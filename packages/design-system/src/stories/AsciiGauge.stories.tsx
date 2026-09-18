import type { Meta, StoryObj } from '@storybook/react-vite';
import { AsciiGauge } from '../components/AsciiGauge';

const meta: Meta<typeof AsciiGauge> = {
  title: 'Foundations/AsciiGauge',
  component: AsciiGauge,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof AsciiGauge>;

export const Default: Story = {
  args: {
    value: 65,
    length: 12,
    showValue: true,
  },
};

export const WithTargetBenchmark: Story = {
  args: {
    value: 45,
    target: 80,
    length: 16,
    accent: 'primary',
    showValue: true,
  },
};

export const GlyphVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-3 font-mono text-sm">
      <div className="flex items-center gap-4">
        <span className="w-20 text-content-muted">BLOCK:</span>
        <AsciiGauge value={66} target={80} variant="block" showValue />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-20 text-content-muted">SHADE:</span>
        <AsciiGauge value={66} target={80} variant="shade" accent="secondary" showValue />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-20 text-content-muted">LINE:</span>
        <AsciiGauge value={66} target={80} variant="line" accent="tertiary" showValue />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-20 text-content-muted">ASCII:</span>
        <AsciiGauge value={66} target={80} variant="ascii" accent="warning" showValue />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-20 text-content-muted">BRAILLE:</span>
        <AsciiGauge value={66} target={80} variant="braille" accent="success" showValue />
      </div>
    </div>
  ),
};

export const IntentAccents: Story = {
  render: () => (
    <div className="flex flex-col gap-3 font-mono text-sm">
      <div className="flex items-center gap-4">
        <span className="w-24 text-content-muted">PRIMARY:</span>
        <AsciiGauge value={75} accent="primary" showValue />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-24 text-content-muted">SUCCESS:</span>
        <AsciiGauge value={98} accent="success" showValue />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-24 text-content-muted">WARNING:</span>
        <AsciiGauge value={60} target={90} accent="warning" showValue />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-24 text-content-muted">DANGER:</span>
        <AsciiGauge value={25} target={70} accent="danger" showValue />
      </div>
    </div>
  ),
};
