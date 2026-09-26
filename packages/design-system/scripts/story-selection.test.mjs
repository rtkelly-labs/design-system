import { describe, expect, it } from 'vitest';
import {
  PKG,
  assertedIds,
  classifyChange,
  compareClosures,
  detect,
  globalFiles,
  graphFromSource,
  graphNodes,
  graphFromStats,
  mergeGraphs,
  packageJsonChange,
  parseCases,
  scriptClosure,
  workflowOutsideJobs,
  selectStories,
  snapshotMap,
  specChange,
  storyClosures,
} from './story-selection.mjs';

const P = (f) => PKG + f;

describe('graphFromStats', () => {
  it('inverts importers into forward edges, as repo paths, dropping node_modules and virtual ids', () => {
    const graph = graphFromStats({
      modules: [
        { id: './src/components/Button.tsx', reasons: [{ moduleName: './src/stories/Button.stories.tsx' }] },
        { id: './src/lib/cn.ts?raw', reasons: [{ moduleName: './src/components/Button.tsx' }] },
        { id: './../../node_modules/react/index.js', reasons: [{ moduleName: './src/components/Button.tsx' }] },
        { id: '/virtual:/x.js', reasons: [] },
      ],
    });
    expect([...graph.get(P('src/stories/Button.stories.tsx'))]).toEqual([P('src/components/Button.tsx')]);
    expect([...graph.get(P('src/components/Button.tsx'))]).toEqual([P('src/lib/cn.ts')]);
  });
});

describe('graphFromSource', () => {
  const src = {
    [P('src/stories/Specimen.stories.tsx')]: [
      "import { Card } from '../components/Card';",
      "import type { Props } from '../components/Types';",
      "import tokens from '@rtkelly13/design-system/tokens/midnight.tokens.json';",
      "const Lazy = () => import('../components/Lazy');",
    ].join('\n'),
    [P('src/components/Card.tsx')]: "export { cn } from '../lib/cn.js';",
    [P('src/components/Types.ts')]: '',
    [P('src/components/Lazy.tsx')]: '',
    [P('src/lib/cn.ts')]: '',
    [P('src/styles.css')]: '@import "./theme.css";\n@font-face { src: url("./fonts/Mono.woff2") format("woff2"); }',
    [P('src/fonts/Mono.woff2')]: '',
    [P('src/theme.css')]: '',
    [P('tokens/palette.midnight.tokens.json')]: '{}',
  };
  const graph = graphFromSource(Object.keys(src), (f) => src[f], {
    exports: { './tokens/midnight.tokens.json': './tokens/palette.midnight.tokens.json' },
  });
  const story = [...graph.get(P('src/stories/Specimen.stories.tsx'))];

  it('follows relative, dynamic and self-package imports', () => {
    expect(story).toContain(P('src/components/Card.tsx'));
    expect(story).toContain(P('src/components/Lazy.tsx'));
    expect(story).toContain(P('tokens/palette.midnight.tokens.json'));
  });

  it('skips type-only imports, which nothing renders', () => {
    expect(story).not.toContain(P('src/components/Types.ts'));
  });

  it('resolves `.js` specifiers to TypeScript and follows CSS @import', () => {
    expect([...graph.get(P('src/components/Card.tsx'))]).toEqual([P('src/lib/cn.ts')]);
    expect([...graph.get(P('src/styles.css'))]).toEqual([P('src/theme.css'), P('src/fonts/Mono.woff2')]);
  });

  it('knows a font as a node though it is never a key', () => {
    expect(graph.has(P('src/fonts/Mono.woff2'))).toBe(false);
    expect(graphNodes(graph).has(P('src/fonts/Mono.woff2'))).toBe(true);
  });
});

