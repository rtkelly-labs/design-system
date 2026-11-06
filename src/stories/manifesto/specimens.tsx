import { Fragment, useState } from 'react';
import type { ReactNode } from 'react';
import { ThemeProvider } from '../../components/ThemeProvider';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Input } from '../../components/Input';
import { Tag } from '../../components/Tag';
import { Divider } from '../../components/Divider';
import { NoteBlock } from '../../components/NoteBlock';
import { StatCard } from '../../components/StatCard';
import { BracketText } from '../../components/BracketText';
import { CodeTab, CodeTabs } from '../../components/docs/CodeTabs';
import { PageTitle } from '../../components/PageTitle';
import { LEVELS, PALETTE_HUES, THEME_LEVELS } from '../../theme/levels';
import type { LevelDefinition, ThemeLevel } from '../../theme/levels';
import { auditContrast, contrastRatio, MINIMUM_RATIO } from '../../theme/contrast';
import { ANSI_SLOTS, ansiScheme } from '../../theme/ansi';
import { MEDIA, MEDIA_DEFINITIONS } from '../../theme/media';
import type { Medium } from '../../theme/media';
import { semanticTokens } from '../../lib/theme';
import type { Emphasis, HueRef, Intent, Surface } from '../../lib/theme';

/**
 * Live specimens for the manifesto.
 *
 * Every number, name and swatch on this page is read from `src/theme/levels.ts`
 * or computed by `src/theme/contrast.ts` at render time. Nothing is transcribed
 * from `DESIGN.md` — a value that drifts from the ladder shows up here as a
 * changed page rather than as stale prose, and a new Level or Role appears in
 * these specimens without this file being edited.
 */

const MONO = { fontFamily: semanticTokens.font.mono } as const;
const DISPLAY = { fontFamily: semanticTokens.font.display } as const;

/**
 * The orientation block. Kept here rather than in the MDX so it is a story like
 * every other specimen, and so the vocabulary it lists stays next to the code
 * that reads it.
 */
export function SystemFacts() {
  return (
    <dl
      className="grid gap-x-6 gap-y-2 sm:grid-cols-[max-content_1fr]"
      style={MONO}
    >
      {(
        [
          ['origin', 'src/theme/levels.ts — the only place a colour is written'],
          ['levels', `${THEME_LEVELS.length}, independently authored; neither derived from the other`],
          ['roles', 'surface · text · border · accent · intent'],
          ['hues', `${PALETTE_HUES.length}, declared beneath the roles and never addressed by a component`],
          ['media', `${MEDIA.join(' · ')} — geometry and time, picked at build time`],
          ['emitted', 'CSS custom properties · DTCG token files · sixteen ANSI slots'],
        ] as const
      ).map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="text-caption tracking-[0.1em] text-accent-primary uppercase">{key}</dt>
          <dd className="text-caption text-content-secondary">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A hue's real floor is the tightest of the three grounds it may sit on. */
function tightestRatio(colour: string, def: LevelDefinition): number {
  return Math.min(
    contrastRatio(colour, def.surface.base),
    contrastRatio(colour, def.surface.raised),
    contrastRatio(colour, def.surface.sunken),
  );
}

function Swatch({ value, size = '2rem' }: { value: string; size?: string }) {
  return (
    <span
      className="block flex-none border-2 border-edge-strong"
      style={{ width: size, height: size, backgroundColor: value }}
    />
  );
}

/** Column headers for the per-level specimens, so the pair is never hardcoded. */
function LevelColumns({ render }: { render: (level: ThemeLevel) => ReactNode }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {THEME_LEVELS.map((level) => (
        <div key={level} className="flex flex-col gap-3">
          <span className="text-caption tracking-[0.16em] text-content-muted uppercase" style={MONO}>
            {LEVELS[level].label} · {LEVELS[level].polarity}
          </span>
          {render(level)}
        </div>
      ))}
    </div>
  );
}

/**
 * The two levels, each rendering the same components under its own scoped
 * provider — the claim "neither is derived from the other" shown rather than
 * asserted. Nothing here names a level; both come from `THEME_LEVELS`.
 */
export function LevelDiptych() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {THEME_LEVELS.map((level) => (
        <ThemeProvider
          key={level}
          scoped
          defaultLevel={level}
          persist={false}
          followSystem={false}
          className="flex flex-col gap-4 border-2 border-edge-strong bg-surface-base p-5 text-content-primary"
        >
          <div className="flex flex-col gap-1">
            <span className="text-caption tracking-[0.18em] text-content-muted uppercase" style={MONO}>
              {LEVELS[level].polarity}
            </span>
            <span className="text-title font-bold" style={DISPLAY}>
              <BracketText>{LEVELS[level].label}</BracketText>
            </span>
            <span className="text-caption text-content-secondary">{LEVELS[level].description}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge>ROLES</Badge>
            <Tag text="tokens" accent="secondary" />
            <Button size="sm" bracketed>
              ACTION
            </Button>
          </div>

          <Card panel title="Raised surface" description="Border, shadow and ground all follow the level." />
          <Input label="INPUT" placeholder="value" helperText="Sunken ground, 2px edge." />
          <Divider />
          <div className="grid grid-cols-2 gap-3">
            <StatCard title="CONTRAST PAIRS" value={AUDIT.length} change="gated" changeType="positive" />
            <StatCard title="RADIUS" value="0" change="non-negotiable" changeType="neutral" />
          </div>
        </ThemeProvider>
      ))}
    </div>
  );
}

