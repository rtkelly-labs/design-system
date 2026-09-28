#!/usr/bin/env node
/**
 * What each runtime dependency costs a consumer, measured rather than guessed.
 *
 * ## The gap this fills
 *
 * `check:bundle-size` weighs `dist/`. That is the whole of what this package
 * authors and none of what it charges. `tsup` externalises everything in
 * `dependencies`, so `dist/index.js` carries `import { Dialog } from
 * "@base-ui/react/dialog"` and stops there — the bytes arrive in the
 * consumer's bundle, at their build, under their bundler, and no gate in this
 * repo could previously see them. On the day this landed that invisible half
 * was twice the visible one: 48.6 KB gzip of authored code against 100.6 KB
 * gzip of dependencies.
 *
 * `check:deps` asks the other half of the question — every package has a
 * stated reason. A reason without a price cannot be argued with, and a price
 * without a reason cannot be judged, so this reads `MANIFEST` from
 * `dependency-manifest.mjs` and prints them on one row.
 *
 * ## How the number is arrived at
 *
 * Every import specifier in `dist/index.js` is read with the exact bindings
 * this package pulls from it — `@visx/shape` is charged for the three shapes
 * imported, not for the package. Those become a synthetic entry point that
 * esbuild bundles, tree-shakes, minifies and gzips the way a consumer's
 * bundler would, with `react` and `react-dom` external because the consumer
 * already pays for those.
 *
 * Two numbers come out of it, and the difference between them is the point:
 *
 *   - **standalone** — the cost if this were the only dependency.
 *   - **marginal** — everything, minus everything-except-this. What removing
 *     the package would actually give back.
 *
 * They diverge wherever packages share code. `@visx/grid` measures 9.6 KB
 * standalone and 0.3 KB marginal, because `@visx/axis` has already paid for
 * the scale and shape internals it shares. Reading the standalone figure as
 * the price of `@visx/grid` would argue for deleting a component to save 9.3 KB
 * that would not, in fact, be saved. The `group` column is the same subtraction
 * done for a whole scope at once — the number that matters when the question is
 * "do we keep the charting stack", which is a decision about `@visx/*` entire.
 *
 * ## Why this is a gate and not a report
 *
 * Reports about size get read once. The baseline in `docs/data/dependency-cost.json`
 * records the measured cost *and the installed version*, so a dependency bump
 * has to restate the price: the diff in that file is the cost of the upgrade,
 * reviewed the same way `check:api` reviews the type surface and
 * `check:licences` reviews the licence set. An upgrade that quietly doubles a
 * package fails here instead of arriving in a consumer's build.
 *
 *   node scripts/analyse-dep-cost.mjs            verify against the baseline
 *   node scripts/analyse-dep-cost.mjs --list     print the table
 *   node scripts/analyse-dep-cost.mjs --update   re-measure and rewrite baseline + report
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import esbuild from 'esbuild';
import ts from 'typescript';

import { MANIFEST } from './dependency-manifest.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUNDLE = path.join(ROOT, 'dist', 'index.js');
const BASELINE = path.join(ROOT, 'docs', 'data', 'dependency-cost.json');
const REPORT = path.join(ROOT, 'docs', 'dependency-cost.md');
const SRC = path.join(ROOT, 'src');

const mode = process.argv.includes('--update')
  ? 'update'
  : process.argv.includes('--list')
    ? 'list'
    : 'check';

/**
 * The consumer supplies these, so they are not charged to this package. They
 * are still listed in the report: a reader asking "why is react not here"
 * deserves the answer in the same place as the numbers.
 */
const CONSUMER_SUPPLIED = new Set(['react', 'react-dom']);

/**
 * Growth allowed before the gate fails: the larger of 2% and 512 bytes gzip.
 *
 * A flat percentage alone makes small packages untouchable — 2% of `@visx/group`
 * is a hundred bytes, which a compiler comment can spend. A flat byte allowance
 * alone lets the big ones drift. The floor covers minifier noise between esbuild
 * patch releases; the percentage covers genuine but proportionate growth.
 */
const TOLERANCE_FRACTION = 0.02;
const TOLERANCE_FLOOR = 512;

