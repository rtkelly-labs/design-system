# Radix or Base UI — the primitive-layer decision

The comparison behind the choice recorded in
[`shadcn-evaluation.md`](./shadcn-evaluation.md) §6. Measured against
`radix-ui` 1.6.7 and `@base-ui/react` 1.7.0, from the published packages and both
git histories rather than either docs site.

> [!NOTE]
> **Measured on `650cd9f` (30 August 2026), package `0.3.0`. `main` has moved since,
> and three surface details below are stale.** The comparison itself is unaffected —
> it is about Radix and Base UI, not about this repo's palette — so it is recorded as
> written rather than silently rewritten.
>
> - **The ladder is two rungs, not four.** #123 collapsed `midnight`/`dim`/`bright`/`white`
>   to `midnight` + `sketch`. Wherever the text says *four rungs*, or names `dim`, `bright`
>   or `white`, read it as the two-rung ladder; the argument it supports — that a vendored
>   `dark:` utility is wrong on any rung that is not a light/dark flip — holds unchanged,
>   and holds on `sketch`.
> - **The hue names are gone.** #137/#138 retired `cyan`/`pink`/`yellow`/`green` from the
>   component API and `pnpm check:tokens` now gates them at budget **0**.
> - **`docs/gap-analysis.md` is quoted saying "there is no linter in this repo".** That was
>   true when written and is not now: `eslint.config.mjs` exists and `pnpm lint` passes.
>
> Versions named in the migration plan (`0.3.0`, `0.4.0`) predate the current `0.6.0`.

**Outcome: `@base-ui/react`.** Churn accepted deliberately, bounded by the
confinement rule in §6 of the evaluation. `@tanstack/react-table` covers tables,
which neither library provides.

Sources: `radix-ui/primitives` @ `f7ecd5a`, `mui/base-ui` @ `2665e49`,
`shadcn-ui/ui` @ `63c1308`, npm registry as at 2026-09-01.

---

## 1. Maintenance — the dimension that decided it

Both default branches, window 2025-09-01 to 2026-09-01, bots excluded from
author counts.

```bash
git log --since=2025-09-01 --until=2026-09-01 --format=%ad --date=format:%Y-%m | sort | uniq -c
git log --since=2025-09-01 --until=2026-09-01 --format=%an | grep -vi bot | sort | uniq -c | sort -rn
```

| Measure | Radix | Base UI |
|---|---|---|
| Commits merged | 243 | **1,852** (7.6×) |
| Human commits | 239 | 1,431 (6.0×) |
| Distinct authors | 22 | 94 |
| Top author's share | **90.4%** | 45.6% |
| Authors to reach half the commits | **1** | 2 |
| Months at ≤1 commit | **7** (5 at zero) | 0 |
| Quietest month | 0 | 114 |
| Last commit on default branch | 2026-07-31 | 2026-09-01 |
| Stable npm releases | 9 | 9 |
| Test files in repo | 45 | 274 |

Monthly commits, same scale:

| | S | O | N | D | J | F | M | A | M | J | J | A |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| Radix | 0 | 23 | 3 | 1 | 0 | 1 | 0 | 0 | 24 | 87 | 104 | 0 |
| Base UI | 172 | 144 | 161 | 169 | 153 | 169 | 182 | 163 | 122 | 141 | 162 | 114 |

**The release count is the trap.** Both shipped nine stable versions, so npm says
"equally maintained". The commit history says one of them shipped those nine off
243 commits in two bursts with 88% of the year's work inside 2026-05→07, and the
other off 1,852 sustained with no quiet month.

**Where the maintainers went is on the record.** Base UI's README opens *"From
the creators of Radix, Floating UI, and Material UI"*, and its team list names
**Colm Tuite** (Radix co-creator) and **Jenna Smith** (Radix core maintainer).
Neither appears in Radix's last 1,284 commits. Base UI's most active contributor
— 653 of 1,431 — is **atomiks**, author of Floating UI, which every popover,
tooltip, select and menu in both ecosystems positions itself with.

