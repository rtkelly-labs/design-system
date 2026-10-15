import type { CSSProperties } from 'react';
import type { LevelDefinition } from '@rtkelly13/design-system';
import { deltaE, flatten, mixOklab, withAlpha } from './colour';
import { Article, LV, LevelPair, OptionHead, Panel, SceneLabel, ratio, vars } from './Frame';
import type { Level } from './Frame';

interface RoleDef {
  key: string;
  label: string;
  cssVar: string;
  colour: (d: LevelDefinition) => string;
}

export const ROLES: RoleDef[] = [
  { key: 'primary', label: 'accent.primary', cssVar: '--ds-accent-primary', colour: (d) => d.accent.primary },
  { key: 'secondary', label: 'accent.secondary', cssVar: '--ds-accent-secondary', colour: (d) => d.accent.secondary },
  { key: 'tertiary', label: 'accent.tertiary', cssVar: '--ds-accent-tertiary', colour: (d) => d.accent.tertiary },
  { key: 'quiet', label: 'accent.quiet', cssVar: '--ds-accent-quiet', colour: (d) => d.accent.quiet },
  { key: 'success', label: 'intent.success', cssVar: '--ds-intent-success', colour: (d) => d.intent.success },
  { key: 'warning', label: 'intent.warning', cssVar: '--ds-intent-warning', colour: (d) => d.intent.warning },
  { key: 'danger', label: 'intent.danger', cssVar: '--ds-intent-danger', colour: (d) => d.intent.danger },
];

const MIX: Record<string, number | undefined> = { 'D8-A': 12, 'D8-B': 20 };
const ALPHA = 0.15;

/** The opaque (or, for the control, flattened-alpha) tint the option uses for one role on one level. */
function tintOf(opt: string, level: Level, r: RoleDef): string {
  const d = LV[level];
  const role = r.colour(d);
  const pct = MIX[opt];
  if (pct !== undefined) return mixOklab(role, d.surface.base, pct);
  if (opt === 'D8-C') return d.surface.raised;
  return flatten(withAlpha(role, ALPHA), d.surface.base);
}

function bgFor(opt: string, r: RoleDef): string {
  if (opt === 'D8-C') return 'var(--ds-surface-raised)';
  if (MIX[opt] !== undefined) return `var(--p2-tint-${r.key})`;
  return `color-mix(in oklab, var(${r.cssVar}) ${ALPHA * 100}%, transparent)`;
}

const byKey = (k: string) => ROLES.find((r) => r.key === k)!;

function Event({ opt, tone, title, time, note, style }: { opt: string; tone: string; title: string; time: string; note: string; style: CSSProperties }) {
  const r = byKey(tone);
  return (
    <div
      style={{
        ...style,
        background: bgFor(opt, r),
        borderLeft: `4px solid var(${r.cssVar})`,
        borderTop: '1px solid var(--ds-border-subtle)',
        borderRight: '1px solid var(--ds-border-subtle)',
        borderBottom: '1px solid var(--ds-border-subtle)',
      }}
      className="absolute overflow-hidden px-1.5 py-1 font-mono text-[11px] leading-4"
    >
      <p className="m-0 truncate font-bold text-content-primary">{title}</p>
      <p className="m-0" style={{ color: `var(${r.cssVar})` }}>{time}</p>
      <p className="m-0 truncate text-content-primary">{note}</p>
    </div>
  );
}

