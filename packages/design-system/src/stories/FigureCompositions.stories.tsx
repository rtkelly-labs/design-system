import type { Meta, StoryObj } from '@storybook/react-vite';
import { ActivityGrid, BeforeAfter, ChangeSummary, FigureFrame, FlowDiagram, GanttChart, Timeline, UptimeStrip } from '../components/docs/figures';

const meta: Meta<typeof FigureFrame> = {
  title: 'Docs/Figures/FigureCompositions',
  component: FigureFrame,
  tags: ['autodocs', 'stable'],
  parameters: { docs: { description: { component: 'Each example gives related renderers one caption and one border. The renderers stay usable on their own.' } } },
};

export default meta;
type Story = StoryObj<typeof FigureFrame>;

const activity = Array.from({ length: 42 }, (_, index) => ({
  date: new Date(Date.UTC(2026, 2, 1 + index)).toISOString().slice(0, 10),
  count: index % 7 === 0 ? 0 : (index * 3) % 5,
}));

/** A service incident places its sequence beside the health record it explains. */
export const IncidentReport: Story = {
  render: () => <FigureFrame title="CACHE INCIDENT">
    <h3 className="text-xs uppercase tracking-wide text-content-muted">Event sequence</h3>
    <Timeline events={[{ date: '14:02', label: 'p95 crossed 800ms' }, { date: '14:11', label: 'Rolled back the cache flag', state: 'now' }, { date: '14:40', label: 'Latency returned to baseline' }]} />
    <div aria-hidden="true" className="border-t border-dashed border-edge-subtle" />
    <h3 className="text-xs uppercase tracking-wide text-content-muted">Service health</h3>
    <UptimeStrip days="ok ok degraded down down degraded ok ok ok ok" from="Mar 01" to="Mar 10" columns={10} />
  </FigureFrame>,
};

/** Calendar work and publishing frequency share a single editorial caption. */
export const EditorialPlan: Story = {
  render: () => <FigureFrame title="EDITORIAL PLAN">
    <h3 className="text-xs uppercase tracking-wide text-content-muted">Schedule</h3>
    <GanttChart items={[{ label: 'Research', start: '2026-03-02', end: '2026-03-13', complete: 1 }, { label: 'Draft', start: '2026-03-09', end: '2026-03-27', complete: 0.7 }, { label: 'Review', start: '2026-03-25', end: '2026-04-03', complete: 0.3 }]} />
    <div aria-hidden="true" className="border-t border-dashed border-edge-subtle" />
    <h3 className="text-xs uppercase tracking-wide text-content-muted">Daily activity</h3>
    <ActivityGrid data={activity} weekStartsOn={1} />
  </FigureFrame>,
};

/** Release notes combine a path, signed changes, and measured impact. */
export const ReleaseOverview: Story = {
  render: () => <FigureFrame title="RELEASE 0.9">
    <FlowDiagram rows={[{ nodes: [{ label: 'write' }, { label: 'review', tone: 'accent' }, { label: 'ship' }] }]} />
    <div aria-hidden="true" className="border-t border-dashed border-edge-subtle" />
    <ChangeSummary rows={[{ label: 'docs', value: '4 pages', sign: 'add' }, { label: 'legacy', value: '2 pages', sign: 'remove' }]} />
    <BeforeAfter fromLabel="before" toLabel="after" items={[{ label: 'bundle KB', from: 160, to: 142 }]} />
  </FigureFrame>,
};
