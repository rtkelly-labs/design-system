import type { ReactNode } from 'react';
import { ratio } from '../p2/Frame';
import { EditorFrame, MAX_COLS, PlainTen } from './Frame';
import { DIRECTIONS, LEVEL_IDS, METRICS, TOKS, build, checksFor, worstOnBands } from './model';
import type { Direction, DirId, Level, Metrics } from './model';

/** An in-page link target, written as a call because a literal such as "#R4-A" reads as a hex colour to check:tokens. */
const anchor = (id: string) => `#${id}`;

const Eyebrow = ({ children }: { children: ReactNode }) => (
  <p className="m-0 font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent-primary">{children}</p>
);

function Panel({ level, children }: { level: Level; children: ReactNode }) {
  return (
    <div data-theme={level} className="min-w-0 border-2 border-edge-strong bg-surface-base p-3 text-content-primary sm:p-4">
      <p className="m-0 mb-3 font-mono text-xs font-bold uppercase tracking-wider text-accent-primary">{`[ ${level} ]`}</p>
      {children}
    </div>
  );
}

function Pair({ children }: { children: (level: Level) => ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {LEVEL_IDS.map((l) => (
        <Panel key={l} level={l}>
          {children(l)}
        </Panel>
      ))}
    </div>
  );
}

const SURFACES: { surface: string; size: string; leading: string; tab: string; note: string }[] = [
  { surface: 'CodeBlock (docs)', size: '0.85rem = 13.6px', leading: '1.6 = 21.76px', tab: 'not set (browser 8)', note: 'Padding 1rem, no gutter. Colours come from the Shiki css-variables map in globals.css: keyword is accent.secondary, constant is accent.tertiary (danger\'s hue).' },
  { surface: 'Prose pre', size: 'typography plugin default (not measured here)', leading: 'plugin default', tab: 'not set', note: 'prose.css overrides only the radius.' },
  { surface: 'Terminal figure', size: 'inherits the page', leading: 'leading-relaxed 1.625, 2px between rows', tab: 'not set', note: 'Three inks only: command, success, muted. No syntax.' },
  { surface: 'Editor sample', size: '13px', leading: '20px (leading-5)', tab: 'not set', note: 'Alphas for find, selection and line are one number for both levels. Keyword is accent.tertiary, the danger hue; find marks are intent.warning.' },
];

