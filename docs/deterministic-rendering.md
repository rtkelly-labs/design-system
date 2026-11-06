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

There are 22 CSS transitions and **zero** `@keyframes`. All the transitions are hover- or
focus-intent, so they are inert wherever there is no pointer. But a transition fires on *any* change
to the named property, from any cause — so a consumer animating a prop that lands on one gets a
150–300ms wall-clock interpolation it did not ask for and cannot see. Between two captures taken
milliseconds apart, the transition barely advances and then snaps.

```css
*, *::before, *::after { transition: none !important; animation: none !important; }
```

This belongs to the consumer rather than the package — a stylesheet that suppressed its own
transitions would be wrong in a browser. Zero `@keyframes` is the good news: those would be
genuinely harder to suppress cleanly.

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
