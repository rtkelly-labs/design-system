import type { ReactNode } from 'react';
import { CFG, KEYS, ROWS, SKIP } from './data';
import { VBtn } from './VBtn';

function Scene({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <p className="m-0 font-mono text-[11px] font-bold uppercase tracking-wider text-content-muted">{`[ ${title} ]`}</p>
      <div data-scene={id}>{children}</div>
    </div>
  );
}

/** Inbox bulk-action bar: ARCHIVE, MARK READ, CLEAR beside "3 selected". */
function Bulk({ opt, dec }: { opt: string; dec: string }) {
  const c = CFG[dec]!.bulk;
  return (
    <div className="border-2 border-edge-strong bg-surface-raised">
      <ul className="m-0 list-none p-0">
        {ROWS.slice(0, 2).map((r) => (
          <li key={r.id} className="flex items-center gap-2 border-b-2 border-edge-subtle px-3 py-1.5 font-mono text-xs">
            <span aria-hidden="true" className="text-accent-primary">[x]</span>
            <span className="min-w-0 flex-1 truncate text-content-primary">{r.title}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2 bg-surface-sunken p-2">
        <span className="mr-1 font-mono text-xs font-bold text-content-primary">3 selected</span>
        <VBtn opt={opt} slot={c.archive} />
        <VBtn opt={opt} slot={c.markRead} />
        <VBtn opt={opt} slot={c.clear} />
      </div>
    </div>
  );
}

/** Settings danger zone: ARCHIVE, TRANSFER, DELETE. */
function Danger({ opt, dec }: { opt: string; dec: string }) {
  const c = CFG[dec]!.danger;
  const rows = [
    { t: 'Archive this repository', b: 'Mark it read-only.', slot: c.archive },
    { t: 'Transfer ownership', b: 'Move it to another account.', slot: c.transfer },
    { t: 'Delete this repository', b: 'Removes 214 deployments. Cannot be undone.', slot: c.del },
  ];
  return (
    <ul className="m-0 flex list-none flex-col border-2 border-intent-danger p-0 shadow-hard-intent-danger">
      {rows.map((r) => (
        <li key={r.t} className="flex flex-wrap items-center gap-3 border-b-2 border-intent-danger p-3 last:border-b-0">
          <div className="min-w-0 flex-1 basis-40">
            <p className="m-0 font-mono text-sm font-bold text-content-primary">{r.t}</p>
            <p className="m-0 font-sans text-xs text-content-secondary">{r.b}</p>
          </div>
          <VBtn opt={opt} slot={r.slot} />
        </li>
      ))}
    </ul>
  );
}

/** Modal footer: CANCEL, DELETE REPOSITORY. */
function Modal({ opt, dec }: { opt: string; dec: string }) {
  const c = CFG[dec]!.modal;
  return (
    <div className="border-2 border-edge-strong bg-surface-raised shadow-hard-lg">
      <div className="border-b-2 border-edge-strong px-4 py-2 font-mono text-sm font-bold uppercase text-content-primary">
        [ Delete rtk/media-transcoder? ]
      </div>
      <p className="m-0 px-4 py-3 font-sans text-sm text-content-secondary">
        This removes 214 deployments and every environment variable. It cannot be undone.
      </p>
      <div className="flex flex-wrap justify-end gap-3 border-t-2 border-edge-subtle bg-surface-sunken px-4 py-3">
        <VBtn opt={opt} slot={c.cancel} />
        <VBtn opt={opt} slot={c.confirm} />
      </div>
    </div>
  );
}

/** Compact table with REVEAL, COPY, ROLL row actions. */
function TableRows({ opt, dec }: { opt: string; dec: string }) {
  const c = CFG[dec]!.table;
  return (
    <div className="overflow-x-auto border-2 border-edge-strong bg-surface-raised">
      <table className="w-full border-collapse font-mono text-xs">
        <thead>
          <tr className="border-b-2 border-edge-strong text-left uppercase text-content-secondary">
            <th scope="col" className="px-3 py-1.5">Key</th>
            <th scope="col" className="px-3 py-1.5">Last used</th>
            <th scope="col" className="px-3 py-1.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {KEYS.map((k) => (
            <tr key={k.name} className="border-b border-edge-subtle last:border-b-0">
              <th scope="row" className="px-3 py-1 text-left font-bold text-content-primary">{k.name}</th>
              <td className="px-3 py-1 text-content-secondary">{k.used}</td>
              <td className="px-3 py-1">
                <div className="flex justify-end gap-1.5">
                  <VBtn opt={opt} slot={c.reveal} />
                  <VBtn opt={opt} slot={c.copy} />
                  <VBtn opt={opt} slot={c.roll} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Calendar toolbar: TODAY, <, >, OPTIONS, plus a primary NEW EVENT. */
function Cal({ opt, dec }: { opt: string; dec: string }) {
  const c = CFG[dec]!.cal;
  return (
    <div className="flex flex-wrap items-center gap-2 border-2 border-edge-strong bg-surface-raised p-2">
      <VBtn opt={opt} slot={c.today} />
      <VBtn opt={opt} slot={c.prev} />
      <VBtn opt={opt} slot={c.next} />
      <span className="px-1 font-mono text-sm font-bold uppercase text-content-primary">OCT 2026</span>
      <span className="flex-1" />
      <VBtn opt={opt} slot={c.options} />
      <VBtn opt={opt} slot={c.add} />
    </div>
  );
}

/** Kanban card footer: a "..." menu trigger and a small add button. */
function Kanban({ opt, dec }: { opt: string; dec: string }) {
  const c = CFG[dec]!.kanban;
  return (
    <div className="max-w-xs border-2 border-edge-strong bg-surface-raised">
      <div className="flex flex-col gap-1 p-3">
        <p className="m-0 font-mono text-sm font-bold text-content-primary">Wire up retry logic</p>
        <p className="m-0 font-mono text-[11px] text-content-secondary">#api · due Oct 21</p>
      </div>
      <div className="flex items-center justify-between border-t-2 border-edge-subtle px-2 py-1.5">
        <VBtn opt={opt} slot={c.menu} />
        <VBtn opt={opt} slot={c.add} />
      </div>
    </div>
  );
}

/**
 * Every in-context case for one option. `opt` is the option ID, or `CUR-Dn` for
 * the control row. `dec` picks which roles each button takes.
 */
export function Scenes({ opt, dec }: { opt: string; dec: string }) {
  const skip = SKIP[dec] ?? [];
  return (
    <div className="grid grid-cols-1 gap-4">
      <Scene id="bulk" title="Inbox bulk bar"><Bulk opt={opt} dec={dec} /></Scene>
      <Scene id="danger" title="Settings danger zone"><Danger opt={opt} dec={dec} /></Scene>
      <Scene id="modal" title="Modal footer"><Modal opt={opt} dec={dec} /></Scene>
      <Scene id="table" title="Table row actions"><TableRows opt={opt} dec={dec} /></Scene>
      {!skip.includes('cal') && <Scene id="cal" title="Calendar toolbar"><Cal opt={opt} dec={dec} /></Scene>}
      {!skip.includes('kanban') && <Scene id="kanban" title="Kanban card footer"><Kanban opt={opt} dec={dec} /></Scene>}
    </div>
  );
}
