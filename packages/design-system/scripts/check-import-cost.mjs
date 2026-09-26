#!/usr/bin/env node
/**
 * What a consumer pays for the part of the package it imports.
 *
 * ## The gap this fills
 *
 * `check:bundle-size` weighs what the package ships and `check:dep-cost`
 * weighs what each dependency costs when *everything* is imported. Neither
 * asks the question a consumer's build asks: I import `Button`, what arrives?
 * That question had a very bad answer for five releases and no gate noticed.
 *
 * 0.12.0 built `dist/` as one flat file with 131 unannotated module-level
 * calls — `forwardRef`, `recipe`, `createContext`, `displayName` assignments.
 * A bundler cannot prove any of them free of side effects, so it kept every
 * one, and everything each one imports. `import { Button }` bundled Base UI,
 * visx and d3: 515 KB minified. The blog's twelve imports went from 76 KB on
 * 0.7.0 to 526 KB (#301). `sideEffects` could not help, because it works per
 * module and the whole library was one module.
 *
 * ## How it measures
 *
 * Each case is a synthetic consumer entry point, `import { … } from
 * '@rtkelly13/design-system'`, bundled by esbuild through the package's own
 * name — so its `exports` map and its `sideEffects` field decide what is
 * reachable, exactly as they do in a consumer's `node_modules`. It is
 * minified, `react` and `react-dom` are external (the consumer already pays
 * for those), and every imported binding is referenced so the thing being
 * weighed is not itself shaken out.
 *
 * Two assertions per case:
 *
 *   - **A ceiling on minified bytes.** Minified output is deterministic across
 *     platforms, where gzip is not (`check:bundle-size` explains the 149-byte
 *     macOS/Linux spread that bit it) — so the ceiling is on the number that
 *     does not move under you. gzip is printed alongside, for reading.
 *   - **Packages the case must not contain.** A byte ceiling says "too big";
 *     this says *why* — `Button` pulling in `@base-ui/react` is a structural
 *     regression whatever it weighs, and the failure names it.
 *
 * And one assertion on the build: **no `export *` in the ESM output.** esbuild
 * shakes a star re-export and so cannot see the problem, but a Next App
 * Router server component can: importing the blog's twelve names from a star
 * barrel shipped every client module in the package to the browser under
 * Turbopack (+699 KB, against +46 KB named). `scripts/expand-star-exports.mjs`
 * writes the names at build time; this fails if one survives.
 *
 * ## A ratchet
 *
 * Ceilings are the measurement on the day this landed plus about 3%, the
 * same shape as every other budget here. A change that grows a case past its
 * ceiling fails; if the growth is intended, raise the number in the same
 * commit and say why in `CASES`. When a change makes a case cheaper, lower the
 * ceiling with it.
 *
 *   node scripts/check-import-cost.mjs                     verify
 *   node scripts/check-import-cost.mjs --list              print every case
 *   node scripts/check-import-cost.mjs --package <dir>     measure another build
 *                                                          of the package, e.g.
 *                                                          an unpacked tarball
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import esbuild from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const packageArg = process.argv.indexOf('--package');
const PACKAGE_DIR = packageArg === -1 ? ROOT : path.resolve(process.argv[packageArg + 1] ?? '');
const listing = process.argv.includes('--list');

/** Everything a component that renders nothing interactive has no business carrying. */
const HEAVY = [
  '@base-ui/react',
  '@floating-ui/dom',
  '@visx/shape',
  '@visx/axis',
  'd3-scale',
  'd3-shape',
  '@microcharts/react',
  '@tanstack/react-table',
  '@tanstack/react-virtual',
  '@tanstack/react-hotkeys',
];

/**
 * The imports measured, each with a ceiling in minified bytes.
 *
 * Measured on the per-module build that closed #301, with esbuild 0.27.7,
 * against the same cases run over the 0.12.0 tarball (`--package`):
 *
 *   tokens   `LEVELS`, `isThemeLevel` — data and one predicate, so not even
 *            the class-merging engine. 2,128 B; 0.12.0: 527,609 B.
 *   button   one simple component. Almost all of it is `tailwind-variants`
 *            (≈ 39 KB minified), which every recipe-built component pays and
 *            `docs/dependencies.md` already names as the one cost a consumer
 *            cannot decline. 42,102 B; 0.12.0: 527,520 B.
 *   select   one Base UI control: the listbox, its positioning and the
 *            floating store. Base UI is the expected weight; visx, d3 and
 *            TanStack are not. 187,892 B; 0.12.0: 527,519 B.
 *   chart    `BarChart` — visx and d3, and not Base UI. 112,154 B;
 *            0.12.0: 527,520 B.
 *   blog     the twelve names `rtkelly13/blog` imports, from #301. 61,190 B;
 *            0.12.0: 528,311 B; 0.7.0: ≈ 76 KB.
 *
 * Every ceiling is that measurement plus about 3%.
 */
const CASES = [
  {
    name: 'tokens',
    imports: ['LEVELS', 'isThemeLevel'],
    maxBytes: 2_200,
    forbid: [...HEAVY, 'tailwind-variants', 'lucide-react'],
  },
  {
    name: 'button',
    imports: ['Button'],
    maxBytes: 43_400,
    forbid: [...HEAVY, 'lucide-react'],
  },
  {
    name: 'select',
    imports: ['Select'],
    maxBytes: 193_500,
    forbid: HEAVY.filter((name) => !['@base-ui/react', '@floating-ui/dom'].includes(name)),
  },
  {
    name: 'chart',
    imports: ['BarChart'],
    maxBytes: 115_500,
    forbid: HEAVY.filter((name) => !['@visx/shape', '@visx/axis', 'd3-scale', 'd3-shape'].includes(name)),
  },
  {
    name: 'blog',
    imports: [
      'Card',
      'Tag',
      'Button',
      'PageTitle',
      'SectionContainer',
      'NoteBlock',
      'TLDR',
      'Pagination',
      'PageHeader',
      'BracketText',
      'LEVELS',
      'isThemeLevel',
    ],
    maxBytes: 63_000,
    forbid: HEAVY,
  },
];

