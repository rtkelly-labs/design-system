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
 *   - every `.js` file under dist/   (the ESM output, one file per module)
 *   - src/theme.css   (Generated design token & theme ladder CSS)
 *
 * Since #301 `dist/` is one file per source module, so the output is weighed
 * as all of its files concatenated in path order — the same bytes the single
 * `dist/index.mjs` used to hold, plus the per-file import lines. There is no
 * CommonJS output to weigh any more; see the last entry in `BUDGETS`' notes. This gate
 * weighs what the package *ships*; what a consumer pays for the parts it
 * imports is `check:import-cost`.
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

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
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
 * Raised again for `DataTable`'s semantics (#245): +2,473 B raw, +704 B gzip
 * on the ESM bundle over `main` with `Toast` in it, and additive with the
 * disabled-checkbox fix (#274) that landed beside it (265,997 B / 62,908 B;
 * CommonJS 292,271 B / 65,114 B). That is the per-header sort button with its
 * description, `aria-sort` for the primary sort key, `scope` on every header
 * and the row-header cell, `caption`, and the `aria-rowcount` /
 * `aria-rowindex` arithmetic for a windowed body. TanStack supplies none of
 * it — it has no markup — so it is written here or nowhere, and no
 * dependency moves: `check:dep-cost` is unchanged.
 *
 * Raised again for `Tooltip`, `Popover` and `Menu` (#166): +11,042 B raw,
 * +1,932 B gzip on the ESM bundle over `main` with `DataTable`'s semantics
 * in it (277,175 B / 64,855 B; CommonJS 304,756 B / 67,129 B). That is seven
 * exported components — the three roots and `MenuItem`, `MenuRadioGroup`,
 * `MenuRadioItem`, `MenuSeparator` — their prop JSDoc, the one
 * `floatingSurface` recipe all three wear, and the two first consumers:
 * `DocsHeader`'s level chooser and `SlideDeck`'s control hints. More of the
 * raw rise than the gzip is documentation, which the unminified bundle
 * ships and gzip largely absorbs. Positioning, collision, the dismissal
 * stack, list navigation and typeahead are `@base-ui/react/tooltip`,
 * `/popover` and `/menu`, external here and weighed by `check:dep-cost`.
 * Re-measured after rebasing onto #279's pager and adding the portal-Level
 * hook (278,682 B / 65,233 B; CommonJS 306,349 B / 67,513 B).
 *
 * Raised for the application shell (#247): +9,323 B raw, +1,991 B gzip on
 * the ESM bundle over `main` with #281's scoped-Level dialogs in it
 * (279,274 B / 65,299 B → 288,597 B / 67,290 B; CommonJS 306,973 B /
 * 67,599 B → 317,168 B / 69,624 B, +10,195 B / +2,025 B). Five exported
 * components — `AppShell`, `AppSidebar`, `AppSidebarNav`, `AppTopbar`,
 * `AppMain` — their four recipes, the width subscription that keeps the
 * drawer shut at desktop width, and the navigation tree's link / button /
 * group rendering. Nothing off-canvas is new: the dialog, focus trap, focus
 * return, scroll lock and portal Level are `Drawer` on
 * `@base-ui/react/dialog`, already paid for, and the toggle's icon is one
 * more named import from `lucide-react`, external here.
 *
 * Raised again for the site chrome (issue 246): +12,502 B raw, +2,442 B gzip
 * on the ESM bundle over the application shell's measurement above
 * (288,597 B / 67,290 B → 301,099 B / 69,732 B; CommonJS 317,168 B /
 * 69,624 B → 330,928 B / 72,136 B, +13,760 B / +2,512 B). That is five
 * exported components — `SiteHeader`, `SiteNav`, `SiteNavItem`, `MobileNav`,
 * `SiteFooter` — their three recipes with the per-breakpoint and
 * per-orientation class strings written out in full for Tailwind's scanner,
 * and the link adapter lifted out of `components/docs/` into
 * `LinkProvider` / `SiteLink` so both chromes share one context. None of
 * the prop JSDoc ships; the rise is code and class strings. Off-canvas
 * behaviour is `Drawer` and the group popup is `Menu`, both already in the
 * bundle, and no dependency moves: `check:dep-cost` is unchanged.
 * Re-measured after closing `MobileNav`'s portalled drawer at the header's
 * breakpoint and keeping it open on a cancelled click (302,861 B /
 * 70,208 B; CommonJS 332,713 B / 72,598 B): a media-query subscription and
 * the context that carries `collapseAt` into the slot.
 *
 * Raised again for `ErrorSummary` (issue 50): +4,231 B raw, +1,061 B gzip on
 * the ESM bundle over `main` with the site chrome in it (302,861 B /
 * 70,208 B → 307,092 B / 71,269 B; CommonJS 332,713 B / 72,598 B →
 * 337,126 B / 73,733 B, +4,413 B / +1,135 B). That is one exported
 * component, its recipe's class strings, the focus-on-appear effect, and the
 * link handler that resolves an id to the control that should take focus —
 * the visible `Checkbox` or `Switch` rather than the hidden input the id sits
 * on, and a `RadioGroup`'s roving radio — then scrolls its label into view.
 * `TextArea` and `Select` move their `id` onto `Field.Control`, which is a
 * few bytes either way. No comment ships and no dependency moves:
 * `check:dep-cost` is unchanged. Re-measured after rebasing onto #284's
 * author card, which landed first inside the old ceilings (308,218 B /
 * 71,610 B; CommonJS 338,276 B / 74,083 B).
 *
 * Raised again for the marketing sections (issue 248): +1,736 B raw, +963 B
 * gzip on the ESM bundle over `ErrorSummary`'s measurement above
 * (308,218 B / 71,610 B → 309,954 B / 72,573 B; CommonJS 338,276 B /
 * 74,083 B → 340,607 B / 75,133 B, +2,331 B / +1,050 B). Six exported
 * components — `Hero`, `FeatureGrid`, `Feature`, `PricingGrid`,
 * `PricingTier`, `CTASection` — over one internal `SectionGrid`, with their
 * four recipes and the per-column and per-accent class strings written out
 * for Tailwind's scanner. Part of it is offset by `SaasLandingPage`, whose
 * hero, feature cards and price tiers were inline-style objects and are now
 * those components, which is the likeliest reason the raw rise is small
 * against the gzip one. `Card` gains
 * `forwardRef`, which the cells need to forward theirs. No dependency moves:
 * the tick is one more named import from `lucide-react`, external here.
 *
 * Raised again for the themed `Select` (issue 164): +7,428 B raw, +1,630 B
 * gzip on the ESM bundle over `main` with the marketing sections in it
 * (309,954 B / 72,573 B → 317,382 B / 74,203 B; CommonJS 340,607 B /
 * 75,133 B → 348,556 B / 76,745 B, +7,949 B / +1,612 B). Measured locally
 * on Linux, where `main` reproduced the runner's figures above to the byte.
 * That is `Select.tsx`: both presentations — the listbox and the `native`
 * `<select>` — the list recipe with its row states and the disabled-row
 * keydown filter. `FieldFrame` gains the non-native label the
 * trigger needs, and `Input.tsx` loses the old native `Select`. The listbox,
 * its typeahead, positioning and hidden form input are
 * `@base-ui/react/select`, external here and weighed by `check:dep-cost`,
 * which records the rise; the chevron is one more named import from
 * `lucide-react`.
 *
 * Raised for the mdxcn-derived documentation figures and blocks. Eleven new
 * public components add pure rendering and dated chart layout code; no new
 * runtime dependency was added. Re-measured against the 0.11.0 base: ESM
 * 362,938 B raw / 84,112 B gzip, CommonJS 397,911 B raw / 86,900 B gzip
 * locally; the ceilings allow a small Linux gzip variance.
 *
 * Re-keyed for the per-module output (#301). The flat `dist/index.mjs` is now
 * a 4 KB barrel, so a ceiling on that file alone would have stopped weighing
 * anything. Measured on the new layout, locally on macOS: ESM 387,723 B raw
 * / 89,050 B gzip across 117 files, CommonJS 565,563 B / 98,414 B. The ESM
 * rise over the flat file (362,938 B → 387,723 B) is the import and export
 * lines each module now carries for its neighbours, and the barrels' export
 * lists written out by name (`scripts/expand-star-exports.mjs`). The CommonJS rise is
 * larger because esbuild writes its interop preamble (`__defProp`,
 * `__export`, `__toCommonJS`, `__toESM`) into every file rather than once —
 * about 1.5 KB a file, boilerplate rather than behaviour, and most of it
 * absorbed by gzip. The ceilings carry about 2% for the Linux gzip spread.
 *
 * The CommonJS budget is gone, because the CommonJS build is (ESM only, with
 * `"type": "module"`). Everything above that quotes a CommonJS figure is the
 * history of a format this package no longer ships. The ESM output moved from
 * `.mjs` to `.js`, and so did this key. Measured locally on macOS against
 * #301's per-module build: 387,723 B raw / 89,050 B gzip before, 387,260 B /
 * 89,033 B after — 463 B smaller, and every byte of it an `m`: 346 import
 * specifiers and 117 `sourceMappingURL` comments that said `.mjs` and now
 * say `.js`. Same 117 modules. The ceilings are unchanged,
 * which leaves the same ~2% over the new measurement.
 */
const BUDGETS = {
  'dist/**/*.js': {
    maxRaw: 395_000,
    maxGzip: 91_000,
    desc: 'ESM output, every module',
  },
  'src/theme.css': {
    // #339 adds shipped symbol faces to all four role stacks and explains
    // their fallback order: 27,295 B raw, 5,127 B gzip on Node 22 in CI.
    // Local zlib emits 5,138 B. Keep the existing ~2% headroom for tooling.
    maxRaw: 27_850,
    maxGzip: 5_250,
    desc: 'Design token CSS',
  },
};

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(2).padStart(6)} KB (${bytes.toLocaleString('en-US')} B)`;
}

/** Every emitted file under `dist/` ending in `ext`, in path order. */
function outputFiles(ext) {
  const walk = (dir) =>
    readdirSync(dir).flatMap((entry) => {
      const full = path.join(dir, entry);
      return statSync(full).isDirectory() ? walk(full) : [full];
    });
  const dist = path.join(ROOT, 'dist');
  return existsSync(dist) ? walk(dist).filter((file) => file.endsWith(ext)).sort() : [];
}

/** The bytes a budget key weighs: one file, or a format's whole output. */
function contentOf(rel) {
  const glob = rel.match(/^dist\/\*\*\/\*(\.js)$/);
  if (!glob) {
    const full = path.join(ROOT, rel);
    return existsSync(full) ? readFileSync(full) : null;
  }
  const files = outputFiles(glob[1]);
  return files.length ? Buffer.concat(files.map((file) => readFileSync(file))) : null;
}

const problems = [];
const rows = [];

for (const [rel, budget] of Object.entries(BUDGETS)) {
  const content = contentOf(rel);
  if (!content) {
    problems.push(`${rel} does not exist. Run 'pnpm build' first.`);
    continue;
  }

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
