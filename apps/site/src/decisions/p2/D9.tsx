import { Article, LevelPair, Measures, OptionHead, Panel, SceneLabel, vars } from './Frame';
import type { Level, Row } from './Frame';
import { LV } from './Frame';
import { SET, stats } from './series';
import type { Member, Shape } from './series';
import { VISIONS } from './colour';
import type { Vision } from './colour';

/** A shape path in a 0..10 box. */
function ShapePath({ shape }: { shape: Shape }) {
  switch (shape) {
    case 'circle':
      return <circle cx="5" cy="5" r="4.5" />;
    case 'square':
      return <rect x="0.5" y="0.5" width="9" height="9" />;
    case 'triangle':
      return <polygon points="5,0.5 9.5,9.5 0.5,9.5" />;
    case 'diamond':
      return <polygon points="5,0 10,5 5,10 0,5" />;
    case 'cross':
      return <path d="M3.5 0.5h3v3h3v3h-3v3h-3v-3h-3v-3h3z" />;
    case 'ring':
      return <circle cx="5" cy="5" r="3.5" fill="none" strokeWidth="2.4" style={{ stroke: 'inherit' }} />;
    case 'bar':
      return <rect x="0.5" y="3" width="9" height="4" />;
    default:
      return <polygon points="5,0 6.4,3.6 10,3.8 7.2,6.1 8.1,9.8 5,7.7 1.9,9.8 2.8,6.1 0,3.8 3.6,3.6" />;
  }
}

function Mark({ index, shape }: { index: number; shape?: Shape }) {
  const colour = `var(--p2-s${index})`;
  if (!shape) return <span aria-hidden="true" className="inline-block h-3 w-3 shrink-0" style={{ background: colour }} />;
  return (
    <svg aria-hidden="true" viewBox="0 0 10 10" className="h-3 w-3 shrink-0" style={{ fill: colour, stroke: colour }}>
      <ShapePath shape={shape} />
    </svg>
  );
}

function Legend({ members }: { members: Member[] }) {
  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-x-3 gap-y-1 p-0 font-mono text-[11px] text-content-primary">
      {members.map((m, i) => (
        <li key={m.name} className="flex items-center gap-1.5">
          <Mark index={i} shape={m.shape} />
          {m.letter && <span className="font-bold">{m.letter}</span>}
          <span className="truncate">{m.name}</span>
        </li>
      ))}
    </ul>
  );
}

const DATA = [
  [62, 40, 78, 30, 55, 90],
  [48, 70, 35, 82, 44, 60],
];

/** 6 series, 2 groups. The first six members of the set. */
function Chart({ members }: { members: Member[] }) {
  const six = members.slice(0, 6);
  const bw = 20;
  return (
    <svg viewBox="0 0 280 130" role="img" aria-label="Bar chart, six series in two groups" className="block w-full max-w-sm border-2 border-edge-default bg-surface-raised">
      {DATA.map((group, g) =>
        group.map((v, i) => {
          const m = six[i]!;
          const x = 14 + g * 136 + i * (bw + 2);
          const h = (v / 100) * 84;
          return (
            <g key={`${g}-${i}`}>
              <rect x={x} y={104 - h} width={bw} height={h} style={{ fill: `var(--p2-s${i})` }} />
              {m.letter && (
                <text x={x + bw / 2} y={100 - h} textAnchor="middle" fontSize="8" fontWeight="700" className="font-mono" style={{ fill: 'var(--ds-text-primary)' }}>
                  {m.letter}
                </text>
              )}
              {m.shape && (
                <g transform={`translate(${x + bw / 2 - 3}, ${106 - h + 3}) scale(0.6)`} style={{ fill: 'var(--ds-surface-raised)', stroke: 'var(--ds-surface-raised)' }}>
                  <ShapePath shape={m.shape} />
                </g>
              )}
            </g>
          );
        }),
      )}
      <line x1="8" x2="272" y1="104.5" y2="104.5" strokeWidth="1" style={{ stroke: 'var(--ds-border-default)' }} />
      <text x="70" y="120" textAnchor="middle" fontSize="8" className="font-mono" style={{ fill: 'var(--ds-text-secondary)' }}>Q1</text>
      <text x="206" y="120" textAnchor="middle" fontSize="8" className="font-mono" style={{ fill: 'var(--ds-text-secondary)' }}>Q2</text>
    </svg>
  );
}

const f3 = (n: number) => n.toFixed(3);
const GATE = 0.04;

function rowsFor(opt: string, level: Level): Row[] {
  const s = stats(opt, level);
  const rows: Row[] = [
    { label: 'members / colours that differ (dE >= 0.04)', value: `${SET[opt]!.length} / ${s.distinct}`, bad: s.distinct < SET[opt]!.length },
  ];
  for (const v of s.vision) {
    rows.push({ label: `min dE, ${v.vision} (${v.pair})`, value: f3(v.min), bad: v.min < GATE });
  }
  return rows;
}

const VISION_LABEL: Record<Vision, string> = { normal: 'normal vision', deuteranopia: 'deuteranopia', protanopia: 'protanopia' };

export function D9Option({ opt, id, name, rationale, evidence }: { opt: string; id: string; name: string; rationale: string; evidence: string }) {
  const members = SET[opt]!;
  return (
    <Article id={id}>
      <OptionHead id={id} name={name} rationale={rationale} evidence={evidence} />
      <LevelPair>
        {(level) => {
          const d = LV[level];
          const style = vars(Object.fromEntries(members.map((m, i) => [`--p2-s${i}`, m.colour(d)])));
          return (
            <Panel level={level} style={style}>
              <div className="grid grid-cols-1 gap-3">
                {VISIONS.map((v) => (
                  <div key={v} style={v === 'normal' ? undefined : { filter: `url(#p2-cvd-${v})` }}>
                    <SceneLabel>{`Calendar legend and 6 series: ${VISION_LABEL[v]}`}</SceneLabel>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                      <Legend members={members} />
                      <Chart members={members} />
                    </div>
                  </div>
                ))}
                <Measures rows={rowsFor(opt, level)} />
                <p className="m-0 font-mono text-[10px] text-content-muted">
                  Members: {members.map((m) => `${m.name} = ${m.source}`).join('; ')}.
                </p>
              </div>
            </Panel>
          );
        }}
      </LevelPair>
    </Article>
  );
}
