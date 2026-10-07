# Table Appearances Implementation Plan

> **For agentic workers:** Execute this plan inline in the isolated `feat/table-appearances` worktree. Preserve the current default table appearance.

**Goal:** Add compact quiet and indexed table appearances to the design system and show both on Midnight and Sketch in a locally generated playbook screenshot.

**Architecture:** Keep the existing compound `Table` and `DataTable` APIs and add optional `appearance` and `density` props. A private presentation context carries those choices to the compound table slots; recipes select the visual treatment while the table markup and interaction behavior remain shared. A Storybook comparison story renders both appearances under both theme levels.

**Tech Stack:** React, TypeScript, `tailwind-variants` recipes, Storybook, Playwright walkthrough.

**Spec:** User request in this conversation: propose the quiet ruled and keyline index tables as a design-system PR, and add a locally captured screenshot comparing theme levels.

## Global Constraints

- Preserve the existing grid appearance and comfortable density as defaults.
- Keep color classes role-addressed; do not add hue-named utility classes or theme tokens.
- Add no runtime dependency or new interaction model.
- Preserve table semantics, sort controls, captions, keyboard scroll region, pagination, and virtualization.
- Keep work in the `design-system` repository; the docs repository has unrelated local edits.
- Generate the requested review image with the existing screenshot walkthrough and include it in the PR.

---

### Task 1: Add table appearance and density props

**Files:**
- Modify: `packages/design-system/src/components/Table.tsx`
- Modify: `packages/design-system/src/components/DataTable.tsx`
- Modify: `packages/design-system/package.json` (bump the additive public API release to `0.14.0`)
- Modify: `packages/design-system/api/index.d.ts` (regenerate the published type surface)

**Interfaces:**
- Produce `TableAppearance = 'grid' | 'quiet' | 'index'` and `TableDensity = 'comfortable' | 'compact'` from `Table.tsx`.
- Add documented optional `appearance` and `density` props to `Table` and `DataTable`; defaults are `grid` and `comfortable`.
- Keep appearance and density state private to the Table compound-component implementation.

- [ ] Add the exported presentation types and JSDoc-documented props; implement a private context so `TableHeader`, `TableHead`, `TableBody`, `TableRow`, `TableCell`, and `TableFooter` can select the same variant.
- [ ] Add recipe classes for `grid`, `quiet`, and `index`: preserve current grid classes; make quiet frameless with subtle horizontal rules and no vertical cell borders; make index use the quiet rules plus a restrained accent keyline on row headers.
- [ ] Add comfortable and compact spacing; pass both props through `DataTable`; make its empty-state spacing and compact virtual-row default match the selected density while preserving caller overrides.
- [ ] Regenerate the package API declaration with `pnpm --filter @rtkelly13/design-system api:update` and confirm the workspace lockfile needs no change for a package-version-only edit.
- [ ] Run `pnpm --filter @rtkelly13/design-system typecheck` and `pnpm --filter @rtkelly13/design-system check:component-docs`.

### Task 2: Add a level comparison story and usage guidance

**Files:**
- Modify: `packages/design-system/src/stories/DataTable.stories.tsx`
- Modify: `packages/design-system/src/components/Table.tsx` (public prop descriptions)
- Modify: `packages/design-system/src/components/DataTable.tsx` (public prop descriptions)

**Interfaces:**
- Storybook story `AppearanceMatrix` compares compact quiet and index tables under separately scoped Midnight and Sketch `ThemeProvider`s.
- Use the existing deterministic deployment fixture rows and make the first column a row header in both examples.

- [ ] Add JSDoc story guidance and the four-cell comparison composition; keep captions and the existing story convention.
- [ ] Run `pnpm --filter @rtkelly13/design-system check:story-docs`, `check:story-conventions`, `check:docgen-props`, `check:visual-coverage`, and `build-storybook`.
- [ ] Review the built story markup and API declaration for the two appearance values and two density values.

### Task 3: Capture the levels and open the PR

**Files:**
- Create: `packages/design-system/docs/visual-examples/table-appearances-levels.png`
- Create: `docs/superpowers/plans/2026-10-07-table-appearances.md`

**Interfaces:**
- The PNG is a review artifact from the local `pnpm walkthrough` report and shows both theme levels and both table appearances in one frame.
- PR title: `feat: add quiet and indexed table appearances`.

- [ ] Run `pnpm walkthrough`; extract the `AppearanceMatrix` screenshot from the generated report and save it at the documented path.
- [ ] Inspect the screenshot for legibility, contrast, clipping, and the Midnight/Sketch difference.
- [ ] Run `pnpm --filter @rtkelly13/design-system build` and the relevant static API, docs, component-contract, CSS, and token checks; do not alter palette tokens.
- [ ] Commit the feature and screenshot, push the feature branch, and create a draft PR with the screenshot embedded in its description.

## Scope notes

The docs portal consumer change is deferred: it currently depends on a published design-system version, and the package from this PR is not published yet. The PR makes the compact appearances available for that follow-up without editing the docs checkout that contains unrelated local changes.
