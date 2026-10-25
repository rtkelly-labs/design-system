import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { AlertList, type Alert } from '../components/AlertList';
import { Button } from '../components/Button';

const now = Date.UTC(2026, 9, 22, 14, 0);
const minutes = (count: number) => now - count * 60_000;

const mixed: Alert[] = [
  { id: 'a1', name: 'HighErrorRate', state: 'firing', severity: 'critical', since: minutes(12), service: 'checkout-api', summary: '5xx responses above 2% for 5 minutes.', value: '4.2%', threshold: '2%', trend: [0.4, 0.5, 0.6, 1.1, 2.4, 3.1, 3.8, 4.2] },
  { id: 'a2', name: 'LatencyP99High', state: 'firing', severity: 'warning', since: minutes(41), service: 'search', summary: 'p99 latency over budget.', value: '1.8s', threshold: '1.2s', trend: [0.9, 1.0, 1.3, 1.5, 1.4, 1.7, 1.8] },
  { id: 'a3', name: 'DiskAlmostFull', state: 'pending', severity: 'warning', since: minutes(3), service: 'postgres-primary', summary: 'Volume /data at 88%.', value: '88%', threshold: '90%', trend: [80, 82, 83, 85, 86, 88] },
  { id: 'a4', name: 'CertificateExpiry', state: 'silenced', severity: 'info', since: minutes(180), service: 'edge', summary: 'TLS certificate expires in 12 days.', value: '12d', threshold: '14d' },
  { id: 'a5', name: 'QueueBacklog', state: 'resolved', severity: 'critical', since: minutes(25), service: 'billing-worker', summary: 'Backlog drained after scale-out.', value: '120', threshold: '5000', trend: [7200, 6800, 5100, 3000, 900, 120] },
  { id: 'a6', name: 'PodCrashLooping', state: 'resolved', severity: 'warning', since: minutes(95), service: 'notifications', trend: [4, 5, 3, 1, 0, 0] },
  { id: 'a7', name: 'ReplicaLagHigh', state: 'resolved', severity: 'info', since: minutes(190), service: 'postgres-replica', value: '0.2s', threshold: '5s' },
];

const meta: Meta<typeof AlertList> = {
  title: 'Components/Data/AlertList',
  component: AlertList,
  tags: ['autodocs', 'preview'],
  args: { now },
  parameters: {
    docs: {
      description: {
        component:
          'An alert inbox: firing, pending, silenced, then resolved, critical first within each, with a header of per-state counts that double as filter toggles (`aria-pressed`). Each row carries the state badge, severity, rule, service, summary, value against threshold, an optional trend and how long the alert has been in its state at `now`. Selectable rows are buttons with a roving tab stop — Up/Down/Home/End move, Enter selects — and `renderActions` places row actions beside the button, never inside it.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof AlertList>;

/** Every state at once, with trends. The visual baseline. */
export const Mixed: Story = {
  args: { alerts: mixed },
  parameters: { docs: { description: { story: 'Two firing alerts (one critical), one pending, one silenced and three resolved, at a fixed `now` so every duration renders the same.' } } },
};

/** Acknowledge and Silence beside each active alert. */
export const WithActions: Story = {
  args: {
    alerts: mixed.filter((alert) => alert.state !== 'resolved'),
    renderActions: (alert) => alert.state === 'firing' || alert.state === 'pending' ? (
      <>
        <Button appearance="raised" size="sm" variant="secondary">ACK</Button>
        <Button appearance="raised" size="sm">SILENCE</Button>
      </>
    ) : null,
  },
  parameters: { docs: { description: { story: '`renderActions` returns buttons for firing and pending alerts. They sit in a sibling of the row, so nothing interactive nests.' } } },
};

/** Nothing matches: the success-toned empty state. */
export const AllClear: Story = {
  args: { alerts: mixed.filter((alert) => alert.state === 'resolved'), defaultStateFilter: ['firing'] },
  parameters: { docs: { description: { story: 'Only resolved alerts remain and the list is filtered to firing, so it says `No alerts firing.` in the success role. Clear the toggle to see the resolved ones.' } } },
};

function SelectableList() {
  const [selected, setSelected] = useState<string | null>('a2');
  const alert = mixed.find((entry) => entry.id === selected);
  return (
    <div className="flex flex-col gap-3">
      <AlertList alerts={mixed} now={now} selectedId={selected} onSelectedChange={setSelected} />
      <p className="font-mono text-sm text-content-secondary">Selected: {alert ? alert.name : 'none'}</p>
    </div>
  );
}

/** Rows as a keyboard-navigable list of buttons, selection controlled. */
export const Selectable: Story = {
  render: () => <SelectableList />,
  parameters: { docs: { description: { story: 'Controlled selection. Tab into the list, move with Up/Down/Home/End and press Enter; the selected row takes the primary accent edge.' } } },
};
