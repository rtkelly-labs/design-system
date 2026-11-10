'use client';

import { Collapsible } from '@base-ui/react/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Children, cloneElement, forwardRef, isValidElement, useId, useMemo, useState, type HTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { recipe } from '../lib/recipe';
import { formatTraceDuration, type TraceSpan } from '../lib/trace';
import { InlineAction } from './InlineAction';
import { Spinner } from './Spinner';

/** Where a tool call stands. `cancelled` is a call stopped before it answered. */
export type ToolCallStatus = 'running' | 'ok' | 'error' | 'cancelled';

const STATUS_WORD: Record<ToolCallStatus, string> = {
  running: 'running',
  ok: 'done',
  error: 'failed',
  cancelled: 'cancelled',
};

const toolCall = recipe({
  slots: {
    root: 'flex min-w-0 flex-col border-2 border-edge-subtle bg-surface-base text-content-primary',
    trigger:
      'grid w-full min-w-0 cursor-pointer grid-cols-[auto_auto_minmax(0,1fr)_auto_auto] items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-surface-raised focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-primary',
    chevron: 'text-content-muted',
    // A tool name is an identifier, so it is mono (DESIGN.md §7, §9).
    name: 'font-mono text-sm font-medium whitespace-nowrap',
    summary: 'truncate text-content-secondary',
    state: 'inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap',
    time: 'min-w-[4ch] text-right text-xs tabular-nums text-content-muted',
    panel: 'flex flex-col gap-2 px-2 pb-2',
    wells: 'grid min-w-0 gap-2 md:grid-cols-2',
    well: 'flex min-w-0 flex-col border border-edge-subtle bg-surface-sunken',
    wellHead: 'flex items-center justify-between gap-2 border-b border-edge-subtle px-2 py-1 text-xs font-semibold text-content-muted',
    pre: 'm-0 overflow-x-auto px-2 py-1.5 font-mono text-xs leading-relaxed whitespace-pre text-content-secondary',
    more: 'px-2 pb-1.5 text-xs',
    error: 'flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-intent-danger',
  },
  variants: {
    status: {
      running: { state: 'text-intent-info' },
      ok: { state: 'text-intent-success' },
      error: { root: 'border-intent-danger', state: 'text-intent-danger' },
      cancelled: { state: 'text-content-muted' },
    },
    open: { true: { root: 'border-edge-strong' } },
  },
  compoundVariants: [{ status: 'error', open: true, class: { root: 'border-intent-danger' } }],
});

/** A value as the text a reader sees: objects and JSON strings pretty-printed, anything else as written. */
export function formatToolPayload(value: unknown): string {
  if (value === undefined) return '';
  if (typeof value === 'string') {
    const text = value.trim();
    if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
      try {
        return JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        return value;
      }
    }
    return value;
  }
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}

/** A payload well: title, copy, and the text capped at `maxLines` until asked for all of it. */
function Payload({ title, value, maxLines, tone }: { title: string; value: unknown; maxLines: number; tone?: 'danger' }) {
  const text = useMemo(() => formatToolPayload(value), [value]);
  const lines = text.split('\n');
  const [all, setAll] = useState(false);
  const { copied, copy } = useCopyToClipboard();
  const capped = !all && lines.length > maxLines;
  const styles = toolCall();
  return (
    <section aria-label={title} data-part="payload" className={styles.well()}>
      <header className={styles.wellHead()}>
        <span>{title}</span>
        <InlineAction tone="quiet" onClick={() => void copy(text)}>
          {copied ? 'copied' : 'copy'}
        </InlineAction>
      </header>
      <pre className={styles.pre({ class: tone === 'danger' ? 'text-intent-danger' : undefined })}>{capped ? lines.slice(0, maxLines).join('\n') : text}</pre>
      {/* Capped with words, never faded out (DESIGN.md §9). */}
      {capped ? (
        <span className={styles.more()}>
          <InlineAction tone="quiet" onClick={() => setAll(true)}>
            show all ({lines.length} lines)
          </InlineAction>
        </span>
      ) : null}
    </section>
  );
}

