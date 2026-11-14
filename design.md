# design.md — rtkelly labs design judgment & agent contract

> **Mechanics & Stylesheet:** Implemented in `@rtkelly-labs/design-system/styles.css` and `theme.css`.  
> **Machine-Readable Tokens:** [`machine.design.md`](./machine.design.md) & `packages/design-system/tokens/`.  
> **Guardrails & Agent Steering:** [`docs/guardrails.md`](./docs/guardrails.md).  
> **Storybook:** Served under `Guides/design.md`.

This document is the visual contract and design judgment guide for `@rtkelly-labs`. It teaches autonomous coding agents (Claude Code, Cursor, Codex, Google Stitch) how to think like the brand and construct on-brand interfaces across the product estate (`oxbow`, `rig`, `Diffra`, `docs`, `blog`).

---

## 1. Product Feel & Identity

The aesthetic is **Brutalist Neon Terminal** (`midnight` dark default) meets **Architectural Drafting Table** (`sketch` warm paper light).

* **Information Density:** High. Favor compact data presentations, technical grids, and dense command surfaces over sprawling whitespace.
* **Structural Edges:** Edges are razor-sharp and drawn with high contrast. Never imply boundaries with background gradients; draw them with 1px or 2px solid rules.
* **Tone:** Terse, technical, operational. Controls state exact verbs (`EXECUTE`, `DIFF`, `DISPATCH`). Section headers are plain Space Grotesk. Monospace and brackets are the loudest marks the brand has, so they are spent rarely and big (see the type budget in §4).
* **Metaphor:** The interface should read like a CRT debugger cockpit or a mechanical drafting blueprint, not a modern consumer SaaS app.

---

## 2. Layout & Composition Hierarchy

When constructing a screen or report:

1. **Lead with Context & Primary Metrics:**
   * Ground views with a persistent header or high-level status strip. The app or page title may carry the page's one bracket (`[ RIG ]`); status values do not.
   * Key indicators use `StatCard` or dense metadata grids rather than oversized hero illustrations.
2. **Evidence & Data Presentation:**
   * Tabular data and diffs should span the full available width of their container.
   * Table headers and cells are set in `Inter` with tabular numerals (`tabular-nums`). Mono only for real code, paths, hashes and commands inside a cell.
   * Diffs are presented as structured multi-pane comparisons, not wall-of-text dumps.
3. **Hierarchy of Grounds:**
   * Page canvas sits on `surface.base`.
   * Grouped content and interactive cards lift into `surface.raised`.
   * Form inputs, code blocks, and data wells are recessed into `surface.sunken`.

---

## 3. Two Independent Themes (The Theme Ladder)

Do not treat themes as an inverted "light and dark" switch. Neither theme is derived from the other:

* **`midnight` (Dark Default):** Neon accents on deep slate/blue-black ground (`#0a0a1a`). High-chroma technical accents (Teal, Cyan, Pink).
* **`sketch` (Warm Paper Light):** Deep graphite ink on warm architectural drafting paper (`#f5f3ec`). Pen-colored accents (India ink, 2H pencil, technical ochre).

---

## 4. Component Construction Rules

* **Containers & Cards:** Strictly zero border-radius (`rounded-none`). Load-bearing 2px solid borders. Brutalist hard-offset box shadows with **0px blur radius** (`2px 2px 0 0`, `4px 4px 0 0`). Never use diffuse, blurred drop shadows.
* **Buttons:** Solid accent fill or high-contrast 2px border, `Inter` or the display face, 0px radius. State what happens directly (`BUILD`, `REVERT`).
* **Section Markers & Badges:** Plain text. Brackets are a budget of one or two per page: the page or app title, and at most the one primary action. Never section headings, table headers, tags, badges or nav items.
* **Typography — the type budget:**
  * Body: `Inter`, 1.5 line height. Everything people read or scan: running text, labels, table headers and cells, captions, buttons, nav. Reach for it first.
  * Display & Headers: `Space Grotesk`, heavy, with subtle letter-spacing and bottom border underlines. Uppercase only at title scale.
  * Mono: `IBM Plex Mono`, only large and bold (stat values, a hero label, step numbers) or for real code. Never captions, kickers, table cells or anything small and dense — at caption size it is the hardest text on the screen to read.
  * Pixel: `VT323`, a single decorative mark on a neon surface, never anything that has to be read.
  * When a screen feels too plain, the fix is the form — a heavier border, an offset shadow in the section's accent, a sunken well — not another bracket or mono label.

