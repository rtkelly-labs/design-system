import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { lintSource, main } from './dsLint';

describe('lintSource', () => {
  it('runs both families by default, and one when asked', () => {
    const source = '.a { font-size: 10px; } <p className="text-sm bg-red-500" />';
    const all = lintSource('a.tsx', source).findings.map((f) => f.family);
    expect(all).toContain('type');
    expect(lintSource('a.tsx', source, ['type']).findings.every((f) => f.family === 'type')).toBe(true);
  });

  it('carries the fix with each finding', () => {
    const [finding] = lintSource('a.css', '.a { font-weight: 650; }', ['type']).findings;
    expect(finding).toMatchObject({ file: 'a.css', line: 1, ruleId: 'cssWeight' });
    expect(finding.fix).toContain('--ds-weight-');
  });
});

describe('main', () => {
  let dir = '';
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });
  const tree = (files: Record<string, string>) => {
    dir = mkdtempSync(path.join(tmpdir(), 'ds-lint-'));
    for (const [name, text] of Object.entries(files)) {
      mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
      writeFileSync(path.join(dir, name), text);
    }
    return dir;
  };
  const run = (...argv: string[]) => {
    const out: string[] = [];
    const code = main(argv, (line) => out.push(line), (line) => out.push(line));
    return { code, out: out.join('\n') };
  };

  it('exits 0 on a clean tree', () => {
    const root = tree({ 'app.css': '.a { font-size: var(--ds-type-ui); }' });
    expect(run(root).code).toBe(0);
  });

  it('exits 1 on any finding, because a consumer’s budget is zero', () => {
    const root = tree({ 'app.css': '.a { font: 10px var(--ds-font-mono); }' });
    const { code, out } = run('--only', 'type', root);
    expect(code).toBe(1);
    expect(out).toContain('[type/cssShorthand]');
  });

  it('skips node_modules and build output', () => {
    const root = tree({ 'node_modules/x/a.css': '.a { font-size: 9px; }', 'dist/a.css': '.a { font-size: 9px; }' });
    expect(run(root).code).toBe(0);
  });

  it('fails an exception with no reason, and lists one with a reason', () => {
    const ok = tree({ 'a.css': '.a { font-size: 11px; } /* ds-allow-type: GitHub chip parity */' });
    const listed = run('--exceptions', ok);
    expect(listed.code).toBe(0);
    expect(listed.out).toContain('GitHub chip parity');
    rmSync(ok, { recursive: true, force: true });
    const bare = tree({ 'a.css': '.a { font-size: 11px; } /* ds-allow-type: */' });
    expect(run(bare).code).toBe(1);
  });

  it('refuses every inline exception when they are turned off, reason or not', () => {
    const root = tree({ 'a.css': '.a { font-size: 11px; } /* ds-allow-type: GitHub chip parity */' });
    const { code, out } = run('--no-inline-exceptions', root);
    expect(code).toBe(1);
    expect(out).toContain('ds-allow-type: is not accepted here');
  });

  it('excuses a finding recorded in the exceptions file, and nothing else', () => {
    const root = tree({ 'web/a.css': '.a { font-size: 11px; }\n.b { font-weight: 650; }' });
    const file = path.join(root, 'exceptions.json');
    const rel = path.relative(process.cwd(), path.join(root, 'web/a.css')).split(path.sep).join('/');
    writeFileSync(file, JSON.stringify([{ file: rel, match: 'font-size: 11px', reason: 'GitHub chip parity' }]));
    const { code, out } = run('--only', 'type', '--exceptions-file', file, root);
    expect(code).toBe(1);
    expect(out).toContain('font-weight: 650');
    expect(out).not.toContain('font-size: 11px  [');
  });

  it('fails an exceptions-file entry with no reason, or one that excuses nothing', () => {
    const root = tree({ 'a.css': '.a { font-size: var(--ds-type-ui); }' });
    const file = path.join(root, 'exceptions.json');
    writeFileSync(
      file,
      JSON.stringify([
        { file: 'gone.css', match: 'font-size: 9px', reason: 'old' },
        { file: 'a.css', match: 'x', reason: '' },
      ]),
    );
    const { code, out } = run('--exceptions-file', file, path.join(root, 'a.css'));
    expect(code).toBe(1);
    expect(out).toContain('excuses nothing any more');
    expect(out).toContain('needs a reason');
  });

  it('rejects an unknown family and a missing target', () => {
    expect(() => run('--only', 'colour', '.')).toThrow(/--only takes/);
    expect(run().code).toBe(2);
  });
});
