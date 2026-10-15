import { D10R2_NOTE, D11_NOTE } from './notes';
import { D11_OPTIONS, D11Control, D11G, D11Option } from './D11';
import { R2_GROUPS, R2_OPTIONS, R2Control, R2Option } from './D10R2';

/** An in-page link target. Written as a call because a literal such as "#D10" reads as a hex colour to check:tokens. */
const anchor = (id: string) => `#${id}`;

/** Round 3: D10 round 2 (syntax differentiation and fixes) and D11 (labels in tables). */
export function Round3() {
  return (
    <section id="round-3" aria-labelledby="round-3-h" className="flex scroll-mt-24 flex-col gap-10">
      <header className="flex flex-col gap-3">
        <p className="m-0 font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent-primary">[ ROUND 3 · SCAFFOLDING ]</p>
        <h2 id="round-3-h" className="m-0 font-display text-4xl font-extrabold uppercase text-content-primary sm:text-5xl">
          Round 3
        </h2>
        <p className="m-0 max-w-3xl text-lg text-content-secondary">
          Two open decisions. D10 round 2 stays close to D10-C and fixes what the owner called off in the editor sample;
          D11 asks what labels in tables should look like. Every option is shown on both levels beside a control row of
          what ships today, with measured numbers.
        </p>
        <nav aria-label="Round 3 decisions" className="border-2 border-edge-strong bg-surface-raised p-3 shadow-hard-md">
          <ul className="m-0 flex list-none flex-col gap-2 p-0 font-mono text-sm">
            <li className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <a href={anchor("D10-R2")} className="font-bold text-accent-primary">D10-R2</a>
              <span className="text-content-primary">Syntax highlighting, round 2</span>
              <span className="flex flex-wrap gap-x-2 text-xs">
                <a href={anchor("D10-R2-CURRENT")} className="text-content-secondary">D10-R2-CURRENT</a>
                {R2_OPTIONS.map((o) => (
                  <a key={o.id} href={`#${o.id}`} className="text-content-secondary">{o.id}</a>
                ))}
              </span>
            </li>
            <li className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <a href={anchor("D11")} className="font-bold text-accent-primary">D11</a>
              <span className="text-content-primary">Labels in tables</span>
              <span className="flex flex-wrap gap-x-2 text-xs">
                <a href={anchor("D11-CURRENT")} className="text-content-secondary">D11-CURRENT</a>
                {D11_OPTIONS.map((o) => (
                  <a key={o.id} href={`#${o.id}`} className="text-content-secondary">{o.id}</a>
                ))}
                <a href={anchor("D11-G")} className="text-content-secondary">D11-G</a>
              </span>
            </li>
          </ul>
        </nav>
      </header>

      <section id="D10-R2" aria-labelledby="D10-R2-h" className="flex scroll-mt-24 flex-col gap-5 border-t-4 border-double border-edge-strong pt-8">
        <header className="flex flex-col gap-2">
          <p className="m-0 font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent-primary">[ D10-R2 ]</p>
          <h2 id="D10-R2-h" className="m-0 font-display text-3xl font-extrabold uppercase text-content-primary sm:text-4xl">
            Syntax highlighting, round 2
          </h2>
          <p className="m-0 max-w-3xl text-content-secondary">
            D10-C is the base: today's four hues plus bold keyword, italic comment and underlined type. The owner also
            says some of the highlighting is off. Three things were observed in the editor sample, and each has a group of
            options. Pick at most one from K, S and F; take any of X.
          </p>
          <p className="m-0 max-w-3xl border-2 border-edge-default bg-surface-raised p-3 font-mono text-xs text-content-secondary">{D10R2_NOTE}</p>
        </header>
        <R2Control />
        {R2_GROUPS.map((g) => (
          <div key={g.id} id={g.id} className="flex scroll-mt-24 flex-col gap-5">
            <header className="flex flex-col gap-1 border-t-2 border-edge-default pt-5">
              <p className="m-0 font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent-primary">{`[ ${g.id} ]`}</p>
              <h3 className="m-0 font-display text-2xl font-extrabold uppercase text-content-primary">{g.title}</h3>
              <p className="m-0 max-w-3xl text-content-secondary">{g.text}</p>
            </header>
            {R2_OPTIONS.filter((o) => o.group === g.group).map((o) => (
              <R2Option key={o.id} o={o} />
            ))}
          </div>
        ))}
      </section>

      <section id="D11" aria-labelledby="D11-h" className="flex scroll-mt-24 flex-col gap-5 border-t-4 border-double border-edge-strong pt-8">
        <header className="flex flex-col gap-2">
          <p className="m-0 font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent-primary">[ D11 ]</p>
          <h2 id="D11-h" className="m-0 font-display text-3xl font-extrabold uppercase text-content-primary sm:text-4xl">
            Labels in tables
          </h2>
          <p className="m-0 max-w-3xl text-content-secondary">
            The owner: "when labels are used in tables they're too visually overwhelming. Consider other approaches or
            label types." Each option is drawn in an inbox list, a DataTable and a kanban card, the context where labels
            felt fine.
          </p>
          <p className="m-0 max-w-3xl border-2 border-edge-default bg-surface-raised p-3 font-mono text-xs text-content-secondary">{D11_NOTE}</p>
        </header>
        <D11Control />
        {D11_OPTIONS.map((o) => (
          <D11Option key={o.id} o={o} />
        ))}
        <D11G />
      </section>
    </section>
  );
}
