# Theme taxonomy — what a Level declares, and what that lets us emit

**Parent:** [`AGENTS.md`](../AGENTS.md) · **Glossary:** [`CONTEXT.md`](../CONTEXT.md) ·
**Tracking:** #77

This is the reference for *which Groups a Level has to declare before a given Target can be
emitted*. It exists because the answer is not obvious: of the eleven plausible Targets, only
one ships today. Two are blocked on a Group nothing has claimed, three on the chrome Group and
the composited Gate it needs, and the cheapest of them all is blocked on nothing but a fan-out
map and the two Gates that would keep it honest.

Terms used here — Level, Group, Role, Hue, Slot, Target, Emitter, Declared, Derived — are
defined in [`CONTEXT.md`](../CONTEXT.md) and used in that sense throughout.

**This file covers one of the two axes.** Everything below varies by Level, which per
[`adr/0004`](./adr/0004-two-axes-level-and-medium.md) means it is colour. Type scale, spacing,
border width, shadow offset, radius, motion and z-index vary by **Medium** — `web`, `video`,
`graphic` — and are not in these tables. The two Targets added in §3 are here because of what
colour they need, not because they carry scales.

---

## 1. Two vocabularies, and which way they point

Every colour in the system is named in one of exactly two ways.

**Roles** name a job. `accent.primary` is "what the eye should reach first"; `intent.danger`
is "this carries bad news"; `syntax.keyword` is "this token is a keyword". A Role is what a
component addresses, and it is the vocabulary the whole system is built on — § *Semantic
Theming* in `AGENTS.md` is the argument for it, and #90, #91 and #96 are the migration onto it.

**Hues** name an appearance. `cyan` is cyan. A Hue is what a Target addresses when it has no
notion of jobs — a terminal has sixteen positions named by colour and no concept of a keyword.

The load-bearing structural decision is **which of the two holds the literal**:

```
palette          ← Hues. Declared literals. The only place a colour originates.
  ↑ referenced by
accent, intent, syntax    ← Roles. Reference a palette entry by name.
```

Not the other way round. If Roles held the literals and Hues were Derived from them, an
Emitter targeting ANSI would have to answer "which of the sixteen is `#22d3ee`?" by
inspecting a hex — ambiguous when two Roles share a value, and lossy when none of them is
close to a named hue. Hue → Role is a declared lookup; Role → Hue is a guess.

The consequence that makes this safe: **a component never addresses a Hue.** `palette.cyan`
in component code would be exactly the defect #96 describes. `LegacyAccent` — the deprecated
`'cyan' | 'pink' | 'yellow' | 'green'` union — is retired in 0.5.0 alongside the Level
collapse, so after that release a hue name has one meaning in this repo and it is this one.

---

## 2. The Groups

| Group | Vocabulary | Origin | Alpha | Gate | Status |
|---|---|---|---|---|---|
| `palette` | **Hue** | Declared | no | contrast ≥ 5.5, separation ΔE ≥ 0.04, once per Hue; Role→Hue agreement | ships |
| `paletteBright` | **Hue** — emphasis | Declared | no | contrast ≥ 4.5 | ships |
| `chart` | **Hue**, ordered | → `palette` | no | pairwise separation across the whole sequence | **does not exist — unowned** |
| `surface` | Role — elevation | Declared | `overlay` only | contrast (as ground); surface pairs reported, never a device | ships |
| `text` | Role — prominence | Declared | no | contrast ≥ 4.5 on every surface | ships |
| `border` | Role — weight | Declared | no | contrast ≥ 3 (`strong`, `default`), ≥ 1.4 (`subtle`) | ships |
| `accent` | Role — hierarchy | → `palette` | no | contrast ≥ 4.5; selection device ≥ 3 on `base` and `raised` | ships |
| `intent` | Role — meaning | → `palette` | no | contrast ≥ 4.5 | ships |
| `syntax` | Role — code token | → `palette` | no | contrast on `base`/`raised`/`sunken`; separation ΔLuma ≥ 20 on measured-adjacent pairs | **#76 — open** |
| `syntaxEmphasis` | none — weight, slant | Declared, sparse | — | none: carries no colour | **#76 — open** |
| `editor` | Role — chrome | Declared `#rrggbbaa` | **yes** | composited contrast; background-pair separation | **#80 — blocked by #78** |
| `shadow` | single value | Declared | no | none — tracks `border.strong` | ships |

