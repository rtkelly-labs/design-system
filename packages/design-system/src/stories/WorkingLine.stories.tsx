import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { WorkingLine } from '../components/WorkingLine';
import { useTraceClock } from '../hooks/useTraceClock';

const meta: Meta<typeof WorkingLine> = {
  title: 'Components/Feedback/WorkingLine',
  component: WorkingLine,
  tags: ['autodocs', 'preview'],
  parameters: {
    docs: {
      description: {
        component:
          'One line saying an agent is still working, and on what: the stepped quadrant, the current phase in words, and the elapsed time. The phase is swapped, never animated, and the quadrant is the only thing that moves (DESIGN.md §8). Finished, it settles on a mark and a word.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof WorkingLine>;

/** Every state on one page: working, waiting on a person, done and failed. */
export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <WorkingLine phase="dotnet_test · Parquet.Test" startedAt={0} now={12_400} />
      <WorkingLine status="waiting" phase="Waiting for you: push staging/5.4?" startedAt={0} now={27_300} />
      <WorkingLine status="done" summary="Rebaseline staged" duration={30_200} />
      <WorkingLine status="failed" summary="Conformance failed: pyarrow not found" duration={2400} />
    </div>
  ),
};

/** `xs` and `sm`, the sizes of `Button`'s two smallest steps, inline in a message footer. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-sm text-content-secondary">
        Rebaseline Lake.Parquet onto upstream 5.4 and stage it. <WorkingLine size="xs" phase="Replaying 38 commits" startedAt={0} now={6200} />
      </p>
      <WorkingLine size="sm" phase="Replaying 38 commits" startedAt={0} now={6200} />
    </div>
  ),
};

/** Driven by a clock, cycling demo phases until it lands. Not snapshotted: it moves. */
export const Live: Story = {
  render: function Live() {
    const [started] = useState(() => Date.now());
    const now = useTraceClock();
    const done = now - started > 9000;
    return done ? (
      <WorkingLine status="done" summary="Benchmarks compared" duration={9000} />
    ) : (
      <WorkingLine phases={['Reading the baseline', 'Running run_benchmark', 'Comparing with upstream']} interval={3000} startedAt={started} now={now} />
    );
  },
};
