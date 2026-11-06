import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { beforeAll, describe, expect, it } from 'vitest';

import { authoredClasses } from '../scripts/authored-classes.mjs';

/**
 * Tests for the lint rules themselves.
 *
 * These are the only enforcement of two rules — address a colour by its role,
 * and do not name a class that does not exist — since the counting ratchet they
 * replaced is gone. A lint rule with no test is one you find out about on the
 * day it quietly stops matching, and both of these have already surprised me
 * once: my first probe of the classname rule injected a fake class into
 * `className={x.trim()}`, saw silence, and I read it as passing. It was a code
 * shape the rule cannot traverse.
 *
 * Deliberately run through the real `ESLint` API against the repo's own
 * `eslint.config.mjs` rather than against a hand-built config. Most of what can
 * break here is configuration, not rule logic: the file globs that keep
 * `levels.ts` out of scope, `cssConfigPath` pointing at the plural filename,
 * `recipe` being in the traversed function list, and the whitelist being derived
 * rather than typed. A synthetic config would test none of that.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let eslint: ESLint;

/*
 * Warm the linter here rather than inside the first test.
 *
 * `new ESLint()` is cheap; the first `lintText()` is not — it resolves the flat
 * config, loads `typescript-eslint` and both local plugins, and builds the
 * stylesheet index `no-custom-classname` reads. That cost used to land inside
 * whichever test ran first, which took ~2.3s alone and over 9s under full-suite
 * parallel load, against a 5s default timeout. The test failed on four separate
 * branches and passed in isolation every time (#173).
 *
 * Paying it in a hook with its own generous timeout makes the tests measure the
 * rules rather than the machine's spare capacity.
 */
beforeAll(async () => {
  eslint = new ESLint({ cwd: ROOT });
  await eslint.lintText('export const _warm = 1;\n', {
    filePath: path.join(ROOT, 'src/components/__lint_warmup__.tsx'),
    warnIgnored: false,
  });
}, 60_000);

/** Lint a fragment as if it were a component, which is what the config scopes to. */
async function lintComponent(code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, {
    filePath: path.join(ROOT, 'src/components/__lint_fixture__.tsx'),
    warnIgnored: false,
  });
  return (result?.messages ?? []).map((m) => `${m.ruleId}: ${m.message}`);
}

const wrap = (body: string) => `export const C = () => (${body});\n`;

describe('no-colour-literals', () => {
  it.each([
    ['hex literal', `<div style={{ color: '#ff0000' }} />`, 'Hex literals'],
    ['raw palette utility', `<div className="bg-zinc-900" />`, 'Literal Tailwind palette utilities'],
    ['legacy alias', `<div className="text-brutalist-cyan" />`, 'Legacy brutalist-* colour aliases'],
    ['dark: colour variant', `<div className="dark:bg-surface-base" />`, 'dark: colour variants'],
  ])('rejects a %s', async (_name, body, label) => {
    const messages = await lintComponent(wrap(body));
    expect(messages.join('\n')).toContain(label);
  });

  it('accepts a role', async () => {
    expect(await lintComponent(wrap(`<div className="bg-surface-raised text-content-muted" />`))).toEqual([]);
  });

  it('reads inside a template literal, where composed class strings live', async () => {
    const messages = await lintComponent(
      `const x = 'a';\nexport const C = () => <div className={\`bg-zinc-900 \${x}\`} />;\n`,
    );
    expect(messages.join('\n')).toContain('Literal Tailwind palette utilities');
  });

  /**
   * The counting ratchet this replaced flagged `text-white` inside
   * `const FORBIDDEN = /…text-white…/` — the regex in `Input.test.tsx` that
   * asserts a component emits no palette class. It counted the test that
   * enforces the rule as breaking it. Six of its 200 were this.
   */
  it('does not mistake a regex literal for a class', async () => {
    expect(
      await lintComponent(`export const FORBIDDEN = /brutalist-|text-white|bg-zinc-900|#000000/;\n`),
    ).toEqual([]);
  });

  it('reports every occurrence in one string, not just the first', async () => {
    const messages = await lintComponent(wrap(`<div className="bg-zinc-900 text-zinc-400" />`));
    expect(messages).toHaveLength(2);
  });
});

describe('no-custom-classname', () => {
  it('rejects a utility that exists in no namespace', async () => {
    const messages = await lintComponent(wrap(`<div className="bg-totallyfake-500" />`));
    expect(messages.join('\n')).toContain('bg-totallyfake-500');
  });

  it('rejects an authored-looking class that no stylesheet defines', async () => {
    const messages = await lintComponent(wrap(`<div className="docs-imaginary" />`));
    expect(messages.join('\n')).toContain('docs-imaginary');
  });

  /**
   * The whitelist is derived from the stylesheets. Without that this rule flags
   * every real docs-chrome class as loudly as a dead one — 51 of them — which is
   * what made it look unusable here.
   */
  it('accepts a class the stylesheets really define', async () => {
    const real = authoredClasses().find((c) => c.startsWith('docs-'));
    expect(real).toBeDefined();
    expect(await lintComponent(wrap(`<div className="${real}" />`))).toEqual([]);
  });

  /**
   * `recipe` is this repo's name for `tv`, and it is not in the plugin's default
   * function list. Without it configured the rule never looks inside a recipe —
   * which is where most class strings in this package live, so the rule would
   * appear to pass while checking almost nothing.
   */
  it('looks inside a recipe(), not only at JSX attributes', async () => {
    const messages = await lintComponent(
      `import { recipe } from '../lib/recipe';\nexport const s = recipe({ base: 'docs-imaginary' });\n`,
    );
    expect(messages.join('\n')).toContain('docs-imaginary');
  });

  /**
   * `cn` is traversed where a bare method call is not, which is the reason
   * `Card.tsx` composes with `cn(className)` rather than `className.trim()`.
   */
  it('looks inside cn()', async () => {
    const messages = await lintComponent(
      `import { cn } from '../lib/recipe';\nexport const C = () => <div className={cn('docs-imaginary')} />;\n`,
    );
    expect(messages.join('\n')).toContain('docs-imaginary');
  });
});

describe('scope', () => {
  /**
   * `src/theme/levels.ts` is all hex by design: ladder rule 4 makes every level
   * colour a literal so `check:contrast` can audit 200 role pairs without a
   * browser. If the config ever widens to cover it, the rule reports the design
   * as the bug and the obvious way to quieten it deletes what makes the ladder
   * auditable.
   */
  it('does not lint the theme definition', async () => {
    const [result] = await eslint.lintText(`export const L = { ground: '#0a0a1a' };\n`, {
      filePath: path.join(ROOT, 'src/theme/levels.ts'),
      warnIgnored: false,
    });
    expect(result?.messages ?? []).toEqual([]);
  });
});
