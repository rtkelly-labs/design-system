/**
 * The flame model: call stacks in, a laid-out flame graph out — and two of
 * them compared.
 *
 * One module answers "where did the time go, and where did it change?" for
 * `Flamegraph`. Pure data, no React, so a consumer (or a static report
 * generator) can build, zoom, search and diff a profile without rendering one.
 *
 * ## Inputs
 *
 * Two shapes reach the same tree:
 *
 * - **Folded stacks** (`parseFoldedStacks`) — Brendan Gregg's `a;b;c 123`, one
 *   stack per line, root first, a count last. What `stackcollapse-*`, `perf`,
 *   `dotnet-trace` converters, `0x` and `py-spy --format raw` produce.
 * - **A trace** (`flameFromTrace`) — each span becomes a frame, weighted by its
 *   **self time**, so a trace and a CPU profile share one view.
 *
 * ## Layout
 *
 * Every frame carries `total` (itself and everything it called) and `self`
 * (itself alone), plus `x` and `width` as **fractions of the root**, so a
 * renderer multiplies by whatever width it has and never re-walks the tree.
 *
 * `order: 'alphabetical'` is the classic flame graph: siblings with the same
 * name merge wherever they appear and are sorted by name, so the x axis means
 * nothing and width is everything. `order: 'time'` is a flame chart: only
 * *adjacent* same-name siblings merge and input order is kept, so the x axis
 * reads left to right as sequence.
 *
 * ## Comparing
 *
 * `diffFlame` follows the evidence rule a Diffra report is held to: never imply
 * a change that cannot be computed. A relative change against a zero baseline
 * is `null`, not infinity; a frame present on one side only says `new` or
 * `removed` rather than borrowing a percentage; and two profiles in different
 * units are `incompatible`, not compared. Nothing here says "regressed" — a
 * single pair of profiles is one sample, and the words for a verdict belong to
 * whoever owns the policy.
 */

import { buildTrace, formatTraceDuration, type TraceModel, type TraceSpanInput } from './trace';

/** What a frame's numbers count. `samples` for folded profiles, `ms` for traces. */
export type FlameUnit = 'samples' | 'ms' | (string & {});

/** One call stack and the weight observed on it. `frames` is root first. */
export interface FlameStack {
  frames: readonly string[];
  value: number;
}

/** What `parseFoldedStacks` read, and the lines it could not. */
export interface FoldedStacks {
  stacks: FlameStack[];
  /** 1-based line numbers that were neither blank, a comment, nor `stack count`. */
  skipped: number[];
}

/** `alphabetical` for a flame graph, `time` for a flame chart. */
export type FlameOrder = 'alphabetical' | 'time';

/** One frame after layout. */
export interface FlameFrame {
  /**
   * Stable across builds of the same profile: the `;`-joined path of names from
   * the root's first child down (`;` and `\` escaped), with a `#n` suffix for
   * the n-th unmerged sibling of the same name in `time` order. The root's id
   * is `''`. Two profiles' frames are matched by this id.
   */
  id: string;
  name: string;
  parentId: string | null;
  /** The synthetic root is 0. */
  depth: number;
  /** This frame and everything beneath it. */
  total: number;
  /** This frame alone: `total` less its children's totals. */
  self: number;
  /** Left edge, as a fraction of the root's total. */
  x: number;
  /** Width, as a fraction of the root's total. */
  width: number;
  /** In drawing order. */
  children: FlameFrame[];
}

/** A profile laid out for drawing. */
export interface FlameTree {
  /** The synthetic root (`all`), whose total is the whole profile. */
  root: FlameFrame;
  /** Every frame, depth-first in drawing order, root first. */
  frames: FlameFrame[];
  byId: ReadonlyMap<string, FlameFrame>;
  /** The deepest frame's depth. */
  maxDepth: number;
  total: number;
  unit: FlameUnit;
  order: FlameOrder;
}

