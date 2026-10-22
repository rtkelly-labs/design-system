/**
 * The trace model: spans in, a laid-out waterfall out.
 *
 * One module answers "where does this span sit, and why is it slow?" for every
 * renderer that draws a trace — `TraceWaterfall` and `TraceViewer` in React,
 * and `formatTraceWaterfall` for a terminal or a CI log. Pure data, no React,
 * so the bin in `@rtkelly13/design-system-report` (`ds-trace`) can import it
 * from the package entry and draw exactly the layout the components draw.
 *
 * ## Time
 *
 * Every time here is **milliseconds**, as numbers. OTLP's nanosecond strings
 * are converted at the parse boundary (`parseOtlpTrace`) and nowhere else.
 *
 * ## Dynamic traces
 *
 * A span with no `end` and no `duration` is **in flight**. It is drawn to
 * `now`, which the caller supplies — the model never reads the clock, so a
 * render is a pure function of its inputs and a story or a snapshot is
 * deterministic. Feed a growing span list and an advancing `now` and the
 * waterfall grows live; see `useTraceClock`.
 */

/** A span attribute value, as OTLP's `AnyValue` flattens to. */
export type TraceAttributeValue = string | number | boolean;

/** Outcome of a span. `unset` is OTLP's default: nothing was recorded. */
export type TraceSpanStatus = 'ok' | 'error' | 'unset';

/** One span as a caller hands it over. */
export interface TraceSpanInput {
  /** Unique within the trace. */
  id: string;
  /** The enclosing span. Missing, or naming a span not in the trace, makes this a root. */
  parentId?: string | null;
  /** Operation name — `GET /checkout`, `db.query`. */
  name: string;
  /** The service (OTLP `service.name`) that emitted the span. */
  service?: string;
  /** Start time in milliseconds, on any epoch shared by the whole trace. */
  start: number;
  /** End time in milliseconds. Omit with `duration` for an in-flight span. */
  end?: number;
  /** Duration in milliseconds. Used when `end` is absent. */
  duration?: number;
  /** Defaults to `unset`. */
  status?: TraceSpanStatus;
  /** OTLP span kind — `server`, `client`, `internal`, `producer`, `consumer`. */
  kind?: string;
  /** Flat key/value attributes, shown in the span details. */
  attributes?: Record<string, TraceAttributeValue>;
}

/** A span after layout. Offsets are relative to the trace start. */
export interface TraceSpan {
  id: string;
  parentId: string | null;
  name: string;
  service: string;
  status: TraceSpanStatus;
  kind?: string;
  attributes: Record<string, TraceAttributeValue>;
  /** Nesting depth; roots are 0. */
  depth: number;
  /** Child span ids, in start order. */
  children: string[];
  /** Milliseconds from the trace start. */
  offset: number;
  /** Milliseconds. For an in-flight span, up to `now`. */
  duration: number;
  /** Duration not covered by any child. */
  selfTime: number;
  /** Had no end: drawn to `now`. */
  inFlight: boolean;
  /** On the chain of spans that determined the trace's end. */
  critical: boolean;
}

/** A trace laid out for drawing. */
export interface TraceModel {
  /** Every span, depth-first in start order — the waterfall's row order. */
  spans: TraceSpan[];
  byId: ReadonlyMap<string, TraceSpan>;
  /** Absolute start of the earliest span, in the input's epoch. */
  start: number;
  /** Milliseconds from the first start to the last end. */
  duration: number;
  /** Distinct services, in order of first appearance. */
  services: string[];
  errorCount: number;
  inFlightCount: number;
  /** Ids on the critical path, root first. */
  criticalPath: string[];
}

export interface BuildTraceOptions {
  /**
   * Where an in-flight span ends, in the input's epoch. Defaults to the latest
   * known end or start, so an in-flight span without a clock is drawn to the
   * trace's edge rather than to nothing.
   */
  now?: number;
}

const UNKNOWN_SERVICE = 'unknown';

/** True when `value` is a finite number. */
function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Lay out a trace. Spans with a non-finite start are dropped; duplicate ids
 * keep the first; a parent cycle is broken by treating the span that closes it
 * as a root.
 */
