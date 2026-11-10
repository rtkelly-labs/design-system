import type { TraceSpanInput } from '../lib/trace';

/** A checkout request fanning out across five services, one of them failing. */
export const checkoutTrace: TraceSpanInput[] = [
  { id: 'a1', name: 'GET /checkout', service: 'web', kind: 'server', start: 0, end: 412, attributes: { 'http.method': 'GET', 'http.route': '/checkout', 'http.status_code': 502 }, status: 'error' },
  { id: 'b1', parentId: 'a1', name: 'auth.verify', service: 'auth', kind: 'client', start: 4, end: 38, attributes: { 'auth.scheme': 'bearer' } },
  { id: 'c1', parentId: 'a1', name: 'cart.load', service: 'cart', start: 40, end: 160 },
  { id: 'c2', parentId: 'c1', name: 'SELECT cart_items', service: 'postgres', kind: 'client', start: 52, end: 141, attributes: { 'db.system': 'postgresql', 'db.rows': 12 } },
  { id: 'c3', parentId: 'c1', name: 'cache.get pricing', service: 'redis', kind: 'client', start: 44, end: 50, attributes: { 'cache.hit': true } },
  { id: 'd1', parentId: 'a1', name: 'inventory.reserve', service: 'inventory', start: 162, end: 214 },
  { id: 'e1', parentId: 'a1', name: 'payment.authorize', service: 'payments', kind: 'client', start: 216, end: 404, status: 'error', attributes: { 'payment.provider': 'acquirer', 'error.type': 'timeout' } },
  { id: 'e2', parentId: 'e1', name: 'POST /v1/charges', service: 'payments', kind: 'client', start: 220, end: 400, status: 'error', attributes: { 'http.status_code': 504 } },
  { id: 'e3', parentId: 'e1', name: 'fraud.score', service: 'risk', start: 222, end: 260 },
];

/** A deploy pipeline whose last two steps have not finished. Times are relative to `start`. */
export function deployTrace(start: number): TraceSpanInput[] {
  return [
    { id: 'p', name: 'deploy web@4f2a', service: 'ci', start },
    { id: 'p1', parentId: 'p', name: 'install', service: 'ci', start, end: start + 1800 },
    { id: 'p2', parentId: 'p', name: 'build', service: 'ci', start: start + 1800, end: start + 5200 },
    { id: 'p3', parentId: 'p', name: 'test', service: 'ci', start: start + 1800, end: start + 6100 },
    { id: 'p4', parentId: 'p', name: 'upload artefacts', service: 'storage', start: start + 6100 },
    { id: 'p5', parentId: 'p', name: 'smoke checks', service: 'edge', start: start + 6400 },
  ];
}

/** An order request that takes 4.2s, with a broker that fails once before a retry lands. */
export const orderTrace: TraceSpanInput[] = [
  { id: 's1', name: 'POST /orders', service: 'api', kind: 'server', start: 0, end: 4200 },
  { id: 's2', parentId: 's1', name: 'validate', service: 'api', start: 60, end: 240 },
  { id: 's3', parentId: 's1', name: 'INSERT orders', service: 'postgres', kind: 'client', start: 260, end: 1100, attributes: { 'db.system': 'postgresql' } },
  { id: 's4', parentId: 's1', name: 'reserve stock', service: 'inventory', start: 1120, end: 2300 },
  { id: 's5', parentId: 's4', name: 'GET /stock/sku-81', service: 'inventory', kind: 'client', start: 1160, end: 1900 },
  { id: 's6', parentId: 's1', name: 'publish order.created', service: 'events', kind: 'producer', start: 2320, end: 4100, status: 'error', attributes: { 'error.type': 'broker unavailable' } },
  { id: 's7', parentId: 's6', name: 'retry 1', service: 'events', start: 2900, end: 3300, status: 'error' },
  { id: 's8', parentId: 's6', name: 'retry 2', service: 'events', start: 3500, end: 4000 },
];

const op = (name: string, extra: Record<string, string | number> = {}) => ({ 'gen_ai.operation.name': name, ...extra });
const llm = (model: string, input: number, output: number) =>
  op('chat', { 'gen_ai.request.model': model, 'gen_ai.usage.input_tokens': input, 'gen_ai.usage.output_tokens': output });

/**
 * An agent run: an orchestrator rebaselining a library fork onto a new upstream,
 * with three sub-agents, their model and tool calls, one failed tool call that
 * is retried, and a decision waiting on a person at the end, so the run is
 * still open: render it with `now` (30200 shows it waiting). Written by hand
 * with the OpenTelemetry GenAI attributes, so `buildTrace` derives every kind,
 * token count and model from them. Times are in milliseconds.
 */
