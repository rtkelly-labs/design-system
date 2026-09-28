import type { Meta, StoryObj } from '@storybook/react-vite';
import { FlowDiagram } from '../components/docs/figures/FlowDiagram';
import { FigureFrame } from '../components/docs/figures/FigureFrame';

const meta: Meta<typeof FlowDiagram> = {
  title: 'Docs/Figures/FlowDiagram',
  component: FlowDiagram,
  tags: ['autodocs', 'stable'],
  parameters: { docs: { description: { component: 'Unframed process paths. Compose inside FigureFrame alongside other documentation visuals. Adapted from [mdxcn](https://github.com/keshav-exe/mdxcn/blob/2928126ba146ebbae9c2351deca27d27bb40e744/registry/default/graph-flow/graph-flow.tsx).' } } },
};

export default meta;
type Story = StoryObj<typeof FlowDiagram>;

/** Two request paths make the optimistic update and server sync legible. */
export const OptimisticUi: Story = { render: () => <FigureFrame title="OPTIMISTIC UI"><FlowDiagram><p>tap → server → update</p><p>tap → <strong>update</strong> → <em>server syncs</em></p></FlowDiagram></FigureFrame> };

/** A linear path is the compact form for a publish pipeline. */
export const PublishPath: Story = { render: () => <FigureFrame title="PUBLISH PATH"><FlowDiagram><p>write → review → ship</p></FlowDiagram></FigureFrame> };

/** The same path remains readable on the light sketch level. */
export const SketchTheme: Story = { render: () => <FigureFrame title="SKETCH"><FlowDiagram><p>draft → <strong>review</strong> → ship</p></FlowDiagram></FigureFrame>, globals: { level: 'sketch' } };