This does not mean Radix is abandoned: the 2026-05→07 burst was 191 commits of
real work. It means Radix's continuity rests on one person's availability, which
is a different risk from the one its 2022–2024 reputation was earned under.

## 2. Composition model

AGENTS.md makes this decisive after maintenance: appearance is written on
elements as utilities, composed through `recipe` with one slot per element. So
the question is how each library hands over every element's class attribute.

| | Radix | Base UI |
|---|---|---|
| Escape hatch | `asChild` + `Slot` | `render` |
| Accepts | a child element | an element **or** `(props, state) => element` |
| Prop type | `React.ComponentProps<typeof X.Root>` | `X.Root.Props` |
| Variant syntax | `data-[state=checked]:` | `data-checked:` |
| Authoring toolkit exposed | `Slot` (refs + props) | **`useRender`** — public, with state→`data-*` |

`render` taking a function of `(props, state)` is exactly the shape a `recipe`
slot wants:

```tsx
render={(p, s) => <span {...p} className={styles.box({ checked: s.checked })} />}
```

`asChild` instead needs a real child element supplied at every part, and the
composition is invisible to typing across the boundary.

**`useRender` being public matters more than it looks.** It is the same hook Base
UI's own primitives are built on — a `render` prop plus a `state` object where,
in its own words, *"state properties are automatically converted to `data-*`
attributes"*. For a package that authors components rather than only consuming
them, that is a primitive-authoring toolkit. Radix has no equivalent.

## 3. Styling and state surface

| Concern | Radix | Base UI |
|---|---|---|
| Open / closed | `data-state="open\|closed"` | `data-open`, `data-closed`, `data-popup-open` |
| Checked | `data-state="checked\|indeterminate"` | `data-checked`, `data-indeterminate` |
| Validity | `data-invalid` | `data-invalid`, `data-dirty`, `data-filled`, `data-touched` |
| Interaction | `data-highlighted`, `data-disabled` | + `data-focused`, `data-pressed`, `data-readonly`, `data-required` |
| **Enter / exit transition** | **none** | `data-starting-style`, `data-ending-style` |
| Internal plumbing on your DOM | ~18 × `data-radix-*` | 1 × `data-base-ui-scroll-locked` |

```bash
grep -rho "'data-[a-z-]*'" packages/react/src | sort -u          # Base UI: 25+ semantic
grep -rc "data-\(starting\|ending\)-style"                       # Base UI 230 · Radix 0
```

The transition row lands on **issue #49** (no motion or z-index tokens). Radix
expects CSS keyframes per overlay — which is why shadcn carries
`tw-animate-css`. Base UI holds the element in the DOM through the transition and
exposes both ends as attributes, so an enter/exit is two variants and a duration.
Neither library removes #49 from the critical path; one makes it much smaller.

## 4. Forms — where this system's gap actually is

Against **issue #50** ("the form layer cannot express a form"):

| Needed | Radix | Base UI |
|---|---|---|
| Checkbox / RadioGroup / Switch | yes | yes |
| **Field** (label, description, error, id wiring) | no primitive | `field` |
| **Fieldset** + legend | no primitive | `fieldset` |
| Form-level error summary | `react-form` @ `0.1.x` | `form` |
| Controls inherit field validity | wire it yourself | `CheckboxRootState extends FieldRootState` |

The last row is the one that matters: a control inside a Base UI field inherits
validity, dirty and touched state without being told about it. That is precisely
what `useField()` (`src/components/Input.tsx:84`) does by hand for three controls
today, and would have kept doing by hand for three more.

## 5. Coverage divergence

Shared coverage omitted; 30 of 39 for Base UI against 26 for Radix.

