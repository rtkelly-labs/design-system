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
