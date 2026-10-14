'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from 'react';
import {
  Badge,
  Button,
  Checkbox,
  Drawer,
  EmptyState,
  Input,
  Menu,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  useToast,
} from '@rtkelly-labs/design-system';
import type { AccentToken, TableDensity } from '@rtkelly-labs/design-system';
import {
  ISSUES,
  ME,
  PRIORITIES,
  STATUSES,
  stamp,
  type Issue,
  type Priority,
  type Status,
} from './data';

/*
 * Dense inbox / issue list: the Linear list + Gmail inbox archetype.
 *
 * Built from the package's exports only. `DataTable` has no row selection, no
 * row-level props and no custom row, so the list is composed from the `Table`
 * primitives instead. Every site-local shim is marked `SHIM:` and mirrored in
 * the findings report.
 */

const STATUS_ACCENT: Record<Status, AccentToken> = {
  BACKLOG: 'quiet',
  TODO: 'secondary',
  IN_PROGRESS: 'warning',
  REVIEW: 'info',
  DONE: 'success',
};

const PRIORITY_CLASS: Record<Priority, string> = {
  P0: 'text-intent-danger',
  P1: 'text-intent-warning',
  P2: 'text-content-secondary',
  P3: 'text-content-muted',
};

type View = 'all' | 'mine' | 'unread';

