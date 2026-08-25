# AGENTS.md

Foundational brutalist design system for ryankelly.dev and personal web applications (`@rtkelly13/design-system`, published to public npm).

Package manager is **pnpm** (`node >=22`).

---

## 🛑 Repository Conventions & Workflow Policy

1. **Squash Merge Only**: All pull requests must be merged into `main` using **Squash and Merge** exclusively.
2. **Delete Branch on Merge**: Feature branches must be automatically or manually deleted immediately upon merge into `main`.
3. **Linear History**: Maintain a strictly linear history. Rebase feature branches onto `main` before merging; no merge commits allowed.
4. **Publishing (npm, trusted publishing)**:
   - Stable releases publish automatically from pushes to `main` via `publish-package.yml`, using npm **Trusted Publishing** (OIDC) — no tokens anywhere. Bump `package.json` version in the PR; the workflow skips already-published versions.
   - Dev prereleases: comment **`/publish-dev`** on a PR to publish `<version>-dev.<pr>.<sha>` under the `dev` dist-tag (`publish-dev-command.yml` dispatches the trusted workflow on the PR branch). Consumers test with `pnpm add @rtkelly13/design-system@dev`.
   - The Tailwind contract consumers import is **`theme.css`** (`@theme` tokens, per-level and polarity variants, `@source`) — now **generated** from `src/theme/levels.ts`; `styles.css` layers fonts + global resets on top. There is no JS tailwind preset — do not reintroduce one.
5. **Visual Regression Testing** — the standards, the determinism contract and the operating instructions live in [`docs/visual-regression.md`](./docs/visual-regression.md); these are the rules:
   - Powered by Playwright snapshot testing (`tests/visual.spec.ts`).
   - Runs strictly on **Linux CI** to avoid OS font rendering diffs. Tolerance is `maxDiffPixels: 0` — no allowance, because rendering is pinned to one Chromium build on one OS. It was `maxDiffPixelRatio: 0.05`, which let ~46,000 pixels of a 1280x720 shot differ freely and was only ever exercised against a placeholder image. Raise it only to the smallest number a real run demands, and say which story forced it.
   - **Clean URLs must stay off in the static server.** `serve` enables them by default, which 301s `/iframe.html?id=<story>` to `/iframe` and **drops the query string**. Storybook then has no story to select and renders its "No Preview" placeholder — and because `--update-snapshots` will happily bake that placeholder in as the baseline, the whole suite silently passes while testing nothing. That is exactly what happened up to `0.0.5`: all five baselines were the same error page. Both Playwright configs therefore pass `--config ../serve.json`, which sets `cleanUrls: false`; see "`serve.json` is load-bearing" below. `tests/story-ready.ts` is the second line of defence, asserting on Storybook's `sb-show-main` / `sb-show-nopreview` / `sb-show-errordisplay` body classes so a non-render fails loudly rather than being screenshotted.
   - Run manual snapshot updates via GitHub Actions `Update Visual Regression Snapshots` workflow (dispatch it on your branch; it commits regenerated baselines back to that branch — this repo blocks Actions from creating PRs).
   - **The update runs in `missing` mode by default**, writing only baselines that do not exist. That matters: a bare `--update-snapshots` presets to `changed`, so a run intended to add one new story would also re-record every baseline whose render had drifted — which is exactly how a regression becomes the expectation. Say **`/update-snapshots all`** (or `changed`) when a change is *meant* to alter rendering; the mode is echoed back in the PR comment so a reviewer can tell "two added" from "everything re-recorded".
   - Note that the snapshot workflow pushes as `github-actions[bot]`, and CI runs on bot-authored commits land in **`action_required`** — they need an "Approve and run" click before the PR shows a green check.
6. **Required Checks** — all of these run on every PR, spread across three
   parallel jobs in `ci.yml`; see § *CI Shape* for which job runs what and why.
   Branch protection requires the single aggregate check named **`ci`** (the
   `verify` job), which passes only if all three jobs do. That name is
   deliberately content-free, and **must stay that way**: the string is what
   branch protection and `shared-utilities`' governance map match on. It used to
   list what CI did, and splitting the single job into three silently rewrote it
   — the map went on requiring a job that no longer reported, so every PR failed
   `repo-governance verify-pr-checks` with all seven checks green. Rename the
   three jobs below freely; never rename `ci`:
   - `pnpm tokens:check` (theme.css matches `src/theme/levels.ts`)
   - `pnpm check:contrast` (every role pair, every level)
   - `pnpm lint` (colour-instead-of-role, reported at the site)
   - `pnpm check:css` (styling-in-CSS ratchet)
   - `pnpm check:deps` (dependency reasons, sections and usage)
   - `pnpm check:visual-coverage` (every story asserted or excluded with a reason)
   - `pnpm typecheck`
   - `pnpm test` (unit — see "Unit Tests" below)
   - `pnpm build`
   - `pnpm check:api` (the published type surface matches `api/index.d.ts`)
   - `pnpm build-storybook`
   - `pnpm test:visual` (Linux CI)
