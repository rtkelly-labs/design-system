import { describe, expect, it } from 'vitest';
import { scanTypeRules, typeExceptions } from './typeRules';

const ids = (source: string) => scanTypeRules(source).map((finding) => finding.ruleId);

describe('scanTypeRules', () => {
  it('passes every step and weight of the scale', () => {
    const steps = ['caption', 'ui', 'body', 'lead', 'heading', 'title', 'display', 'hero'];
    const weights = ['regular', 'semibold', 'bold', 'black'];
    const classes = [...steps.map((s) => `text-${s}`), ...weights.map((w) => `font-${w}`)].join(' ');
    expect(ids(`<p className="${classes}" />`)).toEqual([]);
  });

  it("finds Tailwind's default sizes, and only as whole utilities", () => {
    expect(ids('<p className="text-sm md:text-2xl" />')).toEqual(['tailwindSize', 'tailwindSize']);
    // A colour role that happens to start with a size name is not a size.
    expect(ids('<p className="text-base-content text-sm-muted" />')).toEqual([]);
  });

  it('finds the weights the scale does not carry', () => {
    expect(ids('<b className="font-medium font-extrabold font-semibold" />')).toEqual([
      'tailwindWeight',
      'tailwindWeight',
    ]);
  });

  it('finds arbitrary sizes, weights and leading, but not an arbitrary colour', () => {
    expect(ids('<p className="text-[13px] text-[0.7rem] font-[550] leading-[1.1]" />')).toEqual([
      'arbitraryType',
      'arbitraryType',
      'arbitraryType',
      'arbitraryType',
    ]);
    expect(ids('<p className="text-[var(--ds-text-primary)]" />')).toEqual([]);
  });

  it('finds a size or weight written as a CSS value, and passes the tokens', () => {
    expect(ids('.a { font-size: 13px; font-weight: 650; }')).toEqual(['cssSize', 'cssWeight']);
    expect(ids('.a { font-size: var(--ds-type-ui); font-weight: var(--ds-weight-semibold); }')).toEqual([]);
    expect(ids('.a { font-size: inherit; font-weight: inherit; }')).toEqual([]);
  });

  it('passes font-size: 0, the hidden-text idiom', () => {
    expect(ids('.sr { font-size: 0; }')).toEqual([]);
    expect(ids('  font-size: 0')).toEqual([]);
  });

  it('finds a font shorthand that writes its size or weight', () => {
    expect(ids('.a { font: 10px var(--ds-font-mono); }')).toEqual(['cssShorthand']);
    expect(ids('.a { font: 600 var(--ds-type-ui) var(--ds-font-sans); }')).toEqual(['cssShorthand']);
    expect(ids('.a { font: var(--ds-weight-bold) var(--ds-type-ui)/var(--ds-leading-ui) var(--ds-font-sans); }')).toEqual(
      [],
    );
    expect(ids('.a { font: inherit; }')).toEqual([]);
  });

  it('finds inline fontSize and fontWeight, and reports the whole value', () => {
    const findings = scanTypeRules("<p style={{ fontSize: '0.7rem', fontWeight: 800 }} />");
    expect(findings.map((f) => [f.ruleId, f.match])).toEqual([
      ['inlineStyle', "fontSize: '0.7rem"],
      ['inlineStyle', 'fontWeight: 800'],
    ]);
    expect(ids("<p style={{ fontSize: 'var(--ds-type-ui)' }} />")).toEqual([]);
  });

  it('ignores @font-face, and keeps line numbers pointing at the source', () => {
    const css = [
      '@font-face {',
      '  font-family: Mono;',
      '  font-weight: 600 900;',
      '}',
      '.a { font-size: 9px; }',
    ].join('\n');
    expect(scanTypeRules(css).map((f) => [f.ruleId, f.line])).toEqual([['cssSize', 5]]);
  });

  it('ignores comment lines, which name the forbidden patterns in prose', () => {
    expect(ids('// never write text-sm here\n * or font-size: 13px')).toEqual([]);
  });

  it('skips a line that claims an exception, and lists it with its reason', () => {
    const css = '.chip { font-size: 11px; } /* ds-allow-type: matches GitHub label chips */';
    expect(ids(css)).toEqual([]);
    expect(typeExceptions(css)).toEqual([{ line: 1, reason: 'matches GitHub label chips' }]);
  });

  it('lists an exception with no reason as having none, so a gate can reject it', () => {
    expect(typeExceptions('.a { font-size: 11px; } /* ds-allow-type: */')).toEqual([{ line: 1, reason: '' }]);
  });
});
