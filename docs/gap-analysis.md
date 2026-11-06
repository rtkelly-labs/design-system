# Design System Gap Analysis

A survey of where `@rtkelly13/design-system` and its two consumers (`rtkelly13/blog`,
`rtkelly13/ynab-budget-companion`) diverge from what this repo says about itself in
[AGENTS.md](../AGENTS.md).

Every count below was measured against `main` at `95ef0ba` (design-system),
`f172763` (blog), and `8ca9ae2` (ynab-budget-companion). Reproduction commands are
included so the numbers can be re-derived rather than trusted.

The gaps are ordered by severity. The first three are **stated invariants with no
enforcement** — the docs assert a rule, nothing checks it, and the code has already
drifted. Those matter more than the missing components in gap 5, which are merely
absent rather than quietly false.

---

## 1. Semantic theming is documented as mandatory and is not enforced anywhere

AGENTS.md is unambiguous:

> Components must **never** reference `--brutalist-cyan`, `--color-white`, `--border-color`
> or the `brutalist-*` Tailwind utilities directly.

Four components do exactly that:

| Component | Violations | What breaks |
|---|---|---|
| `admin/AdminDashboardLayout.tsx` | 23 | Sidebar, header rules, stat cards, and table borders are pinned to the `dark` palette |
| `Input.tsx` | 10 | Focus ring is pinned on all three of `Input`, `TextArea`, `Select` |
| `blog/LoremIpsumPost.tsx` | 9 | Headings and the code-block chrome are pinned |
| `StatCard.tsx` | 6 | Hover border + accent text are pinned |

```bash
grep -rn "brutalist-cyan\|brutalist-pink\|brutalist-yellow\|brutalist-green\|--color-white\|--border-color" \
  src/components --include=*.tsx | grep -v stories
```

The consequence is specific, not stylistic. `--brutalist-cyan` is *one palette's* mapping
of a role. `.dim` and `.sketch` remap the semantic variables, not the palette variables —
so a component addressing `--brutalist-cyan` renders the dark theme's cyan on paper-white
`sketch` regardless of the theme in effect. The `ThemeProvider` swap silently no-ops for
these four components.

**Why it drifted:** there is no linter in this repo. Not a misconfigured one — none at all.

```bash
$ ls -a | grep -iE "eslint|biome|prettier"
# no output
$ node -e "console.log(Object.keys(require('./package.json').scripts))"
[ 'build', 'dev', 'typecheck', 'storybook', 'build-storybook',
  'test:visual', 'test:visual:update', 'prepublishOnly', 'walkthrough', 'walkthrough:show' ]
```

The four required checks in AGENTS.md are `typecheck`, `build`, `build-storybook`, and
`test:visual`. None of them can observe a hardcoded colour: `tsc` sees a well-typed
string, and visual regression compares `dark` against a `dark` baseline, which is exactly
the theme where the violations are invisible.

**Fix:** a `no-restricted-syntax` rule (or a plain `grep` gate in CI) over
`src/components/**` rejecting the seven forbidden identifiers. That is what makes the
existing prose load-bearing. Migrating the four components is the follow-on, and it is
mechanical once the rule exists to prove it stays done.

Note that the `walkthrough` suite already captures all four — every one of them has a
story, and `walkthrough` screenshots every story in all three themes. AGENTS.md even
names this as its purpose: *"a token change that reads fine in `dark` can be unusable in
`sketch`, and a pixel diff against a single-theme baseline will never surface that."*
The evidence is sitting in `walkthrough-report/`; it is nobody's job to look. That is an
argument for the cheap grep gate rather than for more screenshots — AGENTS.md is explicit
that `walkthrough` is "**not** a gate", and turning it into one is a much larger change
than rejecting seven identifiers.

---

## 2. 26 of 36 components have no story

