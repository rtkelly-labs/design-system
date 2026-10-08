# mdxcn components implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring a first-party, token-adapted subset of mdxcn's MDX diagrams and write-up components into `@rtkelly13/design-system`, with source attribution, unit tests, Storybook documentation, accessibility coverage, and visual baselines.

**Architecture:** Copy the component ideas into `src/components/docs/graphs/` as owned source rather than adding an mdxcn npm dependency. A shared `GraphFrame` owns the dashed ASCII frame, title, corners, prose parsing, and semantic colour mapping; the selected graph components compose it. The port removes mdxcn's `motion` runtime and uses the design system's deterministic CSS/token contract, while preserving the MDX-friendly children APIs and the upstream component names.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vitest, Testing Library, Storybook 10, Playwright, `@testing-library/jest-dom`-compatible DOM assertions already used by the package.

**Spec:** `temp/mdxcn/README.md`, `temp/mdxcn/registry/default/AGENTS.md`, and upstream commit `2928126ba146ebbae9c2351deca27d27bb40e744`.

## Global Constraints

- The mdxcn source is MIT licensed; every adapted component file must link to `https://github.com/keshav-exe/mdxcn` and its exact upstream `registry/default/<component>/<component>.tsx` path.
- The package must not add an `mdxcn` npm dependency.
- Components address the design system's semantic utilities (`surface-*`, `content-*`, `edge-*`, `accent-*`, `intent-*`), never raw colour names or mdxcn `graph-*` variables.
- Both `midnight` and `sketch` must render through stories and visual assertions.
- Visible glyphs may be `aria-hidden` only when an accessible text summary remains in the component.
- New components need co-located unit tests, three documented Storybook samples, a status tag, and one asserted visual story.
- Existing untracked files in the source checkout are out of scope and must remain untouched.

---

### Task 1: Establish the graph frame and attribution contract

**Files:**
- Create: `packages/design-system/src/components/docs/graphs/GraphFrame.tsx`
- Create: `packages/design-system/src/components/docs/graphs/attribution.ts`
- Create: `packages/design-system/docs/attributions/mdxcn.md`
- Test: `packages/design-system/src/components/docs/graphs/GraphFrame.test.tsx`

**Interfaces:**
- Produces `Graph`, `GraphBody`, `GraphProse`, `GraphRule`, `GraphRuleY`, `GraphTrack`, `GraphTick`, `GraphArrow`, `childItems`, `defineItem`, `elementsOf`, `hasHost`, `itemText`, `listItems`, `paragraphsOf`, `splitDash`, `textOf`, and `graphClassNames` for the graph components.
- Produces `mdxcnAttribution(componentPath)` for a stable source comment and `MDXCN_REPOSITORY` for documentation links.

- [x] **Step 1: Write failing frame tests** for title/corner rendering, semantic classes, Markdown child extraction, and accessible summary retention.
- [x] **Step 2: Run `pnpm --dir packages/design-system test -- src/components/docs/graphs/GraphFrame.test.tsx`** and confirm the new module is missing.
- [x] **Step 3: Implement the shared frame** using semantic classes and the upstream source path in the file-level attribution comment.
- [x] **Step 4: Add the MIT attribution document** with the upstream commit, repository, copied component paths, and the MIT notice.
- [x] **Step 5: Rerun the focused test and `pnpm --dir packages/design-system typecheck`**.

### Task 2: Add flow, timeline, diff, and slope components

**Files:**
- Create: `packages/design-system/src/components/docs/graphs/GraphFlow.tsx`
- Create: `packages/design-system/src/components/docs/graphs/GraphTimeline.tsx`
- Create: `packages/design-system/src/components/docs/graphs/GraphDiff.tsx`
- Create: `packages/design-system/src/components/docs/graphs/GraphSlope.tsx`
- Test: matching co-located `*.test.tsx` files

**Interfaces:**
- `GraphFlow` accepts Markdown list children or `<Path>` items and renders a readable path summary.
- `GraphTimeline` accepts Markdown list children or `<Event>` items with `done`, `now`, and `next` states.
- `GraphDiff` accepts Markdown list children or `<Line>` items with `add`, `remove`, and `keep` states.
- `GraphSlope` accepts rows with before/after values and renders an accessible before-to-after summary.

- [x] **Step 1: Add one failing public-behaviour test per component.** Test the MDX list form first, not internal helpers.
- [x] **Step 2: Run only those tests and confirm red.**
- [x] **Step 3: Port the upstream structures with the shared frame and semantic roles.** Keep the upstream file links in each component's attribution comment.
- [x] **Step 4: Add edge-case tests** for empty children, current/next state styling, additions/removals, and values that include units.
- [x] **Step 5: Run the four component test files and typecheck.**

### Task 3: Add uptime, tree, terminal, and steps components

