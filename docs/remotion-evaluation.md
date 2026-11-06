# Remotion evaluation — can this design system render video?

An audit of `@rtkelly13/design-system` against a specific new consumer:
[Remotion](https://www.remotion.dev), which renders React to MP4 by seeking a
headless Chromium frame by frame. The motivating case is a video explaining
context-driven development, built around the blog's `<Terminal>` component;
the broader aim is product/explainer videos that look like the rest of the
estate rather than like a different company made them.

> [!NOTE]
> **Measured on `ed94dcd` (25 August 2026). Two of its findings have since been fixed,
> and the ladder has changed.** Recorded as written rather than re-derived, because the
> document's value is the reasoning that produced those fixes — but read it with these
> in mind.
>
> - **§1, `SlideDeck` owning the presenter's clock — fixed.** Filed as #70, landed as
>   #72: the deck takes a `slide` prop and `onSlideChange`, and `chrome={false}` drops
>   the control bar, keyboard listener and fullscreen. The specific complaint that a deck
>   "could not be screenshotted at a chosen slide" no longer holds.
> - **§1, `speakerNotes` "it never renders" — fixed.** Filed as #94, landed as #101:
>   `SlideDeck` reads notes off its children and shows the current slide's in a panel,
>   toggled with `N`, off by default.
> - **The ladder is two rungs, not four.** #123 collapsed it to `midnight` + `sketch`,
>   so "all four rungs" in §5 now means both.
>
> **#71 — nothing documents deterministic rendering (§2, §3, §4) — is still open**, and
> is the live half of this document.

The existing audits ask different questions and are not re-litigated here:

- [`docs/evaluation.md`](./evaluation.md) — the package as a *system*.
- [`docs/gap-analysis.md`](./gap-analysis.md) — stated invariants with no enforcement.
- [`docs/surface-readiness.md`](./surface-readiness.md) — how many *kinds of site*
  the inventory can build.

That last one measures surfaces: docs, blog, marketing, admin. **Video is a
fifth surface**, and it is the first one whose constraint is not *responsive
layout* but *determinism*: the same frame number must produce the same pixels
on every render, or the encode tears.

Measured against `main` at `ed94dcd`, with `rtkelly13/blog` as the second
consumer. Reproduction commands are included so the numbers can be re-derived
rather than trusted.

---

## Verdict

**The token layer and the component inventory are ready. The animation model is
the entire problem, and it is not in this repo — it is in the blog's interactive
components.**

The design system turns out to be unusually well suited to video, for a reason
that was not the goal when it was built: **30 of its 38 components are pure
render functions** — no `useState`, no `useEffect`, no timers. A component with
no internal clock cannot disagree with Remotion's clock. Most design systems
fail here because their primitives own their own animation state; this one does
not own any.

| Layer | Ready? | What carries it | What blocks it |
|---|---|---|---|
| Token layer (`theme.css`) | **Ready** | Literal colours, no runtime, `@source "./"` already handles bundler scanning | Nothing |
| Static components (30 of 38) | **Ready** | Zero state, zero effects, zero timers | Type scale is sized for a 16px web page, not a 1080p frame |
| `ThemeProvider` | **Ready, with flags** | `scoped` / `persist` / `followSystem` escape hatches already exist | Defaults (`persist`, `followSystem`) are wrong for a headless render |
| `Slide` | **Ready** | Pure, 100%×100%, fills its parent — drops into `<AbsoluteFill>` unchanged | Hardcodes `--font-*` instead of `--ds-font-*` |
| Fonts | **Needs work** | Self-hosted, byte-pinned in the lockfile | No `delayRender()` handshake → early frames encode in the fallback face |
| CSS transitions | **Needs work** | 19 declarations, all hover-intent | Wall-clock, not frame-clock; they smear under seeking |
| `SlideDeck` | **Not usable** | — | Timers, `requestFullscreen`, `window` keyboard listeners |
| `<Terminal>` (blog) | **Needs a small refactor** | `terminalEngine.ts` is already pure and unit-tested | The timing table is trapped inside a `useEffect` |
| Licence | **Decision needed** | Free for the personal blog | Sentric needs a paid Company Licence |

The one-line summary: **you do not need to change the design system to make
videos. You need to change how the blog's interactive components tell the
time.**

---

## 0. Settle the licence before writing code

Remotion is source-available, not open source. It is free for individuals and
for-profit organisations of **up to 3 people**; a Company Licence is mandatory
at **4 or more**, and the headcount of all collaborating parties is
*aggregated*.

That splits the stated aim cleanly in two:

- **Blog / personal videos** (`ryankelly.dev`, the context-driven-development
  explainer) — free, no action.
- **"Product related videos"** — if that means Sentric product videos, Sentric
  is over the threshold and needs a paid Company Licence before a frame is
  rendered commercially. Evaluation itself is explicitly permitted, so a
  prototype is fine; shipping is the line.

This is first in the list because it is the only item that can invalidate the
rest, and it is a purchase decision rather than an engineering one. If the
answer is "personal only", everything below stands unchanged.

---

## 1. The finding that decides this: the components have no clock

```bash
# Regenerate the statefulness table
cd src && for f in $(find components -name "*.tsx" ! -name "*.test.tsx" | sort); do
  printf "%-46s %2s %2s %2s\n" "$f" \
    "$(grep -c 'useState' $f)" \
    "$(grep -c 'useEffect\|useLayoutEffect' $f)" \
    "$(grep -c 'setTimeout\|setInterval\|requestAnimationFrame' $f)"
done
```

Eight components hold state: `Modal`, `ThemeProvider`, `AdminDashboardLayout`,
`DocsHeader`, `DocsLayout`, `DocsSidebar`, `DesignSandbox`, `SlideDeck`. Every
other one — `Button`, `Card`, `Badge`, `StatCard`, `DataTable`, `Tag`,
`NoteBlock`, `TLDR`, `CodeBlock`, `Prose`, `BlogPost`, `Slide`, all of it — is
a function of its props.

That is the property Remotion actually needs. Remotion does not play an
animation; it asks a React tree "what do you look like at frame 412?" and
screenshots the answer. A component that answers only from its props always
answers the same way. A component that answers from an internal timer answers
differently depending on how long the renderer happened to take — which is how
you get a video where one frame in forty is a half-typed line.

Nothing in this repo needs to change for that. It is already true.

### `Slide` is the accidental win

`src/components/slides/Slide.tsx` is 100% width, 100% height, `box-sizing:
border-box`, pure, and takes `speakerNotes` it never renders. That is, almost
exactly, a Remotion `<AbsoluteFill>` child with a narration script attached —
which is what a video scene is. It can be used as-is:

```tsx
<AbsoluteFill style={{ backgroundColor: 'var(--ds-surface-base)' }}>
  <Slide title="Context-Driven Development" subtitle="why the agent needs a map">
    …
  </Slide>
</AbsoluteFill>
```

Two caveats. `Slide` names `var(--font-space-grotesk, "Space Grotesk")`
directly rather than the `--ds-font-display` role — a token-adoption gap
already noted in `docs/evaluation.md`, which matters more here than on the web
because §4 makes font *identity* load-bearing. And `speakerNotes` being
accepted-but-unrendered is currently dead weight; for video it becomes the
obvious place to keep the voiceover next to the visual it belongs to.

`SlideDeck`, by contrast, is unusable and should not be made usable. It owns
`currentSlide` in state, advances it on `setInterval`, listens for arrow keys
on `window`, and calls `requestFullscreen`. All four are the presenter's clock.
Remotion has its own — `<Series>` and `<Sequence>` are the deck. Do not port
`SlideDeck`; port `Slide` and let Remotion sequence it.

---

## 2. Transitions are the one hazard inside this repo

```bash
grep -rn "transition" src/components/ src/prose.css | wc -l   # 19
grep -rn "@keyframes\|animation:" src/*.css src/components/   # (no output)
```

Nineteen `transition` declarations; zero `@keyframes`. The absence of keyframes
is good news — those would be genuinely hard. The transitions are subtler.

Every one of them is hover- or focus-intent (`Button.tsx:60`, `Card.tsx:47`,
`StatCard.tsx:48`, `Input.tsx:34`, `Tag.tsx:47`, `Pagination.tsx:37`,
`DataTable.tsx:57`, `Modal.tsx:169`, and seven in `prose.css`). There is no
hover in a video, so on the face of it they are inert.

They are not inert, because a CSS transition fires on *any* change to the named
property, from any cause. The moment a composition animates a prop that lands
on a transitioned property — a `Card` whose `borderLeftColor` changes as an
accent moves through a diagram, a `StatCard` whose value counts up — the
browser starts a 150–200ms wall-clock interpolation that Remotion's seeking
knows nothing about. Frame 100 and frame 101 are rendered milliseconds apart in
real time; the transition barely advances between them and then snaps. The
result is a property that visibly lags the animation driving it, inconsistently.

The fix is one line in the Remotion root, not a change to the components:

```css
/* video-reset.css — imported only by the Remotion entry */
*, *::before, *::after {
  transition: none !important;
  animation: none !important;
}
```

Worth stating explicitly rather than leaving as a habit: **in a Remotion
composition, every visual change must come from `useCurrentFrame()`.** CSS is
allowed to describe a state; it is not allowed to describe a change between
states. The design system is already compliant with that rule everywhere except
these 19 lines, and they are all suppressible from outside.

---

## 3. Theming a headless render

`ThemeProvider` reads `localStorage` and `prefers-color-scheme` in an effect
and reconciles after first paint (`src/components/ThemeProvider.tsx`). In a
browser that is correct — it is what avoids a hydration mismatch. In a headless
render it is a hazard: whatever Chromium reports for `prefers-color-scheme`
decides the video's palette, and the reconciliation happens *between* the first
painted frame and the second.

The escape hatch already exists, and was built for precisely this shape of
consumer ("a preview surface — a Storybook decorator, an embedded demo — that
should not write to the host page's storage"):

```tsx
<ThemeProvider defaultLevel="midnight" scoped>
```

**`scoped` on its own is sufficient**, and stronger than it looks: *both*
effects in `ThemeProvider.tsx` early-return on it (lines 123 and 139). Nothing
reads `localStorage`, nothing reads `matchMedia`, nothing touches
`documentElement`, and `level` never moves off `defaultLevel`. The component
renders a single `<div data-theme="midnight">` and the tokens resolve down the
tree by ordinary inheritance. `persist={false} followSystem={false}` are then
redundant — harmless as documentation of intent, but they are not what makes it
deterministic.

That means a composition can take the level as a prop and render the same scene
on all four rungs, which is the trick the walkthrough suite already plays,
applied to video.

No code change needed. It is a documentation gap: nothing currently tells a
consumer that `scoped` *is* the deterministic-embed mode — it reads as being
about subtree theming, and the determinism is a side effect of the early
returns. Worth a line in the README, since a video pipeline is not the last
consumer that will want it.

---

## 4. Fonts are the most likely thing to actually bite

This is the one blocker with no clean workaround inside existing APIs.

`styles.css` imports five `@fontsource` packages. Self-hosting was the right
call and the reasoning in that file is sound — but it makes font loading a
*bundler-and-network* event, and `theme.css` resolves faces by **name**
(`--ds-font-mono: var(--font-ibm-plex-mono, "IBM Plex Mono"), "Courier New", monospace`).
A name only resolves once the face is registered with the document.

Remotion renders frames as fast as Chromium can seek. Frames requested before
`document.fonts` settles encode in the fallback — `Courier New` instead of IBM
Plex Mono, `sans-serif` instead of Space Grotesk. You get a video whose first
half-second is in the wrong typeface, and because it is a race it will not
reproduce identically between runs. On a monospace terminal scene the column
alignment shifts too, so it reads as the layout jumping rather than as a font
swap.

Remotion's answer is an explicit handshake:

```tsx
import { delayRender, continueRender } from 'remotion';

const handle = delayRender('fonts');
document.fonts.ready.then(() => continueRender(handle));
```

`document.fonts.ready` is the right signal here — it covers all five families at
once and needs no per-family list, so it cannot drift as fonts are added. This
belongs in the Remotion project, not in the design system, but it is worth
recording here because it is invisible until it is wrong and it looks like a
Remotion bug rather than a font-loading one.

---

## 5. Tailwind v4, and one version-pinning trap

Remotion supports Tailwind v4 through `@remotion/tailwind-v4` and a webpack
override:

```ts
// remotion.config.ts
import { Config } from '@remotion/cli/config';
import { enableTailwind } from '@remotion/tailwind-v4';

Config.overrideWebpackConfig((c) => enableTailwind(c));
```

Three things make this smoother here than it usually is:

1. `theme.css` already carries `@source "./"`, added because Tailwind v4 skips
   `node_modules` during content detection. That was written for the blog's
   build; it works unchanged for Remotion's, and without it every utility baked
   into the compiled components would be missing from the video's CSS.
2. The package ships plain CSS at three entrypoints (`styles.css`, `theme.css`,
   `prose.css`) with no JS preset — nothing to teach a second bundler about.
3. The token layer is literals, so there is no runtime colour computation to go
   wrong under a different build pipeline.

The trap: Remotion's setup instructions say to install the Tailwind packages
with **exact versions, no `^`**, because a mismatch causes conflicts. This
package declares `tailwindcss: "^4.0.0"` as an optional peer. In a pnpm
workspace that resolves fine; in a standalone Remotion project it is the first
thing to check when utilities silently do not emit.

---

## 6. Scale: the frame is not a viewport

The components are sized for reading at arm's length on a 16px root. A video is
watched at a distance, often on a phone, often muted with the viewer skimming.
`Terminal`'s default `height={280}` is a third of a 720p frame and about a
quarter of a 1080p one, at a font size that will not survive YouTube's
compression at 1080p.

There is a neat coincidence worth exploiting. The visual regression suite
renders at Playwright's `Desktop Chrome` viewport — **1280×720** — and 1280×720
scaled by exactly 1.5 is 1920×1080. So a 1080p composition can be a
pixel-aligned 1.5× scale of the layout the pixel baselines already lock:

```tsx
<AbsoluteFill style={{ transform: 'scale(1.5)', transformOrigin: 'top left',
                       width: 1280, height: 720 }}>
```

Prefer that over `zoom`, which affects layout rather than only paint and will
not match the baseline geometry.

One caveat, and this repo already knows why it matters: AGENTS.md §9 records
that a Playwright other than the lockfile's installs a *different Chromium*,
which under `maxDiffPixels: 0` moves every baseline. Remotion pins its own
Chromium independently. So the visual baselines are a strong *indication* that
a scene will render as expected, not a guarantee that it renders identically —
useful as a design check, not as a frame-accuracy gate. Do not wire the video
pipeline into `test:visual` expecting the two to agree byte for byte.

The honest gap: there is no display type scale in the token layer. `Slide`
hardcodes `2.5rem` for its title. A `--ds-text-display-*` ramp sized for video
would be a real addition, and unlike most of this list it is a change to *this*
repo.

---

## 7. `<Terminal>`: the pilot, and the one refactor worth doing

The blog's `<Terminal>` is the right first video for the reason the user
picked it, and also for a reason visible only from here: **it is already half
built for this.**

`components/interactive/terminalEngine.ts` is a pure, unit-tested,
React-free module, and its central function is exactly the shape Remotion wants:

```ts
materialize(script, eventIdx, progress) → { lines, typing }
```

State in, frame out. No accumulation, no side effects — the docstring even says
"replays, skips and re-renders are idempotent", which is the same property as
"seekable". A Remotion shell can call this directly and needs no changes to it.

What is missing is the *schedule*. The timing lives inside a `useEffect` in
`Terminal.tsx:145–200` as a self-advancing `setTimeout` chain, with the
durations as literals scattered through the branches: `typingSpeed` per
character, `300` after a command, `120` before the first output line, `70` per
subsequent line, `350` for the focus step, `750` to hold a highlight, `60` for
a clear, `ev.pause` for a pause. Those numbers are the entire animation, and
right now they are only reachable by letting real time pass.

**The refactor: lift the duration table out of the effect into
`terminalEngine.ts`.**

```ts
/** Cumulative ms at which each (eventIdx, progress) step begins. */
export function schedule(script: TerminalEvent[], typingSpeed?: number): Step[];

/** The (eventIdx, progress) in effect at time `ms`. */
export function stateAt(steps: Step[], ms: number): { eventIdx: number; progress: number };
```

That is a pure function with no new dependency, testable in the existing
`tests/terminal-engine.test.ts`, and it makes both shells thin:

- the **web** shell keeps its `setTimeout` chain but reads durations from
  `schedule()` instead of inlining them — no behaviour change, and the timing
  becomes unit-testable for the first time;
- the **Remotion** shell becomes roughly:

```tsx
const frame = useCurrentFrame();
const { fps } = useVideoConfig();
const { eventIdx, progress } = stateAt(steps, (frame / fps) * 1000);
const { lines, typing } = materialize(script, eventIdx, progress);
```

No timers, no `IntersectionObserver` autoplay, no `loop`, no replay/skip
controls — all of which are viewer affordances that a video does not have.

Two smaller notes for the port:

- **The focus scroll must change form.** `Terminal.tsx` scrolls imperatively
  with `scrollTo({ behavior: 'smooth' })`, which is a browser-owned animation
  and therefore invisible to Remotion's clock. The engine already exports the
  pure alternative — `scrollTarget(hIdx, lineCount, lineHeight, windowHeight)`
  — which `QueryRouter.tsx:182` uses to compute an *offset* it then applies as
  a transform. Interpolate that offset off the frame and the scroll becomes
  frame-exact. The piece the video needs already exists; it is just the
  component that does not use it.
- **`useReducedMotion` from `motion/react`** short-circuits to the finished
  session. In a headless render it will most likely report `false`, but it
  should be forced rather than left to Chromium's defaults.

### The rest of the interactive family

The same test — is there a pure model behind the shell? — sorts the whole
directory, and it sorts it into exactly the order you would want to build in:

| Component | Pure model | Timers | Port effort |
|---|---|---|---|
| `Terminal` | `terminalEngine.ts` | 9 | **Low** — schedule extraction, above |
| `MapReduceViz` | `mapReduceModel.ts` (316 lines) | 3 | **Low** — same shape |
| `FileTree` | `fileTreeModel.ts` (198 lines) | 0 | **Trivial** |
| `Walkthrough` | — | 0 | **Trivial** — step index becomes a `<Sequence>` |
| `IdeaDeck` / `IdeaSlide` | — | 0 | **Trivial** |
| `QueryRouter` | partial (uses `scrollTarget`) | 7 | **Medium** |
| `DepResolve` | — | 2 | **Medium** — extract a model first |
| `MvuLoop` | — | 2 | **Medium** — extract a model first |
| `RailwayTrack` | — | 2 | **Medium** — extract a model first |

```bash
# Regenerate, from the blog repo
cd components/interactive && for f in *.tsx; do
  printf "%-20s timers:%s\n" "$f" "$(grep -c 'setTimeout\|setInterval\|requestAnimationFrame' $f)"
done
```

The pattern is worth naming, because it is the actual conclusion of this
document: **the components that separated a pure model from the React shell are
the ones that can render video, and the ones that did not, cannot.** That split
was made for unit-testability. Seekability came free. It is the same property
under two names — a function of state can be tested at an arbitrary state, and
rendered at an arbitrary frame.

---

## Tracked as

This evaluation is the reasoning; the issues are the units of work. Each is
written to be picked up cold, without this document in context.

**Blog** — [`rtkelly13/blog#115`](https://github.com/rtkelly13/blog/issues/115)
is the parent:

| Issue | Covers |
|---|---|
| [blog#116](https://github.com/rtkelly13/blog/issues/116) | Generators are deterministic per frame but have no notion of time (§7's pattern, applied to `components/graphics/`) |
| [blog#117](https://github.com/rtkelly13/blog/issues/117) | The spike — an animated background video (§4, §5, §6) |
| [blog#118](https://github.com/rtkelly13/blog/issues/118) | `<Terminal>`'s timing table is trapped in a `useEffect` (§7) |
| [blog#119](https://github.com/rtkelly13/blog/issues/119) | The graphics palette is on a replaced theme model |
| [blog#120](https://github.com/rtkelly13/blog/issues/120) | Five interactive components have no pure model (§7) |

**This repo:**

| Issue | Covers |
|---|---|
| [#70](https://github.com/rtkelly13/design-system/issues/70) | `SlideDeck` owns the presenter's clock (§1) |
| [#71](https://github.com/rtkelly13/design-system/issues/71) | Nothing documents deterministic rendering (§2, §3, §4) |

Two findings here were already filed and are **not** duplicated: the display
type scale in §6 is a sub-case of [#49](https://github.com/rtkelly13/design-system/issues/49)
(the token layer stopped at colour — which also covers the missing motion
tokens behind §2), and `Slide`'s hardcoded `--font-*` in §1 is already named in
[#47](https://github.com/rtkelly13/design-system/issues/47).

---

## Recommended order

1. **Answer the licence question.** Personal-only needs nothing; Sentric
   product videos need a Company Licence before anything ships.
2. **Prototype with no refactor at all.** A Remotion project importing
   `@rtkelly13/design-system/styles.css`, `enableTailwind`, the `delayRender`
   font handshake, the transition reset, and a `<Slide>` at 1.5× scale. This
   proves the token layer, the fonts, the bundler and the scale in one pass and
   touches no existing code. It is the cheapest way to find out whether §4 or
   §5 has a surprise in it.
3. **Extract `schedule()` / `stateAt()` in the blog's `terminalEngine.ts`.**
   Pure, unit-tested, no behaviour change on the web. This is the only code
   change the pilot video needs.
4. **Build the context-driven-development video** on `Terminal` + `Slide` +
   `Walkthrough`.
5. **Then decide what belongs in this repo.** Candidates, in order of how
   clearly they are design-system concerns rather than video-project ones:
   - a display type scale (`--ds-text-display-*`) sized for a frame, which
     `Slide` should then consume instead of its hardcoded `2.5rem`;
   - a documented "deterministic embed" mode for `ThemeProvider`
     (`scoped` + `persist={false}` + `followSystem={false}`);
   - finishing the token adoption in `Slide` and `AdminDashboardLayout`, since
     video makes font identity load-bearing in a way the web does not.

Note what is *not* on that list: a Remotion dependency in this package. The
design system should stay a component library that happens to render
deterministically. The video pipeline is a consumer, like the blog and the
Storybook — and on the evidence above, a better-behaved one than either.

---

## Sources

- Remotion licence terms and the 4-person threshold —
  [remotion.dev/docs/license](https://www.remotion.dev/docs/license),
  [LICENSE.md](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md),
  [remotion.pro/license](https://www.remotion.pro/license)
- Tailwind v4 integration and the exact-version note —
  [remotion.dev/docs/tailwind-v4/overview](https://www.remotion.dev/docs/tailwind-v4/overview),
  [enableTailwind()](https://www.remotion.dev/docs/tailwind-v4/enable-tailwind)
