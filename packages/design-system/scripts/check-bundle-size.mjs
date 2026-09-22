#!/usr/bin/env node
/**
 * Assert that the built bundle and assets stay within their byte budgets.
 *
 * A design system is shipped to consumers who pay for every byte in cold-load
 * latency, parsing overhead, and mobile transfer. While `check:api` guards
 * against breaking the public TypeScript contract, nothing previously
 * prevented a heavy dependency from leaking into `dist/` or CSS bloating
 * without notice.
 *
 * This checks the uncompressed (raw) and gzipped sizes of:
 *   - dist/index.mjs  (ESM bundle)
 *   - dist/index.js   (CommonJS bundle)
 *   - src/theme.css   (Generated design token & theme ladder CSS)
 *
 * ## A ratchet, not an arbitrary guess
 *
 * Same architectural ratchet as `check:lint-budget`, `check:css` and
 * `check:component-docs`: the budget captures the baseline on the day this
 * gate landed. Any regression past the ceiling fails CI immediately. When an
 * optimization lands, ratchet the budget down in the same commit.
 *
 *   node scripts/check-bundle-size.mjs           verify
 *   node scripts/check-bundle-size.mjs --list    print current sizes and ceilings
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Ceilings in bytes (raw and gzip).
 * Sized tightly to current build output with a ~2% cushion for compiler metadata.
 *
 * Measured against `main` at the point this gate landed — after the recommended
 * colour exports (#221) and the Base UI dialogs (#253), both of which grew the
 * bundle past the numbers this file was first written with. A budget recorded
 * before the commits it has to admit is a gate that fails on arrival, so these
 * are re-measured rather than inherited.
 *
 * Raised again for the report frame (`ReportDocument`): +118 B raw, +21 B gzip
 * on the ESM bundle for three components. It is tree-shaken away from anyone
 * who does not import it, and `check:dep-cost` confirms it adds no dependency
 * weight at all — it is markup and a recipe over primitives already paid for.
 *
 * ## Record these from CI, not from a laptop
 *
 * gzip is not reproducible across platforms. The same `dist/index.mjs` weighs
 * 50,721 bytes gzipped on macOS and 50,870 on ubuntu-latest — a 149-byte
 * spread that comes from zlib builds rather than from anything in the bundle.
 * Budgets first recorded on a developer machine had enough headroom to hide
 * it; the report frame's +21 B did not, and the gate failed in CI on a tree
 * that passed locally.
 *
 * So the ceilings below are the **runner's** measurements plus roughly half a
 * percent. Re-record from a CI run rather than from `pnpm check:bundle-size`
 * locally, or leave enough cushion to cover the spread. `check:dep-cost` has
 * the same property and absorbs it with a tolerance; this gate is a hard
 * ceiling, so the cushion has to live in the number.
 *
 * Raised again for `TOKEN_RULES` and `scanRules`: +1,068 B raw, +316 B gzip.
 * That is four regexes and a line-scanner entering the published surface so
 * the report generator can hold a report to the same colour-instead-of-role
 * rule this package holds itself to. A consumer who imports neither pays none
 * of it — `sideEffects` is declared and the module is shaken out — but this
 * ceiling weighs the whole file, so the number moves and is justified here
 * rather than quietly widened.
 *
 * Raised again for `Drawer` (#241): +4,384 B raw, +811 B gzip on the ESM
 * bundle, measured against `main` on ubuntu-latest (224,052 B / 52,439 B;
 * CommonJS 247,563 B / 54,602 B). That is the component, the `placement`
 * variant on `dialogSurface` and the shared `usePopupRef` — class strings and
 * wiring, not behaviour. Every piece of off-canvas behaviour comes from the
 * dialog primitive `Modal` already pays for, so `check:dep-cost` does not move.
 * The alternative is #246 and #247 each hand-rolling their own drawer, which
 * costs more than this and ships two.
 *
 * Raised again for `Checkbox` and `Switch`: +6,614 B raw, +1,288 B gzip on
 * the ESM bundle over `main` with Drawer in it (230,666 B / 53,727 B;
 * CommonJS 254,507 B / 55,934 B). Most of it is the `fieldFrame` both
 * controls share and the `booleanControl` recipe. The Base UI checkbox and
 * switch entry points they sit on are external to this bundle and are
 * weighed by `check:dep-cost` instead, which records the rise.
 *
 * Raised again for the feedback primitives — `Spinner`, `Skeleton`,
 * `Progress`, `EmptyState` (#242): +8,705 B raw, +2,362 B gzip on the ESM
 * bundle (239,371 B / 56,089 B; CommonJS 263,736 B / 58,307 B). Four
 * components' recipes and the reduced-motion handling each carries. The one
 * new dependency edge is `Progress` taking `@base-ui/react/progress` rather
 * than hand-rolling `role="progressbar"` and its value maths, which #242
 * asks for; that cost is recorded by `check:dep-cost`, not here.
 *
 * Raised again for the public `Tabs` primitive (#240): +6,066 B raw, +1,665 B
 * gzip on the ESM bundle (245,437 B / 57,754 B; CommonJS 270,010 B /
 * 59,955 B). This is an extraction, not a second tablist — the built bundle
 * still carries exactly one arrow-key traversal, and `CodeTabs` lost ~200
 * lines to it. What grows is the surface a consumer can now reach: the
 * context that pairs tabs with panels, controlled and uncontrolled value,
 * the vertical orientation's compound variants, and `TabsPanel`. No new
 * dependency: `Tabs` imports no primitive, per #163's rejection.
 *
 * Raised again for `Fieldset`, `Legend`, `RadioGroup` and `Radio` (#239):
 * +5,820 B raw, +1,306 B gzip on the ESM bundle, measured against `main`
 * before `Tabs` landed and additive on top of it (251,166 B / 59,008 B with
 * both; CommonJS 276,403 B / 61,255 B). Most of it is `GroupFrame`,
 * `FieldItem` and the `FieldMessage` extracted from `FieldFrame` — the group
 * arrangement of the one field implementation, rather than a second
 * implementation beside it — and the `dot` shape on `booleanControl`. The
 * Base UI fieldset, radio-group and radio entry points are external to this
 * bundle and are weighed by `check:dep-cost` instead.
 *
 * Raised again for `Pagination`'s page list (#244): +2,855 B raw, +703 B gzip
 * on the ESM bundle, additive with the groups above (254,086 B / 59,706 B
 * with both; CommonJS 279,632 B / 61,996 B). That is the ellipsis algorithm
 * in `paginationRange` — a pure function of two numbers — and the numbered
 * items, each rendered in both the button and the anchor mode because the
 * component still never imports a router. No dependency moves:
 * `check:dep-cost` is unchanged.
 *
 * Raised again for `Toast` (#243): +8,349 B raw, +2,201 B gzip on the ESM
 * bundle, measured before `Pagination` landed and additive on top of it
 * (262,411 B / 61,907 B with both; CommonJS 288,593 B / 64,172 B). That is
 * `ToastProvider`, the toast item and its intent recipe, the lifetime policy
 * in `toastLifetime.ts`, the two hooks, and `AdminDashboardLayout` wiring its
 * sync button to them as the first consumer. The queue, the timers, the
 * pause-on-hover and pause-on-focus, F6 and the live-region announcements
 * are `@base-ui/react/toast`, external to this bundle and weighed by
 * `check:dep-cost` — the alternative, hand-rolling a live region and a timer
 * that yields to the reader, is exactly the part #243 says not to write.
 *
 * Raised again for `Select`'s listbox (#164): +6,361 B raw, +1,369 B gzip on
 * the ESM bundle over `main` (269,885 B / 63,568 B; CommonJS +6,899 B /
 * +1,329 B, 296,605 B / 65,791 B). That is `Select.tsx` itself — two
 * presentations of one field, the listbox and the `native` escape hatch the
 * issue asks to keep, the list recipe, and the keydown filter that steps
 * over disabled rows where Base UI's default would stop on them. The trigger
 * reuses `Input`'s recipe rather than restating it. The listbox, typeahead
 * and positioning are `@base-ui/react/select`, external to this bundle and
 * weighed by `check:dep-cost`.
 */
