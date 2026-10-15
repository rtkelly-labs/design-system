import type { CSSProperties } from 'react';
import { ROWS, KEYS } from '../data';
import { mixOklab } from './colour';
import { Article, LV, LevelPair, Measures, OptionHead, Panel, SceneLabel, ratio, vars } from './Frame';
import type { Level, Row } from './Frame';

type State = 'rest' | 'hover' | 'selected' | 'cursor' | 'selcur';
const STATE_LABEL: Record<State, string> = {
  rest: 'rest',
  hover: 'hover',
  selected: 'selected',
  cursor: 'cursor',
  selcur: 'selected + cursor',
};

interface Fx {
  background?: string;
  color?: string;
  shadow?: string;
  outline?: string;
  glyph?: boolean;
}

const EDGE = (px: number, colour: string) => `inset ${px}px 0 0 0 ${colour}`;
const CURSOR_RING = 'var(--ds-accent-secondary)';

/** What each option does to a row in each state. Roles and one computed tint only. */
function fx(opt: string, s: State): Fx {
  const selected = s === 'selected' || s === 'selcur';
  const cursor = s === 'cursor' || s === 'selcur';
  switch (opt) {
    case 'CUR':
      return {
        background: selected || s === 'hover' ? 'var(--ds-surface-raised)' : undefined,
        outline: cursor ? CURSOR_RING : undefined,
      };
    case 'D6-A':
      return {
        background: s === 'hover' ? 'var(--ds-surface-raised)' : undefined,
        shadow: selected ? EDGE(4, 'var(--ds-accent-primary)') : undefined,
        outline: cursor ? CURSOR_RING : undefined,
      };
    case 'D6-B':
      return {
        background: selected ? 'var(--p2-tint)' : undefined,
        shadow: s === 'hover' ? 'inset 0 0 0 2px var(--ds-border-default)' : undefined,
        glyph: cursor,
      };
    default:
      return {
        background: selected ? 'var(--ds-accent-primary)' : s === 'hover' ? 'var(--ds-surface-raised)' : undefined,
        color: selected ? 'var(--ds-text-inverse)' : undefined,
        shadow: cursor ? EDGE(4, 'var(--ds-border-strong)') : undefined,
      };
  }
}

function fxStyle(f: Fx): CSSProperties {
  return {
    background: f.background,
    color: f.color,
    boxShadow: f.shadow,
    outline: f.outline ? `2px solid ${f.outline}` : undefined,
    outlineOffset: f.outline ? '-2px' : undefined,
  };
}

/** Smallest mix of accent.primary into base that is at least 3:1 against both base and raised. */
function tintFor(level: Level) {
  const d = LV[level];
  for (let pct = 1; pct <= 100; pct++) {
    const tint = mixOklab(d.accent.primary, d.surface.base, pct);
    if (ratio(tint, d.surface.base) >= 3 && ratio(tint, d.surface.raised) >= 3) return { pct, tint };
  }
  return { pct: 100, tint: d.accent.primary };
}

const f2 = (n: number) => n.toFixed(2);
const THREE = 3;
const AA = 4.5;

function rowsFor(opt: string, level: Level): Row[] {
  const d = LV[level];
  const base = d.surface.base;
  const raised = d.surface.raised;
  const r = (a: string, b: string) => ratio(a, b);
  if (opt === 'CUR') {
    return [
      { label: 'selected fill (raised) vs base', value: `${f2(r(raised, base))}:1`, bad: r(raised, base) < THREE },
      { label: 'hover fill (same raised) vs base', value: `${f2(r(raised, base))}:1` },
      { label: 'hover = selected', value: 'identical fill' , bad: true },
      { label: 'cursor accent-secondary vs base', value: `${f2(r(d.accent.secondary, base))}:1`, bad: r(d.accent.secondary, base) < THREE },
    ];
  }
  if (opt === 'D6-A') {
    return [
      { label: 'selected edge accent-primary vs base', value: `${f2(r(d.accent.primary, base))}:1`, bad: r(d.accent.primary, base) < THREE },
      { label: 'selected edge vs raised', value: `${f2(r(d.accent.primary, raised))}:1`, bad: r(d.accent.primary, raised) < THREE },
      { label: 'text-primary on base (selected)', value: `${f2(r(d.text.primary, base))}:1` },
      { label: 'hover raised vs base (supplemental)', value: `${f2(r(raised, base))}:1` },
      { label: 'cursor accent-secondary vs base', value: `${f2(r(d.accent.secondary, base))}:1`, bad: r(d.accent.secondary, base) < THREE },
    ];
  }
  if (opt === 'D6-B') {
    const { pct, tint } = tintFor(level);
    return [
      { label: `tint: accent-primary ${pct}% into base (OKLab)`, value: 'search result' },
      { label: 'selected tint vs base', value: `${f2(r(tint, base))}:1`, bad: r(tint, base) < THREE },
      { label: 'selected tint vs raised', value: `${f2(r(tint, raised))}:1`, bad: r(tint, raised) < THREE },
      { label: 'text-primary on tint', value: `${f2(r(d.text.primary, tint))}:1`, bad: r(d.text.primary, tint) < AA },
      { label: 'text-secondary on tint', value: `${f2(r(d.text.secondary, tint))}:1`, bad: r(d.text.secondary, tint) < AA },
      { label: 'hover edge-default vs base', value: `${f2(r(d.border.default, base))}:1`, bad: r(d.border.default, base) < THREE },
      { label: 'cursor glyph accent-secondary vs tint', value: `${f2(r(d.accent.secondary, tint))}:1`, bad: r(d.accent.secondary, tint) < THREE },
    ];
  }
  return [
    { label: 'selected fill accent-primary vs base', value: `${f2(r(d.accent.primary, base))}:1`, bad: r(d.accent.primary, base) < THREE },
    { label: 'selected fill vs raised', value: `${f2(r(d.accent.primary, raised))}:1`, bad: r(d.accent.primary, raised) < THREE },
    { label: 'text-inverse on fill', value: `${f2(r(d.text.inverse, d.accent.primary))}:1`, bad: r(d.text.inverse, d.accent.primary) < AA },
    { label: 'hover raised vs base (supplemental)', value: `${f2(r(raised, base))}:1` },
    { label: 'cursor edge-strong vs base', value: `${f2(r(d.border.strong, base))}:1` },
    { label: 'cursor edge vs selected fill', value: `${f2(r(d.border.strong, d.accent.primary))}:1`, bad: r(d.border.strong, d.accent.primary) < THREE },
  ];
}

