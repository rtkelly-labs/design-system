import type { Meta, StoryObj } from '@storybook/react-vite';
import { ButtonGroup } from '../components/ButtonGroup';
import { Menu, MenuItem } from '../components/Menu';
import { Toolbar, ToolbarButton, ToolbarSeparator } from '../components/Toolbar';

const meta: Meta<typeof Toolbar> = {
  title: 'Components/Actions & Forms/Toolbar',
  component: Toolbar,
  tags: ['autodocs', 'stable'],
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
  },
};

export default meta;
type Story = StoryObj<typeof Toolbar>;

/**
 * A bulk-action bar: three or more related controls that are one tab stop.
 * `Tab` enters the bar once; the arrow keys move between the controls and wrap
 * at the ends. A control that opens a menu joins by making its trigger a
 * `ToolbarButton`.
 */
export const Default: Story = {
  args: { label: 'Bulk actions' },
  render: (args) => (
    <Toolbar {...args}>
      <span className="font-mono text-sm font-bold uppercase text-content-primary">
        [&nbsp;3 SELECTED&nbsp;]
      </span>
      <ButtonGroup aria-label="Apply to selection">
        <Menu trigger={<ToolbarButton size="xs">STATUS</ToolbarButton>}>
          <MenuItem>Open</MenuItem>
          <MenuItem>Closed</MenuItem>
        </Menu>
        <ToolbarButton size="xs" variant="secondary">
          ARCHIVE
        </ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton size="xs">CLEAR</ToolbarButton>
      </ButtonGroup>
    </Toolbar>
  ),
};

/**
 * A vertical bar, unframed, whose items are `bare`: plain buttons carrying only
 * the roving focus, styled by the caller. `ArrowUp` and `ArrowDown` move.
 */
export const Vertical: Story = {
  args: { label: 'Activity bar', orientation: 'vertical', framed: false },
  render: (args) => (
    <Toolbar {...args} className="w-24 border-2 border-edge-strong bg-surface-raised">
      {['Explorer', 'Search', 'Source'].map((name) => (
        <ToolbarButton
          key={name}
          bare
          className="px-2 py-2 text-left font-mono text-xs uppercase text-content-muted hover:text-content-primary"
        >
          {name}
        </ToolbarButton>
      ))}
    </Toolbar>
  ),
};
