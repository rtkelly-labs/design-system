import { fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { buildTrace } from '../lib/trace';
import { AGENT_RUN_NOW, agentRunTrace } from '../stories/traceFixtures';
import { describeToolCalls, formatToolPayload, ToolCall, ToolCallGroup, toolCallFromSpan } from './ToolCall';

describe('formatToolPayload', () => {
  it('pretty-prints objects and JSON strings, and leaves other text as written', () => {
    expect(formatToolPayload({ a: 1 })).toBe('{\n  "a": 1\n}');
    expect(formatToolPayload('{"a":1}')).toBe('{\n  "a": 1\n}');
    expect(formatToolPayload('[1,2]')).toBe('[\n  1,\n  2\n]');
    expect(formatToolPayload('{not json}')).toBe('{not json}');
    expect(formatToolPayload('plain text')).toBe('plain text');
    expect(formatToolPayload(undefined)).toBe('');
  });
});

describe('ToolCall', () => {
  it('is one line naming the tool, its state and its time, and says it once to a screen reader', () => {
    render(<ToolCall name="search_web" summary="CRM pricing" status="ok" duration={1500} />);
    const trigger = screen.getByRole('button');
    // Named by its own text, so the summary is heard too, not only the tool and the state.
    expect(trigger.hasAttribute('aria-label')).toBe(false);
    expect(screen.getByRole('button', { name: /search_web.*CRM pricing.*done.*in.*1\.5s/ })).toBe(trigger);
    expect(trigger.textContent).toContain('search_web');
    expect(trigger.textContent).toContain('CRM pricing');
    expect(trigger.textContent).toContain('1.5s');
    // Mark and word are separate elements, so the gap between them renders.
    const state = trigger.querySelector('.inline-flex.whitespace-nowrap');
    expect(Array.from(state?.children ?? []).map((child) => child.textContent)).toEqual(['✓', 'done']);
  });

  it('ticks a running call from now and startedAt, and never reads the clock', () => {
    const { rerender } = render(<ToolCall name="t" status="running" startedAt={1000} now={1600} />);
    expect(screen.getByRole('button').textContent).toContain('600ms');
    rerender(<ToolCall name="t" status="running" startedAt={1000} now={3400} />);
    expect(screen.getByRole('button').textContent).toContain('2.4s');
    // A running call's time ticks, so it is hidden from the name: it would be read out every frame.
    const name = screen.getByRole('button', { name: /running/ });
    expect(name.textContent).toContain('2.4s');
    expect(screen.queryByRole('button', { name: /2\.4s/ })).toBeNull();
  });

  it('opens to the arguments and the result, each with a copy action', () => {
    render(<ToolCall name="t" status="ok" args={{ q: 'x' }} result='{"hits":3}' />);
    fireEvent.click(screen.getByRole('button'));
    const args = screen.getByRole('region', { name: 'Arguments' });
    const result = screen.getByRole('region', { name: 'Result' });
    expect(args.textContent).toContain('"q": "x"');
    expect(result.textContent).toContain('"hits": 3');
    expect(within(args).getByRole('button', { name: 'copy' })).toBeDefined();
  });

  it('caps a long payload with a worded "show all", and shows it all when asked', () => {
    const long = Array.from({ length: 30 }, (_, i) => `line ${i + 1}`).join('\n');
    render(<ToolCall name="t" status="ok" result={long} maxLines={5} defaultOpen />);
    const well = screen.getByRole('region', { name: 'Result' });
    expect(well.querySelector('pre')?.textContent?.split('\n')).toHaveLength(5);
    fireEvent.click(within(well).getByRole('button', { name: 'show all (30 lines)' }));
    expect(well.querySelector('pre')?.textContent?.split('\n')).toHaveLength(30);
  });

  it('shows why a call failed, and offers a retry only when one is given', () => {
    const onRetry = vi.fn();
    const { rerender } = render(<ToolCall name="t" status="error" error="pyarrow not found" />);
    expect(screen.getByRole('button').textContent).toContain('pyarrow not found');
    fireEvent.click(screen.getByRole('button', { name: /failed/ }));
    expect(screen.queryByRole('button', { name: 'retry' })).toBeNull();
    rerender(<ToolCall name="t" status="error" error="pyarrow not found" onRetry={onRetry} defaultOpen />);
    fireEvent.click(screen.getByRole('button', { name: 'retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.getByRole('region', { name: 'Error' }).textContent).toContain('pyarrow not found');
  });

  it('names a failed call by its reason, so calls to the same tool can be told apart', () => {
    render(
      <>
        <ToolCall name="conformance" summary="parquet-cpp" status="error" error="pyarrow not found" />
        <ToolCall name="conformance" summary="retry inside .venv" status="ok" duration={4300} />
      </>,
    );
    expect(screen.getByRole('button', { name: /conformance.*pyarrow not found.*failed/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /conformance.*retry inside \.venv.*done/ })).toBeDefined();
  });

  it('shows an error given as an element in the panel as itself, and copies its text', () => {
    render(<ToolCall name="t" status="error" error={<span>Permission <b>denied</b></span>} defaultOpen />);
    const well = screen.getByRole('region', { name: 'Error' });
    expect(well.textContent).toContain('Permission denied');
    expect(well.textContent).not.toContain('[object Object]');
    expect(well.querySelector('b')?.textContent).toBe('denied');
  });

  it('is controllable, and forwards its ref and props', () => {
    const onOpenChange = vi.fn();
    const ref = createRef<HTMLDivElement>();
    render(<ToolCall ref={ref} name="t" status="ok" open={false} onOpenChange={onOpenChange} data-testid="call" />);
    fireEvent.click(screen.getByRole('button'));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(ref.current?.dataset.slot).toBe('tool-call');
    expect(screen.getByTestId('call')).toBe(ref.current);
  });
});

describe('ToolCallGroup', () => {
  const group = (
    <ToolCallGroup>
      <ToolCall name="a" status="ok" duration={1000} />
      <ToolCall name="b" status="error" duration={500} />
      <ToolCall name="c" status="running" startedAt={0} now={250} />
    </ToolCallGroup>
  );

  it('folds its calls into one line: how many, how many running, how many failed', () => {
    render(group);
    const header = screen.getByRole('button', { expanded: true });
    expect(header.textContent).toContain('3 tool calls');
    expect(header.textContent).toContain('1 running');
    expect(header.textContent).toContain('1 failed');
  });

  it('keeps one live mark: the header steps, and the rows inside hold still', () => {
    const { container } = render(group);
    const header = container.querySelector('[data-slot="tool-call-group"] > button')!;
    const live = header.querySelector('[data-slot="spinner-quarter"]');
    const row = container.querySelector('[data-slot="tool-call"][data-status="running"] [data-slot="spinner-quarter"]');
    expect(live?.className).toContain('animate-ds-step');
    expect(row?.className).not.toMatch(/animate-ds-step/);
  });

  it('speaks through one polite region for the whole group', () => {
    const { container } = render(group);
    const regions = container.querySelectorAll('[role="status"]:not([aria-hidden="true"])');
    const spoken = Array.from(regions).filter((node) => !node.closest('[aria-hidden="true"]'));
    expect(spoken).toHaveLength(1);
    expect(spoken[0].textContent).toBe('3 tool calls, 1 running, 1 failed');
  });

  it('collapses its calls away', () => {
    render(group);
    fireEvent.click(screen.getByRole('button', { expanded: true }));
    expect(screen.queryByRole('button', { name: /^a, done/ })).toBeNull();
  });

  it('sums finished durations once nothing runs', () => {
    expect(describeToolCalls([{ status: 'ok', duration: 1000 }, { status: 'error', duration: 1400 }]).text).toBe('2 tool calls · 2.4s');
  });
});

describe('toolCallFromSpan', () => {
  it('reads a tool span from the trace model', () => {
    const model = buildTrace(agentRunTrace, { now: AGENT_RUN_NOW });
    expect(toolCallFromSpan(model.byId.get('v2')!)).toMatchObject({ name: 'conformance', status: 'error', error: 'pyarrow not found on PATH', startedAt: 16600, endedAt: 19000 });
    expect(toolCallFromSpan(model.byId.get('r2')!)).toMatchObject({ name: 'git_rebase', status: 'ok' });
  });
});
