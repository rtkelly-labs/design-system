import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { compile } from 'tailwindcss';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const require = createRequire(path.join(root, 'package.json'));

async function build(entry: string, candidates: string[]) {
  const compiler = await compile(`@import "tailwindcss";\n@import "./src/${entry}";`, {
    base: root,
    async loadStylesheet(id, base) {
      const file = id === 'tailwindcss' ? require.resolve('tailwindcss/index.css') : path.resolve(base, id);
      return { path: file, base: path.dirname(file), content: readFileSync(file, 'utf8') };
    },
  });
  return compiler.build(candidates);
}

const selector = (candidate: string) => '.' + candidate.replace(/[^a-zA-Z0-9_-]/g, (char) => `\\${char}`);
const defaults = ['bg-slate-900', 'text-indigo-500', 'border-red-500', 'hover:bg-blue-600', 'font-serif', 'shadow-lg', 'inset-shadow-sm', 'drop-shadow-lg', 'text-shadow-lg'];
const system = ['bg-surface-raised', 'text-content-primary', 'border-edge-subtle', 'font-sans', 'font-display', 'font-mono', 'font-pixel', 'shadow-hard-sm', 'rounded-soft', 'text-body', 'p-4', 'text-sm', 'motion-reduce:animate-ds-step-slow'];

describe('opt-in strict Tailwind consumer contract', () => {
  it('removes default utilities while preserving system aliases and component scales', async () => {
    const css = await build('theme.strict.css', [...defaults, ...system]);
    for (const candidate of defaults) expect(css, candidate).not.toContain(selector(candidate));
    for (const candidate of system) expect(css, candidate).toContain(selector(candidate));
  });

  it('keeps the namespaces the reset does not own', async () => {
    // `--font-*` is the family namespace only: weights, leading, tracking, the
    // type scale and the spacing scale are retained on purpose (see the table
    // in docs/agent-guardrails.md), and so are the fixed/system colours.
    const kept = ['font-medium', 'font-semibold', 'leading-tight', 'tracking-wide', 'text-xs', 'p-4', 'bg-fixed-black', 'text-content-inverse', 'bg-palette-red'];
    const css = await build('theme.strict.css', kept);
    for (const candidate of kept) expect(css, candidate).toContain(selector(candidate));
  });

  it('removes the raw black and white that Tailwind owned, not their system replacements', async () => {
    const css = await build('theme.strict.css', ['bg-black', 'text-white', 'bg-white', 'bg-surface-base']);
    for (const candidate of ['bg-black', 'text-white', 'bg-white']) {
      expect(css, candidate).not.toContain(selector(candidate));
    }
    expect(css).toContain('.bg-surface-base');
  });

  it('keeps the existing entrypoint compatible', async () => {
    const css = await build('theme.css', defaults);
    for (const candidate of defaults) expect(css, candidate).toContain(selector(candidate));
  });

  it('preserves zero-radius aliases and exposes the static/arbitrary escape hatches', async () => {
    const css = await build('theme.strict.css', ['rounded-lg', 'rounded-full', 'bg-[#123456]', 'font-[Arial]']);
    expect(css).toContain('--radius-lg: var(--ds-radius-none)');
    expect(css).toContain('.rounded-full {');
    expect(css).toContain('background-color: #123456');
    expect(css).toContain('font-family: Arial');
  });
});
