import type { Meta, StoryObj } from '@storybook/react-vite';
import { IncidentTimeline, type IncidentEvent } from '../components/IncidentTimeline';

const now = Date.UTC(2026, 9, 22, 14, 0);
const at = (hour: number, minute: number) => Date.UTC(2026, 9, 22, hour, minute);

const resolved: IncidentEvent[] = [
  { id: 'e1', time: at(12, 4), kind: 'alert', title: 'HighErrorRate firing on checkout-api', detail: '5xx responses crossed 2% after the 12:00 deploy.', author: 'alertmanager' },
  { id: 'e2', time: at(12, 6), kind: 'detected', title: 'Incident declared', author: 'on-call bot' },
  { id: 'e3', time: at(12, 10), kind: 'acknowledged', title: 'Paged engineer acknowledged', author: 'Ana Ruiz' },
  { id: 'e4', time: at(12, 18), kind: 'update', title: 'Suspect v2.41.0 — payment client timeout lowered to 200ms', detail: 'Errors concentrated on the card-auth path.', author: 'Ana Ruiz' },
  { id: 'e5', time: at(12, 24), kind: 'deploy', title: 'Rolled back checkout-api to v2.40.3', author: 'deploy-bot' },
  { id: 'e6', time: at(12, 31), kind: 'mitigated', title: 'Error rate back under 0.5%', author: 'Ana Ruiz' },
  { id: 'e7', time: at(13, 2), kind: 'resolved', title: 'Resolved after 30 minutes of clean traffic', detail: 'Follow-up: restore the timeout with a retry budget.', author: 'Ana Ruiz' },
];

const ongoing: IncidentEvent[] = [
  { id: 'o1', time: at(13, 18), kind: 'alert', title: 'ReplicaLagHigh firing on postgres-replica', author: 'alertmanager' },
  { id: 'o2', time: at(13, 24), kind: 'acknowledged', title: 'Acknowledged', author: 'Sam Okafor' },
  { id: 'o3', time: at(13, 40), kind: 'update', title: 'Vacuum on orders table holding locks; cancelling', author: 'Sam Okafor' },
];

const meta: Meta<typeof IncidentTimeline> = {
  title: 'Components/Data/IncidentTimeline',
  component: IncidentTimeline,
  tags: ['autodocs', 'preview'],
  args: { now },
  parameters: {
    docs: {
      description: {
        component:
          "An incident's history on a vertical rail, one marker per event coloured by kind — detected and alert in danger, acknowledged in warning, update in info, deploy in the secondary accent, mitigated and resolved in success — with the time between events on the rail. The summary strip gives status and time to acknowledge, mitigate and resolve from the first `detected`/`alert` event; `summariseIncident` computes it on its own. Markup is an `<ol>` of `<time dateTime>` entries.",
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof IncidentTimeline>;

/** A full lifecycle, including a rollback deploy. The visual baseline. */
export const Resolved: Story = {
  args: { title: 'Checkout errors after v2.41.0', severity: 'critical', events: resolved },
  parameters: { docs: { description: { story: 'Alert, declaration, acknowledgement, diagnosis, a rollback deploy, mitigation and resolution: every milestone in the summary strip is filled in.' } } },
};

/** Still open: the status reads ongoing, timed to `now`. */
export const Ongoing: Story = {
  args: { title: 'Replica lag on postgres', severity: 'warning', events: ongoing },
  parameters: { docs: { description: { story: 'Acknowledged but not yet mitigated: the missing milestones read `—` and the duration runs to the fixed `now`, 42 minutes after the alert.' } } },
};

/** One event, no header. */
export const Minimal: Story = {
  args: { events: [{ id: 'm1', time: at(13, 55), kind: 'detected', title: 'Synthetic check failing in eu-west-1' }] },
  parameters: { docs: { description: { story: 'No title or severity, a single `detected` event: just the summary strip and one marker.' } } },
};
