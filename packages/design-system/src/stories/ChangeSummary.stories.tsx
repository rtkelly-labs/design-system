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

/**
 * With a direction, each row reads as better or worse, and its relative size says how much that
 * matters: the bundle grew 18% (major, worse), the cold start fell 6% (better), and the 0.4% on
 * shared code is within noise.
 */
export const Directed: Story = {
  render: () => (
    <FigureFrame title="BUNDLE">
      <ChangeSummary direction="lower-is-better">
        <ul>
          <li>runtime: +12 kb (+18%)</li>
          <li>legacy: -8 kb (-6%)</li>
          <li>shared: +0.2 kb (+0.4%)</li>
          <li><strong>total: +4.2 kb (+3.1%)</strong></li>
        </ul>
      </ChangeSummary>
    </FigureFrame>
  ),
};

/** Rows can each declare their own direction: throughput is better higher, latency and memory lower. */
export const MixedDirections: Story = {
  args: {
    rows: [
      { label: 'throughput', value: '+1.2k rows/s', sign: 'add', relative: 0.14, direction: 'higher-is-better' },
      { label: 'p99 latency', value: '+38 ms', sign: 'add', relative: 0.22, direction: 'lower-is-better' },
      { label: 'allocated', value: '-3.1 MB', sign: 'remove', relative: -0.04, direction: 'lower-is-better' },
      { label: 'gen-2 GCs', value: '+1', sign: 'add', relative: 0.01, direction: 'lower-is-better' },
    ],
  },
  render: (args) => <FigureFrame title="PARQUET WRITE"><ChangeSummary {...args} /></FigureFrame>,
};

/** The same diff remains legible in the sketch level. */
export const SketchTheme: Story = { render: () => <FigureFrame title="SKETCH"><ChangeSummary><ul><li>added: +3</li><li>removed: -1</li></ul></ChangeSummary></FigureFrame>, globals: { level: 'sketch' } };