7. **New Components Need Baselines**: adding a story without a snapshot leaves
   `test:visual` unable to assert it. Add the story and its `CASES` row, comment
   **`/update-snapshots`** on the PR to generate the baseline, then push.
   `missing` mode writes only what does not exist, so this cannot re-record an
   existing baseline that has drifted.
   Note that Playwright reports a test that *creates* a baseline as failed, on
   purpose — `missing` mode attaches a soft error so a new baseline is never
   silent. So the update workflow's generate step is expected to exit non-zero
   whenever it does its job, and tolerates it; the **verify** step that follows,
   which re-runs the suite with no update flag, is the gate that decides whether
   the baselines get committed.
   This is not a convention you have to remember: `pnpm check:visual-coverage`
   reads Storybook's own build index and fails when a **component** has no
   asserted story and no `EXCLUDED` entry giving a reason. The budget is **0** and
   should stay there.
   It counts components, not stories, and that distinction is the rule: the suite
   asserts **one representative story per component**, because every row is a
   committed PNG a human reviews whenever it changes, so breadth across
   components is worth more than depth within one. A second story on a covered
   component is therefore free — the old story-counting budget got angrier at it
   while coverage improved not at all. It also catches the reverse: an `id` in the
   spec that Storybook no longer builds, i.e. a test asserting nothing.
   `tests/visual.spec.ts` is a table for this reason — adding a component means
   adding a row, and the id appears exactly once.
8. **Re-baselining Happens In The PR**: any change that legitimately alters
   rendering turns the visual check red. Comment **`/update-snapshots`** on the
   PR — it regenerates on Linux, verifies the suite passes against the new
   baselines, commits them back to the branch, and reports what changed. No
   merge required. `workflow_dispatch` still works for baselining `main`.
   Caveat: the baseline commit is pushed with `GITHUB_TOKEN`, and GitHub does
   not start workflow runs from those pushes, so the PR's own visual check keeps
   its previous result until you re-run it or push again. The verification step
   inside the update run is what tells you the new baselines are good.
   Closing that last gap needs a push identity that is not `GITHUB_TOKEN` —
   designed, with the exact token to create, in
   [`docs/ci-dispatch-token.md`](./docs/ci-dispatch-token.md). Not implemented;
   nothing reads `CI_DISPATCH_TOKEN` yet.
9. **Every CI Job Has A Ceiling, And Browser Installs Retry**: a job with no
   `timeout-minutes` inherits GitHub's six-hour default, and a run killed at
   that limit is reported as **`cancelled`**, not failed — a red mark that
   names no step and suggests someone pressed a button. That is exactly how
   `main` went red on `dafbc1f`: `playwright install --with-deps` hung on both
   `ci.yml` and `storybook-walkthrough.yml`, burned six hours each, and a
   manual re-run of the identical SHA passed in two minutes. So: every job
   carries a `timeout-minutes`, and the browser install goes through
   [`.github/actions/install-playwright`](./.github/actions/install-playwright/action.yml),
   which bounds each attempt with `timeout` and retries once. Use `pnpm exec`,
   never `npx`, for anything Playwright: `npx` falls back to fetching the
   latest published CLI, and a Playwright other than the lockfile's installs a
   different Chromium — which under `maxDiffPixels: 0` moves every baseline
   rather than failing loudly. Related: `if: always()` on an upload step also
   fires on cancellation, so paired with `if-no-files-found: error` it turns
   every cancelled run into a failing step. Use `if: success() || failure()`.

---

## 🎨 Design System Principles

- **Zero Border-Radius**: `0px` globally enforced.
- **Hard Offset Shadows**: `shadow-hard-*` utilities (2px, 4px, 6px offset, no blur).
- **A Four-Rung Theme Ladder**: `midnight` → `dim` → `bright` → `white`, selected by a `data-theme` attribute. Not a light/dark flip — see Theme Ladder below.
- **Bracketed Display Typography**: Headings render in Space Grotesk enclosed in `[ BRACKETED ]` display type.
- **Semantic Roles Over Hues**: Components address roles, never colours. See below.
- **Styling Lives in TSX**: Tailwind utilities on the element. CSS files declare variables and nothing else. See below.

---

## 🧱 Styling Lives in TSX

**A component's appearance is written on its elements, as Tailwind utilities.
CSS files declare variables.** There is no third place for styling to live, and
no `.component-name { … }` class to go looking in.

Composition goes through **`recipe` from `src/lib/recipe.ts`** — never a
template string. `src/components/Input.tsx` is the worked example: one slot per
element, variants as data, and the consumer's `className` passed as the recipe's
`class` override.

That last part is a correctness fix, not a convenience. Appending a caller's
`className` to the end of a string does nothing: Tailwind decides between two
conflicting utilities by **CSS source order**, not class-attribute order, so a
caller's `bg-surface-raised` was racing the component's `bg-surface-base` and
whichever the stylesheet emitted later won. Every `className` prop in this
package was unreliable in exactly that way. `recipe` resolves the conflict
before the string reaches the DOM.

**Which library builds the recipes is an implementation detail of that one
file.** `tailwind-variants` currently does, chosen because most components here
style more than one element and the alternatives model one element per recipe.
Nothing else in the package names it, and `recipe` is deliberately **not**
exported from the entrypoint: its type comes from that library, so exporting it
would put the library back into the published `.d.ts` and make swapping it a
breaking change. `cn` is public, with a signature written out locally for the
same reason.

Only the hard-shadow scale needs declaring to the class merger — `shadow-none`
could not otherwise clear `shadow-hard-md`. Everything else works untouched: the
merger classifies the semantic tokens correctly out of the box, including telling
a colour from a size in the same `text-*` position.

`pnpm check:css` enforces it, and it is still a ratchet: it counts
every declaration whose selector names a class this repo authors and fails when
the number rises. `pnpm check:css:list` shows what is left.

### The three things CSS may still do

Each is exempt because there is no element in a component to put a `className`
on — not because it was inconvenient to move.

| Exempt | Why | Where |
|---|---|---|
| Custom properties (`--x: …`) anywhere | Variables are the sanctioned CSS payload | `theme.css`, generated |
| Selectors of only element names, `:root`, `html`, `body`, `*`, pseudo-classes | No JSX element for the document; a consumer's own `<h1>` has no class we can add | `styles.css` |
| Class names emitted by third-party tooling | We never render `.markdown-alert` — a remark plugin does | `prose.css`, listed in `THIRD_PARTY` |

