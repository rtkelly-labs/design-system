/**
 * The Design Manifesto — the brand outline's eight claims as an A4 print publication.
 *
 * Editorial base: poster-scale display type, generous spacing, and the theme following the job a
 * page does. Midnight pages are full-bleed statements (cover, claim C, the type specimen, the back
 * cover); sketch pages carry the evidence on hairlines. Borrowed from the drawing-set treatment:
 * a zone ruler under the running head, an engineering title block as the folio, and midnight proof
 * insets mounted on the paper pages — the CRT on the drafting table.
 *
 * Fill rule: sections keep their natural height and the page distributes the remaining space
 * between them (`justify-between`), so a page is full without stretching rows. Pages are
 * `min-h-[297mm]`: too much content grows the page and `ds-report --strict` fails on it.
 * Every value is fixed and deterministic; colours are roles only.
 */

import type { ReactNode } from 'react';
import { ThemeProvider, type ThemeLevel, AsciiGauge, Badge } from '@rtkelly13/design-system';

const SET = 'DS-MFST-01';
const REV = 'REV 2026.10';
const PAGES = 8;

const CLAIMS = [
  { index: 'A', page: '02', title: 'The character, in one paragraph' },
  { index: 'B', page: '02', title: 'Two themes, not a light-and-dark pair' },
  { index: 'C', page: '03', title: 'Colour is addressed by job, never by appearance' },
  { index: 'D', page: '04', title: 'Contrast is arithmetic, and it is a gate' },
  { index: 'E', page: '05', title: 'Background hierarchy' },
  { index: 'F', page: '05', title: 'Form' },
  { index: 'G', page: '06', title: 'Type' },
  { index: 'H', page: '07', title: 'Voice' },
] as const;

// ---------------------------------------------------------------------------------------------
// Page furniture
// ---------------------------------------------------------------------------------------------

/** The report owns its page box, so a midnight page bleeds to the trim. */
function PageBox() {
  return <style>{'@media print { @page { size: A4; margin: 0; } }'}</style>;
}

function Code({ children }: { children: ReactNode }) {
  return <code className="font-mono text-[0.8em] text-content-primary">{children}</code>;
}

function Kicker({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`font-mono text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-content-muted ${className}`}>{children}</span>;
}

function Body({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`m-0 font-sans text-[0.9375rem] leading-[1.6] text-content-secondary ${className}`}>{children}</p>;
}

/** Zone references across the top of the sheet, from the drawing set. Decorative. */
function Ruler() {
  return (
    <div aria-hidden="true" className="grid grid-cols-6 border-b border-edge-subtle">
      {[1, 2, 3, 4, 5, 6].map((z) => (
        <span key={z} className={`py-0.5 text-center font-mono text-[0.625rem] text-content-muted ${z > 1 ? 'border-l border-edge-subtle' : ''}`}>
          {z}
        </span>
      ))}
    </div>
  );
}

/** Engineering title block: the folio, identical in shape on both themes. */
function TitleBlock({ n, title, claims, source, level }: { n: number; title: string; claims: string; source: string; level: ThemeLevel }) {
  const cell = 'flex flex-col justify-center gap-0.5 border-l-2 border-edge-strong px-3 py-1.5';
  return (
    <footer className="grid grid-cols-[1.3fr_1.9fr_0.7fr_1.1fr_0.75fr] border-2 border-edge-strong font-mono text-content-primary">
      <div className="flex flex-col justify-center gap-0.5 px-3 py-1.5">
        <Kicker>{SET}</Kicker>
        <span className="text-xs font-bold">DESIGN MANIFESTO</span>
        <Kicker>{REV}</Kicker>
      </div>
      <div className={cell}>
        <Kicker>Section</Kicker>
        <span className="text-xs font-bold uppercase">{title}</span>
      </div>
      <div className={cell}>
        <Kicker>Claims</Kicker>
        <span className="text-xs font-bold">{claims}</span>
      </div>
      <div className={cell}>
        <Kicker>{level}</Kicker>
        <span className="text-xs">{source}</span>
      </div>
      <div className="flex items-center justify-center bg-content-primary px-3 text-content-inverse">
        <span className="font-display text-2xl font-bold leading-none">
          {String(n).padStart(2, '0')}
          <span className="text-base opacity-70">/{String(PAGES).padStart(2, '0')}</span>
        </span>
      </div>
    </footer>
  );
}

/**
 * One A4 page in its own rung: running head, zone ruler, a body whose sections are spread to
 * fill, and the title block.
 */