function Research() {
  return (
    <div className="flex flex-col gap-3 border-2 border-edge-strong bg-surface-raised p-4">
      <h3 className="m-0 font-display text-xl font-extrabold uppercase text-content-primary">What the research found</h3>
      <ul className="m-0 flex list-disc flex-col gap-2 pl-5 text-sm text-content-secondary">
        <li>
          <strong className="text-content-primary">Terminals give highlights to attributes, not colours.</strong> Alacritty's selection defaults to the cell's own colours swapped. Ghostty's selection
          defaults to the inverted window colours. Gruvbox draws Visual, Search and IncSearch in reverse video. Helix themes are scope keys plus modifiers
          (<code>bold</code>, <code>reversed</code>, underline styles including <code>curl</code>), and give the matching bracket its own key.
        </li>
        <li>
          <strong className="text-content-primary">base16 fixes the slots.</strong> 0E keywords, 0B strings, 09 numbers and constants, 0D functions, 0A classes, 0C regex, 08 variables and diff deleted.
          02 is the selection background, 03 comments and line highlighting.
        </li>
        <li>
          <strong className="text-content-primary">Editor themes use translucent overlays and one opaque chip.</strong> Catppuccin: selection 20 to 30% overlay, cursor line 10%, search one colour,
          active search another. VS Code requires find-highlight, word-highlight and error backgrounds to be not opaque, so they do not hide other decorations.
        </li>
        <li>
          <strong className="text-content-primary">On yellow fills.</strong> Yellow is the one strong precedent: Alacritty's focused match, Gruvbox's Search and base16's 0A search background. In each it is
          bright yellow in reverse video with dark text on a dark ground. Here yellow on sketch is a dark olive (the palette solves every light hue to 6:1 ink), so a fill is brown. That is
          the owner's complaint, and no direction uses a yellow fill.
        </li>
        <li>
          <strong className="text-content-primary">Hue is not enough in print.</strong> Sketch's six hues all sit at 5.96 to 6.02:1 on the ground, so in greyscale they are one grey. Whatever separates
          string, number, function and type has to be weight, slant or position.
        </li>
        <li>
          <strong className="text-content-primary">Metrics.</strong> VS Code's editor defaults to 14px (12px on macOS) with line height 0, meaning 1.35 (1.5 on macOS) times the size. Zed's docs list a 15px buffer font.
          WCAG 1.4.12 asks that nothing breaks at line height 1.5, letter spacing 0.12em and word spacing 0.16em, so row heights must be minimums, not fixed. IBM Plex Mono advances 0.6em, the constant the
          board already uses. JetBrains Mono's page gives no size or leading numbers.
        </li>
        <li>
          <strong className="text-content-primary">Shiki's css-variables theme</strong> has only nine token variables (keyword, constant, string, string-expression, comment, function, parameter, punctuation, link).
          It cannot carry any of the highlight models; those are the renderer's job.
        </li>
      </ul>
      <details className="border-2 border-edge-default">
        <summary className="cursor-pointer bg-surface-sunken p-2 font-mono text-xs font-bold uppercase text-content-primary">What the code surfaces do today</summary>
        <div className="overflow-x-auto p-2">
          <table className="w-full border-collapse font-mono text-xs">
            <thead>
              <tr className="text-left text-content-muted">
                <th className="p-1 pr-3">Surface</th>
                <th className="p-1 pr-3">Size</th>
                <th className="p-1 pr-3">Leading</th>
                <th className="p-1 pr-3">Tab</th>
                <th className="p-1">Note</th>
              </tr>
            </thead>
            <tbody>
              {SURFACES.map((s) => (
                <tr key={s.surface} className="border-t border-edge-subtle align-top text-content-secondary">
                  <td className="p-1 pr-3 font-bold text-content-primary">{s.surface}</td>
                  <td className="p-1 pr-3">{s.size}</td>
                  <td className="p-1 pr-3">{s.leading}</td>
                  <td className="p-1 pr-3">{s.tab}</td>
                  <td className="p-1">{s.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <details className="border-2 border-edge-default">
        <summary className="cursor-pointer bg-surface-sunken p-2 font-mono text-xs font-bold uppercase text-content-primary">Sources</summary>
        <ul className="m-0 flex list-none flex-col gap-1 p-2 font-mono text-xs">
          {[
            ['tinted-theming base16 styling', 'https://github.com/tinted-theming/home/blob/main/styling.md'],
            ['Helix themes', 'https://docs.helix-editor.com/themes.html'],
            ['Zed theme schema', 'https://zed.dev/schema/themes/v0.2.0.json'],
            ['Zed configuration (buffer font size)', 'https://zed.dev/docs/configuring-zed'],
            ['VS Code theme colour reference', 'https://code.visualstudio.com/api/references/theme-color'],
            ['VS Code font defaults (fontInfo.ts)', 'https://raw.githubusercontent.com/microsoft/vscode/main/src/vs/editor/common/config/fontInfo.ts'],
            ['Alacritty config man page', 'https://raw.githubusercontent.com/alacritty/alacritty/master/extra/man/alacritty.5.scd'],
            ['Ghostty config reference', 'https://ghostty.org/docs/config/reference'],
            ['Gruvbox colours', 'https://github.com/morhetz/gruvbox/blob/master/colors/gruvbox.vim'],
            ['Solarized', 'https://ethanschoonover.com/solarized/'],
            ['Catppuccin style guide', 'https://github.com/catppuccin/catppuccin/blob/main/docs/style-guide.md'],
            ['Shiki theme colors', 'https://shiki.style/guide/theme-colors'],
            ['WCAG 1.4.12 Text Spacing', 'https://www.w3.org/WAI/WCAG21/Understanding/text-spacing.html'],
          ].map(([label, url]) => (
            <li key={url} className="text-content-secondary">
              {label}: <a href={url} className="break-all text-accent-primary">{url}</a>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function CheckList({ dir }: { dir: DirId }) {
  const checks = checksFor(dir);
  const fails = checks.filter((c) => !c.ok).length;
  return (
    <div className="flex flex-col gap-2">
      <p className="m-0 font-mono text-[11px] font-bold uppercase tracking-wider text-content-muted">{`[ Checks · ${checks.length - fails} pass, ${fails} fail ]`}</p>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {checks.map((c) => (
          <li key={c.title} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-2 text-sm">
            <span aria-hidden="true" className={`font-mono text-base font-bold leading-5 ${c.ok ? 'text-intent-success' : 'text-intent-danger'}`}>
              {c.ok ? '✓' : '✕'}
            </span>
            <span className="min-w-0">
              <span className="sr-only">{c.ok ? 'Pass: ' : 'Fail: '}</span>
              <span className="font-bold text-content-primary">{c.title}</span>
              <span className="block text-xs text-content-secondary">{c.reason}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Numbers({ dir }: { dir: DirId }) {
  return (
    <details className="border-2 border-edge-default">
      <summary className="cursor-pointer bg-surface-raised p-2 font-mono text-xs font-bold uppercase text-content-primary">The numbers</summary>
      <div className="flex flex-col gap-4 p-3">
        {LEVEL_IDS.map((l) => {
          const b = build(dir, l);
          const w = worstOnBands(b);
          return (
            <div key={l} className="flex flex-col gap-2">
              <p className="m-0 font-mono text-[11px] font-bold uppercase tracking-wider text-content-muted">{`[ ${l} · ground ${b.ground} · worst ${w.r.toFixed(2)}:1 ]`}</p>
              <div className="overflow-x-auto">
                <table className="border-collapse font-mono text-[11px]">
                  <thead>
                    <tr className="text-left text-content-muted">
                      <th className="p-1 pr-3">token</th>
                      <th className="p-1 pr-3">from</th>
                      <th className="p-1 pr-3">colour</th>
                      {b.bands.map((x) => (
                        <th key={x.name} className="p-1 pr-3">{x.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TOKS.map((t) => {
                      const s = b.tokens[t];
                      return (
                        <tr key={t} className="border-t border-edge-subtle text-content-secondary">
                          <td className="p-1 pr-3 text-content-primary">{t}</td>
                          <td className="p-1 pr-3">{s.from}{s.bold ? ' bold' : ''}{s.italic ? ' italic' : ''}</td>
                          <td className="p-1 pr-3">{s.colour}</td>
                          {b.bands.map((x) => {
                            const r = ratio(s.colour, x.flat);
                            return (
                              <td key={x.name} className="p-1 pr-3">
                                {r.toFixed(2)}{r < 4.5 ? ' ✕' : ''}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <ul className="m-0 list-none p-0 font-mono text-[11px] text-content-secondary">
                {b.notes.map((n) => (
                  <li key={n.band}>
                    <span className="text-content-primary">{n.band}:</span> {n.value}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </details>
  );
}

function Spec({ dir }: { dir: Direction }) {
  return (
    <details className="border-2 border-edge-default">
      <summary className="cursor-pointer bg-surface-raised p-2 font-mono text-xs font-bold uppercase text-content-primary">Token mapping and highlight model</summary>
      <div className="grid grid-cols-1 gap-4 p-3 md:grid-cols-2">
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-xs">
          {dir.mapping.map((r) => (
            <div key={r.token} className="col-span-2 grid grid-cols-subgrid">
              <dt className="text-content-muted">{r.token}</dt>
              <dd className="m-0 text-content-primary">{r.value}</dd>
            </div>
          ))}
        </dl>
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-xs">
          {dir.highlights.map((r) => (
            <div key={r.name} className="col-span-2 grid grid-cols-subgrid">
              <dt className="text-content-muted">{r.name}</dt>
              <dd className="m-0 text-content-primary">{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </details>
  );
}

function DirectionSection({ dir }: { dir: Direction }) {
  const m = METRICS[dir.id];
  return (
    <section id={dir.anchor} aria-labelledby={`${dir.anchor}-h`} className="flex scroll-mt-20 flex-col gap-5 border-t-4 border-double border-edge-strong pt-8">
      <header className="flex flex-col gap-2">
        <Eyebrow>{`[ ${dir.anchor} ]`}</Eyebrow>
        <h3 id={`${dir.anchor}-h`} className="m-0 font-display text-3xl font-extrabold uppercase text-content-primary">
          {dir.id}. {dir.name} <span className="font-mono text-sm font-normal normal-case text-content-muted">{dir.tag}</span>
        </h3>
        <p className="m-0 font-mono text-xs text-content-muted">
          {m.fs}px on {m.lh}px · gutter {m.gutterCh}ch{m.markerCh ? ` + ${m.markerCh}ch marks` : ''} · tab {m.tab} · tracking {m.tracking}
        </p>
      </header>
      <Pair>{(l) => <EditorFrame dir={dir.id} level={l} />}</Pair>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <p className="m-0 max-w-prose text-content-secondary">{dir.what}</p>
          <p className="m-0 max-w-prose text-sm text-content-secondary">
            <strong className="text-content-primary">Type:</strong> {dir.metricsWhy}
          </p>
          <p className="m-0 max-w-prose text-sm text-content-secondary">
            <strong className="text-content-primary">In print:</strong> {dir.print}
          </p>
          <p className="m-0 max-w-prose text-sm text-content-primary">
            <strong>Recommendation:</strong> {dir.recommend}
          </p>
        </div>
        <CheckList dir={dir.id} />
      </div>
      <div className="flex flex-col gap-2">
        <p className="m-0 font-mono text-[11px] font-bold uppercase tracking-wider text-content-muted">[ Greyscale strip · paper prints in sketch, D5-B ]</p>
        <Pair>{(l) => <EditorFrame dir={dir.id} level={l} grey />}</Pair>
      </div>
      <Spec dir={dir} />
      <Numbers dir={dir.id} />
      <ul className="m-0 flex list-none flex-col gap-1 p-0 font-mono text-xs text-content-secondary">
        {dir.sources.map((s) => (
          <li key={s.url}>
            {s.label}: <a href={s.url} className="break-all text-accent-primary">{s.url}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}

const cols = (m: Metrics) => MAX_COLS + m.gutterCh + m.padCh + m.markerCh;

function MetricsStrip() {
  const rows: { id: string; label: string; m: Metrics; tokens: DirId }[] = [
    { id: 'today', label: 'Today (CodeBlock)', m: METRICS.today, tokens: 'A' },
    { id: 'A', label: 'A. ANSI base16', m: METRICS.A, tokens: 'A' },
    { id: 'B', label: 'B. ANSI plus ink', m: METRICS.B, tokens: 'B' },
    { id: 'C', label: 'C. Cool core', m: METRICS.C, tokens: 'C' },
  ];
  return (
    <section id="R4-METRICS" aria-labelledby="R4-METRICS-h" className="flex scroll-mt-20 flex-col gap-4 border-t-4 border-double border-edge-strong pt-8">
      <header className="flex flex-col gap-2">
        <Eyebrow>[ R4-METRICS ]</Eyebrow>
        <h3 id="R4-METRICS-h" className="m-0 font-display text-3xl font-extrabold uppercase text-content-primary">Type metrics, same ten lines</h3>
        <p className="m-0 max-w-3xl text-content-secondary">
          Lines 11 to 20 of paginate.ts on midnight, at each direction's metrics, with no highlights. Today's row uses direction A's colours so only the metrics differ.
        </p>
      </header>
      <div data-theme="midnight" className="grid grid-cols-1 gap-4 bg-surface-base p-3 lg:grid-cols-2">
        {rows.map((r) => (
          <div key={r.id} data-r4-metrics={r.id} className="flex min-w-0 flex-col gap-1">
            <p className="m-0 font-mono text-xs font-bold text-content-primary">
              {r.label} <span className="font-normal text-content-muted">{r.m.fs}px / {r.m.lh}px</span>
            </p>
            <PlainTen tokensFrom={r.tokens} metrics={r.m} />
          </div>
        ))}
      </div>
      <details className="border-2 border-edge-default">
        <summary className="cursor-pointer bg-surface-raised p-2 font-mono text-xs font-bold uppercase text-content-primary">The numbers</summary>
        <div className="overflow-x-auto p-3">
          <table className="border-collapse font-mono text-[11px]">
            <thead>
              <tr className="text-left text-content-muted">
                {['', 'size', 'leading', 'ratio', 'tracking', 'gutter', 'marks', 'tab', 'columns', 'width', 'line numbers'].map((h) => (
                  <th key={h} className="p-1 pr-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-edge-subtle text-content-secondary">
                  <td className="p-1 pr-3 text-content-primary">{r.label}</td>
                  <td className="p-1 pr-3">{r.m.fs}px</td>
                  <td className="p-1 pr-3">{r.m.lh}px</td>
                  <td className="p-1 pr-3">{(r.m.lh / r.m.fs).toFixed(2)}</td>
                  <td className="p-1 pr-3">{r.m.tracking}</td>
                  <td className="p-1 pr-3">{r.m.gutterCh}ch</td>
                  <td className="p-1 pr-3">{r.m.markerCh}ch</td>
                  <td className="p-1 pr-3">{r.m.tab}</td>
                  <td className="p-1 pr-3">{cols(r.m)}</td>
                  <td className="p-1 pr-3">{Math.round(cols(r.m) * r.m.fs * 0.6)}px</td>
                  <td className="p-1 pr-3">{r.m.numberStyle}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="m-0 mt-2 font-mono text-[11px] text-content-muted">Width assumes IBM Plex Mono's 0.6em advance, the constant ink.ts calibrated, plus the gutter columns.</p>
        </div>
      </details>
    </section>
  );
}

/** Round 4: the code and text renderer, as three complete directions. */
export function Round4() {
  return (
    <section id="round-4" aria-labelledby="round-4-h" className="flex scroll-mt-20 flex-col gap-10">
      <header className="flex flex-col gap-3">
        <Eyebrow>[ ROUND 4 · SCAFFOLDING ]</Eyebrow>
        <h2 id="round-4-h" className="m-0 font-display text-4xl font-extrabold uppercase text-content-primary sm:text-5xl">
          Round 4: code renderer
        </h2>
        <p className="m-0 max-w-3xl text-lg text-content-secondary">
          The renderer is redesigned from the sixteen ANSI slots up, not tuned knob by knob. Each direction is complete: a token mapping, a highlight model for selection, find, current line, bracket,
          word, diff and diagnostics, and type metrics. Each is drawn on both levels and in greyscale. Pick one, or name the parts to combine.
        </p>
        <nav aria-label="Round 4 directions" className="border-2 border-edge-strong bg-surface-raised p-3 shadow-hard-md">
          <ul className="m-0 flex list-none flex-col gap-2 p-0 font-mono text-sm">
            {DIRECTIONS.map((d) => (
              <li key={d.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <a href={anchor(d.anchor)} className="font-bold text-accent-primary">{d.anchor}</a>
                <span className="text-content-primary">{d.name}</span>
                <span className="text-xs text-content-muted">{d.tag}</span>
              </li>
            ))}
            <li className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <a href={anchor('R4-METRICS')} className="font-bold text-accent-primary">R4-METRICS</a>
              <span className="text-content-primary">Type metrics, same ten lines</span>
            </li>
          </ul>
        </nav>
      </header>
      <Research />
      {DIRECTIONS.map((d) => (
        <DirectionSection key={d.id} dir={d} />
      ))}
      <MetricsStrip />
    </section>
  );
}
