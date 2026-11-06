# Storybook benchmarks — measured against seven public design systems

**Parent:** [`AGENTS.md`](../AGENTS.md)

The Storybook at [design-system.ryankelly.dev](https://design-system.ryankelly.dev) is
not an internal tool here — it is the published documentation surface, and the only place
a consumer sees what the package offers. This document compares it against seven design
systems that publish both a Storybook **and** the source that configures it, and lists
what to change.

It is a comparison of the **Storybook layer** specifically: what the sidebar contains,
what the docs pages say, and which checks run against stories. It deliberately does not
re-litigate what is already written down:

- [`docs/evaluation.md`](./evaluation.md) — the package as a *system*: token design,
  test layer, publishing.
- [`docs/gap-analysis.md`](./gap-analysis.md) — stated invariants with no enforcement,
  and the divergence of the consumers.
- [`docs/surface-readiness.md`](./surface-readiness.md) — how many kinds of site the
  component inventory can build.

Those three ask *"is the system sound?"*. This one asks *"does the published catalogue
hold up next to the ones people actually cite as good?"* — a different axis, and the one
nothing here had measured.

Measured against `main` at `eb81ca2` (2026-09-09), package `0.5.0`, Storybook `10.5.5`.

> [!NOTE]
> An earlier draft of this document was measured against `4eda777`, when the ladder had
> four rungs. #123 landed in between, collapsing it to `midnight` + `sketch` and
> repalletting the light end. Every number below has been re-derived on `eb81ca2`. One
> finding did not survive that — a composited-contrast failure on the deleted `bright`
> rung, filed and then closed as #126 — and its replacement is a live one of the same
> class, #135. Nothing else moved: the structural findings are ladder-independent and
> re-measured identically.

---

## Verdict

**The gates in this repo are better than the comparison set's. The Storybook is worse.**

That split is the whole finding. Nothing in the set has a contrast gate that audits every
role pair as arithmetic, a `maxDiffPixels: 0` visual suite, a coverage gate that demands
a reason for every unasserted component, or a committed API-surface baseline. Those are
genuinely unusual and they are all in `ci.yml`.

But the *stories themselves* are inert. They are compiled, screenshotted, and published;
they are never **executed** and never **audited**. Every one of the seven runs automated
accessibility checks inside Storybook. This repo runs none — and neither does it run the
one thing Storybook 10 makes nearly free, which is turning each story into a test.

| Dimension | The set | Here |
|---|---|---|
| Token architecture and gating | nothing comparable | **leads** |
| Visual regression rigour | Chromatic, loose or absent tolerances | **leads** |
| Automated a11y on stories | 7 of 7 | **absent** |
| Stories executed as tests | 3 of 7 | **absent** |
| Prose/MDX pages in the sidebar | 5 of 7 | **absent** |
| Complete props tables | assumed by all 7 | **8 components empty** |
| Component maturity signalling | 1 of 7 | **absent** |
| Machine-readable manifest for agents | 1 of 7 | **absent** |
| A gate on story authoring | 2 of 7 | partial |

And the thing the a11y absence actually costs is not hygiene. It is the one hole this
repo had already identified and named — see finding 1.

---

## Method, and what it cannot show

**How the set was chosen.** Three criteria, all necessary: the Storybook is public, the
`.storybook/` config is public, and the system is *maintained* rather than archived. That
last one rules out most of the systems that get cited in "best Storybook" listicles.

The set is deliberately mixed in scale. Five are large-team products, included for one
specific practice each rather than as a whole-hog model — a solo repo should not copy
Carbon's process. Two are close to this repo's own scale, and are the more useful
comparison for *how much* of this is realistic.

**How the evidence was obtained.** Every claim about another project's configuration was
read from its own source on `raw.githubusercontent.com` and is cited to the file. Claims
about this repo were measured against a real `pnpm build-storybook`, with the commands
recorded so the numbers can be re-derived rather than trusted.

**What it cannot show.** The sandbox this was written in cannot reach the hosted
Storybooks — every domain but `raw.githubusercontent.com` is blocked by its egress proxy.
So this compares **configurations, not rendered UIs**. Where a claim depends on how a
hosted sidebar looks, it says so and is marked *unverified*. That is a real limit: it
means the set's docs pages are judged by their story globs and addon lists, not by
reading them.

---

## The comparison set

| Project | Scale | Storybook config read from | Here for |
|---|---|---|---|
| **Primer React** (GitHub) | large | [`packages/react/.storybook/main.ts`](https://github.com/primer/react/blob/main/packages/react/.storybook/main.ts) | the only one already building for AI agents |
| **Carbon** (IBM) | large | [`packages/react/.storybook/main.ts`](https://github.com/carbon-design-system/carbon/blob/main/packages/react/.storybook/main.ts) | a11y checking wired as a first-class addon; MDX landing pages |
| **Grafana UI** | large | [`packages/grafana-ui/.storybook/main.ts`](https://github.com/grafana/grafana/blob/main/packages/grafana-ui/.storybook/main.ts) | prose pages *as sidebar entries*; typechecked docgen |
| **Spectrum CSS** (Adobe) | large | [`.storybook/main.js`](https://github.com/adobe/spectrum-css/blob/main/.storybook/main.js) | component **status** labels; the widest addon surface in the set |
| **Polaris** (Shopify) | large | [`polaris-react/.storybook/main.js`](https://github.com/Shopify/polaris/blob/main/polaris-react/.storybook/main.js) | a deliberately minimal addon set — the counterexample |
| **Orbit** (Kiwi.com) | mid | [`packages/orbit-components/.storybook/main.ts`](https://github.com/kiwicom/orbit/blob/master/packages/orbit-components/.storybook/main.ts) | pseudo-state rendering; `eslint-plugin-storybook` |
| **Storybook Design System** | small | [`.storybook/main.ts`](https://github.com/storybookjs/design-system/blob/master/.storybook/main.ts) | closest in scale; written by the Storybook maintainers |

Two near-misses worth naming, because they came up and were excluded:

- **Elastic EUI** — its [`preview.tsx`](https://github.com/elastic/eui/blob/main/packages/eui/.storybook/preview.tsx)
  is the best thing in this whole survey for *this* repo specifically, and is cited below
  under finding 7. But its `main.ts` declares no addons, and its README points at
  `elastic.github.io/eui` rather than a Storybook, so it is not a clean comparison for the
  published-catalogue question.
- **Shadcn/ui, Radix, Mantine, MUI, Cloudscape** — all excluded for the same reason: no
  Storybook. Worth knowing, because "every good system uses Storybook" is false and the
  docs-site-instead-of-Storybook option is a live one. See *the decision this analysis
  cannot make*.

---

## The matrix

Read this as *what is configured*, not *what is good*. A blank is an absence, not a
failing — Polaris's blanks are choices.

| | Primer | Carbon | Grafana | Spectrum | Polaris | Orbit | SB-DS | **here** |
|---|---|---|---|---|---|---|---|---|
| Automated a11y addon | ✅ | ✅¹ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Stories executed as tests | —² | ✅³ | — | ✅⁴ | — | — | ✅⁴ | ❌ |
| A gate on story *authoring* | ✅⁵ | — | — | — | — | ✅⁶ | — | ✅⁷ |
| MDX/prose in story glob | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | ❌ |
| Explicit docgen strategy | — | ✅ | ✅ | n/a | — | — | — | ❌ |
| Component status labels | — | — | — | ✅⁸ | — | — | — | ❌ |
| Pseudo-state rendering | — | — | — | — | — | ✅⁹ | — | ❌ |
| Components manifest / MCP | ✅¹⁰ | — | — | — | — | — | — | ❌ |
| Theme/mode toolbar globals | — | — | — | ✅ | ✅ | — | — | ✅ |
| Deterministic pixel gate | — | — | — | ✅⁴ | — | — | ✅⁴ | ✅✅¹¹ |
| Token/contrast gate | — | — | — | — | — | — | — | ✅ |

1. `storybook-addon-accessibility-checker` — IBM's own axe wrapper rather than
   `@storybook/addon-a11y`, but the same job.
2. Primer has `axe-core` in its own suite and `@storybook/addon-a11y` in Storybook, but
   its `vitest.config.mts` declares a **node** project only — no `storybookTest`, no
   browser mode. Its `storybook.test.tsx` is structural (see note 5), not a render.
3. `features.interactions` enabled in development.
4. `@chromatic-com/storybook` (Spectrum) / Chromatic (SB-DS), which runs the visual diff
   and any play functions in one pass. Whether either has play functions to run was not
   verified — the capability is configured, the usage is *unverified*.
5. `src/__tests__/storybook.test.tsx` — asserts story **titles** match
   `Components/<Name>[/Features]`, that a `Default` export exists, that only `Default` and
   `Playground` are exported, that `Default` carries no `args`/`argTypes`, and that every
   `.docs.json` has a matching `.stories.tsx`. See finding 9.
6. `eslint-plugin-storybook`.
7. `check:visual-coverage` — every component in the index needs an asserted story or an
   `EXCLUDED` entry with a reason. Different target from Primer's, same instinct.
8. `@etchteam/storybook-addon-status`.
9. `storybook-addon-pseudo-states`.
10. `@storybook/addon-mcp` plus `features: { componentsManifest: true }`.
11. `✅✅` because `maxDiffPixels: 0` across 40 baselines covering every component in the index is stricter than
    anything else in the column, and `check:visual-coverage` makes the breadth a rule
    rather than a habit.

The bottom three rows are the ones to keep in view while reading the findings. **The
weaknesses below are all in one layer, and the strengths are all in another.** Nothing
here argues for rebuilding the parts that work.

---

## 1. Nothing audits accessibility — and it is hiding the exact failure this repo predicted

**Every one of the seven runs an accessibility addon.** That is the only unanimous row in
the matrix. `.storybook/main.ts` here loads exactly one addon:

```ts
addons: ['@storybook/addon-docs'],
```

[`docs/evaluation.md`](./evaluation.md) already called this out in August, and named the
sharpest version of it: the **blog**, which consumes this package and is composed into
this very sidebar, runs `@storybook/addon-a11y`. It still does, on the same Storybook
`10.5.5`:

```ts
// rtkelly13/blog — .storybook/main.ts
addons: ['@storybook/addon-vitest', '@storybook/addon-a11y', '@storybook/addon-docs'],
```

So one URL serves two tiers and audits only the downstream one. A contrast or focus
failure introduced here propagates to every consumer, and is caught — if at all — by the
consumer.

### What is actually there

The claim is usually left as a risk. It does not have to be. Running axe-core over the
built Storybook — 110 stories × both rungs of the ladder, 220 scans — gives this:

```bash
pnpm build-storybook
npx serve storybook-static -p 6006 --config ../serve.json
# then axe-core against /iframe.html?id=<story>&globals=level:<level>, per story per level
```

| Rule | Impact | Stories | Rungs it fires on |
|---|---|---|---|
| `button-name` | **critical** | 1 | both |
| `color-contrast` | **serious** | 1 | both |
| `heading-order` | moderate | 6 | both |
| `landmark-unique` | moderate | 2 | both |

Three page-level rules are excluded from that table, and it matters that the exclusion is
deliberate: `landmark-one-main` (102 stories), `page-has-heading-one` (87) and `region`
(69) fire on almost everything, because **a story is not a page** — an isolated `Badge`
has no `<main>` and should not. They were **258 of the 278 story-rule findings**. Any a11y
setup here has to turn those three off, or the signal is 93% noise. That decision belongs
in `preview.ts` with the reason written beside it, which is this repo's habit anyway.

What is left is ten findings across four rules, and the honest reading is **not** that the
catalogue is riddled with problems. It is not — `check:contrast` has already done the work
that usually dominates an axe report, and four rules across a 42-component catalogue is a
good result. Two of the four are already tracked: `button-name` is the unlabelled
`SlideDeck` control that #45 found by reading the code and #58 already fixes, and
`heading-order` is mostly story fixtures that open at `<h4>`. `landmark-unique` is
`DocsLayout` rendering two unlabelled `<nav>`s — a real component bug, and a one-line
`aria-label`.

The `serious` one is the interesting finding, and it is not the sort of thing a code read
would have found.

### The one failure the gate is structurally unable to see

`check:contrast` passes, and it is not wrong:

```
Contrast OK — 222 pairs across 2 levels, all at or above minimum;
24 selection devices clear 3:1; 16 Roles agree with their declared Hue.
```

axe disagrees, on a colour that is in no palette:

```
serious  color-contrast  saas-landingpage--sketch-mode
         ratio=3.98  fg=#77787a  bg=#f5f3ec
```

`#77787a` appears nowhere in `levels.ts` or `theme.css`. It is `sketch.text.primary`
(`#23262e`) at 60% over `sketch.surface.base`, rendered by
`src/components/saas/SaasLandingPage.tsx:288`:

```tsx
color: 'var(--ds-text-primary)',
opacity: 0.6,
```

**`opacity` changes the foreground after the gate has read it.** The role was addressed
correctly — this is not a hardcoded hex, and `pnpm lint` has nothing to complain about.
The token is right and the rendering is wrong, which is the one combination no rule in this
repo can currently express:

| | Ratio | `check:contrast` |
|---|---|---|
| `text.primary` on `sketch.surface.base`, as declared | 13.63 | ✅ passes |
| the same pair as **rendered**, at `opacity: 0.6` | **3.98** | ❌ not audited |

And it is not one site. `opacity` is applied to text at seventeen places across
`prose.css`, `SaasLandingPage`, `Card`, `AdminDashboardLayout` and `ExperimentsView`. The
floor, computed rather than guessed:

```
minimum opacity at which text.primary still clears 4.5:1 on surface.base
  midnight  45%
  sketch    64%
```

Three sites sit at or below `sketch`'s floor, and two more — `.docs-toc-link` and
`.docs-breadcrumbs-link` at `opacity: 0.65` — clear it by 0.09. Filed as **#135**, with
the full site table.

**This repo has a word for the class, and the word is why the gate cannot see it.**
[`CONTEXT.md`](../CONTEXT.md) defines:

> **Composited contrast**: The ratio between a foreground and a background that is itself
> translucent over another background — a keyword over a selection band over a code well.
> Neither Contrast nor Separation can express it.

Named in advance, by this repository, as the thing its own gates structurally cannot
measure — with the translucency on the background. What shipped has it on the
*foreground*, which the definition does not quite cover and should.

An axe run in Storybook expresses both directions for free, because axe reads composited
pixels rather than declared pairs. That is the strongest argument in this document for
finding 1. It is not "a11y hygiene": it is **the only cheap instrument that closes a hole
this repo had already identified and documented and could not otherwise close.**

One caution about how much the scan proves. `.docs-sidebar-link-static` computes to
**3.45:1** on `sketch` and axe never reported it, because every node in
`DocsSidebar.stories.tsx` has an `href` and the static branch therefore never renders. A
scan sees what the stories render — so it is bounded by story coverage, which is finding
9's argument, not a reason to distrust the ten findings above.

The other three are ordinary and small. `button-name` is a `SlideDeck` control with no
accessible name — a real bug in a shipped composition, invisible to a pixel baseline
because the button looks correct. `landmark-unique` is `DocsLayout` rendering two
unlabelled `<nav>`s, a one-line `aria-label`. `heading-order` is mostly story fixtures
starting at `<h4>`, which is the story's fault rather than the component's.

### The change

Two lines and a parameter, matching what the blog already does:

```ts
// .storybook/main.ts
addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
```

```ts
// .storybook/preview.ts — parameters
a11y: {
  test: 'error',
  // A story is not a page: these three fire on nearly every isolated component
  // and measure the fixture, not the system. They were 258 of the 278
  // story-rule findings in the full scan.
  config: {
    rules: [
      { id: 'landmark-one-main', enabled: false },
      { id: 'page-has-heading-one', enabled: false },
      { id: 'region', enabled: false },
    ],
  },
},
```

`test: 'error'` fails on violation rather than reporting it. `'todo'` reports without
failing — and note that `'todo'` is what the blog chose, and the blog's violations have not
been triaged since. A `'todo'` with no scheduled end is a permanent `'off'`. The backlog
here is ten findings, two of which are already covered by #58, so going straight to
`'error'` once #135 lands is the better trade.

Then, because this repo's whole thesis is that a rule which is not a Gate is a convention,
the a11y run belongs in the `gates` job of `ci.yml` beside `check:contrast` — where it
covers, empirically, the case `check:contrast` cannot. It needs finding 2 to have a
runner.

One thing worth doing at the same time: **scan both rungs, not one.** The opacity floor is
45% on `midnight` and 64% on `sketch`, so every finding of this class lives on the light
rung and a `midnight`-only run understates the risk by a factor of about 1.4 in alpha. The
same argument already exists in this repo for the screenshot walkthrough — a token change
that reads fine on `midnight` can be unusable on `sketch`. It is also the argument for
scanning *each new rung* as the ladder grows: this class of failure is a property of a
level's headroom, not of a component.

**Cost:** one addon, one parameter block, and ten fixes — of which `heading-order`'s six
are story fixtures, `landmark-unique`'s two are one `aria-label`, `button-name` is already
fixed in #58, and `color-contrast`'s one is #135's first item.

---

## 2. No story is ever executed — and there are zero play functions to execute

`grep` finds no `play` function anywhere in `src/stories/`, no `composeStories`, no
`@storybook/addon-vitest`, and nothing that imports `storybook/test`:

```bash
grep -rn "play: async\|composeStories\|storybook/test" src tests   # no output
```

`vitest.config.mts` includes `src/**/*.test.{ts,tsx}` only, in `jsdom`. So the unit suite
tests `src/lib/**` and `src/hooks/**` — the pure functions — and the Playwright suites
screenshot the components. **Nothing in between tests component behaviour.**

That gap has a specific shape here, because several components in this package are
*defined* by behaviour that a screenshot cannot see. From the README, in the repo's own
words:

> `CodeTabs` is the language / package-manager switcher: a real `tablist` with arrow-key
> traversal. Blocks sharing a `group` switch as one and the choice persists across pages.

Arrow-key traversal, group-linked switching, and cross-page persistence are three
assertions, and none of them exists. The same is true of `DocsHeader`'s search
affordance, `Pagination`, `Modal`'s focus behaviour, and the scroll-spy reading line that
`docs/theming.md` treats as load-bearing. All are asserted as pixels in one state.

**Three of the seven execute their stories** — Carbon via `features.interactions`,
Spectrum and the Storybook Design System via Chromatic, which runs play functions as part
of the same pass as the visual diff. Primer notably does *not*: its Vitest config declares
a node project only. So this is the row where the set is weakest, and "everyone does it"
would be an overstatement. The argument for doing it here is not the comparison — it is
the components.

### The change

The working configuration already exists in the estate. The blog has all three pieces:

```ts
// rtkelly13/blog — vitest.config.ts
{
  extends: true,
  plugins: [storybookTest({ configDir: path.join(dirname, '.storybook') })],
  test: {
    name: 'storybook',
    browser: {
      enabled: true, headless: true,
      provider: playwright({}),
      instances: [{ browser: 'chromium' }],
    },
    setupFiles: ['.storybook/vitest.setup.ts'],
  },
}
```

```ts
// rtkelly13/blog — .storybook/vitest.setup.ts
import * as a11yAddonAnnotations from '@storybook/addon-a11y/preview';
setProjectAnnotations([a11yAddonAnnotations, projectAnnotations]);
```

Note what that setup file does: it is **also** how finding 1's a11y check gets into CI.
The two findings are one piece of work, and doing them together is most of why this is
ranked first and second.

Porting it here means `@storybook/addon-vitest`, `@vitest/browser-playwright`, a
`projects` block in `vitest.config.mts`, and a `.storybook/vitest.setup.ts`. Then write
play functions where behaviour exists — `CodeTabs` first, because its behaviour is the
most documented and the least tested.

**One caution specific to this repo.** `vitest.config.mts`'s comment explains that the
Playwright suites are `*.spec.ts` and unit tests are `*.test.ts` precisely so the two
runners never collect each other's files. A Storybook Vitest project runs in browser mode
via Playwright, which is a *third* runner in the same repo. Give it its own `projects`
entry with an explicit `name`, exactly as the blog does, and keep `pnpm test` and
`pnpm test:visual` reporting separately — a merged runner would put the pixel gate and
the behaviour suite behind one verdict, which is the opposite of what `ci.yml`'s job
split was for.

**Cost:** two dependencies and a config block, then story-by-story. The dependency gate
(`check:deps`) requires a stated reason per package, which is the right forcing function
here.

---

## 3. Eight components have no props table at all, and `Button` is one of them

Measured from the real build:

```bash
pnpm build-storybook
# then extract __docgenInfo blocks from storybook-static/assets/*.js
```

| | Count |
|---|---|
| Components with a docgen props table | 40 |
| Components whose docgen has **no `props`** | **8** |

The eight: `Button`, `DesignSandbox`, `LoremIpsumPost`, `TableBody`, `TableCell`,
`TableHead`, `TableHeader`, `TableRow`. Two of them (`DesignSandbox`, `LoremIpsumPost`)
have no `autodocs` tag either, so they have no docs page to be empty on — see finding 9.
The other six do, and `Table*` is the exported compound-table API that `DataTable`'s docs
page is supposed to describe.

`Button` is the one that matters. Its `__docgenInfo` in the built Storybook is:

```js
__docgenInfo = {
  description: 'A button, or a link that looks like one.\n\n…',
  methods: [],
  displayName: 'Button',
}
```

Rich description, **no props at all**. So the published docs page for the most-copied
component in the package carries a paragraph of excellent prose about anchor-versus-button
semantics, and an empty table where `variant`, `size`, `bracketed` and `href` should be.
The long JSDoc on `variant` — the one explaining that the four names describe the colour
they happen to be on `midnight` rather than one they guarantee, and that renaming them is
a breaking change deliberately not bundled with the token migration — is not published
anywhere.

**The cause is a type shape, not a missing comment.** `ButtonProps` is a union of two
intersections:

```ts
export type ButtonProps = ButtonElementProps | ButtonLinkProps;
```

`react-docgen` — Storybook's default for `react-vite`, and unconfigured here — resolves
neither the union nor the `DetailedHTMLProps` intersections inside it, and emits the
component with no props rather than failing. The `Table*` family fails for the same class
of reason.

There is a second, quieter version of the same problem in the 40 that *do* work.
`Avatar`'s table lists its five own props and **none** of the
`React.HTMLAttributes<HTMLDivElement>` it extends — so `onClick`, `id` and `style` are
undocumented on every component that spreads HTML attributes, which is most of them.

### The change

Grafana configures this explicitly, and so does EUI alongside the set. Both chose the
TypeScript-aware extractor:

```ts
// Grafana — packages/grafana-ui/.storybook/main.ts
typescript: { reactDocgen: 'react-docgen-typescript', check: true }
```

```ts
// EUI — packages/eui/.storybook/main.ts
typescript: { reactDocgen: 'react-docgen-typescript', reactDocgenTypescriptOptions: { … } }
```

`react-docgen-typescript` resolves unions and inherited props. It is slower, and it has
the opposite failure mode: without a `propFilter` it dumps every inherited HTML attribute
into every table. EUI's `preview.tsx` shows the answer to that — it hides `css`, `className`
and `data-test-subj` from controls by default and lets individual stories opt back in.

So the change is `reactDocgen: 'react-docgen-typescript'` plus a `propFilter` that
excludes props declared in `node_modules`, which is the conventional one-liner. Then
verify against the eight above, because the build measurement is the only way to know it
worked — an empty props table is silent.

**A gate suggests itself, and fits this repo's habits exactly.** `check:api` already
compares the built type surface against a committed baseline. The analogous check here is
one script over `storybook-static/assets/*.js` asserting that every component in
`index.json` has a non-empty `props` in its docgen, or an entry in an `EXCLUDED` map with
a reason — the same shape as `check:visual-coverage`, for the same reason. That converts
"documented" from a hope into a gate, and it is the single most in-character improvement
on this list.

**Cost:** one config line, one filter, and a slower Storybook build. The gate is an
afternoon and reuses `check:visual-coverage`'s structure.

---

## 4. The published Storybook contains none of the writing, and the repo ships the kit for publishing it

`docs/` holds nineteen markdown files, three ADRs, a colour audit and a heritage set. It is the
best part of this repository. **None of it is in the Storybook**, because there is not a
single `.mdx` file in the repo:

```bash
find . -name "*.mdx" -not -path "./node_modules/*"   # no output
```

`.storybook/main.ts` globs `../src/**/*.stories.@(js|jsx|mjs|ts|tsx)` and nothing else.
So a consumer arriving at `design-system.ryankelly.dev` gets a component list and no
answer to *why colours are addressed by role*, *what the two rungs are for*, or *how to
add a level* — all of which are written, at length, and only readable on GitHub.

**Five of the seven put prose in the sidebar**, and Grafana's is the closest model:

```ts
// Grafana — four MDX pages sit alongside the component stories
'./Intro.mdx', './DesignPrinciples.mdx', './VoiceAndTone.mdx', './Accessibility.mdx'
```

Carbon lands the sidebar on `Welcome/Welcome.mdx` and sets `docs: { defaultName: 'Overview' }`.
Spectrum keeps a whole `./guides/*.mdx` tree. Primer globs `../src/**/*.mdx` beside its
stories.

The version of this finding that is specific to *this* repo is sharper than the
comparison, though. **This package ships a documentation portal it does not use for its
own documentation.** `DocsLayout`, `DocsSidebar`, `TableOfContents`, `Prose`, `CodeBlock`,
`CodeTabs`, `AnchorHeading` and `mdxComponents` exist, are exported, are described in the
README as "a complete chrome kit for MDX documentation sites", and are demonstrated
against fixture content in `Docs/Portal`. The system's own prose is not rendered through
any of it. Dogfooding aside, that is a missed proof: a docs kit whose author documents
elsewhere is an untested claim.

### The change

Not a wholesale port — most of `docs/` is agent-facing and should stay that way. CI shape,
dependency ratchets, the snapshot re-baselining policy and the incident log behind the
workflow rules are all for whoever is changing this repo, and none of them belongs in a
consumer's sidebar.

Four pages, aimed at a consumer rather than a maintainer:

| Page | Drawn from | Answers |
|---|---|---|
| `Intro` | README's opening | what this is, and the install |
| `The theme ladder` | `docs/theming.md`, `docs/theme-taxonomy.md` | what the two rungs are and how to select one |
| `Colour is addressed by role` | ADR 0001, ADR 0002 | why `accent.primary` and never `cyan` |
| `Accessibility` | `check:contrast`, and finding 1's results | what is measured, and what is not |

Add `'../src/**/*.mdx'` to the glob, set `docs: { defaultName: 'Overview' }`, and render
them through this package's own `mdxComponents` so the kit is exercised by the thing it
documents.

**Watch one trap.** `Foundations/Theme Ladder` and `Foundations/Semantic Tokens` already
do a version of this job as stories, and they are two of the strongest things in the
sidebar. MDX pages should *link* to them, not restate them — a token table that exists
twice will drift, and this repo's whole architecture is an argument against exactly that.

**Cost:** four pages of writing, mostly assembled from prose that already exists.

---

## 5. Nothing in the sidebar says what is stable, experimental, or deprecated

The package is at `0.5.0`, publishes 104 symbols, and has real maturity differences inside
it that a consumer cannot see:

- `Button`'s `variant` values (`cyan | pink | yellow | white | default`) are documented
  *in the source* as misleadingly named, with a rename identified as a breaking change
  deliberately deferred.
- The legacy accent names are described in the README as "deprecated", and still resolve.
- `Showcase/DesignSandbox`, `SaaS/LandingPage` and `SaaS/AdminDashboardLayout` are — per
  [`docs/surface-readiness.md`](./surface-readiness.md) — "screenshots of one specific
  product", at roughly 20–25% readiness.
- `Docs/*` is at ~90% and genuinely stable.

A consumer browsing the sidebar sees one flat list in which `Docs/Prose` and
`SaaS/LandingPage` look equally load-bearing. That is the gap: not that the maturity is
unknown, but that it is known, written down, and not surfaced where the choice is made.

**Spectrum solves this with an addon** — `@etchteam/storybook-addon-status`, which paints
a status per component. Storybook 9 onwards also supports the lighter version directly:
`tags` render as sidebar badges and can drive filtered views.

### The change

Tags, not an addon — the addon is a second vocabulary to maintain, and this repo already
uses `tags: ['autodocs']`:

```ts
// src/stories/Button.stories.tsx
tags: ['autodocs', 'stable'],
// src/stories/SaasLandingPage.stories.tsx
tags: ['experimental'],
```

Declare the vocabulary once in `.storybook/main.ts` so the set is closed, and — in this
repo's idiom — a script asserting that every component carries exactly one status tag is
the gate that keeps it honest. `docs/surface-readiness.md` already contains the
assignments; this publishes them.

**Cost:** one line per story file, plus the vocabulary. Half a day, and it is the cheapest
item on this list that a consumer would actually notice.

---

## 6. Hover, focus and active states are the system's identity, and none of them is asserted

This is the finding with the best cost-to-yield ratio here, because the expensive half is
already built.

The visual suite is strict — `maxDiffPixels: 0`, 40 baselines, a coverage gate. It
asserts every component in exactly **one interaction state: at rest.** But the aesthetic
this package is *for* is an interaction one. From `Button.tsx`:

> The press affordance — offset shadow that collapses as the control moves into it.
> Shared rather than repeated so the four accents cannot drift apart.

That is `PRESS` in `Button.tsx`, and it is three states in one constant:

```
shadow-hard-md  hover:shadow-hard-lg  active:translate-x-1 active:translate-y-1 active:shadow-none
```

Two of those three are never rendered by anything that checks them.

And [`docs/gap-analysis.md`](./gap-analysis.md) records the corresponding bug:

> `Input.tsx` | 10 [violations] | Focus ring is pinned on all three of `Input`,
> `TextArea`, `Select`

A pinned focus ring is invisible to every check in this repo. `check:contrast` audits
declared role pairs, not the ring as rendered on the rung in effect; the pixel gate never
focuses anything.

**Finding 1 is the proof that this matters, and it is proof by accident.** The
composited-contrast failure was caught only because `SaasLandingPage` renders its dimmed
text unconditionally — axe saw it because nothing had to interact first. Two results from
the same scan mark the limit: `.docs-sidebar-link-static` computes to 3.45:1 on `sketch`
and was **not** reported, because no story renders that branch; and #44's suppressed focus
ring is the same class of bug on the same kind of undeclared colour, and will never be
reported, because no story is ever focused.

So pseudo-states do not just add baselines. They put the remaining component states
**within reach of the a11y scan** — and `:focus-visible` is exactly where a substituted or
dimmed colour is least affordable. That is where findings 1 and 6 compound.

**Orbit is the model:** `storybook-addon-pseudo-states` forces `:hover`, `:focus`,
`:focus-visible` and `:active` as rendered states, which makes them screenshottable.

### The change

Add `storybook-addon-pseudo-states`, then add pseudo-state rows to `tests/visual.spec.ts`
for the components where a state is part of the contract — `Button` (shadow collapse),
`Input`/`TextArea`/`Select` (focus ring), `CodeTabs` (selected tab), `DocsSidebar`
(current item), `Pagination`. That is five or six new baselines against an existing
harness at zero tolerance.

Two reasons this is worth more here than in the projects it is copied from. First, the
`Selection device` concept in [`CONTEXT.md`](../CONTEXT.md) — "an accent fill or a 4px
accent edge, never one surface against another" — is a rule about a state, and
`auditSelectionDevices` checks it in the token layer while nothing checks it as rendered.
Second, once a focus ring is a committed baseline at `maxDiffPixels: 0`, finishing the
`Input` token migration produces a diff a human has to approve, which is precisely the
review this repo wants and currently cannot get.

**Cost:** one addon, five or six baselines. It reuses the harness, the coverage gate and
the `/update-snapshots` workflow as they stand.

---

## 7. There is no machine-readable manifest, in the most agent-driven repo in the set

Verified absent from the build:

```bash
find storybook-static -name "*manifest*"   # no output
```

Storybook 10 generates **manifests** — JSON describing every component, story and doc,
built from static analysis of CSF plus prop extraction — at `/manifests/components.json`,
behind `features: { componentsManifest: true }`. `@storybook/addon-mcp` serves them to
agents so a coding agent can query the real component set instead of guessing at it.
Storybook's docs say 10.4 renamed the flag from `experimentalComponentsManifest` and
defaults it to `true`, and that `init` offers to wire the addon up. This repo is on 10.5.5
with the addon absent and the flag unset, and a real build emits no `manifests/` at all —
so whatever the default is meant to be, nothing is being produced here. The build is the
authority; declare the flag explicitly rather than relying on the default.

**Primer is the only one of the seven that has this**, and it has both halves:

```ts
// Primer — packages/react/.storybook/main.ts
addons: [ …, '@storybook/addon-mcp'],
features: { componentsManifest: true },
```

The reason to rank it here rather than dismiss it as new: **this repo is unusually
agent-driven, and it is the repo where a manifest pays off most.** `AGENTS.md` is a
hierarchical knowledge base with nineteen linked topic docs, each one introduced with
*when* to load it; `CONTEXT.md` exists specifically to give an agent the domain
vocabulary; `api/index.d.ts` is a committed machine-readable baseline of the public
surface, gated by `check:api`; and `tokens/palette.<level>.tokens.json` is a DTCG export
of the palette, gated by `tokens:design:check`. The sibling `the-vault-system` repo takes
the same instinct further with a whole doctrine of machine-readable command discovery.

That last one is the sharpest version of the argument. **The palette is already
queryable and the components are not.** An agent can read every colour decision as
structured data and still has to read `api/index.d.ts` for the component names and infer
usage from story source. The manifest is the missing half of a decision this repo has
already made twice.

There is a caveat worth stating plainly: a manifest built by prop extraction inherits
finding 3. With `Button`'s props missing from docgen, they would be missing from the
manifest too — so an agent would be told `Button` exists and not told it takes a
`variant`. **Finding 3 is a prerequisite, not an independent item.**

### The change

```ts
// .storybook/main.ts
features: { componentsManifest: true },
addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-mcp'],
```

Then check `storybook-static/manifests/components.html`, which is Storybook's own
human-readable debugger for the manifests and reports generation errors — the fastest way
to see whether finding 3 is actually fixed.

**Cost:** two lines and a dependency. Sequence it after finding 3.

---

## 8. Story files are the one authored surface in this repo with no rules about it

Primer has the most in-character check in the whole survey, and it is not an addon. It is
a plain test over its own story files —
[`src/__tests__/storybook.test.tsx`](https://github.com/primer/react/blob/main/packages/react/src/__tests__/storybook.test.tsx) —
which asserts that story titles match `Components/<Name>` or `Components/<Name>/Features`,
that a `Default` export exists, that only `Default` and `Playground` are exported, that
`Default` carries no `args` or `argTypes`, and that every docs file has a matching stories
file. No rendering, no axe, no browser. Structural rules about authoring, as a gate.

This repo is full of gates of exactly that kind — `tokens:check`, `check:api`,
`check:css`, `check:fonts`, `check:deps`, `check:visual-coverage`, and two custom ESLint
rules — and `src/stories/` is governed by none of them. `eslint.config.mjs` does scope the
colour-literal rule to `src/stories/**`, so colours are covered; nothing else is. The
conventions are real and consistent, and they are consistent by hand:

| Convention, followed today | Enforced |
|---|---|
| `title` is `<Group>/<Component>`, from a fixed set of six groups | no |
| Groups are `Foundations`, `Docs`, `Blog`, `Presentation`, `SaaS`, `Showcase` | no |
| Component stories carry `tags: ['autodocs']`; compositions do not | no |
| One story file per component, named `<Component>.stories.tsx` | no |
| A story id named in `tests/visual.spec.ts` must exist in the index | **yes**, via `check:visual-coverage` |

The last row is the tell: the repo already reads `storybook-static/index.json` in a gate
and compares it to a hand-written list. Every convention above is a further assertion over
the same file, in the same script, for near-zero marginal cost — and each one prevents a
class of silent breakage. A story retitled from `Foundations/Button` to
`Components/Button` changes its id, which orphans a committed PNG and, per the spec's own
comment, *must not* happen by accident:

> The first five names are unchanged from when this file listed them by hand — their
> baselines are still valid and must not be regenerated by a rename.

That warning is a comment. Primer's version of it is a test.

**The change:** extend `check:visual-coverage`, or add a sibling script, asserting the
group vocabulary and the one-file-per-component rule against `index.json`. Add
`eslint-plugin-storybook` in the same pass for the authoring mistakes a structural check
cannot see. Ties into finding 5: a closed status-tag vocabulary needs precisely this kind
of check to stay closed.

**Cost:** an hour, reusing an existing script's structure.

---

## 9. Small things, worth a single pass

Each of these is minutes, and none deserves its own section.

**No sidebar order.** `preview.ts` sets no `storySort`, so the sidebar is glob order and
`Blog/` lands first — a consumer's first impression of a token system is a lorem-ipsum
blog post. EUI orders its categories explicitly (`Theming, Templates, Layout, Navigation,
Display, Forms, …`) and Carbon lands on a `Welcome` page. The order that matches this
system's own argument is `Foundations` → `Docs` → `Blog` → `Presentation` → `SaaS` →
`Showcase`: the token surfaces first, the product screenshots last. Pairs naturally with
finding 4's `Intro` page.

**Eight story files have no `autodocs` tag**, so eight components have no docs page:
`AdminDashboardLayout`, `DesignSandbox`, `DocsPortal`, `LoremIpsumPost`, `SaasLandingPage`,
`SemanticTokens`, `SlideDeck`, `ThemeLadder`. Seven of the eight are compositions or
showcases where a props table would be noise, so this reads as deliberate — but it is
undeclared, and `SemanticTokens` is arguably the one page in the sidebar most deserving of
prose. Either tag it or write the reason down; a bare absence is the thing this repo's
`EXCLUDED`-with-a-reason pattern exists to prevent.

**`eslint-plugin-storybook` is absent.** Orbit runs it; see finding 8. Near-zero cost, and
it drops into the existing `lint` job.

**`react-docgen`'s silence is itself the lesson.** Both finding 3 and finding 7 are
absences that produce no error — an empty props table renders as an empty table, and a
missing manifest is a missing file. `ci.yml`'s comments show this repo already knows the
failure mode: every visual baseline was once a screenshot of the "No Preview" panel and
the suite passed throughout. The same class of bug is live in the docs layer, and the
same answer applies.

---

## Ordered plan

Ordered by dependency and by cost, not by severity.

| | Work | Closes | Rough cost |
|---|---|---|---|
| 1 | Replace `opacity` on text with a declared text role at the sites below `sketch`'s 64% floor (#135) | the one shipped AA failure | an hour |
| 2 | `@storybook/addon-a11y` + `@storybook/addon-vitest` + `vitest.setup.ts`, the three page-rule exclusions, a11y at `'error'`, both rungs, wired into the `gates` job | findings 1 and 2; a11y becomes a Gate, and item 1 stays fixed | half a day, then the 8 fixes item 1 does not cover |
| 3 | `reactDocgen: 'react-docgen-typescript'` + a `propFilter`, verified against the eight | finding 3; prerequisite for 7 | an hour, plus a slower build |
| 4 | A docgen coverage gate shaped like `check:visual-coverage` | keeps finding 3 fixed | an afternoon |
| 5 | `storybook-addon-pseudo-states` + 5–6 baselines | finding 6; makes the `Input` token migration reviewable | an hour |
| 6 | Status tags, a closed vocabulary, and the story-convention assertions in one script | findings 5 and 8 | half a day |
| 7 | `storySort`, the eight `autodocs` decisions, `eslint-plugin-storybook` | finding 9 | an hour |
| 8 | Four MDX pages through this package's own `mdxComponents` | finding 4; dogfoods the docs kit | a day of writing |
| 9 | `features.componentsManifest` + `@storybook/addon-mcp` | finding 7 | ten minutes, after 3 |

Item 1 is first only because it is a live AA failure on a shipped component, and because
the fix — address a text role instead of dimming one — removes the whole class rather than
patching an instance. Everything after it is ordered by dependency and cost. Item 2 is two findings
in one row because they share a single `vitest.setup.ts` — that file is simultaneously how
stories become tests *and* how the a11y check reaches CI, which is most of why they are
ranked together.

Play functions are not a numbered item because they are not a project. They get written
one component at a time, starting with `CodeTabs`, once item 2 gives them a runner.

---

## Deliberately not recommended

**Chromatic.** Two of the seven use it, and it would replace a suite this repo has already
tuned harder than Chromatic's defaults — `maxDiffPixels: 0`, a measured worker count with
a written determinism argument, a coverage gate, and a `/update-snapshots` command with a
stated re-baselining policy. Migrating would trade all of that for a hosted review UI and
a third-party dependency in the merge path. The one thing it offers that is genuinely
missing is *review*, and `docs/evidence-pipeline.md` is already the plan for that.

**`@storybook/addon-designs` and Figma integration.** Spectrum has it. There is no Figma
file here, and the palette's provenance is arithmetic in `src/theme/levels.ts`, not a
design tool. Adding a Figma link surface would be inventing an upstream that does not
exist.

**`@storybook/addon-measure` / `addon-outline`.** Spectrum has both. They are inspection
aids for a *contributor*, and a solo contributor has browser devtools. No gate, no
consumer benefit.

**Splitting the Storybook out of the package repo.** Several of the set do this. It buys
nothing here and breaks the thing that works: the Storybook compiles from `src/`, not
`dist/`, which is why `ci.yml`'s `visual` job runs beside `build` rather than after it.

**A separate docs site.** Deferred, not rejected — see below.

---

## The decision this analysis cannot make

**Is Storybook the documentation surface, or the component workbench?**

Right now it is both, and the two roles pull in opposite directions. The workbench wants
every state of every primitive, including `Showcase/DesignSandbox` and the two SaaS
screenshots. The documentation surface wants a curated path through two rungs and six
role groups, with the 25%-readiness product mockups nowhere near it.

Finding 4 assumes Storybook stays the documentation surface, and its four MDX pages are
the cheap version of that answer. But the estate contains a live alternative: this
package **ships a documentation portal** — `DocsLayout`, `Prose`, `TableOfContents`,
`mdxComponents`, router-aware navigation, anchored headings. A `docs.design-system.ryankelly.dev`
built from `docs/` on this package's own kit would dogfood it far harder than four MDX
pages inside Storybook, and would let the Storybook go back to being a workbench with
status tags and no prose obligations. Notably, most of the systems that *skip* Storybook
entirely — Mantine, Radix, Cloudscape — have made exactly this choice in reverse.

The costs are real either way: a second surface is a second thing to host, deploy and keep
in step, on a repo where one person maintains seven workflows. And Storybook composition
already argues the other way — one URL serving both tiers is a decision this repo made on
purpose, and documented.

Nothing above depends on resolving this **except finding 4**. Plan items 1 through 7 and 9
are correct under either answer — the a11y gate, the props tables, the pseudo-states and
the manifest are all wanted whichever surface carries the prose. Only item 8 waits, and
finding 5's status tags get *more* valuable if Storybook becomes a workbench rather than
less. Worth deciding before writing the MDX, and not before anything else.

---

## Sources

Configuration read from source, 2026-09-09:

- Primer React — [`packages/react/.storybook/main.ts`](https://github.com/primer/react/blob/main/packages/react/.storybook/main.ts) · docs at [primer.style/react](https://primer.style/react)
- Carbon — [`packages/react/.storybook/main.ts`](https://github.com/carbon-design-system/carbon/blob/main/packages/react/.storybook/main.ts) · Storybook at [react.carbondesignsystem.com](https://react.carbondesignsystem.com/)
- Grafana UI — [`packages/grafana-ui/.storybook/main.ts`](https://github.com/grafana/grafana/blob/main/packages/grafana-ui/.storybook/main.ts) · Storybook at [developers.grafana.com](https://developers.grafana.com/)
- Spectrum CSS — [`.storybook/main.js`](https://github.com/adobe/spectrum-css/blob/main/.storybook/main.js) · Storybook at [opensource.adobe.com/spectrum-css](https://opensource.adobe.com/spectrum-css/)
- Polaris — [`polaris-react/.storybook/main.js`](https://github.com/Shopify/polaris/blob/main/polaris-react/.storybook/main.js)
- Orbit — [`packages/orbit-components/.storybook/main.ts`](https://github.com/kiwicom/orbit/blob/master/packages/orbit-components/.storybook/main.ts) · Storybook at [kiwicom.github.io/orbit](https://kiwicom.github.io/orbit/) · docs at [orbit.kiwi](https://orbit.kiwi)
- Storybook Design System — [`.storybook/main.ts`](https://github.com/storybookjs/design-system/blob/master/.storybook/main.ts)
- Elastic EUI — [`packages/eui/.storybook/main.ts`](https://github.com/elastic/eui/blob/main/packages/eui/.storybook/main.ts), [`preview.tsx`](https://github.com/elastic/eui/blob/main/packages/eui/.storybook/preview.tsx)

Storybook features referenced: [Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon),
[accessibility tests](https://storybook.js.org/docs/writing-tests/accessibility-testing),
[manifests](https://storybook.js.org/docs/ai/manifests),
[MCP server](https://storybook.js.org/docs/ai/mcp/overview),
[feature lifecycle labels](https://storybook.js.org/docs/releases/features),
[`@storybook/addon-mcp`](https://www.npmjs.com/package/@storybook/addon-mcp),
[`storybook-addon-status`](https://github.com/etchteam/storybook-addon-status).

The hosted Storybooks above are the URLs each project's own README gives. They could not
be loaded from the environment this was written in, so nothing here is a claim about how
they render — only about what their configuration declares.