function Page({
  n,
  level,
  head,
  title,
  claims,
  source,
  fill = 'between',
  children,
}: {
  n: number;
  level: ThemeLevel;
  head: string;
  title: string;
  claims: string;
  source: string;
  /** `between` spreads the sections; `grow` lets one child carry `flex-1`. */
  fill?: 'between' | 'grow';
  children: ReactNode;
}) {
  return (
    <div data-plate={`page-${n}`} className={n === PAGES ? '' : 'break-after-page'}>
      <ThemeProvider scoped defaultLevel={level} className="flex min-h-[297mm] flex-col bg-surface-base px-[14mm] pb-[9mm] pt-[10mm] text-content-primary">
        <header className="flex items-center justify-between border-b-2 border-edge-strong pb-2">
          <Kicker className="text-content-primary">Design Manifesto</Kicker>
          <Kicker>{head}</Kicker>
        </header>
        <Ruler />
        <div className={`flex min-h-0 flex-1 flex-col py-5 ${fill === 'between' ? 'justify-between gap-5' : 'gap-6'}`}>{children}</div>
        <TitleBlock n={n} title={title} claims={claims} source={source} level={level} />
      </ThemeProvider>
    </div>
  );
}

/** Claim heading for evidence pages: a big letter in the rail, the claim as a display line. */
function ClaimHead({ index, title, section }: { index: string; title: string; section: string }) {
  return (
    <div id={`claim-${index.toLowerCase()}`} className="grid grid-cols-[5.5rem_1fr] items-end gap-4 border-b border-edge-default pb-3">
      <span className="font-display text-[5.5rem] font-bold leading-[0.8] text-content-primary">{index}</span>
      <div className="flex flex-col gap-1">
        <Kicker>{section}</Kicker>
        <h2 className="m-0 font-display text-[1.75rem] font-bold leading-[1.1] tracking-tight">{title}</h2>
      </div>
    </div>
  );
}

/** A midnight proof mounted on a paper page. */
function Inset({ label, className = '', children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <ThemeProvider scoped defaultLevel="midnight" className={`flex flex-col border-2 border-edge-strong bg-surface-base text-content-primary shadow-hard-md ${className}`}>
      <div className="flex items-center justify-between border-b border-edge-default px-3 py-1">
        <Kicker>{label}</Kicker>
        <Kicker>midnight</Kicker>
      </div>
      <div className="flex flex-1 flex-col p-3.5">{children}</div>
    </ThemeProvider>
  );
}

