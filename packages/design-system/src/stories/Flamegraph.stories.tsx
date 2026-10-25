import type { Meta, StoryObj } from '@storybook/react-vite';
import { Flamegraph } from '../components/Flamegraph';
import { buildFlame, flameFromTrace, parseFoldedStacks } from '../lib/flame';
import { deepStackFolded, frameIdByName, ordersCandidateFolded, ordersProfileFolded, PLACE_ORDER_FRAME, SERIALIZER_LEAF_FRAME } from './flameFixtures';
import { checkoutTrace } from './traceFixtures';

const ordersProfile = buildFlame(parseFoldedStacks(ordersProfileFolded));
const ordersCandidate = buildFlame(parseFoldedStacks(ordersCandidateFolded));
const deepStack = buildFlame(parseFoldedStacks(deepStackFolded));

const meta: Meta<typeof Flamegraph> = {
  title: 'Components/Data/Flamegraph',
  component: Flamegraph,
  tags: ['autodocs', 'experimental'],
  parameters: {
    docs: {
      description: {
        component:
          'A flame graph over a sampled profile (Brendan Gregg folded stacks) or a trace weighted by self time. Static-first SVG: frames, labels and a native tooltip render with no script; with script it measures itself, zooms on click with a breadcrumb back out, and draws a richer tooltip. `mode="diff"` paints each frame on the delta roles by its change against a baseline.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Flamegraph>;

/** A CPU profile of an ASP.NET Core order handler: database reads, pricing and JSON dominate. */
export const CpuProfile: Story = {
  args: { profile: ordersProfile },
  parameters: { docs: { description: { story: 'About 1,700 samples of `POST /orders`, frames sorted by name as in a classic flame graph. Hover or focus a frame for its total, self time and share; click to zoom.' } } },
};

/** The same profile hanging from the top, for pages that read downward. */
export const Icicle: Story = {
  args: { profile: ordersProfile, orientation: 'icicle' },
  parameters: { docs: { description: { story: '`orientation="icicle"` puts the root at the top. Up and Down on the keyboard follow the drawing, so they flip with it.' } } },
};

/** Zoomed into `OrderService.PlaceAsync`, with the breadcrumb back out. */
export const Zoomed: Story = {
  args: { profile: ordersProfile, defaultZoomedId: frameIdByName(ordersProfile, PLACE_ORDER_FRAME) },
  parameters: { docs: { description: { story: 'The zoom target spans the full width; its ancestors stay drawn beneath it as context. `defaultZoomedId` sets it, so a static report can ship a zoomed view.' } } },
};

/** Searching highlights matching frames and reports the share of the profile beneath them. */
export const Search: Story = {
  args: { profile: ordersProfile, search: 'System.Text.Json' },
  parameters: { docs: { description: { story: 'Every frame whose name contains `System.Text.Json` takes the accent fill; the status line counts nested matches once, so the percentage is a real share of the profile.' } } },
};

/** A distributed trace drawn as a flame chart, weighted by each span’s self time. */
export const FromTrace: Story = {
  args: { profile: flameFromTrace(checkoutTrace) },
  parameters: { docs: { description: { story: '`flameFromTrace` turns the checkout trace from `TraceWaterfall` into frames in start order. Width is span time beneath a frame — work, not wall clock — so the payment call, whose children overlapped, is wider than its 188ms.' } } },
};

/** The candidate against the baseline: the response serializer about 30% slower, and a new fraud screen. */
export const Diff: Story = {
  args: { profile: ordersCandidate, baseline: ordersProfile, mode: 'diff' },
  parameters: { docs: { description: { story: 'Widths come from the candidate. The serializer’s leaves take the solid `delta-added` fill — more time, past the 25% mark — and `FraudScreen.Evaluate` is new, so it carries a dashed edge. Run-to-run noise stays under the 5% threshold and is drawn unchanged.' } } },
};

/** A phone-width column: the container query, not the viewport, decides — so the story pins the column. */
const phone = (Story: () => React.JSX.Element) => (
  <div className="w-[390px] max-w-full">
    <Story />
  </div>
);

/** The profile in a 390px column: a label-free icicle overview, and the hottest frames listed beneath it. */
export const Mobile: Story = {
  args: { profile: ordersProfile },
  decorators: [phone],
  parameters: { docs: { description: { story: 'Below 560px of container width the graph is bars only, 22px rows root on top, and the frame list carries the names: each row the full name wrapping at `.` and `(`, its self share and a bar. Tap a bar or a row to select it — its stack stays bright, the rest dims, and its numbers open under the graph with a “Zoom to frame” button. Pinch or double-tap to zoom; drag sideways to pan.' } } },
};

/** The diff in a 390px column: the list ranks frames by the size of their change. */
export const DiffMobile: Story = {
  args: { profile: ordersCandidate, baseline: ordersProfile, mode: 'diff' },
  decorators: [phone],
  parameters: { docs: { description: { story: 'Bars keep their delta colours. Each list row carries one number — the change in self time — and its colour; the colour key sits behind “Key”.' } } },
};

/** The diff opening on its biggest change, with the serializer's hot leaf selected. */
export const DiffMobileSelected: Story = {
  args: {
    profile: ordersCandidate,
    baseline: ordersProfile,
    mode: 'diff',
    defaultWindow: 'hottest',
    defaultSelectedId: frameIdByName(ordersCandidate, SERIALIZER_LEAF_FRAME),
  },
  decorators: [phone],
  parameters: { docs: { description: { story: '`defaultWindow="hottest"` fits the grandparent of the leaf that changed most — here `ObjectResultExecutor.ExecuteAsync`, two levels above `WriteStringValue` — and `defaultSelectedId` selects that leaf, so the page opens on the regression with its stack lit and its row highlighted. Reset returns here; “Fit all” shows everything.' } } },
};

/** A numeric opening window: the middle fifth of the profile, with the minimap showing where it sits. */
export const ZoomedWindow: Story = {
  args: { profile: ordersProfile, defaultWindow: [0.4, 0.6] },
  parameters: { docs: { description: { story: '`defaultWindow={[0.4, 0.6]}` opens on 20% of the profile. Frames crossing the edges are clipped, their labels kept on the visible part; the minimap above marks the window and drags to pan. A static render shows the same view.' } } },
};

/** A 44-level recursive descent parser, opened on a depth window with levels hidden above and below. */
export const DeepStack: Story = {
  args: { profile: deepStack, defaultDepth: [14, 30] },
  parameters: { docs: { description: { story: 'A rules endpoint whose parser recurses `ParseExpression → ParseTerm → ParseFactor` per nested parenthesis. `defaultDepth={[14, 30]}` shows seventeen levels; `▲` and `▼` count the rest and pan to them, and the minimap marks the window on both axes. Alt+wheel, a vertical pinch or the levels buttons change how many show.' } } },
};

/** The frame list at desktop width, beside the full graph. */
export const WithFrameList: Story = {
  args: { profile: ordersCandidate, baseline: ordersProfile, mode: 'diff', list: 'always' },
  parameters: { docs: { description: { story: '`list="always"` keeps the ranked list at every width — a reading order for a review, where the graph is the map.' } } },
};
