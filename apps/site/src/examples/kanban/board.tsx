'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import {
  Avatar,
  cn,
  Badge,
  Button,
  ButtonGroup,
  EmptyState,
  Input,
  Menu,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  Modal,
  Progress,
  Select,
  Tag,
  TextArea,
  useToast,
} from '@rtkelly13/design-system';
import {
  ASSIGNEES,
  COLUMNS,
  INITIAL_ORDER,
  LABELS,
  TASKS,
  formatDue,
  isOverdue,
} from './data';
import type { ColumnId, Priority, Task } from './data';

/* ------------------------------------------------------------------ state */

interface BoardState {
  tasks: Record<string, Task>;
  order: Record<ColumnId, string[]>;
}

const INITIAL: BoardState = {
  tasks: Object.fromEntries(TASKS.map((t) => [t.id, t])),
  order: INITIAL_ORDER,
};

/** Move `id` into `to`, before `beforeId` (or to the end). Pure. */
function place(state: BoardState, id: string, to: ColumnId, beforeId: string | null): BoardState {
  const order = { ...state.order };
  for (const col of COLUMNS) order[col.id] = order[col.id].filter((x) => x !== id);
  const list = [...order[to]];
  const at = beforeId ? list.indexOf(beforeId) : -1;
  if (at === -1) list.push(id);
  else list.splice(at, 0, id);
  order[to] = list;
  return { ...state, order };
}

function columnOf(state: BoardState, id: string): ColumnId {
  return COLUMNS.find((c) => state.order[c.id].includes(id))!.id;
}

const PRIORITY_ACCENT = { P0: 'danger', P1: 'warning', P2: 'info', P3: 'quiet' } as const;

const STRESS_TITLES = [
  'Tighten the retry budget',
  'Regenerate the API client',
  'Fix the off-by-one in the cursor',
  'Document the rollback path',
  'Trim the bundle by one chunk',
];

/* ------------------------------------------------------------------- card */