**Files:**
- Create: `packages/design-system/src/components/docs/graphs/GraphUptime.tsx`
- Create: `packages/design-system/src/components/docs/graphs/GraphTree.tsx`
- Create: `packages/design-system/src/components/docs/graphs/Terminal.tsx`
- Create: `packages/design-system/src/components/docs/graphs/Steps.tsx`
- Test: matching co-located `*.test.tsx` files

**Interfaces:**
- `GraphUptime` accepts daily status values and exposes a screen-reader summary of uptime percentage and date labels.
- `GraphTree` accepts nested Markdown lists or `<Node>` items and renders a file/tree summary.
- `Terminal` accepts fenced/plain text children, detects prompt/comment/ok/output lines, and preserves horizontal scrolling.
- `Steps` accepts ordered Markdown children or `<Step>` items and uses bold/italic or explicit state to identify current/upcoming work.

- [x] **Step 1: Add failing tests** for parser behaviour, nested tree/step extraction, uptime percentage, and accessible summaries.
- [x] **Step 2: Run the focused tests and confirm red.**
- [x] **Step 3: Implement each component with the shared frame, semantic classes, and per-file attribution.**
- [x] **Step 4: Add tests for blank lines, custom prompts, short uptime rows, and empty lists.**
- [x] **Step 5: Run the four component test files and typecheck.**

### Task 4: Wire the public MDX surface and Storybook pages

**Files:**
- Modify: `packages/design-system/src/components/docs/index.ts`
- Modify: `packages/design-system/src/components/docs/mdxComponents.tsx`
- Modify: `packages/design-system/src/index.ts`
- Create: `packages/design-system/src/stories/GraphFlow.stories.tsx`
- Create: `packages/design-system/src/stories/GraphFrame.stories.tsx`
- Create: `packages/design-system/src/stories/GraphTimeline.stories.tsx`
- Create: `packages/design-system/src/stories/GraphDiff.stories.tsx`
- Create: `packages/design-system/src/stories/GraphSlope.stories.tsx`
- Create: `packages/design-system/src/stories/GraphUptime.stories.tsx`
- Create: `packages/design-system/src/stories/GraphTree.stories.tsx`
- Create: `packages/design-system/src/stories/Terminal.stories.tsx`
- Create: `packages/design-system/src/stories/Steps.stories.tsx`
- Modify: `packages/design-system/scripts/check-story-docs.mjs` only if a justified exclusion is required

**Interfaces:**
- All nine components are named exports from the package and available through `mdxComponents` for MDX authors.
- Each Storybook page uses `Docs/<Component>`, `tags: ['autodocs', '<status>']`, at least three meaningful stories, prop descriptions, and a source-attribution story caption.

- [x] **Step 1: Add export and MDX-map tests** proving the public names resolve.
- [x] **Step 2: Run the focused export tests and confirm red.**
- [x] **Step 3: Wire exports and create three or more stories per component** covering normal, edge/empty, and `sketch` theme cases.
- [x] **Step 4: Build Storybook and run `check:story-docs`, `check:story-conventions`, and `check:docgen-props`.**
- [x] **Step 5: Fix documentation gaps until the gates report the new pages as documented.**

### Task 5: Add accessibility and visual coverage

**Files:**
- Modify: `packages/design-system/tests/a11y.spec.ts`
- Modify: `packages/design-system/tests/visual.spec.ts`
- Modify: `packages/design-system/tests/walkthrough.shared.ts` if the new stories need explicit capture sizing
- Create/update: `packages/design-system/tests/__snapshots__/*` generated by Playwright

**Interfaces:**
- Every new Storybook component has an axe assertion in both theme levels.
- Every new component has one representative visual case in the existing `CASES` table and committed snapshots.

- [x] **Step 1: Add story ids to the a11y and visual case tables.**
- [x] **Step 2: Run the targeted Playwright tests and confirm missing-story/snapshot failures.**
- [x] **Step 3: Add stable stories and accessibility fixes until the targeted tests pass.**
- [ ] **Step 4: Update only the intended baselines with `pnpm test:visual:update` in Linux-compatible capture conditions.**
- [x] **Step 5: Run `check:visual-coverage` and `test:a11y`.**

### Task 6: Run the full package gates and review the attribution

**Files:**
- Modify: `packages/design-system/CHANGELOG.md` if the repository release convention requires an entry
- Modify: `packages/design-system/docs/attributions/mdxcn.md` if the final copied-file list changes

- [x] **Step 1: Run `pnpm --dir packages/design-system test`.**
- [x] **Step 2: Run `pnpm --dir packages/design-system typecheck`, `lint`, `check:deps`, `check:licences`, `check:component-docs`, `check:component-contract`, `check:doc-snippets`, `check:story-docs`, `check:story-conventions`, and `check:visual-coverage`.**
- [x] **Step 3: Run `pnpm --dir packages/design-system build` and `pnpm --dir packages/design-system check:api`.**
- [x] **Step 4: Inspect `git diff --check`, the public API diff, the attribution comments, and the Storybook index.**
- [x] **Step 5: Report the exact verification output and leave the worktree ready for review.**
