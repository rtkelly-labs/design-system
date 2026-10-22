import type { Meta, StoryObj } from '@storybook/react-vite';
import { TimeRangePicker, TimeRangeProvider, useTimeCursor, useTimeRange } from '../components/TimeRange';
import { formatClock } from '../lib/timeRange';

const NOW = Date.UTC(2026, 9, 22, 14, 0);

const meta: Meta<typeof TimeRangePicker> = {
  title: 'Components/Data/TimeRangePicker',
  component: TimeRangePicker,
  tags: ['autodocs', 'preview'],
  decorators: [(Story) => <TimeRangeProvider now={NOW}><Story /></TimeRangeProvider>],
  parameters: {
    docs: {
      description: {
        component:
          'The preset strip for the window every observability view on a page shares, read from and written to the nearest `TimeRangeProvider`. When a chart zooms the window it shows `Zoomed` and a reset back to the last preset. Times are UTC, formatted by hand, so a static export hydrates.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof TimeRangePicker>;

/** The default: the last hour, ending at the provider's `now`. */
export const LastHour: Story = {
  parameters: { docs: { description: { story: 'Presets from 15 minutes to 7 days; the last hour is selected and resolves to 13:00–14:00 UTC.' } } },
};

function ZoomDemo() {
  const state = useTimeRange()!;
  return (
    <div className="flex flex-col gap-3">
      <TimeRangePicker />
      <button type="button" className="w-fit cursor-pointer border border-edge-default px-2 py-1 font-mono text-xs" onClick={() => state.setRange({ from: NOW - 40 * 60_000, to: NOW - 22 * 60_000 })}>
        Zoom to 13:20–13:38, as a chart brush would
      </button>
    </div>
  );
}

/** A chart brushed a custom window: the picker says so and offers a way back. */
export const Zoomed: Story = {
  render: () => <ZoomDemo />,
  parameters: { docs: { description: { story: 'Press the button to stand in for a brush on a chart: the preset deselects, `Zoomed · 18m` appears, and Reset returns to the last preset.' } } },
};

function CursorDemo() {
  const cursor = useTimeCursor()!;
  const range = useTimeRange()!;
  const marks = [0.2, 0.5, 0.8].map((f) => range.range.from + f * (range.range.to - range.range.from));
  return (
    <div className="flex flex-col gap-3 font-mono text-xs">
      <TimeRangePicker />
      <div className="flex gap-2">
        {marks.map((time) => (
          <button key={time} type="button" className="cursor-pointer border border-edge-default px-2 py-1" onMouseEnter={() => cursor.setCursor(time)} onFocus={() => cursor.setCursor(time)} onMouseLeave={() => cursor.setCursor(null)} onBlur={() => cursor.setCursor(null)}>
            {formatClock(time)}
          </button>
        ))}
      </div>
      <span className="text-content-secondary">Shared cursor: {cursor.cursor === null ? 'none' : formatClock(cursor.cursor)}</span>
    </div>
  );
}

/** The hover cursor lives beside the range, in its own context. */
export const SharedCursor: Story = {
  render: () => <CursorDemo />,
  parameters: { docs: { description: { story: 'Hover or focus a time to set the shared cursor that every chart, heatmap and log list on the page draws. It is a separate context, so moving it never re-renders the picker.' } } },
};