const packageOf = (specifier) =>
  specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0];

/** `@visx/axis` and `@visx/grid` are one decision, so they are also one row. */
const scopeOf = (name) => (name.startsWith('@') ? `${name.split('/')[0]}/*` : name);

/**
 * Every ESM file the build emitted. Since #301 that is one per source module,
 * with `dist/index.js` a barrel over the rest.
 */
function bundleFiles() {
  const walk = (dir) =>
    readdirSync(dir).flatMap((entry) => {
      const full = path.join(dir, entry);
      return statSync(full).isDirectory() ? walk(full) : [full];
    });
  return walk(path.dirname(BUNDLE))
    .filter((file) => file.endsWith('.js'))
    .sort();
}

/**
 * What the ESM output imports from packages, and the bindings it takes from
 * each specifier — summed over every emitted module.
 *
 * Read from the build rather than from `src/`, because the build is what
 * decides: a re-export that nothing reaches, or an import esbuild shook out,
 * costs a consumer nothing and must not appear here. Imports between the
 * package's own modules are relative and are skipped.
 */
function readBundleImports() {
  if (!existsSync(BUNDLE)) {
    console.error('dist/index.js is missing — run `pnpm build` first.');
    process.exit(1);
  }
  const bySpecifier = new Map();

  for (const file of bundleFiles()) {
    const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    for (const statement of sf.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
      const specifier = statement.moduleSpecifier.text;
      if (specifier.startsWith('.')) continue;
      if (!bySpecifier.has(specifier)) bySpecifier.set(specifier, new Set());
      const bindings = bySpecifier.get(specifier);
      const clause = statement.importClause;
      if (!clause) continue;
      // Bindings are held as strings, not objects: the output imports from
      // `lucide-react` in several statements and a Set of objects would keep one
      // entry per occurrence, then emit the same local name twice.
      if (clause.name) bindings.add('default');
      const named = clause.namedBindings;
      if (named && ts.isNamespaceImport(named)) bindings.add('namespace');
      if (named && ts.isNamedImports(named)) {
        for (const element of named.elements) {
          bindings.add(`named:${(element.propertyName ?? element.name).text}`);
        }
      }
    }
  }
  return bySpecifier;
}

/**
 * Which components reach for a package.
 *
 * Attribution is what turns a number into a decision: 29 KB is a different
 * argument when one component spends it than when eleven share it.
 */
function attributeToSource() {
  const byPackage = new Map();
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.tsx?$/.test(entry) || /\.test\.tsx?$/.test(entry)) continue;
      const sf = ts.createSourceFile(
        full,
        readFileSync(full, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      for (const statement of sf.statements) {
        if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
        const specifier = statement.moduleSpecifier.text;
        if (specifier.startsWith('.') || specifier.startsWith('node:')) continue;
        // A type-only import costs nothing at runtime, so it is not a consumer.
        if (statement.importClause?.isTypeOnly) continue;
        const name = packageOf(specifier);
        if (!byPackage.has(name)) byPackage.set(name, new Set());
        byPackage.get(name).add(path.relative(SRC, full));
      }
    }
  };
  walk(SRC);
  return byPackage;
}

/** Bundle the given specifiers as a consumer would, and weigh the result. */
async function weigh(specifiers, bySpecifier) {
  if (specifiers.length === 0) return { raw: 0, gzip: 0 };
  const entry = specifiers
    .map((specifier, index) => {
      const bindings = [...bySpecifier.get(specifier)];
      const named = bindings.filter((b) => b.startsWith('named:')).map((b) => b.slice('named:'.length));
      const parts = [];
      if (bindings.some((b) => b === 'namespace' || b === 'default') || named.length === 0) {
        parts.push(`import * as ns${index} from ${JSON.stringify(specifier)};`);
        parts.push(`globalThis.__keep(ns${index});`);
      }
      if (named.length > 0) {
        const aliased = named.map((name) => `${name} as k${index}_${name}`);
        parts.push(`import { ${aliased.join(', ')} } from ${JSON.stringify(specifier)};`);
        // Referencing every binding is what stops esbuild shaking out the very
        // thing being measured; an unused import weighs nothing and would make
        // every dependency look free.
        parts.push(`globalThis.__keep(${named.map((name) => `k${index}_${name}`).join(', ')});`);
      }
      return parts.join('\n');
    })
    .join('\n');

  const result = await esbuild.build({
    stdin: { contents: entry, resolveDir: ROOT, loader: 'js' },
    bundle: true,
    minify: true,
    write: false,
    format: 'esm',
    platform: 'browser',
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    define: { 'process.env.NODE_ENV': '"production"' },
    logLevel: 'silent',
  });
  const output = Buffer.from(result.outputFiles[0].contents);
  return { raw: output.length, gzip: gzipSync(output).length };
}