export function buildTrace(input: readonly TraceSpanInput[] | TraceModel, options: BuildTraceOptions = {}): TraceModel {
  if (!Array.isArray(input)) return input as TraceModel;
  const seen = new Set<string>();
  const valid = (input as readonly TraceSpanInput[]).filter((span) => {
    if (!span || typeof span.id !== 'string' || !finite(span.start) || seen.has(span.id)) return false;
    seen.add(span.id);
    return true;
  });

  const knownEnd = (span: TraceSpanInput): number | null => {
    if (finite(span.end)) return Math.max(span.start, span.end);
    if (finite(span.duration)) return span.start + Math.max(0, span.duration);
    return null;
  };
  let latest = -Infinity;
  for (const span of valid) latest = Math.max(latest, knownEnd(span) ?? span.start);
  const now = finite(options.now) ? options.now : latest;

  const start = valid.length ? Math.min(...valid.map((span) => span.start)) : 0;
  const ids = new Set(valid.map((span) => span.id));
  const childrenOf = new Map<string | null, TraceSpanInput[]>();
  for (const span of valid) {
    const parent = span.parentId && span.parentId !== span.id && ids.has(span.parentId) ? span.parentId : null;
    const list = childrenOf.get(parent) ?? [];
    list.push(span);
    childrenOf.set(parent, list);
  }
  for (const list of childrenOf.values()) list.sort((a, b) => a.start - b.start || a.id.localeCompare(b.id));

  const spans: TraceSpan[] = [];
  const byId = new Map<string, TraceSpan>();
  const visit = (span: TraceSpanInput, parentId: string | null, depth: number) => {
    if (byId.has(span.id)) return;
    const end = knownEnd(span);
    const inFlight = end === null;
    const laid: TraceSpan = {
      id: span.id,
      parentId,
      name: span.name || span.id,
      service: span.service || UNKNOWN_SERVICE,
      status: span.status ?? 'unset',
      kind: span.kind,
      attributes: { ...span.attributes },
      depth,
      children: [],
      offset: span.start - start,
      duration: Math.max(0, (end ?? now) - span.start),
      selfTime: 0,
      inFlight,
      critical: false,
    };
    byId.set(span.id, laid);
    spans.push(laid);
    for (const child of childrenOf.get(span.id) ?? []) {
      if (byId.has(child.id)) continue;
      laid.children.push(child.id);
      visit(child, span.id, depth + 1);
    }
  };
  for (const root of childrenOf.get(null) ?? []) visit(root, null, 0);
  // Anything unvisited sits on a parent cycle; its first member becomes a root.
  for (const span of [...valid].sort((a, b) => a.start - b.start)) if (!byId.has(span.id)) visit(span, null, 0);

  for (const span of spans) span.selfTime = selfTime(span, byId);

  const duration = spans.reduce((max, span) => Math.max(max, span.offset + span.duration), 0);
  const criticalPath = computeCriticalPath(spans, byId);
  for (const id of criticalPath) byId.get(id)!.critical = true;

  const services: string[] = [];
  for (const span of spans) if (!services.includes(span.service)) services.push(span.service);

  return {
    spans,
    byId,
    start,
    duration,
    services,
    errorCount: spans.filter((span) => span.status === 'error').length,
    inFlightCount: spans.filter((span) => span.inFlight).length,
    criticalPath,
  };
}

/** The part of a span's own interval no child covers. */
function selfTime(span: TraceSpan, byId: ReadonlyMap<string, TraceSpan>): number {
  const from = span.offset;
  const to = span.offset + span.duration;
  const intervals = span.children
    .map((id) => byId.get(id)!)
    .map((child) => [Math.max(from, child.offset), Math.min(to, child.offset + child.duration)] as const)
    .filter(([a, b]) => b > a)
    .sort((a, b) => a[0] - b[0]);
  let covered = 0;
  let cursor = from;
  for (const [a, b] of intervals) {
    if (b <= cursor) continue;
    covered += b - Math.max(a, cursor);
    cursor = b;
  }
  return Math.max(0, span.duration - covered);
}

