import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { TraceSpanInput } from '../lib/trace';
import { AGENT_RUN_NOW, agentRunTrace, samplePrice } from '../stories/traceFixtures';
import { RunTree } from './RunTree';

const run = <RunTree spans={agentRunTrace} now={AGENT_RUN_NOW} price={samplePrice} />;

describe('RunTree', () => {
  it('is a tree of agents only, nested by level', () => {
    render(run);
    const items = screen.getAllByRole('treeitem');
    expect(items.map((item) => item.getAttribute('aria-level'))).toEqual(['1', '2', '2', '2']);
    expect(items[0].getAttribute('aria-expanded')).toBe('true');
    expect(items[1].getAttribute('aria-expanded')).toBeNull();
  });

  it('names each agent\'s model, status, task, cost and time for a screen reader', () => {
    render(run);
    const label = screen.getAllByRole('treeitem')[1].getAttribute('aria-label')!;
    expect(label).toMatch(/^replayer, sonnet-5\.5, done, Replay 38 commits, \$0\.\d\d, 13\.8s, 3 tool calls$/);
  });

  it('emphasises the one count that needs a person, and totals the cost', () => {
    const { container } = render(run);
    const header = container.querySelector('[data-slot="run-tree-header"]')!;
    expect(header.textContent).toContain('4 agents');
    expect(header.textContent).toContain('! 1 needs you');
    expect(header.textContent).toMatch(/\$0\.\d\d/);
    expect(screen.getAllByRole('treeitem')[0].getAttribute('data-status')).toBe('waiting');
  });

  it('folds a branch with the keyboard, says how many agents it hides, and keeps its totals', () => {
    render(run);
    const root = screen.getAllByRole('treeitem')[0];
    const before = root.getAttribute('aria-label');
    fireEvent.keyDown(root, { key: 'ArrowLeft' });
    expect(screen.getAllByRole('treeitem')).toHaveLength(1);
    expect(root.textContent).toContain('+3 agents');
    expect(root.getAttribute('aria-label')).toBe(before);
    fireEvent.keyDown(root, { key: 'ArrowRight' });
    expect(screen.getAllByRole('treeitem')).toHaveLength(4);
  });

  it('moves with the arrows and Home/End, and selects with Enter', () => {
    const onSelectedChange = vi.fn();
    render(<RunTree spans={agentRunTrace} now={AGENT_RUN_NOW} onSelectedChange={onSelectedChange} />);
    const items = screen.getAllByRole('treeitem');
    expect(items.map((item) => item.tabIndex)).toEqual([0, -1, -1, -1]);
    items[0].focus();
    fireEvent.keyDown(items[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(items[1]);
    fireEvent.keyDown(items[1], { key: 'End' });
    expect(document.activeElement).toBe(items[3]);
    fireEvent.keyDown(items[3], { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(items[0]);
    fireEvent.keyDown(items[0], { key: 'Enter' });
    expect(onSelectedChange).toHaveBeenCalledWith('orch');
  });

  it('shows a failure below on every ancestor', () => {
    const op = (name: string) => ({ 'gen_ai.operation.name': name });
    const spans: TraceSpanInput[] = [
      { id: 'a', name: 'top', start: 0, end: 10, attributes: op('invoke_agent') },
      { id: 'b', parentId: 'a', name: 'middle', start: 1, end: 9, attributes: op('invoke_agent') },
      { id: 't', parentId: 'b', name: 'tool', start: 2, end: 3, status: 'error', attributes: op('execute_tool') },
    ];
    render(<RunTree spans={spans} />);
    for (const item of screen.getAllByRole('treeitem')) expect(item.textContent).toContain('1 failed below');
  });

  it('keeps one live mark: the header steps, the rows hold still', () => {
    const op = { 'gen_ai.operation.name': 'invoke_agent' };
    const { container } = render(<RunTree spans={[{ id: 'a', name: 'a', start: 0, attributes: op }]} now={500} />);
    expect(container.querySelector('[data-slot="run-tree-header"] [data-slot="spinner-quarter"]')?.className).toContain('animate-ds-step');
    expect(container.querySelector('[role="treeitem"] [data-slot="spinner-quarter"]')?.className).not.toMatch(/animate-ds-step/);
  });

  it('keeps focus in the tree when a controlled fold hides the focused row', () => {
    const rootId = agentRunTrace.find((span) => !span.parentId)!.id;
    const { rerender } = render(<RunTree spans={agentRunTrace} now={AGENT_RUN_NOW} collapsed={[]} />);
    const child = screen.getAllByRole('treeitem')[2];
    child.focus();
    expect(document.activeElement).toBe(child);
    rerender(<RunTree spans={agentRunTrace} now={AGENT_RUN_NOW} collapsed={[rootId]} />);
    const [root] = screen.getAllByRole('treeitem');
    expect(document.activeElement).toBe(root);
    expect(root.tabIndex).toBe(0);
  });

  it('carries a data-slot on every part', () => {
    const { container } = render(run);
    for (const slot of ['run-tree-header', 'run-tree-node', 'run-tree-toggle', 'run-tree-name', 'run-tree-task', 'run-tree-state', 'run-tree-cost', 'run-tree-total', 'run-tree-count', 'run-tree-waiting', 'run-tree-items', 'run-tree-who', 'run-tree-guide', 'run-tree-label', 'run-tree-model', 'run-tree-amount', 'run-tree-time']) {
      expect(container.querySelector(`[data-slot="${slot}"]`), slot).not.toBeNull();
    }
  });

  it('says so when a trace has no agents, and forwards its ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<RunTree ref={ref} spans={[{ id: 'x', name: 'GET /', start: 0, end: 1 }]} />);
    expect(screen.getByText('No agents in this run.')).toBeDefined();
    expect(ref.current?.dataset.slot).toBe('run-tree');
  });
});
