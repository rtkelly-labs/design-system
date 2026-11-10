'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState, type HTMLAttributes, type KeyboardEvent } from 'react';
import { recipe } from '../lib/recipe';
import { buildRunTree, visibleRunNodes, type RunNode, type RunNodeStatus } from '../lib/runTree';
import { buildTrace, formatTraceCost, formatTraceDuration, formatTraceTokens, type BuildTraceOptions, type TraceModel, type TraceSpanInput } from '../lib/trace';
import { Spinner } from './Spinner';

const STATUS_WORD: Record<RunNodeStatus, string> = { running: 'running', waiting: 'needs you', done: 'done', failed: 'failed' };

const runTree = recipe({
  slots: {
    root: 'flex min-w-0 flex-col border-2 border-edge-strong bg-surface-raised text-content-primary',
    header: 'flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b-2 border-edge-strong px-3 py-2 text-sm',
    // A stat value, so mono at stat scale (DESIGN.md §7).
    total: 'font-mono text-lg font-bold leading-none tabular-nums',
    count: 'text-content-muted',
    running: 'inline-flex items-center gap-1.5 text-intent-info',
    // The one emphasised count is the one that needs a person (DESIGN.md §9).
    waiting: 'font-semibold text-intent-warning',
    tree: 'flex flex-col py-1',
    row: 'grid cursor-pointer grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-l-2 border-transparent px-3 py-1.5 hover:bg-surface-sunken focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-primary',
    who: 'flex min-w-0 items-center gap-1.5',
    guide: 'h-8 w-3 flex-none border-l-2 border-edge-subtle',
    toggle: 'w-3.5 flex-none text-content-muted',
    label: 'flex min-w-0 flex-col',
    name: 'font-semibold',
    model: 'font-mono text-xs text-content-muted',
    task: 'truncate text-sm text-content-secondary',
    state: 'inline-flex items-center gap-1 border border-current px-1.5 text-xs font-semibold whitespace-nowrap',
    money: 'flex min-w-[4.5rem] flex-col items-end',
    cost: 'font-mono text-sm font-bold tabular-nums',
    time: 'text-xs tabular-nums text-content-muted',
    folded: 'text-xs text-content-muted',
    errors: 'text-xs font-semibold text-intent-danger',
    empty: 'px-3 py-4 text-sm text-content-muted',
  },
  variants: {
    selected: { true: { row: 'border-accent-primary bg-surface-sunken' } },
    status: {
      running: { state: 'text-intent-info' },
      waiting: { state: 'text-intent-warning' },
      done: { state: 'text-intent-success' },
      failed: { state: 'text-intent-danger' },
    },
  },
});

/** A value that is controlled when the prop is defined, and owned here otherwise. */
function useControllable<T>(value: T | undefined, initial: T, onChange?: (next: T) => void): [T, (next: T) => void] {
  const [owned, setOwned] = useState(initial);
  const current = value === undefined ? owned : value;
  const set = useCallback(
    (next: T) => {
      if (value === undefined) setOwned(next);
      onChange?.(next);
    },
    [value, onChange],
  );
  return [current, set];
}

/** What a screen reader hears for one agent: the row, said in words. */
export function describeRunNode(node: RunNode, currency?: string): string {
  return [
    node.name,
    ...(node.model ? [node.model] : []),
    STATUS_WORD[node.status],
    node.task,
    ...(node.cost !== undefined ? [`${formatTraceCost(node.cost, currency)}${node.partial ? ' so far' : ''}`] : []),
    formatTraceDuration(node.duration),
    ...(node.toolCalls ? [`${node.toolCalls} tool ${node.toolCalls === 1 ? 'call' : 'calls'}`] : []),
    ...(node.errors ? [`${node.errors} failed below`] : []),
  ].join(', ');
}