/**
 * The chain that decided when the trace finished: from the root that ends
 * last, repeatedly step into the child that ends last before the point the walk
 * has reached. Children that ended early — and overlapped the one that ended
 * last — did not hold anything up.
 */
function computeCriticalPath(spans: readonly TraceSpan[], byId: ReadonlyMap<string, TraceSpan>): string[] {
  const end = (span: TraceSpan) => span.offset + span.duration;
  const roots = spans.filter((span) => span.parentId === null);
  if (!roots.length) return [];
  const path: string[] = [];
  let current: TraceSpan | undefined = roots.reduce((a, b) => (end(b) > end(a) ? b : a));
  while (current) {
    path.push(current.id);
    const limit = end(current);
    const children: TraceSpan[] = current.children.map((id) => byId.get(id)!).filter((child) => end(child) <= limit + 1e-9);
    current = children.length ? children.reduce((a, b) => (end(b) > end(a) ? b : a)) : undefined;
  }
  return path;
}

/**
 * The rows to draw when the spans in `collapsed` hide their descendants, and —
 * when `filter` is given — only spans that match it, together with the
 * ancestors that place them.
 */
export function visibleTraceSpans(
  model: TraceModel,
  collapsed: ReadonlySet<string> = new Set(),
  filter?: (span: TraceSpan) => boolean,
): TraceSpan[] {
  let keep: Set<string> | null = null;
  if (filter) {
    keep = new Set();
    for (const span of model.spans) {
      if (!filter(span)) continue;
      for (let at: TraceSpan | undefined = span; at && !keep.has(at.id); at = at.parentId ? model.byId.get(at.parentId) : undefined) keep.add(at.id);
    }
  }
  const rows: TraceSpan[] = [];
  const walk = (span: TraceSpan) => {
    if (keep && !keep.has(span.id)) return;
    rows.push(span);
    if (collapsed.has(span.id)) return;
    for (const id of span.children) walk(model.byId.get(id)!);
  };
  for (const span of model.spans) if (span.parentId === null) walk(span);
  return rows;
}

/** A case-insensitive match on name, service and attribute values. */
export function matchTraceSpan(span: TraceSpan, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  if (span.name.toLowerCase().includes(needle) || span.service.toLowerCase().includes(needle)) return true;
  return Object.entries(span.attributes).some(([key, value]) => `${key}=${String(value)}`.toLowerCase().includes(needle));
}

/** `0.42ms`, `12ms`, `1.24s`, `2m 05s`. */
export function formatTraceDuration(ms: number): string {
  if (!finite(ms) || ms < 0) return '—';
  if (ms === 0) return '0ms';
  if (ms < 1) return `${ms.toFixed(2)}ms`;
  if (ms < 10) return `${ms.toFixed(1).replace(/\.0$/, '')}ms`;
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(2).replace(/\.?0+$/, '')}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

/**
 * Evenly spaced axis ticks on a "nice" step (1, 2 or 5 × 10ⁿ) covering
 * `duration`, at most `target + 1` of them, always starting at 0.
 */
export function traceTicks(duration: number, target = 4): number[] {
  if (!finite(duration) || duration <= 0) return [0];
  const raw = duration / Math.max(1, target);
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((candidate) => candidate >= raw) ?? raw;
  const ticks: number[] = [];
  for (let tick = 0; tick <= duration + step * 1e-9; tick += step) ticks.push(Number(tick.toPrecision(12)));
  return ticks;
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

interface OtlpAnyValue {
  stringValue?: string;
  intValue?: string | number;
  doubleValue?: number;
  boolValue?: boolean;
  arrayValue?: { values?: OtlpAnyValue[] };
}
interface OtlpKeyValue { key: string; value?: OtlpAnyValue }

function anyValue(value: OtlpAnyValue | undefined): TraceAttributeValue {
  if (!value) return '';
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.boolValue !== undefined) return value.boolValue;
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.intValue !== undefined) return Number(value.intValue);
  if (value.arrayValue) return (value.arrayValue.values ?? []).map((item) => String(anyValue(item))).join(', ');
  return '';
}

