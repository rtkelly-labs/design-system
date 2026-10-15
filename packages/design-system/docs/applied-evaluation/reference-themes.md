# Reference themes: what pre-exists, and what building one requires

Date 2026-10-15 · package 0.14.0 · analysis only.

Pink Ink is the owner's foundational reference for the brand —
<https://marketplace.visualstudio.com/items?itemName=davidpine-dev.pink-ink>, source
<https://github.com/IEvangelist/pink-ink> (MIT, David Pine), linked from the vault's
`Resources/Design.md`. This file records what reading it taught us — the shape a pre-existing theme
has, and the requirements that follow for building one — **in place of copying the theme files into
this repository.** The theme is not vendored here; it is cited by URL, and every figure below was
measured from the published `themes/*.json` on 2026-10-15.

The vendoring was the wrong artefact. Pink Ink's value to this system is its *structure*, not its
pixels: it is two 2,700-line files that are a worked example of the problem a `syntax` and an
`editor` Group exist to solve, and it is as legible at that size on GitHub as in this tree. What
follows is the understanding; the theme stays upstream.

---

## 1. What a pre-existing theme actually declares

Measured from `themes/pink-ink-dark-color-theme.json` and `themes/pink-ink-light-color-theme.json`:

| | dark | light |
|---|---|---|
| `colors` keys | 953 | 953 |
| Distinct values among them | 188 | 180 |
| `tokenColors` rules | 150 | 150 |
| TextMate scope selectors across those rules | 496 (461 distinct) | 496 |
| `semanticTokenColors` selectors | 89 | 89 |
| Distinct syntax foregrounds | 23 | 23 |
| Rules carrying a `fontStyle` | 3 | 3 |

Three things fall out of that table, and each one is a requirement this system has already written
down somewhere.

**The two files carry identical key sets and differ only in values** — one theme shape, authored
twice. That is this system's own "independently authored, neither derived from the other" position
(`adr/0003`) arrived at from the other direction: Pink Ink does not generate light from dark either,
and the pair stays honest precisely because the key sets never diverge to hide it.

**`colors` spans 211 namespaces, and the editing surface is a minority of them.** The largest are
`editor` (42), `testing` (34), `symbolIcon` (33), `terminal` (30), `tab` (28), `statusBarItem` (25),
`list` (24), `editorOverviewRuler` (23), `settings` and `chat` (21 each). A VS Code theme is not a
syntax palette with a background; it is a whole application's chrome. This system names ~12 values
for that chrome, as the `editor` Group.

**The syntax layer is a fan-out, and almost all of it is colour.** 150 rules colour 496 TextMate
selectors and 89 semantic selectors from about 23 foregrounds — with per-language overrides
(`:csharp`, `:python`, `:rust`, `:go`, `:powershell`) that no single role vocabulary would ask for.
Only 3 of the 150 rules reach for `fontStyle`. The system's split — eight-ish `syntax` roles, the
scope map in the Emitter, non-colour channels spelled out per role — is the same shape made small.

---

## 2. The editor model it demonstrates

The structure round 5's code-renderer board was built on, read off the published theme:

- **Selection.** Brand pink at 25% alpha, and `selectionForeground` forces every token to one ink. The
  selection is one region, not a patchwork of tokens.
- **Find.** The current match has a near-ground fill, a lilac border and gold text. Other matches get a
  keyword-violet border only. Matches are drawn, not filled.
- **Current line.** A barely-there fill with a 1px border, distinct from the selection.
- **Bracket match.** A violet border, a 10% wash and a violet glyph; bracket-pair and indent-guide
  colour rotate through six accents.
- **Tokens.** Keywords violet, operators pink, functions cyan, strings peach, numbers and types gold,
  comments muted plum. No italics.
- **Errors.** A separate red (`#FF6675`), never the brand pink or the keyword violet.
- **Line numbers.** Dim plum; the active line number is brand pink.
- **Diff.** Teal added, rose removed, at 15–20%, with text borders.
- **Accessibility.** 4.5:1 for text and 3:1 for essential indicators; translucent colours are
  composited over their real layers before measuring; decorative guides are exempt
  (`ACCESSIBILITY.md` in the source repo).

