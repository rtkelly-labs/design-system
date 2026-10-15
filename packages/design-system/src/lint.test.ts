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
}, 180_000);

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
}, 30_000);

describe('no-hand-brackets', () => {
  const RULE = 'brackets/no-hand-brackets';
  const IMPORT = `import { BracketText } from './BracketText';\n`;
  let fixing: ESLint;

  beforeAll(() => {
    fixing = new ESLint({ cwd: ROOT, fix: true });
  });

  /** `eslint --fix` to a fixpoint, as `pnpm lint --fix` runs it; returns the output and what is still reported. */
  async function fix(code: string) {
    const [result] = await fixing.lintText(code, {
      filePath: path.join(ROOT, 'src/components/__lint_fixture__.tsx'),
      warnIgnored: false,
    });
    const left = (result?.messages ?? []).filter((m) => m.ruleId === RULE).length;
    return { output: result?.output ?? code, left };
  }
  const component = (body: string) => `export const C = () => ${body};\n`;

  /*
   * Every way to write the whitespace beside a bracket is the same label. The
   * expected output is exact: the fix is a codemod, so it is pinned like one.
   */
  it.each([
    ['a plain space', `<p>[ PAGE ]</p>`],
    ['a tab', `<p>[\tPAGE\t]</p>`],
    ['several spaces', `<p>[   PAGE   ]</p>`],
    ['&nbsp;', `<p>[&nbsp;PAGE&nbsp;]</p>`],
    ['decimal and hex entities', `<p>[&#160;PAGE&#xA0;]</p>`],
    ['named Unicode-space entities', `<p>[&thinsp;PAGE&ensp;]</p>`],
    ['a literal U+00A0', `<p>[ PAGE ]</p>`],
    ['thin and narrow no-break spaces', `<p>[ PAGE ]</p>`],
    ['zero-width and ideographic spaces', `<p>[​PAGE　]</p>`],
    ['a byte-order mark and word joiner', `<p>[﻿PAGE⁠]</p>`],
    ['mixed spellings', `<p>[ &nbsp; PAGE&#32; ]</p>`],
  ])('fixes JSX text bracketed with %s', async (_name, body) => {
    expect(await fix(component(body))).toEqual({ output: IMPORT + component('<p><BracketText>PAGE</BracketText></p>'), left: 0 });
  });

  it.each([
    ['a label around an expression', `<p>[ {title} ]</p>`, `<p><BracketText>{title}</BracketText></p>`],
    ['two labels in one run, text kept', `<p>go [ A ] or [&nbsp;B&nbsp;] now</p>`, `<p>go <BracketText>A</BracketText> or <BracketText>B</BracketText> now</p>`],
    ['a label across lines', `<p>\n  [ {title} ]\n</p>`, `<p>\n  <BracketText>{title}</BracketText>\n</p>`],
    ['a nested element', `<p>[ <b>X</b> ]</p>`, `<p><BracketText><b>X</b></BracketText></p>`],
    ['a string child', `<p>{'[ PAGE ]'}</p>`, `<p><BracketText>PAGE</BracketText></p>`],
    ['a string with \\u00a0 escapes', `<p>{'[\\u00a0PAGE\\u00a0]'}</p>`, `<p><BracketText>PAGE</BracketText></p>`],
    ['a string with \\xa0 and \\u{a0}', `<p>{'[\\xa0PAGE\\u{a0}]'}</p>`, `<p><BracketText>PAGE</BracketText></p>`],
    ['a label that needs quoting', `<p>{'[ A & B ]'}</p>`, `<p><BracketText>{'A & B'}</BracketText></p>`],
    ['both branches of a conditional', `<p>{x ? '[ A ]' : '[\\u00a0B\\u00a0]'}</p>`, `<p>{x ? <BracketText>A</BracketText> : <BracketText>B</BracketText>}</p>`],
    ['one branch of a conditional', `<p>{x ? '[ A ]' : 'b'}</p>`, `<p>{x ? <BracketText>A</BracketText> : 'b'}</p>`],
    ['the right of &&', `<p>{x && '[ A ]'}</p>`, `<p>{x && <BracketText>A</BracketText>}</p>`],
    ['a template split by an interpolation', '<p>{`[\\u00a0${n} RESULTS\\u00a0]`}</p>', '<p><BracketText>{`${n} RESULTS`}</BracketText></p>'],
    ['a template that is only an interpolation', '<p>{`[\\u00a0${title}\\u00a0]`}</p>', '<p><BracketText>{title}</BracketText></p>'],
    ['a fragment', `<>[ A ]</>`, `<><BracketText>A</BracketText></>`],
    ['brackets inside BracketText', `<BracketText>[ A ]</BracketText>`, `<BracketText>A</BracketText>`],
    ['padding inside BracketText', `<BracketText>&nbsp;A </BracketText>`, `<BracketText>A</BracketText>`],
  ])('fixes %s', async (_name, body, fixed) => {
    const head = `const x = true, n = 2, title = '';\n`;
    const imported = body.startsWith('<BracketText>') ? `${IMPORT}${head}` : head;
    const { output, left } = await fix(`${imported}${component(body)}`);
    expect({ output, left }).toEqual({ output: `${IMPORT}${head}${component(fixed)}`, left: 0 });
  });

  it('merges into an existing import, and imports after a directive', async () => {
    expect((await fix(`import { BRACKETED } from './BracketText';\n${component('<p>[ A ]</p>')}`)).output).toBe(
      `import { BRACKETED, BracketText } from './BracketText';\n${component('<p><BracketText>A</BracketText></p>')}`,
    );
    expect((await fix(`'use client';\n${component('<p>[ A ]</p>')}`)).output).toBe(
      `'use client';\n${IMPORT}${component('<p><BracketText>A</BracketText></p>')}`,
    );
  });

  it('adds to a multi-line import on its own line', async () => {
    expect((await fix(`import {\n  BRACKETED,\n} from './BracketText';\n${component('<p>[ A ]</p>')}`)).output).toBe(
      `import {\n  BRACKETED,\n  BracketText,\n} from './BracketText';\n${component('<p><BracketText>A</BracketText></p>')}`,
    );
  });

  it('reports an attribute value but leaves it: whether the prop takes a node is a type question', async () => {
    const code = component(`<Card title="[ PAGE ]" />`);
    expect(await fix(code)).toEqual({ output: code, left: 1 });
  });

  it.each([
    ['no whitespace', `<p>[x]</p>`],
    ['an empty pair', `<p>[ ]</p>`],
    ['whitespace on one side only', `<p>[ PAGE]</p>`],
    ['an entity that is not whitespace', `<p>[&amp;PAGE&amp;]</p>`],
    ['a string that is not rendered', `<p>{xs.join('[ 1, 2 ]')}</p>`],
    ['SVG text', `<svg><text>[ NO DATA ]</text></svg>`],
    ['a bare BracketText', `<BracketText>PAGE</BracketText>`],
    ['BracketText laid out over lines', `<BracketText>\n  PAGE\n</BracketText>`],
  ])('leaves %s alone', async (_name, body) => {
    expect((await lintComponent(`const xs = [1];\nconst BracketText = (p: { children: string }) => <span>{p.children}</span>;\n${component(body)}`)).filter((m) => m.startsWith(RULE))).toEqual([]);
  });
}, 60_000);

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
}, 30_000);

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
}, 30_000);