const subscribeWide = (cb: () => void) => {
  const mq = window.matchMedia('(min-width: 1024px)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const getWide = () => window.matchMedia('(min-width: 1024px)').matches;

/** Whether the viewport has room for a split pane. Server snapshot is `false`. */
function useWide() {
  return useSyncExternalStore(subscribeWide, getWide, () => false);
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest('input, textarea, select, [role="menu"], [role="listbox"], [role="tab"]'));
}

export default function InboxApp() {
  const toast = useToast();
  const wide = useWide();

  const [issues, setIssues] = useState<readonly Issue[]>(ISSUES);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<View>('all');
  const [statusFilter, setStatusFilter] = useState('any');
  const [priorityFilter, setPriorityFilter] = useState('any');
  const [density, setDensity] = useState<TableDensity>('compact');
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [cursor, setCursor] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [announce, setAnnounce] = useState('');
  const anchor = useRef<string | null>(null);

  const counts = useMemo(
    () => ({
      all: issues.length,
      mine: issues.filter((i) => i.assignee === ME).length,
      unread: issues.filter((i) => i.unread).length,
    }),
    [issues],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return issues.filter((i) => {
      if (view === 'mine' && i.assignee !== ME) return false;
      if (view === 'unread' && !i.unread) return false;
      if (statusFilter !== 'any' && i.status !== statusFilter) return false;
      if (priorityFilter !== 'any' && i.priority !== priorityFilter) return false;
      return !q || `${i.id} ${i.title} ${i.labels.join(' ')} ${i.assignee ?? ''}`.toLowerCase().includes(q);
    });
  }, [issues, query, view, statusFilter, priorityFilter]);

  const filtered = query.trim() !== '' || statusFilter !== 'any' || priorityFilter !== 'any' || view !== 'all';
  const open = openId ? (issues.find((i) => i.id === openId) ?? null) : null;
  const selectedRows = rows.filter((r) => selected.has(r.id));
  const allSelected = rows.length > 0 && selectedRows.length === rows.length;
  const someSelected = selectedRows.length > 0 && !allSelected;

  // The cursor is a position, not an id, once the rows under it change.
  const cursorIndex = cursor ? rows.findIndex((r) => r.id === cursor) : -1;

  const moveCursor = useCallback(
    (delta: number, extend: boolean) => {
      if (rows.length === 0) return;
      const from = cursorIndex < 0 ? (delta > 0 ? -1 : rows.length) : cursorIndex;
      const next = rows[Math.min(rows.length - 1, Math.max(0, from + delta))] as Issue;
      setCursor(next.id);
      if (extend) {
        const a = anchor.current ?? (rows[Math.max(0, cursorIndex)] as Issue).id;
        anchor.current = a;
        const ai = rows.findIndex((r) => r.id === a);
        const ni = rows.findIndex((r) => r.id === next.id);
        const [lo, hi] = ai < ni ? [ai, ni] : [ni, ai];
        setSelected(new Set(rows.slice(lo, hi + 1).map((r) => r.id)));
      } else {
        anchor.current = null;
      }
      document.getElementById(`inbox-row-${next.id}`)?.scrollIntoView({ block: 'nearest' });
    },
    [rows, cursorIndex],
  );

  const toggle = useCallback((id: string, on?: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const want = on ?? !next.has(id);
      if (want) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const archive = useCallback(
    (ids: readonly string[]) => {
      if (ids.length === 0) return;
      const before = issues;
      setIssues((prev) => prev.filter((i) => !ids.includes(i.id)));
      setSelected(new Set());
      if (openId && ids.includes(openId)) setOpenId(null);
      setAnnounce(`${ids.length} archived`);
      toast.show({
        title: `${ids.length} ARCHIVED`,
        intent: 'success',
        action: { label: 'UNDO', onClick: () => setIssues(before) },
      });
    },
    [issues, openId, toast],
  );

  const patch = useCallback(
    (ids: readonly string[], change: Partial<Pick<Issue, 'status' | 'priority'>>) => {
      setIssues((prev) => prev.map((i) => (ids.includes(i.id) ? { ...i, ...change } : i)));
      setAnnounce(`${ids.length} updated`);
    },
    [],
  );

  const reload = () => {
    setLoading(true);
    window.setTimeout(() => setLoading(false), 1400);
  };

  // `/` focuses the search field from anywhere that is not already typing.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === '/' && !isTypingTarget(e.target)) {
        e.preventDefault();
        document.getElementById('inbox-search')?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onListKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (isTypingTarget(e.target) || e.altKey) return;
    const cur = cursorIndex >= 0 ? (rows[cursorIndex] as Issue) : null;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      setSelected(new Set(rows.map((r) => r.id)));
      return;
    }
    if (e.metaKey || e.ctrlKey) return;
    switch (e.key) {
      case 'j':
      case 'J':
      case 'ArrowDown':
        e.preventDefault();
        moveCursor(1, e.shiftKey);
        break;
      case 'k':
      case 'K':
      case 'ArrowUp':
        e.preventDefault();
        moveCursor(-1, e.shiftKey);
        break;
      case 'x':
      case ' ':
        if (!cur) return;
        e.preventDefault();
        toggle(cur.id);
        break;
      case 'Enter':
      case 'o':
        if (!cur) return;
        e.preventDefault();
        setOpenId(cur.id);
        break;
      case 'e':
        e.preventDefault();
        archive(selectedRows.length > 0 ? selectedRows.map((r) => r.id) : cur ? [cur.id] : []);
        break;
      case 'Escape':
        if (selected.size > 0) setSelected(new Set());
        else if (openId) setOpenId(null);
        break;
      default:
    }
  };

  const clearFilters = () => {
    setQuery('');
    setView('all');
    setStatusFilter('any');
    setPriorityFilter('any');
  };

  const detail = open ? (
    <IssueDetail issue={open} onArchive={() => archive([open.id])} onPatch={(c) => patch([open.id], c)} />
  ) : (
    <div className="flex h-full min-h-48 items-center justify-center p-6 text-center font-mono text-xs uppercase tracking-widest text-content-muted">
      [ NO ISSUE OPEN ]
    </div>
  );

  return (
    <div className="flex flex-col gap-3 font-mono">
      {/* Title + view tabs */}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-content-primary">
          [ INBOX ]
        </h2>
        <p className="text-xs uppercase tracking-widest text-content-muted">
          {rows.length} OF {issues.length} ISSUES
        </p>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as View)} variant="underline" accent="primary">
        <TabsList label="Issue views">
          <TabsTab value="all">ALL [{counts.all}]</TabsTab>
          <TabsTab value="mine">MINE [{counts.mine}]</TabsTab>
          <TabsTab value="unread">UNREAD [{counts.unread}]</TabsTab>
        </TabsList>
        {/* Panels are required by the tab model; the list below is shared by all three. */}
        <TabsPanel value="all" className="hidden">{null}</TabsPanel>
        <TabsPanel value="mine" className="hidden">{null}</TabsPanel>
        <TabsPanel value="unread" className="hidden">{null}</TabsPanel>
      </Tabs>

      {/* Toolbar: filters, or the bulk bar when something is selected */}
      {selectedRows.length > 0 ? (
        <div
          role="toolbar"
          aria-label="Bulk actions"
          className="flex min-h-14 flex-wrap items-center gap-3 border-2 border-edge-strong bg-surface-raised px-3 py-2 shadow-hard-sm"
        >
          <span className="text-sm font-bold uppercase tracking-wider text-accent-primary">
            [ {selectedRows.length} SELECTED ]
          </span>
          <Menu trigger={<Button size="sm" variant="secondary">STATUS</Button>}>
            {STATUSES.map((s) => (
              <MenuItem key={s} onClick={() => patch(selectedRows.map((r) => r.id), { status: s })}>
                {s}
              </MenuItem>
            ))}
          </Menu>
          <Menu trigger={<Button size="sm" variant="secondary">PRIORITY</Button>}>
            {PRIORITIES.map((p) => (
              <MenuItem key={p} onClick={() => patch(selectedRows.map((r) => r.id), { priority: p })}>
                {p}
              </MenuItem>
            ))}
          </Menu>
          <Button size="sm" variant="tertiary" onClick={() => archive(selectedRows.map((r) => r.id))}>
            ARCHIVE
          </Button>
          <Button size="sm" variant="tertiary" onClick={() => setSelected(new Set())}>
            CLEAR
          </Button>
        </div>
      ) : (
        <div className="grid min-h-14 grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_12rem_auto_auto]">
          <div className="col-span-2 sm:col-span-1">
            <Input
              id="inbox-search"
              aria-label="Filter issues"
              placeholder="filter issues  (press / to focus)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select
            aria-label="Status"
            value={statusFilter}
            onValueChange={setStatusFilter}
            options={[{ value: 'any', label: 'STATUS: ANY' }, ...STATUSES.map((s) => ({ value: s, label: s }))]}
          />
          <Select
            aria-label="Priority"
            value={priorityFilter}
            onValueChange={setPriorityFilter}
            options={[{ value: 'any', label: 'PRIORITY: ANY' }, ...PRIORITIES.map((p) => ({ value: p, label: p }))]}
          />
          <Menu trigger={<Button size="sm" variant="secondary">DENSITY</Button>} align="end">
            <MenuRadioGroup label="Row density" value={density} onValueChange={(v) => setDensity(v as TableDensity)}>
              <MenuRadioItem value="compact" closeOnClick>COMPACT</MenuRadioItem>
              <MenuRadioItem value="comfortable" closeOnClick>COMFORTABLE</MenuRadioItem>
            </MenuRadioGroup>
            <MenuSeparator />
            <MenuItem onClick={reload}>RELOAD (SKELETON)</MenuItem>
          </Menu>
          <Button size="sm" variant="tertiary" onClick={clearFilters} disabled={!filtered}>
            RESET
          </Button>
        </div>
      )}

      <div aria-live="polite" className="sr-only">
        {selectedRows.length > 0 ? `${selectedRows.length} selected` : announce}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_26rem]">
        {/* The list. Keys are handled here so they work whenever focus is inside it. */}
        {/* SHIM: the package has no list or grid primitive with a key model. The handler sits on a
            wrapper that is not itself a focus stop; the focusable thing is `Table`'s own region. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- see SHIM above */}
        <div role="group" aria-label="Issue list" onKeyDown={onListKeyDown} className="min-w-0">
          {loading ? (
            <ListSkeleton density={density} />
          ) : rows.length === 0 ? (
            <div className="border-2 border-edge-strong">
              <EmptyState
                title={filtered ? 'NO MATCHING ISSUES' : 'INBOX ZERO'}
                description={
                  filtered
                    ? 'Nothing matches the current view and filters.'
                    : 'Every issue is archived. Press UNDO on the last toast or reload.'
                }
                action={filtered ? <Button size="sm" onClick={clearFilters}>RESET FILTERS</Button> : undefined}
              />
            </div>
          ) : (
            <Table
              label="Issues. Use J and K to move, X to select, Enter to open, E to archive."
              appearance="quiet"
              density={density}
              containerClassName="max-h-[max(20rem,calc(100vh-17rem))] overflow-y-auto border-2 border-edge-strong"
              className="table-fixed md:table-auto"
              aria-rowcount={rows.length + 1}
            >
              <TableHeader className="sticky top-0 z-raised bg-surface-raised">
                <TableRow>
                  <TableHead className="w-10 px-2">
                    <Checkbox
                      aria-label="Select all issues"
                      checked={allSelected}
                      indeterminate={someSelected}
                      onCheckedChange={(on) => setSelected(on ? new Set(rows.map((r) => r.id)) : new Set())}
                    />
                  </TableHead>
                  <TableHead className="w-10 px-1">PRI</TableHead>
                  <TableHead className="hidden w-24 md:table-cell">ID</TableHead>
                  <TableHead>TITLE</TableHead>
                  <TableHead className="hidden w-32 md:table-cell">STATUS</TableHead>
                  <TableHead className="hidden w-12 text-center md:table-cell">WHO</TableHead>
                  <TableHead className="hidden w-12 text-right lg:table-cell">CMT</TableHead>
                  <TableHead className="w-28 text-right">UPDATED</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, idx) => {
                  const isSel = selected.has(r.id);
                  const isCur = r.id === cursor;
                  const isOpen = r.id === openId;
                  return (
                    <TableRow
                      key={r.id}
                      id={`inbox-row-${r.id}`}
                      aria-rowindex={idx + 2}
                      aria-current={isCur ? 'true' : undefined}
                      data-state={isSel ? 'selected' : undefined}
                      data-cursor={isCur ? 'true' : undefined}
                      onClick={() => {
                        setCursor(r.id);
                        setOpenId(r.id);
                      }}
                      className={[
                        'cursor-pointer',
                        // Selection is the 4px leading edge, per docs/theming.md: the
                        // surface step `Table` ships for `data-state=selected` is
                        // under 1.1:1 against the page. The cursor is an inset
                        // outline, so the two read apart.
                        isSel ? 'shadow-[inset_4px_0_0_0_var(--ds-accent-primary)]' : '',
                        isCur ? 'outline-2 -outline-offset-2 outline-accent-secondary' : '',
                        isOpen ? 'bg-surface-sunken' : '',
                      ].join(' ')}
                    >
                      <TableCell className="px-2" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          aria-label={`Select ${r.id}`}
                          tabIndex={-1}
                          checked={isSel}
                          onCheckedChange={(on) => toggle(r.id, on)}
                        />
                      </TableCell>
                      <TableCell className={`px-1 font-bold ${PRIORITY_CLASS[r.priority]}`}>{r.priority}</TableCell>
                      <TableCell className="hidden whitespace-nowrap text-content-muted md:table-cell">{r.id}</TableCell>
                      <TableCell className={`max-w-0 ${r.unread ? 'font-bold' : 'text-content-secondary'}`}>
                        <div className="flex items-center gap-2">
                          {r.unread ? (
                            <span aria-label="unread" className="shrink-0 font-bold text-accent-primary">
                              ●
                            </span>
                          ) : null}
                          <span className="truncate">{r.title}</span>
                          {r.labels.map((l) => (
                            <Badge
                              key={l}
                              accent="quiet"
                              className="hidden shrink-0 border px-1.5 py-0 text-[0.65rem] 2xl:inline-flex"
                            >
                              {l}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge accent={STATUS_ACCENT[r.status]} className="border px-1.5 py-0 text-[0.65rem]">
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-center text-content-secondary md:table-cell">
                        {r.assignee ?? '--'}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums text-content-muted lg:table-cell">
                        {r.comments}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right text-xs tabular-nums text-content-muted">
                        <span className="md:hidden">{stamp(r.updatedMs).slice(0, 6)}</span>
                      <span className="hidden md:inline">{stamp(r.updatedMs)}</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          <p className="mt-2 text-xs text-content-muted">
            [ J/K MOVE ] [ X SELECT ] [ SHIFT+J/K RANGE ] [ ENTER OPEN ] [ E ARCHIVE ] [ / FILTER ] [ ESC CLEAR ]
          </p>
        </div>

        {/* Split pane on wide screens; a Drawer below it. */}
        {wide ? (
          <aside
            aria-label="Issue detail"
            className="sticky top-4 min-h-64 border-2 border-edge-strong bg-surface-raised shadow-hard-md"
          >
            {detail}
          </aside>
        ) : (
          <Drawer isOpen={open !== null} onClose={() => setOpenId(null)} title={open ? open.id : 'ISSUE'}>
            {detail}
          </Drawer>
        )}
      </div>
    </div>
  );
}

function ListSkeleton({ density }: { density: TableDensity }) {
  const h = density === 'compact' ? 'h-5' : 'h-6';
  return (
    <div role="status" aria-label="Loading issues" className="flex flex-col gap-0 border-2 border-edge-strong">
      {Array.from({ length: 12 }, (_, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 border-b border-edge-subtle px-3 ${density === 'compact' ? 'py-2' : 'py-3'}`}
        >
          <Skeleton className="h-4 w-4 shrink-0" />
          <Skeleton className={`${h} w-8 shrink-0`} />
          <Skeleton className={`${h} hidden w-16 shrink-0 md:block`} />
          <Skeleton className={`${h} flex-1`} />
          <Skeleton className={`${h} w-24 shrink-0`} />
        </div>
      ))}
    </div>
  );
}

function IssueDetail({
  issue,
  onArchive,
  onPatch,
}: {
  issue: Issue;
  onArchive: () => void;
  onPatch: (c: Partial<Pick<Issue, 'status' | 'priority'>>) => void;
}) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-content-muted">{issue.id}</p>
          <h3 className="font-display text-lg font-bold uppercase leading-tight tracking-wide text-content-primary">
            {issue.title}
          </h3>
        </div>
        <Menu trigger={<Button size="sm" variant="secondary" aria-label={`Actions for ${issue.id}`}>...</Button>} align="end">
          {STATUSES.map((s) => (
            <MenuItem key={s} onClick={() => onPatch({ status: s })}>
              SET {s}
            </MenuItem>
          ))}
          <MenuSeparator />
          <MenuItem intent="danger" onClick={onArchive}>ARCHIVE</MenuItem>
        </Menu>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge accent={STATUS_ACCENT[issue.status]}>{issue.status}</Badge>
        <Badge accent="quiet">{issue.priority}</Badge>
        {issue.labels.map((l) => (
          <Badge key={l} accent="quiet">{l}</Badge>
        ))}
      </div>

      <Tabs defaultValue="details" variant="underline" accent="primary">
        <TabsList label="Issue sections">
          <TabsTab value="details">DETAILS</TabsTab>
          <TabsTab value="activity">ACTIVITY [{issue.comments}]</TabsTab>
        </TabsList>
        <TabsPanel value="details">
          <dl className="mt-3 grid grid-cols-[6rem_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-content-muted">ASSIGNEE</dt>
            <dd>{issue.assignee ?? 'UNASSIGNED'}</dd>
            <dt className="text-content-muted">UPDATED</dt>
            <dd className="tabular-nums">{stamp(issue.updatedMs)} UTC</dd>
            <dt className="text-content-muted">COMMENTS</dt>
            <dd className="tabular-nums">{issue.comments}</dd>
          </dl>
          <p className="mt-3 font-sans text-sm leading-relaxed text-content-secondary">{issue.body}</p>
        </TabsPanel>
        <TabsPanel value="activity">
          <p className="mt-3 text-sm text-content-muted">
            {issue.comments === 0 ? 'NO ACTIVITY YET.' : `${issue.comments} COMMENTS. THREAD NOT LOADED IN THIS FIXTURE.`}
          </p>
        </TabsPanel>
      </Tabs>
    </div>
  );
}