const packageOf = (input) => {
  const match = /.*node_modules\/((?:@[^/]+\/)?[^/]+)\//.exec(input.split(path.sep).join('/'));
  return match ? match[1] : null;
};

async function measure({ imports }) {
  const contents =
    `import { ${imports.join(', ')} } from '@rtkelly13/design-system';\n` +
    `globalThis.__keep(${imports.join(', ')});\n`;
  const result = await esbuild.build({
    stdin: { contents, resolveDir: PACKAGE_DIR, loader: 'js' },
    bundle: true,
    minify: true,
    write: false,
    metafile: true,
    format: 'esm',
    platform: 'browser',
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    define: { 'process.env.NODE_ENV': '"production"' },
    logLevel: 'silent',
  });
  const output = Buffer.from(result.outputFiles[0].contents);
  // `inputs` lists every file esbuild *read*; only the ones that contributed
  // bytes are in the consumer's bundle.
  const contributed = Object.values(result.metafile.outputs)[0].inputs;
  const bytesBy = new Map();
  for (const [input, { bytesInOutput }] of Object.entries(contributed)) {
    if (bytesInOutput === 0) continue;
    const name = packageOf(input) ?? '@rtkelly13/design-system';
    bytesBy.set(name, (bytesBy.get(name) ?? 0) + bytesInOutput);
  }
  return { bytes: output.length, gzip: gzipSync(output).length, bytesBy };
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

if (!existsSync(path.join(PACKAGE_DIR, 'package.json'))) {
  console.error(`No package.json in ${PACKAGE_DIR}.`);
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(path.join(PACKAGE_DIR, 'package.json'), 'utf8'));
if (manifest.name !== '@rtkelly13/design-system') {
  console.error(`${PACKAGE_DIR} is ${manifest.name}, not @rtkelly13/design-system.`);
  process.exit(1);
}
if (PACKAGE_DIR === ROOT && !existsSync(path.join(ROOT, 'dist', 'index.mjs'))) {
  console.error('dist/index.mjs is missing — run `pnpm build` first.');
  process.exit(1);
}

const problems = [];
for (const testCase of CASES) {
  let measured;
  try {
    measured = await measure(testCase);
  } catch (error) {
    problems.push(`${testCase.name}: could not be bundled — ${error.message.split('\n')[0]}`);
    continue;
  }
  const { bytes, gzip, bytesBy } = measured;
  const over = bytes > testCase.maxBytes;
  const leaked = testCase.forbid.filter((name) => bytesBy.has(name));

  if (listing || over || leaked.length) {
    const status = over || leaked.length ? 'FAIL' : 'ok  ';
    console.log(
      `${status} ${testCase.name.padEnd(7)} ${bytes.toLocaleString('en-US').padStart(9)} B min (ceiling ${testCase.maxBytes.toLocaleString('en-US')} B), ` +
        `${kb(gzip)} gzip — { ${testCase.imports.join(', ')} }`,
    );
    if (listing) {
      const rows = [...bytesBy.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
      for (const [name, size] of rows) console.log(`       ${kb(size).padStart(9)}  ${name}`);
    }
  }
  if (over) {
    problems.push(
      `${testCase.name}: { ${testCase.imports.join(', ')} } bundles to ${bytes.toLocaleString('en-US')} B ` +
        `minified, over its ${testCase.maxBytes.toLocaleString('en-US')} B ceiling ` +
        `(+${(bytes - testCase.maxBytes).toLocaleString('en-US')} B).`,
    );
  }
  if (leaked.length) {
    problems.push(
      `${testCase.name}: { ${testCase.imports.join(', ')} } pulls in ` +
        `${leaked.map((name) => `${name} (${kb(bytesBy.get(name))})`).join(', ')}, which it does not use. ` +
        'Something module-level is keeping it: an unannotated call, a side-effectful ' +
        'statement, or an import that should be local to the component that needs it.',
    );
  }
}

const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
const starred = walk(path.join(PACKAGE_DIR, 'dist'))
  .filter((file) => file.endsWith('.mjs') && /^export \* from /m.test(readFileSync(file, 'utf8')))
  .map((file) => path.relative(PACKAGE_DIR, file));
if (starred.length) {
  problems.push(
    `${starred.join(', ')} still re-export with \`export *\`. A server component importing that ` +
      'barrel ships every client module behind it to the browser; the build should have named ' +
      'them (scripts/expand-star-exports.mjs).',
  );
}
if (listing) {
  console.log(`\nESM barrels: ${starred.length ? `${starred.length} still use export *` : 'every re-export named'}`);
}

if (problems.length) {
  console.error(`\nImport cost exceeded — ${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(
    '\nThis is what a consumer pays for importing only these names. If the growth is ' +
      'intended, raise the ceiling in scripts/check-import-cost.mjs and justify it there.',
  );
  process.exit(1);
}

console.log(`Import cost OK — ${CASES.length} consumer import sets within their ceilings, every ESM re-export named.`);