This is the model `decisions.md` R6 flattened into roles: the board kept the *devices* — one
selection region with a forced ink, drawn find matches, a hairline current line, a bracketed pair —
and discarded the hue assignments in favour of this system's role tokens.

---

## 3. Pre-existing themes *in this system*

Three theme artefacts already exist here, and a fourth does not:

- **The two Levels**, `midnight` and `sketch`, declared once in `src/theme/levels.ts`; everything else
  derives from it (`docs/theming.md`).
- **The emitted web theme**, `src/theme.css` plus the Tailwind aliases, and the DTCG export in
  `tokens/*.tokens.json`.
- **The terminal encodings**, 16 ANSI slots across four formats and two levels
  (`pnpm ansi:check`).
- **No editor theme yet.** There is no `syntax` or `editor` Group, so there is no VS Code JSON, no
  Shiki input, no Zed or JetBrains theme. This is the gap Pink Ink was consulted about, and the
  subject of § *Sequence* in [`theme-taxonomy.md`](../theme-taxonomy.md).

---

## 4. Requirements for building one

Numbered so they can be cited; each is already backed by a document or an open issue.

1. **A theme declares literals; nothing is derived.** Every colour is a literal in `levels.ts`, and a
   token varies by Level or by Medium, never both (`adr/0004`). No `color-mix()` on a Level colour:
   percentages tuned against near-black do not hold at the light end.
2. **Address by role, never by hue.** A component names `text-intent-danger`, not `cyan`; a Target
   with no notion of jobs names a `palette` Hue instead (`adr/0001`).
3. **Declare the Groups before the Target.** Of the eleven Groups, `palette` now ships; `syntax`
   (#148) and `editor` (#80) are the two a code theme needs and neither exists. A theme cannot be
   authored ahead of the vocabulary it addresses.
4. **A syntax Group of about eight roles, plus non-colour channels.** Pink Ink spends 23 foregrounds;
   this system has four distinct hues per Level, and on `sketch` every hue is equal-luma, so weight
   and slant have to carry what colour cannot (`ED-F06`, `ED-F01`).
5. **`editor` is the only Group with meaningful alpha, and it is authored as `#rrggbbaa` literals.**
   Selection, find, current-line, bracket and diff bands are ~12 values per Level. They are not
   eyeballed: the composited-contrast and background-pair gates (#81) come *before* the Group, not
   after (`theme-taxonomy.md` §5).
6. **A fan-out map lives in the Emitter, never in a Level.** Pink Ink's 496 TextMate selectors and 89
   semantic selectors are a map from a handful of intents onto hundreds of scopes. Widening
   `SyntaxRole` to chase a Target's granularity is the failure that rule prevents.
7. **Emit TextMate and semantic tokens from one source, together.** Shiki implements only TextMate and
   VS Code prefers `semanticTokenColors`; emit one and the blog and the editor disagree from the same
   file, with a screenshot gate that passes because Shiki drew it (`theme-taxonomy.md` §4).
8. **Shiki is the keystone Target.** It consumes VS Code theme JSON directly, so one Emitter themes
   the editor, the blog, the docs portal and the Remotion frames — one file per Level, four consumers.
   Nothing else on the Target list has that property.
9. **Gates first, and two of them do not exist.** `check:contrast`, the ΔE separation loop and
   `auditSelectionDevices` ship; composited contrast, background-pair separation, slot coverage and
   the fixture diff do not, and the first two are prerequisites for `editor` (#81).
10. **Targets that cannot take alpha need `editor` flattened and the flattened value re-gated.**
    Terminals and Neovim have no alpha; compositing against a known ground produces an opaque value
    that must itself clear contrast against every syntax role painted on it.
11. **A pre-existing theme is a reference, not a dependency.** Pink Ink is MIT and *could* be
    vendored; the position here is that it should not be. The tree's own rule is that third-party
    reference material stays out of it and is catalogued instead
    ([`reference-material.md`](../reference-material.md)). Read it upstream, cite it, and keep the
    measurement — not the files.

---

## 5. What this does not settle

The IDE theme exercise itself — VS Code, terminals including Windows Terminal, Zed, JetBrains — is
listed as a follow-up in [`pr-plan.md`](./pr-plan.md), and its prerequisites are the Groups and gates
above. Nothing here reorders that work; it records the reading it rests on.
