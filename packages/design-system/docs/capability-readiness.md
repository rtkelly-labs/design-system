# Capability readiness — the 1.0 matrix

The canonical answer to *"is the system complete?"* ([#237](https://github.com/rtkelly13/design-system/issues/237)).

A component count cannot answer that question: the package had thirty-odd exports and still no way
to express a checkbox. What a consumer actually asks is **can I build this site without inventing
foundational interaction behaviour?** — so this file has one row per **capability**, not per
component.

This is the current source of truth for readiness, and the file 1.0 is measured against.
[`surface-readiness.md`](./surface-readiness.md) is the earlier, surface-by-surface assessment. It is
kept as history, apart from its status-tag table, which is still live.

## The 1.0 criterion

**No foundational capability is `absent`.**

Every row below is foundational. `partial` rows do not block 1.0 by themselves, but each names the
issue that finishes it, and none may be quietly left `partial` without one.

## Statuses

Three, and only three. A fourth would mean "nearly", and "nearly" is what this file exists to stop.

| Status | Means |
|---|---|
| `ready` | A consumer composes existing exports. No local CSS, no invented behaviour. |
| `partial` | Exists, but is missing something a normal site needs. **Must name an open issue.** |
| `absent` | No system answer. **Must name an open issue.** |

A row moves in the same PR that moves it — the PR that lands `Tooltip` edits the *Explain an
icon/control* row. A row is `ready` only against what is on `main`, never against an open branch.

## The matrix

Assessed against `main` after #271 (`Pagination`); *Notify* moved to `ready` with #243, *Display
records* with #245, *Context actions*, *Explain an icon/control* and *Show contextual content*
with #166, *Application layout* with #247, *Primary site navigation*, *Mobile
navigation* and *General site layout* with #246, *Long-form content* with #250, *Validation* with
#50, *Marketing* with #248, and *Choose one* with #164 (`Select`'s list painted by the palette, with
`native` kept for the platform picker).

| Capability | System answer | Status | Issue |
|---|---|---|---|
| Navigate somewhere | `Button` with `href` (renders `<a>`); inline links styled by `Prose` | `ready` | |
| Primary site navigation | `SiteNav` + `SiteNavItem` — groups open in `Menu`; the current page comes from the consumer's route via `LinkProvider` | `ready` | |
| Mobile navigation | `MobileNav` — the same `SiteNavItem`s in a left `Drawer` | `ready` | |
| Context actions | `Menu` — items, a radio group, a separator | `ready` | |
| Switch sections | `Tabs` | `ready` | |
| Explain an icon/control | `Tooltip` | `ready` | |
| Show contextual content | `Popover` | `ready` | |
| Enter text | `Input` / `TextArea` | `ready` | |
| Choose one | `Select` / `RadioGroup` | `ready` | |
| Choose many | `Checkbox` | `ready` | |
| Toggle state | `Switch` | `ready` | |
| Group fields | `Fieldset` + `Legend` | `ready` | |
| Submit an action | `Button` | `ready` | |
| Confirm a destructive action | `AlertDialog` | `ready` | |
| Display a modal workflow | `Modal` | `ready` | |
| Show an off-canvas panel | `Drawer` | `ready` | |
| Notify | `NoteBlock` + `ToastProvider` / `useToast` | `ready` | |
| Loading | `Spinner` / `Skeleton` | `ready` | |
| Progress | `Progress` | `ready` | |
| No content | `EmptyState` | `ready` | |
| Validation | field `error` + `ErrorSummary` — links to each invalid field, focus moves to the summary when it appears | `ready` | |
| Paginate | `Pagination` — numbered pages, callback or `href` mode | `ready` | |
| Display records | `Table` / `DataTable` — sorting, virtualisation, `caption`, row headers | `ready` | |
| Display metrics | `StatCard` and the chart family | `ready` | |
| Long-form content | `Prose` / `BlogPost` — the author card from a `BlogAuthor` (name, initials, `Avatar`, link, description) or the `authorCard` slot | `ready` | |
| Documentation | the docs system (`DocsLayout`, `CodeTabs`, …) | `ready` | |
| Marketing | `Hero`, `FeatureGrid` + `Feature`, `PricingGrid` + `PricingTier`, `CTASection` — `SaasLandingPage` is one composition of them | `ready` | |
| Application layout | `AppShell` + `AppSidebar` / `AppSidebarNav` / `AppTopbar` / `AppMain` — sidebar off-canvas in a `Drawer` below desktop width | `ready` | |
| General site layout | `SiteHeader` (skip link, breakpoint swap to `MobileNav`) / `SiteFooter` | `ready` | |

Two rows are additions to the table #237 proposed, each because a landed component made the
capability separable: *Group fields* (the half of #239 that is not radio-specific — a set of
checkboxes or an address block wants the same group label, description and error) and *Show an
off-canvas panel* (`Drawer`, #241, which *Mobile navigation* composes but does not exhaust).

## What is deliberately not a row

A capability earns a row when a consumer reaches for it, not because another design system has a
component for it.

- **Domain components** — `ProductCard`, `Calendar`, `Player` — are not rows. They compose
  capabilities; they are not one.
- **Not yet asked for:** date picker, carousel, file upload, OTP input, tree view, resizable panels,
  menubar, context menu, rich-text controls.

These are **absent from the table, not marked `absent` in it**. The difference matters: an `absent`
row blocks 1.0; a missing row is a statement that nobody needs it yet. Adding one is a proposal,
made the way any row change is — in a PR, with the consumer that reached for it.