function installedVersion(name) {
  const manifest = path.join(ROOT, 'node_modules', name, 'package.json');
  if (!existsSync(manifest)) return null;
  return JSON.parse(readFileSync(manifest, 'utf8')).version;
}

async function measure() {
  const bySpecifier = readBundleImports();
  const charged = [...bySpecifier.keys()].filter((s) => !CONSUMER_SUPPLIED.has(packageOf(s)));
  const packages = [...new Set(charged.map(packageOf))].sort();
  const consumers = attributeToSource();

  const total = await weigh(charged, bySpecifier);

  const scopes = [...new Set(packages.map(scopeOf))];
  const scopeMarginal = new Map();
  for (const scope of scopes) {
    const without = await weigh(
      charged.filter((s) => scopeOf(packageOf(s)) !== scope),
      bySpecifier,
    );
    scopeMarginal.set(scope, { raw: total.raw - without.raw, gzip: total.gzip - without.gzip });
  }

  const rows = [];
  for (const name of packages) {
    const mine = charged.filter((s) => packageOf(s) === name);
    const standalone = await weigh(mine, bySpecifier);
    const without = await weigh(
      charged.filter((s) => packageOf(s) !== name),
      bySpecifier,
    );
    const used = [...(consumers.get(name) ?? [])].sort();
    rows.push({
      name,
      version: installedVersion(name),
      specifiers: mine.sort(),
      standalone,
      marginal: { raw: total.raw - without.raw, gzip: total.gzip - without.gzip },
      scope: scopeOf(name),
      consumers: used,
    });
  }
  rows.sort((a, b) => b.marginal.gzip - a.marginal.gzip || a.name.localeCompare(b.name));

  const own = existsSync(BUNDLE)
    ? (() => {
        const bytes = Buffer.concat(bundleFiles().map((file) => readFileSync(file)));
        return { raw: bytes.length, gzip: gzipSync(bytes).length };
      })()
    : { raw: 0, gzip: 0 };

  return {
    own,
    total,
    packages: rows,
    scopes: [...scopeMarginal.entries()]
      .map(([scope, marginal]) => ({ scope, marginal }))
      .sort((a, b) => b.marginal.gzip - a.marginal.gzip),
  };
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

function printTable(result) {
  console.log(
    `\nAuthored code (dist/**/*.js):  ${kb(result.own.gzip)} gzip` +
      `\nDependencies, all together:     ${kb(result.total.gzip)} gzip` +
      `\nA consumer importing everything pays ${kb(result.own.gzip + result.total.gzip)} gzip.\n`,
  );
  const width = Math.max(...result.packages.map((p) => p.name.length));
  console.log(
    `${'package'.padEnd(width)}  ${'marginal'.padStart(9)}  ${'standalone'.padStart(10)}  consumers`,
  );
  for (const row of result.packages) {
    console.log(
      `${row.name.padEnd(width)}  ${kb(row.marginal.gzip).padStart(9)}  ${kb(row.standalone.gzip).padStart(10)}  ${row.consumers.length}`,
    );
  }
  const shared = result.scopes.filter((s) => s.scope.endsWith('/*'));
  if (shared.length > 0) {
    console.log('\nBy scope — what removing the whole family would give back:');
    for (const s of shared) console.log(`  ${s.scope.padEnd(width)}  ${kb(s.marginal.gzip).padStart(9)}`);
  }
}

/**
 * The report is rendered from the *baseline*, never from a live measurement.
 *
 * Measurement has platform jitter: the same tree weighed on macOS and on the CI
 * runner differs by a few bytes, because esbuild and zlib are not the same
 * builds. The numeric check absorbs that with a tolerance. Comparing rendered
 * markdown byte-for-byte against a fresh measurement would not — it made the
 * document read as stale on a runner whose every package was within tolerance,
 * which is a gate failing for a reason that has nothing to do with dependency
 * cost. Rendering from the committed JSON makes this check ask the question it
 * means to ask: is the prose in step with the data it describes.
 */
function renderReport(result) {
  const lines = [];
  lines.push('# What the dependencies cost');
  lines.push('');
  lines.push('**Parent:** [`dependencies.md`](./dependencies.md)');
  lines.push('');
  lines.push(
    '**Generated — do not edit.** `pnpm deps:cost:update` writes this file and',
    '`docs/data/dependency-cost.json` beside it. `pnpm check:dep-cost` fails when the measured',
    'cost moves away from that baseline, so a dependency bump restates its price in the diff.',
  );
  lines.push('');
  lines.push(
    'Every figure is gzipped bytes, tree-shaken to the bindings this package actually imports,',
    'bundled by esbuild with `react` and `react-dom` external. See the header of',
    '[`scripts/analyse-dep-cost.mjs`](../scripts/analyse-dep-cost.mjs) for the method, and why',
    '**marginal** — not standalone — is the number to argue from.',
  );
  lines.push('');
  lines.push('## The shape of it');
  lines.push('');
  lines.push('| | gzip |');
  lines.push('|---|---|');
  lines.push(`| Authored code — every \`.js\` in \`dist/\` | ${kb(result.own.gzip)} |`);
  lines.push(`| Dependencies, all together | ${kb(result.total.gzip)} |`);
  lines.push(`| A consumer importing everything | ${kb(result.own.gzip + result.total.gzip)} |`);
  lines.push('');
  lines.push(
    'That last row is a ceiling, not a toll. `package.json` declares `sideEffects: ["**/*.css"]`,',
    'so a consumer\'s bundler drops the specifiers their imports never reach — someone using only',
    '`Button` pays none of the charting stack. The per-package figures below are what a given',
    'component\'s neighbourhood actually costs, which is why they are worth arguing about',
    'one at a time.',
  );
  lines.push('');
  lines.push('## Per package');
  lines.push('');
  lines.push('| Package | Version | Marginal | Standalone | Used by | Why it is here |');
  lines.push('|---|---|---|---|---|---|');
  for (const row of result.packages) {
    const why = MANIFEST[row.name]?.why ?? '**No stated reason — `check:deps` should have caught this.**';
    const used = row.consumers.length === 0 ? '— (CSS or build surface)' : `${row.consumers.length} file${row.consumers.length === 1 ? '' : 's'}`;
    lines.push(
      `| \`${row.name}\` | ${row.version ?? '—'} | ${kb(row.marginal.gzip)} | ${kb(row.standalone.gzip)} | ${used} | ${why} |`,
    );
  }
  lines.push('');
  const families = result.scopes.filter((s) => s.scope.endsWith('/*') && s.scope !== '@microcharts/*');
  if (families.length > 0) {
    lines.push('## By family');
    lines.push('');
    lines.push(
      'Packages in one scope share internals, so their standalone figures overlap and cannot be',
      'added up. This is the subtraction done once for the whole scope — what dropping the family',
      'would actually return.',
    );
    lines.push('');
    lines.push('| Scope | Marginal |');
    lines.push('|---|---|');
    for (const family of families) lines.push(`| \`${family.scope}\` | ${kb(family.marginal.gzip)} |`);
    lines.push('');
  }
  lines.push('## Where each package is used');
  lines.push('');
  for (const row of result.packages) {
    if (row.consumers.length === 0) continue;
    lines.push(`- \`${row.name}\` — ${row.consumers.map((c) => `\`src/${c}\``).join(', ')}`);
  }
  lines.push('');
  return lines.join('\n');
}

function toBaseline(result) {
  return {
    note: 'Generated by `pnpm deps:cost:update`. The diff in this file is the cost of a dependency change.',
    own: result.own,
    total: result.total,
    packages: Object.fromEntries(
      result.packages.map((row) => [
        row.name,
        {
          version: row.version,
          specifiers: row.specifiers,
          marginal: row.marginal,
          standalone: row.standalone,
          consumers: row.consumers,
        },
      ]),
    ),
    scopes: Object.fromEntries(result.scopes.map((s) => [s.scope, s.marginal])),
  };
}

/** Read a committed baseline back into the shape `renderReport` expects. */
function fromBaseline(baseline) {
  return {
    own: baseline.own,
    total: baseline.total,
    packages: Object.entries(baseline.packages)
      .map(([name, row]) => ({ name, ...row }))
      .sort((a, b) => b.marginal.gzip - a.marginal.gzip || a.name.localeCompare(b.name)),
    scopes: Object.entries(baseline.scopes)
      .map(([scope, marginal]) => ({ scope, marginal }))
      .sort((a, b) => b.marginal.gzip - a.marginal.gzip),
  };
}

const result = await measure();

if (mode === 'list') {
  printTable(result);
  process.exit(0);
}

if (mode === 'update') {
  const recorded = toBaseline(result);
  writeFileSync(BASELINE, `${JSON.stringify(recorded, null, 2)}\n`);
  writeFileSync(REPORT, renderReport(fromBaseline(recorded)));
  printTable(result);
  console.log(`\nWrote ${path.relative(ROOT, BASELINE)} and ${path.relative(ROOT, REPORT)}.`);
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  console.error(
    `${path.relative(ROOT, BASELINE)} is missing. Run \`pnpm deps:cost:update\` and commit it.`,
  );
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));
const problems = [];

