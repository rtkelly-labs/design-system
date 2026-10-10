/**
 * The Design Manifesto — the brand outline's eight claims as a printed
 * document, each one shown beside the component that enforces it.
 *
 * This is the end-to-end proof of the PDF flow: `pnpm manifesto` renders it to
 * one self-contained HTML and `--pdf` prints that same HTML through Chromium
 * under print media. Nothing here decides anything the design system has not
 * already decided — the prose is condensed from `packages/design-system/DESIGN.md`
 * (quoted where a paraphrase would soften it), the examples are the report
 * vocabulary, and the paper rung is `sketch`, the rung DESIGN.md describes as
 * "warm paper, graphite ink".
 *
 * Every value is fixed: no clock, no randomness — the lint enforces it, and a
 * manifesto that changed on every render would be a strange kind of manifesto.
 */

import {
  Badge,
  Card,
  DataTable,
  Divider,
  DrawingSheet,
  IndexedSection,
  NoteBlock,
  ReportDocument,
  StatCard,
  Tag,
} from '@rtkelly13/design-system';

const CLAIMS = [
  { id: 'claim-a', index: 'A', title: 'The character, in one paragraph' },
  { id: 'claim-b', index: 'B', title: 'Two themes, not a light-and-dark pair' },
  { id: 'claim-c', index: 'C', title: 'Colour is addressed by job, never by appearance' },
  { id: 'claim-d', index: 'D', title: 'Contrast is arithmetic, and it is a gate' },
  { id: 'claim-e', index: 'E', title: 'Background hierarchy' },
  { id: 'claim-f', index: 'F', title: 'Form' },
  { id: 'claim-g', index: 'G', title: 'Type' },
  { id: 'claim-h', index: 'H', title: 'Voice' },
] as const;

function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="m-0 text-content-secondary">{children}</p>;
}

