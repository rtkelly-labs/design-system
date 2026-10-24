import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChangeBar } from '../components/review/ChangeBar';

const meta: Meta<typeof ChangeBar> = {
  title: 'Components/Reports/ChangeBar',
  component: ChangeBar,
  tags: ['autodocs', 'experimental'],
  parameters: {
    docs: {
      description: {
        component:
          'The share of a change, added then removed, on a track scaled to the largest change beside it. SVG geometry rather than an inline style, filled with the `delta` roles; decorative unless given a `label`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChangeBar>;

/** One change filling its own track. */
export const Default: Story = { args: { added: 26, removed: 17 } };

/** Three bars on one scale, so the smallest reads as small. */
export const SharedScale: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <ChangeBar added={26} removed={17} max={43} label="26 added, 17 removed" />
      <ChangeBar added={8} removed={5} max={43} label="8 added, 5 removed" />
      <ChangeBar added={1} removed={2} max={43} label="1 added, 2 removed" />
    </div>
  ),
};

/** The scale on `sketch`. */
export const SketchTheme: Story = { ...SharedScale, globals: { level: 'sketch' } };
