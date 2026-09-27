# Rendering this package deterministically

**Parent:** [`AGENTS.md`](../AGENTS.md) ·
**Siblings:** [`visual-regression.md`](./visual-regression.md) (this repo's own use of the same
switches), [`evidence-pipeline.md`](./evidence-pipeline.md)

The package *does* render deterministically. It has never said so, and two of the three switches
that make it true are discoverable only by reading the source — which is how a consumer ends up
with one palette in the first captured frame and another in the rest.

For anything that screenshots, prints, snapshots, or renders outside a live browser session: a
video renderer, a PDF export, a visual-regression suite. This repo's own suite is one of them.

## The three switches

### 1. `scoped` is the determinism switch

It reads as being about nesting — theming a subtree, a `sketch` panel inside a `midnight` page —
and it is. That undersells it. **Both** of `ThemeProvider`'s effects early-return on it:

```ts
useEffect(() => { if (scoped) return; … });   // reads localStorage + matchMedia
useEffect(() => { if (scoped) return; … });   // writes documentElement + localStorage
```

So `scoped` alone means nothing reads `localStorage`, nothing reads `matchMedia`, nothing touches
`documentElement`, and `level` never moves off `defaultLevel`. A fully determined theme in one prop.

```tsx
<ThemeProvider defaultLevel="midnight" scoped>
```

**`persist={false} followSystem={false}` look like the determinism controls and are redundant under
`scoped`.** Harmless as documentation of intent, but they are not what does the work — a consumer
reasoning from the prop names alone would reach for those two, not for `scoped`, and would still be
non-deterministic. Without `scoped`, the level is decided by whatever the environment reports for
`prefers-color-scheme`, and the reconciliation lands *between* the first painted frame and the
second.

### 2. Wait for the fonts

`styles.css` self-hosts four families and `theme.css` resolves them **by name**:

```css
--ds-font-mono: var(--font-ibm-plex-mono, "IBM Plex Mono"), "Courier New", monospace;
```

A name only resolves once the face is registered with the document. Capture before that and you get
the fallback — `Courier New` for IBM Plex Mono — and because it is a race it does not reproduce
identically between runs. On a monospace surface the column widths move too, so it reads as the
layout jumping rather than as a font swap.

```ts
await document.fonts.ready;
```

One line, covers every family, and cannot drift as families are added.

This repo solved the same class of problem for itself: `tests/story-ready.ts` exists because
Storybook always paints *something*, and every baseline was once a screenshot of the "No Preview"
panel while the suite passed throughout. Capturing before `document.fonts.ready` is that failure one
layer down — silent, plausible-looking, wrong output.

### 3. Turn the transitions off

There are 49 CSS transitions and **3** `@keyframes`. Most of the transitions are hover- or focus-intent, so they are
inert wherever there is no pointer — but since #162 that is no longer all of them. `Modal`,
`AlertDialog` and `Drawer` fade their backdrop and popup on open and close, driven by Base UI's
`data-starting-style` / `data-ending-style` attributes rather than by a pointer, so a capture taken
while a dialog is opening catches it mid-fade with nothing having been hovered. `Drawer` (#241) is
the one that also *moves*: its panel translates a full panel-width in from the edge, so a capture
taken mid-transition is not a slightly-wrong opacity but a panel in the wrong place. `Checkbox` and
`Switch` are the same case in miniature: the box takes its fill and the thumb travels on
`data-checked`, which a story can set before anything is hovered. `Radio` (#239) wears the same box
and so inherits its colour transition, but adds none of its own: its selected mark is mounted and
unmounted rather than faded, so a selection lands in one frame. `Toast` (#243) enters with a
short rise and leaves with a short slide on the dialogs' two attributes, and it is the one of these
whose trigger is not a prop at all but a **clock**: a toast shown on mount is mid-rise for the
first frames, and one left on its default lifetime slides out six seconds later whether or not
anything happened. The transition reset handles the first; only the caller can handle the second,
by showing the toast with `timeout: 0` — which is what its asserted story does. `Tooltip`,
`Popover` and `Menu` (#166) fade in and out on the same two attributes, opacity only, from one
shared surface recipe; a story that opens one on load (`defaultOpen`, which each asserted story
does) is mid-fade for its first frames, and the popup is placed by the positioning engine after it
mounts rather than in the same frame, so a capture should wait for the popup to be visible as well
as suppress the fade. `Popover`'s close control adds a hover colour transition like the dialogs' does. All of them carry
`motion-reduce:transition-none`, which makes `prefers-reduced-motion` a second and more honest lever
than the reset below; the reset is still what a capture harness should use, because it does not
depend on the component having remembered.

`Select`'s open list (#164) adds no transition of its own: it is mounted and unmounted rather than
faded or scaled, so it is whole in the first frame it exists — the closed trigger is the text
field's recipe and brings only that field's colour transition with it. What a capture of an open
list has to pin instead is the *highlight*, which follows the pointer; the asserted rows open it
from the keyboard for that reason, so the highlighted row is chosen by a key press rather than by
wherever the cursor was left.

A transition also fires on *any* change to the named property, from any cause — so a consumer
animating a prop that lands on one gets a 150–300ms wall-clock interpolation it did not ask for and
cannot see. Between two captures taken milliseconds apart, the transition barely advances and then
snaps.

```css
*, *::before, *::after { transition: none !important; animation: none !important; }
```

This belongs to the consumer rather than the package — a stylesheet that suppressed its own
transitions would be wrong in a browser.

The three `@keyframes` are the reason the reset names `animation` as well as `transition`, and they
are a harder case than a transition in one specific way: they are **infinite loops**, generated into
`theme.css` as `--animate-ds-*` tokens (from `LOOPS` in `src/theme/media.ts`) and worn by `Spinner`, `Skeleton` and `Progress`. A
transition is inert until something changes; a loop is never at rest, so a capture taken at an
arbitrary moment lands on an arbitrary frame. Nothing about that is a race the harness can wait out
— the only deterministic frame is the one where the animation is not running.

Two levers reach them, and they are not the same lever. `animation: none !important` in the reset
above removes them outright, which is what a capture harness wants. Playwright's
`animations: 'disabled'` — what `tests/visual.spec.ts` runs under — instead resets an infinite
animation to its **first** frame, which is why the gated baselines of those three components are
reproducible without the reset. `prefers-reduced-motion` is the third lever and deliberately not a
capture tool: `Skeleton` stops under it, but `Spinner` only slows, because a spinner that has
stopped reads as a page that has hung.

## All three together

```tsx
<ThemeProvider defaultLevel="midnight" scoped>
  <App />
</ThemeProvider>
```

```ts
await document.fonts.ready;
await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
```

## What this is not

- **Not a promise about pixels across platforms.** Font rasterisation and sub-pixel antialiasing
  differ by OS; that is why `test:visual` is Linux-only, which
  [`visual-regression.md`](./visual-regression.md) covers.
- **Not needed for ordinary web use.** A live page *wants* `prefers-color-scheme`, a persisted
  choice and hover transitions. These switches are for capture.
