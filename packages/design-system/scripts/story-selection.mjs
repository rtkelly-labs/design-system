/**
 * Which asserted stories can a change reach? The logic behind
 * `select-stories.mjs`, kept free of I/O so it can be tested.
 *
 * The `visual` job re-screenshots and re-scans every asserted story on every
 * pull request. Replaying merged PRs against the story graph says most of that
 * work re-confirms stories nothing touched. This module answers the narrower
 * question per change, and **nothing acts on the answer yet**: CI runs it in
 * shadow mode, beside the full suites, so the answer can be checked against
 * what the suites actually found before anything is skipped on its word.
 *
 * ## Two graphs, unioned
 *
 * - **What Vite bundled** — `storybook-static/preview-stats.json`, written by
 *   `storybook build --stats-json` (the graph Chromatic's TurboSnap reads).
 *   Every module lists the modules that import it; inverted, that is the
 *   story's closure as the browser actually receives it, dynamic imports and
 *   MDX included.
 * - **What the source says** — the relative, dynamic and CSS `@import`
 *   specifiers in `src/` and `.storybook/`, and bare self-imports resolved
 *   through the package's `exports` map.
 *
 * Neither is complete alone, which is why both are used. The bundle graph has
 * no CSS `@import` edges (`theme.css` and `prose.css` are folded into
 * `styles.css` by Tailwind before Vite sees them) and no JSON (the tokens a
 * specimen story imports through `@rtkelly13/design-system/tokens/...`). The
 * source graph cannot see what a plugin or a virtual module adds. A file in
 * either closure counts.
 *
 * ## Rules before the graph
 *
 * Most files that break an estimate are not in any graph: the lockfile, a
 * workflow, a snapshot, a row in `CASES`. `classifyChange` handles those first,
 * each with a stated reason, and anything no rule names falls through to
 * **global** — every story — so a file this forgets costs a re-run in
 * enforcement, never a skip.
 */

import path from 'node:path';
import { jobBody, jobCommands } from './render-inputs.mjs';

export const PKG = 'packages/design-system/';

/* ------------------------------------------------------------------ *
 * Graphs
 * ------------------------------------------------------------------ */

