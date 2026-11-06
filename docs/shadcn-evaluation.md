# shadcn/ui evaluation — September 2026

Whether `@rtkelly13/design-system` should take anything from
[shadcn/ui](https://ui.shadcn.com), what it would take, how it would be
integrated, and whether the licences underneath allow it.

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

Measured against `shadcn-ui/ui` at `63c1308` (2026-08-31) and this repo at
`650cd9f`. Licence facts were read from `LICENSE.md` in that repo and from
`https://registry.npmjs.org/<pkg>/latest`, not from memory — every row below is
reproducible with the command that produced it.

## Verdict

**Take the behaviour, not the code.** shadcn/ui's
value to this repo is almost entirely in the headless primitives it wraps, and
almost none of it is in the wrapper files themselves, because every one of those
files is written against a token vocabulary and a styling engine this repo has
deliberately rejected (§5B).

Of the three libraries shadcn now generates against, **`@base-ui/react` is the
adopted one**, with `@tanstack/react-table` (MIT) for the data-table layer that
none of them provides. §6 records the comparison, the maintenance evidence that
decided it, and the confinement rule the decision is conditional on. Adopt
exactly one primitive library; two focus-management implementations in one tree
is worse than either alone.

The whole adopted path is MIT — the only non-MIT packages anywhere near it are
`class-variance-authority`, which `src/lib/recipe.ts` already replaces, and
React Aria, which this decision does not take. **Apache-2.0 would not have been
a problem either**: depending on it is not redistributing it, and this repo has
depended on `typescript` under exactly those terms since day one. The rule that
matters is depend versus vendor — §6.

**Three of this document's original recommendations were already in flight**
(§7). PR #64 covers the missing `LICENSE` *and* a licence-drift gate that is
stronger than what this evaluation proposed; issue #50 had already reached the
same component gap list. What is genuinely uncovered is the build-vs-adopt
question itself: issue #50 prescribes building all of it by hand and never
raises it.

---

## 1. What shadcn/ui actually is, in 2026

It is not a component library you install. It is a **registry** — JSON payloads
describing files — plus a CLI (`shadcn`, MIT, v4.19.1) that copies those files
into your project as source you then own. There is no `@shadcn/ui` runtime
package to depend on.

Since v4 it also has a **bases** concept: the same component surface is
generated against three different headless engines, declared in
`apps/v4/registry/bases.ts`:

| Base | Package | Notes |
|---|---|---|
| `radix` | `radix-ui` | The historical default; a single package re-exporting every primitive |
| `base` | `@base-ui/react` | The Radix team's successor library |
| `aria` | `react-aria-components` | Adobe's |

The repo ships a first-class `skills/migrate-radix-to-base/` skill. **Read that
as a signal**: the wrapper layer is churning underneath, and a project that
vendors wrappers inherits the churn. A project that depends on one primitive
library directly does not.

The current inventory at `63c1308`:

```bash
ls apps/v4/registry/new-york-v4/ui | wc -l      # 58 (57 components + _registry.ts)
ls apps/v4/registry/new-york-v4/blocks | wc -l  # 28
ls apps/v4/registry/new-york-v4/charts | wc -l  # 71
```

---

## 2. Component gap

This package exports roughly 38 modules. Mapping them onto shadcn's 57
primitives:

**Already covered**, under different names — nothing to take:
`button`, `card`, `badge`, `avatar`, `input`/`textarea`/`native-select` (all
three from `Input.tsx`), `label`, `separator` (`Divider`), `table`
(`DataTable`), `pagination`, `breadcrumb` (docs barrel), `alert` (`NoteBlock`,
which already models intent correctly), `dialog` (`Modal` — but see §3).

**Missing, with demonstrated demand** in `blog` or `ynab-budget-companion`,
and each one is a thing hand-rolling gets wrong:

| Primitive | Why it is not a weekend build |
|---|---|
| `checkbox` | Indeterminate state, `aria-checked="mixed"`, form participation via a hidden input |
| `radio-group` | Roving tabindex — arrow keys move selection, Tab enters and leaves the group as one stop |
| `switch` | `role="switch"`, and the label/click target relationship |
| `select` | A real listbox is typeahead, arrow navigation, collision-aware positioning, scroll containment |
| `tooltip` | Hover *and* focus, delay groups, dismiss-on-Escape, and never trapping a pointer user |
| `tabs` | Roving tabindex plus `aria-controls`/`aria-labelledby` wiring in both directions |
| `sonner` (toast) | A live region that announces without stealing focus |

**Missing, no new dependency needed** — pure markup and tokens, buildable here
today with `recipe` and worth doing regardless of any shadcn decision:
`skeleton`, `spinner`, `empty`, `kbd`, `aspect-ratio`, `field`/`field-group`,
`input-group`, `button-group`, `item`.

`field` and `input-group` are the two most interesting on that list. They are
not primitives — they are *layout conventions for forms*, and shadcn enforces
them as rules (`data-invalid` on the field, `aria-invalid` on the control).
This repo has **half of `field` already**: `useField()` at
`src/components/Input.tsx:84` wires `useId` + `aria-describedby` +
`aria-invalid` and carries the accent as `--field-accent`. The gap is that it is
a private hook serving three controls rather than a `Field` component any
control can compose — which is why every consumer still lays out its own forms.
Issue #50 names the same hook as the pattern `Checkbox`/`Radio`/`Switch` should
reuse.

**Missing, speculative** for this estate — do not build on spec:
`command`/`combobox`, `sheet`, `drawer`, `sidebar`, `calendar`, `carousel`,
`input-otp`, `resizable`, `chart`, `context-menu`, `menubar`,
`navigation-menu`, and the AI-chat set (`message`, `bubble`, `attachment`,
`message-scroller`, `marker`).

---

## 3. The case that is not about missing components: `Modal`

`src/components/Modal.tsx` is a hand-rolled dialog with a hand-rolled focus
trap. It is unusually well-reasoned for one — the docblock names the four things
that make "modal" a behavioural claim, and it does all four. It is still short
of what a maintained primitive gives you:

- **The background is not inert.** Nothing sets `inert` or `aria-hidden` on the
  rest of the document, so a screen reader's virtual cursor still walks the page
  behind the dialog even though Tab cannot.
- **The scroll lock shifts layout.** `body.style.overflow = 'hidden'` removes the
  scrollbar and the page jumps by its width. Compensating needs
  `scrollbar-gutter` or a measured padding.
- **The trap queries one subtree.** `dialogRef.current.querySelectorAll` misses
  anything the dialog itself portals out — a `Select` listbox, a nested popover
  — which is exactly what happens as soon as the primitives in §2 land.
- **No dialog stack.** Two open dialogs both listen on `document` in the capture
  phase, so Escape closes both.

None of these are mistakes. They are the reason this is a solved problem
somebody else maintains. Replacing `Modal`'s internals with Radix's or Base
UI's `Dialog` is the single highest-value item in this evaluation, and it also
forces the API change worth making anyway: `Modal` takes a closed
`isOpen`/`onClose`/`title` shape where a compound `Dialog.Root`/`Trigger`/
`Content`/`Title` composition is what consumers need. At `0.3.0` that breaking
change is cheap; later it is not.

---

## 4. Licences

### shadcn/ui itself

`LICENSE.md` at `63c1308` is **MIT, Copyright (c) 2023 shadcn**. Compatible
with this package's MIT licence and with public npm.

One obligation that copy-paste distribution makes real and that is widely
ignored: MIT requires the copyright notice to be retained in "all copies or
**substantial portions** of the Software". Copying a registry component into
`src/components/` and publishing it inside `dist/` is a substantial portion.
**If any shadcn source is vendored, this repo owes an attribution notice** — a
`NOTICE` file or a `THIRD-PARTY.md`, plus a header on the vendored file naming
the origin and commit. Recommending against vendoring (§5) largely removes this
obligation; it does not remove it if even one file is copied.

### Runtime packages the components sit on

Read from the npm registry, `latest` at time of writing:

```bash
for p in radix-ui @base-ui/react class-variance-authority clsx tailwind-merge \
  cmdk input-otp vaul sonner next-themes embla-carousel-react recharts \
  react-day-picker react-resizable-panels react-hook-form lucide-react; do
  curl -s "https://registry.npmjs.org/$(printf '%s' "$p" | sed 's|/|%2f|')/latest" \
    | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['name'],d['version'],d.get('license'))"
done
```

| Package | Version | Licence | Which components need it |
|---|---|---|---|
| `radix-ui` | 1.6.7 | MIT | 30 of the 57 |
| `@base-ui/react` | 1.7.0 | MIT | `combobox` today; all of them under the `base` base |
| `class-variance-authority` | 0.7.1 | **Apache-2.0** | 16 wrappers, for variants |
| `clsx` | 2.1.1 | MIT | `cn` |
| `tailwind-merge` | 3.6.0 | MIT | `cn` |
| `lucide-react` | 1.38.0 | **ISC** | icons — *already a dependency here* |
| `cmdk` | 1.1.1 | MIT | `command` |
| `input-otp` | 1.5.0 | MIT | `input-otp` |
| `vaul` | 1.1.2 | MIT | `drawer` |
| `sonner` | 2.0.8 | MIT | `sonner` |
| `next-themes` | 0.4.6 | MIT | `sonner` only, for theme detection |
| `embla-carousel-react` | 8.6.0 | MIT | `carousel` |
| `recharts` | 3.10.1 | MIT | `chart` |
| `react-day-picker` | 10.0.1 | MIT | `calendar` |
| `react-resizable-panels` | 4.12.3 | MIT | `resizable` |
| `react-hook-form` | 7.87.0 | MIT | `form` |
| `shadcn` (CLI) | 4.19.1 | MIT | tooling only, never shipped |

`recharts` is the only one with a non-trivial transitive tail; it is clean:
`victory-vendor` is `MIT AND ISC` (it vendors d3, which is ISC), and
`immer`, `reselect`, `es-toolkit`, `react-redux`, `@reduxjs/toolkit`,
`decimal.js-light`, `eventemitter3`, `tiny-invariant`,
`use-sync-external-store` are all MIT.

### Does this fit the criteria

The criteria are not written down anywhere in this repo, so taking them as
implied by what it already does — MIT itself, published to **public** npm, and
already shipping ISC (`lucide-react`) and MIT (`tailwind-variants`) at runtime:

**Yes, with one asterisk.** No copyleft anywhere in the path — no GPL, LGPL,
AGPL, MPL, or SSPL, and nothing source-available-but-not-open. Everything is
MIT or ISC except `class-variance-authority` — and, if it is ever adopted,
`react-aria-components`, which is Apache-2.0 across its whole `@react-*` and
`@internationalized/*` tree (§6).

**The asterisk is Apache-2.0.** It is permissive and one-way compatible into an
MIT-licensed project, but it is not the same deal as MIT: §4 imposes
notice-preservation and change-statement duties, and it carries an express
patent grant with a **patent-retaliation clause** that terminates the grant if
you sue over the covered work. Harmless for a personal design system, and
strictly *better* than MIT for a commercial one — but it is a different set of
obligations arriving in a package whose `check-deps` MANIFEST records reasons
and nothing else.

It is also entirely avoidable. `cva` exists in shadcn to do what
`src/lib/recipe.ts` already does, better for this repo's shape — `recipe`
handles multi-slot components, `cva` models one element per recipe, and
AGENTS.md mandates `recipe` over any alternative. **Do not install `cva`.**
With it excluded, the entire adoption path is MIT and ISC only.

Worth adding while this is being decided: `scripts/check-deps.mjs` records
*why* each package exists but not *under what licence*. Adding a `licence` field
to the MANIFEST — and failing on anything outside an allowlist of
`MIT`/`ISC`/`BSD-*`/`Apache-2.0` — would turn this evaluation into a check, the
same move AGENTS.md already makes everywhere else. That is the mechanism this
repo believes in; the licence question is currently the one policy with no gate.

---

## 5. Integration: three options

### A. Depend on the primitives, wrap them here — **recommended**

Add one headless library as a runtime dependency and build brutalist wrappers
with `recipe`, taking shadcn's *composition* as a reference for API shape while
writing every class string fresh.

```bash
pnpm add @base-ui/react   # see §6 for why this one
```

`tsup` externalises `dependencies` automatically, so this does not enter the
bundle — the precedent is `lucide-react`, which the MANIFEST already documents
as runtime-rather-than-peer "so a consumer gets working icons without opting
in". Same reasoning applies.

What this costs: one MANIFEST entry, and a decision between Radix and Base UI
(below). What it avoids: every conflict in option B, and every MIT-attribution
obligation from §4.

### B. Vendor the shadcn source and restyle it

Faster to a first render, and wrong for this repo. Each copied file breaks
rules that CI enforces:

- **`cva`, not `recipe`.** AGENTS.md: the engine is an implementation detail of
  one file, and `recipe` is deliberately unexported so it can be swapped. A
  vendored `cva` call site reverses that, and drags in the one Apache-2.0
  package.
- **`pnpm lint` rejects the class names outright.** `no-custom-classname` checks
  against a whitelist *derived* from `styles.css`/`prose.css`/`theme.css` by
  `scripts/authored-classes.mjs`. `bg-background`, `text-muted-foreground`,
  `border-input`, `ring-ring` and `rounded-md` name nothing here, so a vendored
  file fails on its first lint — loudly, which is the check working.
- **`dark:` variants contradict the ladder.** shadcn models theming as a
  light/dark flip. This system has four rungs resolving through `--ds-*`, and
  the `prose-ladder` note in AGENTS.md already explains why one mapping beats a
  flip. Every `dark:` utility in a vendored file is a bug on `dim` and `bright`.
- **Zero border-radius.** Every shadcn file carries `rounded-*`.

Realistically you keep the component's *structure* and rewrite every class
string — at which point you have written option A by hand, plus an attribution
obligation. The honest use of these files is **read them, then close them**:
they are a good reference for what parts a component needs and what the props
should be called.

### C. Publish this package as a shadcn registry

`skills/shadcn/registry.md` documents the format: a `registry.json`,
`npx shadcn@latest build`, and serve the generated `public/r` — which
`design-system.ryankelly.dev` is already positioned to do.

Real, and not worth it yet. It is a *distribution* change, and this package's
distribution is already better for its two known consumers: a versioned npm
package with a compiled `dist/`, a Tailwind `@theme` contract, and semver.
A registry serves the copy-paste-and-fork consumer, which this estate does not
have. Revisit if the package ever wants outside users who need to edit the
source.

---

## 6. Library gap analysis

Choosing "the primitives" means choosing between three, all of which shadcn now
generates against. This is the comparison the choice actually turns on.

Surfaces were read from the published packages, not the docs sites:

```bash
tar tzf react-1.7.0.tgz | grep -oP '^package/[a-z0-9-]+/index\.d\.ts$'          # Base UI: 38 components
tar tzf react-aria-components-1.20.0.tgz | grep -oP 'dist/exports/[A-Za-z]+\.cjs' # RAC: 80 exports
curl -s registry.npmjs.org/radix-ui/latest | jq '.dependencies|keys'             # Radix: 31 components + 23 internals
```

### Shape

| | `radix-ui` | `@base-ui/react` | `react-aria-components` |
|---|---|---|---|
| Version / released | 1.6.7, 2026-07-24 | 1.7.0, 2026-08-04 | 1.20.0, 2026-07-31 |
| **Licence** | **MIT** | **MIT** | **Apache-2.0** |
| First published | 2022-08 | **2025-12** | 2018-06 |
| Versions published | 189 | **11** | 897 |
| Components | 31 | 38 | ~55 (of 80 exports) |
| Install weight | 4.22 MB across **55 packages** | 9.49 MB, **1 package** | 6.42 MB, 8 packages |
| Direct deps | 54 `@radix-ui/*` | 5 | 7 |
| `sideEffects` | per-package | `false` | — |
| Styling escape hatch | `asChild` (Slot) | `render` prop | `className` render-prop |
| Ships CSS | no | no | no |

Three things in that table changed since the received wisdom about these
libraries formed, and each is worth stating because it inverts a common
objection:

- **React Aria is no longer a 90-package fan-out.** `react-aria@3.51.0` has
  **9** direct dependencies; the `@react-aria/*` / `@react-stately/*` per-hook
  packages have been consolidated. The "install weight" objection is dead.
- **Radix is the one with the package sprawl now** — 55 packages for 31
  components, because the `radix-ui` umbrella is a re-export shell over the
  individual primitives it still publishes separately.
- **Base UI's 9.49 MB is one package** and `sideEffects: false`, with per-component
  subpath exports. Most of that bulk is bundled locale data and a dual CJS/ESM
  build, and none of it reaches a consumer's bundle — but it does reach their
  `node_modules`.

### Coverage against the gaps this system actually has

The needed set is issue #50's list, plus the two composites that issue calls
thinner than their names.

| Gap | Radix | Base UI | RAC |
|---|---|---|---|
| `Checkbox`, `RadioGroup`, `Switch` | ✅ | ✅ | ✅ |
| `Select` (real listbox) | ✅ | ✅ | ✅ |
| `Tabs`, `Tooltip`, `Popover`, `Menu` | ✅ | ✅ | ✅ |
| `Accordion`, `Collapsible` | ✅ | ✅ | ✅ (`Disclosure`) |
| `Dialog` (for `Modal`) | ✅ | ✅ | ✅ |
| `AlertDialog` | ✅ | ✅ | via `role="alertdialog"` |
| `Toast` | ✅ | ✅ | ✅ |
| `Progress`, `Slider` | ✅ | ✅ | ✅ |
| **`Field` / `Fieldset`** | ❌ | **✅** | ✅ (`Group`/`FieldError`) |
| `Form` | ✅ (`0.1.x`) | ✅ | ✅ |
| `Combobox` / command palette | ❌ | **✅** | ✅ |
| `NumberField` | ❌ | ✅ | ✅ |
| `Meter` | ❌ | ✅ | ✅ |
| `Drawer` / `Sheet` | ❌ | **✅** | ❌ |
| OTP field | ✅ (`0.1.x`) | ✅ | ❌ |
| `ScrollArea` | ✅ | ✅ | ❌ |
| `NavigationMenu`, `Menubar`, `ContextMenu` | ✅ | ✅ | ❌ |
| `Avatar` | ✅ | ✅ | ❌ (presentational) |
| **`Table` with sorting** | ❌ | ❌ | **✅** |
| `Calendar` / `DatePicker` | ❌ | ❌ | ✅ |
| `TagGroup`, `Tree`/`GridList`, `DropZone`, `ColorPicker`, `SearchField` | ❌ | ❌ | ✅ |
| **Totals of 39** | **26** | **30** | **31** |

The totals are close and misleading; the differences that matter are three
specific cells.

**Base UI is the only one with a `Field` primitive that matches what this repo
already built by hand.** `src/components/Input.tsx` has `useField()` at line 84 —
`useId`, `aria-describedby`, `aria-invalid`, and the accent carried as
`--field-accent`. Base UI's `field` is that hook's public, tested equivalent,
with `field.error`/`field.description` parts and `data-invalid`/`data-disabled`
state attributes. Issue #50's "no `FormField`/`Fieldset` primitive, no exported
`Label`, no form-level error summary" is a one-import fix under Base UI and a
build under Radix.

**RAC is the only one that answers the `DataTable` half of issue #50.** That
issue lists `DataTable`'s defects — no sorting, no `scope="col"`, no `aria-sort`,
no `<caption>`, no row selection. RAC's `Table` has `allowsSorting` and
`sortDescriptor` and manages `aria-sort` itself. Radix and Base UI have **no
table primitive at all**, so under either, `DataTable` stays hand-rolled. That
is the single strongest argument for RAC, and it is a real one.

**Base UI eliminates four satellite dependencies.** Under Radix, the shadcn
convention reaches for `vaul` (drawer), `sonner` (toast), `cmdk` (command) and
`input-otp` — four more packages, four more maintainers, four more entries in
the `check-deps` MANIFEST and PR #64's licence baseline. Base UI ships `drawer`,
`toast`, `autocomplete`/`combobox` and `otp-field` in the box.

### Styling fit, which is the criterion AGENTS.md makes decisive

"Styling lives in TSX" and `recipe`'s one-slot-per-element model mean the
question is not what a library renders but **how it lets you own every element's
class attribute**:

- **Radix `asChild`** merges props onto a child you supply. It works, but the
  child is a real element you must provide at every part, and the composition is
  invisible to typing — `asChild` plus a wrapper is the shape shadcn uses, and
  it is the shape that fights a slot-per-element recipe.
- **Base UI `render`** takes an element or a function of `(props, state)`, and
  every part emits `data-*` state attributes. `recipe` slots map onto those
  one-to-one, and `data-[state=open]:bg-surface-raised` is a plain Tailwind
  arbitrary variant. This is the cleanest fit of the three.
- **RAC `className`** may itself be a render-prop function of state. Also
  workable, but the idiomatic Tailwind path is the
  `tailwindcss-react-aria-components` plugin for `data-` variants — another
  optional peer, and a second plugin whose selectors `scripts/authored-classes.mjs`
  would need to learn.

### Licence, against PR #64's gate

This is not a footnote, because **PR #64 makes it a CI failure**. That PR adds
`scripts/check-licenses.mjs` with a **default-deny allowlist split by scope**,
and its recorded shipped baseline is 8 packages: 4× OFL-1.1, 3× MIT, 1× ISC.

- **Radix and Base UI are MIT.** They land inside the shipped allowlist as it
  stands. Radix adds ~55 baseline entries, Base UI adds ~6.
- **RAC is Apache-2.0** — verified from `package/LICENSE` in the tarball, and its
  `@internationalized/*` and `@react-types/*` deps are Apache-2.0 too. PR #64's
  body names exactly this case: *"a licence change fails — including a benign one
  like MIT → Apache-2.0, which is harmless but adds a NOTICE obligation."*
  Adopting RAC means widening the shipped allowlist to Apache-2.0 and accepting
  its §4 duties across the whole `@react-*` tree.

That is a decision, not a blocker — Apache-2.0 is permissive and its patent
grant is arguably *better* than MIT. But it should be made against #64's gate
deliberately, not discovered when CI goes red.

#### Is Apache-2.0 a problem for an MIT package?

Not as a dependency. **The distinction that matters is depend versus vendor**,
and it is worth writing down because it decides several questions in this
document at once.

**Depending on it creates essentially no obligation.** A line in `dependencies`
is not redistribution: npm serves the package to the consumer from its own
registry, and Apache-2.0 §4's notice duties attach to *distributing* the work.
Your own source stays MIT and the `license` field stays honest. This repo has in
fact been doing it since day one — **`typescript` is Apache-2.0**, and so are
`@swc/helpers` and the whole `@internationalized/*` and `@react-types/*` tree
under React Aria.

**Bundling it into `dist/` is what switches the obligations on.** Then §4
applies: ship a copy of the licence, retain the copyright/patent/attribution
notices, reproduce any NOTICE file the package carries, and state significant
changes if you modified it (§4b). `tsup.config.ts` externalises `dependencies`,
and PR #64 verifies nothing third-party reaches `dist` — so this stays
theoretical for as long as that holds. It is the same mechanism that keeps the
OFL fonts safe, and it is why PR #64 checks `dist/` rather than trusting the
config.

**The one hard rule is that you cannot relicense it.** Apache-2.0 is one-way
compatible: it may be combined into an MIT-licensed project, but the
Apache-2.0 files stay Apache-2.0 and cannot be re-published as MIT. Copying
React Aria source into `src/` and shipping it under this package's licence is
the thing that is actually not allowed — the vendoring trap from §5B, with more
teeth than shadcn's MIT code has.

Two further differences from MIT, neither of them a problem here:

- **An express patent grant (§3), with retaliation.** The grant terminates if you
  initiate patent litigation over the work. For a personal design system that is
  a benefit, not a cost — MIT grants no patent rights at all.
- **Incompatible with GPLv2** (fine with GPLv3). Only reachable if a consumer
  wants to ship a GPLv2 application, which is not a scenario this estate has.

So the real cost of an Apache-2.0 runtime dependency here is **one line in PR
#64's shipped allowlist plus its baseline rows** — a deliberate, recorded
decision rather than a licence risk.

### Decision: Base UI, with TanStack Table for tables

**`@base-ui/react` is the adopted primitive layer.** The comparison behind it is
in [`docs/radix-vs-base-ui.md`](./radix-vs-base-ui.md) — measured from both git
histories and the published packages, not the docs sites — and it turned on
maintenance rather than API:

| Twelve months to 2026-09 | Radix | Base UI |
|---|---|---|
| Commits merged | 243 | **1,852** (7.6×) |
| Distinct authors | 22 | 94 |
| Top author's share | **90.4%** | 45.6% |
| Authors to reach half the commits | **1** | 2 |
| Months at ≤1 commit | **7** (5 at zero) | 0 |
| Test files in repo | 45 | 274 |

Both shipped nine stable npm releases in that window, which is why release
cadence is the wrong metric here: one of them shipped those nine off 243 commits
in two bursts with 90% of the work from one author, and the other off 1,852
sustained across 94. Radix's continuity now rests on one person's availability —
a different risk from the one its 2022–2024 reputation was earned under. Base
UI's README names Colm Tuite and Jenna Smith on its team; neither appears in
Radix's last 1,284 commits.

The API case is independent and points the same way: `render` composes with
`recipe` slots where `asChild` fights them, `useRender` is public so the same
state-to-`data-*` machinery is available for this package's own components,
`field` is the public equivalent of the `useField()` hook `Input.tsx` hand-rolls
(and `CheckboxRootState extends FieldRootState`, so controls inherit field
validity for free), `data-starting-style`/`data-ending-style` remove the need for
hand-written keyframes on every overlay, and it ships drawer, toast, combobox and
OTP in the box where Radix needs `vaul`, `sonner`, `cmdk` and `input-otp`.

`@tanstack/react-table` **9.2.4 is MIT**, as are `@tanstack/table-core` and
`@tanstack/store`. Neither Radix nor Base UI has a table primitive, so that
pairing is unaffected by this decision. The whole adopted path is MIT, so PR
#64's shipped allowlist needs no widening.

#### The accepted cost, and the rule that bounds it

**Churn is accepted deliberately.** Base UI has 11 published versions since
2025-12 against Radix's 189 since 2022; a breaking major inside a year is
plausible, and nine months of published history cannot prove stability. The
decision is that a bounded churn risk beats an unbounded stall risk: you can
wrap your way out of an API change, and you cannot wrap your way out of an
unfixed upstream bug.

What bounds it is the rule this package already applies to
`tailwind-variants`, and it is a condition of the decision rather than a
suggestion:

1. **One wrapper per primitive.** No component imports `@base-ui/react` twice,
   and no consumer imports it at all.
2. **Never re-export a primitive raw** from `src/index.ts`. If Base UI's types
   reach the published `.d.ts`, a major becomes a breaking change for the blog
   and YNAB rather than one PR here — which is exactly the reasoning that keeps
   `recipe` unexported today.
3. **Record it in AGENTS.md** in the "Dependencies Held Back on Purpose" style,
   in the PR that adds the dependency, so the next person finds the reason
   before re-litigating the choice.

With those in place the blast radius of a Base UI major is this package. Without
them the decision is a worse bet than Radix would have been.

### What TanStack Table does and does not fix

It is a **state and logic layer with no markup and no ARIA**. Against issue
#50's list of `DataTable` defects it splits cleanly:

| Defect | TanStack Table |
|---|---|
| No sorting | **fixes** (`getSortedRowModel`, `SortingState`) |
| No row selection | **fixes** |
| Filtering, pagination, column sizing | **fixes** |
| No `scope="col"` on header cells | does not fix |
| No `aria-sort` | does not fix |
| No `<caption>` | does not fix |
| Array indices as React keys | does not fix — it gives you stable row/cell ids; using them is on you |
| Sticky header | does not fix |

That is the boundary the library advertises, not a criticism of it. But it means
**the ARIA half of #50 stays this repo's work**, and the canonical reference
implementation will not help:

```bash
# shadcn's own table primitive, and its 892-line Radix data-table block
grep -c 'aria-sort\|scope=' apps/v4/registry/new-york-v4/ui/table.tsx
grep -c 'aria-sort\|scope=' apps/v4/registry/bases/radix/blocks/dashboard-01/components/data-table.tsx
# 0 and 0
```

Both wire `getSortedRowModel`; neither emits `aria-sort` or `scope="col"` — the
exact defect #50 names. Copy their column and state wiring; do not copy their
table semantics. This lands squarely in issue #52's territory: an axe gate is
what would stop the same omission being repeated here.

---

## 7. What is already in flight

Checked against 22 open PRs and 37 open issues. **Three of this document's
recommendations are already covered, and one of its findings is wrong as a
result.**

| This document said | Already covered by |
|---|---|
| Add the missing LICENSE file | **PR #64** *and* **PR #60** — both ship it, and #60's body flags the duplicate: the two `LICENSE` files are byte-identical, so they merge cleanly in either order |
| Add a licence field to the `check-deps` MANIFEST with an allowlist | **PR #64**, far more thoroughly — `scripts/check-licenses.mjs`, a `licenses.baseline.json` keyed on package name so a *licence change* fails while a benign bump is silent, default-deny split by shipped/dev scope, and the OFL §5 font-bundling case. Nine failure paths exercised. My proposal was the weaker version of this |
| The component gap list (`Checkbox`, `Switch`, `Tabs`, `Tooltip`, `Progress`, `Skeleton`, `Spinner`, `EmptyState`, the `Alert`-is-`NoteBlock` observation, the `Breadcrumbs` re-export) | **Issue #50**, independently and first |
| `docs/gap-analysis.md` is stale | Partly **PR #63** / issue #56, *"Documentation and gates pointing at things that no longer exist"* |

### What is genuinely uncovered

**No PR and no issue proposes adopting a headless primitive library.** Issue #50
lists the same missing components and prescribes building them **by hand on the
`Input` pattern** — it never raises the build-vs-adopt question. That question,
and §6 above, is the part of this evaluation that is new.

### Two dependencies that change the ordering

- **Issue #49 — "the token layer stopped at colour: no spacing, type scale,
  motion or z-index tokens" — is a prerequisite, not a nice-to-have.** Every
  overlay primitive in §6 needs a z-index and an enter/exit transition. `Modal`
  currently hardcodes `z-50`. Adopting a library without #49 means every new
  overlay invents its own stacking value, which is exactly the class of drift
  the semantic token layer exists to prevent.
- **Issue #52 — "no accessibility gate" — is what makes this decision
  measurable.** The entire case for adopting a library is that hand-rolled
  focus management is wrong in ways nothing here can currently observe; #52's
  axe-over-the-story-index gate is what would turn that argument into a number.
  It is also the check that would have caught the four `Modal` defects in §3.

### Conflicts to expect

- **PR #64 is `mergeable_state: dirty`** and based on `dafbc1f`, two commits
  behind `main` at `650cd9f`. It needs a merge before it can land, and it should
  land *before* any primitive library is added — otherwise 6 to 55 new
  transitive packages arrive with no baseline to record them against.
- **PR #57** (issue #44) already touches `Modal`'s focus ring. If `Modal` moves
  onto a library `Dialog` (§3), #57 lands first and the migration rebases onto it
  — not the reverse.

---

## Suggested order

Superseded by the staged plan in
[`radix-vs-base-ui.md`](./radix-vs-base-ui.md#the-adoption-plan) — eight PRs,
three gated on work already in flight, one parallel track, one breaking change,
each with an exit criterion. The short version:

| | | Gated on |
|---|---|---|
| **Stage 0** | Land PR #64, then #49 (tokens), then #52 (axe gate) | already specified; #64 needs a merge first |
| **PR 1** | Add `@base-ui/react` — dependency, `MANIFEST` entry and the AGENTS.md confinement rule, zero components | Stage 0 |
| **PR 2** | `Field`, replacing `useField()`; `Input`/`TextArea`/`Select` move onto it in the same PR | PR 1 |
| **PR 3** | `Modal` onto `Dialog` — the one breaking change, ship as `0.4.0` with a deprecated shim | PR 1, rebased onto PR #57 |
| **PR 4–7** | `Checkbox` + `Switch`, `RadioGroup`, `Select`, `Tabs` + `Tooltip` | PR 2 |
| **PR 8** | `Skeleton`, `Spinner`, `Empty`, `Kbd` | nothing — start today |

`Field` is the chokepoint: every form control composes it, which is why it ships
alone and before any of them. `DataTable` sorting on `@tanstack/react-table` is a
separate track, and wants #52 landed first because its ARIA semantics are
hand-written.

## Appendix: correction to the existing docs

`docs/gap-analysis.md` should be re-dated or deleted. It is measured against
`95ef0ba` and three of its claims are now false:

- "there is no linter in this repo. Not a misconfigured one — none at all" —
  `eslint.config.mjs` exists and `pnpm lint` is a required check.
- Its gap 1 lists 48 palette violations across four components. There are now
  **zero** in shipped source; the only matches are the `FORBIDDEN` regexes in
  `Input.test.tsx` and `StatCard.test.tsx` that guard against regression.

  ```bash
  grep -rn "brutalist-cyan\|brutalist-pink\|brutalist-yellow\|brutalist-green\|--color-white\|--border-color" \
    src/components --include=*.tsx | grep -v stories
  ```

- It reasons throughout about `dark` and `sketch` themes, which the four-rung
  `midnight`/`dim`/`bright`/`white` ladder replaced.

Its §5 component table and its closing "YNAB: adopt or decouple" question are
both still live, and are the parts worth carrying forward.