export interface BuildFlameOptions {
  /** Default `alphabetical`. */
  order?: FlameOrder;
  /** Default `samples`. */
  unit?: FlameUnit;
  /** The synthetic root's name. Default `all`. */
  rootName?: string;
}

/** True when `value` is a finite number. */
function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * Read Brendan Gregg's folded format: `root;child;leaf 123` per line. The count
 * is split off at the **last** run of whitespace, because frame names carry
 * spaces (`Foo.Bar(int, string)`). Blank lines and `#` comments are ignored;
 * any other line without a non-negative count is reported in `skipped` rather
 * than silently dropped, so a caller can say what it did not read.
 */
export function parseFoldedStacks(text: string): FoldedStacks {
  const stacks: FlameStack[] = [];
  const skipped: number[] = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((raw, index) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    const match = /^(.*\S)\s+(\d+(?:\.\d+)?)$/.exec(line);
    const value = match ? Number(match[2]) : NaN;
    const frames = match ? match[1].split(';').filter((frame) => frame.length > 0) : [];
    if (!match || !finite(value) || frames.length === 0) {
      skipped.push(index + 1);
      return;
    }
    stacks.push({ frames, value });
  });
  return { stacks, skipped };
}

// ---------------------------------------------------------------------------
// Building
// ---------------------------------------------------------------------------

interface Draft {
  name: string;
  self: number;
  children: Draft[];
  byName: Map<string, Draft>;
}

function escapeName(name: string): string {
  return name.replace(/\\/g, '\\\\').replace(/;/g, '\\;');
}

/**
 * Lay out a profile. Accepts stacks, the result of `parseFoldedStacks`, or
 * folded text. Stacks with no frames or a non-finite or non-positive value add
 * nothing and are dropped.
 */
export function buildFlame(input: readonly FlameStack[] | FoldedStacks | string, options: BuildFlameOptions = {}): FlameTree {
  const order: FlameOrder = options.order ?? 'alphabetical';
  const unit: FlameUnit = options.unit ?? 'samples';
  const stacks = typeof input === 'string' ? parseFoldedStacks(input).stacks : Array.isArray(input) ? (input as readonly FlameStack[]) : (input as FoldedStacks).stacks;

  const draftRoot: Draft = { name: options.rootName ?? 'all', self: 0, children: [], byName: new Map() };
  for (const stack of stacks) {
    if (!stack || !finite(stack.value) || stack.value <= 0 || !stack.frames?.length) continue;
    let at = draftRoot;
    for (const name of stack.frames) {
      let next: Draft | undefined;
      if (order === 'alphabetical') next = at.byName.get(name);
      else {
        const last = at.children[at.children.length - 1];
        next = last && last.name === name ? last : undefined;
      }
      if (!next) {
        next = { name, self: 0, children: [], byName: new Map() };
        at.children.push(next);
        if (order === 'alphabetical') at.byName.set(name, next);
      }
      at = next;
    }
    at.self += stack.value;
  }

  const frames: FlameFrame[] = [];
  const byId = new Map<string, FlameFrame>();
  let maxDepth = 0;

  // Totals first, bottom up, so layout can place children by width.
  const totalOf = new Map<Draft, number>();
  const sum = (draft: Draft): number => {
    let total = draft.self;
    for (const child of draft.children) total += sum(child);
    totalOf.set(draft, total);
    return total;
  };
  const rootTotal = sum(draftRoot);

  const place = (draft: Draft, id: string, parentId: string | null, depth: number, x: number): FlameFrame => {
    const total = totalOf.get(draft) ?? 0;
    const frame: FlameFrame = {
      id,
      name: draft.name,
      parentId,
      depth,
      total,
      self: draft.self,
      x,
      width: rootTotal > 0 ? total / rootTotal : 0,
      children: [],
    };
    frames.push(frame);
    byId.set(id, frame);
    maxDepth = Math.max(maxDepth, depth);
    // Code-point order, not locale order: a layout must not vary by machine.
    const children = order === 'alphabetical' ? [...draft.children].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) : draft.children;
    const seen = new Map<string, number>();
    let cursor = x;
    for (const child of children) {
      const nth = (seen.get(child.name) ?? 0) + 1;
      seen.set(child.name, nth);
      const segment = escapeName(child.name) + (nth > 1 ? `#${nth}` : '');
      const childFrame = place(child, id === '' ? segment : `${id};${segment}`, id, depth + 1, cursor);
      frame.children.push(childFrame);
      cursor += childFrame.width;
    }
    return frame;
  };
  const root = place(draftRoot, '', null, 0, 0);

  return { root, frames, byId, maxDepth, total: rootTotal, unit, order };
}

