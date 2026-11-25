---
status: accepted
---

# Type is addressed by step, and consumers are held to it

Sits under [`0004`](./0004-two-axes-level-and-medium.md), which put the type scale on the Medium
axis, and beside [`0001`](./0001-hues-declared-below-roles.md), whose rule for colour this
repeats for type: address it by its job, never by its value.

## Context

The `web` Medium has declared a type scale since #49: `caption`, `body`, `lead`, `title`,
`display`, `hero`, with leading, and the weights `regular`, `bold` and `black`. Almost nothing
uses it. At the time of writing, components here say `text-xs` 191 times and `text-sm` 125
times, against 37 uses of `text-caption`. Tailwind's default scale is still open beside ours, so
nothing stops a component reaching for it, and the default was easier to remember.

Consumers drifted further. rig's triage UI, the densest surface in the estate, wrote its own
scale in raw CSS: sixteen sizes from 9px to 30px, six weights including 550 and 650, and most
of its small text in IBM Plex Mono at 10px, which `DESIGN.md` §7 forbids. rig had a token gate,
but it was a hand-copied subset of this repository's colour rules and checked no type at all.

Two causes, and each needs its own fix.

1. **The scale could not say what an app needs.** Its smallest step after `caption` (12px) was
   `body` (16px), and its weights jumped from 400 to 700. Dense UI text lives at 14px, and an
   unread row or a table header needs a weight that does not shout. `text-sm` and
   `font-semibold` filled those gaps because nothing of ours did.
2. **Nothing held anyone to it.** The colour rules are published (`TOKEN_RULES`) and run at
   budget zero over every report. There was no equivalent for type, here or downstream.

## Decision

**Type is addressed by a step of the Medium's scale and a weight of the Medium's weights. The
rules that say so are published, this repository holds itself to them as a ratchet, and a
consumer runs the published rules at budget zero.**

- **Two steps and one weight are added.** `ui` (0.875rem / 1.45) for rows, controls and table
  cells; `heading` (1.25rem / 1.3) for a section heading inside an app; `semibold` (600). Every
  Medium answers them, as 0004 requires. Their `web` sizes are the ones `text-sm`, `text-xl`
  and `font-semibold` already render. Adding them changes no pixel. Migrating a site onto them
  changes its leading slightly (Tailwind's is about 1.43 and 1.4), so a migration re-baselines
  what it touches.
- **`caption` stays the floor.** Nothing is set smaller than 12px. A surface that wants smaller
  text wants less text.
- **The face budget in `DESIGN.md` §7 is unchanged and is part of the rule.** Mono is for large
  marks and for real code, never for small dense text.
- **The rules are published, like the colour rules.** A consumer imports them from the package
  and runs them over its own sources. It does not copy them. A copy is a rule that silently
  stops matching the original, which is how rig's gate came to check no type at all.
- **This repository holds itself to the rules as a ratchet** (`check:type`), because its
  ~460 existing sites are debt. The budget only goes down.
- **Tailwind's default scale closes when that budget reaches zero.** The `@theme` block then
  resets `--text-*` and `--font-weight-*` before declaring ours, so `text-sm` stops existing
  rather than merely being discouraged. That is the breaking step, and it is announced in the
  changelog for the release that takes it.

## Consequences

- A new step needs this ADR's reasoning, not a one-off size. The question to answer is which
  job no existing step can do.
- A consumer taking a version of this package can fail its own CI on type it wrote months ago.
  That is the point: the rules travel with the tokens, so a bump is how a consumer learns of a
  new one.
- An exception is written at the site, with its reason, where the linter lists it. A consumer
  never edits or disables the published rules.
