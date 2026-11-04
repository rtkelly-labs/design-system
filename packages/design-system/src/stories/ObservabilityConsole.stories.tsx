import type { Meta, StoryObj } from '@storybook/react-vite';
import { ObservabilityConsole } from '../components/saas/ObservabilityConsole';

const meta: Meta<typeof ObservabilityConsole> = {
  title: 'SaaS/ObservabilityConsole',
  component: ObservabilityConsole,
  tags: ['autodocs', 'experimental'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'An ops console for a checkout service the hour after a payment-broker incident. One shared time range drives every chart, the heatmap, the histogram and the logs; hovering one chart draws the cursor on all of them, and dragging zooms them together. A log line’s trace id opens that trace in the replayable viewer. Every view is built from one seeded dataset, so they agree. Served at `/site/examples/observability/`.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof ObservabilityConsole>;

/** The overview the hour after INC-482: the spike, the 5xx rise, the slow heatmap band, and the alerts. */
export const CheckoutIncident: Story = {
  parameters: { docs: { description: { story: 'Opens on the overview with the last hour selected, which contains the 13:20–13:38 UTC incident and its rollback marker.' } } },
};

/** The log view, filtered to the payments service. */
export const Logs: Story = {
  args: { defaultView: 'logs' },
  parameters: { docs: { description: { story: 'Logs filtered by a `service = payments` chip. Expand an error line and choose View trace to open it.' } } },
};

/** The slowest failing trace, ready to replay. */
export const Traces: Story = {
  args: { defaultView: 'traces' },
  parameters: { docs: { description: { story: 'The slowest failing checkout trace in the replayable viewer, with the timed-out acquirer call selected. Press Play to watch it unfold.' } } },
};

/** Dependencies derived from the sampled traces. */
export const ServiceMapView: Story = {
  name: 'Service map',
  args: { defaultView: 'services' },
  parameters: { docs: { description: { story: 'The service map built from every sampled span, with payments selected and its neighbourhood highlighted.' } } },
};

/** Alerts beside the incident they raised. */
export const Alerts: Story = {
  args: { defaultView: 'alerts' },
  parameters: { docs: { description: { story: 'The alert list with the resolved checkout error-rate alert selected, beside the incident timeline it opened.' } } },
};