function Week({ opt }: { opt: string }) {
  const bar = (role: string, label: string, col: string, row: number) => {
    const r = byKey(role);
    return (
      <div
        key={label}
        style={{ gridColumn: col, gridRow: row, background: bgFor(opt, r), borderLeft: `4px solid var(${r.cssVar})` }}
        className="truncate border-y border-r border-edge-subtle px-1.5 py-0.5 font-mono text-[11px] font-bold text-content-primary"
      >
        {label}
      </div>
    );
  };
  const chip = byKey('danger');
  return (
    <div className="grid grid-cols-1 gap-3">
      <div>
        <SceneLabel>All-day bars</SceneLabel>
        <div className="grid grid-cols-7 gap-y-1 border-2 border-edge-strong bg-surface-base p-1">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <span key={i} className="text-center font-mono text-[10px] text-content-muted">{d}</span>
          ))}
          {bar('success', 'Offsite', '1 / 5', 2)}
          {bar('quiet', 'Holiday', '5 / 8', 2)}
          {bar('warning', 'Release freeze', '2 / 6', 3)}
        </div>
      </div>
      <div>
        <SceneLabel>Week view: 3 overlapping events</SceneLabel>
        <div className="relative h-52 overflow-hidden border-2 border-edge-strong bg-surface-base">
          <Event opt={opt} tone="primary" title="Design review" time="09:00-10:30" note="Room 4, notes in the doc" style={{ top: 8, height: 104, left: 0, width: '62%' }} />
          <Event opt={opt} tone="tertiary" title="Standup and triage" time="09:30-11:00" note="Ten tickets to sort" style={{ top: 44, height: 100, left: '19%', width: '62%' }} />
          <Event opt={opt} tone="secondary" title="Release prep" time="10:30-12:00" note="Tag, changelog, deploy" style={{ top: 82, height: 100, left: '38%', width: '60%' }} />
        </div>
      </div>
      <div>
        <SceneLabel>Selected chip</SceneLabel>
        <span
          style={{ background: bgFor(opt, chip), borderLeft: `4px solid var(${chip.cssVar})`, outline: '2px solid var(--ds-border-strong)', outlineOffset: 2 }}
          className="inline-flex items-center gap-2 px-2 py-1 font-mono text-xs font-bold text-content-primary"
        >
          Delete backups
          <span className="text-[10px] font-normal uppercase" style={{ color: `var(${chip.cssVar})` }}>selected</span>
        </span>
      </div>
    </div>
  );
}

function Table({ opt, level }: { opt: string; level: Level }) {
  const d = LV[level];
  const body = ROLES.map((r) => {
    const tint = tintOf(opt, level, r);
    const role = r.colour(d);
    const on = ratio(role, tint);
    const ink = ratio(d.text.primary, tint);
    return { r, on, ink, de: deltaE(tint, d.surface.base) };
  });
  return (
    <div>
      <SceneLabel>Role text and ink on the fill</SceneLabel>
      <div className="overflow-x-auto border-2 border-edge-default bg-surface-raised">
        <table className="w-full border-collapse font-mono text-[11px]">
          <thead>
            <tr className="border-b-2 border-edge-default text-left uppercase text-content-muted">
              <th scope="col" className="px-2 py-1">Role</th>
              <th scope="col" className="px-2 py-1 text-right">Role on fill</th>
              <th scope="col" className="px-2 py-1 text-right">Ink on fill</th>
              <th scope="col" className="px-2 py-1 text-right">dE vs base</th>
            </tr>
          </thead>
          <tbody>
            {body.map(({ r, on, ink, de }) => (
              <tr key={r.key} className="border-b border-edge-subtle last:border-b-0">
                <th scope="row" className="px-2 py-1 text-left font-normal text-content-secondary">{r.label}</th>
                <td className={`px-2 py-1 text-right ${on < 4.5 ? 'font-bold text-intent-danger' : ''}`}>{on.toFixed(2)}{on < 4.5 ? ' FAIL' : ''}</td>
                <td className={`px-2 py-1 text-right ${ink < 4.5 ? 'font-bold text-intent-danger' : ''}`}>{ink.toFixed(2)}{ink < 4.5 ? ' FAIL' : ''}</td>
                <td className="px-2 py-1 text-right">{de.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="m-0 mt-1 font-mono text-[10px] text-content-muted">FAIL = under 4.5:1. Mixes are in OKLab, the space Tailwind's /15 uses.</p>
    </div>
  );
}

export function D8Option({ opt, id, name, rationale, evidence }: { opt: string; id: string; name: string; rationale: string; evidence: string }) {
  return (
    <Article id={id}>
      <OptionHead id={id} name={name} rationale={rationale} evidence={evidence} />
      <LevelPair>
        {(level) => (
          <Panel
            level={level}
            style={vars(Object.fromEntries(ROLES.map((r) => [`--p2-tint-${r.key}`, tintOf(opt, level, r)])))}
          >
            <div className="grid grid-cols-1 gap-4">
              <Week opt={opt} />
              <Table opt={opt} level={level} />
            </div>
          </Panel>
        )}
      </LevelPair>
    </Article>
  );
}
