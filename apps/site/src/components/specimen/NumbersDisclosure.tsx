import type { ReactNode } from 'react';
import { Disclosure, Label, Swatch } from './parts';

export interface NumbersTableData {
  title: string;
  head: string[];
  /** A cell that starts with a hash is a colour and gets a swatch beside it. */
  rows: string[][];
}

export function NumbersTable({ title, head, rows }: NumbersTableData) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{`[ ${title} ]`}</Label>
      <div className="overflow-x-auto">
        <table className="border-collapse font-mono text-[11px]">
          <thead>
            <tr className="text-left text-content-muted">
              {head.map((h) => <th key={h} className="p-1 pr-3">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-edge-subtle text-content-secondary">
                {r.map((c, j) => (
                  <td key={j} className="p-1 pr-3">{c.startsWith('#') ? <><Swatch colour={c} /> {c}</> : c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** The raw numbers behind the checks, folded away so the page reads without them. */
export function NumbersDisclosure({ title = 'The numbers', tables = [], children }: { title?: string; tables?: NumbersTableData[]; children?: ReactNode }) {
  return (
    <Disclosure title={title}>
      <div className="flex flex-col gap-5">
        {children}
        {tables.map((t) => <NumbersTable key={t.title} {...t} />)}
      </div>
    </Disclosure>
  );
}