/** Drop a query or hash suffix Vite adds (`?raw`, `?inline`, `#x`). */
const bare = (id) => id.replace(/[?#].*$/, '');

/**
 * Forward edges from `preview-stats.json`, as repo paths. Ids are relative to
 * the package (`./src/x.tsx`); `node_modules` and virtual modules are dropped,
 * because the lockfile rule covers the first and the second have no file.
 */
export function graphFromStats(stats, pkg = PKG) {
  const toRepo = (id) => {
    const clean = bare(id);
    if (!clean.startsWith('./') || clean.includes('node_modules')) return null;
    return path.posix.normalize(pkg + clean.slice(2));
  };
  const graph = new Map();
  for (const mod of stats.modules ?? []) {
    const to = toRepo(mod.id);
    if (!to) continue;
    if (!graph.has(to)) graph.set(to, new Set());
    for (const reason of mod.reasons ?? []) {
      const from = toRepo(reason.moduleName ?? '');
      if (!from) continue;
      if (!graph.has(from)) graph.set(from, new Set());
      graph.get(from).add(to);
    }
  }
  return graph;
}

const SPECIFIER = [
  /(?:^|[^\w.])(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]/g, // import x from '…', export … from '…'
  /(?:^|[^\w.])import\s*['"]([^'"]+)['"]/g, // import '…'
  /(?:^|[^\w.])import\s*\(\s*['"]([^'"]+)['"]\s*\)/g, // import('…')
  /@import\s+(?:url\()?['"]([^'"]+)['"]/g, // CSS @import
];

/** `url(…)` in a stylesheet: fonts and images the sheet loads. */
const CSS_URL = /url\(\s*['"]?(\.{1,2}\/[^'")\s]+)['"]?\s*\)/g;

const CANDIDATES = ['', '.ts', '.tsx', '.js', '.mjs', '.jsx', '.mdx', '.css', '.json', '/index.ts', '/index.tsx'];

/**
 * Forward edges from source text. `files` is every tracked repo path; `exports`
 * is the package's `exports` map, for `@rtkelly13/design-system/<subpath>`.
 */
export function graphFromSource(files, read, { pkg = PKG, name = '@rtkelly13/design-system', exports = {} } = {}) {
  const tracked = new Set(files);
  const resolve = (from, spec) => {
    let base;
    if (spec.startsWith('.')) base = path.posix.normalize(path.posix.join(path.posix.dirname(from), bare(spec)));
    else if (spec === name || spec.startsWith(`${name}/`)) {
      const sub = `.${spec.slice(name.length)}` || '.';
      const target = exports[sub === '.' ? '.' : sub];
      const file = typeof target === 'string' ? target : target?.import ?? target?.default;
      if (!file) return null;
      base = path.posix.normalize(pkg + file.replace(/^\.\//, ''));
      // `dist/` is build output; the source of `./styles.css` is `src/styles.css`.
      base = base.replace(`${pkg}dist/`, `${pkg}src/`);
    } else return null;
    // `./x.js` in TypeScript names `./x.ts`.
    const stems = [base, base.replace(/\.js$/, '')];
    for (const stem of stems) for (const ext of CANDIDATES) if (tracked.has(stem + ext)) return stem + ext;
    return null;
  };
  const graph = new Map();
  for (const file of files) {
    if (!file.startsWith(`${pkg}src/`) && !file.startsWith(`${pkg}.storybook/`)) continue;
    if (!/\.(m?[jt]sx?|mdx|css)$/.test(file)) continue;
    const out = new Set();
    const text = read(file);
    const patterns = file.endsWith('.css') ? [...SPECIFIER, CSS_URL] : SPECIFIER;
    for (const re of patterns) for (const [match, spec] of text.matchAll(re)) {
      // `import type` and `export type` are erased before anything renders; the
      // bundle graph never has them, and `typecheck` is what judges them.
      if (/^\W?(import|export)\s+type\s/.test(match)) continue;
      const hit = resolve(file, spec);
      if (hit) out.add(hit);
    }
    graph.set(file, out);
  }
  return graph;
}

/** Every file either side of an edge — a font is a target and never a key. */
export function graphNodes(graph) {
  const out = new Set(graph.keys());
  for (const tos of graph.values()) for (const to of tos) out.add(to);
  return out;
}

export function mergeGraphs(...graphs) {
  const out = new Map();
  for (const graph of graphs) for (const [from, tos] of graph) {
    if (!out.has(from)) out.set(from, new Set());
    for (const to of tos) out.get(from).add(to);
  }
  return out;
}

export function closure(graph, start) {
  const seen = new Set();
  const queue = [start];
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    for (const next of graph.get(file) ?? []) queue.push(next);
  }
  return seen;
}

/** What every story renders inside: the preview, its manager-side config, and their closures. */
export const GLOBAL_ROOTS = ['.storybook/preview.ts', '.storybook/main.ts', '.storybook/docs.css'].map((f) => PKG + f);

export function globalFiles(graph) {
  const out = new Set();
  for (const root of GLOBAL_ROOTS) for (const file of closure(graph, root)) out.add(file);
  return out;
}

/** `{ id: importPath }` from `index.json` → `{ id: closure }` for the asserted ids. */
export function storyClosures(graph, index, asserted, pkg = PKG) {
  const out = {};
  for (const id of asserted) {
    const entry = index[id];
    if (!entry) continue;
    out[id] = closure(graph, path.posix.normalize(pkg + entry.importPath.replace(/^\.\//, '')));
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * The specs: case rows versus harness
 * ------------------------------------------------------------------ */

/** Comments and whitespace do not change what a spec runs. */
const normalise = (text) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '$1')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Split a spec into its case lists and the rest. Each named `const NAME = [`
 * block runs to the first line that closes it at column 0. Rows are its
 * top-level `{ … }` objects, identified by their normalised text; `id` and
 * `snapshot` are read off each.
 */
export function parseCases(text, lists) {
  const lines = text.split('\n');
  const rows = [];
  const keep = [];
  for (let i = 0; i < lines.length; i++) {
    const open = lists.find((name) => new RegExp(`^const ${name}\\b[^=]*=\\s*[\\[{]`).test(lines[i]));
    if (!open) {
      keep.push(lines[i]);
      continue;
    }
    let j = i + 1;
    while (j < lines.length && !/^[\]}]/.test(lines[j])) j++;
    const body = lines.slice(i + 1, j).join('\n').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
    let depth = 0;
    let start = -1;
    for (let k = 0; k < body.length; k++) {
      if (body[k] === '{') {
        if (depth === 0) start = k;
        depth++;
      } else if (body[k] === '}') {
        depth--;
        if (depth === 0 && start >= 0) {
          const row = body.slice(start, k + 1);
          rows.push({
            list: open,
            id: /id:\s*'([^']+)'/.exec(row)?.[1] ?? null,
            snapshot: /snapshot:\s*'([^']+)'/.exec(row)?.[1] ?? null,
            key: normalise(row),
          });
        }
      }
    }
    // Rows inside an object-shaped list (`KNOWN`) have no braces; the whole
    // body is then the row, so any change to it is one change.
    if (/\{\s*$/.test(lines[i]) && !/\[/.test(lines[i])) rows.push({ list: open, id: null, snapshot: null, key: normalise(body) });
    keep.push(`<${open}>`);
    i = j;
  }
  return { rows, harness: normalise(keep.join('\n')) };
}

export const SPEC_LISTS = {
  [`${PKG}tests/visual.spec.ts`]: ['CASES', 'INTERACTIONS', 'MOBILE_CASES'],
  [`${PKG}tests/a11y.spec.ts`]: ['DATATABLE_CASES', 'OPEN_POPUPS', 'KNOWN'],
};

/** Every story id a spec asserts: rows, plus `const id = '…'` in a standalone test. */
export function assertedIds(...specs) {
  const out = new Set();
  for (const text of specs) {
    for (const [, id] of text.matchAll(/\bid:\s*'([a-z0-9-]+--[a-z0-9-]+)'/g)) out.add(id);
    for (const [, id] of text.matchAll(/const id = '([a-z0-9-]+--[a-z0-9-]+)'/g)) out.add(id);
  }
  return out;
}

/**
 * What a spec edit reaches: every story when the harness moved, otherwise the
 * ids of rows added or changed. A removed row runs nothing. A `KNOWN` edit is
 * a tolerance for the whole suite, so it is harness.
 */
export function specChange(base, head, lists) {
  const a = parseCases(base ?? '', lists);
  const b = parseCases(head ?? '', lists);
  if (a.harness !== b.harness) return { global: true, ids: [] };
  const before = new Set(a.rows.map((row) => row.key));
  const changed = b.rows.filter((row) => !before.has(row.key));
  if (changed.some((row) => row.list === 'KNOWN' || !row.id)) return { global: true, ids: [] };
  return { global: false, ids: [...new Set(changed.map((row) => row.id))] };
}

/* ------------------------------------------------------------------ *
 * package.json: only the fields that change what is installed or resolved
 * ------------------------------------------------------------------ */

const RESOLUTION_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies', 'pnpm', 'overrides', 'exports', 'type'];

/**
 * The package scripts a job reaches: the ones it runs, and every `pnpm <name>`
 * those invoke in turn. `build-storybook` calling `tokens:build` makes the
 * second as much a part of the job as the first.
 */
export function scriptClosure(scripts, roots) {
  const seen = new Set();
  const queue = [...roots];
  while (queue.length) {
    const name = queue.pop();
    if (seen.has(name) || !(name in scripts)) continue;
    seen.add(name);
    for (const [, next] of String(scripts[name]).matchAll(/\bpnpm\s+(?:run\s+)?([\w:-]+)/g)) queue.push(next);
  }
  return seen;
}

/**
 * Whether a `package.json` edit can reach a story: a resolution field, or the
 * body of a script the `visual` job runs — named by `visualScripts`, which the
 * caller reads from `ci.yml` on both sides of the change. Any other script is
 * tooling. Returns the reason, or null.
 */
export function packageJsonChange(base, head, visualScripts = []) {
  const parse = (text) => {
    try {
      return JSON.parse(text ?? '{}');
    } catch {
      return null; // unparseable is a change
    }
  };
  const [a, b] = [parse(base), parse(head)];
  if (!a || !b) return 'package.json: unparseable on one side';
  const fields = (json) => JSON.stringify(RESOLUTION_FIELDS.map((field) => json[field] ?? null));
  if (fields(a) !== fields(b)) return 'package.json: a dependency, exports or resolution field';
  const reach = new Set([
    ...scriptClosure(a.scripts ?? {}, visualScripts),
    ...scriptClosure(b.scripts ?? {}, visualScripts),
  ]);
  const moved = [...reach].filter((name) => (a.scripts ?? {})[name] !== (b.scripts ?? {})[name]).sort();
  return moved.length ? `package.json: a script the visual job runs (${moved.join(', ')})` : null;
}

/** The `pnpm` scripts `ci.yml`'s `visual` job runs, or null when it has none. */
export function visualScripts(workflow) {
  try {
    return workflow ? jobCommands(jobBody(workflow, 'visual')) : [];
  } catch {
    return [];
  }
}

/**
 * `ci.yml` with the `jobs:` block cut out and comment-only lines dropped.
 * Top-level `env`, `defaults`, `permissions` and `concurrency` are inherited
 * by every job, `visual` included, so a change here reaches it.
 */
export function workflowOutsideJobs(text) {
  const out = [];
  let inJobs = false;
  for (const line of (text ?? '').split('\n')) {
    if (/^jobs:\s*$/.test(line)) { inJobs = true; continue; }
    if (inJobs && /^\S/.test(line) && !/^#/.test(line)) inJobs = false;
    if (inJobs || /^\s*(#.*)?$/.test(line)) continue;
    out.push(line.replace(/\s+#.*$/, '').trimEnd());
  }
  return out.join('\n');
}

/* ------------------------------------------------------------------ *
 * The rules
 * ------------------------------------------------------------------ */

/** Files that change what every story renders or how every story is judged. */
const GLOBAL_PATHS = [
  [/^pnpm-(lock|workspace)\.yaml$/, 'the dependency tree'],
  [/^\.gitignore$/, "Tailwind's source detection honours .gitignore"],
  [/^\.github\/actions\//, 'an action the suites run under'],
  [new RegExp(`^${PKG}src/.*\\.css$`), 'a stylesheet: Tailwind compiles one sheet for every story'],
  [new RegExp(`^${PKG}\\.storybook/`), 'Storybook configuration'],
  [new RegExp(`^${PKG}tests/(?!__snapshots__/)(?!(visual|a11y)\\.spec\\.ts$)`), 'the test harness'],
  [new RegExp(`^${PKG}(playwright\\.config\\.ts|serve\\.json|tsconfig\\.json)$`), 'suite or server configuration'],
];

/** Files that reach no gated story, each with the reason. */
const INERT_PATHS = [
  [new RegExp(`^${PKG}docs/`), 'prose'],
  [new RegExp(`^${PKG}src/(.*\\.test\\.tsx?|test-setup\\.ts)$`), 'a unit test or its set-up; Vitest runs it, no story imports it'],
  [new RegExp(`^${PKG}[^/]+\\.md$`), 'prose'],
  [new RegExp(`^${PKG}scripts/`), 'tooling; the index gates run in full whatever is selected'],
  [new RegExp(`^${PKG}(api|skills|terminal)/`), 'published artefacts no story imports'],
  [new RegExp(`^${PKG}(vitest\\.config\\.mts|eslint\\.config\\.mjs|knip\\.json|licenses\\.baseline\\.json|tsup\\.config\\.ts|LICENSE)$`), 'unit, lint or package-build configuration'],
  [new RegExp(`^${PKG}playwright\\.walkthrough\\.config\\.ts$`), 'the walkthrough, which is not a gate'],
  [/^packages\/design-system-report\//, 'the second package, which depends on this one'],
  [/^(README\.md|LICENSE|vercel\.json|reference\/|docs\/)/, 'repository metadata and prose'],
  // Release train, drift, walkthrough, snapshot commands: none runs the gated
  // suites, so none can change their verdict. `ci.yml` is in GLOBAL_PATHS.
  [/^\.github\//, 'a workflow that does not run the gated suites'],
];

/**
 * Classify one changed path. `ctx` carries the closures, the global set, the
 * snapshot map and readers for the base and head text of a file.
 *
 * Returns `{ kind: 'global' | 'stories' | 'none', reason, ids }`.
 */
export function classifyChange(change, ctx) {
  const file = change.path;
  const global = (reason) => ({ kind: 'global', reason, ids: [] });
  const none = (reason) => ({ kind: 'none', reason, ids: [] });

  if (file === `${PKG}package.json` || file === 'package.json') {
    const wf = '.github/workflows/ci.yml';
    const scripts = [...new Set([...visualScripts(ctx.base(wf)), ...visualScripts(ctx.head(wf))])];
    const why = packageJsonChange(ctx.base(file), ctx.head(file), scripts);
    return why ? global(why) : none('package.json: no resolution field, and no script the visual job runs');
  }
  if (SPEC_LISTS[file]) {
    const result = specChange(ctx.base(file), ctx.head(file), SPEC_LISTS[file]);
    if (result.global) return global(`${path.posix.basename(file)}: harness or tolerance, not a case row`);
    return result.ids.length
      ? { kind: 'stories', reason: `${path.posix.basename(file)}: case rows added or changed`, ids: result.ids }
      : none(`${path.posix.basename(file)}: case rows removed or reordered only`);
  }
  const snap = new RegExp(`^${PKG}tests/__snapshots__/[^/]+/(.+)$`).exec(file);
  if (snap) {
    const ids = ctx.snapshots.get(snap[1]) ?? [];
    return ids.length
      ? { kind: 'stories', reason: 'a baseline of that story', ids }
      : none('a baseline no case names');
  }
  // `ci.yml` holds four jobs and only `visual` runs the suites. An edit to the
  // others — the usual CI change — cannot move a screenshot.
  if (file === '.github/workflows/ci.yml') {
    const job = (text) => {
      try {
        return text ? jobBody(text, 'visual') : null;
      } catch {
        return null; // no `visual` job on that side: treat as changed
      }
    };
    if (workflowOutsideJobs(ctx.base(file)) !== workflowOutsideJobs(ctx.head(file))) {
      return global('ci.yml: a workflow-level key every job inherits (env, defaults, permissions, concurrency, on)');
    }
    const [a, b] = [job(ctx.base(file)), job(ctx.head(file))];
    return a !== null && a === b ? none('ci.yml: the `visual` job is unchanged') : global('ci.yml: the `visual` job changed');
  }
  for (const [re, why] of GLOBAL_PATHS) if (re.test(file)) return global(why);
  if (ctx.global.has(file)) return global('inside the preview every story renders in');

  const ids = Object.entries(ctx.closures).filter(([, set]) => set.has(file)).map(([id]) => id);
  if (ids.length) return { kind: 'stories', reason: 'in the import closure of these stories', ids };

  for (const [re, why] of INERT_PATHS) if (re.test(file)) return none(why);
  // In a graph and reached by no asserted story: an orphan, or a story the
  // suites do not assert. Only a file the graph *knows* can be ruled out this
  // way; one it has never seen — an asset loaded some way neither graph
  // follows — falls through to default-deny below.
  if (ctx.nodes?.has(file)) return none('in the graph, and in no asserted story’s closure');
  // Default-deny, `src/` and `.storybook/` included: a path no rule names and
  // no graph holds reaches everything.
  return global('no rule names this path — default-deny');
}

/** Map snapshot filename → story ids, from the rows of both sides of the change. */
export function snapshotMap(...visualSpecs) {
  const out = new Map();
  for (const text of visualSpecs) {
    for (const row of parseCases(text ?? '', SPEC_LISTS[`${PKG}tests/visual.spec.ts`]).rows) {
      if (!row.snapshot || !row.id) continue;
      out.set(row.snapshot, [...new Set([...(out.get(row.snapshot) ?? []), row.id])]);
    }
  }
  return out;
}

/**
 * The selection for a whole change set. A rename is judged on both paths.
 * `image` is `{ current, verified }`: a runner image other than the one the
 * base was verified on reaches every story; unknown is reported, not assumed.
 */
export function selectStories(changes, ctx, { asserted, image = {} } = {}) {
  const decisions = [];
  for (const change of changes) {
    for (const p of [change.path, change.oldPath].filter(Boolean)) {
      decisions.push({ path: p, status: change.status, ...classifyChange({ ...change, path: p }, ctx) });
    }
  }
  if (image.current && image.verified && image.current !== image.verified) {
    decisions.push({ path: '(runner image)', status: 'M', kind: 'global', reason: `${image.verified} → ${image.current}`, ids: [] });
  }
  const all = decisions.some((d) => d.kind === 'global');
  const ids = all ? [...asserted] : [...new Set(decisions.flatMap((d) => d.ids))].filter((id) => asserted.has(id));
  return { all, ids: ids.sort(), total: asserted.size, decisions };
}

/**
 * The detector. Given the Playwright JSON reports, every failed test and
 * whether its story was selected. A **miss** is a failure the selection would
 * have skipped — the only outcome that makes enforcement unsafe. A failure
 * whose title names no story id is reported as unmapped and counts as a miss,
 * because it cannot be shown not to be one.
 */
export function detect(selection, reports) {
  const failures = [];
  const walk = (suite) => {
    for (const spec of suite.specs ?? []) for (const test of spec.tests ?? []) {
      if (test.status !== 'unexpected' && test.status !== 'flaky') continue;
      const id = /^([a-z0-9-]+--[a-z0-9-]+)/.exec(spec.title)?.[1] ?? null;
      failures.push({ title: spec.title, project: test.projectName, status: test.status, id });
    }
    for (const child of suite.suites ?? []) walk(child);
  };
  for (const report of reports) for (const suite of report.suites ?? []) walk(suite);
  const selected = new Set(selection.ids);
  const judged = failures.map((f) => ({ ...f, selected: selection.all || (f.id !== null && selected.has(f.id)) }));
  return { failures: judged, misses: judged.filter((f) => !f.selected && f.status === 'unexpected') };
}

/** Where two graphs disagree about a story's source files — the cross-check. */
export function compareClosures(a, b, only = (file) => file.includes('/src/')) {
  const out = [];
  for (const id of Object.keys(a)) {
    const left = new Set([...(a[id] ?? [])].filter(only));
    const right = new Set([...(b[id] ?? [])].filter(only));
    const onlyA = [...left].filter((f) => !right.has(f));
    const onlyB = [...right].filter((f) => !left.has(f));
    if (onlyA.length || onlyB.length) out.push({ id, onlyA, onlyB });
  }
  return out;
}
