import type { Row } from '../p2/Frame';

/** Measured numbers, label above value, so long values wrap in a narrow panel. Flagged rows say FAIL in words. */
export function Measures({ rows, title = 'Measured' }: { rows: Row[]; title?: string }) {
  return (
    <div className="border-2 border-edge-default bg-surface-raised p-2">
      <p className="m-0 mb-1 font-mono text-[11px] font-bold uppercase tracking-wider text-content-muted">{`[ ${title} ]`}</p>
      <dl className="m-0 flex flex-col gap-1 font-mono text-[11px]">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-wrap items-baseline justify-between gap-x-3 border-b border-edge-subtle pb-1 last:border-b-0">
            <dt className="text-content-secondary">{r.label}</dt>
            <dd className={`m-0 min-w-0 break-words text-right ${r.bad ? 'font-bold text-intent-danger' : 'text-content-primary'}`}>
              {r.value}
              {r.bad ? ' FAIL' : ''}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