/**
 * Roles → Hues, as the declared lookup rather than a resemblance. Each row
 * shows the Role's own value beside the Hue it declares, and the Hue's value:
 * where the two swatches match, `check:contrast` is what holds them together.
 */
export function RoleLookup() {
  return (
    <LevelColumns
      render={(level) => {
        const def = LEVELS[level];
        const rows: readonly (readonly [string, string, HueRef])[] = [
          ...(Object.keys(def.accent) as Emphasis[]).map(
            (role) => [`accent.${role}`, def.accent[role], def.accentHue[role]] as const,
          ),
          ...(Object.keys(def.intent) as Intent[]).map(
            (role) => [`intent.${role}`, def.intent[role], def.intentHue[role]] as const,
          ),
        ];

        return (
          <div className="grid grid-cols-[1fr_max-content_max-content] items-center gap-x-3 gap-y-2" style={MONO}>
            {rows.map(([role, value, hue]) => {
              const hueValue = hue === 'neutral' ? undefined : def.palette[hue];
              return (
                <Fragment key={role}>
                  <span className="text-caption text-content-secondary">{role}</span>
                  <Swatch value={value} size="1.5rem" />
                  <span className="text-caption text-accent-primary">
                    {hue === 'neutral' ? '→ neutral' : `→ ${hue}`}
                    {hueValue && hueValue !== value ? ' ✗' : ''}
                  </span>
                </Fragment>
              );
            })}
          </div>
        );
      }}
    />
  );
}

/**
 * The Hue vocabulary, with the contrast each one actually holds against the
 * tightest ground its level offers. The floor is 5.5 for a base Hue and 4.5 for
 * a `bright` one, and both are read from `MINIMUM_RATIO` rather than typed.
 */
export function HueLadder() {
  return (
    <LevelColumns
      render={(level) => {
        const def = LEVELS[level];
        return (
          <div className="grid grid-cols-[max-content_max-content_max-content_1fr] items-center gap-x-3 gap-y-2" style={MONO}>
            {PALETTE_HUES.map((hue) => {
              const base = tightestRatio(def.palette[hue], def);
              const bright = tightestRatio(def.paletteBright[hue], def);
              return (
                <Fragment key={hue}>
                  <span className="text-caption text-content-secondary">{hue}</span>
                  <Swatch value={def.palette[hue]} size="1.5rem" />
                  <Swatch value={def.paletteBright[hue]} size="1.5rem" />
                  <span className="text-caption text-content-muted">
                    {base.toFixed(2)} / {bright.toFixed(2)}
                  </span>
                </Fragment>
              );
            })}
            <span className="col-span-4 mt-1 text-caption text-content-muted">
              floors: base {MINIMUM_RATIO.palette}, bright {MINIMUM_RATIO.paletteBright}
            </span>
          </div>
        );
      }}
    />
  );
}

/**
 * The contrast gate, run in the browser on the same ladder CI audits. The
 * counts are not quoted from `check:contrast` — this calls `auditContrast`, so
 * the page cannot claim a pass the arithmetic does not give it.
 */
const AUDIT = auditContrast(LEVELS);