for (const row of result.packages) {
  const recorded = baseline.packages[row.name];
  if (!recorded) {
    problems.push(
      `${row.name}: new dependency in the bundle, costing ${kb(row.marginal.gzip)} gzip. ` +
        'Run `pnpm deps:cost:update` and commit the baseline — the diff is the decision.',
    );
    continue;
  }
  if (recorded.version !== row.version) {
    const delta = row.marginal.gzip - recorded.marginal.gzip;
    const direction = delta === 0 ? 'no change in cost' : `${delta > 0 ? '+' : ''}${kb(delta)} gzip`;
    problems.push(
      `${row.name}: ${recorded.version} → ${row.version}, ${direction}. ` +
        'Run `pnpm deps:cost:update` so the upgrade records what it cost.',
    );
    continue;
  }
  const allowed = Math.max(Math.round(recorded.marginal.gzip * TOLERANCE_FRACTION), TOLERANCE_FLOOR);
  if (row.marginal.gzip > recorded.marginal.gzip + allowed) {
    problems.push(
      `${row.name}: marginal cost ${kb(row.marginal.gzip)} gzip exceeds the recorded ` +
        `${kb(recorded.marginal.gzip)} by more than the ${kb(allowed)} tolerance. ` +
        'Either the import surface widened or the package grew; justify it and re-record.',
    );
  }
}

for (const name of Object.keys(baseline.packages)) {
  if (!result.packages.some((row) => row.name === name)) {
    problems.push(
      `${name}: recorded in the baseline but no longer imported by dist/index.js. ` +
        'Run `pnpm deps:cost:update` to drop the row.',
    );
  }
}

if (!existsSync(REPORT)) {
  problems.push(`${path.relative(ROOT, REPORT)} is missing. Run \`pnpm deps:cost:update\`.`);
} else if (readFileSync(REPORT, 'utf8') !== renderReport(fromBaseline(baseline))) {
  problems.push(
    `${path.relative(ROOT, REPORT)} is stale — it does not match ${path.relative(ROOT, BASELINE)}. ` +
      'Run `pnpm deps:cost:update`.',
  );
}

if (problems.length > 0) {
  console.error(`\nDependency cost has moved — ${problems.length} finding(s):\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error('');
  process.exit(1);
}

console.log(
  `Dependency cost unchanged — ${result.packages.length} packages, ${kb(result.total.gzip)} gzip in total.`,
);
