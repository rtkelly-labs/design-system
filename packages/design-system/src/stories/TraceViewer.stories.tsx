import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { TextArea } from '../components/Input';
import { parseTraceDocument } from '../lib/trace';
import { TraceViewer } from '../components/TraceViewer';
import { useTraceClock } from '../hooks/useTraceClock';
import { checkoutTrace, deployTrace, orderTrace } from './traceFixtures';
import { githubRunToSpans } from '../lib/ciTrace';
import { mainRedRun, observabilityRun, reportsRun } from './ciRunFixtures';

const meta: Meta<typeof TraceViewer> = {
  title: 'Components/Data/TraceViewer',
  component: TraceViewer,
  tags: ['autodocs', 'preview'],
  parameters: {
    docs: {
      description: {
        component:
          'A trace viewer: summary strip, filterable `TraceWaterfall`, and the selected span’s timing, self time, status and attributes. Pair with `useTraceClock` for a live trace, and `parseTraceDocument` to load OTLP/JSON.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof TraceViewer>;

/** A failing checkout request with the payment span selected. */
export const Checkout: Story = {
  args: { spans: checkoutTrace, title: 'GET /checkout · 4f2a91', defaultSelectedId: 'e1' },
  parameters: { docs: { description: { story: 'The payment span is selected: its self time, status and attributes show beside the waterfall.' } } },
};

/** Played back in real time, with transport controls. Not snapshotted: it moves. */
export const Replay: Story = {
  args: { spans: orderTrace, title: 'POST /orders · replay', replay: true, autoPlay: true, loop: true, defaultSelectedId: 's6' },
  parameters: { docs: { description: { story: 'With `replay`, the trace plays back as it was recorded: rows fade in as spans start and bars grow to a playhead. Pause, scrub, restart, or change speed from the transport; the summary counts only what has happened so far.' } } },
};

/** Replay controls on a still trace: press Play to watch it unfold. */
export const ReplayControls: Story = {
  args: { spans: checkoutTrace, title: 'GET /checkout · 4f2a91', replay: true, defaultSelectedId: 'e1' },
  parameters: { docs: { description: { story: 'The transport without autoplay. The full trace shows until Play is pressed; the scrubber jumps to any moment.' } } },
};

/** Nothing selected and no filter field, for embedding in a smaller panel. */
export const Compact: Story = {
  args: { spans: checkoutTrace, title: 'checkout', defaultSelectedId: null, searchable: false },
  parameters: { docs: { description: { story: 'Without search and with nothing selected — the details panel prompts for a selection.' } } },
};

function LiveDeploy() {
  const [start] = useState(() => Date.now() - 6600);
  const now = useTraceClock({ interval: 100 });
  return <TraceViewer spans={deployTrace(start)} now={now} title="deploy web@4f2a" defaultSelectedId="p4" />;
}

/** A pipeline still running. Not snapshotted: it moves. */
export const Live: Story = {
  render: () => <LiveDeploy />,
  parameters: { docs: { description: { story: 'Two steps are in flight; the duration, the in-flight count and their bars update as the clock ticks.' } } },
};

const SAMPLE = JSON.stringify(checkoutTrace.slice(0, 5), null, 2);

function TracePlayground() {
  const [text, setText] = useState(SAMPLE);
  const spans = useMemo(() => parseTraceDocument(text), [text]);
  return (
    <div className="flex flex-col gap-4">
      <TextArea
        label="Trace JSON"
        helperText="OTLP/JSON ({ resourceSpans }), an array of spans, { spans }, or one JSON document per line."
        rows={10}
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="font-mono text-xs"
      />
      <TraceViewer spans={spans} title={`${spans.length} parsed spans`} />
    </div>
  );
}

/** Paste a trace and see it drawn. Not snapshotted: it is a tool, not a state. */
export const Playground: Story = {
  render: () => <TracePlayground />,
  parameters: { docs: { description: { story: 'Paste an exported trace — from an OpenTelemetry collector’s file exporter, or spans written by hand — and the viewer redraws as you type. Broken lines are skipped, so a half-pasted stream still renders.' } } },
};

const mainRedSpans = githubRunToSpans(mainRedRun.run, mainRedRun.jobs);
const observabilitySpans = githubRunToSpans(observabilityRun.run, observabilityRun.jobs);
const reportsSpans = githubRunToSpans(reportsRun.run, reportsRun.jobs);

/** A real red run on main, read through `githubRunToSpans`: run → job → step. */
export const CiRunFailed: Story = {
  args: { spans: mainRedSpans, title: 'CI · main · 27f9544', defaultSelectedId: 'job-' + String(mainRedRun.jobs.find((job) => job.name === 'visual (3)')?.id) },
  parameters: { docs: { description: { story: 'A GitHub Actions run is a trace: the run is the root, each job a child, each step a grandchild. `visual (3)` is selected — the shard that failed, and with it the `ci` gate that waits on every shard. The critical path marks the job that decided how long the run took.' } } },
};

/** A green pull-request run, with the time each job waited for a runner. */
export const CiRunGreen: Story = {
  args: { spans: observabilitySpans, title: 'CI · PR 419 · 40dabc7', defaultSelectedId: null },
  parameters: { docs: { description: { story: 'Every job passed. Read the waterfall for where the four minutes went: the visual shards are the long pole, and `verdict` and `ci` wait on all three.' } } },
};

/** The Reports workflow played back as it ran. Not snapshotted: it moves. */
export const CiRunReplay: Story = {
  args: { spans: reportsSpans, title: 'Reports · replay', replay: true, autoPlay: true, loop: true, defaultSelectedId: null },
  parameters: { docs: { description: { story: 'A finished run replayed with `replay`: jobs appear as runners pick them up and steps grow to the playhead, the way the run looked while it was live.' } } },
};