/**
 * How many pairs miss a given Medium's floors. `web` clears all of them; `video`
 * and `graphic` do not, deliberately — no artifact is emitted for either, and
 * the numbers are here rather than in prose so they cannot quietly become wrong.
 */
function mediumFailures(medium: Medium): number {
  return auditContrast(LEVELS, MEDIA_DEFINITIONS[medium].contrastFloor).filter(
    (check) => !check.passes,
  ).length;
}

export function ContrastGate() {
  const failures = AUDIT.filter((check) => !check.passes);
  const tightest = AUDIT.reduce((worst, check) =>
    check.ratio - check.minimum < worst.ratio - worst.minimum ? check : worst,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard title="PAIRS AUDITED" value={AUDIT.length} subtitle="both levels" accent="primary" />
        <StatCard
          title="FAILING"
          value={failures.length}
          change={failures.length === 0 ? 'gate green' : 'gate red'}
          changeType={failures.length === 0 ? 'positive' : 'negative'}
          accent={failures.length === 0 ? 'success' : 'danger'}
        />
        <StatCard
          title="TIGHTEST MARGIN"
          value={`${(tightest.ratio - tightest.minimum).toFixed(2)}`}
          subtitle={`${tightest.pair} · ${tightest.level}`}
          accent="secondary"
        />
      </div>
      <NoteBlock type="important" title="CONTRAST IS A GATE, NOT A GUIDELINE">
        If <code style={MONO}>pnpm check:contrast</code> fails, the colour is wrong — not the gate.
        The Hue floor sits above WCAG AA on purpose: an editor draws selection, diff and
        find-match backgrounds behind these same tokens, and a palette solved to exactly 4.5 has
        no room left to tint the ground.
      </NoteBlock>
    </div>
  );
}

/** The four grounds, each with what sits on it, per level. */
const SURFACE_JOBS: Readonly<Record<Surface, string>> = {
  base: 'the page itself',
  raised: 'panels, cards, menus — above the page',
  sunken: 'wells, code blocks, inputs — recessed into it',
  overlay: 'the modal scrim; the only value carrying alpha',
};

export function SurfaceRamp() {
  return (
    <LevelColumns
      render={(level) => {
        const def = LEVELS[level];
        return (
          <div className="flex flex-col gap-2" style={MONO}>
            {(Object.keys(SURFACE_JOBS) as Surface[]).map((surface) => (
              <div key={surface} className="flex items-center gap-3">
                <Swatch value={def.surface[surface]} size="1.75rem" />
                <span className="text-caption text-content-secondary">surface.{surface}</span>
                <span className="text-caption text-content-muted">{SURFACE_JOBS[surface]}</span>
              </div>
            ))}
          </div>
        );
      }}
    />
  );
}

/**
 * Form: zero radius, hard offset shadows, 2px edges. The three shadow steps are
 * the `web` Medium's own offsets, read from `MEDIA_DEFINITIONS`.
 */
export function FormSpecimen() {
  const offsets = MEDIA_DEFINITIONS.web.shadowOffset;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-caption text-content-muted" style={MONO}>
            {offsets.sm}px {offsets.sm}px 0
          </span>
          <div className="h-16 w-24 border-2 border-edge-strong bg-surface-sunken shadow-hard-sm" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-caption text-content-muted" style={MONO}>
            {offsets.md}px {offsets.md}px 0
          </span>
          <div className="h-16 w-24 border-2 border-edge-strong bg-surface-sunken shadow-hard-md" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-caption text-content-muted" style={MONO}>
            {offsets.lg}px {offsets.lg}px 0
          </span>
          <div className="h-16 w-24 border-2 border-edge-strong bg-surface-sunken shadow-hard-lg" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-caption text-content-muted" style={MONO}>
            radius {MEDIA_DEFINITIONS.web.radius.none} · rounded-lg
          </span>
          <div className="h-16 w-24 rounded-lg border-2 border-edge-strong bg-surface-sunken" />
        </div>
      </div>
      <p className="max-w-[70ch] text-caption text-content-secondary" style={MONO}>
        The fourth panel asks for <code>rounded-lg</code> and renders square. `theme.css`
        redefines Tailwind&apos;s whole radius scale to zero, so the corner is a token on the
        Medium axis rather than a reset — and a consumer cannot round a corner by reaching for a
        utility.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="primary" bracketed>
          PUBLISH
        </Button>
        <Button variant="secondary">SECONDARY</Button>
        <Button variant="tertiary">TERTIARY</Button>
        <Button variant="inverse">INVERSE</Button>
      </div>
    </div>
  );
}