### Prose is the plugin's job, not ours

A Markdown pipeline emits bare tags with no class names, so there is nothing for
a utility to attach to. **`@tailwindcss/typography`** is built for that case, so
the prose layer is the plugin plus two things:

- `@utility prose-ladder` in `prose.css` maps its `--tw-prose-*` knobs onto the
  `--ds-*` role tokens. Variables only, so it is the sanctioned CSS payload —
  and there is deliberately no `--tw-prose-invert-*` block: the plugin needs one
  because it models theming as a light/dark flip, while `--ds-*` already resolves
  per level, so one mapping is correct on all four rungs.
- The brutalist deltas are `prose-h1:` / `prose-table:` / `prose-code:` element
  modifiers in `Prose.tsx` — the plugin's own mechanism for exactly this.

The plugin is an **optional peer dependency**: `@plugin` resolves from the
*consumer's* `node_modules` at their build time, so it cannot be bundled. Only
`prose.css` consumers need it; `theme.css`-only consumers do not.

Chrome nested inside an article (a breadcrumb above the title, a pager below the
body) carries `not-prose`, which every selector the plugin generates excludes.
That replaced ~70 declarations of hand-written reset — and it is the reason to
prefer the plugin over `[&_h2]:…` arbitrary variants on the container, which
would keep all of CSS's specificity gymnastics with worse ergonomics.

There is deliberately **no hook-class exemption**. `AsciiDivider` used to keep a
bare `.ascii-divider` class so the blog could attach `::after` to it — the last
hole in the rule. `Divider` closes it: the mark differs by *polarity*, so that
is now a `Record<Polarity, string>` in the component and the glyph is real text
rather than generated content. When a pseudo-element seems necessary, the
question to ask first is what design decision it is encoding, and whether that
belongs in a component.

### Consequences worth knowing before you rely on them

- **Consumers must import `theme.css` and let Tailwind scan the package.** The
  generated `theme.css` carries `@source "./"`, which points at `dist/` once
  published — verified: a consumer importing only `theme.css` gets every
  utility, variants and arbitrary values included, generated from the compiled
  bundle. This is what makes the rule safe, and it is why that `@source` line
  must never be removed.
- **The system no longer promises to style raw HTML.** `prose.css` styles bare
  tags inside `.docs-prose`; as those move into `mdxComponents`, Markdown must
  be rendered *through* the component map. A consumer pushing a markdown-to-HTML
  string through `dangerouslySetInnerHTML` will get unstyled output.
- **Translate faithfully, then check.** Named Tailwind sizes ship a paired
  line-height that a bare `font-size` declaration did not — `text-xs` is
  `0.75rem` *and* a leading. `Badge` uses `text-[0.75rem]` precisely so it keeps
  inheriting the article's unitless `1.5`. This cost one round of visual-suite
  failures to find; when a migration shifts layout by a few pixels, this is why.

### What is migrated

`styles.css` is done — its four component classes are utilities in `Badge`,
`Divider` and `ExperimentsView`, and `.brutalist-btn` / `.brutalist-btn-pink`
were deleted outright as they had no caller. What is left in that file is
document-level and stays.

`prose.css` is down from 455 declarations to 328. The bare-tag prose rules and
the chrome-inside-prose resets are gone. What remains is the docs chrome —
roughly twelve components, each with a 1:1 class. Migrate one per PR with
`recipe`, and lower its budget line.

`pnpm lint` also answers the other question — **does this class exist at all?**
`eslint-plugin-tailwindcss`'s `no-custom-classname` is the only check that catches
a class naming *nothing*, which is this repo's most expensive recurring bug:
`focus:border-brutalist-green`, `brutalist-card-panel`,
`.sketch .ascii-divider::after` and `bracket-glyph` were all dead on the day they
were written. Tailwind will not help — an unknown utility emits no CSS, exits 0
and warns about nothing.

**The whitelist is derived, not written.** `scripts/authored-classes.mjs` reads
the class names out of `styles.css`, `prose.css` and `theme.css`, so the rule asks
"does this exist" rather than "is this Tailwind". That is the difference between a
usable gate and 51 false positives on the docs chrome — and it maintains itself:
migrate a docs-chrome class into a `recipe`, it leaves `prose.css`, leaves the
derived list, and starts being rejected.

Two configuration details, both load-bearing: `cssConfigPath: 'src/styles.css'`,
because the plugin defaults to the singular `style.css`; and `recipe` in its
`functions`, or it never looks inside a recipe, which is where most class strings
live.

**Its one blind spot is a class string wrapped in a method call** —
`className={foo.trim()}` is not traversed, where `cn(...)`, a recipe slot, a
template literal and a plain string all are. That is one more reason composition
goes through `cn` or `recipe`: the alternatives are invisible to the check.

**No call site sits in that blind spot any more.** Thirteen components composed
with `` `…${className}`.trim() `` and `Tag` did the same thing one step removed,
assigning the template to a variable first — which is why the grep for the
`.trim()` shape found thirteen and the real number was fourteen. All are `cn()`
now. Moving them turned up four dead classes that the rule had never been able
to see: `style-card-wrap`, and `docs-toc` / `docs-sidebar` / `docs-breadcrumbs`,
each of which exists only as the prefix of its children (`docs-toc-link` is a
real rule; `docs-toc` never was). If a fifteenth appears, it will be caught the
day it is written rather than found by a sweep.

The derived whitelist has one hand-maintained entry, `PLUGIN_EMITTED` in
`scripts/authored-classes.mjs`: `not-prose` is generated by
`@tailwindcss/typography`, so no stylesheet here declares it and deriving from
the sheets structurally cannot find it. It is the same category as the
`markdown-alert-*` names in `check-css.mjs`'s THIRD_PARTY. Keep that list to
classes that provably exist — every entry is a place the rule has been told to
stop asking.

