import type { Meta, StoryObj } from '@storybook/react-vite';
import { Step, Steps } from '../components/docs/figures/Steps';
import { FigureFrame } from '../components/docs/figures/FigureFrame';

const meta: Meta<typeof Steps> = {
  title: 'Docs/Content/Steps',
  component: Steps,
  tags: ['autodocs', 'stable'],
  parameters: { docs: { description: { component: 'A numbered MDX procedure with current and upcoming states. Adapted from [mdxcn](https://github.com/keshav-exe/mdxcn), `registry/default/steps/steps.tsx`.' } } },
};

export default meta;
type Story = StoryObj<typeof Steps>;

/** Explicit Step children are the clearest form for authored MDX. */
export const Default: Story = { render: () => <FigureFrame title="INSTALL"><Steps><Step title="Copy">Copy the source into your repository.</Step><Step title="Register" state="now">Export it from the MDX component map.</Step><Step title="Document" state="next">Add a tested Storybook example.</Step></Steps></FigureFrame> };

/** Ordered Markdown remains available when the source is mostly prose. */
export const MarkdownList: Story = { render: () => <FigureFrame title="RELEASE"><Steps><ol><li>Write the component</li><li><strong>Run the tests</strong></li><li><em>Publish the docs</em></li></ol></Steps></FigureFrame> };

/** Procedures keep their hierarchy and state cues in sketch. */
export const SketchTheme: Story = { render: () => <FigureFrame title="SKETCH"><Steps><Step title="One" state="done">Finished.</Step><Step title="Two" state="now">In progress.</Step></Steps></FigureFrame>, globals: { level: 'sketch' } };