function InboxRow({ opt, s }: { opt: string; s: State }) {
  const f = fx(opt, s);
  const row = ROWS[s === 'rest' ? 0 : s === 'hover' ? 1 : 2]!;
  return (
    <li
      data-state={s}
      style={fxStyle(f)}
      className="grid grid-cols-[1rem_auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-edge-subtle px-2 py-1.5 font-mono text-xs"
    >
      <span aria-hidden="true" className="font-bold">{f.glyph ? '>' : ''}</span>
      <span className="font-bold">{row.id}</span>
      <span className="truncate">{row.title}</span>
      <span className="text-[10px] uppercase opacity-80">{STATE_LABEL[s]}</span>
    </li>
  );
}

function Inbox({ opt }: { opt: string }) {
  const states: State[] = ['rest', 'hover', 'selected', 'cursor', 'selcur'];
  return (
    <div>
      <SceneLabel>Inbox list: five states</SceneLabel>
      <ul className="m-0 list-none border-2 border-edge-strong bg-surface-base p-0">
        {states.map((s) => (
          <InboxRow key={s} opt={opt} s={s} />
        ))}
      </ul>
    </div>
  );
}

const TABLE_ROWS: { k: { name: string; scope: string; used: string }; s: State }[] = [
  { k: KEYS[0], s: 'selected' },
  { k: KEYS[1], s: 'rest' },
  { k: KEYS[2], s: 'selcur' },
  { k: { name: 'legacy-token', scope: 'read', used: 'Aug 02' }, s: 'hover' },
];

/** A plain table: DataTable exposes no per-row class or style hook, so its rows cannot be previewed. */
function Table({ opt }: { opt: string }) {
  return (
    <div>
      <SceneLabel>Table: 2 rows selected (one with cursor), 1 hover</SceneLabel>
      <div className="overflow-x-auto border-2 border-edge-strong bg-surface-base">
        <table className="w-full border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b-2 border-edge-strong text-left uppercase text-content-secondary">
              <th scope="col" className="w-8 px-2 py-1.5"><span className="sr-only">Selected</span></th>
              <th scope="col" className="px-2 py-1.5">Key</th>
              <th scope="col" className="px-2 py-1.5">Scope</th>
              <th scope="col" className="px-2 py-1.5">State</th>
            </tr>
          </thead>
          <tbody>
            {TABLE_ROWS.map(({ k, s }) => {
              const f = fx(opt, s);
              const on = s === 'selected' || s === 'selcur';
              return (
                <tr key={k.name} data-state={s} style={fxStyle(f)} className="border-b border-edge-subtle last:border-b-0">
                  <td className="px-2 py-1.5" aria-hidden="true">{f.glyph ? '>' : on ? '[x]' : '[ ]'}</td>
                  <th scope="row" className="px-2 py-1.5 text-left font-bold">{k.name}</th>
                  <td className="px-2 py-1.5">{k.scope}</td>
                  <td className="px-2 py-1.5 text-[10px] uppercase">{STATE_LABEL[s]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kanban({ opt }: { opt: string }) {
  const cards: { t: string; s: State; lifted?: boolean }[] = [
    { t: 'Audit focus rings', s: 'rest' },
    { t: 'Wire up retry logic', s: 'selected', lifted: true },
    { t: 'Tab typeahead', s: 'hover' },
  ];
  return (
    <div>
      <SceneLabel>Kanban column: lifted card</SceneLabel>
      <div className="flex max-w-xs flex-col gap-2 border-2 border-edge-strong bg-surface-base p-2">
        <p className="m-0 font-mono text-[11px] font-bold uppercase text-content-muted">[ Doing · 3 ]</p>
        {cards.map((c) => {
          const f = fx(opt, c.s);
          return (
            <div
              key={c.t}
              data-state={c.s}
              style={{ ...fxStyle(f), transform: c.lifted ? 'translate(-2px, -3px) rotate(-1deg)' : undefined }}
              className={`border-2 border-edge-default px-2 py-1.5 font-mono text-xs ${c.lifted ? 'shadow-hard-md' : ''}`}
            >
              <span className="font-bold">{c.t}</span>
              <span className="block text-[10px] uppercase opacity-80">{c.lifted ? 'lifted (selected)' : STATE_LABEL[c.s]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function D6Option({ opt, id, name, rationale, evidence }: { opt: string; id: string; name: string; rationale: string; evidence: string }) {
  return (
    <Article id={id}>
      <OptionHead id={id} name={name} rationale={rationale} evidence={evidence} />
      <LevelPair>
        {(level) => (
          <Panel level={level} style={opt === 'D6-B' ? vars({ '--p2-tint': tintFor(level).tint }) : undefined}>
            <div className="grid grid-cols-1 gap-4">
              <Inbox opt={opt} />
              <Table opt={opt} />
              <Kanban opt={opt} />
              <Measures rows={rowsFor(opt, level)} />
            </div>
          </Panel>
        )}
      </LevelPair>
    </Article>
  );
}
