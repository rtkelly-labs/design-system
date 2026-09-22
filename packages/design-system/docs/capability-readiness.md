# Capability readiness — the 1.0 matrix

The canonical answer to *"is the system complete?"* ([#237](https://github.com/rtkelly13/design-system/issues/237)).

A component count cannot answer that question: the package had thirty-odd exports and still no way
to express a checkbox. What a consumer actually asks is **can I build this site without inventing
foundational interaction behaviour?** — so this file has one row per **capability**, not per
component.

[`surface-readiness.md`](./surface-readiness.md) asks a neighbouring question — how many *kinds* of
site the package serves. This file is narrower and is the one 1.0 is measured against.

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

Assessed against `main` after #271 (`Pagination`); *Notify* moved to `ready` with #243, and *Choose
one* with #164 (`Select`'s list painted by the palette, with `native` kept for the platform picker).

| Capability | System answer | Status | Issue |
|---|---|---|---|
| Navigate somewhere | `Button` with `href` (renders `<a>`); inline links styled by `Prose` | `ready` | |
| Primary site navigation | `SiteNav` | `absent` | [#246](https://github.com/rtkelly13/design-system/issues/246) |
| Mobile navigation | `Drawer` + `MobileNav` | `partial` — `Drawer` exists, `MobileNav` does not | [#246](https://github.com/rtkelly13/design-system/issues/246) |
| Context actions | `Menu` | `absent` | [#166](https://github.com/rtkelly13/design-system/issues/166) |
| Switch sections | `Tabs` | `ready` | |
| Explain an icon/control | `Tooltip` | `absent` | [#166](https://github.com/rtkelly13/design-system/issues/166) |
| Show contextual content | `Popover` | `absent` | [#166](https://github.com/rtkelly13/design-system/issues/166) |
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
| Validation | field `error` + `ErrorSummary` | `partial` — per-field errors only, no summary | [#50](https://github.com/rtkelly13/design-system/issues/50) |
| Paginate | `Pagination` — numbered pages, callback or `href` mode | `ready` | |
| Display records | `Table` / `DataTable` | `partial` — sorts and virtualises, semantics incomplete | [#245](https://github.com/rtkelly13/design-system/issues/245) |
| Display metrics | `StatCard` and the chart family | `ready` | |
| Long-form content | `Prose` / `BlogPost` | `partial` — `BlogPost`'s author card is hard-coded | [#250](https://github.com/rtkelly13/design-system/issues/250) |
| Documentation | the docs system (`DocsLayout`, `CodeTabs`, …) | `ready` | |
| Marketing | composable marketing sections | `partial` — `SaasLandingPage` is one monolith | [#248](https://github.com/rtkelly13/design-system/issues/248) |
| Application layout | `AppShell` | `absent` | [#247](https://github.com/rtkelly13/design-system/issues/247) |
| General site layout | `SiteHeader` / `SiteFooter` | `absent` | [#246](https://github.com/rtkelly13/design-system/issues/246) |

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
