# The first screen

Pages are reviewed on a phone, so a page is judged at **390 × 844**: what is above that fold is
what the reader sees before deciding whether to scroll at all.

## The rule

The first screen names three things, in this order, and nothing else competes with them:

1. **The subject** — what this page is about: its title and identity.
2. **Its state** — the one sentence a reader came for: can it merge, did it pass, is it healthy.
   A headline in the intent role for that state, then the reason in plain words.
3. **Whether action is needed** — counts, worst first, in their status tones: `1 warn · 1 needs
   review · 2 pass`. A count is a promise that the detail is below; it is not the detail.

Everything else goes below the fold and is drawn quieter than it would be on its own:

- **Fold what is fine.** Passing checks, unchanged rows and files without comments collapse
  behind a `<details>` that says how many it holds. Only what needs attention is open.
- **Rules, not boxes.** Below the fold a comment or note is a rule beside the text, not a framed
  panel. The heavy objects a screen may carry (see [edge-hierarchy.md](edge-hierarchy.md)) are
  spent above the fold, on the state.
- **Say a thing once.** If the headline says "Cannot merge yet", the reason says who or what is
  blocking, not "so it cannot merge yet" again.

## Colour says direction, size says how loud

A change with a declared direction (`higher-is-better` or `lower-is-better`) is coloured by which
way it went: toward the preferred direction is `intent-success`, away from it `intent-danger`.
Its relative size decides how loudly: under the noise band (2% by default) it stays uncoloured
and says "within noise"; at or over the major band (10%) it is bold with a rule beside it. A
change with no declared direction is only a change and keeps the `delta` roles. `deltaTrend`,
`deltaSignificance` and `trendTone` in `DeltaValue` are the one implementation; `ChangeSummary`
and the review report's measurement tables both use them.

## Applied

`SaaS/PullRequest` is the first page held to this. At 390 × 844 the first screen now ends on
the merge status panel (headline, reason, checks and reviews tallied worst first) and the
comparison verdict; before, it ended on the verdict band and the merge state sat in the side
rail, below the whole conversation, more than a screen down. Census at 1280 px, before → after: frames 28 → 25, ink 16.2‰ → 13.9‰,
heavy panels 1 → 1. Heavy edge share rose 0.113 → 0.148: the status panel's coloured rule is
the one heavy edge the page is meant to have.
