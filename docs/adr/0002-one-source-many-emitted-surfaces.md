---
status: accepted
---

# One source of colour decisions, many emitted surfaces

This is the root decision of the design system, and it is logically prior to
[`0001`](./0001-hues-declared-below-roles.md) — which is a decision about *how* to shape the
vocabulary so that this one is achievable. It is numbered second because ADR numbers are
chronological identifiers and the log is append-only; renumbering would break the references
already live in #79, #116, #117 and `AGENTS.md`.

The system is not a stylesheet with a Storybook attached. It is one set of colour and type
decisions that has to arrive intact on **four classes of surface**:

- **Websites** — `ryankelly.dev` and its siblings, through Tailwind and `theme.css`.
- **Video** — Remotion frames at 1080p, where the type scale a 16px web page needs is wrong
  and the caption track carries meaning.
- **Graphics** — generated diagrams, charts and ASCII-art panels, which need N mutually
  distinguishable colours rather than four levels of emphasis.
- **Developer themes** — VS Code, Zed, Shiki, Neovim, JetBrains, and a terminal's sixteen ANSI
  positions.

Only the first is served today. `src/theme/levels.ts` is TypeScript and `src/theme.css` is
Tailwind v4 — `@theme`, `@source`, and `@custom-variant` negation chains. Both are correct
output for a web consumer and illegible to everything else.

**The decision: a colour originates exactly once, as a literal in the Levels module. Every
consumable form is Derived by an Emitter and verified against its source in CI. No surface
holds its own literals — not a video composition, not a graphic generator, not an editor
theme.**

## Considered options

**Per-surface palettes.** Let each surface declare what it needs, close to where it is used.
Rejected on evidence rather than principle: this is what already happened.
`blog/components/graphics/palette.ts` declares `BRUTALIST_ACCENTS` and `PAPER_ACCENTS` — two
hue-keyed records of hardcoded hex, in the consumer repo, with no drift test — because the
package offered no hue vocabulary to read. `PAPER_ACCENTS` holds the same sketch values the
Level collapse promotes to `light`, so there are already **two copies of the light palette**,
one of them ungated. That is the failure mode, observed, not predicted.

**Web-first, with manual ports.** Ship `theme.css`, hand-write an editor theme and a terminal
scheme when wanted. Rejected because a hand-written port is a copy that drifts silently, and
the drift is invisible: a stale terminal scheme still renders, still looks deliberate, and
nothing in CI can tell. The cost also recurs per Level and per Target — the combinatorial
shape is the reason `tokens:check` exists for CSS already.

**A runtime theming service.** Surfaces fetch tokens rather than embedding them. Rejected:
a video render, a published npm package and an installed editor extension are all offline
artifacts by nature. It would add a network dependency to solve a build-time problem.

**Design Tokens JSON as the single source, with hand-written adapters per target.** The
closest rejected option, and the one worth stating carefully. Keeping the source in
TypeScript rather than JSON is deliberate: `Record<ThemeLevel, T>` plus `assertNever` makes a
missing Level a compile error, and a JSON source cannot express that. Design Tokens JSON is a
good *Emitted* form — #117 emits it — and a poor source.

## Consequences

- **A hue vocabulary is required**, which is ADR 0001. Two of the four surface classes —
  developer themes and graphics — address colour by appearance and have no notion of a job.
  Roles alone can never serve them, so 0001 is not an enhancement to this decision but a
  precondition of it.
- **Fan-out maps live in the Emitter, never in a Level.** Sixteen ANSI Slots resolving from
  ten Hues, or hundreds of TextMate scopes from eight Roles, is data owned by the target that
  needs it. This is what makes adding a Target unable to change a colour.
- **Every surface needs a Gate on its *emitted* output, not on the source.** #82 states the
  general form: a check that proves the source is right "would be equally happy with a
  generator that reproducibly emitted the wrong shape". This decision multiplies that
  obligation by the number of Targets, and two of the required Gates — slot coverage and a
  committed fixture diff — do not exist yet.
- **The blog's graphics palette becomes a defect to retire**, not a local convenience. It
  should read `palette` once that Group exists, and the drift test is the deliverable that
  proves it did.
- **The Target table in [`docs/theme-taxonomy.md`](../theme-taxonomy.md) is incomplete.** It
  lists eight Targets, all of them web or editor. **Video and graphics are absent**, and they
  are surface classes rather than afterthoughts — the taxonomy should carry a row for each,
  with what it needs and what it is blocked on, exactly as the editor Targets do.
- **Type, spacing and motion are in scope, not only colour.** A 1080p frame and a 16px page
  disagree about the type scale, which is #49's subject. This decision is the reason #49 is
  foundational rather than a nice-to-have: a surface that has to invent its own type scale
  will invent its own colours next. The shape those tokens take is
  [`0004`](./0004-two-axes-level-and-medium.md): they vary by Medium rather than by Level, on a
  second axis this ADR implies and does not name.