/** The four type roles, each set in its own stack. */
const TYPE_ROLES = [
  ['display', 'Space Grotesk → Inter → sans-serif', 'BRUTALIST NEON TERMINAL'],
  ['body', 'Inter → system sans', 'Hard edges and no rounding at all.'],
  ['mono', 'IBM Plex Mono → Symbols Nerd Font Mono → Courier New', '> FULL_STACK_ENGINEER.exe'],
  ['pixel', 'VT323 → monospace', 'READY.'],
] as const;

export function TypeSpecimen() {
  return (
    <div className="flex flex-col gap-5">
      {TYPE_ROLES.map(([role, stack, sample]) => (
        <div key={role} className="flex flex-col gap-1 border-l-2 border-edge-subtle pl-4">
          <span className="text-caption tracking-[0.16em] text-accent-primary uppercase" style={MONO}>
            {role}
          </span>
          <span className="text-title" style={{ fontFamily: semanticTokens.font[role] }}>
            {sample}
          </span>
          <span className="text-caption text-content-muted" style={MONO}>
            {stack}
          </span>
        </div>
      ))}
      <NoteBlock type="warning" title="THE MONO FACE IS LATIN-ONLY">
        Box-drawing and block characters fall through to Symbols Nerd Font Mono, which is why
        ASCII art needs testing rather than assuming. Fallback chains are load-bearing: when the
        web font has not loaded, the next entry decides the metrics.
      </NoteBlock>
    </div>
  );
}

/**
 * The second axis. A Level varies colour and is picked at runtime; a Medium
 * varies geometry and time and is picked at build time by which artifact is
 * being emitted. No token varies on both.
 */