Four observations that fall out of the table.

**The Hue Groups are the ones that serve a Target with no notion of jobs.** Everything else is
role-addressable, which is why the Hue vocabulary's value was precise rather than general: it
unlocked terminals and half of JetBrains, and elsewhere it clarified without unblocking. Now
that it ships, what a terminal still lacks is a map, not a colour.

**`chart` is a sequence where every other Group is a record, and that is the whole of it.**
Every other Group is a set of named members answering a fixed question — four accents, three
borders. A chart, a diagram or an ASCII panel needs *N* colours that are mutually
distinguishable, where the caller picks N at use time and the only contract is that any two
members read as different. `adr/0002` names the requirement — "N mutually distinguishable
colours rather than four levels of emphasis" — and nothing has owned it since.

**The arithmetic for it already exists, which makes this the cheapest unowned item in the
file.** `src/theme/palette.test.ts` — "keeps every pair perceptually distinct" — walks the full
N×N of the ten Hues on both Levels at ΔE ≥ 0.04. Two things are missing, and neither is a new
measurement:

1. **An order.** The Hues are a record, so "give me six distinguishable colours" has no answer
   a caller can rely on; a declared sequence turns the guarantee into something addressable.
2. **The truncation invariant.** Pairwise distinctness over ten members does not survive
   arbitrary truncation — a six-colour figure that reads cleanly can collide at four if the
   members are dropped from the wrong end. The existing loop has to hold **at every prefix
   length**, which is the property that makes the sequence's order load-bearing rather than
   cosmetic.

That is why shipping the Hue vocabulary does not on its own retire the forked graphics
palettes: `palette` gives them ten hue names and still does not tell them which six to use in
one figure.

**`editor` is the only Group with meaningful alpha**, and that is why #81 exists. Both current
Gates measure a foreground against an opaque, Declared background. "Keyword over selection
over code well" is neither, so neither Gate can see it — which is how #78's finding went
unnoticed: on the light Level a selection band has **0 sRGB steps** of Headroom, and nothing
in CI can say so.

**`syntaxEmphasis` is the one Group with no colour in it**, and it is not decoration. Light
grounds compress the usable luma band, so weight and slant do work that colour cannot. A
Group that no Gate covers is normally a smell; here it is correct, because there is nothing
arithmetic to check.

---

## 3. What each Target needs

✓ required · ~ partial · – not used

| Target | Medium | palette | chart | surface | text | border | accent | intent | syntax | syntaxEmphasis | editor | Blocked on |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Web / Tailwind** `theme.css` | `web` | – | – | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | – | nothing — ships today |
| **Shiki** | `web` | – | – | ~ `sunken` | ~ `primary` | – | – | – | ✓ | ✓ | – | #76 merging |
| **OpenDesign package** | `web` | – | – | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | nothing — see #117 |
| **Remotion compositions** | `video` | – | – | ✓ | ✓ | ✓ | ✓ | ✓ | ~ via Shiki | ~ via Shiki | – | the `video` Medium — #49, `adr/0004` |
| **SVG / diagram generators** | `graphic` | ✓ | **✓** | ~ ground only | ~ `primary` | ~ `strong` | – | ~ good/warn/bad | – | – | – | **`chart` is unowned** |
| **Mermaid theme** | `graphic` | ✓ | **✓** | ✓ | ✓ | ✓ | ~ | ✓ | – | – | – | **`chart`; ~40 Slots, fan-out unwritten** |
| **VS Code** | — host | – | – | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | #80 → #78 |
| **Zed** | — host | – | – | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | #80 → #78 |
| **Neovim** | — host | – | – | ✓ | ✓ | ✓ | – | ✓ | ✓ | ✓ | ~ flattened | capture fan-out; #80 |
| **Terminal / ANSI** | — host | **✓** | – | ~ `base`, `sunken` | ~ `primary` | – | – | – | – | – | ~ selection only | the ANSI fan-out map, and §5's two Gates |
| **JetBrains** | — host | ✓ | – | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | everything above |