export default function Manifesto() {
  return (
    <ReportDocument
      title="Design Manifesto"
      subtitle="What this system believes, shown with the things that believe it."
      meta={[
        { label: 'Source', value: <code>packages/design-system/DESIGN.md</code> },
        { label: 'Paper', value: 'A4 · sketch' },
        { label: 'Sheet', value: <code>DS-MFST-01</code> },
      ]}
    >
      {/* Contents. The sample hides its nav on paper; a PDF wants its index, so
          this one prints. The letter tabs are the same letters the sheet's row
          ruler draws, and the same ones the sections wear. */}
      <nav aria-label="Contents" className="flex flex-wrap gap-2">
        {CLAIMS.map((claim) => (
          <Tag key={claim.id} text={`${claim.index} · ${claim.title}`} href={`#${claim.id}`} accent="quiet" />
        ))}
      </nav>

      <DrawingSheet columns={4} rows={CLAIMS.length}>
        <IndexedSection id={CLAIMS[0]!.id} index="A" title={CLAIMS[0]!.title}>
          <div className="flex flex-col gap-4">
            <Paragraph>
              <strong className="text-content-primary">Brutalist neon terminal.</strong> Hard edges
              and no rounding at all. Offset shadows that sit beside an element rather than blurring
              under it. Monospace and condensed display type. Bracketed labels. High-chroma accents
              on a near-black ground, or ink on warm paper. It should read as a CRT and a drafting
              table, not as a SaaS dashboard.
            </Paragraph>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-widest text-content-muted">
                What it is not:
              </span>
              {['soft shadows', 'gradients', 'rounded cards', 'Inter-on-white', 'an indigo accent', 'glassmorphism'].map(
                (thing) => (
                  <Badge key={thing} accent="danger">
                    no {thing}
                  </Badge>
                ),
              )}
            </div>
          </div>
        </IndexedSection>

        <IndexedSection id={CLAIMS[1]!.id} index="B" title={CLAIMS[1]!.title}>
          <div className="flex flex-col gap-4">
            <Paragraph>
              There are exactly two — <code>midnight</code> and <code>sketch</code> — and neither is
              derived from the other. <code>midnight</code> names a ground, <code>sketch</code> names
              a surface and a way of drawing on it; that keeps <code>dark</code> and{' '}
              <code>light</code> free as variants, and it is why no single transform produces one
              theme from the other. An inversion of neon-on-ink is neon-on-white, which is a third
              thing nobody wants.
            </Paragraph>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card>
                <p className="m-0 font-mono text-sm font-bold uppercase text-content-primary">midnight</p>
                <p className="m-0 mt-1 font-mono text-xs text-content-secondary">
                  Neon on blue-black. The signature, and the default.
                </p>
              </Card>
              <Card>
                <p className="m-0 font-mono text-sm font-bold uppercase text-content-primary">sketch</p>
                <p className="m-0 mt-1 font-mono text-xs text-content-secondary">
                  Warm paper, graphite ink, pen-coloured accents. Not the dark theme lightened; a
                  different drawing.
                </p>
              </Card>
            </div>
          </div>
        </IndexedSection>

        <IndexedSection id={CLAIMS[2]!.id} index="C" title={CLAIMS[2]!.title}>
          <div className="flex flex-col gap-4">
            <Paragraph>
              The single most important rule. A component says <code>bg-surface-raised</code> or{' '}
              <code>text-intent-danger</code>; it never says <code>cyan</code>. The lookup from role
              to hue is a real map, declared and checked, and a hue in component code is a defect.{' '}
              <code>accent</code> and <code>intent</code> are separate vocabularies: a red accent is
              a visual choice; a red intent says something is wrong.
            </Paragraph>
            <div className="flex flex-wrap items-center gap-2">
              <Badge accent="info">info</Badge>
              <Badge accent="success">success</Badge>
              <Badge accent="warning">warning</Badge>
              <Badge accent="danger">danger</Badge>
              <Badge accent="quiet">quiet</Badge>
              <span className="font-mono text-xs text-content-muted">
                — every meaning carries its word, never its colour alone
              </span>
            </div>
          </div>
        </IndexedSection>

        <IndexedSection id={CLAIMS[3]!.id} index="D" title={CLAIMS[3]!.title}>
          <div className="flex flex-col gap-4">
            <Paragraph>
              Colour is the one axis with a machine-checkable definition of correct, so it is
              checked: every pair on every theme, on every build, and the palette holds above AA on
              purpose because an editor draws selection behind the same tokens. Separation is
              measured in OKLab ΔE, not luma — ten hues at ΔE ≥ 0.04 apart, with luma spread
              1.000–1.009. If the gate fails, the colour is wrong, not the gate.
            </Paragraph>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard title="Pairs audited" value={260} subtitle="130 per theme" />
              <StatCard title="Hues" value={10} accent="warning" subtitle="the ceiling, not a middle" />
              <StatCard title="Min separation" value="0.04 ΔE" accent="success" subtitle="OKLab, not luma" />
            </div>
            <DataTable
              columns={[
                { header: 'Token group', accessor: 'group' },
                { header: 'Floor', accessor: 'floor' },
                { header: 'Why', accessor: 'why' },
              ]}
              data={[
                { group: 'text · accent · intent', floor: '4.5:1', why: 'WCAG AA' },
                { group: 'palette', floor: '5.5:1', why: 'room to tint the ground behind it' },
                { group: 'border strong/default', floor: '3:1', why: 'non-text UI, 1.4.11' },
                { group: 'border subtle', floor: '1.4:1', why: 'a hairline: visible, not accessible' },
              ]}
              keyExtractor={(row) => row.group}
            />
          </div>
        </IndexedSection>

        <IndexedSection id={CLAIMS[4]!.id} index="E" title={CLAIMS[4]!.title}>
          <div className="flex flex-col gap-4">
            <Paragraph>
              Four grounds per theme, each answering a different question — and elevation is carried
              by the shadow, not the background. Sketch's base-to-raised step is ΔE 0.037, barely
              visible on its own; that is correct by idiom, because a hard offset shadow and a 2px
              border do the work a subtle fill does in a soft design. Do not widen the ramp or
              invent a fourth surface.
            </Paragraph>
            <div className="flex flex-col gap-2 font-mono text-xs uppercase tracking-widest">
              <span className="border-2 border-edge-strong bg-surface-base px-3 py-2 text-content-primary">surface.base — the page itself</span>
              <span className="border-2 border-edge-strong bg-surface-raised px-3 py-2 text-content-primary shadow-hard-sm">surface.raised — panels, cards, menus</span>
              <span className="border-2 border-edge-strong bg-surface-sunken px-3 py-2 text-content-primary">surface.sunken — wells, code, inputs</span>
              <span className="border-2 border-edge-strong bg-surface-overlay px-3 py-2 text-content-primary">surface.overlay — the scrim, and the only alpha</span>
            </div>
          </div>
        </IndexedSection>

        <IndexedSection id={CLAIMS[5]!.id} index="F" title={CLAIMS[5]!.title}>
          <div className="flex flex-col gap-4">
            <Paragraph>
              Radius: zero, everywhere, non-negotiable — and it is a token on the Medium axis, not a
              reset, so <code>rounded-lg</code> is square without this package reaching into your
              document. Shadows are hard offsets, never blurred: <code>2px 2px 0</code>,{' '}
              <code>4px 4px 0</code>, <code>6px 6px 0</code>. Borders are drawn at 2px, not implied.
              Glow exists for the neon surfaces only.
            </Paragraph>
            <Card className="shadow-hard-md">
              <p className="m-0 font-mono text-xs uppercase tracking-widest text-content-muted">
                [ raised · 2px edge · hard shadow · 0 radius ]
              </p>
            </Card>
          </div>
        </IndexedSection>

        <IndexedSection id={CLAIMS[6]!.id} index="G" title={CLAIMS[6]!.title}>
          <div className="flex flex-col gap-4">
            <Paragraph>
              Four stacks — display, body, mono, pixel — and the fallback chains are load-bearing:
              when a web font has not loaded, the next entry decides the metrics. The text faces are
              latin-only, so a shipped symbol face draws every box rule, ✓ and ⌘, at the mono's
              600/1000 advance so column widths hold. Geometry and time ride a second axis, the
              Medium — web, video, graphic — and no token varies on both.
            </Paragraph>
            <div className="flex flex-col gap-3">
              <p className="m-0 font-display text-2xl font-bold uppercase text-content-primary">Display — Space Grotesk</p>
              <p className="m-0 font-sans text-base text-content-secondary">Body — Inter, with the symbols behind it.</p>
              <p className="m-0 font-mono text-sm text-content-secondary">Mono — IBM Plex Mono: ╱ ╲ │ ├ ─ ✓ ⌘</p>
              <p className="m-0 font-pixel text-lg text-content-secondary">Pixel — VT323</p>
            </div>
          </div>
        </IndexedSection>

        <IndexedSection id={CLAIMS[7]!.id} index="H" title={CLAIMS[7]!.title}>
          <div className="flex flex-col gap-4">
            <Paragraph>
              Terse. Technical. Lowercase in code contexts, UPPERCASE_SNAKE for terminal-flavoured
              labels. Bracketed section headings. No exclamation marks, no marketing adjectives, no
              "seamlessly" or "effortlessly". A control says exactly what happens.
            </Paragraph>
            <div className="flex flex-wrap items-center gap-2">
              <Badge accent="info">PUBLISH</Badge>
              <span className="font-mono text-content-muted">→</span>
              <Badge accent="success">PUBLISHED</Badge>
            </div>
            <NoteBlock type="important" title="If you are an agent building on this brand">
              Read the token files, not this prose, for values. Address roles. Test sketch; it is the
              one that breaks. Never pure black as a page ground. Contrast is a gate, not a
              guideline.
            </NoteBlock>
          </div>
        </IndexedSection>
      </DrawingSheet>

      <Divider />

      <p className="m-0 text-center font-mono text-xs uppercase tracking-widest text-content-muted">
        [ DS-MFST-01 · printed from the same HTML as the screen · sketch is the paper rung ]
      </p>
    </ReportDocument>
  );
}
