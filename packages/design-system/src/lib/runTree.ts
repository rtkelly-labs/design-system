/**
 * The run tree: a trace's agents, and who delegated to whom.
 *
 * A second view over the same `TraceModel` the waterfall draws (`DESIGN.md`
 * §9: one run, one model, many views). Only spans with `agentKind: 'agent'`
 * become nodes. Model calls, tool calls and decisions fold into the nearest
 * agent above them, as counts and as its state. Pure data, no React.
 */

import type { TraceModel, TraceSpan } from './trace';

/** Where an agent stands. `waiting` is waiting on a person. */
export type RunNodeStatus = 'running' | 'waiting' | 'done' | 'failed';

/** One agent in the run. */
export interface RunNode {
  /** The agent span's id. */
  id: string;
  /** The agent's name: `gen_ai.agent.name`, else its service, else the span name. */
  name: string;
  /** What it was asked to do: the agent span's own name. */
  task: string;
  model?: string;
  status: RunNodeStatus;
  /** Nesting depth among agents; roots are 0. */
  depth: number;
  /** The nearest agent above, or `null` for a root. */
  parentId: string | null;
  /** Agents it started, in start order. */
  children: string[];
  /** Milliseconds from the agent's start: to its end, or to `now` while it runs. */
  duration: number;
  /** Cost of the agent and everything under it, sub-agents included. Absent when nothing has one. */
  cost?: number;
  /** Tokens of the agent and everything under it. */
  tokens: number;
  /** Something under it is still in flight, so its figures will grow. */
  partial: boolean;
  /** Tool calls it made itself, not counting its sub-agents'. */
  toolCalls: number;
  /** Model calls it made itself. */
  modelCalls: number;
  /** Failed spans anywhere under it, so a failure deep in a branch shows on every ancestor. */
  errors: number;
  /** Agents anywhere under it, for the count a folded branch shows. */
  descendants: number;
}

export interface RunTreeModel {
  /** Every agent, depth-first in start order: the tree's row order. */
  nodes: RunNode[];
  byId: ReadonlyMap<string, RunNode>;
  /** The run's summary: agents, how many run, how many need a person, the total cost. */
  summary: { agents: number; running: number; waiting: number; cost?: number };
}

/** The nearest agent above `span`, or `null`. */
function agentAbove(span: TraceSpan, model: TraceModel): TraceSpan | null {
  for (let at = span.parentId ? model.byId.get(span.parentId) : undefined; at; at = at.parentId ? model.byId.get(at.parentId) : undefined) {
    if (at.agentKind === 'agent') return at;
  }
  return null;
}

/** An agent's own spans: everything under it that no nearer agent owns. */
function ownSpans(agent: TraceSpan, model: TraceModel): TraceSpan[] {
  const out: TraceSpan[] = [];
  const walk = (span: TraceSpan) => {
    for (const id of span.children) {
      const child = model.byId.get(id)!;
      if (child.agentKind === 'agent') continue;
      out.push(child);
      walk(child);
    }
  };
  walk(agent);
  return out;
}

/** Every span under `span`, at any depth. */
function subtree(span: TraceSpan, model: TraceModel): TraceSpan[] {
  const out: TraceSpan[] = [];
  const walk = (at: TraceSpan) => {
    for (const id of at.children) {
      const child = model.byId.get(id)!;
      out.push(child);
      walk(child);
    }
  };
  walk(span);
  return out;
}

/**
 * The agents in a trace, as a tree. An agent whose own spans include a
 * decision still in flight is `waiting`; an agent whose span failed is
 * `failed`; one still in flight is `running`; otherwise it is `done`.
 */
export function buildRunTree(model: TraceModel): RunTreeModel {
  const agents = model.spans.filter((span) => span.agentKind === 'agent');
  const nodes: RunNode[] = [];
  const byId = new Map<string, RunNode>();

  const parentOf = new Map<string, string | null>();
  for (const agent of agents) parentOf.set(agent.id, agentAbove(agent, model)?.id ?? null);

  const visit = (agent: TraceSpan, depth: number) => {
    const own = ownSpans(agent, model);
    const under = subtree(agent, model);
    const waiting = own.some((span) => span.agentKind === 'decision' && span.inFlight);
    const status: RunNodeStatus = waiting ? 'waiting' : agent.status === 'error' ? 'failed' : agent.inFlight ? 'running' : 'done';
    const node: RunNode = {
      id: agent.id,
      name: typeof agent.attributes['gen_ai.agent.name'] === 'string' ? (agent.attributes['gen_ai.agent.name'] as string) : agent.service !== 'unknown' ? agent.service : agent.name,
      task: agent.name,
      ...(agent.model ? { model: agent.model } : {}),
      status,
      depth,
      parentId: parentOf.get(agent.id) ?? null,
      children: agents.filter((other) => parentOf.get(other.id) === agent.id).sort((a, b) => a.offset - b.offset).map((other) => other.id),
      duration: agent.duration,
      ...(agent.total.cost !== undefined ? { cost: agent.total.cost } : {}),
      tokens: agent.total.inputTokens + agent.total.outputTokens,
      partial: agent.total.partial,
      toolCalls: own.filter((span) => span.agentKind === 'tool').length,
      modelCalls: own.filter((span) => span.agentKind === 'llm').length,
      errors: [agent, ...under].filter((span) => span.status === 'error').length,
      descendants: under.filter((span) => span.agentKind === 'agent').length,
    };
    nodes.push(node);
    byId.set(node.id, node);
    for (const id of node.children) visit(model.byId.get(id)!, depth + 1);
  };
  for (const root of agents.filter((agent) => parentOf.get(agent.id) === null).sort((a, b) => a.offset - b.offset)) visit(root, 0);

  const roots = nodes.filter((node) => node.parentId === null);
  const priced = roots.filter((node) => node.cost !== undefined);
  return {
    nodes,
    byId,
    summary: {
      agents: nodes.length,
      running: nodes.filter((node) => node.status === 'running').length,
      waiting: nodes.filter((node) => node.status === 'waiting').length,
      ...(priced.length ? { cost: priced.reduce((sum, node) => sum + node.cost!, 0) } : {}),
    },
  };
}

/** The rows to draw when the nodes in `collapsed` hide their descendants. */
export function visibleRunNodes(tree: RunTreeModel, collapsed: ReadonlySet<string> = new Set()): RunNode[] {
  const rows: RunNode[] = [];
  const walk = (node: RunNode) => {
    rows.push(node);
    if (collapsed.has(node.id)) return;
    for (const id of node.children) walk(tree.byId.get(id)!);
  };
  for (const node of tree.nodes) if (node.parentId === null) walk(node);
  return rows;
}
