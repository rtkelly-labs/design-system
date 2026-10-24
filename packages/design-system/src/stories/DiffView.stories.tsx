import type { Meta, StoryObj } from '@storybook/react-vite';
import { DiffView } from '../components/review/DiffView';
import { CALLGRAPH_DIFF, DUPLICATION_DIFF } from './review/fixtures';

const meta: Meta<typeof DiffView> = {
  title: 'Components/Reports/DiffView',
  component: DiffView,
  tags: ['autodocs', 'experimental'],
  parameters: {
    docs: {
      description: {
        component:
          'One file’s line diff: a summary row with path, count and bar, then hunks with baseline and candidate line numbers. A changed row is marked by its sign column as well as its ground, so it survives greyscale printing; colours are the `delta` roles.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DiffView>;

/** Open, with three hunks. */
export const Default: Story = { args: { path: 'metrics/duplication.txt', hunks: DUPLICATION_DIFF, defaultOpen: true } };

/** Folded files stacked as a report lists them, bars on one scale. */
export const Folded: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <DiffView path="metrics/duplication.txt" hunks={DUPLICATION_DIFF} max={4} />
      <DiffView path="callgraph/Parquet.SourceGenerator.callgraph.txt" hunks={CALLGRAPH_DIFF} max={4} defaultOpen wrap />
    </div>
  ),
};

/** Open on `sketch`, where the tinted grounds are the ones to check. */
export const SketchTheme: Story = { ...Default, globals: { level: 'sketch' } };
