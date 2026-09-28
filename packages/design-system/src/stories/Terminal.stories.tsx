import type { Meta, StoryObj } from '@storybook/react-vite';
import { Terminal } from '../components/docs/figures/Terminal';
import { FigureFrame } from '../components/docs/figures/FigureFrame';

const meta: Meta<typeof Terminal> = {
  title: 'Docs/Content/Terminal',
  component: Terminal,
  tags: ['autodocs', 'stable'],
  parameters: { docs: { description: { component: 'A keyboard-focusable terminal transcript for technical documentation. Adapted from [mdxcn](https://github.com/keshav-exe/mdxcn), `registry/default/terminal/terminal.tsx`.' } } },
};

export default meta;
type Story = StoryObj<typeof Terminal>;

/** Commands, comments, output, and success lines receive distinct roles. */
export const Default: Story = { args: { children: `$ pnpm test\n# running focused checks\n✓ 483 tests passed\nDone in 4.2s` }, render: (args) => <FigureFrame title="SHELL"><Terminal {...args} /></FigureFrame> };

/** The prompt can match a different shell or local terminal convention. */
export const CustomPrompt: Story = { args: { prompt: '❯', children: `❯ git diff --check\n✓ clean\n` }, render: (args) => <FigureFrame title="ZSH"><Terminal {...args} /></FigureFrame> };

/** Long output remains horizontally scrollable in the sketch level. */
export const SketchTheme: Story = { args: { children: `$ pnpm build-storybook\nOutput is intentionally preserved on one line for copying.` }, render: (args) => <FigureFrame title="SKETCH"><Terminal {...args} /></FigureFrame>, globals: { level: 'sketch' } };