const BUDGETS = {
  'dist/index.mjs': {
    maxRaw: 271_300,
    maxGzip: 63_900,
    desc: 'ESM bundle',
  },
  'dist/index.js': {
    maxRaw: 298_100,
    maxGzip: 66_200,
    desc: 'CommonJS bundle',
  },
  'src/theme.css': {
    maxRaw: 27_000,
    maxGzip: 5_000,
    desc: 'Design token CSS',
  },
};

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(2).padStart(6)} KB (${bytes.toLocaleString('en-US')} B)`;
}

const problems = [];
const rows = [];

for (const [rel, budget] of Object.entries(BUDGETS)) {
  const full = path.join(ROOT, rel);
  if (!existsSync(full)) {
    problems.push(`${rel} does not exist. Run 'pnpm build' first.`);
    continue;
  }

  const content = readFileSync(full);
  const rawSize = content.length;
  const gzipSize = gzipSync(content).length;

  rows.push({
    file: rel,
    desc: budget.desc,
    raw: rawSize,
    maxRaw: budget.maxRaw,
    gzip: gzipSize,
    maxGzip: budget.maxGzip,
  });

  if (rawSize > budget.maxRaw) {
    problems.push(
      `${rel} raw size ${formatBytes(rawSize)} exceeds budget ${formatBytes(budget.maxRaw)} (+${rawSize - budget.maxRaw} B)`,
    );
  }
  if (gzipSize > budget.maxGzip) {
    problems.push(
      `${rel} gzip size ${formatBytes(gzipSize)} exceeds budget ${formatBytes(budget.maxGzip)} (+${gzipSize - budget.maxGzip} B)`,
    );
  }
}

if (process.argv.includes('--list')) {
  console.log('Bundle Size Census:');
  for (const r of rows) {
    console.log(`\n  ${r.file} (${r.desc}):`);
    console.log(`    raw:  ${formatBytes(r.raw)} / max ${formatBytes(r.maxRaw)}`);
    console.log(`    gzip: ${formatBytes(r.gzip)} / max ${formatBytes(r.maxGzip)}`);
  }
  console.log('');
}

if (problems.length) {
  console.error(`\nBundle size budget exceeded — ${problems.length} violation(s):\n`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error(
    '\nBundle bloat directly impacts consumers. If this increase was intentional, ' +
      'justify it and update BUDGETS in scripts/check-bundle-size.mjs.',
  );
  process.exit(1);
}

console.log(
  `Bundle size OK — ${rows.length} assets checked within raw and gzip budgets.`,
);
