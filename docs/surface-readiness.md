# Surface readiness — is this a multi-purpose design system yet?

The stated aim is one system serving **marketing**, **blog** and **admin** sites.
This document measures the package against that aim, surface by surface, and
names the other surfaces worth claiming.

It deliberately does **not** re-litigate the gaps already documented elsewhere:

- [`docs/evaluation.md`](./evaluation.md) — the package as a *system*: token
  design, test layer, publishing.
- [`docs/gap-analysis.md`](./gap-analysis.md) — **stated invariants with no
  enforcement**, and the divergence of the two consumers. (Lands with
  [#34](https://github.com/rtkelly13/design-system/pull/34).)

Those two ask *"does the system hold together?"*. This one asks *"how many kinds
of site can you actually build with it?"* — a different axis, and the one the
multi-purpose aim is stated in.

Measured against `main` at `95ef0ba`, with `rtkelly13/blog` and
`rtkelly13/ynab-budget-companion` as the consumers. Reproduction commands are
included so the numbers can be re-derived rather than trusted.

---

## Verdict

The **theme architecture** is ready for four surfaces. The **component
inventory** is ready for about one and a half.

### These assignments are published as story tags

Every story carries exactly one status tag, and `pnpm check:story-conventions` fails on a
missing one, an unknown word, or two. **This table is the source**; the tags are how a
consumer sees it without reading this file.

| Sidebar group | Tag | From the table below |
|---|---|---|
| `Guides/*` | `stable` | prose about decisions already made and shipped |
| `Foundations/*` | `stable` | the published primitives, gated end to end |
| `Docs/*` | `stable` | ~90%, "nothing structural" blocking |
| `Blog/*` | `stable` | ~70%, real primitives really adopted by the blog |
| `Presentation/*` | `experimental` | `SlideDeck` is, per #70, "the one component no other consumer can use" |
| `SaaS/*` | `experimental` | ~20–25%, "screenshots of one specific product" |
| `Showcase/*` | `experimental` | a sandbox, not a component |

The vocabulary is Storybook's own feature lifecycle — `stable`, `experimental`, `preview`,
`deprecated` — rather than a second one to maintain. A group cannot be added to the sidebar
without a status, because `check:story-conventions` closes both lists at once.

| Surface | Readiness | What carries it | What blocks it |
|---|---|---|---|
| Docs / reference | ~90% | Full chrome kit, semantic throughout, genuinely responsive | Nothing structural |
| Blog / editorial | ~70% | Real primitives, really adopted by the blog | No site chrome (header/nav/footer) |
| Marketing | ~25% | One hardcoded demo page | Not composable; not responsive; CTAs cannot be links |
| Admin / app | ~20% | One hardcoded demo layout | Built on the least themable primitives; unused by both real admins |

The gap is not design quality — the `Emphasis`/`Intent` split in `src/lib/theme.ts`
is a better abstraction than most in-house systems reach. The gap is that
*marketing* and *admin* are not surfaces yet. They are screenshots of one
specific product.

---

## 1. Docs — the surface to copy

`DocsLayout`, `DocsHeader`, `DocsSidebar`, `TableOfContents`, `Breadcrumbs`,
`DocPager`, `AnchorHeading`, `CodeBlock`, `Prose`, `mdxComponents`,
`DocsLinkProvider`.

This is the one part of the repo built like a system rather than like a page:

- Styled through named classes in `prose.css` that address the semantic layer —
  27 references to `--ds-accent-primary`, 18 to `--ds-border-strong`, 15 to
  `--ds-text-primary`. Nothing in it names a hue.
- Actually responsive: 11 media queries, against 0 in any component.
- Router-agnostic by construction (`DocsLinkProvider`).
- `--docs-header-height` is measured by the header itself and feeds
  `scroll-padding-top` and every heading's `scroll-margin-top`, so anchors land
  correctly at any viewport width.

```bash
grep -c "@media" src/prose.css                    # 11
grep -o "var(--ds-[a-z-]*" src/prose.css | sort | uniq -c | sort -rn | head -5
```

Nothing else in the repo reaches this bar. Where the sections below say "do it
like the docs chrome", this is what they mean.

---

## 2. Blog — adopted, but missing the site around the article

Adoption here is real, and worth stating plainly because it is the counter-example
to §4: the blog's `components/Button.tsx`, `Card.tsx`, `PageTitle.tsx`,
`BracketText.tsx`, `SectionContainer.tsx` and `Tag.tsx` are **two-line re-export
shims** over the package, and `PageHeader`, `NoteBlock`, `TLDR` and `Pagination`
are thin adapters. The `^0.0.5` caret pin that froze the blog behind published
releases is also resolved — it is on `^0.1.3`.

What is missing is everything around the article body:

| Needed by any blog | Status |
|---|---|
| Site `Header` / `Nav` / `MobileNav` | absent — blog has its own |
| `Footer` | absent — blog has its own |
| `Link`, `Image` | absent — blog has its own |
| Post card / post list / archive | absent |
| Series navigation | absent — blog has `SeriesNavigation.tsx` |
| Inline TOC for articles | absent — blog has `TOCInline.tsx` (the docs `TableOfContents` is docs-chrome) |
| Search UI | absent — blog has `search/KBarModal`, `search/DeepSearch` |
| Newsletter / subscribe form | absent — blog has `NewsletterForm.tsx` |
| Share / reactions | absent — blog has `Reactions.tsx` |

And `BlogPost` itself is not multi-purpose. It hardcodes one author:

```
src/components/blog/BlogPost.tsx:21    author = 'Ryan Kelly',
src/components/blog/BlogPost.tsx:119   ryankelly.dev • Systems Architecture & Brutalist UI
src/components/blog/BlogPost.tsx:24    tags = ['Engineering', 'Design System', 'Architecture'],
```

The footer bio block is not parameterised at all — a second author cannot use
this component, and neither can a second site.

---

## 3. Marketing — one page, not a kit

`SaasLandingPage` is the entire marketing surface. 337 lines, one exported
component, 33 inline style objects.

**It is not composable.** There is no `Hero`, `FeatureGrid`, `PricingTable`,
`CTA`, `Testimonial`, `LogoCloud`, `FAQ` or `Footer` — the sections exist only as
JSX inside one function. You cannot build a *second* landing page from it, which
is the only test that matters for a marketing surface.

**It ships one product's copy in the published npm package.**
`DEFAULT_PRICING_TIERS` is exported from `src/index.ts` and contains
"SHA-256 CSV Deduplication", "Real-Time YNAB API Sync", "Google Drive Backups",
"Cashflow & Runway Forecaster". So does `DEFAULT_ADMIN_NAV` (§4). Demo content
belongs in stories, not in `dist`.

**It is not responsive.** Both section grids are fixed:

```
src/components/saas/SaasLandingPage.tsx:172   gridTemplateColumns: 'repeat(3, 1fr)'
src/components/saas/SaasLandingPage.tsx:223   gridTemplateColumns: 'repeat(3, 1fr)'
```

Three columns at 375px. A marketing page that does not work on a phone is not a
marketing page.

**It re-implements the token layer it ships next to.**
`SaasLandingPage.tsx:51` defines a local `ACCENT_COLORS` map re-deriving
`var(--brutalist-*)` — duplicating exactly what `accentVar()` exists to provide.

**CTAs cannot be links.** `ButtonProps` extends only `ButtonHTMLAttributes`, so
`Button` always renders `<button>`. Marketing CTAs are almost always anchors —
"Get started" navigates. Today a consumer either nests an `<a>` inside a
`<button>` (invalid) or re-styles from scratch.

**Web fonts are fetched from a third party at first paint.**
`src/styles.css:2` is an `@import` of `fonts.googleapis.com`. That is a
render-blocking cross-origin request on the one surface where LCP is a business
metric — and the blog already solved it by self-hosting via `@fontsource`. Note
this survived the theme work in
[#33](https://github.com/rtkelly13/design-system/pull/33), which has since landed
in 0.2.0.

---

## 4. Admin — a mock, and unused by both real admins

`AdminDashboardLayout` is not a shell you can put an app inside. It is a
screenshot of one app, with 51 inline style objects:

```
src/components/admin/AdminDashboardLayout.tsx:33    appTitle = "YNAB COMPANION ADMIN"
src/components/admin/AdminDashboardLayout.tsx:136   Ryan Kelly
src/components/admin/AdminDashboardLayout.tsx:60    width: '280px'      // fixed, no collapse, no mobile
src/components/admin/AdminDashboardLayout.tsx:208   <table style={{ … }}   // hand-rolled, ignores this repo's own DataTable
```

`DEFAULT_ADMIN_NAV` is reconciliation / rule engine / cashflow forecast / Drive
backups. The KPI cards contain literal values — `+$4,280.00`, `3 VARIANCES`,
`SYNCED 10M AGO`. A second admin site cannot use any of it without deleting all
of it.

**Neither real admin in the estate uses it**, which is the strongest available
evidence that it is not load-bearing:

- `rtkelly13/blog` has a working admin at `components/admin/AdminDashboard.tsx`
  (257 lines) and defines its own local `Card` with `bg-zinc-900` rather than
  importing anything.
- `rtkelly13/ynab-budget-companion` — the app this layout was modelled on —
  imports `Button`, `Badge` and `Avatar`, and nothing else. Its
  `ApiSettingsModal` is glassmorphism: `glass-card`, `borderRadius: '12px'`,
  `#818cf8`. See gap 4 of [`gap-analysis.md`](./gap-analysis.md), which covers
  that divergence and the decision it needs.

### The structural problem underneath it

The primitives an admin depends on are the least themable code in the repo.
Seven files carry hardcoded Tailwind greys that **no theme remaps** — and they
are, almost exactly, the app-surface primitives:

```bash
grep -rlE '\b(bg|text|border|divide)-(zinc|red)-[0-9]' src/components
# Input.tsx  StatCard.tsx  DataTable.tsx  Pagination.tsx
# Modal.tsx  PageHeader.tsx  experiments/DesignSandbox.tsx
```

`bg-zinc-900` is a literal. In `bright` — the light paper theme — these render
as dark boxes on a light page. The blog and docs surfaces barely touch these
components; admin is built from nothing else.

`Input` is migrated as of 0.2.0
([#33](https://github.com/rtkelly13/design-system/pull/33)); `StatCard` is migrated by
[#36](https://github.com/rtkelly13/design-system/pull/36). `DataTable`, `Pagination`
and `PageHeader` are covered by
[#40](https://github.com/rtkelly13/design-system/pull/40), and `Modal`'s a11y gaps
by [#38](https://github.com/rtkelly13/design-system/pull/38).

### Missing for any real admin

`Tabs`, `Toast`, `Dropdown` / `Menu`, `Checkbox`, `Radio`, `Switch`, `Drawer`,
`Tooltip`, `Skeleton` / `Spinner`, `EmptyState`, `Progress`, sortable and
paginated `DataTable`, form-field layout, auth screens, charts.

`gap-analysis.md` §5 ranks these by *demonstrated demand in shipped code* —
`Checkbox`, `Switch`, `Spinner` and an `Alert` (which `NoteBlock` probably
already is) are the four with real call sites waiting. That ranking should win
over this list; it is evidence-based and this one is not.

### `Modal` is not production-grade

Independent of theming: no focus trap, no Escape handler, no scroll lock, no
portal, and `role="dialog"` without a labelled title. It is fine as a
Storybook exhibit and unusable in an app where a keyboard user can tab out of an
open dialog into the page behind it.

---

## 5. Cross-surface: no literal-value token export

`brutalistTokens` ships `var(…)` **strings**. Every value in it is a CSS
variable reference, which is exactly right for the DOM and useless everywhere
else: canvas, SVG generators, OG image rendering, Spectacle themes, Mermaid
configs and HTML email all need resolved literals.

So consumers re-declare them, and they have already drifted:

| Value | Design system | `blog/components/graphics/palette.ts` |
|---|---|---|
| bright paper | `#fcfbf9` | `#f5f3ec` |
| bright ink | `#18181b` | `#23262e` |

`blog/components/talks/theme.ts` re-declares the accents a third time for
Spectacle. This is one gap producing three copies of the palette.

**Mostly solved as of 0.2.0.** [#33](https://github.com/rtkelly13/design-system/pull/33)
introduced `src/theme/levels.ts`, which holds the ladder as literal colours in
TypeScript and generates `theme.css` from it. What remains is the small part:
exporting those literals from the package entrypoint, and migrating the blog's
two copies onto them.

---

## 6. Other surfaces worth claiming

Ranked by leverage against what already exists in the estate, not by how
interesting they are to build.

1. **Auth & account** — login, signup, reset, settings. Every admin needs it;
   neither existing admin has a designed one.
2. **System & error states** — 404 / 500 / maintenance / offline, empty states,
   loading skeletons. All four surfaces need them; there are currently zero.
3. **Talks & live presentation** — this repo ships `Slide` and `SlideDeck` while
   the blog runs a full parallel implementation (`SpectacleDeck`, `DeckLive`,
   `LivePoll`, `TalkTimer`, `DeckSidebars`, and its own `talks/theme.ts`). Two
   deck systems is the worst of both. Promote one, delete the other.
4. **Diagrams & generative graphics** — `rtkelly13/mermaid-toolkit` has a
   `retro-brutalist` preset wired to nothing, and `blog/components/graphics` has
   its own palette. §5's literal export bridges three repos at once.
5. **Email / newsletter templates** — table-based and inline-styled; blocked on
   §5 and nothing else.
6. **OG / social image generation** — same dependency.
7. **Status & changelog pages** — cheap, and this repo's own site wants one.
8. **Command palette / search** — the blog has KBar and DeepSearch; a command
   palette is reusable across every admin.
9. **Data-viz tokens** — the blog has `TalkStatsChart`, ynab has a forecaster,
   and there is no chart palette or scale in the system.
10. **Print / PDF stylesheet** — docs and blog both benefit, and a mono
    brutalist aesthetic translates to paper unusually well.

---

## What is already in flight

Cross-referenced so this document does not generate duplicate work.

| Open PR / issue | Covers |
|---|---|
| [#31](https://github.com/rtkelly13/design-system/pull/31) | Stories for every component + widened visual suite |
| [#33](https://github.com/rtkelly13/design-system/pull/33) — **merged, 0.2.0** | Four-level theme ladder, literal tokens in TS, SSR-safe `ThemeProvider`, `Input` migration, contrast/CSS/token/coverage gates |
| [#34](https://github.com/rtkelly13/design-system/pull/34) | Vitest suite over `lib`/`hooks`, and `gap-analysis.md` |
| [#35](https://github.com/rtkelly13/design-system/pull/35) | Semantic Tailwind aliases follow nested theme panels |
| [#36](https://github.com/rtkelly13/design-system/pull/36) | `Input` + `StatCard` onto semantic roles |
| [#38](https://github.com/rtkelly13/design-system/pull/38) | `Modal` focus trap, Escape, portal, scroll lock, labelled title |
| [#39](https://github.com/rtkelly13/design-system/pull/39) | `Button` renders an anchor when given an `href` |
| [#40](https://github.com/rtkelly13/design-system/pull/40) | `DataTable`, `Pagination`, `PageHeader` onto semantic roles |
| [#32](https://github.com/rtkelly13/design-system/issues/32) | Visual regression tolerance too loose |

Between them, most of §4's theming problem and all of §5's hard part are handled.
`Modal`, `Button`, `DataTable` and `Pagination` were untouched when this was
written; #38, #39 and #40 were opened immediately afterwards and now cover them.
**What remains unclaimed** is `SaasLandingPage` and `BlogPost` — which is where
the surface-readiness work starts.

---

## Suggested order

Sized so each step is one reviewable PR, and ordered so nothing collides with
the open branches above.

1. **`Modal` hardening** — focus trap, Escape, scroll lock, portal, labelled
   dialog, semantic tokens. No open PR touches it.
2. **Polymorphic `Button`** — `as` / `href`, so a CTA can be a link. Unblocks
   every marketing composition.
3. **`DataTable` and `Pagination` onto semantic tokens** — finishes the
   `zinc-*` sweep that #33 started and #36 and #40 continue.
4. **Decompose `SaasLandingPage`** into `Hero`, `FeatureGrid`, `PricingTable`,
   `CTA`, `FAQ`, `SiteFooter`; move the YNAB copy into stories. Responsive grids
   in the same pass.
5. **Decompose `AdminDashboardLayout`** into `AppShell`, `AppSidebar`,
   `AppTopbar`, `PageContainer`; collapsible sidebar; use the repo's own
   `DataTable`. Demo content to stories.
6. **Parameterise `BlogPost`** — author object, no hardcoded bio.
7. **Site chrome** — `SiteHeader`, `SiteNav`, `MobileNav`, `SiteFooter`, `Link`,
   shared by blog and marketing.
8. **Export the literal tokens** from `src/theme/levels.ts` (now on `main`), then
   migrate the blog's two palette copies onto them.
9. **Error and empty states**, then the demand-ranked primitives from
   `gap-analysis.md` §5.