describe('parseCases and specChange', () => {
  const spec = (rows, harness = "test('x', () => {});") =>
    [
      "import { test } from '@playwright/test';",
      'const CASES: readonly VisualCase[] = [',
      ...rows,
      '];',
      harness,
    ].join('\n');
  const LISTS = ['CASES'];

  it('reads id and snapshot off each row, multi-line rows included', () => {
    const { rows } = parseCases(
      spec([
        "  { id: 'a--one', snapshot: 'one.png' },",
        '  // a comment between rows',
        '  {',
        "    id: 'b--two',",
        "    snapshot: 'two.png',",
        '  },',
      ]),
      LISTS,
    );
    expect(rows.map((r) => [r.id, r.snapshot])).toEqual([
      ['a--one', 'one.png'],
      ['b--two', 'two.png'],
    ]);
  });

  it('maps an added or changed row to its story, and ignores a removed one', () => {
    const base = spec(["  { id: 'a--one', snapshot: 'one.png' },", "  { id: 'b--two', snapshot: 'two.png' },"]);
    const head = spec(["  { id: 'a--one', snapshot: 'one.png', fullPage: true },", "  { id: 'c--new', snapshot: 'new.png' },"]);
    expect(specChange(base, head, LISTS)).toEqual({ global: false, ids: ['a--one', 'c--new'] });
  });

  it('treats a comment edit as no change, and a harness edit as every story', () => {
    const base = spec(["  { id: 'a--one', snapshot: 'one.png' },"]);
    expect(specChange(base, base.replace("test('x'", "// why\ntest('x'"), LISTS)).toEqual({ global: false, ids: [] });
    expect(specChange(base, spec(["  { id: 'a--one', snapshot: 'one.png' },"], "test('y', () => {});"), LISTS).global).toBe(true);
  });

  it('treats a tolerance list as harness: it applies to every story', () => {
    const a11y = (n) => `const KNOWN: Record<string, number> = {\n  'color-contrast': ${n},\n};\ntest('x');`;
    expect(specChange(a11y(1), a11y(2), ['KNOWN']).global).toBe(true);
  });

  it('collects every asserted id, including a standalone test’s', () => {
    expect([...assertedIds("{ id: 'a--one' }", "const id = 'b--two';")]).toEqual(['a--one', 'b--two']);
  });

  it('maps a snapshot to every row that names it', () => {
    const map = snapshotMap(spec(["  { id: 'a--one', snapshot: 'one.png' },"]), spec(["  { id: 'a--moved', snapshot: 'one.png' },"]));
    expect(map.get('one.png')).toEqual(['a--one', 'a--moved']);
  });
});

describe('packageJsonChange', () => {
  const pkg = (over) =>
    JSON.stringify({
      version: '0.1.0',
      dependencies: { r: '1' },
      scripts: { 'build-storybook': 'pnpm tokens:build && storybook build', 'tokens:build': 'node a.mjs', 'release:train': 'node r.mjs' },
      ...over,
    });
  const base = pkg({});
  const visual = ['build-storybook'];

  it('ignores a version bump and a script the visual job does not reach', () => {
    expect(packageJsonChange(base, pkg({ version: '0.2.0' }), visual)).toBeNull();
    const scripts = { ...JSON.parse(base).scripts, 'release:train': 'node r.mjs --dry-run' };
    expect(packageJsonChange(base, pkg({ scripts }), visual)).toBeNull();
  });

  it('reaches every story for a dependency', () => {
    expect(packageJsonChange(base, pkg({ dependencies: { r: '2' } }), visual)).toMatch(/dependency/);
  });

  it('reaches every story for a script the visual job runs, directly or through another', () => {
    const direct = { ...JSON.parse(base).scripts, 'build-storybook': 'storybook build --quiet' };
    expect(packageJsonChange(base, pkg({ scripts: direct }), visual)).toMatch(/build-storybook/);
    const nested = { ...JSON.parse(base).scripts, 'tokens:build': 'node b.mjs' };
    expect(packageJsonChange(base, pkg({ scripts: nested }), visual)).toMatch(/tokens:build/);
  });

  it('follows `pnpm x` and `pnpm run x` through the scripts', () => {
    expect([...scriptClosure({ a: 'pnpm run b', b: 'pnpm c && echo', c: 'x', d: 'y' }, ['a'])].sort()).toEqual(['a', 'b', 'c']);
  });
});