| Primitive | Radix | Base UI | Cost of the gap |
|---|---|---|---|
| Drawer / Sheet | — | yes | `+ vaul` |
| Combobox / command palette | — | yes | `+ cmdk` |
| OTP field | `0.1.x` | yes | `+ input-otp` |
| Toast | yes (shadcn routes past it) | yes | `+ sonner` |
| Meter, NumberField | — | yes | hand-roll |
| Field / Fieldset | — | yes | hand-roll |
| Table with sorting | — | — | `@tanstack/react-table` |
| Calendar / DatePicker | — | — | neither |

## 6. Package shape

| Measure | radix-ui 1.6.7 | @base-ui/react 1.7.0 |
|---|---|---|
| Licence | MIT | MIT |
| Unpacked | 0.11 MB | 9.49 MB |
| Packages installed | **55** | **6** |
| Summed install weight | 4.22 MB | 9.49 MB |
| Direct dependencies | 54 | 5 |
| `sideEffects` | false | false |
| Subpath exports | wildcard `./*` | 83 explicit |
| First published | 2022-08 | 2025-12 |
| Versions published | **189** | **11** |

Two corrections to the folklore, both verified:

- **Radix is the one with package sprawl** — 55 packages for 31 components,
  because the `radix-ui` umbrella re-exports primitives still published
  individually. That is ~55 rows into PR #64's licence baseline against ~6.
- **Base UI's 9.49 MB is one package and none of it ships.** Most is bundled
  locale data and a dual CJS/ESM build. Both declare `sideEffects: false`, both
  support subpath imports, and `tsup` externalises `dependencies` here — so this
  is `node_modules` weight, not `dist` weight.

One point for Radix worth recording: its `Dialog` pulls `aria-hidden` and
`react-remove-scroll`, so it fixes two of the current hand-rolled `Modal`'s
defects — a genuinely inert background and a scroll lock that compensates for
scrollbar width. Base UI does both itself with no extra dependency. Either is an
upgrade on what ships today.

## Scorecard

| Dimension | Weight | Winner |
|---|---|---|
| Maintenance & continuity | Decisive | **Base UI** — 7.6× commits, bus factor 2 vs 1 |
| Composition model | Decisive | **Base UI** — `render` fits `recipe`; `asChild` fights it |
| Styling & state surface | Significant | **Base UI** — semantic `data-*`, transitions without keyframes |
| Form / field integration | Significant | **Base UI** — import vs build for issue #50 |
| Component coverage | Significant | **Base UI** — 30 vs 26, four fewer satellite deps |
| Package shape | Minor | tie — both MIT, both tree-shakeable |
| **Maturity** | — | **Radix** — 189 versions vs 11; the entire case against |

Base UI takes five of six with one tie, and loses only on age. Radix's single
advantage is the one this evaluation expected to be decisive; the commit history
is what changed the answer.

## The adoption plan

Eight pull requests. Three cannot start until work already in flight lands, one
runs in parallel from today, and exactly one is a breaking change. Every PR has
an exit criterion, because "add Base UI" is not a reviewable state.

```
ALREADY IN FLIGHT                                                    
┌──────────────────────┐                                             
│ PR #64 licence gate  │                                             
│ #49   tokens         │──all three──▶ PR 1  ──wraps field──▶ PR 2 ──all compose──▶ PR 4–7
│ #52   axe gate       │              add          Field            Checkbox · Switch
└──────────────────────┘         @base-ui/react                     Radio · Select
         │                             │                            Tabs · Tooltip
         │                             └──────────▶ PR 3  Modal onto Dialog (breaking)
         └── PR #57 focus ring ───────────────────────▲  rebase onto it, not before it

PR 8 · no dependency on any of the above — start today
Skeleton · Spinner · Empty · Kbd
```

`Field` is the chokepoint: every form control composes it, so it ships alone and
first. Only `Modal` branches early, and only one track is free.

### Stage 0 — clear the three gates

None of this is Base UI work and all of it is already specified. Starting Stage 1
first is the one sequencing mistake that is expensive to undo.

