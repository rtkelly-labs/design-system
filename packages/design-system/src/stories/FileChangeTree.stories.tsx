import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileChangeTree } from '../components/docs/figures/FileChangeTree';
import { FigureFrame } from '../components/docs/figures/FigureFrame';
import { MATH_CHANGESET } from './figures/fixtures';

const meta: Meta<typeof FileChangeTree> = {
  title: 'Docs/Figures/FileChangeTree',
  component: FileChangeTree,
  tags: ['autodocs', 'stable'],
  args: { nodes: MATH_CHANGESET },
  parameters: { docs: { description: { component: 'A changeset drawn as its directory layout. Each top-level directory is a boxed column under one connector, files hang from a ruled tree with a change mark and a one-line note, and the footer tallies the change and switches between before, the change, and after. Use it in PR write-ups and release notes where a reader needs to see *where* a change landed, not just how big it was — for sizes alone, `ChangeSummary` is lighter.' } } },
};

export default meta;
type Story = StoryObj<typeof FileChangeTree>;

/** Three directories under one connector, with added, modified and removed files marked by intent. */
export const Default: Story = { render: (args) => <FigureFrame title="WHAT CHANGED"><FileChangeTree {...args} /></FigureFrame> };

/** The `after` view drops removed files and the change marks, leaving the tree as it now stands. */
export const AfterView: Story = { args: { defaultView: 'after' }, render: (args) => <FigureFrame title="AFTER"><FileChangeTree {...args} /></FigureFrame> };

/** Labels are props, so a translated page translates the switch and the tallies too. */
export const Translated: Story = {
  args: {
    viewLabels: { before: '改前', changes: '变更', after: '改后' },
    changeLabels: { add: '新增', modify: '修改', remove: '删除', rename: '重命名' },
  },
  render: (args) => <FigureFrame title="改了什么"><FileChangeTree {...args} /></FigureFrame>,
};

/** The marks keep their intent roles against the sketch surface. */
export const SketchTheme: Story = { render: (args) => <FigureFrame title="SKETCH"><FileChangeTree {...args} /></FigureFrame>, globals: { level: 'sketch' } };