export interface ToolCallProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'onToggle'> {
  /** The tool's name as the agent calls it, `search_web`. Set in mono: it is an identifier. */
  name: string;
  /** One line saying what the call did, in words. Truncates. */
  summary?: ReactNode;
  /** Where the call stands: `running`, `ok`, `error` or `cancelled`. Shown as a mark and a word. */
  status: ToolCallStatus;
  /** When the call started, in milliseconds on the same clock as `now`. */
  startedAt?: number;
  /** When it ended. With `startedAt`, gives the duration of a finished call. */
  endedAt?: number;
  /** The duration, in milliseconds, when there is no `startedAt`/`endedAt` pair. */
  duration?: number;
  /** The current time, for a running call's elapsed time. Never read from the clock here. */
  now?: number;
  /** What the call was given. Objects and JSON strings are pretty-printed. */
  args?: unknown;
  /** What came back. Objects and JSON strings are pretty-printed. */
  result?: unknown;
  /** Why it failed, shown in the row and in the panel when `status` is `error`. */
  error?: ReactNode;
  /** Offered beside a failure. Omitted, there is no retry. */
  onRetry?: () => void;
  /** Open state. Controlled when defined. */
  open?: boolean;
  /** Open on mount when uncontrolled. Default false. */
  defaultOpen?: boolean;
  /** Called with the new open state when the row is opened or closed. */
  onOpenChange?: (open: boolean) => void;
  /** Lines of a payload shown before "show all". Default 12. */
  maxLines?: number;
  /**
   * Hold the running mark still instead of stepping it. Inside a
   * `ToolCallGroup` this is on: the group header carries the one live mark
   * (`DESIGN.md` §8). Default false.
   */
  still?: boolean;
}

/** The elapsed or total time of a call, or nothing when it cannot be known. */
export function toolCallDuration({ status, startedAt, endedAt, duration, now }: Pick<ToolCallProps, 'status' | 'startedAt' | 'endedAt' | 'duration' | 'now'>): number | undefined {
  if (status === 'running') return startedAt !== undefined && now !== undefined ? Math.max(0, now - startedAt) : duration;
  if (startedAt !== undefined && endedAt !== undefined) return Math.max(0, endedAt - startedAt);
  return duration;
}

/**
 * One tool call an agent made, readable at a glance and checkable on demand.
 *
 * Collapsed, it is one line: the tool's name in mono, a summary in words, its
 * state as a mark and a word, and how long it took. Open, it shows what the
 * call was given and what came back, each in a sunken well with a copy action,
 * capped at `maxLines` with a plain "show all". A failure shows why, and a
 * retry when `onRetry` is given.
 *
 * Time is passed in. A running call shows `now - startedAt`, so feed it a clock
 * (`useTraceClock`) and it ticks; a story or snapshot stays a function of its
 * props. The elapsed time is hidden from assistive technology: what a screen
 * reader hears is the state, once, in the trigger's name.
 */
export const ToolCall = forwardRef<HTMLDivElement, ToolCallProps>(function ToolCall(
  { name, summary, status, startedAt, endedAt, duration, now, args, result, error, onRetry, open, defaultOpen = false, onOpenChange, maxLines = 12, still = false, className, ...props },
  ref,
) {
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const isOpen = open ?? ownOpen;
  const styles = toolCall({ status, open: isOpen });
  const elapsed = toolCallDuration({ status, startedAt, endedAt, duration, now });
  const time = elapsed === undefined ? '' : formatTraceDuration(elapsed);
  const spoken = [name, STATUS_WORD[status], status !== 'running' && time ? `in ${time}` : ''].filter(Boolean).join(', ');

  return (
    <Collapsible.Root
      ref={ref}
      open={isOpen}
      onOpenChange={(next) => {
        if (open === undefined) setOwnOpen(next);
        onOpenChange?.(next);
      }}
      data-slot="tool-call"
      data-status={status}
      {...props}
      className={styles.root({ className })}
    >
      <Collapsible.Trigger aria-label={`${spoken}. ${isOpen ? 'Hide' : 'Show'} details`} className={styles.trigger()}>
        <span aria-hidden="true" className={styles.chevron()}>
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <span className={styles.name()}>{name}</span>
        <span className={styles.summary()}>{status === 'error' && error && !isOpen ? error : summary}</span>
        <span aria-hidden="true" className={styles.state()}>
          {/* Its own element, so the flex gap separates mark and word: two bare text nodes merge into one item. */}
          {status === 'running' ? <Spinner size="sm" accent="current" still={still} label="" /> : <span>{status === 'ok' ? '✓' : status === 'error' ? '✕' : '–'}</span>}
          <span>{STATUS_WORD[status]}</span>
        </span>
        <span aria-hidden="true" className={styles.time()}>{time}</span>
      </Collapsible.Trigger>
      <Collapsible.Panel data-part="panel" className={styles.panel()}>
        {args !== undefined || result !== undefined || (status === 'error' && error) ? (
          <div className={styles.wells()}>
            {args !== undefined ? <Payload title="Arguments" value={args} maxLines={maxLines} /> : null}
            {status === 'error' && error ? (
              <Payload title="Error" value={typeof error === 'string' ? error : String(error)} maxLines={maxLines} tone="danger" />
            ) : result !== undefined ? (
              <Payload title="Result" value={result} maxLines={maxLines} />
            ) : null}
          </div>
        ) : null}
        {status === 'error' && onRetry ? (
          <p className={styles.error()}>
            <span>The call failed.</span>
            <InlineAction onClick={onRetry}>retry</InlineAction>
          </p>
        ) : null}
      </Collapsible.Panel>
    </Collapsible.Root>
  );
});

