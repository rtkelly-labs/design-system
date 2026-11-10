import { agentRunTrace, AGENT_RUN_NOW, samplePrice, checkoutTrace } from '../stories/traceFixtures';
import { describe, expect, it } from 'vitest';
import {
  buildTrace,
  formatTraceDuration,
  matchTraceSpan,
  parseOtlpTrace,
  parseTraceDocument,
  replayTrace,
  visibleTraceSpans,
  type TraceSpanInput, formatTraceCost, formatTraceTokens, traceAgentKind } from './trace';

const checkout: TraceSpanInput[] = [
  { id: 'a', name: 'GET /checkout', service: 'web', start: 1000, end: 1400 },
  { id: 'c', parentId: 'a', name: 'cart.load', service: 'cart', start: 1040, end: 1160 },
  { id: 'b', parentId: 'a', name: 'auth.verify', service: 'auth', start: 1004, end: 1038 },
  { id: 'd', parentId: 'c', name: 'SELECT cart_items', service: 'postgres', start: 1052, end: 1141, attributes: { 'db.system': 'postgresql' } },
  { id: 'e', parentId: 'a', name: 'payment.authorize', service: 'payments', start: 1165, end: 1390, status: 'error' },
];

describe('buildTrace', () => {
  it('orders spans depth-first by start and measures offsets from the trace start', () => {
    const model = buildTrace(checkout);
    expect(model.spans.map((span) => span.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(model.byId.get('d')).toMatchObject({ depth: 2, offset: 52, duration: 89, parentId: 'c' });
    expect(model).toMatchObject({ start: 1000, duration: 400, errorCount: 1, inFlightCount: 0 });
    expect(model.services).toEqual(['web', 'auth', 'cart', 'postgres', 'payments']);
  });

  it('computes self time without double-counting overlapping children', () => {
    const model = buildTrace([
      { id: 'p', name: 'parent', start: 0, end: 100 },
      { id: 'x', parentId: 'p', name: 'x', start: 10, end: 50 },
      { id: 'y', parentId: 'p', name: 'y', start: 30, end: 70 },
    ]);
    expect(model.byId.get('p')!.selfTime).toBe(40);
    expect(model.byId.get('x')!.selfTime).toBe(40);
  });

  it('follows the latest-ending child down the critical path', () => {
    const model = buildTrace(checkout);
    expect(model.criticalPath).toEqual(['a', 'e']);
    expect(model.byId.get('e')!.critical).toBe(true);
    expect(model.byId.get('c')!.critical).toBe(false);
  });

  it('draws in-flight spans to now, or to the latest known time without one', () => {
    const open: TraceSpanInput[] = [{ id: 'r', name: 'job', start: 0 }, { id: 's', parentId: 'r', name: 'step', start: 5, end: 20 }];
    expect(buildTrace(open).byId.get('r')).toMatchObject({ inFlight: true, duration: 20 });
    expect(buildTrace(open, { now: 75 })).toMatchObject({ duration: 75, inFlightCount: 1 });
    expect(buildTrace(checkout, { now: 9999 }).duration).toBe(400);
  });

  it('roots orphans, drops invalid and duplicate spans, and survives a parent cycle', () => {
    const model = buildTrace([
      { id: 'o', parentId: 'missing', name: 'orphan', start: 0, end: 1 },
      { id: 'o', name: 'duplicate', start: 0, end: 5 },
      { id: 'bad', name: 'bad', start: Number.NaN },
      { id: 'x', parentId: 'y', name: 'x', start: 1, end: 2 },
      { id: 'y', parentId: 'x', name: 'y', start: 2, end: 3 },
    ]);
    expect(model.spans.map((span) => span.id)).toEqual(['o', 'x', 'y']);
    expect(model.byId.get('o')!.parentId).toBeNull();
    expect(model.byId.get('y')).toMatchObject({ parentId: 'x', depth: 1 });
  });

  it('returns an empty model for no spans, and passes a model through', () => {
    const empty = buildTrace([]);
    expect(empty).toMatchObject({ spans: [], duration: 0, criticalPath: [] });
    expect(buildTrace(empty)).toBe(empty);
  });
});

describe('visibleTraceSpans and matchTraceSpan', () => {
  const model = buildTrace(checkout);
  it('hides the descendants of collapsed spans', () => {
    expect(visibleTraceSpans(model, new Set(['c'])).map((span) => span.id)).toEqual(['a', 'b', 'c', 'e']);
    expect(visibleTraceSpans(model, new Set(['a'])).map((span) => span.id)).toEqual(['a']);
  });
  it('keeps the ancestors of a filtered match', () => {
    expect(visibleTraceSpans(model, new Set(), (span) => matchTraceSpan(span, 'postgresql')).map((span) => span.id)).toEqual(['a', 'c', 'd']);
    expect(matchTraceSpan(model.byId.get('b')!, '  AUTH ')).toBe(true);
    expect(matchTraceSpan(model.byId.get('b')!, '')).toBe(true);
  });
});

describe('formatting', () => {
  it('carries rounding into the next unit instead of printing 60 of one', () => {
    expect([999.6, 59_996, 119_600, 119_999, 3_599_700].map(formatTraceDuration)).toEqual(['1s', '1m 00s', '2m 00s', '2m 00s', '60m 00s']);
  });

  it('formats durations across magnitudes', () => {
    expect([0, 0.42, 3, 3.25, 412, 1240, 125_000, -1].map(formatTraceDuration)).toEqual(['0ms', '0.42ms', '3ms', '3.3ms', '412ms', '1.24s', '2m 05s', '—']);
  });
});

describe('parsing', () => {
  const otlp = {
    resourceSpans: [{
      resource: { attributes: [{ key: 'service.name', value: { stringValue: 'api' } }] },
      scopeSpans: [{
        spans: [
          { traceId: 't', spanId: '01', name: 'GET /', kind: 2, startTimeUnixNano: '1700000000000000000', endTimeUnixNano: '1700000000250000000', status: { code: 2 }, attributes: [{ key: 'http.status_code', value: { intValue: '500' } }, { key: 'retry', value: { boolValue: true } }] },
          { traceId: 't', spanId: '02', parentSpanId: '01', name: 'db', kind: 'SPAN_KIND_CLIENT', startTimeUnixNano: '1700000000010000000', endTimeUnixNano: '0' },
        ],
      }],
    }],
  };

  it('reads OTLP/JSON, keeping nanosecond precision past 2^53', () => {
    const spans = parseOtlpTrace(otlp);
    expect(spans[0]).toMatchObject({ id: '01', parentId: null, service: 'api', kind: 'server', status: 'error', start: 1_700_000_000_000, end: 1_700_000_000_250, attributes: { 'http.status_code': 500, retry: true } });
    expect(spans[1]).toMatchObject({ id: '02', parentId: '01', kind: 'client', end: undefined });
    expect(parseOtlpTrace(null)).toEqual([]);
  });

  it('accepts JSON text, span arrays, { spans } and NDJSON with broken lines', () => {
    expect(parseTraceDocument(JSON.stringify(otlp))).toHaveLength(2);
    expect(parseTraceDocument({ spans: checkout })).toHaveLength(5);
    expect(parseTraceDocument(checkout)).toHaveLength(5);
    const ndjson = `${JSON.stringify(checkout[0])}\n{"id": "trunc\n${JSON.stringify(otlp)}\n`;
    expect(parseTraceDocument(ndjson).map((span) => span.id)).toEqual(['a', '01', '02']);
    expect(parseTraceDocument('')).toEqual([]);
  });
});

describe('replayTrace', () => {
  it('shows only started spans, open until they end, with status held back', () => {
    const at = (elapsed: number) => buildTrace(replayTrace(checkout, elapsed), { now: elapsed });
    expect(at(-1).spans).toHaveLength(0);
    expect(at(50).spans.map((span) => span.id)).toEqual(['a', 'b', 'c']);
    expect(at(60).spans.map((span) => span.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(at(50).byId.get('a')).toMatchObject({ inFlight: true, duration: 50 });
    expect(at(50).byId.get('b')).toMatchObject({ inFlight: false, duration: 34 });
    expect(at(200).byId.get('e')).toMatchObject({ inFlight: true, status: 'unset' });
    expect(at(400).byId.get('e')).toMatchObject({ inFlight: false, status: 'error' });
    expect(at(400).duration).toBe(400);
  });
});

describe('agent runs', () => {
  const run = (options: Parameters<typeof buildTrace>[1] = {}) => buildTrace(agentRunTrace, { now: AGENT_RUN_NOW, price: samplePrice, ...options });

  it('maps gen_ai.operation.name to an agent kind, and takes an explicit one over it', () => {
    expect(traceAgentKind({ 'gen_ai.operation.name': 'chat' })).toBe('llm');
    expect(traceAgentKind({ 'gen_ai.operation.name': 'embeddings' })).toBe('llm');
    expect(traceAgentKind({ 'gen_ai.operation.name': 'execute_tool' })).toBe('tool');
    expect(traceAgentKind({ 'gen_ai.operation.name': 'invoke_agent' })).toBe('agent');
    expect(traceAgentKind({ 'gen_ai.operation.name': 'create_agent' })).toBe('agent');
    expect(traceAgentKind({ 'gen_ai.operation.name': 'something_else' })).toBeUndefined();
    expect(traceAgentKind({})).toBeUndefined();

    const model = run();
    expect(model.byId.get('o1')?.agentKind).toBe('llm');
    expect(model.byId.get('o3')?.agentKind).toBe('decision');
    expect(buildTrace([{ id: 'x', name: 'x', start: 0, end: 1, agentKind: 'tool', attributes: { 'gen_ai.operation.name': 'chat' } }]).byId.get('x')?.agentKind).toBe('tool');
  });

  it('reads tokens and the model, preferring the response model', () => {
    const model = buildTrace([
      { id: 'a', name: 'a', start: 0, end: 1, attributes: { 'gen_ai.operation.name': 'chat', 'gen_ai.request.model': 'asked', 'gen_ai.response.model': 'served', 'gen_ai.usage.input_tokens': 10, 'gen_ai.usage.output_tokens': 4 } },
    ]);
    const span = model.byId.get('a')!;
    expect(span.model).toBe('served');
    expect(span.usage).toMatchObject({ inputTokens: 10, outputTokens: 4 });
    expect(span.usage.cost).toBeUndefined();
  });

  it('rolls tokens and cost up every subtree, through nested sub-agents', () => {
    const model = run();
    const ver = model.byId.get('ver')!;
    expect(ver.usage.inputTokens).toBe(0);
    expect(ver.total.inputTokens).toBe(8000);
    expect(ver.total.outputTokens).toBe(600);
    expect(ver.total.cost).toBeCloseTo((8000 * 3 + 600 * 15) / 1e6, 10);

    const leaves = agentRunTrace.reduce((sum, span) => sum + Number(span.attributes?.['gen_ai.usage.input_tokens'] ?? 0), 0);
    expect(model.byId.get('orch')!.total.inputTokens).toBe(leaves);
    expect(model.usage.inputTokens).toBe(leaves);
    expect(model.usage.cost).toBeCloseTo(model.byId.get('orch')!.total.cost!, 10);
  });

  it('marks a subtree partial while anything under it is in flight', () => {
    const model = run();
    expect(model.byId.get('o3')!.inFlight).toBe(true);
    expect(model.byId.get('orch')!.total.partial).toBe(true);
    expect(model.byId.get('ver')!.total.partial).toBe(false);
    expect(model.usage.partial).toBe(true);
  });

  it('counts model calls, tool calls and agents, and flags the trace agentic', () => {
    const model = run();
    expect(model.agentic).toBe(true);
    expect(model.usage).toMatchObject({ modelCalls: 5, toolCalls: 7, agents: 4 });
    expect(buildTrace(checkoutTrace).agentic).toBe(false);
  });

  it('takes cost from a named attribute before the price function', () => {
    const model = buildTrace(
      [
        { id: 'a', name: 'a', start: 0, end: 1, attributes: { 'gen_ai.operation.name': 'chat', 'billing.usd': 0.5, 'gen_ai.usage.input_tokens': 1 } },
        { id: 'b', name: 'b', start: 0, end: 1, attributes: { 'gen_ai.operation.name': 'chat', 'gen_ai.usage.input_tokens': 1 } },
      ],
      { costAttribute: 'billing.usd', price: () => 0.25 },
    );
    expect(model.byId.get('a')!.usage.cost).toBe(0.5);
    expect(model.byId.get('b')!.usage.cost).toBe(0.25);
    expect(model.usage.cost).toBe(0.75);
  });

  it('marks the slowest and the costliest finished leaf, never an in-flight one', () => {
    const model = run();
    const slowest = model.spans.filter((span) => span.slowest).map((span) => span.id);
    const costliest = model.spans.filter((span) => span.costliest).map((span) => span.id);
    expect(slowest).toEqual(['b1']);
    expect(costliest).toEqual(['o2']);
    expect(model.byId.get('o3')!.slowest).toBe(false);
  });

  it('marks no outliers on a trace that is not an agent run', () => {
    const model = buildTrace(checkoutTrace);
    expect(model.spans.some((span) => span.slowest || span.costliest)).toBe(false);
    expect(model.usage).toMatchObject({ inputTokens: 0, outputTokens: 0, modelCalls: 0, toolCalls: 0, agents: 0 });
    expect(model.usage.cost).toBeUndefined();
  });

  it('replays usage only once a span has finished, so totals never fall', () => {
    let previous = -1;
    for (let elapsed = 0; elapsed <= AGENT_RUN_NOW; elapsed += 500) {
      const model = buildTrace(replayTrace(run(), elapsed), { now: elapsed, price: samplePrice });
      const tokens = model.usage.inputTokens + model.usage.outputTokens;
      expect(tokens).toBeGreaterThanOrEqual(previous);
      previous = tokens;
      for (const span of model.spans) if (span.inFlight) expect(span.usage.inputTokens).toBe(0);
    }
    expect(previous).toBeGreaterThan(0);
    expect(buildTrace(replayTrace(run(), 5000)).byId.get('r1')?.agentKind).toBe('tool');
  });

  it('keeps a priced model\'s costs through a replay, without the pricing options', () => {
    const priced = run();
    const replayed = buildTrace(replayTrace(priced, 12_000), { now: 12_000 });
    expect(replayed.byId.get('o1')!.usage.cost).toBeCloseTo(priced.byId.get('o1')!.usage.cost!, 10);
    expect(replayed.byId.get('rep')!.total.cost).toBeCloseTo(priced.byId.get('r3')!.usage.cost!, 10);
    expect(replayed.usage.cost).toBeGreaterThan(0);
  });

  it('takes an explicit cost on the input over an attribute and a price', () => {
    const model = buildTrace([{ id: 'a', name: 'a', start: 0, end: 1, cost: 0.2, attributes: { 'gen_ai.operation.name': 'chat', 'billing.usd': 0.5 } }], { costAttribute: 'billing.usd', price: () => 0.9 });
    expect(model.byId.get('a')!.usage.cost).toBe(0.2);
  });

  it('formats tokens and cost', () => {
    expect([640, 3800, 9949, 13_900, 81_000, 1_240_000].map(formatTraceTokens)).toEqual(['640', '3.8k', '9.9k', '14k', '81k', '1.2M']);
    expect(formatTraceCost(0.35)).toBe('$0.35');
    expect(formatTraceCost(0.004)).toBe('$0.004');
    expect(formatTraceCost(0)).toBe('$0.00');
    expect(formatTraceCost(1.2, 'EUR')).toBe('€1.20');
    expect(formatTraceCost(Number.NaN)).toBe('—');
  });
});