/** A hairline spec table: no box, a heavy rule on top, hairlines between natural-height rows. */
function Rules({ head, rows, cols, className = '' }: { head: readonly string[]; rows: readonly (readonly ReactNode[])[]; cols: string; className?: string }) {
  return (
    <div className={`flex flex-col border-t-2 border-edge-strong ${className}`}>
      <div className={`grid ${cols} gap-4 border-b border-edge-default py-1.5`}>
        {head.map((h) => (
          <Kicker key={h}>{h}</Kicker>
        ))}
      </div>
      <div className="flex flex-col divide-y divide-edge-subtle">
        {rows.map((row, i) => (
          <div key={i} className={`grid items-baseline ${cols} gap-4 py-2`}>
            {row.map((c, j) => (
              <span key={j} className={j === 0 ? 'font-mono text-sm font-bold text-content-primary' : 'font-sans text-[0.9375rem] leading-snug text-content-secondary'}>
                {c}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// The publication
// ---------------------------------------------------------------------------------------------

export default function ManifestoC() {
  return (
    <main className="w-full bg-surface-base font-sans text-content-primary">
      <PageBox />

      {/* 01 — COVER · midnight ----------------------------------------------------------- */}
      <Page n={1} level="midnight" head="Ryan Kelly · ryankelly.dev" title="Cover & contents" claims="A–H" source="DESIGN.md" fill="grow">
        <div className="flex flex-col gap-5">
          <Kicker className="text-accent-primary">[ The brand outline · eight claims ]</Kicker>
          <h1 className="m-0 font-display text-[7.25rem] font-bold uppercase leading-[0.86] tracking-[-0.02em]">
            Design
            <br />
            Manifesto
          </h1>
          <p className="m-0 max-w-[34rem] font-sans text-xl leading-snug text-content-secondary">
            What this system believes, shown with the exact primitives and mechanics that enforce it.
          </p>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-4 border-t-2 border-edge-strong">
          {CLAIMS.map((c, i) => (
            <a
              key={c.index}
              href={`#claim-${c.index.toLowerCase()}`}
              className={`flex items-center gap-4 border-b border-edge-default py-2 ${i % 2 ? 'pl-5' : 'border-r border-edge-default pr-5'}`}
            >
              <span className="font-display text-5xl font-bold leading-none text-accent-primary">{c.index}</span>
              <span className="flex flex-col gap-0.5">
                <span className="font-display text-base font-bold leading-tight">{c.title}</span>
                <Kicker>page {c.page}</Kicker>
              </span>
            </a>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Badge accent="info">TERMINAL BRUTALISM</Badge>
            <Badge accent="success">OKLAB AUDITED</Badge>
            <Badge accent="warning">0 RADIUS INVARIANT</Badge>
          </div>
          <Kicker>source · packages/design-system/DESIGN.md</Kicker>
        </div>
      </Page>

      {/* 02 — A & B · sketch ------------------------------------------------------------- */}
      <Page n={2} level="sketch" head="§1–2 · Identity & polarity" title="Identity & polarity" claims="A · B" source="DESIGN.md §1–2">
        <section className="flex flex-col gap-4">
          <ClaimHead index="A" title={CLAIMS[0].title} section="§1 · character" />
          <div className="grid grid-cols-[1.6fr_1fr] gap-6">
            <p className="m-0 font-sans text-base leading-[1.55] text-content-primary">
              <strong>Brutalist neon terminal.</strong> Hard edges and no rounding at all. Offset shadows that sit beside an element rather than blurring under
              it. Monospace and condensed display type. Bracketed labels. High-chroma accents on a near-black ground, or ink on warm paper. It should read as
              a CRT and a drafting table, not as a SaaS dashboard.
            </p>
            <div className="flex flex-col gap-1 border-l-2 border-intent-danger pl-4">
              <Kicker className="text-intent-danger">What it is not</Kicker>
              {['soft shadows', 'gradients', 'rounded cards', 'Inter-on-white', 'an indigo accent', 'glassmorphism', 'emoji as section markers'].map((t) => (
                <span key={t} className="font-mono text-[0.8125rem] text-content-secondary line-through decoration-intent-danger decoration-2">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <Inset label="[ bracketed labels ]">
            <div className="flex items-center justify-between font-mono text-sm">
              <span className="text-accent-primary">[ LATEST POSTS ]</span>
              <span className="text-accent-secondary">&gt; FULL_STACK_ENGINEER.exe</span>
              <span className="border-2 border-edge-strong bg-surface-raised px-2 py-0.5 text-xs shadow-hard-sm">2px edge · offset 4px</span>
            </div>
          </Inset>
        </section>
        <section className="flex flex-col gap-4">
          <ClaimHead index="B" title={CLAIMS[1].title} section="§2 · levels" />
          <Body>
            There are exactly two, and neither is derived from the other. <Code>midnight</Code> names a ground; <Code>sketch</Code> names a surface and a way
            of drawing on it. Neither is a synonym for its polarity — which keeps <Code>polarity</Code> a real declared property, keeps a third level cheap,
            and leaves the <Code>dark:</Code> and <Code>light:</Code> variants free.
          </Body>
        </section>
        <section className="flex flex-col gap-3">
          <div className="grid grid-cols-2 border-2 border-edge-strong">
            {(['midnight', 'sketch'] as const).map((lvl) => (
              <ThemeProvider key={lvl} scoped defaultLevel={lvl} className="flex flex-col gap-2.5 bg-surface-base p-3.5 text-content-primary">
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-3xl font-bold uppercase leading-none">{lvl}</span>
                  <Kicker>{lvl === 'midnight' ? 'dark · default' : 'light · paper'}</Kicker>
                </div>
                <p className="m-0 font-sans text-[0.8125rem] leading-snug text-content-secondary">
                  {lvl === 'midnight'
                    ? 'Neon on blue-black. High-chroma accents. The signature, and the default.'
                    : 'Warm paper, graphite ink, pen-coloured accents. Not the dark theme lightened; a different drawing.'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge accent="info">info</Badge>
                  <Badge accent="success">success</Badge>
                  <Badge accent="warning">warning</Badge>
                  <Badge accent="danger">danger</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className={`border-2 border-edge-strong bg-surface-raised px-2 py-2 font-mono text-xs shadow-hard-sm ${lvl === 'midnight' ? 'outline-2 outline-offset-2 outline-dashed outline-accent-primary' : ''}`}>
                    raised{lvl === 'midnight' ? ' · tightest' : ''}
                  </span>
                  <span className={`border-2 border-edge-strong bg-surface-sunken px-2 py-2 font-mono text-xs ${lvl === 'sketch' ? 'outline-2 outline-offset-2 outline-dashed outline-accent-primary' : ''}`}>
                    sunken{lvl === 'sketch' ? ' · tightest' : ''}
                  </span>
                </div>
              </ThemeProvider>
            ))}
          </div>
          <Body className="text-[0.8125rem]">
            Opposite tightest grounds — dark&apos;s is its <Code>raised</Code> surface, light&apos;s is its <Code>sunken</Code> — so no single transform produces
            one from the other. An inversion of neon-on-ink is neon-on-white, a third thing nobody wants.
          </Body>
        </section>
      </Page>

      {/* 03 — C · midnight: the single most important rule ------------------------------ */}
      <Page n={3} level="midnight" head="§3 · Colour" title="Colour roles & intent" claims="C" source="DESIGN.md §3">
        <section id="claim-c" className="flex flex-col gap-4">
          <Kicker className="text-accent-primary">Claim C · the single most important rule</Kicker>
          <h2 className="m-0 font-display text-[4.2rem] font-bold leading-[0.95] tracking-tight">
            Colour is addressed by <span className="text-accent-primary">job</span>, never by appearance.
          </h2>
          <p className="m-0 max-w-[36rem] font-sans text-lg leading-snug text-content-secondary">
            A component says <Code>bg-surface-raised</Code> or <Code>text-intent-danger</Code>. It never says <Code>cyan</Code>.
          </p>
        </section>
        <pre className="m-0 border-y-2 border-edge-strong py-4 font-mono text-[0.875rem] leading-[1.7] text-content-primary">
          {'Components  ──►  Roles  ──►  Hues\n'}
          <span className="text-content-muted">{'                  via accentHue / intentHue — declared, never inferred\n'}</span>
          <span className="text-intent-danger">{'Components  ──✗──►  Hues'}</span>
          <span className="text-content-muted">{'        a hue in component code is a defect'}</span>
        </pre>
        <section className="grid grid-cols-[1.45fr_1fr] gap-6">
          <Rules
            cols="grid-cols-[4.5rem_1fr]"
            head={['Role', 'Members → job']}
            rows={[
              ['surface', 'base · raised · sunken · overlay → grounds'],
              ['text', 'primary · secondary · muted · inverse → ink'],
              ['border', 'strong · default · subtle → edges'],
              ['accent', 'primary · secondary · tertiary · quiet → emphasis, no meaning'],
              ['intent', 'info · success · warning · danger → meaning'],
            ]}
          />
          <div className="flex flex-col gap-4 border-t-2 border-edge-strong pt-2">
            <div className="flex flex-col gap-2">
              <Kicker>accent · emphasis</Kicker>
              <div className="grid grid-cols-4 gap-1.5">
                <span className="h-9 border-2 border-edge-strong bg-accent-primary" />
                <span className="h-9 border-2 border-edge-strong bg-accent-secondary" />
                <span className="h-9 border-2 border-edge-strong bg-accent-tertiary" />
                <span className="h-9 border-2 border-edge-strong bg-accent-quiet" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Kicker>intent · meaning, always worded</Kicker>
              <div className="flex flex-wrap gap-1.5">
                <Badge accent="info">info</Badge>
                <Badge accent="success">success</Badge>
                <Badge accent="warning">warning</Badge>
                <Badge accent="danger">danger</Badge>
              </div>
            </div>
            <p className="m-0 font-sans text-[0.8125rem] leading-snug text-content-secondary">
              Emphasis is not meaning: a red <em>accent</em> is a visual choice, a red <em>intent</em> says something is wrong. <Code>check:contrast</Code>{' '}
              asserts every role holds its declared hue, so the vocabularies cannot drift.
            </p>
          </div>
        </section>
        <section className="flex flex-col gap-1.5">
          <Kicker>Beneath the roles · ten hues for targets with no notion of jobs · never addressed by a component</Kicker>
          <div className="grid grid-cols-10 border-t border-edge-default pt-1.5 font-mono text-xs">
            {[
              ['red', '17°'],
              ['orange', '58°'],
              ['yellow', '92°'],
              ['green', '142°'],
              ['teal', '163°'],
              ['cyan', '212°'],
              ['blue', '233°'],
              ['violet', '295°'],
              ['magenta', '328°'],
              ['pink', '354°'],
            ].map(([n, a]) => (
              <span key={n} className="flex flex-col">
                <span className="font-bold text-content-primary">{n}</span>
                <span className="text-content-muted">{a}</span>
              </span>
            ))}
          </div>
        </section>
      </Page>

      {/* 04 — D · sketch: the measurements ----------------------------------------------- */}
      <Page n={4} level="sketch" head="§4 · Contrast" title="Arithmetic contrast gates" claims="D" source="DESIGN.md §4">
        <section className="flex flex-col gap-5">
          <ClaimHead index="D" title={CLAIMS[3].title} section="§4 · arithmetic" />
          <div className="grid grid-cols-4">
            {[
              ['260', 'pairs audited', '130 per theme'],
              ['10', 'hues', 'the ceiling, not the middle'],
              ['0.04', 'min ΔE, OKLab', 'tightest pair 0.049'],
              ['5.5:1', 'palette floor', 'above AA on purpose'],
            ].map(([v, k, s], i) => (
              <div key={k} className={`flex flex-col gap-1 ${i ? 'border-l border-edge-subtle pl-4' : ''}`}>
                <span className="font-display text-[3rem] font-bold leading-none tracking-tight">{v}</span>
                <Kicker className="text-content-primary">{k}</Kicker>
                <span className="font-sans text-xs text-content-secondary">{s}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="flex flex-col gap-4">
          <Body>
            Colour is the one axis with a machine-checkable definition of correct, so it is checked. <Code>pnpm check:contrast</Code> audits every pair on
            every theme on every build and fails CI. If the gate fails, the colour is wrong — not the gate.
          </Body>
          <Rules
            cols="grid-cols-[12.5rem_3.5rem_1fr]"
            head={['Token group', 'Floor', 'Why']}
            rows={[
              ['text · accent · intent', '4.5:1', 'WCAG AA'],
              ['palette', '5.5:1', 'an editor draws selection, diff and find-match grounds behind these tokens; a palette solved to exactly 4.5 has no room to tint them'],
              ['palette.bright', '4.5:1', 'emphasis, not body text'],
              ['border strong · default', '3:1', 'non-text UI, WCAG 1.4.11'],
              ['border subtle', '1.4:1', 'decorative hairline — visible, not accessible'],
            ]}
          />
        </section>
        <Inset label="[ gate ledger ]">
          <div className="flex flex-col gap-1.5 font-mono text-[0.8125rem]">
            {(
              [
                ['web floors · gates CI', 260, 260, 'success', '260/260 pass'],
                ['selection devices', 24, 24, 'success', '24/24 pass'],
                ['role → hue agreement', 16, 16, 'success', '16/16 pass'],
                ['7:1 frame · video/graphic', 210, 260, 'warning', '50 below · not gated'],
              ] as const
            ).map(([label, v, max, accent, verdict]) => (
              <div key={label} className="grid grid-cols-[13.5rem_1fr_11rem] items-center gap-3">
                <span className="text-content-secondary">{label}</span>
                <AsciiGauge label={label} value={v} max={max} length={16} accent={accent} />
                <span className={`text-right font-bold uppercase ${accent === 'success' ? 'text-intent-success' : 'text-intent-warning'}`}>{verdict}</span>
              </div>
            ))}
          </div>
        </Inset>
        <section className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-1">
            <Kicker className="text-content-primary">Separation is ΔE, not luma</Kicker>
            <Body className="text-[0.875rem]">
              Solving hues to one contrast equalises their luma by construction — the spread across these ten is 1.000–1.009, so a luma test rates them
              identical. An eleventh candidate landed at ΔE 0.024 and was dropped.
            </Body>
          </div>
          <div className="flex flex-col gap-1">
            <Kicker className="text-content-primary">The floor is medium-keyed</Kicker>
            <Body className="text-[0.875rem]">
              Values do not vary by medium; floors do. Under the 7:1 video and graphic floors 50 of 260 pairs fall short — deliberate, since only the web run
              gates CI. If the palette moves, those 50 move first.
            </Body>
          </div>
        </section>
      </Page>

      {/* 05 — E & F · sketch ------------------------------------------------------------- */}
      <Page n={5} level="sketch" head="§5–6 · Grounds & form" title="Surfaces & geometric form" claims="E · F" source="DESIGN.md §5–6">
        <section className="flex flex-col gap-4">
          <ClaimHead index="E" title={CLAIMS[4].title} section="§5 · four grounds" />
          <Body>
            Four grounds per theme, each answering a different question — not decoration. <strong className="text-content-primary">Elevation is carried by
            the shadow, not the background:</strong> sketch&apos;s base-to-raised step is ΔE 0.037, barely visible alone, so a 6px offset shadow and a 2px
            border do the work a subtle fill does in a soft design.
          </Body>
        </section>
        <section className="flex flex-col gap-3">
          <div className="grid grid-cols-2 border-2 border-edge-strong">
            {(['midnight', 'sketch'] as const).map((lvl) => (
              <ThemeProvider key={lvl} scoped defaultLevel={lvl} className="flex flex-col gap-2 bg-surface-base p-3.5 text-content-primary">
                <Kicker>{lvl}</Kicker>
                <span className="border-2 border-edge-strong bg-surface-base px-3 py-2 font-mono text-xs">base — the page itself</span>
                <span className="border-2 border-edge-strong bg-surface-raised px-3 py-2 font-mono text-xs shadow-hard-md">raised — panels, cards, menus</span>
                <span className="border-2 border-edge-strong bg-surface-sunken px-3 py-2 font-mono text-xs">sunken — wells, code, inputs</span>
                <span className="relative border-2 border-edge-strong bg-surface-base px-3 py-2 font-mono text-xs">
                  <span className="absolute inset-0 bg-surface-overlay" />
                  <span className={`relative ${lvl === 'sketch' ? 'text-content-inverse' : 'text-content-primary'}`}>
                    overlay — scrim · ink: {lvl === 'sketch' ? 'inverse' : 'primary'}
                  </span>
                </span>
              </ThemeProvider>
            ))}
          </div>
          <Body className="text-[0.875rem]">
            <strong className="text-content-primary">The light scrim inverts which ink applies.</strong> Over sketch&apos;s page the overlay is a mid-grey on
            which <Code>text.primary</Code> scores 2.3–2.5:1 and fails while <Code>text.inverse</Code> scores 5.4–5.9:1 — the opposite of midnight.
          </Body>
        </section>
        <section className="flex flex-col gap-4">
          <ClaimHead index="F" title={CLAIMS[5].title} section="§6 · geometry" />
          <div className="grid grid-cols-[1.5fr_1fr] gap-6">
            <Rules
              cols="grid-cols-[4.5rem_1fr]"
              head={['', 'Rule']}
              rows={[
                ['Radius', 'Zero. Everywhere. Non-negotiable — the most recognisable single property.'],
                ['Shadows', 'Hard offsets, never blurred: 2px, 4px, 6px.'],
                ['Borders', '2px is the load-bearing weight. Edges are drawn, not implied.'],
                ['Glow', 'For the neon surfaces only. Not for UI chrome.'],
              ]}
            />
            <Inset label="[ offsets ]">
              <div className="flex flex-1 flex-col justify-between gap-3 pr-2">
                {[
                  ['shadow-hard-sm', '2px 2px 0'],
                  ['shadow-hard-md', '4px 4px 0'],
                  ['shadow-hard-lg', '6px 6px 0'],
                ].map(([sh, l]) => (
                  <span key={l} className={`border-2 border-edge-strong bg-surface-raised px-3 py-1.5 font-mono text-xs ${sh}`}>
                    {l} · radius 0
                  </span>
                ))}
              </div>
            </Inset>
          </div>
        </section>
      </Page>

      {/* 06 — G · midnight: the type specimen --------------------------------------------- */}
      <Page n={6} level="midnight" head="§7 · Type" title="Typography" claims="G" source="DESIGN.md §7" fill="grow">
        <div id="claim-g" className="flex flex-col gap-1 border-b border-edge-default pb-3">
          <Kicker className="text-accent-primary">Claim G · type</Kicker>
          <h2 className="m-0 font-display text-[3rem] font-bold leading-none tracking-tight">Four stacks. Load-bearing fallbacks.</h2>
        </div>
        <div className="grid min-h-0 flex-1 grid-rows-[1.35fr_1fr_1.2fr_1fr] divide-y divide-edge-default">
          {[
            [
              'Display',
              'Space Grotesk → Inter → symbols → sans-serif',
              <span key="d" className="font-display text-[5.25rem] font-bold uppercase leading-[0.9] tracking-tight">
                Hard
                <br />
                edges
              </span>,
            ],
            [
              'Body',
              'Inter → symbols → system sans',
              <span key="b" className="font-sans text-[1.75rem] leading-[1.2] text-content-secondary">
                Offset shadows sit beside an element rather than blurring under it.
              </span>,
            ],
            [
              'Mono',
              'IBM Plex Mono → symbols → Courier New',
              <pre key="m" className="m-0 font-mono text-[1.05rem] leading-[1.35] text-content-primary">
                {'tokens/\n├── palette.midnight.tokens.json\n├── palette.sketch.tokens.json\n└── DTCG 2025.10 · 600/1000 advance'}
              </pre>,
            ],
            ['Pixel', 'VT323 → symbols → monospace', <span key="p" className="font-pixel text-[3.75rem] leading-none text-accent-primary">&gt; READY_ 8/8</span>],
          ].map(([role, stack, sample]) => (
            <div key={role as string} className="grid grid-cols-[9.5rem_1fr] items-center gap-4">
              <div className="flex flex-col gap-1">
                <span className="font-mono text-sm font-bold uppercase">{role}</span>
                <span className="font-sans text-xs leading-snug text-content-muted">{stack}</span>
              </div>
              {sample}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 border-t-2 border-edge-strong pt-3">
          <p className="m-0 font-sans text-[0.875rem] leading-snug text-content-secondary">
            The text faces are latin-only, and no symbol reaches the operating system. DS Symbols draws every box rule, ✓ and ⌘ at the mono&apos;s 600/1000
            advance, so box drawing keeps the column width. <Code>check:fonts</Code> fails on any character with no shipped glyph.
          </p>
          <div className="grid grid-cols-[9.5rem_1fr_1fr_1fr] gap-4 border-t border-edge-default pt-3">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-sm font-bold uppercase">Two axes</span>
              <span className="font-sans text-xs leading-snug text-content-muted">Level varies colour, at runtime. Medium varies geometry and time, at build.</span>
            </div>
            {[
              ['web', 'CSS pixels, wall clock — the one theme.css carries'],
              ['video', 'a fixed 1920×1080 frame, frame clock; its own type steps'],
              ['graphic', 'a fixed viewBox, no time base'],
            ].map(([m, d]) => (
              <div key={m} className="flex flex-col gap-1 border-l border-edge-default pl-3">
                <span className="font-display text-xl font-bold leading-none">{m}</span>
                <span className="font-sans text-xs leading-snug text-content-secondary">{d}</span>
              </div>
            ))}
          </div>
        </div>
      </Page>

      {/* 07 — H & §9 · sketch ------------------------------------------------------------ */}
      <Page n={7} level="sketch" head="§8–9 · Voice & protocol" title="Voice & agent protocol" claims="H · §9" source="DESIGN.md §8–9">
        <section className="flex flex-col gap-4">
          <ClaimHead index="H" title={CLAIMS[7].title} section="§8 · voice" />
          <div className="grid grid-cols-[1.3fr_1fr] gap-6">
            <p className="m-0 font-sans text-[1.0625rem] leading-[1.55] text-content-primary">
              Terse. Technical. Lowercase in code contexts, <Code>UPPERCASE_SNAKE</Code> for terminal-flavoured labels. Bracketed section headings. No
              exclamation marks, no marketing adjectives, no &ldquo;seamlessly&rdquo; or &ldquo;effortlessly&rdquo;.
            </p>
            <Inset label="[ voice test ]">
              <div className="flex flex-1 flex-col justify-center gap-3">
                <div className="flex items-center gap-2">
                  <Badge accent="info">PUBLISH</Badge>
                  <span className="font-mono text-content-muted">→</span>
                  <Badge accent="success">PUBLISHED</Badge>
                </div>
                <span className="font-mono text-xs text-content-primary">Audit completed. 260 token pairs verified. 0 defects detected.</span>
              </div>
            </Inset>
          </div>
        </section>
        <Rules
          cols="grid-cols-[1fr_1fr]"
          head={['Write', 'Never']}
          rows={[
            ['[ LATEST POSTS ] — bracketed headings', 'exclamation marks'],
            ['UPPERCASE_SNAKE — terminal labels', 'marketing adjectives'],
            ['bg-surface-raised — lowercase in code', '“seamlessly”, “effortlessly”'],
          ]}
        />
        <section className="flex flex-col gap-1">
          <div className="flex flex-col gap-1 border-b border-edge-default pb-3">
            <Kicker>§9 · protocol</Kicker>
            <h2 className="m-0 font-display text-[1.75rem] font-bold leading-[1.1] tracking-tight">If you are an agent building on this brand</h2>
          </div>
          <ol className="m-0 grid list-none grid-cols-2 gap-x-6 p-0">
            {[
              ['Token files over prose', 'Read tokens/palette.<theme>.tokens.json for values, not this prose.', 'tokens'],
              ['Address roles, not hues', 'If you find yourself writing a hue name in a component, stop.', 'claim C'],
              ['Geometric invariants', 'Zero radius, hard offset shadows, 2px borders.', 'claim F'],
              ['Both themes, always', 'Test sketch; it is the one that breaks.', 'claim B'],
              ['No pure black page ground', 'surface.base on dark is a near-black, never fixed.black. Nothing declared is darker than the darkest ground.', 'claim E'],
              ['Contrast is a gate', 'If pnpm check:contrast fails, the colour is wrong — not the gate.', 'claim D'],
            ].map(([title, rule, ref], i) => (
              <li key={title} className="grid grid-cols-[3rem_1fr] items-start gap-3 border-b border-edge-subtle py-3">
                <span className="font-display text-[2.25rem] font-bold leading-none text-content-muted">{String(i + 1).padStart(2, '0')}</span>
                <span className="flex flex-col gap-1">
                  <span className="font-display text-lg font-bold uppercase leading-tight text-content-primary">{title}</span>
                  <span className="font-sans text-[0.875rem] leading-snug text-content-secondary">{rule}</span>
                  <Kicker>→ {ref}</Kicker>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </Page>

      {/* 08 — BACK COVER · midnight ------------------------------------------------------ */}
      <Page n={8} level="midnight" head="Colophon" title="Enforcement & colophon" claims="§9" source="DESIGN.md §9">
        <section className="flex flex-col gap-3">
          <Kicker className="text-accent-primary">[ Enforcement in pipelines ]</Kicker>
          <h2 className="m-0 font-display text-[4.6rem] font-bold leading-[0.95] tracking-tight">
            Unaligned primitives <span className="text-intent-danger">fail closed.</span>
          </h2>
        </section>
        <section className="flex flex-col divide-y divide-edge-default border-y-2 border-edge-strong">
          {[
            ['pnpm check:tokens', 'hue-named call sites, budget 0 — a colour is addressed by its job'],
            ['pnpm check:contrast', 'every role pair on every level, as arithmetic'],
            ['pnpm check:fonts', 'every rendered character has a shipped glyph in one of the four stacks'],
            ['visual ratchets', 'Playwright snapshots, pinned image, zero-pixel diff'],
          ].map(([cmd, what]) => (
            <div key={cmd} className="grid grid-cols-[17rem_1fr] items-center gap-4 py-5">
              <span className="font-mono text-xl font-bold text-accent-primary">{cmd}</span>
              <span className="font-sans text-base leading-snug text-content-secondary">{what}</span>
            </div>
          ))}
        </section>
        <section className="grid grid-cols-4">
          {[
            ['0px', 'radius'],
            ['2px', 'borders'],
            ['2·4·6', 'hard offsets'],
            ['5.5:1', 'palette floor'],
          ].map(([v, k], i) => (
            <div key={k} className={`flex flex-col gap-1 ${i ? 'border-l border-edge-default pl-4' : ''}`}>
              <span className="font-display text-[3rem] font-bold leading-none">{v}</span>
              <Kicker>{k}</Kicker>
            </div>
          ))}
        </section>
        <section className="flex flex-col gap-5">
          <div className="grid grid-cols-4 border-t border-edge-default pt-3">
            {[
              ['Origin', 'packages/design-system/DESIGN.md'],
              ['Machine form', 'tokens/palette.<level>.tokens.json'],
              ['Verification', 'GATE PASSED (260/260)'],
              ['Distribution', 'unrestricted / public'],
            ].map(([k, v], i) => (
              <div key={k} className={`flex flex-col gap-1 ${i ? 'border-l border-edge-default pl-4' : ''} pr-2`}>
                <Kicker>{k}</Kicker>
                <span className={`break-words font-mono text-xs ${i === 2 ? 'font-bold text-intent-success' : 'text-content-secondary'}`}>{v}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between bg-content-primary px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest text-content-inverse">
            <span>{SET} · end of document</span>
            <span>approved for production print</span>
          </div>
        </section>
      </Page>
    </main>
  );
}
