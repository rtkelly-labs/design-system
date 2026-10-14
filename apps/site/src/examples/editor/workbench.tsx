'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import {
  Badge,
  Breadcrumbs,
  ChangeSummary,
  Drawer,
  Modal,
  NerdIcon,
  Terminal,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  Tooltip,
  TreeDiagram,
  useOptionalTheme,
} from '@rtkelly13/design-system';
import type { NerdIconName } from '@rtkelly13/design-system';
import {
  COMMANDS,
  DIAGNOSTICS,
  DIFF_LINES,
  FILE_TREE,
  GIT_GUTTER,
  MATH_SOURCE,
  PAGINATE_SOURCE,
  TERMINAL_SESSION,
  at,
  findAll,
  tokenizeLine,
} from './data';
import type { Command, Decoration, DecorationKind, TokenKind, TreeEntry } from './data';

/*
 * A code editor composed from the package, by role. The editing surface itself
 * is a static, line-addressed mock: there is no caret, no text input and no
 * undo stack, because the package ships no editing primitive and the brief
 * rules out Monaco and CodeMirror. Everything around the surface is real.
 */

/* ── colour, by role ─────────────────────────────────────────────────────── */

/** Syntax colour. Four hue-bearing roles are the whole vocabulary: the ladder has no `syntax` group. */
const SYNTAX: Record<TokenKind, string> = {
  keyword: 'text-accent-tertiary',
  string: 'text-intent-success',
  number: 'text-intent-warning',
  comment: 'text-content-muted italic',
  function: 'text-accent-primary',
  type: 'text-content-primary font-bold',
  punct: 'text-content-secondary',
  plain: 'text-content-primary',
};

/**
 * Editor chrome. There are no `editor.*` roles, so every band is a role colour
 * at an alpha: Tailwind compiles `/25` to `color-mix()`, which is the thing the
 * ladder's own rules say cannot hold on both grounds.
 */
const DECORATION: Record<DecorationKind, string> = {
  selection: 'bg-accent-primary/25',
  find: 'bg-intent-warning/25 outline outline-1 -outline-offset-1 outline-intent-warning',
  findCurrent: 'bg-intent-warning/50 outline outline-2 -outline-offset-2 outline-intent-warning',
  bracket: 'bg-content-primary/15 outline outline-1 -outline-offset-1 outline-edge-strong',
  error: 'underline decoration-wavy decoration-2 decoration-intent-danger underline-offset-4',
  warning: 'underline decoration-wavy decoration-intent-warning underline-offset-4',
  info: 'underline decoration-dotted decoration-intent-info underline-offset-4',
};

const SEVERITY_ICON: Record<'error' | 'warning' | 'info', { icon: NerdIconName; cls: string }> = {
  error: { icon: 'close', cls: 'text-intent-danger' },
  warning: { icon: 'alert', cls: 'text-intent-warning' },
  info: { icon: 'info', cls: 'text-intent-info' },
};

const GIT_BAR: Record<'added' | 'modified' | 'removed', string> = {
  added: 'bg-intent-success',
  modified: 'bg-intent-warning',
  removed: 'bg-intent-danger',
};

/* ── the editing surface ─────────────────────────────────────────────────── */

interface Piece {
  text: string;
  kind: TokenKind;
  decos: DecorationKind[];
}

function piecesOf(text: string, lineNo: number, decorations: readonly Decoration[]): Piece[] {
  const tokens = tokenizeLine(text);
  const mine = decorations.filter((d) => d.line === lineNo);
  const cuts = new Set<number>([0, text.length]);
  let at = 0;
  for (const t of tokens) {
    at += t.text.length;
    cuts.add(at);
  }
  for (const d of mine) {
    cuts.add(d.from);
    cuts.add(Math.min(d.to, text.length));
  }
  const points = [...cuts].sort((a, b) => a - b);
  const kindAt = (i: number): TokenKind => {
    let pos = 0;
    for (const t of tokens) {
      if (i < pos + t.text.length) return t.kind;
      pos += t.text.length;
    }
    return 'plain';
  };
  const out: Piece[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const from = points[i]!;
    const to = points[i + 1]!;
    if (to <= from) continue;
    out.push({
      text: text.slice(from, to),
      kind: kindAt(from),
      decos: mine.filter((d) => d.from <= from && d.to >= to).map((d) => d.kind),
    });
  }
  return out;
}

