import { describe, expect, it } from 'vitest';
import { jobBody, jobCommands, reachableScripts, verdictEntry } from './render-inputs.mjs';

const P = 'packages/design-system/';

describe('reachableScripts', () => {
  const sources = {
    [`${P}scripts/render-inputs.mjs`]: '',
    [`${P}scripts/check-visual-coverage.mjs`]: "import { REPO_ROOT } from './repo-root.mjs';",
    [`${P}scripts/repo-root.mjs`]: '',
    [`${P}scripts/check-lockfile.mjs`]: '',
    [`${P}scripts/authored-classes.mjs`]: '',
    [`${P}scripts/release-train.mjs`]: "import './release-train-checks.mjs';",
    [`${P}scripts/release-train-checks.mjs`]: '',
    [`${P}.storybook/main.ts`]: "import { authoredClasses } from '../scripts/authored-classes.mjs';",
    [`${P}eslint.config.mjs`]: "import './scripts/eslint-token-rule.mjs';",
    [`${P}scripts/eslint-token-rule.mjs`]: '',
    [`${P}docs/notes.mjs`]: "import '../scripts/release-train.mjs';",
  };
  const reach = reachableScripts({
    files: Object.keys(sources),
    read: (file) => sources[file],
    visualCommands: ['check:visual-coverage'],
    packageScripts: { 'check:visual-coverage': 'pnpm coverage:core', 'coverage:core': 'node scripts/check-visual-coverage.mjs' },
    jobText: 'run: node packages/design-system/scripts/check-lockfile.mjs',
  });

  it('follows the job’s gates through the pnpm scripts they call and their imports', () => {
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

  it('leaves out scripts only an inert file imports — prose, lint configuration', () => {
    expect(reach).not.toContain(`${P}scripts/release-train.mjs`);
    expect(reach).not.toContain(`${P}scripts/release-train-checks.mjs`);
    expect(reach).not.toContain(`${P}scripts/eslint-token-rule.mjs`);
  });
});

describe('verdictEntry', () => {
  const ci = [
    'name: CI',
    'jobs:',
    '  lint:',
    '    steps:',
    '      - run: pnpm check:governance',
    '  visual:',
    '    steps:',
    '      - run: pnpm build-storybook',
  ].join('\n');
  const pkg = (over = {}) =>
    JSON.stringify({ version: '0.12.0', dependencies: { react: '19' }, scripts: { 'build-storybook': 'storybook build', lint: 'eslint' }, ...over });
  const texts = { '.github/workflows/ci.yml': ci, [`${P}package.json`]: pkg() };
  const entry = (file, over = {}) =>
    verdictEntry(file, 'blob', { read: (f) => ({ ...texts, ...over })[f], reachable: new Set([`${P}scripts/check-visual-coverage.mjs`]) });

  it('is default-deny: anything no rule names counts', () => {
    expect(entry(`${P}some-new-config.json`)).toBe('blob');
    expect(entry('scripts/assemble-deploy.mjs')).toBe('blob');
  });

  it('counts every component and story, not only the asserted closures — the index gates read them all', () => {
    expect(entry(`${P}src/components/Orphan.tsx`)).toBe('blob');
    expect(entry(`${P}src/stories/Intro.md`)).toBe('blob');
    expect(entry(`${P}src/components/Button.test.tsx`)).toBeNull();
  });

  it('leaves out prose, other workflows, the second package and scripts the job cannot reach', () => {
    for (const file of [`${P}docs/ci.md`, `${P}CHANGELOG.md`, '.github/workflows/publish-package.yml', 'packages/design-system-report/src/cli.ts', `${P}scripts/release-train.mjs`]) {
      expect(entry(file), file).toBeNull();
    }
    expect(entry(`${P}scripts/check-visual-coverage.mjs`)).toBe('blob');
  });

  it('keys package.json on resolution fields and visual scripts, not the version', () => {
    const base = entry(`${P}package.json`);
    expect(entry(`${P}package.json`, { [`${P}package.json`]: pkg({ version: '0.13.0' }) })).toBe(base);
    expect(entry(`${P}package.json`, { [`${P}package.json`]: pkg({ scripts: { 'build-storybook': 'storybook build', lint: 'eslint --fix' } }) })).toBe(base);
    expect(entry(`${P}package.json`, { [`${P}package.json`]: pkg({ dependencies: { react: '20' } }) })).not.toBe(base);
    expect(entry(`${P}package.json`, { [`${P}package.json`]: pkg({ scripts: { 'build-storybook': 'storybook build --quiet' } }) })).not.toBe(base);
  });

  it('keys ci.yml on the workflow-level keys and the visual job, not the other jobs', () => {
    const base = entry('.github/workflows/ci.yml');
    const other = ci.replace('pnpm check:governance', 'pnpm check:docs');
    const visual = ci.replace('pnpm build-storybook', 'pnpm build-storybook --quiet');
    const env = ci.replace('name: CI', 'name: CI\nenv:\n  A: 1');
    expect(entry('.github/workflows/ci.yml', { '.github/workflows/ci.yml': other })).toBe(base);
    expect(entry('.github/workflows/ci.yml', { '.github/workflows/ci.yml': visual })).not.toBe(base);
    expect(entry('.github/workflows/ci.yml', { '.github/workflows/ci.yml': env })).not.toBe(base);
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
