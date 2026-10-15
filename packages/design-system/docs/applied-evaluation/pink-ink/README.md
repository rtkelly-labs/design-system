# Pink Ink: the reference theme

The owner's foundational reference for the brand: <https://marketplace.visualstudio.com/items?itemName=davidpine-dev.pink-ink>,
source <https://github.com/IEvangelist/pink-ink> (MIT, David Pine). Linked from the owner's vault, `Resources/Design.md`.
The theme files here are copied verbatim from the repo's `themes/` folder on 2026-10-15, as the round 5 reference.

The editor model it uses, which the round 5 code-renderer board builds on:

- **Selection.** Brand pink at 25% alpha, and `selectionForeground` forces every token to one ink. The
  selection is one region, not a patchwork of tokens.
- **Find.** The current match has a near-ground fill, a lilac border and gold text. Other matches get a
  keyword-violet border only. Matches are drawn, not filled.
- **Current line.** A barely-there fill with a 1px border. It is distinct from the selection.
- **Bracket match.** A violet border, a 10% wash and a violet glyph. Bracket-pair and indent-guide colour
  rotate through six accents.
- **Tokens.** Keywords violet, operators pink, functions cyan, strings peach, numbers and types gold,
  comments muted plum. No italics.
- **Errors.** A separate red (`#FF6675`), never the brand pink or the keyword violet.
- **Line numbers.** Dim plum; the active line number is brand pink.
- **Diff.** Teal for added, rose for removed, at 15–20%, with text borders.
- **Accessibility.** 4.5:1 for all text and 3:1 for essential indicators. Transparent colours are composited
  over their real layers before measuring. Decorative guides are exempt. See `ACCESSIBILITY.md` in the repo.
