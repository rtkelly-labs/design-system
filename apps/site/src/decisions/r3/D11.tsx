import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@rtkelly13/design-system';
import { Article, LV, LevelPair, OptionHead, Panel, SceneLabel, ratio } from '../p2/Frame';
import type { Level, Row } from '../p2/Frame';
import { DataTableScene } from './DataTableScene';
import { Measures } from './Measures';
import { CELL, edgeInk, labelInk, pct, statusInk } from './ink';
import type { Ink } from './ink';
import { ISSUES_R3, LABEL_ROLE, Labels, LabelUnit, PRIORITY_CLASS, STATUS_ROLE, StatusUnit, roleVar } from './labels';
import type { Issue, LabelId, Opt, StatusId, StatusStyle } from './labels';
import { role } from './model';

const INBOX_ROWS = ISSUES_R3.slice(0, 6);
const CARDS = [ISSUES_R3[0]!, ISSUES_R3[1]!];
const PRIORITY_ACCENT = { P0: 'danger', P1: 'warning', P2: 'info', P3: 'quiet' } as const;

const ALL_LABELS = Object.keys(LABEL_ROLE) as LabelId[];

/** The inbox list: rows of priority, title, labels and status, in the sample's quiet compact table. */
function Inbox({ opt, status, rows = INBOX_ROWS }: { opt: Opt; status: StatusStyle | 'none'; rows?: Issue[] }) {
  const lead = opt === 'F';
  return (
    <Table label="Issues" appearance="quiet" density="compact" containerClassName="border-2 border-edge-default">
      <TableHeader>
        <TableRow>
          {lead ? (
            <TableHead className="w-1 p-0">
              <span className="sr-only">Status</span>
            </TableHead>
          ) : null}
          <TableHead className="w-10 px-1">PRI</TableHead>
          <TableHead className="min-w-[14rem]">TITLE</TableHead>
          <TableHead className="w-44 min-w-44">LABELS</TableHead>
          {status !== 'none' ? <TableHead className="w-30">STATUS</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            {lead ? (
              <TableCell className="w-1 p-0" style={{ boxShadow: `inset 4px 0 0 ${roleVar(STATUS_ROLE[r.status])}` }}>
                <span className="sr-only">{r.status.replace('_', ' ')}</span>
              </TableCell>
            ) : null}
            <TableCell className={`px-1 font-bold ${PRIORITY_CLASS[r.pri]}`}>{r.pri}</TableCell>
            <TableCell className="text-content-secondary">{r.title}</TableCell>
            <TableCell>
              <Labels opt={opt} ids={r.labels} ctx="inbox" />
            </TableCell>
            {status !== 'none' ? (
              <TableCell>
                <StatusUnit style={status} status={r.status} />
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Kanban cards: the context where labels felt fine. Card chrome simplified; the label row, priority and due are the sample's. */
function Cards({ opt }: { opt: Opt }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {CARDS.map((c) => (
        <div key={c.id} className="border-2 border-edge-strong bg-surface-raised p-3 shadow-hard-sm">
          <p className="m-0 text-sm font-bold leading-snug text-content-primary">{c.title}</p>
          <div className="mt-2">
            <Labels opt={opt} ids={c.labels} ctx="card" />
          </div>
          <div className="mt-2 flex items-center gap-2 font-mono text-xs">
            <Badge accent={PRIORITY_ACCENT[c.pri]} size="sm">{c.pri}</Badge>
            <span className="text-content-secondary">DUE 12 OCT</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const labelRows = (rows: Issue[]) => rows.map((r) => r.labels);
const ratioTo = (v: number, base: number) => (base === 0 ? '-' : `${(v / base).toFixed(2)}x`);

function inkRow(label: string, v: Ink, c: Ink, bad = false): Row {
  return {
    label,
    value: `${pct(v.coverage)} covered, ${pct(v.weighted)} weighted (${ratioTo(v.weighted, c.weighted)} current)`,
    bad,
  };
}

/** Ink density for an option in all three contexts, against the control. */
function inkRows(opt: Opt, level: Level): Row[] {
  const inbox = labelInk(level, opt, labelRows(INBOX_ROWS), 'inbox');
  const table = labelInk(level, opt, labelRows(ISSUES_R3), 'table');
  const card = labelInk(level, opt, labelRows(CARDS), 'card');
  const cInbox = labelInk(level, 'CUR', labelRows(INBOX_ROWS), 'inbox');
  const cTable = labelInk(level, 'CUR', labelRows(ISSUES_R3), 'table');
  const cCard = labelInk(level, 'CUR', labelRows(CARDS), 'card');
  return [
    inkRow('ink, inbox label column (6 rows)', inbox, cInbox),
    inkRow('ink, DataTable label column (8 rows)', table, cTable),
    inkRow('ink, kanban card label row (2 cards)', card, cCard),
  ];
}

const f2 = (n: number) => n.toFixed(2);

function minOver<T>(items: T[], f: (x: T) => number): { v: number; at: T } {
  if (items.length === 0) throw new Error("minOver needs items");
  let best: { v: number; at: T } = { v: Infinity, at: items[0] as T };
  for (const it of items) {
    const v = f(it);
    if (v < best.v) best = { v, at: it };
  }
  return best;
}

/** Contrast rows that only apply to one option. */
function optionRows(opt: Opt, level: Level): Row[] {
  const d = LV[level];
  const bg = d.surface.base;
  switch (opt) {
    case 'CUR': {
      const tag = minOver(ALL_LABELS, (l) => ratio(role(d, LABEL_ROLE[l]), bg));
      return [
        { label: 'Tag: solid fills in 16 inbox/table labels', value: '16 of 16' },
        { label: 'Tag fill against row, weakest', value: `${f2(tag.v)}:1 (${tag.at})` },
        { label: 'Badge: 1px border-strong on every label', value: `${f2(ratio(d.border.strong, bg))}:1 against row` },
      ];
    }
    case 'A': {
      const m = minOver(ALL_LABELS, (l) => ratio(role(d, LABEL_ROLE[l]), bg));
      return [
        { label: 'marker against row, weakest (1.4.11 asks 3:1)', value: `${f2(m.v)}:1 (${m.at})`, bad: m.v < 3 },
        { label: 'label text.secondary on row', value: `${f2(ratio(d.text.secondary, bg))}:1`, bad: ratio(d.text.secondary, bg) < 4.5 },
        { label: 'hues shared between labels', value: 'bug/infra, api/perf (5 hues for 7 labels); the word is the identity' },
      ];
    }
    case 'B': {
      const m = minOver(ALL_LABELS, (l) => ratio(role(d, LABEL_ROLE[l]), bg));
      return [
        { label: 'bracket against row, weakest', value: `${f2(m.v)}:1 (${m.at})` },
        { label: 'label text.secondary on row', value: `${f2(ratio(d.text.secondary, bg))}:1`, bad: ratio(d.text.secondary, bg) < 4.5 },
      ];
    }
    case 'C': {
      return [
        { label: 'border.subtle against row', value: `${f2(ratio(d.border.subtle, bg))}:1 (decorative: not an interactive boundary)` },
        { label: 'label text.secondary on row', value: `${f2(ratio(d.text.secondary, bg))}:1`, bad: ratio(d.text.secondary, bg) < 4.5 },
        { label: 'role colour carried', value: 'none: every label looks the same' },
      ];
    }
    case 'D': {
      const text = minOver(ALL_LABELS, (l) => {
        const [g, k] = LABEL_ROLE[l].split('.') as ['accent' | 'intent', string];
        return ratio(d.text.primary, (d.tint[g] as Record<string, string>)[k]!);
      });
      const fill = minOver(ALL_LABELS, (l) => {
        const [g, k] = LABEL_ROLE[l].split('.') as ['accent' | 'intent', string];
        return ratio((d.tint[g] as Record<string, string>)[k]!, bg);
      });
      return [
        { label: 'text.primary on tint, weakest', value: `${f2(text.v)}:1 (${text.at})`, bad: text.v < 4.5 },
        { label: 'tint against row, weakest', value: `${f2(fill.v)}:1 (${fill.at}); faint by design` },
      ];
    }
    case 'E': {
      const hidden = INBOX_ROWS.reduce((n, r) => n + Math.max(0, r.labels.length - 1), 0);
      const total = INBOX_ROWS.reduce((n, r) => n + r.labels.length, 0);
      return [
        { label: 'labels hidden at rest, inbox', value: `${hidden} of ${total}` },
        { label: 'overflow chip size', value: '16px tall; WCAG 2.5.8 spacing exception, no other target within 24px' },
        { label: 'reveal', value: 'hover and focus (Tooltip), the +N has an aria-label naming them; the detail lists all' },
      ];
    }
    case 'F': {
      const edge = minOver(Object.keys(STATUS_ROLE) as StatusId[], (s) => ratio(role(d, STATUS_ROLE[s]), bg));
      const inbox = edgeInk(level, INBOX_ROWS.map((r) => r.status));
      return [
        { label: '4px edge against row, weakest (1.4.11 asks 3:1)', value: `${f2(edge.v)}:1 (${edge.at})`, bad: edge.v < 3 },
        { label: 'status column removed', value: `saves a 120px column; mark column ${pct(inbox.coverage)} covered` },
        { label: 'status as colour alone (1.4.1)', value: 'edge: yes, so status text stays in the detail and for assistive tech; glyph: shape differs per status' },
      ];
    }
  }
}

function Reveal({ opt, ids }: { opt: Opt; ids: LabelId[] }) {
  if (opt !== 'E') return null;
  return (
    <div>
      <SceneLabel>Revealed state (drawn; the live one is each +N)</SceneLabel>
      <div className="flex flex-wrap items-start gap-4">
        <div className="border-2 border-edge-strong bg-surface-raised px-2 py-1 shadow-hard-sm">
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {ids.map((l) => (
              <li key={l}>
                <LabelUnit opt="A" id={l} ctx="inbox" />
              </li>
            ))}
          </ul>
        </div>
        <div className="border-2 border-edge-default p-2 font-mono text-[11px] text-content-secondary">
          <p className="m-0 mb-1 font-bold uppercase text-content-muted">[ detail pane ]</p>
          <Labels opt="A" ids={ISSUES_R3[0]!.labels} ctx="inbox" />
        </div>
      </div>
    </div>
  );
}

interface D11Opt {
  id: string;
  opt: Opt;
  status: StatusStyle | 'none';
  name: string;
  rationale: string;
  evidence: string;
}

export const D11_OPTIONS: D11Opt[] = [
  {
    id: 'D11-A',
    opt: 'A',
    status: 'badge',
    name: 'Marker plus text',
    rationale: 'A 6px square in the label\'s role colour, then plain mono text in text.secondary. Colour lives only in the marker. Status stays as the shipped Badge so only the labels change.',
    evidence: 'GitHub and Linear draw label colour as a dot beside the word; the word, not the hue, carries identity (WCAG 1.4.1).',
  },
  {
    id: 'D11-B',
    opt: 'B',
    status: 'badge',
    name: 'Bracketed text',
    rationale: '`[bug]` in text.secondary with the brackets in the role colour and no box. It is the brand\'s own bracketed-label device, with colour kept to two characters.',
    evidence: 'DESIGN.md: bracketed labels.',
  },
  {
    id: 'D11-C',
    opt: 'C',
    status: 'badge',
    name: 'Hairline',
    rationale: 'A 1px border.subtle outline, no fill, text.secondary, 10px. Every label looks the same; no role colour at all.',
    evidence: 'Carbon tags are fill-based; this is the lightest box that is still a box. Colour carries nothing here by design.',
  },
  {
    id: 'D11-D',
    opt: 'D',
    status: 'badge',
    name: 'Soft tint',
    rationale: 'The level\'s own role tint as the fill (midnight 20%, sketch 12%), no border, text.primary. Tints are the D8 pick.',
    evidence: 'D8: tints diverge per level; the role reads on its tint at 4.5:1. Measured per label below.',
  },
  {
    id: 'D11-E',
    opt: 'E',
    status: 'badge',
    name: 'Collapse to first label plus +N',
    rationale: 'Shown combined with A: the first label, then a `+N` chip. The rest appear on hover and focus, and in the detail pane. Rows with one label are unchanged.',
    evidence: 'Hover is supplementary: touch never opens a Tooltip, so the +N names the hidden labels in its aria-label and the detail pane lists them.',
  },
  {
    id: 'D11-F',
    opt: 'F',
    status: 'none',
    name: 'Status as structure',
    rationale: 'Status leaves the row as a word and becomes a narrow leading mark: a 4px role edge in the inbox, a single glyph column in the DataTable. Only taxonomy labels stay, drawn as A.',
    evidence: 'Status is one value from a closed set, labels are a free taxonomy; the board asks whether they should look the same (D11-G).',
  },
];

function Scenes({ o, level }: { o: { opt: Opt; status: StatusStyle | 'none' }; level: Level }) {
  const rows = [...optionRows(o.opt, level), ...inkRows(o.opt, level)];
  return (
    <Panel level={level}>
      <div className="grid grid-cols-1 gap-3">
        <div>
          <SceneLabel>Inbox list: priority, title, labels, status</SceneLabel>
          <Inbox opt={o.opt} status={o.status} />
        </div>
        <div>
          <SceneLabel>DataTable, 8 rows</SceneLabel>
          <DataTableScene opt={o.opt} status={o.status} />
        </div>
        <div>
          <SceneLabel>Kanban card, where labels felt fine</SceneLabel>
          <Cards opt={o.opt} />
        </div>
        <Reveal opt={o.opt} ids={ISSUES_R3[0]!.labels.slice(1)} />
        <Measures rows={rows} title="Measured: ink density" />
        <p className="m-0 font-mono text-[10px] text-content-muted">
          Ink is any pixel that is not the row background, as a share of a nominal {CELL.inbox / 32}x32px label cell (card row {CELL.card / 22}x22px). Geometry is exact from the board's CSS; glyph coverage is calibrated from the real font. Weighted scales each region by how far its colour is from the row (contrast ratio minus one, over twenty), so a pale tint covers much and weighs little.
        </p>
      </div>
    </Panel>
  );
}

export function D11Control() {
  const o = { opt: 'CUR' as Opt, status: 'badge' as StatusStyle };
  return (
    <Article id="D11-CURRENT">
      <OptionHead
        id="D11-CURRENT"
        name="Current (Badge and Tag as they ship)"
        rationale="The inbox sample draws labels as quiet Badges with a 1px border-strong edge. Kanban draws them as Tags: a solid role fill, a border and an uppercase #prefix. No shipped table draws coloured labels, so the DataTable column uses the Tag, the package's label component."
        evidence="Control row; no change. Inbox: apps/site/src/examples/inbox. Kanban: apps/site/src/examples/kanban."
      />
      <LevelPair>{(level) => <Scenes o={o} level={level} />}</LevelPair>
    </Article>
  );
}

export function D11Option({ o }: { o: D11Opt }) {
  return (
    <Article id={o.id}>
      <OptionHead id={o.id} name={o.name} rationale={o.rationale} evidence={o.evidence} />
      <LevelPair>{(level) => <Scenes o={o} level={level} />}</LevelPair>
    </Article>
  );
}

/* D11-G: does a single value (status) look different from a taxonomy (labels)? */

interface GVariant {
  id: string;
  title: string;
  labels: Opt;
  status: StatusStyle;
  same: boolean;
}

const G_VARIANTS: GVariant[] = [
  { id: 'G1', title: 'Status D (tint), labels A (marker): different', labels: 'A', status: 'D', same: false },
  { id: 'G2', title: 'Status A, labels A: the same', labels: 'A', status: 'A', same: true },
  { id: 'G3', title: 'Status D, labels D: the same', labels: 'D', status: 'D', same: true },
  { id: 'G4', title: 'Status A (marker), labels D (tint): different, reversed', labels: 'D', status: 'A', same: false },
];

function gInk(v: GVariant, level: Level, rows: Issue[]): Row[] {
  const l = labelInk(level, v.labels, labelRows(rows), 'inbox');
  const s = statusInk(level, v.status, rows.map((r) => r.status));
  const la = rows.length * CELL.inbox;
  const sa = rows.length * CELL.status;
  const cov = (l.coverage * la + s.coverage * sa) / (la + sa);
  const wt = (l.weighted * la + s.weighted * sa) / (la + sa);
  const lw = l.weighted;
  const sw = s.weighted;
  return [
    { label: `${v.id} label + status columns`, value: `${pct(cov)} covered, ${pct(wt)} weighted` },
    { label: `${v.id} weighted, labels vs status`, value: `${pct(lw)} vs ${pct(sw)}` },
  ];
}

export function D11G() {
  const rows = [ISSUES_R3[0]!, ISSUES_R3[3]!, ISSUES_R3[5]!];
  return (
    <Article id="D11-G">
      <OptionHead
        id="D11-G"
        name="Should status and labels look different?"
        rationale="A sub-question, not an option. Status is one value from five and sits in its own column; labels are a free set of one to three. Four rows below pair a status treatment with a label treatment: two use the same one, two use different ones. Reading across, can you tell which column is the state and which is the tags?"
        evidence="Pairing a status with a different label shape separates a closed set from a taxonomy; a shared shape keeps the row quieter. The numbers are the ink both columns add together."
      />
      <LevelPair>
        {(level) => (
          <Panel level={level}>
            <div className="grid grid-cols-1 gap-4">
              {G_VARIANTS.map((v) => (
                <div key={v.id} id={`D11-${v.id}`} className="scroll-mt-20">
                  <SceneLabel>{`${v.id}: ${v.title}`}</SceneLabel>
                  <Table label={`${v.id} issues`} appearance="quiet" density="compact" containerClassName="border-2 border-edge-default">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10 px-1">PRI</TableHead>
                        <TableHead className="min-w-[12rem]">TITLE</TableHead>
                        <TableHead className="w-44 min-w-44">LABELS</TableHead>
                        <TableHead className="w-30">STATUS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className={`px-1 font-bold ${PRIORITY_CLASS[r.pri]}`}>{r.pri}</TableCell>
                          <TableCell className="text-content-secondary">{r.title}</TableCell>
                          <TableCell>
                            <Labels opt={v.labels} ids={r.labels} ctx="inbox" />
                          </TableCell>
                          <TableCell>
                            <StatusUnit style={v.status} status={r.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
              <Measures
                title="Measured: ink in both columns"
                rows={G_VARIANTS.flatMap((v) => gInk(v, level, rows))}
              />
            </div>
          </Panel>
        )}
      </LevelPair>
    </Article>
  );
}