**Shiki is the keystone**, and it is worth being explicit about why: Shiki consumes VS Code
theme JSON directly. The file that themes the editor is the file that highlights the blog, the
docs portal (#74) and the Remotion frames. One Emitter, one file per Level, four consumers.
Nothing else on the list has that property.

**Terminal / ANSI is the cheapest Target still unbuilt**, and it is no longer blocked on a
colour. It needs no chrome, no scopes and no semantic map — sixteen Slots, a foreground, a
background, a cursor and a selection — and `palette` now declares the Hues, with `AnsiHue`
already naming the six it draws on. What is left is a fan-out map and the two Gates in §5 that
keep one honest. Four encodings of it (iTerm2, Windows Terminal, Alacritty, Ghostty) are the
same sixteen values written four ways.

**The three rows below `OpenDesign` are the ones `adr/0002` says were missing**, and adding
them changes what the table says about priority. Two of the four surface classes had no row at
all, so the eight Targets listed were all web or editor — and the estate does not look like
that. `blog/css/tailwind.css` declares 35 `--diagram-*` properties across ten names,
`blog/components/graphics/palette.ts` holds two hue-keyed records, `blog/video/src` hardcodes a
retired ground, `mermaid-toolkit` hand-authors four presets of roughly forty Slots each, and
`shared-utilities/image_drift` has independently reinvented the Role vocabulary in Python under
different names — `ink`, `panel`, `edge`, `sunken`, `accent`, `good`, `warn`, `bad`. Five
forks, and only one of them is the one 0002 names.

**The graphics Targets were blocked twice, and only the first block has lifted.** The Hue
vocabulary gives them hue *names*; it does not tell a figure which six hues to use together,
which is `chart` and which nothing owns. So the hue solve left Terminal / ANSI needing only a
map, and left the graphics rows still needing a Group — and `palette.test.ts` has already paid
for most of it, which is the argument for `chart` being next rather than later.

**The `graphic` and `video` rows also need a Medium**, per `adr/0004`, and the `— host` rows do
not. That column is not decoration: it is what says a Mermaid theme needs a type scale from us
and a VS Code theme must never receive one.

---

## 4. What is Derived, and where the fan-out lives

Nothing in the table above is Derived. Every Group is Declared literals, per rule 4 of
§ *The Theme Ladder*. Everything below is computed from them, is a cache, and is verified
against its source in CI.

| Derived form | From | Fan-out? | Verified by |
|---|---|---|---|
| `--ds-*` custom properties | every Group | no — 1:1 | `tokens:check` |
| `--color-*` Tailwind aliases | Groups, per Family | no — 1:1 | `tokens:check`, `theme.css.test.ts` |
| Per-Level and polarity variants | Level names | no | `theme.css.test.ts` |
| **ANSI 16 map** | `palette` | **yes** — 16 Slots from ~10 Hues | fixture diff, per §5 |
| **TextMate scope map** | `syntax` | **yes** — hundreds of scopes from 8 Roles | scope-coverage gate |
| **Semantic token map** | `syntax` | **yes** — `parameter` → `variable`, etc. | must be emitted *with* TextMate |
| **Treesitter capture map** | `syntax` | **yes** | scope-coverage gate |
| Opaque `editor` values | `editor` + `surface` | no — composite | composited contrast |
| Design Tokens JSON | Role Groups | no | `--check` mode, see #117 |

Two rules govern this half of the taxonomy.

**A fan-out map lives in the Emitter, never in a Level.** It is data, so it is unit-testable;
and keeping it out of the Levels means adding a Target can never change a colour. Widening
`SyntaxRole` to chase a Target's granularity is the failure mode this prevents — there is no
luma range to pay for a ninth Role, least of all on the light Level.

**Targets that cannot take alpha need `editor` flattened, and the flattened value needs
re-gating.** Terminals and Neovim have no alpha. Compositing `editor.selection` against a
known `surface.sunken` produces an opaque value that must *itself* clear contrast against
every `syntax` Role painted on it. This is the same arithmetic as composited contrast, run at
emit time rather than declaration time — so #81's gate covers both, and is a prerequisite for
those two Targets as much as for VS Code.

One trap, stated once because it costs a day to find: **semantic tokens override TextMate
scopes in VS Code, and Shiki only implements TextMate.** Emit `tokenColors` without
`semanticTokenColors` and TypeScript renders one way in the editor and another on the blog,
from the same file — with a screenshot gate that passes, because the screenshot came from
Shiki. Emit both maps from one source, and say so in the Emitter's header.

---

## 5. Gate coverage, and the holes

| Gate | Measures | Covers | Exists |
|---|---|---|---|
| `check:contrast` | foreground vs Declared ground | `text`, `border`, `accent`, `intent`, `syntax` | yes |
| `check:separation` | foreground vs adjacent foreground, **OKLab ΔE** | `syntax` measured-adjacent pairs | #76 |
| `auditSelectionDevices` | accent fill / edge vs two grounds | `accent` | yes |
| **composited contrast** | foreground vs translucent-over-ground | `editor`, flattened `editor` | **#81 — no** |
| **background-pair separation** | ground vs ground, ΔLuma | `editor` diff and merge bands | **#81 — no** |
| **pairwise separation** | every member against every other member, ΔE ≥ 0.04 | `palette`'s ten Hues, both Levels | yes — `palette.test.ts` |
| **prefix separation** | the same, at every truncation of an ordered sequence | `chart` | **no** |
| **slot coverage** | Slots that map to nothing | every fan-out map | **no** |
| **fixture diff** | emitted Slots vs a committed expectation | ANSI 16, and later scope maps | **no** |

Slot coverage and the fixture diff are the two a purely Derived pipeline needs and does not
have. A fan-out map that is wrong emits confidently: an inverted ANSI map, or a scope that
resolves to no Role, produces a valid file full of wrong colours. `check:visual-coverage`
already does this shape of bookkeeping for stories against snapshots; slot coverage is the same
idea aimed at Slots, and the fixture diff is `api/index.d.ts`'s trick — commit the emitted
shape, and make the diff the review.

Two further notes on this table, both from `adr/0004`.

**The pairwise loop is already written; the prefix property is not.** `palette.test.ts` walks
the full N×N at ΔE ≥ 0.04, so `chart` inherits its measurement rather than needing a new one.
What it does not inherit is truncation: any two members of a figure can end up adjacent, and a
set that separates at ten can collide at four when members are dropped from the wrong end. So
the Gate is the same arithmetic run at every prefix length, which is what makes the sequence's
order load-bearing. Note also where that loop lives — a Vitest file rather than
`check:contrast` — so the palette's separation does not appear in the contrast report that
every other colour rule is read from.

**The floors in this table are indexed by Role, and they should also be indexed by Medium.**
`MINIMUM_RATIO` in `src/theme/contrast.ts` now separates a Role's 4.5:1 from a Hue's 5.5:1 and
a bright variant's 4.5:1, which is what retired #78. What it still holds is *one set of numbers
for every surface the system emits to*: a projected 1080p frame, a compression-damaged video
and an unantialiased terminal cell do not read against the browser's floor. Nothing here needs
a new Gate — it needs the number it reads indexed twice, per `adr/0004`.

---

## 6. Sequence this implies

1. **~~#79 — `palette`~~ — landed in #123**, along with the two-Level collapse, the `fixed`
   Group, the Role→Hue agreement audit and the Design Tokens export. `chart` is what that solve
   did not cover, and it is now the cheapest item on this list: an order over Hues that already
   clear pairwise ΔE, plus the prefix invariant of §5. The five forked graphics palettes have
   nowhere to migrate to until it exists.
2. **~~#78 — re-solve the light Level~~ — retired by that same solve.** `sketch` is authored
   against a 5.5:1 Hue floor rather than patched up to 4.5:1, which is what #78 asked for. The
   Headroom finding behind it is answered at the Hue layer; `editor`'s translucent bands are
   still item 3's problem.
3. **#81 — the composited gate**, before `editor` rather than after, so twelve translucent
   values per Level are never a palette someone eyeballed.
4. **#80 — `editor`.** The largest single Group, and the one that decides whether the VS Code
   theme looks finished or looks generated.
5. **#84 — `build-themes.mjs`**, emitting VS Code JSON, which is Shiki's input too. Add the
   slot-coverage and fixture-diff gates here, with the maps.
6. **Terminals, then Neovim, then Zed.** A day each once `palette` and the flattening exist.
   JetBrains last, and only if it is actually wanted.

The ordering is not by appeal. #79 came first because it was the only item that unblocked a
Target by itself, and #78 came with it because solving the palette at 5.5:1 retired it.

**The Medium axis runs alongside this list, not inside it.** `adr/0004` is a decision rather
than an implementation, and #49 is the implementation of it; neither blocks nor is blocked by
`palette`. It does have one ordering constraint of its own: it gets more expensive after #49
starts, because a spacing scale authored on the wrong axis has to be re-authored rather than
extended. So it wants settling before the first non-colour token is written, and nothing about
it needs to wait for a Level to be re-solved.
