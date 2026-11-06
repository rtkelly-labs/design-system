# The published API surface

**Parent:** [`AGENTS.md`](../AGENTS.md)

How a breaking type change is detected, and where it gets reviewed.

---

## 🔒 The Published API Surface

`api/index.d.ts` is the committed shape of what consumers compile against.
`pnpm check:api` regenerates it from `dist/index.d.ts` and fails when the two
disagree; `pnpm api:update` accepts the new surface, and **the diff in that file
is the API change** — reviewing it in the PR is the entire point of the gate.

It exists because nothing else here could see a breaking type change. `pnpm
typecheck` proves the source is internally consistent, which it remains right up
to the moment you delete an export; `knip` answers a different question; the
visual suite is three layers away. For a package whose value proposition is that
consumers build against it, that was the missing check with the most leverage.

Deliberately no `api-extractor`: a plain diff of the emitted `.d.ts` needs no
second toolchain kept aligned with `tsup`. What it gives up is the ability to say
*why* a change is breaking.

**Comments are stripped before comparing, and that is the load-bearing choice.**
The doc comments here are long and edited often, and they are documentation
rather than API — a reworded paragraph is not something a consumer can observe
through the type system. Baselining verbatim would move the file on nearly every
PR, and a gate that always fails is one everybody learns to update without
reading. The cost, stated plainly: a doc comment that lies is invisible to this
check. That is a review problem, not a gate problem.

The entrypoint's `export { … }` is exploded to one name per line, because
`tsup` emits all 200-odd names on a single line and diffing it as a line reports
the whole list as changed when one export moves. Exploded, a deleted export is
three lines naming it.