function attributes(list: readonly OtlpKeyValue[] | undefined): Record<string, TraceAttributeValue> {
  const out: Record<string, TraceAttributeValue> = {};
  for (const entry of list ?? []) if (entry && typeof entry.key === 'string') out[entry.key] = anyValue(entry.value);
  return out;
}

/** Nanoseconds since the epoch, as OTLP JSON writes them, to milliseconds. */
function nanosToMs(value: unknown): number | undefined {
  if (typeof value === 'number') return value / 1e6;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return undefined;
  // Split rather than Number(): a nanosecond epoch is past 2^53.
  const whole = value.length > 6 ? Number(value.slice(0, -6)) : 0;
  const fraction = Number(value.slice(-6)) / 1e6;
  return whole + fraction;
}

const OTLP_KINDS = ['unspecified', 'internal', 'server', 'client', 'producer', 'consumer'];
const OTLP_STATUS: Record<string, TraceSpanStatus> = { '0': 'unset', '1': 'ok', '2': 'error', STATUS_CODE_UNSET: 'unset', STATUS_CODE_OK: 'ok', STATUS_CODE_ERROR: 'error' };

/**
 * Read OTLP/JSON (`{ resourceSpans: [...] }`, as an OpenTelemetry collector's
 * file exporter or `/v1/traces` writes it) into span inputs. `service.name`
 * comes from each resource. Ids are taken as written (hex or base64).
 */
export function parseOtlpTrace(document: unknown): TraceSpanInput[] {
  const resourceSpans = (document as { resourceSpans?: unknown[] } | null)?.resourceSpans;
  if (!Array.isArray(resourceSpans)) return [];
  const out: TraceSpanInput[] = [];
  for (const resource of resourceSpans as Array<{ resource?: { attributes?: OtlpKeyValue[] }; scopeSpans?: Array<{ spans?: unknown[] }>; instrumentationLibrarySpans?: Array<{ spans?: unknown[] }> }>) {
    const resourceAttributes = attributes(resource?.resource?.attributes);
    const service = typeof resourceAttributes['service.name'] === 'string' ? (resourceAttributes['service.name'] as string) : undefined;
    for (const scope of resource?.scopeSpans ?? resource?.instrumentationLibrarySpans ?? []) {
      for (const raw of scope?.spans ?? []) {
        const span = raw as { spanId?: string; parentSpanId?: string; name?: string; kind?: number | string; startTimeUnixNano?: string | number; endTimeUnixNano?: string | number; status?: { code?: number | string }; attributes?: OtlpKeyValue[] };
        const start = nanosToMs(span.startTimeUnixNano);
        if (!span.spanId || start === undefined) continue;
        const end = nanosToMs(span.endTimeUnixNano);
        const kind = typeof span.kind === 'number' ? OTLP_KINDS[span.kind] : typeof span.kind === 'string' ? span.kind.replace(/^SPAN_KIND_/, '').toLowerCase() : undefined;
        out.push({
          id: span.spanId,
          parentId: span.parentSpanId || null,
          name: span.name ?? span.spanId,
          service,
          start,
          // OTLP writes "0" for a span still open when it was exported.
          end: end === undefined || end === 0 ? undefined : end,
          status: OTLP_STATUS[String(span.status?.code ?? '0')] ?? 'unset',
          kind: kind && kind !== 'unspecified' ? kind : undefined,
          attributes: attributes(span.attributes),
        });
      }
    }
  }
  return out;
}

/**
 * Accept any of the shapes a trace arrives in: OTLP/JSON, a bare span array,
 * `{ spans: [...] }`, or newline-delimited JSON where each line is one of
 * those. Unparseable lines are skipped, so a partially written stream reads.
 */