export interface RunTreeProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** The run's spans, or a model built with `buildTrace`. Only agent spans become rows. */
  spans: readonly TraceSpanInput[] | TraceModel;
  /** Where in-flight spans end, for a live run. Ignored when `spans` is a model. */
  now?: number;
  /** Each span's cost. See `buildTrace`. Ignored when `spans` is a model. */
  price?: BuildTraceOptions['price'];
  /** A numeric attribute holding each span's cost. Ignored when `spans` is a model. */
  costAttribute?: string;
  /** The currency costs are shown in. Default `USD`. */
  currency?: string;
  /** The selected agent's span id. Controlled when defined; `null` selects nothing. */
  selectedId?: string | null;
  /** The agent selected on mount when uncontrolled. */
  defaultSelectedId?: string | null;
  /** Called with the span id a click, Enter or Space selects, so a consumer can open that agent's trace beside it. */
  onSelectedChange?: (id: string | null) => void;
  /** Ids of folded agents. Controlled when defined. */
  collapsed?: readonly string[];
  /** Ids folded on mount when uncontrolled. */
  defaultCollapsed?: readonly string[];
  /** Called with the new folded set when a branch is folded or unfolded. */
  onCollapsedChange?: (ids: string[]) => void;
  /** Accessible name for the tree. Default `Agents`. */
  label?: string;
}

/**
 * An orchestrator and the agents it started, with each branch's status, cost
 * and time (`DESIGN.md` §9). The waterfall answers *when*; this answers *who*.
 *
 * A second view over the same span model: only agent spans become rows, and
 * each agent's own tool and model calls fold into it as counts. Cost and time
 * roll up every branch, folded or not, and a failure anywhere below shows on
 * every ancestor. The header's one emphasised figure is how many agents are
 * waiting on a person.
 *
 * Indented, so it works at any width and matches the tree a screen reader
 * hears: `role="tree"`, `aria-level`, `aria-expanded`, and a hand-rolled
 * roving tabindex (arrows move, Left and Right fold, Home and End jump, Enter
 * or Space selects), per the one-interaction-library rule. The header carries
 * the region's one live mark; the rows hold theirs still (`DESIGN.md` §8).
 */
