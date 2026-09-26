import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import {
  cmapCodepoints,
  cssContentCodepoints,
  deterministicPrefix,
  fontFaces,
  mdxCodepoints,
  parseUnicodeRange,
  stackFamilies,
  tsCodepoints,
  woff2Cmap,
} from './font-coverage.mjs';

const FONTS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/fonts');
const font = (file) => cmapCodepoints(woff2Cmap(readFileSync(path.join(FONTS, file))));

describe('woff2Cmap + cmapCodepoints', () => {
  it('reads the glyphs DS Symbols was cut to, and nothing Latin', () => {
    const cps = font('DSSymbols-Regular.woff2');
    for (const cp of [0x2713, 0x2318, 0x2192, 0x2500, 0x2588, 0x25cf, 0x0394]) expect(cps.has(cp)).toBe(true);
    expect(cps.has(0x41)).toBe(false); // 'A' — never replaces a text face
  });

  it('reads the Nerd symbols face, which has no box drawing', () => {
    const cps = font('SymbolsNerdFontMono-Regular.woff2');
    expect(cps.has(0xf121)).toBe(true); // nf-fa-code
    expect(cps.has(0x2500)).toBe(false); // the DESIGN.md claim this gate disproved
  });

  it('rejects anything that is not WOFF2', () => {
    expect(() => woff2Cmap(Buffer.from('wOFF0000'))).toThrow(/not a WOFF2/);
  });
});

describe('parseUnicodeRange', () => {
  const r = parseUnicodeRange('U+0000-00FF, U+0131, U+02??');
  it('handles ranges, single codepoints and wildcards', () => {
    expect([0x41, 0x131, 0x2ab].map(r)).toEqual([true, true, true]);
    expect([0x130, 0x300].map(r)).toEqual([false, false]);
  });
  it('admits everything when a face declares no range', () => {
    expect(parseUnicodeRange(null)(0x1f600)).toBe(true);
  });
});

describe('fontFaces', () => {
  it('reads family, the woff2 url and the range', () => {
    const [face] = fontFaces(`@font-face { font-family: 'X Variable'; src: url(./files/x.woff2) format('woff2-variations'), url(./x.woff); unicode-range: U+0041; }`);
    expect(face).toEqual({ family: 'X Variable', woff2: './files/x.woff2', unicodeRange: 'U+0041' });
  });
});

describe('stackFamilies + deterministicPrefix', () => {
  const stack = 'var(--font-inter, "Inter Variable", "Inter"), "DS Symbols", -apple-system, "Late Face", sans-serif';
  it('flattens var() fallbacks in order', () => {
    expect(stackFamilies(stack)).toEqual(['Inter Variable', 'Inter', 'DS Symbols', '-apple-system', 'Late Face', 'sans-serif']);
  });
  it('stops at the first family the package does not ship', () => {
    const shipped = new Set(['Inter Variable', 'DS Symbols', 'Late Face']);
    const families = stackFamilies(stack).filter((f) => f !== 'Inter');
    // "Late Face" is shipped but after a system font, so it only draws what that font lacks.
    expect(deterministicPrefix(families, shipped)).toEqual(['Inter Variable', 'DS Symbols']);
  });
});

describe('census extractors', () => {
  it('reads string, template and JSX text, decodes escapes, and skips comments', () => {
    const src = [
      "// a comment with an arrow → is not rendered",
      "const a = 'done ✓';",
      "const b = '\\u2318K';",
      'const c = `step ${a} ─ next`;',
      'export const X = () => <p>go ▶ /* not a comment in JSX text */</p>;',
    ].join('\n');
    const cps = tsCodepoints(ts, 'x.tsx', src).map(({ cp, line }) => [cp.toString(16), line]);
    expect(cps).toEqual([['2713', 2], ['2318', 3], ['2500', 4], ['25b6', 5]]);
  });

  it('reads MDX body text and fences, not imports or comments', () => {
    const src = "import { X } from './x' // →\n\n{/* ✗ hidden */}\n\nA tick ✓\n\n```\n├─ tree\n```";
    expect(mdxCodepoints(src).map(({ cp }) => cp.toString(16))).toEqual(['2713', '251c', '2500']);
  });

  it('reads CSS content, literal or escaped, and ignores comments', () => {
    const src = '/* content: "✗" */\n.a::before { content: "\\2713  done"; }\n.b::after { content: "→"; }';
    expect(cssContentCodepoints(src).map(({ cp, line }) => [cp.toString(16), line])).toEqual([['2713', 2], ['2192', 3]]);
  });
});