---

## 🎯 Selection State

**A selected item is marked with an accent `fill` or a 4px accent `edge`. Never
with one surface against another.**

The surfaces exist to *layer* — a strip behind its tabs, a panel over a page —
so they are deliberately close in lightness: `surface.raised` against
`surface.base` is under 1.1:1 on every rung, and on `bright` it is 1.03:1. A
widget that marks its chosen tab `bg-surface-base` among `bg-surface-raised`
siblings therefore reads on `midnight`, where the reviewer usually is, and is
invisible on the light rungs. That is exactly how it shipped once, in the blog.

`pnpm check:contrast` now carries the rule as arithmetic
(`auditSelectionDevices` in `src/theme/contrast.ts`): every accent fill and edge
must clear 3:1 against `base` and `raised` on every level, and the surface pairs
are printed in the report so the number that rules them out is in the output
rather than in someone's memory. `src/theme/contrast.test.ts` asserts both
halves. `CodeTabs` is the worked example — three variants, each selecting by
fill or edge, none by surface.

Pair either device with a text change (`text-content-muted` →
`text-content-primary`, or `text-content-inverse` on a fill) so the state reads
at a glance and not only in colour.

---

## 🪜 The Theme Ladder

**`src/theme/levels.ts` is the only place a level name or a level colour is written.**
Everything else derives from it: `src/theme.css` (generated), the runtime provider, the
Storybook toolbar, the walkthrough matrix, and the contrast gate.

| Level | Polarity | Ground | For |
|---|---|---|---|
| `midnight` | dark | `#0a0a1a` | Neon on blue-black — the maximal end |
| `dim` | dark | `#121316` | Desaturated, softer inks, long reading |
| `bright` | light | `#fcfbf9` | Warm sketch paper and pen ink |
| `white` | light | `#ffffff` | Neutral, print-safe, dense UI |

Four rules follow from that, and they are what keep four levels maintainable:

1. **`theme.css` is generated — never edit it.** Change `levels.ts`, run `pnpm tokens:build`,
   commit both. `pnpm tokens:check` fails CI on drift. TypeScript covers the TS half of the
   ladder; this covers the CSS half, which is where the drift used to live.
   `src/theme.css.test.ts` covers a third thing neither reaches: the *shape* the
   generator has to emit. Every `@theme` token that indirects through a
   per-level variable is repeated inside all four level blocks, because a custom
   property substitutes where it is **declared**, not where it is used — so an
   alias left only in `@theme` resolves against the root level and a nested
   `<ThemeProvider scoped>` panel keeps the wrong colour. `tokens:check` would
   not notice: it proves the CSS matches `levels.ts`, and would be equally happy
   with a generator that reproducibly emitted the wrong shape. Neither would a
   screenshot, since single-level pages render correctly either way.
2. **Never branch on a level with an if-chain.** Use a `Record<ThemeLevel, T>` — adding a rung
   is then a compile error until every branch answers it — or end a `switch` with
   `assertNever(level)`. Map over `THEME_LEVELS`; never re-list the names.
3. **Polarity is a declared field, not the axis.** `LEVELS[x].polarity` drives `color-scheme`,
   the `dark:`/`light:` variants, and the `prefers-color-scheme` mapping in `SYSTEM_LEVEL`.
   `dark:` now means "midnight or dim" and is only for non-colour utilities.
4. **Every level colour is a literal.** No `color-mix` derivation, because percentages tuned
   against near-black do not hold at the light end — and because literals make
   `pnpm check:contrast` able to audit all 200 role pairs without a browser.

Selection is `data-theme="<level>"` on the root (the level class is mirrored for consumers
whose own CSS selects on it). `<ThemeProvider scoped>` themes a subtree instead — a `bright`
panel inside a `midnight` page resolves correctly at any depth. For SSR, render
`getThemeInitScript()` in an inline `<script>` in `<head>`: it sets the attribute before
first paint, which React cannot do without either a flash or a hydration mismatch.

---

## 🎯 Semantic Theming

Components must **never** reference `--brutalist-cyan`, `--color-white`, `--border-color`
or the `brutalist-*` Tailwind utilities directly, nor a hex literal, nor a raw palette
utility like `bg-zinc-900`. `pnpm lint` reports each one at the line that wrote it, with
the role to use instead.

**The migration is done: zero call sites remain.** Those names still resolve through a
**deprecated compatibility block** in the generated `theme.css`, which existed only so
the not-yet-migrated components kept rendering while they were ported. Nothing in this
package needs it now, so removing it is unblocked — but it ships in `theme.css`, so a
consumer may be leaning on it, which makes deletion a breaking change and a deliberate
one rather than a tidy-up.

`src/components/Input.tsx` is the worked example of a migrated component.

| Role group | Tokens | Use for |
|---|---|---|
| `--ds-accent-*` | `primary`, `secondary`, `tertiary`, `quiet` | Visual hierarchy — what draws the eye first |
| `--ds-intent-*` | `info`, `success`, `warning`, `danger` | Communicated meaning the reader must act on |
| `--ds-surface-*` | `base`, `raised`, `sunken`, `overlay` | Background elevation |
| `--ds-text-*` | `primary`, `secondary`, `muted`, `inverse` | Text prominence |
| `--ds-border-*` | `strong`, `default`, `subtle` | Rule weight |
| `--ds-font-*` | `display`, `body`, `mono`, `pixel` | Typography roles |

