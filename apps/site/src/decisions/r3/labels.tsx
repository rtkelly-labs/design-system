import type { ReactNode } from 'react';
import { Badge, Tag, Tooltip } from '@rtkelly13/design-system';
import type { AccentToken } from '@rtkelly13/design-system';
import type { RoleKey } from './model';

/* Round 3, D11: label and status treatments. Site-local. Colour is a role read through the package's custom properties, so
 * the same markup is right on both levels. */

export type LabelId = 'bug' | 'a11y' | 'tokens' | 'docs' | 'perf' | 'infra' | 'api';
export type StatusId = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

/** The roles the kanban sample gives its labels, plus `bug` on danger. Seven labels share five hues: the text has to carry identity. */
export const LABEL_ROLE: Record<LabelId, RoleKey> = {
  bug: 'intent.danger',
  a11y: 'intent.success',
  tokens: 'accent.primary',
  docs: 'accent.quiet',
  perf: 'intent.warning',
  infra: 'accent.tertiary',
  api: 'accent.secondary',
};

const LABEL_ACCENT: Record<LabelId, AccentToken> = {
  bug: 'danger',
  a11y: 'success',
  tokens: 'primary',
  docs: 'quiet',
  perf: 'warning',
  infra: 'tertiary',
  api: 'secondary',
};

/** The inbox sample's own mapping. */
export const STATUS_ROLE: Record<StatusId, RoleKey> = {
  BACKLOG: 'accent.quiet',
  TODO: 'accent.secondary',
  IN_PROGRESS: 'intent.warning',
  REVIEW: 'intent.info',
  DONE: 'intent.success',
};

const STATUS_ACCENT: Record<StatusId, AccentToken> = {
  BACKLOG: 'quiet',
  TODO: 'secondary',
  IN_PROGRESS: 'warning',
  REVIEW: 'info',
  DONE: 'success',
};

export const STATUS_GLYPH: Record<StatusId, string> = {
  BACKLOG: '○',
  TODO: '◔',
  IN_PROGRESS: '◑',
  REVIEW: '◕',
  DONE: '●',
};

export const PRIORITY_CLASS: Record<Priority, string> = {
  P0: 'text-intent-danger',
  P1: 'text-intent-warning',
  P2: 'text-content-secondary',
  P3: 'text-content-muted',
};

export interface Issue {
  id: string;
  pri: Priority;
  title: string;
  status: StatusId;
  labels: LabelId[];
}

/** Titles from the inbox fixtures; labels hand-set so 1, 2 and 3 all appear. */
export const ISSUES_R3: Issue[] = [
  { id: 'DS-1200', pri: 'P0', title: 'Focus ring clipped inside overflow-x containers', status: 'IN_PROGRESS', labels: ['bug', 'a11y', 'tokens'] },
  { id: 'DS-1193', pri: 'P2', title: 'Tabs: typeahead on the tablist', status: 'TODO', labels: ['a11y'] },
  { id: 'DS-1186', pri: 'P1', title: 'Menu popup flips under the sticky header', status: 'REVIEW', labels: ['bug', 'perf'] },
  { id: 'DS-1179', pri: 'P3', title: 'Contrast of quiet accent on sketch raised surface', status: 'BACKLOG', labels: ['tokens', 'a11y', 'docs'] },
  { id: 'DS-1172', pri: 'P1', title: 'DataTable: expose row selection state', status: 'IN_PROGRESS', labels: ['api'] },
  { id: 'DS-1165', pri: 'P2', title: 'Skeleton pulse ignores reduced motion in print', status: 'DONE', labels: ['a11y', 'perf'] },
  { id: 'DS-1158', pri: 'P2', title: 'Select list does not scroll highlighted item into view', status: 'TODO', labels: ['bug', 'a11y', 'api'] },
  { id: 'DS-1151', pri: 'P3', title: 'Drawer close button loses focus ring in sketch', status: 'REVIEW', labels: ['bug'] },
];

export type Opt = 'CUR' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type Ctx = 'inbox' | 'table' | 'card';

export const roleVar = (r: RoleKey) => `var(--ds-${r.replace('.', '-')})`;
export const tintVar = (r: RoleKey) => `var(--ds-tint-${r.replace('.', '-')})`;

const TEXT = 'font-mono leading-4';