---

## 5. Strict Do's and Don'ts (Negative Guardrails)

* ❌ **DON'T** use border-radius (`rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-full`). All shapes must be razor-sharp rectangles.
* ❌ **DON'T** use soft, blurry drop shadows (`shadow-md`, `shadow-lg`, blurred rgba glows).
* ❌ **DON'T** use pastel gradients, mesh backgrounds, or multi-color linear gradient buttons.
* ❌ **DON'T** default to Inter-on-white with indigo accents (the standard generic SaaS template).
* ❌ **DON'T** use emoji as section markers or bullet icons. Use ASCII glyphs (`>`, `✓`, `•`) or the form itself.
* ❌ **DON'T** bracket every heading or set dashboards in small mono labels. A bracket on every heading is noise, and the page reads as a costume.
* ❌ **DON'T** hardcode arbitrary Tailwind color classes (`bg-blue-500`, `text-purple-400`). Use semantic role tokens (`bg-surface-raised`, `text-accent-primary`).
* ✅ **DO** verify designs in both `midnight` (neon on dark slate) and `sketch` (ink on warm paper).
* ✅ **DO** keep information density compact, structured, and legible for developer workflows.
* ✅ **DO** ensure high contrast: all text-to-ground pairs must clear WCAG AA (4.5:1) floor minimums.
* ❌ **DON'T** animate with glides, fades, shimmer or easing on a loop. A loop steps, like a cursor.
* ❌ **DON'T** put a spinner on every row. One live mark per region; the rows hold still.
* ✅ **DO** give agent state a word and a shape before a colour: `running`, `done`, `needs you`, `failed`.

---

## 6. Motion — the form, moving

Every form rule above has a counterpart in time. Full rules: `DESIGN.md` §8.

* **Steps, not glides.** A loop advances in discrete steps. An eased or continuous loop is the soft shadow of time.
* **The moving part is a drawn mark**: a lit cell, an inked side, a hatched quarter. No gradient sweep, shimmer or cross-fade.
* **One live mark per region.** A group header, a working line, a pending button. Rows show the still first frame, and their elapsed time does the moving.
* **Motion moves the mark, never the layout.** Fixed box; nothing beside it shifts.
* **One clock, two drawings.** Box, steps and period are the Medium's and identical on both themes; only the drawing differs (`docs/adr/0007`). The quadrant is the reference mark: a lit cell on `midnight`, a pen-hatched quarter over a pencil square on `sketch`, one step per `considered`.
* **Time is declared.** Periods are whole multiples of `considered`; components take `now` as a prop and never read the clock.
* **Reduced motion slows an indicator to a third, never stops it.** Decorative motion is removed.
* **Text is swapped, never animated.** No typewriter, no shimmer.

---

## 7. Agent surfaces

Agent activity (runs, tool calls, sub-agents, decisions) is a first-class surface. Full rules: `DESIGN.md` §9.

* **One run, one model, many views.** Waterfall, run tree, tool calls and board all read the span tree in `lib/trace.ts`.
* **State:** running is the quadrant and a hatched bar; done is `✓` and a solid bar; waiting is `!`, an outlined bar and `needs you`; failed is `✕` and `intent.danger`. Always with the word.
* **The emphasised count is what needs a person.** Everything else is plain.
* **`duration · cost` together**, tabular. Tool names and model ids in mono; their summaries in Inter.
* **Payloads behind a disclosure** in a `surface.sunken` well, capped with "Show all (N lines)", never faded.
* **Bars by outcome**, never by service or agent.