From TypeScript, use `accentVar()`, `surfaceVar()`, `textVar()`, `borderVar()`, or the
`semanticTokens` object from `src/lib/theme.ts`. From Tailwind, use the semantic aliases:
`text-accent-primary`, `bg-surface-raised`, `border-edge-subtle`, `text-intent-danger`.

**When the role comes from a prop, the two are not interchangeable.**
`src/lib/accentClasses.ts` is the Tailwind counterpart to `accentVar()`, and it exists
because Tailwind's scanner reads source text: `text-${role}` generates no CSS at all,
so every class has to be spelled out somewhere the scanner can see it. Use
`accentTextClass()` / `accentHoverEdgeClass()` when the accent decides a *class*, and
`accentVar()` when it decides an inline value. A test asserts the two encodings agree,
because a drift would have one component's class and another's style resolve the same
prop to different colours.

Accent-style props take an `Emphasis` or an `Intent`. The old palette names
(`'cyan' | 'pink' | 'yellow' | 'green'`) still resolve to identical values so existing
consumers keep compiling, but they are deprecated — do not use them in new code.

---

## 📜 Commands

- `pnpm tokens:build`: Regenerates `src/theme.css` from `src/theme/levels.ts`.
- `pnpm tokens:check`: Fails if the generated CSS is stale. Runs in CI.
- `pnpm check:contrast`: Audits every role pair on every level. Runs in CI.
- `pnpm contrast:report`: Prints the full matrix with margins, worst first.
- `pnpm lint`: Reports a colour written as a literal at the line that wrote it. Runs in CI.
- `pnpm lint:fix`: Same, applying any autofixes.
- `pnpm check:css`: Ratchet on styling that lives in a stylesheet. Runs in CI.
- `pnpm check:css:list`: Same, showing the offending selectors.
- `pnpm check:deps`: Dependency reasons, sections and usage. Runs in CI.
- `pnpm deps:list`: Prints the dependency table with each package's reason.
- `pnpm knip`: Full hygiene sweep — also unused files and exports. Not gated.
- `pnpm build`: Regenerates tokens, then bundles ESM, CJS, DTS types, and CSS via `tsup`.
- `pnpm check:api`: Diffs the emitted `dist/index.d.ts` against `api/index.d.ts`. Runs in CI, after the build.
- `pnpm api:update`: Accepts the current surface as the baseline. The resulting diff is the API change.
- `pnpm storybook`: Starts interactive Storybook dev server on port `6006`.
- `pnpm build-storybook`: Compiles static Storybook documentation site to `storybook-static/`.
- `pnpm test:visual`: Runs Playwright visual regression suite against Storybook stories.
- `pnpm check:visual-coverage`: Fails if a component has no asserted story and no exclusion. Runs in CI.
- `pnpm check:visual-coverage:list`: Same, naming every uncovered component and every exclusion.
- `pnpm test:visual:missing`: Writes only baselines that do not yet exist.
- `pnpm test:visual:update`: Re-records **all** baselines. Deliberate act — prefer `:missing`.
- `pnpm walkthrough`: Screenshots every story on every level into `walkthrough-report/`.
- `pnpm walkthrough:show`: Opens that report locally.
- `pnpm typecheck`: Validates TypeScript strict mode.
- `pnpm test`: Runs the Vitest unit suite (jsdom).
- `pnpm test:watch`: Same suite in watch mode.
- `pnpm test:coverage`: Unit suite with a V8 coverage report over `src/lib` and `src/hooks`.

---

## 🧪 Unit Tests

Vitest, jsdom environment, tests co-located with the code as `src/**/*.test.ts(x)`.

**The extension is load-bearing.** Playwright's `testDir: './tests'` matches
`*.spec.ts`, so the two runners are kept apart by naming alone:

| Path | Extension | Runner |
| --- | --- | --- |
| `src/**` | `.test.ts` / `.test.tsx` | Vitest |
| `tests/**` | `.spec.ts` | Playwright |

A unit test named `.spec.ts` under `tests/` gets collected by Playwright and fails
without a browser. Keep new unit tests in `src/`, beside what they cover.

Tests are invisible to the published package — `tsup` bundles from `src/index.ts`
only, and `files` ships `dist/` — so co-locating them costs consumers nothing.

**What belongs here vs. in visual regression.** Unit tests cover logic that has a
right answer independent of pixels: token resolution, slug generation, hook state
machines. Anything whose correctness *is* its appearance stays in `test:visual` —
asserting on class strings is a worse version of a screenshot and breaks on every
harmless refactor.

The suite covers `src/lib/`, `src/hooks/`, the generated `theme.css`, and — so far —
`Input` and `StatCard` under `src/components/`. Prefer asserting behaviour (is the
label wired to the control? does the error replace the helper text?) over markup.

Two tests are cross-cutting rather than co-located, because what they cover is a
property of the package and not of one file: `src/lint.test.ts` pins the two lint
rules, and `src/focus-ring.test.ts` rejects any `outline-none` / `outline-hidden`
/ `outline-0` utility in a component. The second guards the global
`:focus-visible` rule in `styles.css`, which a utility silently outranks — a
class plus a pseudo-class is (0,2,0) against that rule's (0,1,0), so
`focus:outline-none` removes the outline on precisely the keyboard focus it
exists for. Writing it `focus-visible:` does not help; it is the same
specificity aimed at the same case. `Input`, `Modal` and `Tag` all had it.

**Where a runtime value is involved, assert the value and not the class.** `Input`
takes its accent as a prop, so it cannot be a utility — Tailwind's scanner reads
source text and would generate nothing for `border-${role}`. The accent travels as
`--field-accent` instead. Every accent therefore produces the *same* class string,
which means a class assertion there cannot tell a working accent from a broken one:
it passes either way. Read the custom property.

