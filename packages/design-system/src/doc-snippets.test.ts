// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let fixture: string;

beforeAll(() => {
  mkdirSync(path.join(ROOT, 'temp'), { recursive: true });
  fixture = mkdtempSync(path.join(ROOT, 'temp', 'doc-snippets-'));
  for (const directory of ['scripts', 'api', 'src/theme']) {
    mkdirSync(path.join(fixture, directory), { recursive: true });
  }
  for (const file of ['scripts/check-doc-snippets.mjs', 'api/index.d.ts', 'src/theme/levels.ts']) {
    copyFileSync(path.join(ROOT, file), path.join(fixture, file));
  }
  symlinkSync(path.join(ROOT, 'node_modules'), path.join(fixture, 'node_modules'), 'dir');
  for (const file of ['DESIGN.md', 'AGENTS.md', 'CONTEXT.md']) {
    writeFileSync(path.join(fixture, file), '');
  }
});

afterAll(() => {
  if (fixture) rmSync(fixture, { recursive: true, force: true });
});

describe('documentation literal prop validation', () => {
  it.each([
    ['single quotes', "'pink'", 1],
    ['double quotes', '"pink"', 1],
    ['valid single quotes', "'tertiary'", 0],
  ] as const)('checks %s against the public Button variant union', (_name, value, status) => {
    writeFileSync(path.join(fixture, 'README.md'), `\`\`\`tsx\n<Button variant=${value}>GO</Button>\n\`\`\`\n`);
    const result = spawnSync(process.execPath, ['scripts/check-doc-snippets.mjs'], {
      cwd: fixture,
      encoding: 'utf8',
    });
    expect(result.status, result.stderr).toBe(status);
    if (status === 1) expect(result.stderr).toContain('must be one of: primary, secondary, tertiary, inverse, default');
    else expect(result.stdout).toContain('Doc snippets OK');
  });
});