ToolCall.displayName = 'ToolCall';

const toolCallGroup = recipe({
  slots: {
    root: 'flex min-w-0 flex-col gap-1.5',
    trigger:
      'inline-flex w-fit cursor-pointer items-center gap-2 py-0.5 text-sm font-semibold text-content-primary hover:text-accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary',
    meta: 'font-normal tabular-nums text-content-muted',
    failed: 'border border-current px-1 text-xs font-semibold text-intent-danger',
    list: 'flex flex-col gap-1.5',
  },
});

/** What a group's header and its one live region say, from the calls in it. */
export function describeToolCalls(calls: ReadonlyArray<Pick<ToolCallProps, 'status' | 'startedAt' | 'endedAt' | 'duration' | 'now'>>): {
  count: number;
  running: number;
  failed: number;
  total: number;
  text: string;
} {
  const running = calls.filter((call) => call.status === 'running').length;
  const failed = calls.filter((call) => call.status === 'error').length;
  const total = calls.reduce((sum, call) => sum + (toolCallDuration(call) ?? 0), 0);
  const noun = calls.length === 1 ? 'tool call' : 'tool calls';
  const text = running
    ? `${calls.length} ${noun}, ${running} running`
    : `${calls.length} ${noun} · ${formatTraceDuration(total)}`;
  return { count: calls.length, running, failed, total, text };
}

export interface ToolCallGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** `ToolCall` elements, in the order they were made. */
  children: ReactNode;
  /** Open state. Controlled when defined. */
  open?: boolean;
  /** Open on mount when uncontrolled. Default true. */
  defaultOpen?: boolean;
  /** Called with the new open state when the group is folded or unfolded. */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Consecutive tool calls folded into one line: how many, how long in all, how
 * many failed, and how many are still running.
 *
 * The group owns the region's one live mark (`DESIGN.md` §8): while any call
 * runs, its header steps the quadrant and every call inside holds still. It
 * also owns the one polite live region, which speaks when the counts change
 * rather than once per row, so a burst of calls does not flood a screen reader.
 */
export const ToolCallGroup = forwardRef<HTMLDivElement, ToolCallGroupProps>(function ToolCallGroup(
  { children, open, defaultOpen = true, onOpenChange, className, ...props },
  ref,
) {
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const isOpen = open ?? ownOpen;
  const listId = useId();
  const calls = Children.toArray(children).filter((child): child is ReactElement<ToolCallProps> => isValidElement<ToolCallProps>(child));
  const summary = describeToolCalls(calls.map((call) => call.props));
  const styles = toolCallGroup();
  const toggle = () => {
    if (open === undefined) setOwnOpen(!isOpen);
    onOpenChange?.(!isOpen);
  };

  return (
    <div ref={ref} data-slot="tool-call-group" {...props} className={styles.root({ className })}>
      <button type="button" aria-expanded={isOpen} aria-controls={listId} onClick={toggle} className={styles.trigger()}>
        <span aria-hidden="true">{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
        {summary.running ? <Spinner size="sm" label="" aria-hidden="true" /> : null}
        <span>{summary.count} tool {summary.count === 1 ? 'call' : 'calls'}</span>
        <span className={styles.meta()}>{summary.running ? `${summary.running} running` : formatTraceDuration(summary.total)}</span>
        {summary.failed ? <span className={styles.failed()}>{summary.failed} failed</span> : null}
      </button>
      <p className="sr-only" role="status">
        {summary.text}
        {summary.failed ? `, ${summary.failed} failed` : ''}
      </p>
      <div id={listId} hidden={!isOpen} className={styles.list()}>
        {calls.map((call) => cloneElement(call, { still: call.props.still ?? true }))}
      </div>
    </div>
  );
});

ToolCallGroup.displayName = 'ToolCallGroup';

/**
 * A tool span from `buildTrace`, as `ToolCall` props: name, status, timing and
 * its `gen_ai.tool.call.arguments` / `.result` when the span carries them.
 * Times are the span's offsets from the trace start, so a running span's
 * `now` is the same: milliseconds since the trace began.
 */
export function toolCallFromSpan(span: TraceSpan): Pick<ToolCallProps, 'name' | 'status' | 'startedAt' | 'endedAt' | 'args' | 'result' | 'error'> {
  const attr = span.attributes;
  const toolName = typeof attr['gen_ai.tool.name'] === 'string' ? (attr['gen_ai.tool.name'] as string) : span.name;
  const error = typeof attr['error.type'] === 'string' ? (attr['error.type'] as string) : undefined;
  return {
    name: toolName,
    status: span.inFlight ? 'running' : span.status === 'error' ? 'error' : 'ok',
    startedAt: span.offset,
    endedAt: span.inFlight ? undefined : span.offset + span.duration,
    args: attr['gen_ai.tool.call.arguments'],
    result: attr['gen_ai.tool.call.result'],
    error,
  };
}
