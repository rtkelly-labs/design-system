// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import { compile } from 'tailwindcss';
import { describe, expect, it } from 'vitest';
import { CodeBlock } from './CodeBlock';

const ROOT = process.cwd();
const require = createRequire(path.join(ROOT, 'package.json'));

async function loadStylesheet(id: string, base: string) {
  const file = id === 'tailwindcss' ? require.resolve('tailwindcss/index.css') : path.resolve(base, id);
  return { path: file, base: path.dirname(file), content: readFileSync(file, 'utf8') };
}

async function compileWith(candidates: string[]) {
  const input = `@import "tailwindcss";\n@import "./src/theme.css";\n@import "./src/prose.css";\n`;
  const compiler = await compile(input, {
    base: ROOT,
    loadStylesheet,
    loadModule: async (id, base) => {
      const file = createRequire(path.join(base, 'x.js')).resolve(id);
      return { path: file, base: path.dirname(file), module: (await import(file)).default };
    },
  });
  return compiler.build(candidates);
}

describe('pre radius', () => {
  it('CodeBlock pre carries an important zero radius that beats the typography plugin', async () => {
    render(<CodeBlock title="x">code</CodeBlock>);
    const pre = screen.getByRole('region', { name: 'x' });
    const cls = pre.className.split(/\s+/).find((c) => c.startsWith('rounded-none'));
    expect(cls).toBe('rounded-none!');
    const css = await compileWith(['rounded-none!']);
    expect(css).toMatch(/\.rounded-none\\!\s*\{\s*border-radius:\s*var\(--radius-none\)\s*!important/);
  });

  it('prose-ladder zeroes the radius on pre and balances h1-h3', async () => {
    const css = await compileWith(['prose-ladder']);
    expect(css).toMatch(/\.prose-ladder\s*\{[\s\S]*?pre\s*\{\s*border-radius:\s*var\(--ds-radius-none\)/);
    expect(css).toMatch(/:is\(h1, h2, h3\)\s*\{\s*text-wrap:\s*balance/);
  });
});

describe('code metrics (Round 6)', () => {
  /** The declarations of the first rule whose selector is exactly `selector`. */
  const rule = (css: string, selector: string) => {
    const at = css.indexOf(`${selector} {`);
    expect(at, `no rule for ${selector}`).toBeGreaterThan(-1);
    return css.slice(css.indexOf('{', at) + 1, css.indexOf('}', at));
  };

  it('CodeBlock sets tab-size: 2 and 14px on 21px, instead of the browser tab of 8', async () => {
    render(<CodeBlock title="x">{'\tcode'}</CodeBlock>);
    const css = await compileWith(['prose-ladder']);
    const body = rule(css, '.docs-codeblock-body pre');
    expect(body).toMatch(/tab-size:\s*2\s*;/);
    expect(body).toMatch(/font-size:\s*0\.875rem\s*;/);
    expect(body).toMatch(/line-height:\s*1\.5\s*;/);
    // 0.875rem is 14px at the 16px root, and 1.5 of it is 21px.
    expect(0.875 * 16 * 1.5).toBe(21);
  });

  it('colours the plain code ink by the syntax role, not text.primary', async () => {
    const css = await compileWith(['prose-ladder']);
    expect(rule(css, '.docs-codeblock-body pre')).toMatch(/color:\s*var\(--ds-syntax-plain\)/);
    expect(css).toMatch(/--tw-prose-pre-code:\s*var\(--ds-syntax-plain\)/);
  });

  it('a bare prose pre gets the same tab and leading', async () => {
    const css = await compileWith(['prose-ladder']);
    expect(css).toMatch(/\.prose-ladder\s*\{[\s\S]*?pre\s*\{[^}]*tab-size:\s*2[^}]*line-height:\s*1\.5/);
  });
});
