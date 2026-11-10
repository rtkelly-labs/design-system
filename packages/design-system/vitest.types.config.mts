import { defineConfig } from 'vitest/config';

/**
 * The type-level suite: `type-tests/**\/*.test-d.tsx`, in Vitest's typecheck
 * mode and nothing else (`typecheck.only`). Vitest hands the files to `tsc`
 * with `type-tests/tsconfig.json` — a consumer's config — and reports each
 * failed `expectTypeOf` against the `it` it sits in.
 *
 * Its own config rather than a flag on the unit suite's, because these import
 * the package by name and so need `dist/`: they run in the `build` job after
 * `pnpm build`, while the unit job deliberately never writes `dist/`
 * (`src/package-shape.test.ts`). See docs/testing.md.
 */
export default defineConfig({
  test: {
    include: [],
    typecheck: {
      enabled: true,
      only: true,
      include: ['type-tests/**/*.test-d.tsx'],
      tsconfig: 'type-tests/tsconfig.json',
    },
  },
});
