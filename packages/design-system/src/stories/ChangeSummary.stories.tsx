import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChangeSummary } from '../components/docs/figures/ChangeSummary';
import { FigureFrame } from '../components/docs/figures/FigureFrame';

const meta: Meta<typeof ChangeSummary> = {
  title: 'Docs/Figures/ChangeSummary',
  component: ChangeSummary,
  tags: ['autodocs', 'stable'],
  parameters: { docs: { description: { component: 'A readable additions/removals summary for technical writing. Adapted from [mdxcn](https://github.com/keshav-exe/mdxcn), `registry/default/graph-diff/graph-diff.tsx`.' } } },
};

export default meta;
type Story = StoryObj<typeof ChangeSummary>;

/** Markdown signs are promoted to semantic add, remove, and keep rows. */
export const Default: Story = { render: () => <FigureFrame title="BUNDLE"><ChangeSummary><ul><li>runtime: +12 kb</li><li>legacy: -8 kb</li><li>shared: 4 kb</li><li><strong>total: 8 kb</strong></li></ul></ChangeSummary></FigureFrame> };

/** Typed rows are appropriate for generated release notes. */
export const ExplicitRows: Story = { args: { palette: 'multi', rows: [{ label: 'added', value: '4 files', sign: 'add' }, { label: 'removed', value: '1 file', sign: 'remove' }, { label: 'unchanged', value: '12 files' }], footer: { label: 'total', value: '17 files', sign: 'keep' } }, render: (args) => <FigureFrame title="CHANGESET"><ChangeSummary {...args} /></FigureFrame> };

/** The same diff remains legible in the sketch level. */
export const SketchTheme: Story = { render: () => <FigureFrame title="SKETCH"><ChangeSummary><ul><li>added: +3</li><li>removed: -1</li></ul></ChangeSummary></FigureFrame>, globals: { level: 'sketch' } };