export interface FlameFromTraceOptions {
  /** Default `time`: a trace has a sequence worth keeping. */
  order?: FlameOrder;
  /** The frame name for a span. Default `span.name`. */
  label?: (span: { name: string; service: string }) => string;
}

/**
 * A trace as a flame tree. Each span is a frame weighted by its **self time**
 * (the part of it no child covers), so a frame's total is the span time beneath
 * it — work, not wall clock. Where children ran in parallel, a frame can be
 * wider than its span's duration; that is the honest answer to "how much span
 * time sits under here", and the reason a flame view complements a waterfall
 * rather than replacing it. The unit is `ms`.
 */
export function flameFromTrace(input: readonly TraceSpanInput[] | TraceModel, options: FlameFromTraceOptions = {}): FlameTree {
  const model = buildTrace(input);
  const label = options.label ?? ((span) => span.name);
  const stacks: FlameStack[] = [];
  const pathOf = new Map<string, string[]>();
  // `model.spans` is depth-first in start order, so a parent's path exists
  // before its children ask for it, and siblings arrive in sequence.
  for (const span of model.spans) {
    const parentPath = span.parentId ? (pathOf.get(span.parentId) ?? []) : [];
    const path = [...parentPath, label(span)];
    pathOf.set(span.id, path);
    // A span with no self time adds no stack of its own; its frame is created
    // by its first child's stack, which still arrives in sequence.
    stacks.push({ frames: path, value: span.selfTime });
  }
  return buildFlame(stacks, { order: options.order ?? 'time', unit: 'ms' });
}

// ---------------------------------------------------------------------------
// Viewing
// ---------------------------------------------------------------------------

/** A frame as a zoomed view draws it. */
export interface FlameViewFrame {
  frame: FlameFrame;
  /** Left edge as a fraction of the view. */
  x: number;
  /** Width as a fraction of the view. */
  width: number;
  /** An ancestor of the zoom target: drawn full width, as context. */
  context: boolean;
}

/**
 * The frames to draw when zoomed into `focusId`: its ancestors full width as
 * context, and its subtree re-fractioned so the focus spans the view. An
 * unknown or empty id is the whole profile.
 */
export function zoomFlame(tree: FlameTree, focusId?: string | null): FlameViewFrame[] {
  const focus = (focusId ? tree.byId.get(focusId) : undefined) ?? tree.root;
  const out: FlameViewFrame[] = [];
  const ancestors: FlameFrame[] = [];
  for (let at = focus.parentId !== null ? tree.byId.get(focus.parentId) : undefined; at; at = at.parentId !== null ? tree.byId.get(at.parentId) : undefined) ancestors.unshift(at);
  for (const frame of ancestors) out.push({ frame, x: 0, width: 1, context: true });
  const span = focus.width;
  const walk = (frame: FlameFrame) => {
    out.push({ frame, x: span > 0 ? (frame.x - focus.x) / span : 0, width: span > 0 ? frame.width / span : 0, context: false });
    for (const child of frame.children) walk(child);
  };
  walk(focus);
  return out;
}

/** The frames from the root to `id`, inclusive — a breadcrumb. */
export function flamePath(tree: FlameTree, id?: string | null): FlameFrame[] {
  const path: FlameFrame[] = [];
  for (let at: FlameFrame | undefined = (id ? tree.byId.get(id) : undefined) ?? tree.root; at; at = at.parentId !== null ? tree.byId.get(at.parentId) : undefined) path.unshift(at);
  return path;
}

