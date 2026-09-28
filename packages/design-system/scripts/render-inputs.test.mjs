import { describe, expect, it } from 'vitest';
import { classify, jobBody, jobCommands, reachableScripts } from './render-inputs.mjs';

const P = 'packages/design-system/';
const row = (file) => `100644 ${'0'.repeat(40)}\t${file}`;

describe('reachableScripts', () => {
  const sources = {
    [`${P}scripts/render-inputs.mjs`]: '',
    [`${P}scripts/check-visual-coverage.mjs`]: "import { REPO_ROOT } from './repo-root.mjs';",
    [`${P}scripts/repo-root.mjs`]: '',
    [`${P}scripts/check-lockfile.mjs`]: '',
    [`${P}scripts/authored-classes.mjs`]: '',
    [`${P}scripts/release-train.mjs`]: "import './release-train-checks.mjs';",
    [`${P}scripts/release-train-checks.mjs`]: '',
    [`${P}eslint.config.mjs`]: "import { authoredClasses } from './scripts/authored-classes.mjs';",
    [`${P}docs/notes.mjs`]: "import '../scripts/release-train.mjs';",
  };
  const reach = reachableScripts({
    files: Object.keys(sources),
    read: (file) => sources[file],
    visualCommands: ['check:visual-coverage'],
    packageScripts: { 'check:visual-coverage': 'node scripts/check-visual-coverage.mjs' },
    jobText: 'run: node packages/design-system/scripts/check-lockfile.mjs',
  });

  it('follows the job’s gates through their imports', () => {
    expect(reach).toContain(`${P}scripts/check-visual-coverage.mjs`);
    expect(reach).toContain(`${P}scripts/repo-root.mjs`);
  });

  it('counts a script named in the job or its actions, and the hash’s own logic', () => {
    expect(reach).toContain(`${P}scripts/check-lockfile.mjs`);
    expect(reach).toContain(`${P}scripts/render-inputs.mjs`);
  });

  it('counts a script a counted file imports', () => {
    expect(reach).toContain(`${P}scripts/authored-classes.mjs`);
  });

  it('leaves out scripts only an excluded file imports', () => {
    expect(reach).not.toContain(`${P}scripts/release-train.mjs`);
    expect(reach).not.toContain(`${P}scripts/release-train-checks.mjs`);
  });
});

describe('classify', () => {
  it('is default-deny: anything no rule names counts', () => {
    const { counted, skipped } = classify(
      [
        row(`${P}src/Button.tsx`),
        row(`${P}some-new-config.json`),
        row('.github/workflows/ci.yml'),
        row(`${P}docs/ci.md`),
        row(`${P}CHANGELOG.md`),
        row('packages/design-system-report/src/cli.ts'),
        row(`${P}scripts/release-train.mjs`),
      ],
      new Set(),
    );
    expect(counted.map((r) => r.split('\t')[1])).toEqual([
      `${P}src/Button.tsx`,
      `${P}some-new-config.json`,
      '.github/workflows/ci.yml',
    ]);
    expect(skipped.map(([file]) => file)).toHaveLength(4);
  });

  it('does not treat Markdown under src as prose', () => {
    expect(classify([row(`${P}src/stories/Intro.md`)], new Set()).counted).toHaveLength(1);
  });
});

describe('jobCommands', () => {
  const workflow = [
    'jobs:',
    '  unit:',
    '    steps:',
    '      - run: pnpm check:api',
    '  visual:',
    '    steps:',
    '      - run: pnpm build-storybook',
    '      - run: pnpm test:a11y',
    '  verify:',
    '    steps: []',
  ].join('\n');

  it('reads only the named job', () => {
    expect(jobCommands(jobBody(workflow, 'visual'))).toEqual(['build-storybook', 'test:a11y']);
  });

  it('fails loudly on a renamed job rather than hashing nothing', () => {
    expect(() => jobBody(workflow, 'screenshots')).toThrow(/no job/);
  });
});
