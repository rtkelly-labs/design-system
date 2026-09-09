---
status: proposed
---

# Hues are declared below Roles, not derived from them

The system's whole thesis is that a colour is addressed by its job and not its appearance —
`accent.primary`, not `cyan` — and #90, #91 and #96 are the migration onto that. But Targets
exist that have no notion of jobs: a terminal has sixteen positions named by colour, and no
concept of a keyword. So we are adding a Hue vocabulary (#79) *underneath* the Role
vocabulary: `palette` holds the Declared literals, and `accent`, `intent` and `syntax`
reference its entries by name. Components address only Roles, and never a Hue.

## Considered options

**Roles only.** Keep the current shape and accept that terminals, ANSI schemes and roughly
half of a JetBrains scheme cannot be emitted at all. Rejected because it forecloses a Target
that is otherwise the cheapest one on the list — sixteen Slots, a foreground, a background, a
cursor, no chrome and no scopes.

**Hues only.** Let components address `cyan` directly, as they did before the semantic layer.
Rejected: this is the state #90/#91/#96 are undoing, and it is what makes a retheme a
find-and-replace instead of a token change.

**Both, independently declared.** Each Group holds its own literals; the ANSI map gets its own
sixteen values per Level. Rejected because the two sets then drift silently, and there is no
arithmetic that can catch a `palette.cyan` that no longer matches the `accent.primary` it is
supposed to be.

**Roles hold the literals, Hues Derived from them.** Rejected on a concrete failure: an
Emitter targeting ANSI would have to answer "which of the sixteen is `#22d3ee`?" by inspecting
a hex. That is ambiguous when two Roles share a value, and lossy when no Role sits near a
named hue — the system has no violet on any Level today, so `magenta` would resolve to
whatever happened to be closest. Hue → Role is a declared lookup; Role → Hue is a guess.

## Consequences

- **`LegacyAccent` is retired in 0.5.0**, alongside the Level collapse, rather than being
  deprecated for another minor. Its members are `'cyan' | 'pink' | 'yellow' | 'green'` — the
  same words `palette` is about to claim. Leaving both alive would mean a hue name with two
  meanings in one repo, one foundational and one deprecated, which is how a component ends up
  addressing the wrong one.
- **A Hue in component code is a defect**, of exactly the kind #96 describes. `token-rules.mjs`
  already reports colour literals at the site that wrote them; it is the natural place for the
  rule, and the rule is what keeps this decision from decaying into the previous state.
- **Slot maps are Derived, and their fan-out lives in the Emitter.** Sixteen ANSI Slots resolve
  from fewer Hues by a map that is data, so adding a Target can never change a colour. This
  needs two Gates the repo does not have — slot coverage, and a committed fixture diff — because
  a wrong fan-out emits confidently rather than failing.
- **`palette` must be gated once per Hue** rather than once per Role that uses it, which makes
  `check:separation` cheaper to reason about: separate the palette, not each of its consumers.
