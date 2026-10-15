import type { CSSProperties } from 'react';
import { Article, LV, LevelPair, Measures, OptionHead, Panel, SceneLabel, ratio } from './Frame';
import type { Level, Row } from './Frame';

const SHADE = '░'.repeat(160);

/** One skeleton bar, filled the way the option says. `w` is a width class. */
function Bar({ opt, w, h = 'h-4' }: { opt: string; w: string; h?: string }) {
  const base = `block ${h} ${w} shrink-0`;
  if (opt === 'D7-C') {
    return (
      <span aria-hidden="true" className={`${base} overflow-hidden whitespace-nowrap font-mono text-sm leading-4 text-content-muted`}>
        {SHADE}
      </span>
    );
  }
  const style: CSSProperties =
    opt === 'D7-A'
      ? { background: 'var(--ds-surface-raised)', border: '2px solid var(--ds-border-default)' }
      : opt === 'D7-B'
        ? {
            backgroundColor: 'var(--ds-surface-sunken)',
            backgroundImage: 'repeating-linear-gradient(135deg, var(--ds-text-muted) 0 2px, var(--ds-surface-sunken) 2px 6px)',
          }
        : { background: 'var(--ds-surface-sunken)' };
  return <span aria-hidden="true" style={style} className={base} />;
}

function Inbox({ opt }: { opt: string }) {
  return (
    <div>
      <SceneLabel>Inbox loading list</SceneLabel>
      <ul className="m-0 list-none border-2 border-edge-strong bg-surface-base p-0" aria-label="Loading">
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className="flex items-center gap-2 border-b border-edge-subtle px-2 py-2 last:border-b-0">
            <Bar opt={opt} w="w-14" />
            <Bar opt={opt} w={i % 2 ? 'w-full max-w-[55%]' : 'w-full max-w-[75%]'} />
            <span className="flex-1" />
            <Bar opt={opt} w="w-8" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function CardScene({ opt }: { opt: string }) {
  return (
    <div>
      <SceneLabel>Card</SceneLabel>
      <div className="flex max-w-xs flex-col gap-2 border-2 border-edge-strong bg-surface-raised p-3">
        <Bar opt={opt} w="w-2/3" h="h-5" />
        <Bar opt={opt} w="w-full" />
        <Bar opt={opt} w="w-full" />
        <Bar opt={opt} w="w-4/5" />
        <div className="mt-1 flex gap-2">
          <Bar opt={opt} w="w-16" h="h-8" />
          <Bar opt={opt} w="w-16" h="h-8" />
        </div>
      </div>
    </div>
  );
}

function TableScene({ opt }: { opt: string }) {
  return (
    <div>
      <SceneLabel>Table</SceneLabel>
      <div className="overflow-x-auto border-2 border-edge-strong bg-surface-base">
        <table className="w-full border-collapse" aria-label="Loading">
          <thead>
            <tr className="border-b-2 border-edge-strong">
              {[0, 1, 2].map((c) => (
                <th key={c} scope="col" className="px-3 py-2 text-left"><Bar opt={opt} w="w-12" /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2].map((r) => (
              <tr key={r} className="border-b border-edge-subtle last:border-b-0">
                <td className="px-3 py-2"><Bar opt={opt} w="w-20" /></td>
                <td className="px-3 py-2"><Bar opt={opt} w="w-14" /></td>
                <td className="px-3 py-2"><Bar opt={opt} w="w-10" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const f2 = (n: number) => n.toFixed(2);

function rowsFor(opt: string, level: Level): Row[] {
  const d = LV[level];
  const s = d.surface;
  const r = ratio;
  if (opt === 'CUR') {
    return [
      { label: 'sunken fill vs base', value: `${f2(r(s.sunken, s.base))}:1`, bad: r(s.sunken, s.base) < 3 },
      { label: 'sunken fill vs raised (card)', value: `${f2(r(s.sunken, s.raised))}:1`, bad: r(s.sunken, s.raised) < 3 },
    ];
  }
  if (opt === 'D7-A') {
    return [
      { label: 'raised fill vs base', value: `${f2(r(s.raised, s.base))}:1` },
      { label: 'edge-default border vs base', value: `${f2(r(d.border.default, s.base))}:1`, bad: r(d.border.default, s.base) < 3 },
      { label: 'edge-default vs raised', value: `${f2(r(d.border.default, s.raised))}:1`, bad: r(d.border.default, s.raised) < 3 },
    ];
  }
  if (opt === 'D7-B') {
    return [
      { label: 'hatch stroke (text-muted) vs sunken', value: `${f2(r(d.text.muted, s.sunken))}:1`, bad: r(d.text.muted, s.sunken) < 3 },
      { label: 'hatch stroke vs base', value: `${f2(r(d.text.muted, s.base))}:1`, bad: r(d.text.muted, s.base) < 3 },
      { label: 'sunken gap vs base', value: `${f2(r(s.sunken, s.base))}:1` },
      { label: 'stroke coverage', value: '2px of every 6px (33%)' },
    ];
  }
  return [
    { label: 'glyph (text-muted) vs base', value: `${f2(r(d.text.muted, s.base))}:1`, bad: r(d.text.muted, s.base) < 3 },
    { label: 'glyph vs raised (card)', value: `${f2(r(d.text.muted, s.raised))}:1`, bad: r(d.text.muted, s.raised) < 3 },
    { label: 'ink coverage of the shade glyph', value: 'about 25%' },
  ];
}

export function D7Option({ opt, id, name, rationale, evidence }: { opt: string; id: string; name: string; rationale: string; evidence: string }) {
  return (
    <Article id={id}>
      <OptionHead id={id} name={name} rationale={rationale} evidence={evidence} />
      <LevelPair>
        {(level) => (
          <Panel level={level}>
            <div className="grid grid-cols-1 gap-4">
              <Inbox opt={opt} />
              <CardScene opt={opt} />
              <TableScene opt={opt} />
              <Measures rows={rowsFor(opt, level)} />
            </div>
          </Panel>
        )}
      </LevelPair>
    </Article>
  );
}
