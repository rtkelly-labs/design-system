import type { Meta, StoryObj } from '@storybook/react-vite';
import { SeverityBadge } from '../components/SeverityBadge';
import type { Severity } from '../lib/severity';

const meta: Meta<typeof SeverityBadge> = {
  title: 'Components/Feedback/SeverityBadge',
  component: SeverityBadge,
  tags: ['autodocs', 'preview'],
  args: { severity: 'error' },
  parameters: {
    docs: {
      description: {
        component:
          'A `Badge` coloured by a fixed observability vocabulary — log levels, alert states and alert severities — so "error" is the same colour on every log list, alert table and incident view, and cannot be painted as a success.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof SeverityBadge>;

const row = (words: readonly Severity[]) => (
  <div className="flex flex-wrap gap-2">{words.map((word) => <SeverityBadge key={word} severity={word} />)}</div>
);

/** The six log levels, OpenTelemetry's names. */
export const LogLevels: Story = {
  render: () => row(['trace', 'debug', 'info', 'warn', 'error', 'fatal']),
  parameters: { docs: { description: { story: 'Trace and debug are quiet, info is info, warn is warning, and error and fatal share danger.' } } },
};

/** Alert lifecycle states. */
export const AlertStates: Story = {
  render: () => row(['firing', 'pending', 'silenced', 'resolved']),
  parameters: { docs: { description: { story: 'Firing is danger, pending is warning, silenced is quiet, resolved is success.' } } },
};

/** Alert severities, with caller text. */
export const Severities: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <SeverityBadge severity="critical">CRITICAL · 2</SeverityBadge>
      <SeverityBadge severity="warning">WARNING · 5</SeverityBadge>
      <SeverityBadge severity="info">INFO · 12</SeverityBadge>
    </div>
  ),
  parameters: { docs: { description: { story: 'The colour comes from the severity; the text can be the caller’s, here a count.' } } },
};