**The published shape is tested too.** `src/package-shape.test.ts` asserts the
fields and files a consumer meets before any code runs — the licence text the
`license` field claims, every checked-in `files` entry existing, `sideEffects`,
`engines`, and each stylesheet the README tells a consumer to import being
resolvable through the `exports` map. Nothing else here can see those: `tsup`
does not read them and `typecheck` cannot. The failure it guards is one that
already shipped twice — `files` listed `LICENSE` and `license` said MIT while no
such file existed. Note it runs before `pnpm build`, so `dist/` is asserted to be
*declared*, not to be present.

---

## 📦 Dependencies

Dependencies are fine. **Undocumented ones are not.** Every entry in
`package.json` must have a reason recorded in `MANIFEST` in
`scripts/check-deps.mjs`, and `pnpm deps:list` prints the table.

`pnpm check:deps` runs two things, because no single tool covers this:

- **`knip`** answers *is it used* — unused packages, unlisted imports,
  unresolved specifiers. It is the standard tool for that and worth more than
  anything hand-rolled.
- **`scripts/check-deps.mjs`** answers *is it justified, and in the right
  place*: a package with no `MANIFEST` entry fails, a `MANIFEST` entry with no
  package fails, and the declared section must match the reason's `kind`.

Three things it catches that knip structurally cannot:

1. **Shipped source importing a devDependency.** That publishes a package which
   breaks on install. `src/stories/**` and `src/**/*.test.ts(x)` are excluded
   from "shipped", since those files sit under `src/` but are unreachable from
   `src/index.ts` — which is why Storybook and Vitest are legitimately
   devDependencies despite being imported from inside `src/`.
2. **The CSS contract.** `styles.css` does `@import "tailwindcss"` and
   `prose.css` does `@plugin "@tailwindcss/typography"`. Both resolve from the
   *consumer's* `node_modules` at their build time, so both are real
   dependencies — but knip does not parse at-rules and reported the typography
   plugin as unused. It is in `ignoreDependencies` for that reason, and this
   check covers it instead. Adding a package to `ignoreDependencies` without a
   corresponding CSS reference is how that exemption gets abused.
3. **Shipped CSS missing from the `exports` map.** `prose.css` was built into
   `dist/`, its own header told consumers to import it, and the map never
   declared it — so following the documentation produced a resolution error. The
   check found that on its first run.

### Duplicate exports, gated

`pnpm knip` used to report duplicate exports: every component had both a named
and a `default` export, while `src/index.ts` uses `export *`, which does not
forward defaults, and the `exports` map has no deep paths — so every one of them
was unreachable from any consumer. There were **27**, not the 28 recorded here
before; no component ever imported another's default either.

All 27 are deleted, and the emitted `dist/index.d.ts` came out byte-identical
before and after, which is the proof they were dead rather than an argument that
they should have been. `duplicates` is now part of the gated `knip` run in
`check:deps`, so a `default` export cannot come back alongside a named one
without failing CI.

If a deep import path is ever wanted, that is an `exports` map change and a
deliberate API decision — not a reason to reintroduce a default nothing can
reach.

---

## 📌 Dependencies Held Back on Purpose

Anything here is **pinned below latest for a reason**. Check this list before
"just bumping it", and delete the row if you clear the blocker.

| Package      | Held at  | Latest | Why, and what unblocks it |
| ------------ | -------- | ------ | ------------------------- |
| `typescript` | `^6.0.3` | 7.0.2  | TS 7 breaks `pnpm build` — see below. Also keeps this package aligned with the blog, which consumes it. |

### The TypeScript 7 blocker

TS 7 does two things this repo cannot yet absorb:

1. **`baseUrl` was removed** (`error TS5102`). Our own `tsconfig.json` no longer
   sets it — the `@/*` mapping is tsconfig-relative — but `tsup`'s dts worker
   *injects* `baseUrl` itself, which is why `ignoreDeprecations: "6.0"` is
   currently required just to build on TS 6. Remove that escape hatch only when
   tsup stops injecting it.
2. **`tsup`'s DTS step crashes outright.** `tsup` vendors `rollup-plugin-dts`,
   which reads TS internals that TS 7 removed:

   ```
   TypeError: Cannot read properties of undefined (reading 'useCaseSensitiveFileNames')
       at rollup-plugin-dts.cjs
   ```

   This is upstream, not a config mistake: `rollup-plugin-dts@6.4.1` (latest)
   still declares `typescript: ^4.5 || ^5.0 || ^6.0`. Note the failure is
   **`pnpm build` only** — `pnpm typecheck` passes fine on TS 7, so a green
   typecheck is not evidence the upgrade works. Always run `pnpm build`.

**Unblocked when** `rollup-plugin-dts` supports TS 7, or this package moves off
`tsup` for bundling (`tsdown`, the rolldown-era successor, is the likely
candidate). Because the blog consumes this package, move both repos together.

---

## 🔒 The Published API Surface

`api/index.d.ts` is the committed shape of what consumers compile against.
`pnpm check:api` regenerates it from `dist/index.d.ts` and fails when the two
disagree; `pnpm api:update` accepts the new surface, and **the diff in that file
is the API change** — reviewing it in the PR is the entire point of the gate.

It exists because nothing else here could see a breaking type change. `pnpm
typecheck` proves the source is internally consistent, which it remains right up
to the moment you delete an export; `knip` answers a different question; the
visual suite is three layers away. For a package whose value proposition is that
consumers build against it, that was the missing check with the most leverage.

Deliberately no `api-extractor`: a plain diff of the emitted `.d.ts` needs no
second toolchain kept aligned with `tsup`. What it gives up is the ability to say
*why* a change is breaking.