/** What a search found. */
export interface FlameSearchResult {
  /** Frames whose name contains the query, case-insensitively. */
  ids: Set<string>;
  /** Weight under matched frames, counting a match nested in another match once. */
  matched: number;
  /** `matched` over the profile's total; `null` for an empty profile. */
  share: number | null;
}

/** Find frames by name, and how much of the profile sits under them. */
export function searchFlame(tree: FlameTree, query: string): FlameSearchResult {
  const needle = query.trim().toLowerCase();
  const ids = new Set<string>();
  let matched = 0;
  if (!needle) return { ids, matched, share: null };
  const walk = (frame: FlameFrame, covered: boolean) => {
    const hit = frame.parentId !== null && frame.name.toLowerCase().includes(needle);
    if (hit) ids.add(frame.id);
    if (hit && !covered) matched += frame.total;
    for (const child of frame.children) walk(child, covered || hit);
  };
  walk(tree.root, false);
  return { ids, matched, share: tree.total > 0 ? matched / tree.total : null };
}

/** `1,204 samples`, `1 sample`, `1.24s` for `ms`, else `12 <unit>`. */
export function formatFlameValue(value: number, unit: FlameUnit): string {
  if (!finite(value)) return '—';
  if (unit === 'ms') return formatTraceDuration(value);
  const number = NUMBER.format(value);
  if (unit === 'samples') return `${number} ${value === 1 ? 'sample' : 'samples'}`;
  return `${number} ${unit}`;
}

/** A share as a percentage: `34.2%`, `<0.1%`, `0%`. */
export function formatFlameShare(share: number | null): string {
  if (share === null || !finite(share)) return 'n/a';
  if (share === 0) return '0%';
  const percent = share * 100;
  if (percent < 0.1) return '<0.1%';
  return `${PERCENT.format(percent)}%`;
}

const NUMBER = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });
const PERCENT = new Intl.NumberFormat('en', { maximumFractionDigits: 1 });

/**
 * Fit a label into `width` pixels at `charWidth` pixels per character —
 * monospace makes the estimate dependable without measuring text, which a
 * static render cannot do. Returns the whole name, a prefix ending `…`, or `''`
 * when fewer than three characters fit.
 */
export function fitFlameLabel(name: string, width: number, charWidth: number): string {
  if (!(width > 0) || !(charWidth > 0)) return '';
  const fits = Math.floor(width / charWidth);
  if (name.length <= fits) return name;
  if (fits < 3) return '';
  return `${name.slice(0, fits - 1)}…`;
}

// ---------------------------------------------------------------------------
// Comparing
// ---------------------------------------------------------------------------

/** One number on both sides. `null` where a side has no value or a change cannot be computed. */
export interface FlameDelta {
  baseline: number | null;
  candidate: number | null;
  /** `candidate − baseline`. A frame absent on one side counts as zero there — a profile that never sampled it. */
  absolute: number | null;
  /** `absolute / baseline`. `null` when the baseline is absent or zero: there is no ratio to report. */
  relative: number | null;
}

/** Whether a frame exists on each side, and if so whether its number moved. */
export type FlameDiffStatus = 'new' | 'removed' | 'changed' | 'unchanged';

/** A frame's change between two profiles. */
export interface FlameFrameDelta {
  id: string;
  name: string;
  depth: number;
  status: FlameDiffStatus;
  total: FlameDelta;
  self: FlameDelta;
}

export interface DiffFlameOptions {
  /**
   * Compare each frame's **share** of its profile rather than its raw value.
   * Off by default: profiles of different lengths differ in raw counts for no
   * reason worth reporting, but normalising is a methodology choice, so it is
   * one the caller makes and the result records.
   */
  normalize?: boolean;
}