function CardFace({ task, overdueLabel = true }: { task: Task; overdueLabel?: boolean }) {
  const overdue = task.due !== null && isOverdue(task.due);
  return (
    <>
      <p className="m-0 text-sm font-bold leading-snug break-words text-content-primary">{task.title}</p>
      {task.labels.length > 0 && (
        <ul className="m-0 mt-2 flex list-none flex-wrap gap-1 p-0" aria-label="Labels">
          {task.labels.map((l) => (
            <li key={l}>
              <Tag text={LABELS[l].text} accent={LABELS[l].accent} className="px-1.5 py-0.5 text-[0.65rem]" />
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 flex items-center justify-between gap-2 font-mono text-xs">
        <span className="flex items-center gap-2">
          <Badge accent={PRIORITY_ACCENT[task.priority]} className="px-1.5 py-0 text-[0.65rem]">
            {task.priority}
          </Badge>
          {task.due && (
            <span className={overdue ? 'font-bold text-intent-danger' : 'text-content-secondary'}>
              {overdue && overdueLabel ? '[LATE] ' : ''}
              {formatDue(task.due)}
            </span>
          )}
        </span>
        {task.assignee ? (
          <Avatar fallback={task.assignee} alt={`Assigned to ${task.assignee}`} size="sm" />
        ) : (
          <span className="text-content-muted" aria-label="Unassigned">
            --
          </span>
        )}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ board */

interface DragState {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  w: number;
  h: number;
  to: ColumnId | null;
  before: string | null;
}

interface Lift {
  id: string;
  snapshot: BoardState;
}

interface Draft {
  id: string | 'new';
  title: string;
  description: string;
  column: ColumnId;
  priority: Priority;
  assignee: string;
}

export default function KanbanBoard() {
  const [state, setState] = useState<BoardState>(INITIAL);
  const [query, setQuery] = useState('');
  const [who, setWho] = useState('all');
  const [drag, setDrag] = useState<DragState | null>(null);
  const [lift, setLift] = useState<Lift | null>(null);
  const [live, setLive] = useState('');
  const [adding, setAdding] = useState<ColumnId | null>(null);
  const [addTitle, setAddTitle] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const focusId = useRef<string | null>(null);
  const [focusTick, setFocusTick] = useState(0);
  const setFocusId = (id: string) => {
    focusId.current = id;
    setFocusTick((n) => n + 1);
  };
  const toast = useToast();
  const helpId = useId();
  const counter = useRef(116);
  const dragRef = useRef<DragState | null>(null);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });
  const boardRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });

  const matches = useCallback(
    (t: Task) => {
      const q = query.trim().toLowerCase();
      if (q && !`${t.id} ${t.title}`.toLowerCase().includes(q)) return false;
      if (who !== 'all' && (who === 'none' ? t.assignee !== null : t.assignee !== who)) return false;
      return true;
    },
    [query, who],
  );

  const visible = useCallback(
    (s: BoardState, col: ColumnId) => s.order[col].filter((id) => matches(s.tasks[id])),
    [matches],
  );

  const total = Object.values(state.order).flat().length;
  const done = state.order.done.length;
  const filtering = query.trim() !== '' || who !== 'all';

  const announce = (msg: string) => setLive(msg);

  /* Restore focus to a card after it has been re-parented by a move. */
  useEffect(() => {
    if (!focusId.current) return;
    document.querySelector<HTMLElement>(`[data-card-focus="${focusId.current}"]`)?.focus();
    focusId.current = null;
  }, [focusTick]);

  useEffect(() => {
    if (adding) document.querySelector<HTMLElement>(`[data-col="${adding}"] form input`)?.focus();
  }, [adding]);

  const describe = (s: BoardState, id: string) => {
    const col = columnOf(s, id);
    const vis = visible(s, col);
    const colTitle = COLUMNS.find((c) => c.id === col)!.title;
    return `${id}, ${s.tasks[id].title}, ${colTitle}, position ${vis.indexOf(id) + 1} of ${vis.length}`;
  };

  /* ---------------------------------------------------------- pointer drag */

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>, id: string) => {
    if (e.button !== 0 || lift) return;
    const target = e.target as HTMLElement;
    if (target.closest('button,a,input,select,textarea,[data-nodrag]')) return;
    // Touch scrolls the board; only the handle drags there. A mouse drags from anywhere.
    if (e.pointerType !== 'mouse' && !target.closest('[data-handle]')) return;
    const li = (e.currentTarget as HTMLElement).closest<HTMLElement>('[data-card-li]')!;
    const rect = li.getBoundingClientRect();
    const start = { x: e.clientX, y: e.clientY };
    const pid = e.pointerId;
    let started = false;

    const finish = (commit: boolean) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('keydown', key);
      document.body.style.userSelect = '';
      const d = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (started && commit && d && d.to) {
        const next = place(stateRef.current, id, d.to, d.before);
        setState(next);
        announce(`Dropped. ${describe(next, id)}.`);
        setFocusId(id);
      } else if (started) {
        announce(`Cancelled. ${id} returned.`);
      }
    };
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== pid) return;
      pointer.current = { x: ev.clientX, y: ev.clientY };
      if (!started) {
        if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 4) return;
        started = true;
        document.body.style.userSelect = 'none';
        announce(`Picked up ${id}.`);
      }
      const els = document.elementsFromPoint(ev.clientX, ev.clientY);
      const colEl = els.find((el): el is HTMLElement => el instanceof HTMLElement && !!el.dataset.col);
      let to: ColumnId | null = null;
      let before: string | null = null;
      if (colEl) {
        to = colEl.dataset.col as ColumnId;
        const cards = Array.from(colEl.querySelectorAll<HTMLElement>('[data-card-li]')).filter(
          (c) => c.dataset.cardLi !== id,
        );
        const hit = cards.find((c) => {
          const r = c.getBoundingClientRect();
          return r.top + r.height / 2 > ev.clientY;
        });
        before = hit ? hit.dataset.cardLi! : null;
      }
      const next: DragState = {
        id,
        x: ev.clientX,
        y: ev.clientY,
        dx: start.x - rect.left,
        dy: start.y - rect.top,
        w: rect.width,
        h: rect.height,
        to,
        before,
      };
      dragRef.current = next;
      setDrag(next);
    };
    const up = (ev: PointerEvent) => {
      if (ev.pointerId === pid) finish(true);
    };
    const cancel = (ev: PointerEvent) => {
      if (ev.pointerId === pid) finish(false);
    };
    const key = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') finish(false);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('keydown', key);
  };

  /* Edge auto-scroll while a pointer drag is live. */
  const dragging = drag !== null;
  useEffect(() => {
    if (!dragging) return;
    let raf = 0;
    const tick = () => {
      const { x, y } = pointer.current;
      const board = boardRef.current;
      if (board) {
        const r = board.getBoundingClientRect();
        if (x < r.left + 48) board.scrollLeft -= 14;
        else if (x > r.right - 48) board.scrollLeft += 14;
      }
      const list = document
        .elementsFromPoint(x, y)
        .find((el): el is HTMLElement => el instanceof HTMLElement && el.dataset.list !== undefined);
      if (list) {
        const r = list.getBoundingClientRect();
        if (y < r.top + 40) list.scrollTop -= 10;
        else if (y > r.bottom - 40) list.scrollTop += 10;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dragging]);

  /* ---------------------------------------------------------- keyboard drag */

  const onCardKey = (e: ReactKeyboardEvent<HTMLElement>, id: string) => {
    const s = stateRef.current;
    if (!lift || lift.id !== id) {
      if (e.key === ' ') {
        e.preventDefault();
        setLift({ id, snapshot: s });
        announce(`Picked up. ${describe(s, id)}. Arrow keys move, space drops, escape cancels.`);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        openDraft(id);
      }
      return;
    }
    const col = columnOf(s, id);
    const vis = visible(s, col);
    const i = vis.indexOf(id);
    let next: BoardState | null = null;
    switch (e.key) {
      case 'ArrowUp':
        if (i > 0) next = place(s, id, col, vis[i - 1]);
        break;
      case 'ArrowDown':
        if (i < vis.length - 1) next = place(s, id, col, vis[i + 2] ?? null);
        break;
      case 'ArrowLeft':
      case 'ArrowRight': {
        const ci = COLUMNS.findIndex((c) => c.id === col) + (e.key === 'ArrowLeft' ? -1 : 1);
        const target = COLUMNS[ci];
        if (target) {
          const tvis = visible(s, target.id);
          next = place(s, id, target.id, tvis[Math.min(i, tvis.length)] ?? null);
        }
        break;
      }
      case ' ':
      case 'Enter':
        e.preventDefault();
        setLift(null);
        announce(`Dropped. ${describe(s, id)}.`);
        return;
      case 'Escape':
        e.preventDefault();
        setState(lift.snapshot);
        setLift(null);
        setFocusId(id);
        announce(`Cancelled. ${id} returned to ${COLUMNS.find((c) => c.id === columnOf(lift.snapshot, id))!.title}.`);
        return;
      default:
        return;
    }
    e.preventDefault();
    if (next) {
      setState(next);
      setFocusId(id);
      announce(describe(next, id));
    } else {
      announce('Cannot move further.');
    }
  };

  /* --------------------------------------------------------------- mutations */

  const openDraft = (id: string | 'new', column: ColumnId = 'backlog') => {
    if (id === 'new') {
      setDraft({ id, title: '', description: '', column, priority: 'P2', assignee: 'none' });
      return;
    }
    const t = stateRef.current.tasks[id];
    setDraft({
      id,
      title: t.title,
      description: t.description,
      column: columnOf(stateRef.current, id),
      priority: t.priority,
      assignee: t.assignee ?? 'none',
    });
  };

  const saveDraft = () => {
    if (!draft || draft.title.trim() === '') return;
    const assignee = draft.assignee === 'none' ? null : draft.assignee;
    if (draft.id === 'new') {
      const id = `DS-${counter.current++}`;
      const task: Task = {
        id,
        title: draft.title.trim(),
        description: draft.description,
        assignee,
        priority: draft.priority,
        labels: [],
        due: null,
      };
      setState((s) => place({ ...s, tasks: { ...s.tasks, [id]: task } }, id, draft.column, null));
      announce(`Added ${id} to ${COLUMNS.find((c) => c.id === draft.column)!.title}.`);
    } else {
      setState((s) => {
        const t = { ...s.tasks[draft.id], title: draft.title.trim(), description: draft.description, priority: draft.priority, assignee };
        const moved = columnOf(s, draft.id) !== draft.column;
        const withTask = { ...s, tasks: { ...s.tasks, [draft.id]: t } };
        return moved ? place(withTask, draft.id, draft.column, null) : withTask;
      });
    }
    setDraft(null);
  };

  const remove = (id: string) => {
    const before = stateRef.current;
    const title = before.tasks[id].title;
    setState((s) => {
      const order = { ...s.order };
      for (const c of COLUMNS) order[c.id] = order[c.id].filter((x) => x !== id);
      return { ...s, order };
    });
    announce(`Deleted ${id}.`);
    toast.show({
      title: `${id} deleted`,
      description: title,
      intent: 'warning',
      action: { label: 'UNDO', onClick: () => setState(before) },
    });
  };

  const submitInline = (col: ColumnId) => {
    const title = addTitle.trim();
    if (!title) return;
    const id = `DS-${counter.current++}`;
    const task: Task = { id, title, description: '', assignee: null, priority: 'P2', labels: [], due: null };
    setState((s) => place({ ...s, tasks: { ...s.tasks, [id]: task } }, id, col, null));
    setAddTitle('');
    announce(`Added ${id} to ${COLUMNS.find((c) => c.id === col)!.title}.`);
  };

  const stress = () => {
    setState((s) => {
      let next = s;
      for (let n = 0; n < 20; n++) {
        const id = `DS-${counter.current++}`;
        const task: Task = {
          id,
          title: `${STRESS_TITLES[n % STRESS_TITLES.length]} (${n + 1})`,
          description: '',
          assignee: ASSIGNEES[n % ASSIGNEES.length],
          priority: (['P0', 'P1', 'P2', 'P3'] as const)[n % 4],
          labels: n % 3 === 0 ? ['ui', 'api'] : [],
          due: null,
        };
        next = place({ ...next, tasks: { ...next.tasks, [id]: task } }, id, 'backlog', null);
      }
      return next;
    });
  };

  /* ------------------------------------------------------------------ render */

  const colOptions = COLUMNS.map((c) => ({ label: c.title, value: c.id }));
  const draggedTask = drag ? state.tasks[drag.id] : null;
  const assigneeOptions = useMemo(
    () => [
      { label: 'ALL ASSIGNEES', value: 'all' },
      { label: 'UNASSIGNED', value: 'none' },
      ...ASSIGNEES.map((a) => ({ label: a, value: a })),
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-surface-base p-4 font-mono text-content-primary sm:p-6 print:p-0">
      <header className="mb-4 flex flex-col gap-4 print:mb-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="m-0 text-xs font-bold tracking-widest text-accent-primary uppercase">&gt; PROJECT / DS-CORE</p>
            <h1 className="m-0 font-display text-3xl font-bold uppercase tracking-tight">[&nbsp;SPRINT_42 BOARD&nbsp;]</h1>
          </div>
          <div className="w-full max-w-xs print:max-w-[16rem]">
            <Progress
              label="Done"
              value={done}
              max={total}
              showValue
              accent="success"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3 print:hidden" role="search" aria-label="Filter cards">
          <div className="w-full sm:w-64">
            <Input
              label="Filter"
              type="search"
              placeholder="id or title"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-52">
            <Select label="Assignee" options={assigneeOptions} value={who} onValueChange={setWho} />
          </div>
          <Button variant="primary" bracketed onClick={() => openDraft('new')}>
            NEW CARD
          </Button>
          <Button size="xs" onClick={stress}>
            STRESS +20
          </Button>
          {filtering && (
            <Button
              size="xs"
              onClick={() => {
                setQuery('');
                setWho('all');
              }}
            >
              CLEAR FILTER
            </Button>
          )}
        </div>
        <p id={helpId} className="sr-only">
          Press space to lift a card, arrow keys to move it between positions and columns, space to drop, escape to
          cancel. Press enter to open the card.
        </p>
      </header>

      <div
        ref={boardRef}
        className={cn(
          'flex items-start gap-4 overflow-x-auto pb-4 print:flex-wrap print:overflow-visible print:pb-0',
          // Mandatory snap re-snaps every programmatic scroll, so edge auto-scroll could never leave the first column by touch.
          dragging ? 'snap-none' : 'snap-x snap-mandatory sm:snap-none',
        )}
      >
        {COLUMNS.map((col) => {
          const ids = state.order[col.id];
          const vis = visible(state, col.id).filter((id) => id !== drag?.id);
          const over = drag?.to === col.id;
          const wipOver = col.wip !== undefined && ids.length > col.wip;
          const headId = `${helpId}-${col.id}`;
          const slots: ('placeholder' | string)[] = [];
          vis.forEach((id) => {
            if (over && drag.before === id) slots.push('placeholder');
            slots.push(id);
          });
          if (over && (drag.before === null || !vis.includes(drag.before))) slots.push('placeholder');
          return (
            <section
              key={col.id}
              aria-labelledby={headId}
              data-col={col.id}
              className={[
                'w-[85vw] shrink-0 snap-start border-2 bg-surface-sunken sm:w-72 print:w-[48%] print:break-inside-avoid',
                over ? 'border-accent-primary' : wipOver ? 'border-intent-danger' : 'border-edge-default',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-2 border-b-2 border-edge-default px-3 py-2">
                <h2 id={headId} className="m-0 font-display text-sm font-bold tracking-wider uppercase">
                  [&nbsp;{col.title}&nbsp;]
                </h2>
                <span
                  className={['text-xs font-bold', wipOver ? 'text-intent-danger' : 'text-content-secondary'].join(' ')}
                  aria-label={
                    col.wip !== undefined
                      ? `${ids.length} of ${col.wip} work in progress limit${wipOver ? ', exceeded' : ''}`
                      : `${ids.length} cards`
                  }
                >
                  {col.wip !== undefined ? `${ids.length}/${col.wip}${wipOver ? ' OVER' : ''}` : ids.length}
                </span>
              </div>
              <ul
                data-list=""
                className="m-0 flex max-h-[62vh] min-h-16 list-none flex-col gap-3 overflow-y-auto p-3 print:max-h-none print:overflow-visible"
              >
                {slots.length === 0 && !over && (
                  <li className="list-none">
                    {filtering && ids.length > 0 ? (
                      <p className="m-0 text-xs text-content-muted">{ids.length} hidden by filter</p>
                    ) : (
                      <EmptyState title="NO CARDS" description="Drop a card here or add one." headingLevel={3} />
                    )}
                  </li>
                )}
                {slots.map((slot) =>
                  slot === 'placeholder' ? (
                    <li
                      key="placeholder"
                      aria-hidden="true"
                      style={{ height: drag!.h }}
                      className="list-none border-2 border-dashed border-accent-primary"
                    />
                  ) : (
                    <CardItem
                      key={slot}
                      task={state.tasks[slot]}
                      column={col.id}
                      lifted={lift?.id === slot}
                      helpId={helpId}
                      onPointerDown={onPointerDown}
                      onKeyDown={onCardKey}
                      onOpen={() => openDraft(slot)}
                      onMove={(to) => {
                        const next = place(stateRef.current, slot, to, null);
                        setState(next);
                        announce(`Moved. ${describe(next, slot)}.`);
                      }}
                      onDelete={() => remove(slot)}
                    />
                  ),
                )}
              </ul>
              <div className="border-t-2 border-edge-default p-3 print:hidden">
                {adding === col.id ? (
                  <form
                    className="flex flex-col gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitInline(col.id);
                    }}
                  >
                    <Input
                      label="Card title"
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setAdding(null);
                          setAddTitle('');
                        }
                      }}
                      value={addTitle}
                      onChange={(e) => setAddTitle(e.target.value)}
                    />
                    <ButtonGroup className="gap-2">
                      <Button type="submit" size="sm" variant="primary">
                        ADD
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setAdding(null);
                          setAddTitle('');
                        }}
                      >
                        DONE
                      </Button>
                    </ButtonGroup>
                  </form>
                ) : (
                  <Button size="xs" bracketed onClick={() => setAdding(col.id)}>
                    + ADD CARD
                  </Button>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {drag && draggedTask && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-50 border-2 border-accent-primary bg-surface-raised p-3 shadow-hard-lg"
          style={{ left: drag.x - drag.dx, top: drag.y - drag.dy, width: drag.w }}
        >
          <CardFace task={draggedTask} overdueLabel={false} />
        </div>
      )}

      <div role="status" aria-live="assertive" aria-atomic="true" className="sr-only">
        {live}
      </div>

      <Modal
        isOpen={draft !== null}
        onClose={() => setDraft(null)}
        title={draft?.id === 'new' ? 'New card' : `Edit ${draft?.id ?? ''}`}
        footer={
          <div className="flex w-full flex-wrap justify-between gap-2">
            {draft && draft.id !== 'new' ? (
              <Button
                variant="danger"
                onClick={() => {
                  remove(draft.id);
                  setDraft(null);
                }}
              >
                DELETE
              </Button>
            ) : (
              <span />
            )}
            <span className="flex gap-2">
              <Button onClick={() => setDraft(null)}>
                CANCEL
              </Button>
              <Button variant="primary" onClick={saveDraft} disabled={!draft || draft.title.trim() === ''}>
                SAVE
              </Button>
            </span>
          </div>
        }
      >
        {draft && (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveDraft();
            }}
          >
            <Input
              label="Title"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              error={draft.title.trim() === '' ? 'A card needs a title' : undefined}
            />
            <TextArea
              label="Description"
              rows={3}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Select
                label="Column"
                options={colOptions}
                value={draft.column}
                onValueChange={(v) => setDraft({ ...draft, column: v as ColumnId })}
              />
              <Select
                label="Priority"
                options={(['P0', 'P1', 'P2', 'P3'] as const).map((p) => ({ label: p, value: p }))}
                value={draft.priority}
                onValueChange={(v) => setDraft({ ...draft, priority: v as Priority })}
              />
              <Select
                label="Assignee"
                options={[{ label: 'NONE', value: 'none' }, ...ASSIGNEES.map((a) => ({ label: a, value: a }))]}
                value={draft.assignee}
                onValueChange={(v) => setDraft({ ...draft, assignee: v })}
              />
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------- card item */

interface CardItemProps {
  task: Task;
  column: ColumnId;
  lifted: boolean;
  helpId: string;
  onPointerDown: (e: ReactPointerEvent<HTMLElement>, id: string) => void;
  onKeyDown: (e: ReactKeyboardEvent<HTMLElement>, id: string) => void;
  onOpen: () => void;
  onMove: (to: ColumnId) => void;
  onDelete: () => void;
}

function CardItem({ task, column, lifted, helpId, onPointerDown, onKeyDown, onOpen, onMove, onDelete }: CardItemProps) {
  return (
    <li
      data-card-li={task.id}
      onPointerDown={(e) => onPointerDown(e, task.id)}
      className="list-none select-none"
    >
      <div
        className={[
          'border-2 bg-surface-raised p-3 transition-shadow motion-reduce:transition-none print:break-inside-avoid',
          lifted
            ? 'border-accent-primary shadow-hard-lg'
            : 'border-edge-strong shadow-hard-sm hover:shadow-hard-md',
        ].join(' ')}
      >
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-xs text-content-muted">
            <span data-handle="" className="cursor-grab touch-none px-1 font-bold" aria-hidden="true">
              ::
            </span>
            {task.id}
          </span>
          <span className="print:hidden">
            <Menu
              align="end"
              trigger={
                <Button size="icon" aria-label={`Actions for ${task.id}`}>
                  ...
                </Button>
              }
            >
              <MenuItem onClick={onOpen}>EDIT</MenuItem>
              <MenuSeparator />
              <MenuRadioGroup label="MOVE TO" value={column} onValueChange={(v) => onMove(v as ColumnId)}>
                {COLUMNS.map((c) => (
                  <MenuRadioItem key={c.id} value={c.id}>
                    {c.title}
                  </MenuRadioItem>
                ))}
              </MenuRadioGroup>
              <MenuSeparator />
              <MenuItem intent="danger" onClick={onDelete}>
                DELETE
              </MenuItem>
            </Menu>
          </span>
        </div>
        <div
          role="button"
          tabIndex={0}
          data-card-focus={task.id}
          aria-roledescription="draggable card"
          aria-describedby={helpId}
          aria-pressed={lifted}
          onKeyDown={(e) => onKeyDown(e, task.id)}
          onClick={onOpen}
          className="cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-primary"
        >
          <CardFace task={task} />
        </div>
      </div>
    </li>
  );
}