export function parseTraceDocument(input: unknown): TraceSpanInput[] {
  if (typeof input === 'string') {
    const text = input.trim();
    if (!text) return [];
    try {
      return parseTraceDocument(JSON.parse(text) as unknown);
    } catch {
      return text.split(/\r?\n/).flatMap((line) => {
        try {
          return parseTraceDocument(JSON.parse(line) as unknown);
        } catch {
          return [];
        }
      });
    }
  }
  if (Array.isArray(input)) return input.flatMap((item) => (item && typeof item === 'object' && 'resourceSpans' in item ? parseOtlpTrace(item) : isSpanInput(item) ? [item] : []));
  if (input && typeof input === 'object') {
    if ('resourceSpans' in input) return parseOtlpTrace(input);
    if ('spans' in input && Array.isArray((input as { spans: unknown }).spans)) return parseTraceDocument((input as { spans: unknown[] }).spans);
    if (isSpanInput(input)) return [input];
  }
  return [];
}

function isSpanInput(value: unknown): value is TraceSpanInput {
  const span = value as TraceSpanInput | null;
  return !!span && typeof span === 'object' && typeof span.id === 'string' && finite(span.start);
}

// ---------------------------------------------------------------------------
// Text output
// ---------------------------------------------------------------------------

export interface FormatTraceWaterfallOptions extends BuildTraceOptions {
  /** Character cells for the bar column. Clamped to 8–400. Default 48. */
  columns?: number;
  /** Width of the name column, tree guides included. Default: fit, at most 40. */
  labelWidth?: number;
  /** Emit ANSI colour. Default false — a log file should read as text. */
  color?: boolean;
  /** Draw with `#`, `=` and `|` instead of block and box characters. */
  ascii?: boolean;
  /** Hide the service column. */
  hideService?: boolean;
}

/** SGR codes by role. Base ANSI slots, so a themed terminal paints them. */
const ANSI = {
  reset: '\u001b[0m',
  dim: '\u001b[2m',
  bold: '\u001b[1m',
  danger: '\u001b[31m',
  info: '\u001b[36m',
  accent: ['\u001b[34m', '\u001b[35m', '\u001b[32m', '\u001b[33m'],
} as const;

const EIGHTHS = ['', '▏', '▎', '▍', '▌', '▋', '▊', '▉'];

function fit(text: string, width: number): string {
  const chars = [...text];
  if (chars.length <= width) return text + ' '.repeat(width - chars.length);
  return `${chars.slice(0, Math.max(0, width - 1)).join('')}…`;
}

/**
 * A trace as a fixed-width text waterfall: a summary line, an axis, then one
 * row per span — tree guides, name, service, bar, duration. With `color`, bars
 * are painted by service, errors in the danger slot and in-flight spans in the
 * info slot; `◆` marks the critical path either way, so it survives a log.
 */
