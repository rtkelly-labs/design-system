import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ToolCall, ToolCallGroup } from '../components/ToolCall';
import { useTraceClock } from '../hooks/useTraceClock';

const meta: Meta<typeof ToolCall> = {
  title: 'Components/Data/ToolCall',
  component: ToolCall,
  subcomponents: { ToolCallGroup },
  tags: ['autodocs', 'preview'],
  parameters: {
    docs: {
      description: {
        component:
          'One tool call an agent made: a single line by default (the tool name in mono, a summary in words, its state as a mark and a word, and how long it took), opening to what the call was given and what came back. `ToolCallGroup` folds consecutive calls into one line and carries the region’s one live mark and one live region (DESIGN.md §8, §9).',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof ToolCall>;

const TEST_ARGS = { project: 'src/Parquet.Test', configuration: 'Release', filter: 'Category!=Slow' };
const TEST_RESULT = { passed: 2406, failed: 0, skipped: 6, durationSeconds: 8.8 };

/** A finished call, collapsed: the one line most of a transcript is made of. */
export const Done: Story = {
  args: { name: 'dotnet_test', summary: 'Parquet.Test, 2,412 tests', status: 'ok', duration: 8800, args: TEST_ARGS, result: TEST_RESULT },
};

/** Open: what the call was given and what came back, each with a copy action. */
export const Open: Story = {
  args: { ...Done.args, defaultOpen: true },
};

/** A failure says why in the row, and opens to the arguments, the error and a retry. */
export const Failed: Story = {
  args: {
    name: 'conformance',
    summary: 'parquet-cpp, both directions',
    status: 'error',
    duration: 2400,
    args: { suite: 'Lake.Parquet.Conformance', direction: 'both' },
    error: 'pyarrow not found on PATH',
    onRetry: () => undefined,
    defaultOpen: true,
  },
};

/** A long result is capped at `maxLines` with a plain "show all", never faded out. */
export const LongResult: Story = {
  args: {
    name: 'read_file',
    summary: 'docs/changes/0026-column-statistics.md',
    status: 'ok',
    duration: 120,
    args: { path: 'docs/changes/0026-column-statistics.md' },
    result: Array.from({ length: 40 }, (_, line) => `${String(line + 1).padStart(2, '0')}  record line ${line + 1}`).join('\n'),
    maxLines: 8,
    defaultOpen: true,
  },
};

/**
 * Five calls folded into one line, one of them failed and one still running.
 * The header steps the quadrant; the running row inside holds it still.
 */
export const Group: Story = {
  render: () => (
    <ToolCallGroup>
      <ToolCall name="lake_stack_check" summary="stack rules" status="ok" duration={900} />
      <ToolCall name="dotnet_test" summary="Parquet.Test, 2,412 tests" status="ok" duration={8800} args={TEST_ARGS} result={TEST_RESULT} />
      <ToolCall name="conformance" summary="parquet-cpp, both directions" status="error" duration={2400} error="pyarrow not found on PATH" />
      <ToolCall name="conformance" summary="retry inside .venv" status="ok" duration={4300} />
      <ToolCall name="run_benchmark" summary="--filter '*Decompress*'" status="running" startedAt={0} now={6200} />
    </ToolCallGroup>
  ),
};

/** Driven by a clock: the running call's time ticks, then it lands. Not snapshotted: it moves. */
export const Live: Story = {
  render: function Live() {
    const [started] = useState(() => Date.now());
    const now = useTraceClock();
    const done = now - started > 4000;
    return (
      <ToolCallGroup>
        <ToolCall name="git_fetch" summary="upstream v5.4.0" status="ok" duration={1300} />
        <ToolCall
          name="git_rebase"
          summary="38 commits onto v5.4.0"
          status={done ? 'ok' : 'running'}
          startedAt={started}
          endedAt={done ? started + 4000 : undefined}
          now={now}
        />
      </ToolCallGroup>
    );
  },
};