/** Two profiles that can be compared. Widths come from the candidate. */
export interface FlameDiff {
  compatible: true;
  /** The candidate tree — what a diff view draws. */
  tree: FlameTree;
  baseline: FlameTree;
  /** Every candidate frame's change, by id. */
  frames: ReadonlyMap<string, FlameFrameDelta>;
  /**
   * Baseline frames with no candidate counterpart, topmost only — a removed
   * frame's descendants went with it. Widths come from the candidate, so these
   * have nowhere to be drawn; a view lists them instead.
   */
  removed: FlameFrameDelta[];
  /** `share` when `normalize` was asked for; `absolute` otherwise. */
  basis: 'absolute' | 'share';
}

/** Two profiles that cannot be compared, and why. */
export interface FlameDiffIncompatible {
  compatible: false;
  reason: string;
}

function delta(baseline: number | null, candidate: number | null): FlameDelta {
  if (baseline === null && candidate === null) return { baseline, candidate, absolute: null, relative: null };
  const absolute = (candidate ?? 0) - (baseline ?? 0);
  const relative = baseline !== null && baseline !== 0 ? absolute / Math.abs(baseline) : null;
  return { baseline, candidate, absolute, relative };
}

/**
 * Compare two profiles frame by frame, matching on id (the name path). A
 * different `unit` or `order` is a different methodology and returns
 * `{ compatible: false }` rather than a misleading diff.
 */
export function diffFlame(baseline: FlameTree, candidate: FlameTree, options: DiffFlameOptions = {}): FlameDiff | FlameDiffIncompatible {
  if (baseline.unit !== candidate.unit) {
    return { compatible: false, reason: `the baseline counts ${baseline.unit} and the candidate counts ${candidate.unit}` };
  }
  if (baseline.order !== candidate.order) {
    return { compatible: false, reason: `the baseline is laid out in ${baseline.order} order and the candidate in ${candidate.order} order, so their frame ids do not correspond` };
  }
  const basis = options.normalize ? 'share' : 'absolute';
  const scale = (tree: FlameTree) => (value: number): number | null => {
    if (basis === 'absolute') return value;
    return tree.total > 0 ? value / tree.total : null;
  };
  const onBaseline = scale(baseline);
  const onCandidate = scale(candidate);

  const frames = new Map<string, FlameFrameDelta>();
  for (const frame of candidate.frames) {
    const before = baseline.byId.get(frame.id);
    const total = delta(before ? onBaseline(before.total) : null, onCandidate(frame.total));
    const self = delta(before ? onBaseline(before.self) : null, onCandidate(frame.self));
    const status: FlameDiffStatus = !before ? 'new' : total.absolute === 0 && self.absolute === 0 ? 'unchanged' : 'changed';
    frames.set(frame.id, { id: frame.id, name: frame.name, depth: frame.depth, status, total, self });
  }

  const removed: FlameFrameDelta[] = [];
  for (const frame of baseline.frames) {
    if (candidate.byId.has(frame.id)) continue;
    if (frame.parentId !== null && !candidate.byId.has(frame.parentId)) continue;
    removed.push({
      id: frame.id,
      name: frame.name,
      depth: frame.depth,
      status: 'removed',
      total: delta(onBaseline(frame.total), null),
      self: delta(onBaseline(frame.self), null),
    });
  }

  return { compatible: true, tree: candidate, baseline, frames, removed, basis };
}

/**
 * How a diff view paints a frame. `unknown` is a frame whose change could not
 * be computed — drawn plainly, never coloured as if it had moved.
 */
export type FlameDeltaTone = 'new' | 'grew-large' | 'grew' | 'same' | 'shrank' | 'shrank-large' | 'unknown';

export interface FlameDeltaToneOptions {
  /** Which number to judge. Default `self`: where the time itself went, not everything above it. */
  metric?: 'self' | 'total';
  /** Relative changes smaller than this are `same`. Default `0.05` (5%). */
  threshold?: number;
  /** Relative changes at least this large are `-large`. Default `0.25` (25%). */
  large?: number;
}

