import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChangeBar } from '../components/review/ChangeBar';
import { ChangeCount } from '../components/review/ChangeCount';

const meta: Meta<typeof ChangeCount> = {
  title: 'Components/Reports/ChangeCount',
  component: ChangeCount,
  tags: ['autodocs', 'experimental'],
  parameters: {
    docs: {
      description: {
        component:
          'The size of a change as `+77 −50`, in the `delta` roles. Change, not meaning: the added count is green because it was added, not because adding is good. Screen readers hear the words rather than the signs.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChangeCount>;

/** A pull request's derived files, in lines. */
export const Default: Story = { args: { added: 77, removed: 50, noun: ['line', 'lines'] } };

/** With a moved count, for renames or reorders in an ordered sequence. */
export const WithMoves: Story = { args: { added: 12, removed: 3, moved: 4, noun: ['record', 'records'] } };

/** Beside a `ChangeBar` on a shared scale, the pairing an index row uses. */
export const WithBar: Story = {
  render: () => (
    <div className="flex flex-col gap-2 font-mono text-sm">
      {[
        ['Legacy.metrics.txt', 26, 17],
        ['metrics.txt', 23, 14],
        ['duplication.txt', 2, 2],
      ].map(([name, a, d]) => (
        <div key={name as string} className="grid grid-cols-[14rem_6rem_auto] items-center gap-3">
          <span>{name}</span>
          <ChangeCount added={a as number} removed={d as number} />
          <ChangeBar added={a as number} removed={d as number} max={43} />
        </div>
      ))}
    </div>
  ),
};

/** The pairing on `sketch`. */
export const SketchTheme: Story = { ...WithBar, globals: { level: 'sketch' } };