| Gate | Why it precedes the dependency | Exit criterion |
|---|---|---|
| PR #64 | Base UI adds ~6 packages to the shipped scope, and `licenses.baseline.json` is default-deny. Without it they arrive with nothing recording them, and the first bump that changes one of their licences is silent. | Merged. Currently `mergeable_state: dirty` and two commits behind `main` — resolve first. |
| #49 | Every wrapper in PRs 3–7 is an overlay or a transition. Without a z-index scale and a motion pair each invents its own — the drift the token layer exists to prevent. `Modal` hardcodes `z-50` today. | A z-index scale and a motion duration/easing pair in `levels.ts`, generated into `theme.css`, passing `tokens:check`. |
| #52 | The whole case for adopting a library is accessibility nothing here can currently observe. Land the gate *before* the migration so there is a baseline to judge it against. | `@storybook/addon-a11y` plus an axe pass over the story index in `ci.yml`, green on `main`. |

#64 and #49 are independent of each other; #52 depends on #44 and #45, which PRs
#57 and #58 already cover. Fastest honest path: fix #64's conflict and land it
while #49 is being written.

### Stage 1 — PR 1: add the dependency, and nothing else

One dependency, one `MANIFEST` entry, one AGENTS.md section, **zero components**.
Component-free is deliberate: it makes the confinement rule reviewable on its
own, before there is a wrapper to argue about.

```js
// scripts/check-deps.mjs
'@base-ui/react': {
  kind: 'runtime',
  why: 'Headless primitives — focus management, ARIA wiring and collision-aware '
     + 'positioning we will not hand-roll. Runtime rather than peer so a consumer '
     + 'gets working components without opting in, matching lucide-react. Reachable '
     + 'only through the wrapper in each component and never re-exported, so its '
     + 'types stay out of the published .d.ts and a major is not a breaking change '
     + 'for consumers.',
},
```

The AGENTS.md section, in the "Dependencies Held Back on Purpose" register:

> **Primitives are confined.** Base UI supplies behaviour, never surface.
> (1) One wrapper per primitive — no component imports `@base-ui/react` twice.
> (2) Never re-exported raw from `src/index.ts` — not the parts, not the prop types.
> (3) Its types never appear in the published `.d.ts`.
> Rationale: 11 published versions since 2025-12. A major then costs one PR here,
> not a coordinated bump across the blog and YNAB.

**Exit:** `check:deps` green, `build` green, `dist/` contains no Base UI source
(`tsup` externalises `dependencies`), and `licenses.baseline.json` updated with a
reviewed diff reading "+6 packages, all MIT".

### Stage 2 — PR 2: `Field`, the chokepoint

The PR that decides whether the rest is cheap. `useField()` at `Input.tsx:84` is
**replaced, not wrapped**, and `Input`, `TextArea` and `Select` move onto the new
component in the same PR so there is never a second field implementation in the
tree.

```tsx
// src/components/Field.tsx — the only file that imports Base UI's field.
import { Field as Primitive } from '@base-ui/react/field';
import { recipe } from '../lib/recipe';

// One slot per element. Base UI emits data-invalid / data-dirty / data-touched /
// data-filled / data-focused, so every variant is a plain Tailwind selector.
const field = recipe({
  slots: {
    root:        'flex flex-col gap-1',
    label:       'font-mono text-xs uppercase tracking-wider text-content-secondary',
    description: 'font-mono text-xs text-content-muted',
    error:       'font-mono text-xs text-intent-danger',
  },
});
```

Parts available: `Field.Root`, `Label`, `Control`, `Description`, `Error`,
`Validity`, `Item`.

**Exit:** `useField()` deleted; `Input`/`TextArea`/`Select` render through
`Field`; the `FORBIDDEN` regex guards in `Input.test.tsx` and `StatCard.test.tsx`
still pass; story + `CASES` row + baseline so `check:visual-coverage` stays at 0.

### Stage 3 — PR 3: `Modal` onto `Dialog`