**Comments are stripped before comparing, and that is the load-bearing choice.**
The doc comments here are long and edited often, and they are documentation
rather than API — a reworded paragraph is not something a consumer can observe
through the type system. Baselining verbatim would move the file on nearly every
PR, and a gate that always fails is one everybody learns to update without
reading. The cost, stated plainly: a doc comment that lies is invisible to this
check. That is a review problem, not a gate problem.

The entrypoint's `export { … }` is exploded to one name per line, because
`tsup` emits all 200-odd names on a single line and diffing it as a line reports
the whole list as changed when one export moves. Exploded, a deleted export is
three lines naming it.

---

## 🌐 Hosted Storybook

| URL | Serves | Vercel mechanism |
| --- | --- | --- |
| [design-system.ryankelly.dev](https://design-system.ryankelly.dev) | `main` | Production domain |
| [preview.design-system.ryankelly.dev](https://preview.design-system.ryankelly.dev) | the `preview` branch | Branch domain (`gitBranch`) |

Both domains are declared **outside this repo**, in `rtkelly13/shared-utilities` at
[`infra/vercel/`](https://github.com/rtkelly13/shared-utilities/tree/main/infra/vercel) —
one Pulumi stack covering every ryankelly.dev site rather than a per-repo copy. Add or
change a domain in that repo's `sites.ts` (site key `design-system-storybook`).

Build settings stay here in `vercel.json`, and that split is deliberate: Vercel reads
`vercel.json` from the repo at build time and it **overrides** project settings, so the
shared stack declares only identity, domains and env vars. Repos own how they build.

`vercel.json` sets **`"cleanUrls": false`**. This is load-bearing for the same reason
`serve.json` is (see below): clean URLs rewrite `/iframe.html` to `/iframe`, breaking
Storybook's asset preloading and yielding an empty preview pane. Storybook is one of
the few static sites where clean URLs are actively wrong.

`preview` is a long-lived branch, not a per-PR URL. A Vercel branch domain maps to
exactly one branch; individual PRs still get their own generated `*.vercel.app` URLs.
To promote work to the preview site, merge it into `preview`.

### Composition

The blog's Storybook is composed into this one's sidebar as **`ryankelly.dev (site)`**,
so one URL answers both "what does the system provide" and "what does the site do with
it". It is driven by `STORYBOOK_REF_BLOG_URL` in `.storybook/main.ts`, not hardcoded:
the URL differs per environment, and an unreachable ref renders as a permanently
erroring sidebar entry. Unset — the default for `pnpm storybook` locally — composes
nothing.

Composition is resolved **in the browser**, which has two consequences worth knowing
before debugging it:

- The composed Storybook must send `Access-Control-Allow-Origin` on `/index.json`;
  the manager fetches it cross-origin. It also probes `stories.json` and
  `metadata.json`, which no longer exist in Storybook 10. Those failures are
  harmless — composition works from `index.json` alone — but they surface as
  **CORS errors, not 404s**, if the composed origin scopes its
  `Access-Control-Allow-Origin` to `/index.json`: the browser blocks the response
  before the status is readable. The blog's `storybook-site/vercel.json`
  therefore sets the header on all paths, which keeps the console clean.
- The ref URL is baked into the manager bundle at **build** time, so changing
  `STORYBOOK_REF_BLOG_URL` requires a redeploy, not just a reload.

The blog's Storybook is deployed by a second Vercel project reading
`storybook-site/vercel.json` in the blog repo, declared in the shared stack as
`blog-storybook`. That project needs **"Include source files outside of the Root
Directory in the Build Step"** ticked by hand — the Vercel provider does not expose it.

Both repos are on Storybook 10 — this one on 10.5, the blog on 10.4 — so host and
ref agree on the `index.json` v5 format the manager reads. That was not true when
this was written: #23 aligned them precisely so composition would not depend on
cross-major tolerance. Keep them on the same major; see
[`docs/evaluation.md`](./docs/evaluation.md).

---

## ⚙️ CI Shape

`ci.yml` runs **three jobs in parallel**, then a fourth that reports their
combined verdict.

**It runs on every pull request, whatever the base branch.** `pull_request` used
to carry `branches: [main]`, which filters on the PR's *base* — so a PR aimed at
another branch got no CI at all. Not a failure, not a pending check: nothing.
A stacked PR showed only the Vercel comment check and read as "no gates to run",
which is worse than a red one. `push` keeps its `main` filter, because that
trigger is the post-merge signal for the default branch specifically.

| Job | What it runs | Roughly | Ceiling |
| --- | --- | --- | --- |
| `gates` | `tokens:check`, `check:contrast`, `lint`, `check:css`, `check:fonts`, `check:deps` | 30s | 10m |
| `unit` | `typecheck`, `test`, `build` | 35s | 10m |
| `visual` | `build-storybook`, `check:visual-coverage`, `test:visual` | 60s | 25m |
| `verify` | nothing — fails unless the three above succeeded | 10s | 5m |

**Check names are lowercase, snake_case, and at most two words**, taken from the
shared lexicon in `shared-utilities` (`ci`, `build`, `test`, `lint`, `visual`,
`publish`, `format`, ...) — so the four jobs report as `lint`, `test`, `visual`
and `ci`. Names that describe their contents cannot also be stable contracts:
the required check used to be `Build, Typecheck, Storybook & Visual Regression`,
splitting the job silently made it `Build, Typecheck, Unit Tests, Storybook &
Visual Regression`, and the governance map went on requiring the old string.
`repo-governance check-names` now fails on a required check no job declares, and
warns on names that drift from the lexicon.

Only `visual` installs a browser, so only its ceiling has to clear
`install-playwright`'s retry budget (rule 9). Splitting the job is what let the
other three drop to a ceiling sized to their own work, instead of every gate
waiting out a browser-shaped timeout.

**Add a new gate to `gates` or `unit`, not to `visual`.** The visual job is the
critical path; the other two have headroom, and putting a check behind a browser
install and a screenshot suite is what made this slow in the first place. It was
one job of nineteen serial steps, and nothing in it needed to be serial — so
`lint`, the fastest and most frequently-failing check in the repo, reported after
everything else had also run.

**Where the time actually goes**, so the next person optimising this starts from
measurements rather than a guess:

- **The walkthrough is the long pole of the whole PR**, not `ci.yml` — one test
  per story, four captures each, and it grows by four screenshots per component.
- **Both Playwright suites are wait-bound, not CPU-bound.** They spend their time
  on page loads, `document.fonts.ready` and per-capture settle waits, so they
  scale past the core count. Worker counts in both configs are measured, with the
  tables in the config comments; the gated suite's is also a determinism claim
  and is evidenced in [`docs/visual-regression.md`](./docs/visual-regression.md).
- **`.github/actions/setup`** is Node + pnpm + install, and nothing else. Use it
  rather than repeating the steps: a `pnpm install` that differs between the job
  that writes a baseline and the job that checks it is the one difference this
  repo can least afford. Browsers are **not** here — that is
  `install-playwright`, so only the two jobs that drive a browser pay for it.
- **`.github/actions/install-playwright` now caches the download** as well as
  bounding and retrying it (rule 9). 13 of that step's 25 healthy seconds were
  spent fetching ~300MB that never changes until the lockfile does, which is
  also why the cache keys on `pnpm-lock.yaml`: the browser revision is pinned by
  the Playwright version in there, so a lockfile change is exactly when a cached
  browser stops being the right one. Only the download half is cacheable — the
  `--with-deps` apt half installs outside the cached directory, so a cache hit
  still runs `install-deps`, through the same retry loop, since that reaches the
  network too. Assuming the runner image carries those libraries would trade a
  red required check for ten seconds.
- **`ci.yml` supersedes in-flight PR runs** (`concurrency`), as the walkthrough
  already did. The group includes the event name so rule 8's manual
  `workflow_dispatch` re-run is never cancelled by a push or queued behind one.

Not done, and the next lever if the story count doubles again: sharding the
walkthrough across runners with `--shard` and `merge-reports`. Worth roughly
another 30s, at the cost of a merge job and three times the runner minutes.

---

## 📸 Screenshot Walkthrough

`pnpm walkthrough` captures every Storybook story on **every level**
(derived from `THEME_LEVELS`, so a new rung widens the matrix automatically)
and publishes Playwright's own HTML report to
`walkthrough-report/`. CI attaches it as `storybook-walkthrough-<sha>` on every PR.

Download it, unzip, open `index.html` — it works straight from `file://`, no
server needed. `pnpm walkthrough:show` serves it locally.

It is **not** a gate. It asserts nothing about how things should look; it makes
what they *do* look like reviewable. Visual regression stays in `ci.yml`.

Its real value is breadth per level: it captures *every* story on every rung,
where the gated suite captures one representative per component.

The cross-level gap the gated suite used to have is closed —
`Foundations/Theme Ladder → AllLevels` renders all four rungs in one screenshot
and is now a `CASES` row, so a token change that reads fine on `midnight` and is
unusable on `white` fails a required check rather than merely showing up in a
report nobody opened.

Two structural choices worth keeping:

- **One test per story, not per story-and-level.** The report lists tests, so a
  row is a component and opening it shows all four levels together — which is
  the comparison worth making. Splitting by level quadruples the rows and
  scatters the images that need comparing.
- **Each theme's capture is wrapped in a `test.step`.** Ungrouped, the
  navigation plumbing contributes ~21 rows to the step list and pushes the
  screenshots below the fold.

Note that `expect()`'s message argument becomes the *step title* in the report,
shown next to a green tick on success. `story-ready.ts` therefore raises its
guidance on catch instead — otherwise every passing run reads as a failure.

### Both suites verify the render first

`tests/story-ready.ts` asserts Storybook actually mounted the story before any
screenshot is taken, by checking the `sb-show-main` / `sb-show-errordisplay` /
`sb-show-nopreview` classes Storybook puts on `<body>`.

This is not optional defensiveness. Storybook always paints *something* — a
"No Preview" panel or a red error overlay — so a screenshot taken after a fixed
delay succeeds whether the story rendered or the entire preview bundle failed
to load. Every baseline in this repo was once a screenshot of the "No Preview"
panel, and the suite passed for as long as it kept being one.

### `serve.json` is load-bearing

`serve` rewrites `/iframe.html` to `/iframe` by default (`cleanUrls`), which
breaks Storybook's asset preloading and yields exactly that empty preview. Both
Playwright configs therefore start it as:

```
npx serve storybook-static -p 6006 --config ../serve.json
```

The path is relative to the **served directory**, not the repo root. Do not drop
the `--config` flag.


## 🛑 Repository Conventions & Workflow Policy

1. **Squash Merge Only**: All pull requests must be merged into `main` using **Squash and Merge** exclusively.
2. **Delete Branch on Merge**: Feature branches must be automatically deleted immediately upon merge into `main`.
3. **Linear History**: Maintain a strictly linear history. Rebase feature branches onto `main` before merging; no merge commits allowed.
4. **Direct Push Protection**: Non-force direct pushes to `main` are blocked; PR mechanism required (force pushes permitted when needed).
5. **Local Temp & Worktree Directory**: All temporary files, local databases, scratch files, and git worktrees MUST go inside the root `/temp/` directory (gitignored).
6. **Gitignored Local TODO File**: A root `TODO.md` file MUST exist for local task tracking and be gitignored.
