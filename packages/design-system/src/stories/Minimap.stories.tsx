import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Minimap, type MinimapMark } from '../components/Minimap';
import { buildFlame, parseFoldedStacks } from '../lib/flame';
import { buildTrace } from '../lib/trace';
import type { ViewportRows, ViewportWindow } from '../lib/viewport';
import { serverProfileFolded } from './flameFixtures';
import { orderTrace } from './traceFixtures';

const profile = buildFlame(parseFoldedStacks(serverProfileFolded));
const flameMarks: MinimapMark[] = profile.frames.map((frame) => ({ x0: frame.x, x1: frame.x + frame.width, row: frame.depth, tone: frame.parentId === null ? 'muted' : 'neutral' }));
const trace = buildTrace(orderTrace);
const traceMarks: MinimapMark[] = trace.spans.map((span, index) => ({
  x0: span.offset / trace.duration,
  x1: (span.offset + span.duration) / trace.duration,
  row: index,
  tone: span.status === 'error' ? 'danger' : 'accent',
}));

const meta: Meta<typeof Minimap> = {
  title: 'Components/Data/Minimap',
  component: Minimap,
  tags: ['autodocs', 'experimental'],
  parameters: {
    docs: {
      description: {
        component:
          'The whole of a dense chart in a strip, with the part on screen drawn over it. A chart supplies its marks in normalised units; `Flamegraph` and `TraceWaterfall` both use it. Static SVG first; with script the window drags and the arrow keys pan it.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Minimap>;

/** A flame graph's frames, root at the bottom, with a window over a fifth of the profile and four of its levels. */
export const FlameOverview: Story = {
  args: { label: 'Profile overview', marks: flameMarks, rows: profile.maxDepth + 1, window: { start: 0.3, end: 0.5 }, rowWindow: { min: 3, max: 6 }, rowOrder: 'bottom-up' },
  parameters: { docs: { description: { story: '`markStyle="fill"` paints frames the full row height; `rowOrder="bottom-up"` puts the root at the bottom, as a flame graph draws it.' } } },
};

/** A trace's spans as thin lines, toned by outcome, with a time window and no row window. */
export const TraceOverview: Story = {
  args: { label: 'Trace overview', marks: traceMarks, rows: trace.spans.length, window: { start: 0.5, end: 0.8 }, markStyle: 'line', height: 32 },
  parameters: { docs: { description: { story: '`markStyle="line"` draws each span as a stroke centred in its row; a span too short to see still gets a pixel. Without `rowWindow` the rectangle spans the full height.' } } },
};

function Controlled() {
  const [window, setWindow] = useState<ViewportWindow>({ start: 0.2, end: 0.4 });
  const [rows, setRows] = useState<ViewportRows | null>({ min: 2, max: 5 });
  return (
    <div className="flex flex-col gap-2 font-mono text-xs">
      <Minimap
        label="Profile overview"
        marks={flameMarks}
        rows={profile.maxDepth + 1}
        window={window}
        rowWindow={rows}
        rowOrder="bottom-up"
        onWindowChange={(next, nextRows) => { setWindow(next); setRows(nextRows); }}
      />
      <p className="text-content-secondary">window {window.start.toFixed(2)}–{window.end.toFixed(2)} · rows {rows?.min}–{rows?.max}</p>
    </div>
  );
}

/** Drag the rectangle, press elsewhere to centre it, or focus it and use the arrow keys. */
export const Interactive: Story = {
  render: () => <Controlled />,
  parameters: { docs: { description: { story: 'Grabbing the rectangle keeps the grip; pressing outside it centres it there. Focused, Left and Right pan a tenth of the window (Shift for a whole one), Up and Down move the rows.' } } },
};
