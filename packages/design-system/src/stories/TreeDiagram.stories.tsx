import type { Meta, StoryObj } from '@storybook/react-vite';
import { TreeDiagram } from '../components/docs/figures/TreeDiagram';
import { FigureFrame } from '../components/docs/figures/FigureFrame';

const meta: Meta<typeof TreeDiagram> = {
  title: 'Docs/Figures/TreeDiagram',
  component: TreeDiagram,
  tags: ['autodocs', 'stable'],
  parameters: { docs: { description: { component: 'A compact nested tree for files, modules, and systems. Adapted from [mdxcn](https://github.com/keshav-exe/mdxcn), `registry/default/graph-tree/graph-tree.tsx`.' } } },
};

export default meta;
type Story = StoryObj<typeof TreeDiagram>;

/** Nested Markdown lists are rendered as a readable file tree. */
export const Default: Story = { render: () => <FigureFrame title="FILES"><TreeDiagram><ul><li><strong>src</strong><ul><li>FlowDiagram.tsx — 8 KB</li><li>TreeDiagram.tsx — 7 KB</li></ul></li></ul></TreeDiagram></FigureFrame> };

/** Typed nodes are useful for generated trees with metadata. */
export const ExplicitNodes: Story = { args: { nodes: [{ label: 'platform', children: [{ label: 'api', meta: 'stable', accent: true }, { label: 'worker', meta: 'preview' }] }] }, render: (args) => <FigureFrame title="MODULES"><TreeDiagram {...args} /></FigureFrame> };

/** The tree keeps its branch structure against the sketch surface. */
export const SketchTheme: Story = { args: { nodes: [{ label: 'docs', children: [{ label: 'index.mdx' }] }] }, render: (args) => <FigureFrame title="SKETCH"><TreeDiagram {...args} /></FigureFrame>, globals: { level: 'sketch' } };
