import type { CSSProperties, ReactNode } from 'react';
import { LEVELS, contrastRatio } from '@rtkelly13/design-system';
import type { ThemeLevel } from '@rtkelly13/design-system';

export type Level = ThemeLevel;
export const LV = LEVELS;

/** A custom-property bag, typed so `style` accepts `--p2-*` keys. */
export function vars(map: Record<string, string>): CSSProperties {
  return map as CSSProperties;
}

export const ratio = contrastRatio;

/** One level of the package, scoped with `data-theme`. Custom properties for the option go on `style`. */
export function Panel({ level, style, children }: { level: Level; style?: CSSProperties; children: ReactNode }) {
  return (
    <div
      data-theme={level}
      style={style}
      className="min-w-0 border-2 border-edge-strong bg-surface-base p-3 text-content-primary sm:p-4"
    >
      <p className="m-0 mb-3 font-mono text-xs font-bold uppercase tracking-wider text-accent-primary">{`[ ${level} ]`}</p>
      {children}
    </div>
  );
}

export function OptionHead({ id, name, rationale, evidence }: { id: string; name: string; rationale: string; evidence: string }) {
  return (
    <header className="flex flex-col gap-1">
      <h3 className="m-0 flex flex-wrap items-baseline gap-3 font-display text-xl font-extrabold uppercase text-content-primary">
        <span className="font-mono text-sm text-accent-primary">{`[ ${id} ]`}</span>
        {name}
      </h3>
      <p className="m-0 max-w-3xl font-sans text-sm text-content-secondary">{rationale}</p>
      <p className="m-0 font-mono text-xs text-content-muted">Evidence: {evidence}</p>
    </header>
  );
}

export function Article({ id, children }: { id: string; children: ReactNode }) {
  return (
    <article id={id} className="flex scroll-mt-24 flex-col gap-3 border-t-2 border-edge-subtle pt-5">
      {children}
    </article>
  );
}

export interface Row {
  label: string;
  value: string;
  bad?: boolean;
}

/** Measured numbers beside an option. `bad` rows are flagged in words, not only colour. */
export function Measures({ rows, title = 'Measured' }: { rows: Row[]; title?: string }) {
  return (
    <div className="border-2 border-edge-default bg-surface-raised p-2">
      <p className="m-0 mb-1 font-mono text-[11px] font-bold uppercase tracking-wider text-content-muted">{`[ ${title} ]`}</p>
      <dl className="m-0 grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 font-mono text-[11px]">
        {rows.map((r) => (
          <div key={r.label} className="col-span-2 grid grid-cols-subgrid">
            <dt className="min-w-0 text-content-secondary">{r.label}</dt>
            <dd className={`m-0 text-right ${r.bad ? 'font-bold text-intent-danger' : 'text-content-primary'}`}>
              {r.value}
              {r.bad ? ' FAIL' : ''}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function SceneLabel({ children }: { children: ReactNode }) {
  return <p className="m-0 mb-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-content-muted">{`[ ${children} ]`}</p>;
}

/** Two `data-theme` panels, one column below `lg`. */
export function LevelPair({ children }: { children: (level: Level) => ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {children('midnight')}
      {children('sketch')}
    </div>
  );
}