export const RunTree = forwardRef<HTMLDivElement, RunTreeProps>(function RunTree(
  {
    spans,
    now,
    price,
    costAttribute,
    currency,
    selectedId: selectedProp,
    defaultSelectedId = null,
    onSelectedChange,
    collapsed: collapsedProp,
    defaultCollapsed = [],
    onCollapsedChange,
    label = 'Agents',
    className,
    ...props
  },
  ref,
) {
  const tree = useMemo(() => buildRunTree(buildTrace(spans, { now, price, costAttribute })), [spans, now, price, costAttribute]);
  const [selectedId, setSelectedId] = useControllable<string | null>(selectedProp, defaultSelectedId, onSelectedChange);
  const [collapsedList, setCollapsedList] = useControllable<readonly string[]>(collapsedProp, defaultCollapsed, onCollapsedChange as ((ids: readonly string[]) => void) | undefined);
  const collapsed = useMemo(() => new Set(collapsedList), [collapsedList]);
  const rows = useMemo(() => visibleRunNodes(tree, collapsed), [tree, collapsed]);
  const styles = runTree();

  const [activeId, setActiveId] = useState<string | null>(null);
  const focusId = rows.some((row) => row.id === activeId) ? activeId : ((rows.find((row) => row.id === selectedId) ?? rows[0])?.id ?? null);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const pendingFocus = useRef(false);
  useEffect(() => {
    if (!pendingFocus.current || !focusId) return;
    pendingFocus.current = false;
    rowRefs.current.get(focusId)?.focus();
  }, [focusId]);
  const moveTo = (id: string | undefined) => {
    if (!id) return;
    setActiveId(id);
    const node = rowRefs.current.get(id);
    if (node) node.focus();
    else pendingFocus.current = true;
  };
  const toggle = (node: RunNode, open?: boolean) => {
    if (!node.children.length) return;
    const isOpen = !collapsed.has(node.id);
    if (open === isOpen) return;
    setCollapsedList(isOpen ? [...collapsedList, node.id] : collapsedList.filter((id) => id !== node.id));
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>, node: RunNode) => {
    const index = rows.findIndex((row) => row.id === node.id);
    const open = node.children.length > 0 && !collapsed.has(node.id);
    switch (event.key) {
      case 'ArrowDown': moveTo(rows[index + 1]?.id); break;
      case 'ArrowUp': moveTo(rows[index - 1]?.id); break;
      case 'Home': moveTo(rows[0]?.id); break;
      case 'End': moveTo(rows[rows.length - 1]?.id); break;
      case 'ArrowRight':
        if (node.children.length && !open) toggle(node, true);
        else if (open) moveTo(rows[index + 1]?.id);
        else return;
        break;
      case 'ArrowLeft':
        if (open) toggle(node, false);
        else if (node.parentId) moveTo(node.parentId);
        else return;
        break;
      case 'Enter':
      case ' ':
        setSelectedId(node.id);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const { summary } = tree;
  return (
    <div ref={ref} data-slot="run-tree" {...props} className={styles.root({ className })}>
      <div data-part="header" className={styles.header()}>
        {summary.cost !== undefined ? <span className={styles.total()}>{formatTraceCost(summary.cost, currency)}</span> : null}
        <span className={styles.count()}>
          {summary.agents} {summary.agents === 1 ? 'agent' : 'agents'}
        </span>
        {summary.running ? (
          <span className={styles.running()}>
            <Spinner size="sm" accent="current" label="" aria-hidden="true" />
            {summary.running} running
          </span>
        ) : null}
        {summary.waiting ? <span className={styles.waiting()}>! {summary.waiting} needs you</span> : null}
      </div>
      {rows.length ? (
        <div role="tree" aria-label={label} className={styles.tree()}>
          {rows.map((node) => {
            const hasChildren = node.children.length > 0;
            const open = hasChildren && !collapsed.has(node.id);
            const selected = node.id === selectedId;
            return (
              <div
                key={node.id}
                ref={(element) => {
                  if (element) rowRefs.current.set(node.id, element);
                  else rowRefs.current.delete(node.id);
                }}
                role="treeitem"
                aria-level={node.depth + 1}
                aria-expanded={hasChildren ? open : undefined}
                aria-selected={selected}
                aria-label={describeRunNode(node, currency)}
                tabIndex={node.id === focusId ? 0 : -1}
                data-run-id={node.id}
                data-status={node.status}
                className={styles.row({ selected })}
                onFocus={() => setActiveId(node.id)}
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest('[data-part="toggle"]')) toggle(node);
                  else setSelectedId(node.id);
                }}
                onKeyDown={(event) => onKeyDown(event, node)}
              >
                <span className={styles.who()}>
                  {Array.from({ length: node.depth }, (_, index) => (
                    <span key={index} aria-hidden="true" className={styles.guide()} />
                  ))}
                  <span aria-hidden="true" data-part="toggle" className={styles.toggle()}>
                    {hasChildren ? open ? <ChevronDown size={14} /> : <ChevronRight size={14} /> : null}
                  </span>
                  <span className={styles.label()}>
                    <span>
                      <span className={styles.name()}>{node.name}</span> {node.model ? <span className={styles.model()}>{node.model}</span> : null}
                    </span>
                    <span className={styles.task()}>
                      {node.task}
                      {node.toolCalls ? ` · ${node.toolCalls} tool ${node.toolCalls === 1 ? 'call' : 'calls'}` : ''}
                      {!open && node.descendants ? <span className={styles.folded()}> · +{node.descendants} {node.descendants === 1 ? 'agent' : 'agents'}</span> : null}
                      {node.errors ? <span className={styles.errors()}> · {node.errors} failed below</span> : null}
                    </span>
                  </span>
                </span>
                <span aria-hidden="true" className={styles.state({ status: node.status })}>
                  {/* Separate elements, so the flex gap separates mark and word. */}
                  {node.status === 'running' ? <Spinner size="sm" accent="current" still label="" /> : <span>{node.status === 'waiting' ? '!' : node.status === 'done' ? '✓' : '✕'}</span>}
                  <span>{STATUS_WORD[node.status]}</span>
                </span>
                <span aria-hidden="true" className={styles.money()}>
                  {node.cost !== undefined ? <span className={styles.cost()}>{formatTraceCost(node.cost, currency)}</span> : null}
                  <span className={styles.time()}>
                    {formatTraceDuration(node.duration)}
                    {node.tokens ? ` · ${formatTraceTokens(node.tokens)} tokens` : ''}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className={styles.empty()}>No agents in this run.</p>
      )}
    </div>
  );
});

RunTree.displayName = 'RunTree';