export function MediumTable() {
  return (
    <div className="grid gap-4 md:grid-cols-3" style={MONO}>
      {MEDIA.map((medium) => {
        const def = MEDIA_DEFINITIONS[medium];
        const isCss = medium === 'web';
        return (
          <div
            key={medium}
            className="flex flex-col gap-2 border-2 border-edge-default bg-surface-sunken p-4"
          >
            <span className="text-caption font-bold tracking-[0.16em] uppercase" style={DISPLAY}>
              <BracketText accent={isCss ? 'primary' : 'quiet'}>{def.label}</BracketText>
            </span>
            <span className="text-caption text-content-secondary">{def.description}</span>
            <dl className="mt-2 flex flex-col gap-1 text-caption text-content-muted">
              <div className="flex justify-between gap-2">
                <dt>unit</dt>
                <dd>{def.unit}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>body</dt>
                <dd>
                  {def.type.body.size}
                  {def.unit} / {def.type.body.lineHeight}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>quick</dt>
                <dd>{def.motion.quick === 0 ? 'no time base' : `${def.motion.quick}`}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>hue floor</dt>
                <dd>{def.contrastFloor.hue}:1</dd>
              </div>
            </dl>
            <span className="mt-1 text-caption text-accent-secondary">
              {isCss ? 'carried by theme.css' : 'declared, not emitted'}
            </span>
            {/* The asymmetry ADR 0004 calls the one most likely to be got wrong
                later: colour values do not vary by Medium, but the floors they
                must clear do. Measured here, per Medium, on the same ladder. */}
            <span
              className={
                mediumFailures(medium) === 0 ? 'text-caption text-intent-success' : 'text-caption text-intent-warning'
              }
            >
              {mediumFailures(medium) === 0
                ? `${AUDIT.length}/${AUDIT.length} pairs clear`
                : `${mediumFailures(medium)}/${AUDIT.length} pairs below floor`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * A Target with no notion of jobs. A terminal has sixteen positions named by
 * colour and no concept of a keyword, so it addresses the Hue vocabulary
 * directly — which is the whole reason Hues are declared beneath the Roles.
 * Rendered from `ansiScheme`, the same function that writes the four committed
 * terminal config files.
 */
export function AnsiTarget() {
  return (
    <LevelColumns
      render={(level) => {
        const scheme = ansiScheme(level);
        return (
          <div
            className="flex flex-col gap-3 border-2 border-edge-strong p-4"
            style={{ backgroundColor: scheme.chrome.background, ...MONO }}
          >
            <div className="grid grid-cols-8 gap-1">
              {ANSI_SLOTS.map((slot) => (
                <span
                  key={slot}
                  title={`${slot} ${scheme.slots[slot]}`}
                  className="block h-5 w-full border border-edge-subtle"
                  style={{ backgroundColor: scheme.slots[slot] }}
                />
              ))}
            </div>
            <pre className="overflow-x-auto text-caption" style={{ color: scheme.chrome.foreground }}>
              <span style={{ color: scheme.slots.green }}>ryan@midnight</span>
              <span style={{ color: scheme.chrome.foreground }}>:</span>
              <span style={{ color: scheme.slots.blue }}>~/design-system</span>
              <span style={{ color: scheme.slots.cyan }}>$ </span>pnpm ansi:check{'\n'}
              <span style={{ color: scheme.slots.brightGreen }}>✓</span> 16/16 slots resolved{'\n'}
              <span style={{ color: scheme.slots.yellow }}>!</span> fixture diff clean
            </pre>
          </div>
        );
      }}
    />
  );
}

/** Voice, as controls rather than as a style note. */
export function VoiceSpecimen() {
  return (
    <div className="flex flex-col gap-4">
      <PageTitle subtitle="> FULL_STACK_ENGINEER.exe">LATEST POSTS</PageTitle>
      <div className="flex flex-wrap items-center gap-3">
        <Badge accent="success">PUBLISHED</Badge>
        <Badge accent="warning">DRAFT</Badge>
        <Badge accent="danger">FAILED</Badge>
        <BracketText accent="primary">[ LATEST POSTS ]</BracketText>
      </div>
      <NoteBlock type="tip" title="A CONTROL SAYS EXACTLY WHAT HAPPENS">
        Terse. Technical. Lowercase in code contexts, <code style={MONO}>UPPERCASE_SNAKE</code> for
        terminal-flavoured labels. No exclamation marks, no marketing adjectives, no
        &ldquo;seamlessly&rdquo;.
      </NoteBlock>
    </div>
  );
}

/**
 * Usage, in the docs surface's own components.
 *
 * The code here is the one part of the page that cannot be derived, so it is
 * held to the next best thing: every path in it is an entry in `package.json`'s
 * `exports` map, and every class name is one the token lint rule would accept.
 */
const INSTALL = `pnpm add @rtkelly13/design-system

# Published to public npm from main via npm Trusted Publishing.
# Node >=22, and pnpm is the package manager here.`;

const MOUNT = `// One stylesheet, one import. \`styles.css\` is the opinionated whole;
// \`theme.css\` alone is the tokens and nothing else, for a consumer
// bringing its own resets and fonts.
import '@rtkelly13/design-system/styles.css';

import { ThemeProvider, getThemeInitScript } from '@rtkelly13/design-system';

// The inline script runs before first paint, so the page never
// flashes the default level and then corrects itself. React
// cannot do this job — anything it renders is already too late.
<script dangerouslySetInnerHTML={{ __html: getThemeInitScript() }} />

<ThemeProvider>
  <App />
</ThemeProvider>`;

/*
 * The counter-example is assembled rather than written out.
 *
 * `pnpm lint` scans this file like any other under `src/stories/**`, and a
 * literal `bg-cyan-400` here is precisely the defect the token rule exists to
 * catch — it failed the build on first write, which is the rule working. Naming
 * the halves keeps the sample honest without silencing the gate to show it.
 */
const HUE_DEFECT = `bg-${'cyan'}-400 text-${'zinc'}-900`;

const ROLES_CODE = `// Address the job, never the appearance.
<article className="bg-surface-raised border-2 border-edge-strong p-6">
  <h2 className="font-display uppercase text-content-primary">Title</h2>
  <p className="text-content-secondary">Body copy.</p>
  <span className="text-intent-danger">Something is wrong</span>
</article>

// A hue in component code is a defect. \`pnpm lint\` reports it
// at the site that wrote it, and \`check:tokens\` gates it at 0.
<div className="${HUE_DEFECT}" />  // ✗`;

const TOKENS_CODE = `// Design Tokens Format Module 2025.10, for anything that
// cannot read CSS — a diagram generator, an editor scheme.
import midnight from '@rtkelly13/design-system/tokens/midnight.tokens.json';

// Or take the terminal straight out of the box:
//   @rtkelly13/design-system/terminal/midnight.ghostty.conf
//   @rtkelly13/design-system/terminal/sketch.alacritty.toml`;

export function UsageTabs() {
  return (
    <CodeTabs group="manifesto-usage" label="Getting the system into a project" accent="primary">
      <CodeTab label="install" language="bash">
        {INSTALL}
      </CodeTab>
      <CodeTab label="mount" language="tsx">
        {MOUNT}
      </CodeTab>
      <CodeTab label="address roles" language="tsx">
        {ROLES_CODE}
      </CodeTab>
      <CodeTab label="read tokens" language="ts">
        {TOKENS_CODE}
      </CodeTab>
    </CodeTabs>
  );
}

/**
 * The `graphic` Medium, drawn.
 *
 * A palette card in a fixed `viewBox`, laid out entirely in
 * `MEDIA_DEFINITIONS.graphic` units — its `borderWidth`, its `shadowOffset`, its
 * type steps. Nothing here is a CSS pixel, which is the point: this Medium has
 * no reflow and no time base, so the same drawing is the full-width card and the
 * thumbnail beside it with no second layout.
 *
 * It also shows why the Medium's contrast floor is its own. A diagram is
 * reproduced in print and at thumbnail size and cannot use motion to carry
 * meaning, so `graphic` demands 7:1 of a Hue where `web` demands 5.5 — and the
 * chips that do not clear it are marked from the live measurement rather than
 * from a claim.
 */
const G = MEDIA_DEFINITIONS.graphic;

/*
 * Card geometry, entirely in this Medium's units.
 *
 * The width is solved rather than picked: a label is up to nine mono characters
 * (`magenta !`) at the caption step, and a mono glyph is ~0.6em, so a chip needs
 * ~9 * 0.6 * caption.size units or the labels collide — which they did at 200
 * wide. The head block is laid out line by line for the same reason: folding it
 * into one expression is what put the title's descenders through the subtitle.
 */
const COLS = 5;
const PAD = G.spacing[6]!;
const GAP = G.spacing[2]!;
const LONGEST_LABEL = Math.max(...PALETTE_HUES.map((hue) => hue.length)) + 2;
const CHIP_W = Math.ceil(LONGEST_LABEL * 0.6 * G.type.caption.size);
const CHIP_H = G.spacing[6]!;
const CARD_W = PAD * 2 + COLS * CHIP_W + GAP * (COLS - 1);
const TITLE_BASE = PAD + G.type.title.size;
const SUB_BASE = TITLE_BASE + G.type.caption.size + GAP;
const HEAD_H = SUB_BASE + G.spacing[4]!;
const ROW_H = CHIP_H + G.type.caption.size + GAP;

function PaletteCard({ level, width }: { level: ThemeLevel; width: number | string }) {
  const def = LEVELS[level];
  const rows = Math.ceil(PALETTE_HUES.length / COLS);
  const cardH = HEAD_H + rows * ROW_H + PAD;

  return (
    <svg
      viewBox={`0 0 ${CARD_W + G.shadowOffset.lg} ${cardH + G.shadowOffset.lg}`}
      width={width}
      role="img"
      aria-label={`${def.label} palette card, ${PALETTE_HUES.length} hues`}
      style={{ display: 'block', maxWidth: '100%' }}
    >
      {/* The offset shadow is a second rect, not a filter — the mark is hard-edged
          in every Medium, and a blur is the first thing to look wrong here. */}
      <rect
        x={G.shadowOffset.lg}
        y={G.shadowOffset.lg}
        width={CARD_W}
        height={cardH}
        fill={def.border.strong}
      />
      <rect
        x={0}
        y={0}
        width={CARD_W}
        height={cardH}
        fill={def.surface.base}
        stroke={def.border.strong}
        strokeWidth={G.borderWidth.heavy}
      />

      <text
        x={PAD}
        y={TITLE_BASE}
        fill={def.accent.primary}
        style={{
          fontFamily: semanticTokens.font.display,
          fontSize: G.type.title.size,
          fontWeight: G.weight.black,
        }}
      >
        [ PALETTE ]
      </text>
      <text
        x={PAD}
        y={SUB_BASE}
        fill={def.text.muted}
        style={{ fontFamily: semanticTokens.font.mono, fontSize: G.type.caption.size }}
      >
        {def.label.toUpperCase()} · GRAPHIC MEDIUM · {G.unit.toUpperCase()} UNITS
      </text>

      {PALETTE_HUES.map((hue, index) => {
        const x = PAD + (index % COLS) * (CHIP_W + GAP);
        const y = HEAD_H + Math.floor(index / COLS) * ROW_H;
        const clears = tightestRatio(def.palette[hue], def) >= G.contrastFloor.hue;
        return (
          <g key={hue}>
            <rect
              x={x}
              y={y}
              width={CHIP_W}
              height={CHIP_H}
              fill={def.palette[hue]}
              stroke={def.border.strong}
              strokeWidth={G.borderWidth.edge}
            />
            <text
              x={x}
              y={y + CHIP_H + G.type.caption.size}
              fill={clears ? def.text.secondary : def.intent.warning}
              style={{ fontFamily: semanticTokens.font.mono, fontSize: G.type.caption.size }}
            >
              {hue}
              {clears ? '' : ' !'}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function GraphicTarget() {
  return (
    <LevelColumns
      render={(level) => (
        <div className="flex flex-col gap-4">
          <PaletteCard level={level} width="100%" />
          <div className="flex items-end gap-3">
            <PaletteCard level={level} width={112} />
            <span className="text-caption text-content-muted" style={MONO}>
              the same drawing at 112px — no reflow, no second layout.
              <br />! marks a hue below this Medium&apos;s {G.contrastFloor.hue}:1 floor.
            </span>
          </div>
        </div>
      )}
    />
  );
}

/**
 * Motion, which is the other half of what a Medium varies.
 *
 * User-triggered rather than looping: a specimen that animates on its own is a
 * specimen the screenshot walkthrough catches mid-transition. The durations are
 * the shipped custom properties, not numbers copied out of `media.ts` — if the
 * emitted token and the declared Medium ever disagree, this stops matching the
 * figure printed beside it.
 */
const MOTION_STEPS = [
  ['instant', 'var(--ds-duration-instant)'],
  ['quick', 'var(--ds-duration-quick)'],
  ['considered', 'var(--ds-duration-considered)'],
] as const;

const FRAME_RATE = 30;

export function MotionSpecimen() {
  const [shifted, setShifted] = useState(false);
  const web = MEDIA_DEFINITIONS.web.motion;
  const video = MEDIA_DEFINITIONS.video.motion;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        {MOTION_STEPS.map(([step, duration]) => (
          <div key={step} className="flex items-center gap-4">
            <span className="w-28 flex-none text-caption text-accent-primary uppercase" style={MONO}>
              {step}
            </span>
            <div className="relative h-8 flex-1 border-2 border-edge-subtle bg-surface-sunken">
              <div
                className="absolute top-0 left-0 h-full w-8 border-2 border-edge-strong bg-accent-primary"
                /*
                 * `left` rather than a transform: the travel has to be the
                 * track's width minus the chip's, and a transform's percentages
                 * resolve against the chip — `translateX(100%)` moves it one
                 * chip width and the specimen showed almost no motion at all.
                 */
                style={{
                  left: shifted ? 'calc(100% - 2rem)' : '0',
                  transitionProperty: 'left',
                  transitionDuration: duration,
                  transitionTimingFunction: 'var(--ds-ease)',
                }}
              />
            </div>
            <span className="w-40 flex-none text-caption text-content-muted" style={MONO}>
              {web[step]}ms · {video[step]} {video[step] === 1 ? 'frame' : 'frames'}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button size="sm" bracketed onClick={() => setShifted((previous) => !previous)}>
          {shifted ? 'RETURN' : 'RUN'}
        </Button>
        <span className="text-caption text-content-secondary" style={MONO}>
          web easing {web.easing} · video easing {video.easing}
        </span>
      </div>

      <NoteBlock type="note" title="WHY VIDEO COUNTS FRAMES">
        A fractional frame lands a render mid-transition and the still is a smear, so the video
        Medium&apos;s durations are whole frames — {video.quick} and {video.considered}, which at{' '}
        {FRAME_RATE}fps is {Math.round((video.quick / FRAME_RATE) * 1000)}ms and{' '}
        {Math.round((video.considered / FRAME_RATE) * 1000)}ms. Close to the web&apos;s numbers,
        and deliberately not derived from them.
      </NoteBlock>
    </div>
  );
}