Storybook is not an internal tool here — it is the published documentation surface at
[design-system.ryankelly.dev](https://design-system.ryankelly.dev). A component without a
story is undocumented for consumers.

```bash
for f in $(find src/components -name '*.tsx' ! -name '*.stories.tsx' ! -name 'mdxComponents.tsx'); do
  b=$(basename "$f" .tsx)
  find src -name "$b.stories.tsx" | grep -q . || echo "$b"
done
```

Missing stories, grouped:

- **Primitives (9):** `Badge`, `BracketText`, `PageTitle`, `PageHeader`, `Tag`,
  `Pagination`, `SectionContainer`, `AsciiDivider`, `ThemeProvider`
- **Composites (5):** `Modal`, `DataTable`, `NoteBlock`, `TLDR`, `Slide`
- **Docs portal (10):** the entire `components/docs/` surface — `DocsLayout`,
  `DocsSidebar`, `DocsHeader`, `DocPager`, `Breadcrumbs`, `TableOfContents`, `Prose`,
  `CodeBlock`, `AnchorHeading`, `DocsLinkProvider`
- **Other (2):** `BlogPost`, `ExperimentsView`

`Modal` and `DataTable` are the notable ones: both are exported primitives with real
prop surfaces, and neither appears anywhere in the published Storybook.

The docs-portal cluster is partly explained — `DocsPortal.stories.tsx` exercises the
layout end to end — but that is one composed story standing in for ten components, so
individual prop surfaces stay undocumented.

This compounds with AGENTS.md convention 7: *"adding a story without a snapshot leaves
`test:visual` unable to assert it."* No story means no baseline, which means gap 3.

---

## 3. Visual regression covers 5 stories

`tests/visual.spec.ts` asserts exactly five:

| Story | Component |
|---|---|
| `foundations-button--default` | Button |
| `foundations-button--bracketed` | Button |
| `foundations-card--default` | Card |
| `presentation-slidedeck--default-deck` | SlideDeck |
| `blog-loremipsumpost--foundational-blog-post` | LoremIpsumPost |

That is 4 distinct components out of 36, from 12 story files. `Avatar`, `Input`,
`StatCard`, `AdminDashboardLayout`, `SaasLandingPage`, `DesignSandbox`, `DocsPortal`, and
`SemanticTokens` all have stories already written and are simply not baselined — the
cheapest coverage available, since the stories exist and only need
`/update-snapshots` plus a case added to the spec.

Worth pairing with the open tolerance question. AGENTS.md flags that
`maxDiffPixelRatio: 0.05` was inherited from the era when every baseline was
accidentally a "No Preview" placeholder, and is "probably looser than it needs to be now
that baselines are real components" — which is also the substance of open issue
[#32](https://github.com/rtkelly13/design-system/issues/32). Widening coverage at a
tolerance this loose buys less than it appears to; the two should move together.

---

## 4. `ynab-budget-companion` depends on the design system and contradicts it

The frontend imports `@rtkelly13/design-system/styles.css` and wraps the app in
`ThemeProvider`, then builds its own visual language on top.

**Adoption is three components.** Across 1,739 lines of TSX, the only imports are:

```tsx
import { Button, Badge, Avatar } from '@rtkelly13/design-system';   // Navbar.tsx
import { ThemeProvider } from '@rtkelly13/design-system';           // App.tsx
```

**The local stylesheet inverts the system's two defining principles.** AGENTS.md opens
its principles with *"Zero Border-Radius: `0px` globally enforced"* and *"Hard Offset
Shadows: no blur"*. `src/index.css` defines:

```css
.glass-card {
  backdrop-filter: blur(16px);
  border-radius: var(--radius-md);
}
```

Seven `border-radius` declarations across `index.css` and `App.css`, including a
`9999px` pill. This is not a component the system lacks — it is the negation of the
system, applied to `glass-card` and `btn-primary` classes used throughout all seven views.

**~180 hardcoded hex colours**, none of which are design system tokens:

```bash
grep -rho "#[0-9a-fA-F]\{6\}" src --include=*.tsx | sort | uniq -c | sort -rn | head
#   42 #9ca3af   23 #6b7280   20 #34d399   17 #111827   15 #818cf8
#   14 #f43f5e   12 #10b981    9 #f59e0b    8 #f9fafb    6 #fbbf24
```

Indigo/emerald/rose — a Tailwind default palette, unrelated to the brutalist cyan/pink/
yellow. Because these are literals in `style={{}}` props, the `ThemeProvider` wrapping
`App.tsx` governs almost nothing that renders.

**Raw form controls, 34 of them** (`<input>`, `<select>`, `<button>`, `<table>`),
concentrated in `RulesView` (11), `DashboardView` (9), and `BankIngestionView` (5) — even
though `Input`, `TextArea`, and `Select` are all exported and would cover most of them.

This is the largest single gap by volume, and the one where "gap" is doing the most work:
the design system is not missing something YNAB needs so much as YNAB has independently
grown a second design system. Closing it is a migration, not a component addition, and it
needs a decision (below) before any code moves.

**Contrast with the blog**, which has genuinely adopted the system — `Button`, `Card`,
`BracketText`, `PageTitle`, `PageHeader`, `SectionContainer`, and `Tag` are all two-line
re-export shims over the package, and `NoteBlock`, `TLDR`, and `Pagination` are thin
adapters. The pattern to copy already exists in the estate.

---

## 5. Missing primitives

Confirmed absent from `src/`:

| Primitive | Demand |
|---|---|
| `Checkbox` | ynab `RulesView`; blog `admin/TalkControls.tsx` |
| `Radio` | ynab forms |
| `Switch` / `Toggle` | ynab rule enable/disable |
| `Alert` / `Banner` | ynab result banners — but see the `NoteBlock` note below |
| `Spinner` / `Skeleton` | ynab loading states (currently bare `<p>Loading rules...</p>`); blog `QueryRouter`, `diagrams/Diagram` |
| `Tabs` | no current demand |
| `Tooltip` | no current demand |
| `Progress` | no current demand |
| `EmptyState` | no current demand |
| `Accordion`, `Dropdown`, `Menu` | no current demand |

The top four have demonstrated demand in shipped code. The rest are conspicuous by
absence in a component library but nothing in either consumer is currently reaching for
them — building them now would be speculative.

**`Alert` is probably already built.** `NoteBlock` takes
`type?: 'note' | 'tip' | 'warning' | 'important'` and resolves each through
`semanticTokens.intent` — it is the one component in the repo that models the semantic
guidance correctly, and it covers the banner case. The gap here is naming and
discoverability (`NoteBlock` reads as editorial chrome, not an app-level alert), not a
missing component. Treat this as an alias or a docs fix before treating it as a build.

`NoteBlock` is also the reference implementation for gap 1 — the migration target for
the four palette-pinned components is the pattern it already uses.

One packaging note: `Breadcrumbs` exists but is only reachable through the docs barrel
(`components/docs/index.ts`), so it reads as docs-portal chrome rather than a general
primitive. If app-level breadcrumbs are wanted, that is a re-export, not a build.

---

## Suggested order

Ordered by dependency rather than by severity — 1 and 2 are cheap and make the rest
verifiable.

1. **Add a lint gate for the forbidden identifiers.** Small, and it converts gap 1 from
   prose into a check. Do this before migrating the four components, so the migration
   can be proven complete.
2. **Baseline the 8 stories that already exist.** No new code — `/update-snapshots` plus
   spec cases. Settle the tolerance question (issue #32) in the same pass.
3. **Migrate the four palette-pinned components** to semantic tokens, starting with
   `Input` (10 violations across 3 exported components, and the most-used of the four)
   and `StatCard`. `NoteBlock` is the reference implementation to copy — see gap 5.
4. **Write stories for `Modal` and `DataTable`**, the two exported composites with no
   documentation at all, then work through the remaining primitives.
5. **Decide the YNAB question** — see below. Nothing in gap 4 should move before it.
6. **Build `Checkbox`, `Switch`, `Spinner`** once 5 is decided, since that decision
   determines whether they need to serve YNAB's forms. `Alert` likely needs a rename,
   not a build.

## The decision this analysis cannot make

Gap 4 has two defensible resolutions and they lead opposite directions:

- **Adopt** — migrate YNAB onto the brutalist system, deleting `glass-card` and
  `btn-primary`. Consistent estate, and the blog's shim pattern shows the path. Costs a
  rewrite of all seven views and discards the existing visual design.
- **Decouple** — accept YNAB as its own aesthetic and drop the `@rtkelly13/design-system`
  dependency, which today buys three components and a `ThemeProvider` that governs almost
  nothing. Honest about what is actually happening; gives up estate consistency.

The current state — depending on the package while contradicting its two founding
principles — is the one option with the costs of both. Worth resolving deliberately
either way.