/** One label in one treatment. */
export function LabelUnit({ opt, id, ctx }: { opt: Opt; id: LabelId; ctx: Ctx }): ReactNode {
  const r = LABEL_ROLE[id];
  switch (opt) {
    case 'CUR':
      return ctx === 'inbox' ? (
        <Badge accent="quiet" size="sm">{id}</Badge>
      ) : (
        <Tag text={id} accent={LABEL_ACCENT[id]} size="sm" />
      );
    case 'A':
    case 'E':
    case 'F':
      return (
        <span className={`inline-flex h-4 items-center gap-1 text-[11px] text-content-secondary ${TEXT}`}>
          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0" style={{ background: roleVar(r) }} />
          {id}
        </span>
      );
    case 'B':
      return (
        <span className={`inline-flex h-4 items-center whitespace-pre text-[11px] text-content-secondary ${TEXT}`}>
          <span aria-hidden="true" style={{ color: roleVar(r) }}>[</span>
          {id}
          <span aria-hidden="true" style={{ color: roleVar(r) }}>]</span>
        </span>
      );
    case 'C':
      return (
        <span className={`inline-flex h-[18px] items-center border border-edge-subtle px-1.5 text-[10px] text-content-secondary ${TEXT}`}>
          {id}
        </span>
      );
    case 'D':
      return (
        <span className={`inline-flex h-4 items-center px-1.5 text-[11px] text-content-primary ${TEXT}`} style={{ background: tintVar(r) }}>
          {id}
        </span>
      );
  }
}

/** A row's labels. Under E only the first shows, with a `+N` that reveals the rest on hover and focus. */
export function Labels({ opt, ids, ctx }: { opt: Opt; ids: LabelId[]; ctx: Ctx }) {
  const shown = opt === 'E' ? ids.slice(0, 1) : ids;
  const rest = opt === 'E' ? ids.slice(1) : [];
  return (
    <ul aria-label="Labels" className="m-0 flex list-none flex-wrap items-center gap-x-2 gap-y-1 p-0">
      {shown.map((l) => (
        <li key={l}>
          <LabelUnit opt={opt} id={l} ctx={ctx} />
        </li>
      ))}
      {rest.length > 0 ? (
        <li>
          <Tooltip
            side="top"
            content={
              <span className="flex flex-col gap-1 normal-case">
                {rest.map((l) => (
                  <LabelUnit key={l} opt="A" id={l} ctx={ctx} />
                ))}
              </span>
            }
          >
            <button
              type="button"
              aria-label={`${rest.length} more ${rest.length === 1 ? 'label' : 'labels'}: ${rest.join(', ')}`}
              className={`inline-flex h-4 min-w-4 items-center justify-center border border-edge-subtle px-1 text-[10px] text-content-secondary focus-visible:ring-2 focus-visible:ring-accent-primary ${TEXT}`}
            >
              {`+${rest.length}`}
            </button>
          </Tooltip>
        </li>
      ) : null}
    </ul>
  );
}

export type StatusStyle = 'badge' | 'A' | 'B' | 'C' | 'D' | 'glyph';

/** A status in a treatment. `glyph` is the shape-and-colour mark of D11-F; the text stays available to assistive technology. */
export function StatusUnit({ style, status }: { style: StatusStyle; status: StatusId }): ReactNode {
  const r = STATUS_ROLE[status];
  const name = status.replace('_', ' ');
  switch (style) {
    case 'badge':
      return <Badge accent={STATUS_ACCENT[status]} size="sm">{status}</Badge>;
    case 'glyph':
      return (
        <span role="img" aria-label={name} className="inline-flex h-4 w-4 items-center justify-center text-xs leading-none" style={{ color: roleVar(r) }}>
          {STATUS_GLYPH[status]}
        </span>
      );
    case 'A':
      return (
        <span className={`inline-flex h-4 items-center gap-1 text-[11px] text-content-secondary ${TEXT}`}>
          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0" style={{ background: roleVar(r) }} />
          {status}
        </span>
      );
    case 'B':
      return (
        <span className={`inline-flex h-4 items-center whitespace-pre text-[11px] text-content-secondary ${TEXT}`}>
          <span aria-hidden="true" style={{ color: roleVar(r) }}>[</span>
          {status}
          <span aria-hidden="true" style={{ color: roleVar(r) }}>]</span>
        </span>
      );
    case 'C':
      return (
        <span className={`inline-flex h-[18px] items-center border border-edge-subtle px-1.5 text-[10px] text-content-secondary ${TEXT}`}>
          {status}
        </span>
      );
    case 'D':
      return (
        <span className={`inline-flex h-4 items-center px-1.5 text-[11px] text-content-primary ${TEXT}`} style={{ background: tintVar(r) }}>
          {status}
        </span>
      );
  }
}