export const agentRunTrace: TraceSpanInput[] = [
  { id: 'orch', name: 'Rebaseline onto upstream 5.4', service: 'stack-keeper', start: 0, attributes: op('invoke_agent', { 'gen_ai.agent.name': 'stack-keeper', 'gen_ai.request.model': 'opus-5.5' }) },
  { id: 'o1', parentId: 'orch', name: 'Plan the replay', service: 'stack-keeper', start: 400, end: 3600, attributes: llm('opus-5.5', 9200, 1400) },
  { id: 'rep', parentId: 'orch', name: 'Replay 38 commits', service: 'replayer', start: 3800, end: 17600, attributes: op('invoke_agent', { 'gen_ai.agent.name': 'replayer', 'gen_ai.request.model': 'sonnet-5.5' }) },
  { id: 'r1', parentId: 'rep', name: 'git_fetch', service: 'replayer', start: 4100, end: 5400, attributes: op('execute_tool', { 'gen_ai.tool.name': 'git_fetch' }) },
  { id: 'r2', parentId: 'rep', name: 'git_rebase', service: 'replayer', start: 5500, end: 11200, attributes: op('execute_tool', { 'gen_ai.tool.name': 'git_rebase' }) },
  { id: 'r3', parentId: 'rep', name: 'Re-make 0026 from its record', service: 'replayer', start: 8000, end: 10900, attributes: llm('sonnet-5.5', 31000, 5200) },
  { id: 'r4', parentId: 'rep', name: 'dotnet_build', service: 'replayer', start: 11300, end: 15800, attributes: op('execute_tool', { 'gen_ai.tool.name': 'dotnet_build' }) },
  { id: 'ver', parentId: 'orch', name: 'Prove every change holds', service: 'verifier', start: 6200, end: 24600, attributes: op('invoke_agent', { 'gen_ai.agent.name': 'verifier', 'gen_ai.request.model': 'sonnet-5.5' }) },
  { id: 'v1', parentId: 'ver', name: 'dotnet_test', service: 'verifier', start: 7600, end: 16400, attributes: op('execute_tool', { 'gen_ai.tool.name': 'dotnet_test' }) },
  { id: 'v2', parentId: 'ver', name: 'conformance', service: 'verifier', start: 16600, end: 19000, status: 'error', attributes: op('execute_tool', { 'gen_ai.tool.name': 'conformance', 'error.type': 'pyarrow not found on PATH' }) },
  { id: 'v3', parentId: 'ver', name: 'conformance (retry)', service: 'verifier', start: 19300, end: 23600, attributes: op('execute_tool', { 'gen_ai.tool.name': 'conformance' }) },
  { id: 'v4', parentId: 'ver', name: 'Write the verdict', service: 'verifier', start: 23700, end: 24500, attributes: llm('sonnet-5.5', 8000, 600) },
  { id: 'ben', parentId: 'orch', name: 'Benchmark against upstream', service: 'bencher', start: 9000, end: 25800, attributes: op('invoke_agent', { 'gen_ai.agent.name': 'bencher', 'gen_ai.request.model': 'haiku-5.5' }) },
  { id: 'b1', parentId: 'ben', name: 'run_benchmark', service: 'bencher', start: 9400, end: 22000, attributes: op('execute_tool', { 'gen_ai.tool.name': 'run_benchmark' }) },
  { id: 'b2', parentId: 'ben', name: 'Compare with baseline', service: 'bencher', start: 22200, end: 25600, attributes: llm('haiku-5.5', 22000, 2100) },
  { id: 'o2', parentId: 'orch', name: 'Stage the stack', service: 'stack-keeper', start: 25900, end: 27200, attributes: llm('opus-5.5', 40000, 1800) },
  { id: 'o3', parentId: 'orch', name: 'Push staging/5.4?', service: 'stack-keeper', start: 27300, agentKind: 'decision' },
];

/** Sample prices per million tokens, input then output. Illustrative only. */
const SAMPLE_PRICES: Record<string, readonly [number, number]> = {
  'opus-5.5': [5, 25],
  'sonnet-5.5': [3, 15],
  'haiku-5.5': [1, 5],
};

/** A `price` function for `buildTrace`, from `SAMPLE_PRICES`. */
export function samplePrice(span: { model?: string; usage: { inputTokens: number; outputTokens: number } }): number | undefined {
  const rates = span.model ? SAMPLE_PRICES[span.model] : undefined;
  if (!rates || !(span.usage.inputTokens || span.usage.outputTokens)) return undefined;
  return (span.usage.inputTokens * rates[0] + span.usage.outputTokens * rates[1]) / 1e6;
}

/** Where `agentRunTrace` is drawn to: three seconds into its decision. */
export const AGENT_RUN_NOW = 30200;