function CodeLine({
  lineNo,
  text,
  current,
  decorations,
  wrap,
}: {
  lineNo: number;
  text: string;
  current: boolean;
  decorations: readonly Decoration[];
  wrap: boolean;
}) {
  const indent = Math.floor((text.match(/^ */)?.[0].length ?? 0) / 2);
  const body = text.slice(indent * 2);
  const pieces = piecesOf(body, lineNo, decorations.map((d) => ({ ...d, from: d.from - indent * 2, to: d.to - indent * 2 })));
  const foldable = /[{(]$/.test(text.trimEnd());
  const git = GIT_GUTTER[lineNo];
  return (
    <div
      data-line={lineNo}
      className={`grid grid-cols-[0.25rem_1rem_2.5rem_minmax(0,1fr)] ${current ? 'bg-accent-primary/10' : ''}`}
    >
      <span aria-hidden="true" className={git ? GIT_BAR[git] : ''} />
      <span aria-hidden="true" className="select-none text-center text-content-muted">
        {foldable ? '▾' : ''}
      </span>
      <span
        aria-hidden="true"
        className={`select-none pr-3 text-right tabular-nums print:text-content-secondary ${current ? 'text-content-primary' : 'text-content-muted'}`}
      >
        {lineNo}
      </span>
      <code className={`block pl-1 ${wrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'} print:whitespace-pre-wrap print:break-all`}>
        {Array.from({ length: indent }, (_, i) => (
          <span key={i} aria-hidden="true" className="inline-block w-[2ch] border-l border-edge-subtle">
            {'​'}
          </span>
        ))}
        {pieces.map((p, i) => (
          <span key={i} className={`${SYNTAX[p.kind]} ${p.decos.map((d) => DECORATION[d]).join(' ')}`}>
            {p.text}
          </span>
        ))}
        {text === '' ? '​' : null}
      </code>
    </div>
  );
}

function Minimap({ source, currentLine }: { source: string; currentLine: number }) {
  const rows = source.split('\n');
  return (
    <div aria-hidden="true" className="hidden w-20 shrink-0 select-none overflow-hidden border-l-2 border-edge-subtle bg-surface-sunken py-2 lg:block print:hidden">
      {rows.map((row, i) => (
        <div key={i} className={`flex h-[3px] items-center pl-2 ${i + 1 === currentLine ? 'bg-accent-primary/20' : ''}`}>
          {tokenizeLine(row).map((t, j) => (
            <span
              key={j}
              className={`inline-block h-[2px] ${t.kind === 'plain' && t.text.trim() === '' ? 'bg-transparent' : 'bg-current'} ${SYNTAX[t.kind].split(' ')[0]}`}
              style={{ width: `${t.text.length * 1.2}px` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function EditorPane({ file, wrap, findOn }: { file: 'paginate.ts' | 'math.ts'; wrap: boolean; findOn: boolean }) {
  const source = file === 'paginate.ts' ? PAGINATE_SOURCE : MATH_SOURCE;
  const lines = source.replace(/\n$/, '').split('\n');
  const decorations = useMemo<Decoration[]>(() => {
    if (file !== 'paginate.ts') return [];
    const out: Decoration[] = [
      { line: 11, from: 14, to: 18, kind: 'selection' },
      { line: 12, from: 0, to: 26, kind: 'selection' },
      at(source, 13, 'lenght', 'error'),
      at(source, 13, 'total', 'warning'),
      at(source, 10, '{', 'bracket'),
      at(source, 22, '}', 'bracket'),
      at(source, 25, 'LABEL', 'info'),
    ];
    if (findOn) {
      const matches = findAll(source, 'items');
      matches.forEach((m, i) => out.push({ ...m, kind: i === 3 ? 'findCurrent' : 'find' }));
    }
    return out;
  }, [file, findOn, source]);
  const current = file === 'paginate.ts' ? 13 : 3;

  return (
    <div className="flex min-h-0 flex-1 bg-surface-sunken print:block">
      <div
        role="region"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be focusable (axe scrollable-region-focusable)
        tabIndex={0}
        aria-label={`${file} source, ${lines.length} lines`}
        className="min-w-0 flex-1 overflow-auto py-2 font-mono text-[13px] leading-5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-primary print:overflow-visible"
      >
        <div className={wrap ? '' : 'w-max min-w-full pr-4'}>
          {lines.map((text, i) => (
            <CodeLine key={i} lineNo={i + 1} text={text} current={i + 1 === current} decorations={decorations} wrap={wrap} />
          ))}
        </div>
      </div>
      <Minimap source={source} currentLine={current} />
    </div>
  );
}

/* ── diff ────────────────────────────────────────────────────────────────── */

function DiffPane() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-surface-sunken">
      <div
        role="region"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be focusable (axe scrollable-region-focusable)
        tabIndex={0}
        aria-label="Unified diff of paginate.ts"
        className="min-w-0 flex-1 overflow-auto py-2 font-mono text-[13px] leading-5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-primary">
        <div className="w-max min-w-full">
          {DIFF_LINES.map((l, i) => (
            <div
              key={i}
              className={`grid grid-cols-[2.5rem_2.5rem_1.5rem_minmax(0,1fr)] ${
                l.sign === 'add' ? 'bg-intent-success/15' : l.sign === 'remove' ? 'bg-intent-danger/15' : ''
              }`}
            >
              <span aria-hidden="true" className="select-none pr-2 text-right text-content-muted">{l.oldNo ?? ''}</span>
              <span aria-hidden="true" className="select-none pr-2 text-right text-content-muted">{l.newNo ?? ''}</span>
              <span
                className={`select-none text-center font-bold ${l.sign === 'add' ? 'text-intent-success' : l.sign === 'remove' ? 'text-intent-danger' : 'text-transparent'}`}
              >
                <span className="sr-only">{l.sign === 'add' ? 'added: ' : l.sign === 'remove' ? 'removed: ' : 'unchanged: '}</span>
                <span aria-hidden="true">{l.sign === 'add' ? '+' : l.sign === 'remove' ? '−' : ' '}</span>
              </span>
              <code className="whitespace-pre pl-1">
                {tokenizeLine(l.text).map((t, j) => (
                  <span key={j} className={SYNTAX[t.kind]}>{t.text}</span>
                ))}
              </code>
            </div>
          ))}
        </div>
      </div>
      <div className="shrink-0 border-t-2 border-edge-subtle bg-surface-base p-3">
        <ChangeSummary
          label="paginate.ts change summary"
          rows={[
            { label: 'lines added', value: '+2', sign: 'add' },
            { label: 'lines removed', value: '−1', sign: 'remove' },
          ]}
          footer={{ label: 'net', value: '+1' }}
        />
      </div>
    </div>
  );
}

/* ── explorer ────────────────────────────────────────────────────────────── */

const GIT_BADGE: Record<'M' | 'A' | 'U', string> = {
  M: 'text-intent-warning',
  A: 'text-intent-success',
  U: 'text-intent-info',
};

function TreeRows({
  entries,
  depth,
  open,
  toggle,
  active,
  onOpen,
}: {
  entries: TreeEntry[];
  depth: number;
  open: Record<string, boolean>;
  toggle: (id: string) => void;
  active: string;
  onOpen: (id: string) => void;
}) {
  return (
    <ul role={depth === 0 ? 'tree' : 'group'} aria-label={depth === 0 ? 'Files' : undefined} className="m-0 list-none p-0">
      {entries.map((e) => {
        const isOpen = open[e.id] ?? false;
        return (
          <li key={e.id} role="treeitem" aria-expanded={e.kind === 'dir' ? isOpen : undefined} aria-selected={e.id === active}>
            <button
              type="button"
              onClick={() => (e.kind === 'dir' ? toggle(e.id) : onOpen(e.id))}
              style={{ paddingLeft: `${depth * 0.75 + 0.5}rem` }}
              className={`flex w-full items-center gap-2 py-1 pr-2 text-left hover:bg-surface-raised focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-primary ${e.id === active ? 'bg-surface-raised text-content-primary' : 'text-content-secondary'}`}
            >
              <NerdIcon
                name={e.kind === 'dir' ? (isOpen ? 'folder-open' : 'folder') : 'file-code'}
                size="sm"
                className={e.kind === 'dir' ? 'text-accent-secondary' : 'text-accent-primary'}
              />
              <span className="min-w-0 flex-1 truncate">{e.name}</span>
              {e.git ? (
                <span className={`font-bold ${GIT_BADGE[e.git]}`} title={{ M: 'Modified', A: 'Added', U: 'Untracked' }[e.git]}>
                  {e.git}
                </span>
              ) : null}
            </button>
            {e.children && isOpen ? (
              <TreeRows entries={e.children} depth={depth + 1} open={open} toggle={toggle} active={active} onOpen={onOpen} />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function Explorer({ active, onOpen }: { active: string; onOpen: (id: string) => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>({ src: true });
  const toggle = useCallback((id: string) => setOpen((o) => ({ ...o, [id]: !o[id] })), []);
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <h2 className="m-0 px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest text-content-muted">[ Explorer ]</h2>
      <TreeRows entries={FILE_TREE} depth={0} open={open} toggle={toggle} active={active} onOpen={onOpen} />
      <h2 className="m-0 mt-4 px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest text-content-muted">[ Outline ]</h2>
      <div className="px-2 pb-4 text-xs">
        <TreeDiagram
          label="paginate.ts outline"
          nodes={[
            {
              label: 'paginate.ts',
              children: [
                { label: 'Page<T>', meta: 'interface' },
                { label: 'paginate()', meta: 'function', accent: true },
                { label: 'FIRST_PAGE', meta: 'const' },
                { label: 'LABEL', meta: 'const' },
              ],
            },
          ]}
        />
      </div>
    </div>
  );
}

/* ── ANSI strip (evaluation-only: addresses the palette Hues on purpose) ──── */

const ANSI_SLOT_VARS = [
  'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
] as const;

/**
 * A terminal has sixteen slots named by hue and no notion of a role, so the
 * only way to draw them is through the Hue tokens. This is the one place in the
 * example that does, and it uses published custom properties, never a literal.
 */
function AnsiStrip({ polarity }: { polarity: 'dark' | 'light' }) {
  /* The achromatic four ask about lightness, not name — the same rule `ansi.ts` applies. */
  const ramp = {
    dark: { black: '--ds-surface-sunken', brightBlack: '--ds-surface-raised', white: '--ds-text-secondary', brightWhite: '--ds-text-primary' },
    light: { black: '--ds-text-primary', brightBlack: '--ds-text-secondary', white: '--ds-surface-sunken', brightWhite: '--ds-surface-raised' },
  }[polarity];
  const slotVar = (name: string, bright: boolean) =>
    name === 'black' || name === 'white'
      ? `var(${ramp[bright ? (`bright${name[0]!.toUpperCase()}${name.slice(1)}` as 'brightBlack' | 'brightWhite') : (name as 'black' | 'white')]})`
      : bright ? `var(--ds-palette-bright-${name})` : `var(--ds-palette-${name})`;
  return (
    <div className="mt-3 border-t-2 border-edge-subtle pt-3" aria-label="ANSI sixteen-colour test pattern" role="group">
      {[false, true].map((bright) => (
        <div key={String(bright)} className="flex flex-wrap gap-x-3">
          {ANSI_SLOT_VARS.map((n) => (
            <span key={n} className="font-mono text-xs" style={{ color: slotVar(n, bright) }}>
              {bright ? `bright${n}` : n}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── command palette ─────────────────────────────────────────────────────── */

function CommandPalette({ isOpen, onClose, onRun }: { isOpen: boolean; onClose: () => void; onRun: (c: Command) => void }) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const listId = useId();
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COMMANDS.filter((c) => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q));
  }, [query]);
  const safeIndex = Math.min(index, Math.max(results.length - 1, 0));

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndex((safeIndex + 1) % Math.max(results.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex((safeIndex - 1 + results.length) % Math.max(results.length, 1));
    } else if (e.key === 'Enter' && results[safeIndex]) {
      e.preventDefault();
      onRun(results[safeIndex]!);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Command palette">
      <input
        // eslint-disable-next-line jsx-a11y/no-autofocus -- Modal has no initialFocus prop (gap); without this, focus lands on the dialog and typing goes nowhere
        autoFocus
        role="combobox"
        aria-expanded="true"
        aria-controls={listId}
        aria-activedescendant={results[safeIndex] ? `${listId}-${results[safeIndex]!.id}` : undefined}
        aria-label="Type a command"
        placeholder="> type a command"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIndex(0);
        }}
        onKeyDown={onKey}
        className="w-full border-2 border-edge-strong bg-surface-sunken px-3 py-2 font-mono text-sm text-content-primary placeholder:text-content-muted focus-visible:outline-2 focus-visible:outline-accent-primary"
      />
      <ul id={listId} role="listbox" aria-label="Commands" className="m-0 mt-3 max-h-64 list-none overflow-auto p-0 font-mono text-sm">
        {results.length === 0 ? <li className="px-3 py-2 text-content-muted">no matching command</li> : null}
        {results.map((c, i) => (
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- combobox pattern: the input owns the keyboard, options are driven by aria-activedescendant
          <li
            key={c.id}
            id={`${listId}-${c.id}`}
            role="option"
            aria-selected={i === safeIndex}
            onMouseEnter={() => setIndex(i)}
            onClick={() => {
              onRun(c);
              onClose();
            }}
            className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 ${i === safeIndex ? 'bg-accent-primary text-content-inverse' : ''}`}
          >
            <span>
              <span className={i === safeIndex ? '' : 'text-content-muted'}>{c.group}: </span>
              {c.label}
            </span>
            {c.shortcut ? <kbd className="border-2 border-current px-1 text-xs">{c.shortcut}</kbd> : null}
          </li>
        ))}
      </ul>
    </Modal>
  );
}

/* ── the workbench ───────────────────────────────────────────────────────── */

type OpenFile = { id: string; label: string; dirty: boolean; kind: 'file' | 'diff' };

const ACTIVITY: { id: string; icon: NerdIconName; label: string }[] = [
  { id: 'explorer', icon: 'folder', label: 'Explorer' },
  { id: 'search', icon: 'search', label: 'Search' },
  { id: 'git', icon: 'git-branch', label: 'Source control' },
  { id: 'debug', icon: 'bug', label: 'Run and debug' },
];

function IconButton({ label, pressed, onClick, icon, className = '' }: { label: string; pressed?: boolean; onClick?: () => void; icon: NerdIconName; className?: string }) {
  return (
    <Tooltip content={label} side="right">
      <button
        type="button"
        aria-label={label}
        aria-pressed={pressed}
        onClick={onClick}
        className={`flex h-11 w-12 items-center justify-center border-l-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-primary ${pressed ? 'border-accent-primary bg-surface-raised text-content-primary' : 'border-transparent text-content-muted hover:text-content-primary'} ${className}`}
      >
        <NerdIcon name={icon} size="md" />
      </button>
    </Tooltip>
  );
}

export default function EditorWorkbench() {
  const theme = useOptionalTheme();
  const [files, setFiles] = useState<OpenFile[]>([
    { id: 'paginate.ts', label: 'paginate.ts', dirty: true, kind: 'file' },
    { id: 'math.ts', label: 'math.ts', dirty: false, kind: 'file' },
  ]);
  const [active, setActive] = useState('paginate.ts');
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelTab, setPanelTab] = useState('problems');
  const [wrap, setWrap] = useState(false);
  const [findOn, setFindOn] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activity, setActivity] = useState('explorer');
  const paletteTrigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openFile = useCallback((id: string) => {
    if (id !== 'paginate.ts' && id !== 'math.ts') return;
    setFiles((f) => (f.some((x) => x.id === id) ? f : [...f, { id, label: id, dirty: false, kind: 'file' }]));
    setActive(id);
    setDrawerOpen(false);
  }, []);

  const closeFile = (id: string) => {
    setFiles((f) => {
      const next = f.filter((x) => x.id !== id);
      if (active === id) setActive(next[next.length - 1]?.id ?? '');
      return next;
    });
  };

  const run = (c: Command) => {
    if (c.id === 'theme') theme?.cycleLevel();
    else if (c.id === 'panel') setPanelOpen((o) => !o);
    else if (c.id === 'find') setFindOn((o) => !o);
    else if (c.id === 'terminal') {
      setPanelOpen(true);
      setPanelTab('terminal');
    } else if (c.id === 'diff') {
      setFiles((f) => (f.some((x) => x.id === 'diff') ? f : [...f, { id: 'diff', label: 'paginate.ts (diff)', dirty: false, kind: 'diff' }]));
      setActive('diff');
    }
  };

  const errors = DIAGNOSTICS.filter((d) => d.severity === 'error').length;
  const warnings = DIAGNOSTICS.filter((d) => d.severity === 'warning').length;

  const sidebar = <Explorer active={active} onOpen={openFile} />;

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface-base font-mono text-sm text-content-primary print:block print:h-auto">
      {/* title bar */}
      <header className="flex shrink-0 items-center gap-3 border-b-2 border-edge-strong bg-surface-raised px-3 py-2 print:hidden">
        <button
          type="button"
          aria-label="Open file explorer"
          onClick={() => setDrawerOpen(true)}
          className="flex h-8 w-8 items-center justify-center border-2 border-edge-strong md:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
        >
          <NerdIcon name="folder" size="sm" />
        </button>
        <span className="font-display text-base font-bold uppercase tracking-wider text-accent-primary">[ rtk.edit ]</span>
        <span className="hidden truncate text-content-muted sm:inline">pagination-kit</span>
        <button
          ref={paletteTrigger}
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="mx-auto flex min-w-0 max-w-md flex-1 items-center gap-2 border-2 border-edge-default bg-surface-sunken px-3 py-1 text-left text-content-muted hover:border-edge-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
        >
          <NerdIcon name="search" size="xs" />
          <span className="min-w-0 flex-1 truncate">Search commands</span>
          <kbd className="hidden border border-current px-1 text-xs sm:inline">Ctrl K</kbd>
        </button>
        <button
          type="button"
          onClick={() => setWrap((w) => !w)}
          aria-pressed={wrap}
          className="hidden border-2 border-edge-strong px-2 py-1 text-xs font-bold uppercase tracking-widest aria-pressed:bg-accent-primary aria-pressed:text-content-inverse sm:block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
        >
          [ wrap ]
        </button>
        <button
          type="button"
          onClick={() => theme?.cycleLevel()}
          className="border-2 border-edge-strong px-2 py-1 text-xs font-bold uppercase tracking-widest shadow-[3px_3px_0_0_var(--ds-shadow-color)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
        >
          [ {theme?.level ?? 'theme'} ]
        </button>
      </header>

      <div className="flex min-h-0 flex-1 print:block">
        {/* activity bar */}
        <nav aria-label="Activity bar" className="hidden shrink-0 flex-col justify-between border-r-2 border-edge-strong bg-surface-raised md:flex print:hidden">
          <div className="flex flex-col">
            {ACTIVITY.map((a) => (
              <IconButton key={a.id} label={a.label} icon={a.icon} pressed={activity === a.id} onClick={() => setActivity(a.id)} />
            ))}
          </div>
          <IconButton label="Settings" icon="settings" />
        </nav>

        {/* sidebar */}
        <aside aria-label="Side bar" className="hidden w-60 shrink-0 flex-col border-r-2 border-edge-default bg-surface-base md:flex print:hidden">
          {sidebar}
        </aside>
        <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="Explorer" placement="left">
          {sidebar}
        </Drawer>

        {/* editor column */}
        <main className="flex min-w-0 flex-1 flex-col print:block" aria-label="Editor">
          <Tabs
            value={active || undefined}
            onValueChange={setActive}
            variant="underline"
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex shrink-0 items-stretch print:hidden">
              <TabsList label="Open editors" className="min-w-0 flex-1">
                {files.map((f) => (
                  <span key={f.id} className="inline-flex items-center">
                    <TabsTab value={f.id} aria-label={f.dirty ? `${f.label}, unsaved changes` : f.label}>
                      <span className="inline-flex items-center gap-2 normal-case tracking-normal">
                        {f.dirty ? <span aria-hidden="true" className="text-intent-warning">●</span> : null}
                        {f.label}
                      </span>
                    </TabsTab>
                    <button
                      type="button"
                      aria-label={`Close ${f.label}`}
                      onClick={() => closeFile(f.id)}
                      className="-ml-3 mr-1 flex h-6 w-6 items-center justify-center text-content-muted hover:bg-surface-raised hover:text-content-primary focus-visible:outline-2 focus-visible:outline-accent-primary"
                    >
                      <NerdIcon name="close" size="xs" />
                    </button>
                  </span>
                ))}
              </TabsList>
            </div>

            {files.map((f) => (
              <TabsPanel key={f.id} value={f.id} className="flex min-h-0 flex-1 flex-col">
                <div className="shrink-0 border-b-2 border-edge-subtle bg-surface-base px-3 py-1 text-xs print:hidden">
                  <Breadcrumbs
                    items={[{ label: 'pagination-kit' }, { label: 'src' }, { label: f.kind === 'diff' ? 'paginate.ts (HEAD ↔ working)' : f.label }]}
                  />
                </div>
                <div className="relative flex min-h-0 flex-1 flex-col">
                  {f.kind === 'diff' ? (
                    <DiffPane />
                  ) : (
                    <EditorPane file={f.id as 'paginate.ts' | 'math.ts'} wrap={wrap} findOn={findOn && f.id === 'paginate.ts'} />
                  )}
                  {findOn && f.kind === 'file' && f.id === 'paginate.ts' ? (
                    <div role="search" aria-label="Find in file" className="absolute right-4 top-0 max-md:hidden lg:right-24 flex items-center gap-2 border-2 border-edge-strong bg-surface-raised px-2 py-1 shadow-[4px_4px_0_0_var(--ds-shadow-color)] print:hidden">
                      <span className="text-content-muted">find</span>
                      <span className="border-b-2 border-edge-default px-1">items</span>
                      <span className="text-xs text-content-secondary">4 of 9</span>
                      <button type="button" aria-label="Close find" onClick={() => setFindOn(false)} className="flex h-5 w-5 items-center justify-center text-content-muted hover:text-content-primary focus-visible:outline-2 focus-visible:outline-accent-primary">
                        <NerdIcon name="close" size="xs" />
                      </button>
                    </div>
                  ) : null}
                </div>
              </TabsPanel>
            ))}
            {files.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-content-muted">[ no editors open — Ctrl K ]</div>
            ) : null}
          </Tabs>

          {/* bottom panel */}
          {panelOpen ? (
            <section aria-label="Panel" className="flex h-44 shrink-0 flex-col md:h-64 border-t-2 border-edge-strong bg-surface-base print:hidden">
              <Tabs value={panelTab} onValueChange={setPanelTab} variant="underline" className="flex min-h-0 flex-1 flex-col">
                <div className="flex items-stretch">
                  <TabsList label="Panel views" className="min-w-0 flex-1">
                    <TabsTab value="problems">
                      Problems <Badge accent="tertiary">{DIAGNOSTICS.length}</Badge>
                    </TabsTab>
                    <TabsTab value="terminal">Terminal</TabsTab>
                  </TabsList>
                  <button
                    type="button"
                    aria-label="Close panel"
                    onClick={() => setPanelOpen(false)}
                    className="px-3 text-content-muted hover:text-content-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-primary"
                  >
                    <NerdIcon name="close" size="xs" />
                  </button>
                </div>
                <TabsPanel value="problems" className="min-h-0 flex-1 overflow-auto">
                  <ul className="m-0 list-none p-0">
                    {DIAGNOSTICS.map((d) => (
                      <li key={`${d.code}-${d.line}`}>
                        <button
                          type="button"
                          onClick={() => openFile(d.file)}
                          className="flex w-full items-baseline gap-3 px-3 py-1 text-left hover:bg-surface-raised focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-primary"
                        >
                          <NerdIcon name={SEVERITY_ICON[d.severity].icon} size="xs" className={SEVERITY_ICON[d.severity].cls} label={d.severity} />
                          <span className="min-w-0 flex-1">{d.message}</span>
                          <span className="shrink-0 text-content-muted">
                            {d.code} [{d.line}:{d.col}]
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </TabsPanel>
                <TabsPanel value="terminal" className="min-h-0 flex-1 overflow-auto px-2 py-2 text-xs">
                  <Terminal label="pagination-kit" prompt="$">{TERMINAL_SESSION}</Terminal>
                  <AnsiStrip polarity={theme?.polarity ?? 'dark'} />
                </TabsPanel>
              </Tabs>
            </section>
          ) : null}
        </main>
      </div>

      {/* status bar */}
      <footer className="flex shrink-0 items-center gap-4 overflow-x-auto whitespace-nowrap bg-accent-primary px-3 py-1 text-xs font-bold text-content-inverse print:hidden">
        <span className="inline-flex items-center gap-1"><NerdIcon name="git-branch" size="xs" /> 214-fix-pagination-reset</span>
        <button type="button" onClick={() => { setPanelOpen(true); setPanelTab('problems'); }} className="inline-flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current">
          <NerdIcon name="close" size="xs" /> {errors} <NerdIcon name="alert" size="xs" /> {warnings}
        </button>
        <span className="ml-auto">Ln 13, Col 30</span>
        <span className="hidden sm:inline">Spaces: 2</span>
        <span className="hidden sm:inline">UTF-8</span>
        <span className="hidden sm:inline">LF</span>
        <span>TypeScript</span>
      </footer>

      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} onRun={run} />
    </div>
  );
}

