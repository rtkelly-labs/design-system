import type { Meta, StoryObj } from '@storybook/react-vite';
import { FigureFrame, AsciiFrameRule } from '../components/docs/figures/FigureFrame';

const meta: Meta<typeof FigureFrame> = {
  title: 'Docs/Figures/FigureFrame',
  component: FigureFrame,
  tags: ['autodocs', 'stable'],
  parameters: { docs: { description: { component: 'The optional shared border and caption for one or more documentation visuals. Adapted from [mdxcn](https://github.com/keshav-exe/mdxcn/blob/2928126ba146ebbae9c2351deca27d27bb40e744/registry/default/graph-frame/graph-frame.tsx).' } } },
};

export default meta;
type Story = StoryObj<typeof FigureFrame>;

/** The frame composes a small editorial figure with a rule and supporting copy. */
export const EditorialFigure: Story = { render: () => <FigureFrame title="USAGE"><p>One figure can contain several related views.</p><AsciiFrameRule /><p className="text-content-secondary">The frame owns the border; each child owns its meaning.</p></FigureFrame> };

/** An untitled frame keeps the dashed surface available for composed content. */
export const Untitled: Story = { render: () => <FigureFrame corner="·" aria-label="Untitled demonstration"><p>A visible caption is optional when the surrounding prose provides context.</p></FigureFrame> };

/** The frame preserves its hierarchy on the light sketch level. */
export const SketchTheme: Story = { render: () => <FigureFrame title="SKETCH"><p>The same wrapper carries the selected design-system level.</p></FigureFrame>, globals: { level: 'sketch' } };