The one breaking change, and the PR that pays for the dependency on its own. It
retires four defects the hand-rolled version has: a background that is not
`inert`, a scroll lock that shifts the page by the scrollbar width, a focus trap
that queries one subtree and so will miss the first portalled `Select` listbox,
and two dialogs both capturing Escape.

**Take the API break here.** `isOpen`/`onClose`/`title` becomes the compound
`Dialog.Root` / `Trigger` / `Popup` / `Title` composition (parts also include
`Backdrop`, `Portal`, `Description`, `Close`, `Viewport`). At `0.3.x` with two
known consumers that is cheap; after a `1.0` it is not. Ship as `0.4.0` with the
old export kept as a deprecated shim for one minor, the way `LegacyAccent` was.

**Exit:** the `Modal` unit tests from #52 pass against the new internals; both
consumers build against the shim; CHANGELOG carries the migration snippet; lands
after PR #57, rebased onto it.

### Stage 4 — PRs 4–7: the controls, in demand order

One PR per pair, each ~80 lines, each following the `Field` pattern exactly.
Demand order comes from the consumers, not the library: `Checkbox` + `Switch`
(YNAB rule toggles, blog `TalkControls`), then `RadioGroup`, then `Select`, then
`Tabs` + `Tooltip`.

```tsx
// src/components/Checkbox.tsx
import { Checkbox as Primitive } from '@base-ui/react/checkbox';

const checkbox = recipe({
  slots: {
    root: 'relative size-5 shrink-0 border-2 border-edge-strong bg-surface-base '
        + 'data-checked:bg-accent-primary data-disabled:opacity-50 '
        + 'data-invalid:border-intent-danger '
        + 'focus-visible:outline-2 focus-visible:outline-offset-2 '
        + 'focus-visible:outline-accent-primary',
    indicator: 'grid place-content-center text-content-inverse',
  },
});
```

**Note what is absent**: no `useId`, no `aria-describedby`, no `aria-invalid`, no
indeterminate handling, no hidden input for form participation.
`CheckboxRootState extends FieldRootState`, so a checkbox inside a `Field`
inherits `disabled`, `touched`, `dirty`, `valid`, `filled` and `focused` without
being told. That absence is the return on the dependency.

**Exit per PR:** story + `CASES` row + `/update-snapshots` baseline; axe pass from
#52 clean; one consumer actually migrated onto it in the same week — or the
component was speculative and should not have shipped.

### Stage 5 — PR 8: free, and it can start now

`Skeleton`, `Spinner`, `Empty`, `Kbd`. Pure markup and tokens, no dependency on
Base UI or on any gate above. Worth doing first in wall-clock terms: real
consumer value while Stage 0 is still in flight, and `recipe` practice on
components where a mistake costs nothing.

### Deliberately not in this plan

- **Drawer, command palette, toast, OTP.** Base UI ships all four and none has a
  consumer asking. Speculative surface is how a system accumulates components
  nobody maintains.
- **`DataTable` sorting.** Separate track on `@tanstack/react-table`, independent
  of every stage here. Wants #52 landed first, since the ARIA semantics are
  hand-written and shadcn's own reference block gets them wrong.
- **Calendar, Chart, Carousel.** Neither library covers the first two; no consumer
  wants any of the three.
- **Migrating the docs chrome.** Ten components with a 1:1 class in `prose.css`,
  already on a per-PR ratchet. Mixing it in would make every PR above harder to
  review.

## The accepted risk

Base UI's risk is **churn** — an API change inside a year is plausible, and nine
months of published history cannot prove otherwise. Radix's risk is **stall** — a
focus-management bug or a React incompatibility open for a quarter, with this
system's accessibility floor underneath it.

Churn is bounded by a rule this package already enforces on
`tailwind-variants`: confine it to one wrapper per primitive, never re-export raw,
keep its types out of the published `.d.ts`. Stall is bounded by nothing the
consumer controls. That asymmetry is the decision.
