import type { Meta, StoryObj } from '@storybook/react-vite';
import { RunTree } from '../components/RunTree';
import { useTraceReplay } from '../hooks/useTraceReplay';
import { buildTrace, replayTrace, type TraceSpanInput } from '../lib/trace';
import { AGENT_RUN_NOW, agentRunTrace, samplePrice } from './traceFixtures';

const meta: Meta<typeof RunTree> = {
  title: 'Components/Data/RunTree',
  component: RunTree,
  tags: ['autodocs', 'preview'],
  parameters: {
    docs: {
      description: {
        component:
          'An orchestrator and the agents it started, with each branch’s status, cost and time. A second view over the trace model: only agent spans become rows, their own tool and model calls fold in as counts, and cost, time and failures roll up every branch. The header’s one emphasised figure is how many agents need a person (DESIGN.md §9).',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof RunTree>;

/** A run waiting on a person: the orchestrator's decision is the one emphasised count. */
export const Waiting: Story = {
  args: { spans: agentRunTrace, now: AGENT_RUN_NOW, price: samplePrice, defaultSelectedId: 'ver' },
};

const op = (name: string, agent?: string) => ({ 'gen_ai.operation.name': name, ...(agent ? { 'gen_ai.agent.name': agent } : {}) });

/** A failed tool call three levels down shows on every agent above it, so a folded tree still says something broke. */
export const FailedBranch: Story = {
  args: {
    spans: [
      { id: 'a', name: 'Publish the 0.21 release', start: 0, end: 9000, attributes: op('invoke_agent', 'release-train') },
      { id: 'b', parentId: 'a', name: 'Build and verify', start: 400, end: 8000, attributes: op('invoke_agent', 'builder') },
      { id: 'c', parentId: 'b', name: 'Run the visual suite', start: 900, end: 7000, attributes: op('invoke_agent', 'checker') },
      { id: 't', parentId: 'c', name: 'test:visual', start: 1200, end: 6100, status: 'error', attributes: op('execute_tool') },
    ] satisfies TraceSpanInput[],
    defaultCollapsed: ['b'],
  },
};

/** Forty agents, folded to the first level: each folded branch says how many agents it hides. */
export const Many: Story = {
  args: {
    spans: [
      { id: 'root', name: 'Audit every package', start: 0, end: 60_000, attributes: op('invoke_agent', 'auditor') },
      ...Array.from({ length: 13 }, (_, lead): TraceSpanInput[] => [
        { id: `l${lead}`, parentId: 'root', name: `Audit package ${lead + 1}`, start: lead * 1000, end: lead * 1000 + 30_000, attributes: op('invoke_agent', `lead-${lead + 1}`) },
        { id: `l${lead}a`, parentId: `l${lead}`, name: 'Check licences', start: lead * 1000 + 100, end: lead * 1000 + 9000, attributes: op('invoke_agent', 'licences') },
        { id: `l${lead}b`, parentId: `l${lead}`, name: 'Check contrast', start: lead * 1000 + 200, end: lead * 1000 + 12_000, attributes: op('invoke_agent', 'contrast') },
      ]).flat(),
    ],
    defaultCollapsed: Array.from({ length: 13 }, (_, lead) => `l${lead}`),
  },
};

/** The run played back: agents appear as they start, and the waiting count arrives at the end. Not snapshotted: it moves. */
export const Replay: Story = {
  render: function Replay() {
    const full = buildTrace(agentRunTrace, { now: AGENT_RUN_NOW, price: samplePrice });
    const player = useTraceReplay(full.duration, { autoPlay: true, loop: true });
    return <RunTree spans={buildTrace(replayTrace(full, player.elapsed), { now: player.elapsed })} />;
  },
};
