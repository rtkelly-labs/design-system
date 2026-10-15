import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SegmentedControl, SegmentedControlItem } from '../components/SegmentedControl';

const meta: Meta<typeof SegmentedControl> = {
  title: 'Components/Actions & Forms/Segmented Control',
  component: SegmentedControl,
  tags: ['autodocs', 'stable'],
  argTypes: {
    size: { control: 'inline-radio', options: ['xs', 'sm'] },
  },
};

export default meta;
type Story = StoryObj<typeof SegmentedControl>;

/**
 * A view switcher: one of a few related choices, all visible at once. It is a
 * `radiogroup`, so `Tab` enters it once and the arrow keys move and select.
 * It is not a tab strip: nothing here owns a panel, which is exactly why it
 * does not emit the `aria-controls` that a panel-less `Tabs` leaves dangling.
 */
export const Default: Story = {
  args: { label: 'Calendar view', defaultValue: 'week' },
  render: (args) => (
    <SegmentedControl {...args}>
      <SegmentedControlItem value="week">WEEK</SegmentedControlItem>
      <SegmentedControlItem value="day">DAY</SegmentedControlItem>
      <SegmentedControlItem value="month">MONTH</SegmentedControlItem>
      <SegmentedControlItem value="agenda">AGENDA</SegmentedControlItem>
    </SegmentedControl>
  ),
};

/**
 * The `sm` height, 40px, to sit beside a `Button` of the same size. The
 * default `xs` is 28px and pairs with `Button` `xs`. Selection is the strong
 * edge and the primary ink for now; the final selection device is an open
 * design decision.
 */
export const Small: Story = {
  args: { label: 'Saved view', size: 'sm', defaultValue: 'all' },
  render: (args) => (
    <SegmentedControl {...args}>
      <SegmentedControlItem value="all">ALL</SegmentedControlItem>
      <SegmentedControlItem value="mine">MINE</SegmentedControlItem>
      <SegmentedControlItem value="unread">UNREAD</SegmentedControlItem>
    </SegmentedControl>
  ),
};

/**
 * Controlled, for a switcher that filters a list somewhere else on the page:
 * the saved views of an inbox. Pass `value` and `onValueChange` together.
 * One option can be disabled on its own.
 */
export const Controlled: Story = {
  render: function ControlledSegmented() {
    const [value, setValue] = useState('mine');
    return (
      <div className="flex flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-widest text-content-muted">
          Showing: {value}
        </p>
        <SegmentedControl label="Saved views" value={value} onValueChange={setValue}>
          <SegmentedControlItem value="all">ALL</SegmentedControlItem>
          <SegmentedControlItem value="mine">MINE</SegmentedControlItem>
          <SegmentedControlItem value="unread">UNREAD</SegmentedControlItem>
          <SegmentedControlItem value="archived" disabled>
            ARCHIVED
          </SegmentedControlItem>
        </SegmentedControl>
      </div>
    );
  },
};
