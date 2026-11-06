# Evidence on a pull request

**Siblings:** [`ci.md`](./ci.md) (the screenshot walkthrough this extends) ·
[`visual-regression.md`](./visual-regression.md) (the gate, which is a different job) ·
`remotion-evaluation.md` (the groundwork, on `claude/design-system-remotion-videos-bcdy4i`)

A pull request that changes what something looks like should carry a short video
showing the change working, **bespoke to that change**, on the PR itself.

Screenshots already exist: `pnpm walkthrough` captures every story on every level
and uploads a 400-shot report nobody opens. That answers *what does it look
like*. It does not answer *does it work*, which is the question a reviewer
actually has and the only one a moving picture can answer.

## What a piece of evidence is

Three parts, and all three are needed for it to explain rather than merely show:

1. **The real thing running** — a Playwright recording of the affected story
   being driven through its states in a real browser.
2. **Before and after** — the same script against the PR head and against its
   merge base, so the change is visible as a difference rather than asserted.
3. **Captions naming what is being demonstrated** — derived from the diff, not
   written by hand, so they cannot drift from what actually changed.

## Why Playwright captures and Remotion composes

Neither tool does the whole job, and the reason is in `remotion-evaluation.md`.

Remotion is the right compositor: the token layer is ready, `Slide` drops into
an `AbsoluteFill` unchanged, and **30 of 38 components are pure render
functions** — no state, no effects, no timers — so nothing in the library
disagrees with a frame clock.

But it is the wrong recorder, for the reason that evaluation found:

> CSS transitions … 19 declarations, all hover-intent — wall-clock, not
> frame-clock; they smear under seeking.

Evidence has to show the interaction as it happens, at wall-clock speed. So
Playwright records the truth and Remotion frames it: title card, captions,
before/after layout, and the type scale the evaluation notes a 1080p frame needs
and a 16px web page does not.

### Licence — settle before any of this ships

Remotion is source-available. Free for individuals and organisations of up to
three people; a Company Licence is mandatory at four or more, with headcount
**aggregated across all collaborating parties**. Evaluation is explicitly
permitted, so a prototype is fine.

For `rtkelly13/*` personal repos that is free use. The evaluation's caveat was
about Sentric product videos, which is a different context and a purchase
decision. **Nothing here should be used to render commercially without that
being settled.** If the answer ever changes, Piece 3 below is the only part that
has to be replaced — which is why the composition step is deliberately last and
deliberately separable.

## Bespoke, mechanically

"Bespoke to that change" means the script is derived, not written. Four inputs
already exist:

| Input | Where it comes from | What it decides |
|---|---|---|
| Changed component files | `git diff --name-only` against the merge base | which stories to record |
| Component → story map | Storybook's own build index, which `check:visual-coverage` already reads | the story IDs to drive |
| Moved baselines | the visual suite's diff output | which recordings matter most, ordered first |
| Changed tokens | a diff touching `src/theme/levels.ts` | record on **both** levels rather than one |

A PR touching `Button.tsx` and `levels.ts` therefore records the Button stories
on every level; one touching only `docs/` records nothing and says so.

## The four pieces

Deliberately separable, cheapest first. Each is useful alone.

### Piece 1 — capture with captions

`pnpm evidence <story-id>…` — a Playwright script that mounts a story, drives it
through a scripted sequence (hover, focus, click, level switch), and records
`webm`. Captions are injected into the page as a fixed overlay before each step,
so they are burnt into the recording and need no compositor.

Useful on its own: a captioned recording of one story, attachable by hand.
Blocked by nothing.

### Piece 2 — before and after

Record the same script against the merge base. The cheap way is the worktree
convention this repo already has:

```bash
git worktree add temp/evidence-base "$(git merge-base HEAD origin/main)"
```

Two Storybook builds is the real cost, and it is why this is on demand rather
than on every PR. `estate tidy` cleans the worktree up afterwards, and refuses
if anything in it is dirty.

### Piece 3 — Remotion composition

Takes the two recordings plus the caption manifest and produces one MP4: title
card naming the PR, before and after side by side, captions as real typography
rather than burnt-in overlay, and the type scale sized for the frame. This is
the piece the licence question applies to, and the piece that can be dropped
without losing the rest.

Needs the `delayRender()` font handshake from the evaluation, or early frames
encode in the fallback face.

### Piece 4 — `/evidence` on the PR

A comment-triggered workflow, mirroring `update-snapshots-command.yml` and
`publish-dev-command.yml`, which already do exactly this shape of dispatch.
Renders, transcodes, and posts the result with `gh pr comment --attach`.

On demand rather than automatic because the walkthrough is already the longest
job in the repo, and a docs-only PR should not pay for a video nobody watches.
The cost is that it can be forgotten, so the convention has to carry it.

## Hard constraints

- **GitHub's player takes MP4 and MOV.** Playwright records `webm`, so an
  `ffmpeg` transcode is mandatory. Available on `ubuntu-latest`; needs `brew
  install ffmpeg` locally.
- **Video attachments get no alt text.** `gh --attach` states this: a video
  renders as a player. So the caption track is the only description a reader
  gets, which is another reason captions are burnt in at Piece 1 rather than
  left to the compositor.
- **50 files per `gh` invocation**, which is far above one video per PR.
- **Determinism is not required here.** This is the opposite of the visual gate:
  `test:visual` pins `maxDiffPixels: 0` on Linux precisely so a render change
  fails loudly. Evidence is for a human, so it runs anywhere and asserts
  nothing. Keeping the two apart is why this is a separate config, as
  `playwright.walkthrough.config.ts` already is for the same reason.

## What this is not

- **Not a gate.** Nothing here can fail a build. An attached video that shows
  the wrong thing is still a video, and no check can tell.
- **Not a replacement for the walkthrough.** That answers "what does everything
  look like now"; this answers "what does this change do".
- **Not narration.** Captions come from the diff. A voice track was considered
  and rejected for now: it adds a dependency and a register that would need
  tuning, and the caption text is the part that carries the meaning.