export function formatTraceWaterfall(input: readonly TraceSpanInput[] | TraceModel, options: FormatTraceWaterfallOptions = {}): string {
  const model = buildTrace(input, options);
  const paint = (code: string, text: string) => (options.color ? `${code}${text}${ANSI.reset}` : text);
  const cells = Math.max(8, Math.min(400, Math.round(finite(options.columns) ? options.columns : 48)));
  const ascii = !!options.ascii;
  const guides = ascii ? { tee: '|- ', last: '`- ', pipe: '|  ', gap: '   ' } : { tee: '├─ ', last: '└─ ', pipe: '│  ', gap: '   ' };

  const summary = [
    `${model.spans.length} span${model.spans.length === 1 ? '' : 's'}`,
    formatTraceDuration(model.duration),
    `${model.services.length} service${model.services.length === 1 ? '' : 's'}`,
    model.errorCount ? paint(ANSI.danger, `${model.errorCount} error${model.errorCount === 1 ? '' : 's'}`) : '0 errors',
    ...(model.inFlightCount ? [paint(ANSI.info, `${model.inFlightCount} in flight`)] : []),
  ].join(' · ');
  if (!model.spans.length) return `TRACE  ${summary}\n`;

  // Tree prefixes, built per row from which ancestors still have siblings below.
  const prefix = new Map<string, string>();
  const lastChild = (span: TraceSpan) => {
    const siblings = span.parentId ? model.byId.get(span.parentId)!.children : model.spans.filter((s) => s.parentId === null).map((s) => s.id);
    return siblings[siblings.length - 1] === span.id;
  };
  for (const span of model.spans) {
    if (span.parentId === null) { prefix.set(span.id, ''); continue; }
    const parent = model.byId.get(span.parentId)!;
    const inherited = parent.parentId === null ? '' : `${prefix.get(parent.id)!.slice(0, -3)}${lastChild(parent) ? guides.gap : guides.pipe}`;
    prefix.set(span.id, `${inherited}${lastChild(span) ? guides.last : guides.tee}`);
  }

  const labels = model.spans.map((span) => `${prefix.get(span.id)}${span.critical ? '◆ ' : ''}${span.name}`);
  const labelWidth = Math.max(8, Math.min(200, options.labelWidth ?? Math.min(40, Math.max(...labels.map((label) => [...label].length)))));
  const serviceWidth = options.hideService ? 0 : Math.min(16, Math.max(...model.services.map((service) => service.length)));
  const durations = model.spans.map((span) => `${formatTraceDuration(span.duration)}${span.inFlight ? '…' : ''}`);
  const durationWidth = Math.max(...durations.map((text) => text.length));
  const lead = labelWidth + (serviceWidth ? serviceWidth + 2 : 0) + 2;
  const scale = model.duration > 0 ? cells / model.duration : 0;

  const axis: string[] = Array.from({ length: cells }, () => ' ');
  const axisLine: string[] = Array.from({ length: cells }, () => (ascii ? '-' : '─'));
  for (const tick of traceTicks(model.duration, Math.max(1, Math.floor(cells / 12)))) {
    const at = Math.min(cells - 1, Math.round(tick * scale));
    const label = formatTraceDuration(tick);
    const from = Math.min(Math.max(0, at), cells - label.length);
    if (axis.slice(from, from + label.length + 1).some((ch) => ch !== ' ')) continue;
    [...label].forEach((ch, i) => { axis[from + i] = ch; });
    axisLine[at] = ascii ? '+' : '┬';
  }

  const lines = [
    `${paint(ANSI.bold, 'TRACE')}  ${summary}`,
    `${' '.repeat(lead)}${paint(ANSI.dim, axis.join(''))}`,
    `${' '.repeat(lead)}${paint(ANSI.dim, axisLine.join(''))}`,
  ];
  model.spans.forEach((span, row) => {
    const from = span.offset * scale;
    const to = (span.offset + span.duration) * scale;
    const startCell = Math.min(cells - 1, Math.floor(from));
    let bar: string;
    if (ascii) {
      const width = Math.max(1, Math.round(to) - startCell);
      bar = `${' '.repeat(startCell)}${(span.inFlight ? '=' : '#').repeat(Math.min(width, cells - startCell))}`;
    } else {
      // Sub-cell precision on the right edge with the eighth blocks.
      const length = Math.max(1 / 8, to - startCell);
      const whole = Math.min(cells - startCell, Math.floor(length));
      const eighth = whole < cells - startCell ? Math.round((length - whole) * 8) : 0;
      bar = `${' '.repeat(startCell)}${(span.inFlight ? '▒' : '█').repeat(whole)}${eighth === 8 ? '█' : EIGHTHS[eighth]}`;
      if (!whole && !eighth) bar += '▏';
    }
    bar = fit(bar, cells);
    const tone = span.status === 'error' ? ANSI.danger : span.inFlight ? ANSI.info : ANSI.accent[model.services.indexOf(span.service) % ANSI.accent.length]!;
    const label = fit(labels[row]!, labelWidth);
    const service = serviceWidth ? `  ${paint(ANSI.dim, fit(span.service, serviceWidth))}` : '';
    const duration = durations[row]!.padStart(durationWidth);
    lines.push(`${span.critical ? paint(ANSI.bold, label) : label}${service}  ${paint(tone, bar)} ${span.status === 'error' ? paint(ANSI.danger, duration) : duration}`);
  });
  return `${lines.join('\n')}\n`;
}