describe('workflowOutsideJobs', () => {
  it('keeps what every job inherits, and drops the jobs and the comments', () => {
    const wf = ['name: CI', '# why', 'env:', '  A: 1 # inline', 'jobs:', '  visual:', '    steps: []', 'concurrency: x'].join('\n');
    expect(workflowOutsideJobs(wf)).toBe(['name: CI', 'env:', '  A: 1', 'concurrency: x'].join('\n'));
  });
});

describe('classifyChange and selectStories', () => {
  const graph = mergeGraphs(
    new Map([
      [P('.storybook/preview.ts'), new Set([P('src/components/ThemeProvider.tsx')])],
      [P('src/stories/Button.stories.tsx'), new Set([P('src/components/Button.tsx')])],
      [P('src/stories/Card.stories.tsx'), new Set([P('src/components/Card.tsx'), P('src/components/Button.tsx')])],
      [P('src/components/Orphan.tsx'), new Set()],
    ]),
  );
  const index = {
    'button--default': { importPath: './src/stories/Button.stories.tsx' },
    'card--default': { importPath: './src/stories/Card.stories.tsx' },
  };
  const asserted = new Set(Object.keys(index));
  const files = {};
  const ctx = {
    graph,
    nodes: graphNodes(graph),
    closures: storyClosures(graph, index, asserted),
    global: globalFiles(graph),
    snapshots: new Map([['button-default.png', ['button--default']]]),
    base: (f) => files[`base:${f}`] ?? null,
    head: (f) => files[`head:${f}`] ?? null,
  };
  const pick = (...paths) => selectStories(paths.map((path) => ({ status: 'M', path })), ctx, { asserted });

  it('selects the stories whose closure holds the file', () => {
    expect(pick(P('src/components/Card.tsx'))).toMatchObject({ all: false, ids: ['card--default'] });
    expect(pick(P('src/components/Button.tsx')).ids).toEqual(['button--default', 'card--default']);
  });

  it('selects everything for the preview, a stylesheet, the lockfile or the visual job', () => {
    for (const file of [P('src/components/ThemeProvider.tsx'), P('src/theme.css'), 'pnpm-lock.yaml', P('tests/story-ready.ts')]) {
      expect(pick(file).all).toBe(true);
    }
  });

  it('maps a baseline to its story', () => {
    expect(pick(P('tests/__snapshots__/visual.spec.ts/button-default.png')).ids).toEqual(['button--default']);
  });

  it('selects nothing for prose, tooling, other workflows, or a component no story renders', () => {
    const sel = pick(P('docs/ci.md'), P('scripts/release-train.mjs'), '.github/workflows/release-train.yml', P('src/components/Orphan.tsx'));
    expect(sel).toMatchObject({ all: false, ids: [] });
    expect(sel.decisions.every((d) => d.kind === 'none')).toBe(true);
  });

  it('is default-deny inside src too: a file no graph holds reaches everything', () => {
    expect(pick(P('src/fonts/New.woff2')).decisions[0]).toMatchObject({ kind: 'global', reason: expect.stringMatching(/default-deny/) });
    expect(pick(P('src/components/Button.test.tsx')).all).toBe(false);
  });

  it('is default-deny for a path no rule names', () => {
    expect(pick(P('some-new-config.yaml')).decisions[0]).toMatchObject({ kind: 'global', reason: expect.stringMatching(/default-deny/) });
  });

  it('reads ci.yml by job: an edit outside `visual` selects nothing', () => {
    const wf = (lint) => `jobs:\n  gates:\n    steps:\n      - run: ${lint}\n  visual:\n    steps:\n      - run: pnpm test:visual\n`;
    files['base:.github/workflows/ci.yml'] = wf('pnpm lint');
    files['head:.github/workflows/ci.yml'] = wf('pnpm check:lint-budget');
    expect(pick('.github/workflows/ci.yml').all).toBe(false);
    files['head:.github/workflows/ci.yml'] = wf('pnpm lint').replace('test:visual', 'test:visual --retries 3');
    expect(pick('.github/workflows/ci.yml').all).toBe(true);
  });

  it('reaches every story when a workflow-level key changes, since visual inherits it', () => {
    const wf = (env) => `name: CI\nenv:\n  NODE_OPTIONS: ${env}\njobs:\n  visual:\n    steps:\n      - run: pnpm test:visual\n`;
    files['base:.github/workflows/ci.yml'] = wf('--x');
    files['head:.github/workflows/ci.yml'] = wf('--y');
    expect(pick('.github/workflows/ci.yml').decisions[0].reason).toMatch(/workflow-level/);
    files['head:.github/workflows/ci.yml'] = wf('--x').replace('name: CI', '# a comment\nname: CI');
    expect(pick('.github/workflows/ci.yml').all).toBe(false);
  });

  it('reads the visual job’s scripts from ci.yml when judging package.json', () => {
    files['base:.github/workflows/ci.yml'] = files['head:.github/workflows/ci.yml'] =
      'jobs:\n  visual:\n    steps:\n      - run: pnpm build-storybook\n';
    files[`base:${P('package.json')}`] = JSON.stringify({ scripts: { 'build-storybook': 'a', other: 'b' } });
    files[`head:${P('package.json')}`] = JSON.stringify({ scripts: { 'build-storybook': 'a', other: 'c' } });
    expect(pick(P('package.json')).all).toBe(false);
    files[`head:${P('package.json')}`] = JSON.stringify({ scripts: { 'build-storybook': 'z', other: 'b' } });
    expect(pick(P('package.json')).all).toBe(true);
  });

  it('judges a rename on both paths, and a changed runner image as everything', () => {
    const renamed = selectStories([{ status: 'R', path: P('docs/x.md'), oldPath: P('src/components/Card.tsx') }], ctx, { asserted });
    expect(renamed.ids).toEqual(['card--default']);
    expect(selectStories([], ctx, { asserted, image: { current: 'ubuntu24-2', verified: 'ubuntu24-1' } }).all).toBe(true);
  });
});