/**
 * Bucket a frame's change for colour. A zero baseline that grew has a sign but
 * no ratio, so it is `grew` — the size of the change is not claimed.
 */
export function flameDeltaTone(change: FlameFrameDelta | undefined, options: FlameDeltaToneOptions = {}): FlameDeltaTone {
  if (!change) return 'unknown';
  if (change.status === 'new') return 'new';
  const { metric = 'self', threshold = 0.05, large = 0.25 } = options;
  const value = change[metric];
  if (value.absolute === null) return 'unknown';
  if (value.absolute === 0) return 'same';
  if (value.relative === null) return value.absolute > 0 ? 'grew' : 'shrank';
  const size = Math.abs(value.relative);
  if (size < threshold) return 'same';
  if (value.relative > 0) return size >= large ? 'grew-large' : 'grew';
  return size >= large ? 'shrank-large' : 'shrank';
}

/** `+12 samples (+31.2%)`, `−4ms (n/a)`, `new`, `removed`. */
export function formatFlameDelta(change: FlameFrameDelta, metric: 'self' | 'total', unit: FlameUnit, basis: 'absolute' | 'share' = 'absolute'): string {
  if (change.status === 'new') return 'new';
  if (change.status === 'removed') return 'removed';
  const value = change[metric];
  if (value.absolute === null) return 'n/a';
  if (value.absolute === 0) return 'unchanged';
  const sign = value.absolute > 0 ? '+' : '−';
  const magnitude = Math.abs(value.absolute);
  const amount = basis === 'share' ? `${PERCENT.format(magnitude * 100)} pp` : formatFlameValue(magnitude, unit);
  const relative = value.relative === null ? 'n/a' : `${value.relative > 0 ? '+' : '−'}${PERCENT.format(Math.abs(value.relative) * 100)}%`;
  return `${sign}${amount} (${relative})`;
}

// ---------------------------------------------------------------------------
// Ranking
// ---------------------------------------------------------------------------

/** One row of a frame list: a frame, and its change when the list ranks a diff. */
export interface FlameRankedFrame {
  id: string;
  name: string;
  depth: number;
  total: number;
  self: number;
  /** Present when ranking a diff. A `removed` frame has no candidate numbers: `total` and `self` are 0. */
  change?: FlameFrameDelta;
}

/**
 * The frames worth reading first, hottest first. One profile ranks by self
 * time, so the frames that themselves burn the time lead. A diff ranks by the
 * size of the change in `metric` (default `self`), either sign, and includes
 * removed frames — they have no width to be drawn at, but they did change.
 * Frames whose change is zero or not computable are left out of a diff's
 * ranking; ties break on id so the order is stable.
 */
export function rankFlameFrames(tree: FlameTree, diff?: FlameDiff | null, metric: 'self' | 'total' = 'self'): FlameRankedFrame[] {
  const byId = (a: FlameRankedFrame, b: FlameRankedFrame) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  if (!diff) {
    return tree.frames
      .filter((frame) => frame.parentId !== null && frame.self > 0)
      .map((frame) => ({ id: frame.id, name: frame.name, depth: frame.depth, total: frame.total, self: frame.self }))
      .sort((a, b) => b.self - a.self || byId(a, b));
  }
  const size = (row: FlameRankedFrame) => Math.abs(row.change?.[metric].absolute ?? 0);
  const rows: FlameRankedFrame[] = [];
  for (const frame of tree.frames) {
    const change = diff.frames.get(frame.id);
    if (frame.parentId === null || !change || !change[metric].absolute) continue;
    rows.push({ id: frame.id, name: frame.name, depth: frame.depth, total: frame.total, self: frame.self, change });
  }
  for (const change of diff.removed) if (change[metric].absolute) rows.push({ id: change.id, name: change.name, depth: change.depth, total: 0, self: 0, change });
  return rows.sort((a, b) => size(b) - size(a) || byId(a, b));
}
