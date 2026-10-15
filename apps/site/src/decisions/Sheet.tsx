import { ROWS } from './data';

/**
 * A simulated A4 sheet (210:297). Paper is drawn on screen, so nothing here
 * depends on @media print, which the owner cannot see.
 *
 * economy: what the browser does by default, backgrounds off. Midnight text on
 *          white, every fill gone.
 * exact:   midnight kept (D5-A).
 * keep:    sketch roles, fills kept (D5-B).
 * outline: sketch roles, fills become outlines (D5-C).
 */
export type SheetMode = 'economy' | 'exact' | 'keep' | 'outline';

/** [filled, outlined, economy] class triples. */
const TAG = ['bg-accent-primary text-content-inverse', 'border-2 border-accent-primary text-content-primary', 'text-content-inverse'] as const;
const BTN = ['bg-accent-primary text-content-inverse', 'text-content-primary', 'text-content-inverse'] as const;
const SEL = ['bg-surface-raised', 'border-2 border-edge-strong', ''] as const;
const BAND = ['bg-content-primary text-content-inverse', 'border-b-2 border-edge-strong text-content-primary', 'text-content-inverse'] as const;

function pick(mode: SheetMode, t: readonly [string, string, string]) {
  if (mode === 'outline') return t[1];
  if (mode === 'economy') return t[2];
  return t[0];
}

export function Sheet({ mode }: { mode: SheetMode }) {
  const outer =
    mode === 'economy'
      ? { 'data-theme': 'sketch' as const, className: 'bg-surface-raised' }
      : mode === 'exact'
        ? { 'data-theme': 'midnight' as const, className: 'bg-surface-base' }
        : { 'data-theme': 'sketch' as const, className: 'bg-surface-base' };
  const inner = mode === 'economy' ? 'midnight' : undefined;

  const body = (
    <div className="flex h-full flex-col gap-2 p-3 text-content-primary">
      <div className={`flex items-baseline justify-between px-2 py-1 font-mono text-[10px] font-bold uppercase ${pick(mode, BAND)}`}>
        <span>[ Inbox ]</span>
        <span>3 of 60</span>
      </div>
      <ul className="m-0 flex list-none flex-col p-0">
        {ROWS.map((r, i) => (
          <li
            key={r.id}
            className={`flex items-center gap-1.5 border-b border-edge-subtle px-2 py-1 font-mono text-[10px] ${i === 0 ? pick(mode, SEL) : ''}`}
          >
            <span className="font-bold text-accent-primary">{r.id}</span>
            <span className="min-w-0 flex-1 truncate text-content-primary">{r.title}</span>
            <span className={`px-1 text-[9px] font-bold uppercase ${pick(mode, TAG)}`}>{r.tag}</span>
          </li>
        ))}
      </ul>
      <div className={`mt-1 px-2 py-1 font-mono text-[10px] font-bold uppercase ${pick(mode, BAND)}`}>[ Settings: Notifications ]</div>
      <dl className="m-0 flex flex-col gap-1.5 font-mono text-[10px]">
        {[
          ['Email digest', 'Daily', true],
          ['Mentions', 'Instant', true],
          ['Releases', 'Off', false],
        ].map(([k, v, on]) => (
          <div key={String(k)} className="flex items-center justify-between border-b border-edge-subtle px-2 pb-1">
            <dt className="text-content-secondary">{String(k)}</dt>
            <dd className="m-0 flex items-center gap-1.5 text-content-primary">
              {String(v)}
              <span
                aria-hidden="true"
                className={`inline-block h-3 w-3 border-2 border-edge-strong ${on ? (mode === 'outline' ? 'text-accent-primary' : mode === 'economy' ? '' : 'bg-accent-primary') : ''}`}
              >
                {on && (mode === 'outline' || mode === 'economy') ? <span className="block text-center text-[8px] leading-[8px]">x</span> : null}
              </span>
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-1">
        <span className={`inline-block border-2 border-edge-strong px-3 py-1 font-mono text-[10px] font-bold uppercase ${pick(mode, BTN)}`}>
          Save changes
        </span>
      </div>
    </div>
  );

  return (
    <div
      {...outer}
      className={`${outer.className} aspect-[210/297] w-full max-w-[340px] overflow-hidden border-2 border-edge-subtle shadow-hard-md`}
    >
      {inner ? <div data-theme={inner} className="h-full">{body}</div> : body}
    </div>
  );
}
