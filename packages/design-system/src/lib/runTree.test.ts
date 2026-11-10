import { describe, expect, it } from 'vitest';
import { AGENT_RUN_NOW, agentRunTrace, samplePrice } from '../stories/traceFixtures';
import { buildRunTree, visibleRunNodes } from './runTree';
import { buildTrace, type TraceSpanInput } from './trace';

const agent = (id: string, parentId: string | null, start: number, end?: number, extra: Partial<TraceSpanInput> = {}): TraceSpanInput => ({
  id, parentId, name: `task ${id}`, start, end, attributes: { 'gen_ai.operation.name': 'invoke_agent', 'gen_ai.agent.name': id }, ...extra,
});
const tool = (id: string, parentId: string, start: number, end?: number, extra: Partial<TraceSpanInput> = {}): TraceSpanInput => ({
  id, parentId, name: id, start, end, attributes: { 'gen_ai.operation.name': 'execute_tool' }, ...extra,
});

describe('buildRunTree', () => {
  const tree = buildRunTree(buildTrace(agentRunTrace, { now: AGENT_RUN_NOW, price: samplePrice }));

  it('keeps only agents, nested by who started whom, in start order', () => {
    expect(tree.nodes.map((node) => [node.id, node.depth])).toEqual([['orch', 0], ['rep', 1], ['ver', 1], ['ben', 1]]);
    expect(tree.byId.get('orch')!.children).toEqual(['rep', 'ver', 'ben']);
    expect(tree.byId.get('rep')!.name).toBe('replayer');
    expect(tree.byId.get('rep')!.task).toBe('Replay 38 commits');
    expect(tree.byId.get('rep')!.model).toBe('sonnet-5.5');
  });

  it('folds an agent\'s own tool and model calls into counts, not its sub-agents\'', () => {
    expect(tree.byId.get('rep')).toMatchObject({ toolCalls: 3, modelCalls: 1 });
    expect(tree.byId.get('orch')).toMatchObject({ toolCalls: 0, modelCalls: 2, descendants: 3 });
  });

  it('rolls cost and tokens up every branch, including folded sub-agents', () => {
    const orch = tree.byId.get('orch')!;
    const children = orch.children.map((id) => tree.byId.get(id)!);
    expect(orch.cost).toBeGreaterThan(children.reduce((sum, node) => sum + (node.cost ?? 0), 0));
    expect(tree.summary.cost).toBeCloseTo(orch.cost!, 10);
    expect(orch.partial).toBe(true);
    expect(tree.byId.get('ver')!.partial).toBe(false);
  });

  it('marks the agent waiting on a person, and counts it in the summary', () => {
    expect(tree.byId.get('orch')!.status).toBe('waiting');
    expect(tree.byId.get('ver')!.status).toBe('done');
    expect(tree.summary).toMatchObject({ agents: 4, running: 0, waiting: 1 });
  });

  it('shows a failure deep in a branch on every ancestor', () => {
    const deep = buildRunTree(buildTrace([agent('a', null, 0, 10), agent('b', 'a', 1, 9), agent('c', 'b', 2, 8), tool('t', 'c', 3, 4, { status: 'error' })]));
    expect(['a', 'b', 'c'].map((id) => deep.byId.get(id)!.errors)).toEqual([1, 1, 1]);
    expect(deep.byId.get('c')!.status).toBe('done');
    expect(buildRunTree(buildTrace([agent('x', null, 0, 1, { status: 'error' })])).byId.get('x')!.status).toBe('failed');
  });

  it('makes a root of an agent whose parent is missing, and skips non-agent parents', () => {
    const orphaned = buildRunTree(buildTrace([agent('a', 'nobody', 0, 10), { id: 'step', parentId: 'a', name: 'step', start: 1, end: 9 }, agent('b', 'step', 2, 8)]));
    expect(orphaned.nodes.map((node) => [node.id, node.parentId])).toEqual([['a', null], ['b', 'a']]);
  });

  it('is running while in flight and nothing waits on a person', () => {
    const live = buildRunTree(buildTrace([agent('a', null, 0), tool('t', 'a', 1)], { now: 5 }));
    expect(live.byId.get('a')).toMatchObject({ status: 'running', duration: 5, partial: true });
    expect(live.summary.running).toBe(1);
    expect(live.summary.cost).toBeUndefined();
  });
});

describe('visibleRunNodes', () => {
  it('hides the descendants of folded nodes', () => {
    const tree = buildRunTree(buildTrace(agentRunTrace, { now: AGENT_RUN_NOW }));
    expect(visibleRunNodes(tree).map((node) => node.id)).toEqual(['orch', 'rep', 'ver', 'ben']);
    expect(visibleRunNodes(tree, new Set(['orch'])).map((node) => node.id)).toEqual(['orch']);
  });
});