describe('detect', () => {
  const report = {
    suites: [
      {
        specs: [
          { title: 'card--default — midnight', tests: [{ projectName: 'chromium', status: 'unexpected' }] },
          { title: 'button--default — sketch', tests: [{ projectName: 'chromium', status: 'unexpected' }] },
          { title: 'the focus-guard exclusion still reports', tests: [{ projectName: 'chromium', status: 'unexpected' }] },
          { title: 'tag--row', tests: [{ projectName: 'mobile', status: 'flaky' }] },
          { title: 'badge--default', tests: [{ projectName: 'chromium', status: 'expected' }] },
        ],
      },
    ],
  };

  it('calls a failure outside the selection a miss, and an unmapped failure a miss too', () => {
    const { failures, misses } = detect({ all: false, ids: ['card--default'] }, [report]);
    expect(failures).toHaveLength(4);
    expect(misses.map((m) => m.title)).toEqual(['button--default — sketch', 'the focus-guard exclusion still reports']);
  });

  it('never misses when everything was selected, and never counts a flake as a miss', () => {
    expect(detect({ all: true, ids: [] }, [report]).misses).toEqual([]);
  });
});

describe('compareClosures', () => {
  it('lists the source files one graph sees and the other does not', () => {
    const diff = compareClosures(
      { a: new Set([P('src/x.ts'), P('src/y.ts')]) },
      { a: new Set([P('src/x.ts'), P('src/z.ts')]) },
    );
    expect(diff).toEqual([{ id: 'a', onlyA: [P('src/y.ts')], onlyB: [P('src/z.ts')] }]);
  });
});
