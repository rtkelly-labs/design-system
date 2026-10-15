/** Pre-tokenised TypeScript for the D10 editor frame. No highlighter: every span is authored. */

export type Kind = 'kw' | 'str' | 'num' | 'fn' | 'type' | 'const' | 'com' | 'punc' | 'plain';
export type BandKey = 'sel' | 'find' | 'bracket';

export interface Tok {
  k: Kind;
  s: string;
  band?: BandKey;
  /** The current find match gets a ring. */
  ring?: boolean;
  sq?: 'error' | 'warn';
}

export interface Line {
  toks: Tok[];
  /** Whole-line treatment: the current line, or a diff line. */
  line?: 'cur' | 'add' | 'del';
}

const t = (k: Kind) => (s: string, x: Partial<Tok> = {}): Tok => ({ k, s, ...x });
const K = t('kw');
const S = t('str');
const N = t('num');
const F = t('fn');
const T = t('type');
const C = t('const');
const M = t('com');
const P = t('punc');
const I = t('plain');

export const KINDS: { k: Kind; label: string }[] = [
  { k: 'kw', label: 'keyword' },
  { k: 'str', label: 'string' },
  { k: 'num', label: 'number' },
  { k: 'fn', label: 'function' },
  { k: 'type', label: 'type' },
  { k: 'const', label: 'constant' },
  { k: 'com', label: 'comment' },
  { k: 'punc', label: 'punctuation' },
  { k: 'plain', label: 'identifier' },
];

export const SNIPPET: Line[] = [
  { toks: [M('// Retry a fetch with backoff.')] },
  { toks: [K('import'), I(' '), P('{ '), I('sleep'), P(' }'), I(' '), K('from'), I(' '), S("'./sleep'"), P(';')] },
  { toks: [] },
  { toks: [K('type'), I(' '), T('Options'), P(' = { '), I('retries', { band: 'find' }), P(': '), T('number'), P('; '), I('base'), P(': '), T('number'), P(' };')] },
  { toks: [] },
  { toks: [K('export'), I(' '), K('async'), I(' '), K('function'), I(' '), F('retry'), P('<'), T('T'), P('>('), I('fn'), P(': () => '), T('Promise'), P('<'), T('T'), P('>, '), I('o'), P(': '), T('Options'), P(') {')] },
  { toks: [I('  '), K('let', { band: 'sel' }), I(' delay ', { band: 'sel' }), P('= ', { band: 'sel' }), I('o.base', { band: 'sel' }), P(';', { band: 'sel' })] },
  { toks: [I('  '), K('for', { band: 'sel' }), P(' (', { band: 'sel' }), K('let', { band: 'sel' }), I(' i ', { band: 'sel' }), P('= ', { band: 'sel' }), N('0', { band: 'sel' }), P('; '), I('i '), P('< '), I('o.'), I('retries', { band: 'find' }), P('; '), I('i'), P('++) {')] },
  { line: 'cur', toks: [I('    '), K('try'), P(' '), P('{', { band: 'bracket' })] },
  { toks: [I('      '), K('return'), I(' '), K('await'), I(' '), F('fn'), P('()'), P(';')] },
  { toks: [I('    '), P('}', { band: 'bracket' }), I(' '), K('catch'), P(' ('), I('err'), P(') {')] },
  { toks: [I('      '), K('if'), P(' ('), I('i '), P('=== '), I('o.'), I('retries', { band: 'find', ring: true }), P(' - '), N('1'), P(') '), K('throw'), I(' '), I('err', { sq: 'warn' }), P(';')] },
  { line: 'del', toks: [I('      '), K('await'), I(' '), F('sleep'), P('('), N('1000'), P(');')] },
  { line: 'add', toks: [I('      '), K('await'), I(' '), F('sleep'), P('('), I('delay'), P(');')] },
  { toks: [I('      delay '), P('*= '), N('2'), P(';')] },
  { toks: [I('    '), P('}')] },
  { toks: [I('  '), P('}')] },
  { toks: [I('  '), K('throw'), I(' '), K('new'), I(' '), T('Error'), P('('), S("'unreachable'"), P(');')] },
  { toks: [P('}')] },
  { toks: [] },
  { toks: [K('const'), I(' '), C('DEFAULTS'), P(': '), T('Options'), P(' = { '), I('retries', { band: 'find' }), P(': '), N('3'), P(', '), I('base'), P(': '), N('250'), P(' };')] },
  { toks: [K('export'), I(' '), K('const'), I(' '), F('load'), P(' = () => '), F('retry'), P('(() => '), F('fetch'), P('('), C('URL', { sq: 'error' }), P('), '), C('DEFAULTS'), P(');')] },
  { toks: [M('// TODO: add jitter')] },
  { toks: [F('load'), P('().'), F('then'), P('(('), I('r'), P(') => '), C('console'), P('.'), F('log'), P('('), I('r'), P('));')] },
  { toks: [M('/* end of file */')] },
];
