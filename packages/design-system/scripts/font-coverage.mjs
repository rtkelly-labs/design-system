/**
 * Which codepoints a self-hosted font can actually draw, and which codepoints
 * the design system actually renders — the two halves of `check:fonts`'s
 * glyph-coverage question. No I/O beyond what the caller passes in, so the
 * parsing is testable on bytes.
 *
 * ## Why a hand-written WOFF2 reader
 *
 * The answer lives in each font's `cmap` table, and every face this package
 * ships is WOFF2. A font library (`fontkit`, `opentype.js`) would be a new
 * runtime-free dependency with its own licence and knip entry, for one table.
 * WOFF2 stores `cmap` untransformed inside a single Brotli stream, and Node has
 * Brotli built in, so reading it is a header walk and a slice — about a
 * hundred lines, no Python in CI, no dependency to justify.
 *
 * A face covers a codepoint only if its `unicode-range` admits it **and** its
 * `cmap` maps it to a real glyph. `unicode-range` alone is a promise the file
 * may not keep; the browser then falls through to the next family — which is
 * exactly how `✓` and `⌘` ended up drawn by whatever the runner had installed.
 */

import { brotliDecompressSync } from 'node:zlib';

/* ------------------------------------------------------------------ *
 * WOFF2 -> cmap
 * ------------------------------------------------------------------ */

/** WOFF2's known-table tags, by the 6-bit index in each directory entry. */
const KNOWN_TAGS = [
  'cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep',
  'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE',
  'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt',
  'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar', 'gvar', 'hsty', 'just', 'lcar',
  'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill',
];

function readBase128(buf, at) {
  let value = 0;
  for (let i = 0; i < 5; i++) {
    const byte = buf[at.pos++];
    if (i === 0 && byte === 0x80) throw new Error('WOFF2: UIntBase128 with a leading zero');
    value = value * 128 + (byte & 0x7f);
    if (!(byte & 0x80)) return value;
  }
  throw new Error('WOFF2: UIntBase128 longer than five bytes');
}

/** The raw `cmap` table of a WOFF2 file. Throws on anything else. */
export function woff2Cmap(buf) {
  if (buf.toString('latin1', 0, 4) !== 'wOF2') throw new Error('not a WOFF2 file');
  if (buf.toString('latin1', 4, 8) === 'ttcf') throw new Error('WOFF2 collections are not supported');
  const numTables = buf.readUInt16BE(12);
  const compressedSize = buf.readUInt32BE(20);
  const at = { pos: 48 };
  const tables = [];
  for (let i = 0; i < numTables; i++) {
    const flags = buf[at.pos++];
    const index = flags & 0x3f;
    const tag = index === 63 ? buf.toString('latin1', at.pos, (at.pos += 4)) : KNOWN_TAGS[index];
    const version = flags >> 6;
    const origLength = readBase128(buf, at);
    // glyf/loca are transformed at version 0; every other table at non-zero.
    const transformed = tag === 'glyf' || tag === 'loca' ? version === 0 : version !== 0;
    const length = transformed ? readBase128(buf, at) : origLength;
    tables.push({ tag, length });
  }
  const data = brotliDecompressSync(buf.subarray(at.pos, at.pos + compressedSize));
  let offset = 0;
  for (const { tag, length } of tables) {
    if (tag === 'cmap') return data.subarray(offset, offset + length);
    offset += length;
  }
  throw new Error('WOFF2: no cmap table');
}

/** Every codepoint a `cmap` maps to a glyph other than .notdef. */
export function cmapCodepoints(cmap) {
  const count = cmap.readUInt16BE(2);
  const subtables = [];
  for (let i = 0; i < count; i++) {
    const platform = cmap.readUInt16BE(4 + i * 8);
    const encoding = cmap.readUInt16BE(6 + i * 8);
    const offset = cmap.readUInt32BE(8 + i * 8);
    subtables.push({ platform, encoding, offset, format: cmap.readUInt16BE(offset) });
  }
  // A full-repertoire subtable when there is one, else the BMP one.
  const pick =
    subtables.find((s) => s.format === 12 && (s.platform === 3 || s.platform === 0)) ??
    subtables.find((s) => s.format === 4 && (s.platform === 3 || s.platform === 0));
  if (!pick) throw new Error('cmap: no format 4 or 12 Unicode subtable');
  return pick.format === 12 ? format12(cmap, pick.offset) : format4(cmap, pick.offset);
}

function format12(cmap, base) {
  const out = new Set();
  const groups = cmap.readUInt32BE(base + 12);
  for (let g = 0; g < groups; g++) {
    const p = base + 16 + g * 12;
    const start = cmap.readUInt32BE(p);
    const end = cmap.readUInt32BE(p + 4);
    const glyph = cmap.readUInt32BE(p + 8);
    for (let cp = start; cp <= end; cp++) if (glyph + (cp - start) !== 0) out.add(cp);
  }
  return out;
}

function format4(cmap, base) {
  const out = new Set();
  const segs = cmap.readUInt16BE(base + 6) / 2;
  const ends = base + 14;
  const starts = ends + segs * 2 + 2;
  const deltas = starts + segs * 2;
  const rangeOffsets = deltas + segs * 2;
  for (let s = 0; s < segs; s++) {
    const end = cmap.readUInt16BE(ends + s * 2);
    const start = cmap.readUInt16BE(starts + s * 2);
    const delta = cmap.readInt16BE(deltas + s * 2);
    const rangeAt = rangeOffsets + s * 2;
    const rangeOffset = cmap.readUInt16BE(rangeAt);
    for (let cp = start; cp <= end && cp !== 0xffff; cp++) {
      let glyph;
      if (rangeOffset === 0) glyph = (cp + delta) & 0xffff;
      else {
        const raw = cmap.readUInt16BE(rangeAt + rangeOffset + (cp - start) * 2);
        glyph = raw === 0 ? 0 : (raw + delta) & 0xffff;
      }
      if (glyph !== 0) out.add(cp);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * CSS: @font-face, unicode-range, font stacks
 * ------------------------------------------------------------------ */

/** `U+0000-00FF, U+0131, U+02??` -> predicate. No descriptor admits everything. */
export function parseUnicodeRange(text) {
  if (!text) return () => true;
  const ranges = text.split(',').map((part) => {
    const spec = part.trim().replace(/^u\+/i, '');
    if (spec.includes('?')) {
      return [parseInt(spec.replaceAll('?', '0'), 16), parseInt(spec.replaceAll('?', 'F'), 16)];
    }
    const [a, b = a] = spec.split('-');
    return [parseInt(a, 16), parseInt(b, 16)];
  });
  return (cp) => ranges.some(([a, b]) => cp >= a && cp <= b);
}

/** `@font-face` blocks in a stylesheet: family, woff2 url, unicode-range. */
export function fontFaces(css) {
  return [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, body]) => ({
    family: /font-family:\s*['"]?([^;'"]+)['"]?\s*;/.exec(body)?.[1].trim(),
    woff2: /url\(\s*['"]?([^'")]+\.woff2)['"]?\s*\)/.exec(body)?.[1],
    unicodeRange: /unicode-range:\s*([^;]+);/.exec(body)?.[1].trim() ?? null,
  }));
}

/**
 * The families of a `font-family` stack, in order, with `var(--x, a, b)`
 * flattened to its fallbacks (the variable is a consumer's override hook and
 * is unset in this package's own rendering).
 */
export function stackFamilies(value) {
  let text = value;
  // Innermost `var(` first; each is replaced by its fallback list.
  for (;;) {
    const m = /var\(\s*--[\w-]+\s*,\s*([^()]*)\)/.exec(text);
    if (!m) break;
    text = text.slice(0, m.index) + m[1] + text.slice(m.index + m[0].length);
  }
  return text
    .split(',')
    .map((f) => f.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

/**
 * The self-hosted families that decide a stack's rendering: every family from
 * the start of the stack up to the first one this package does not ship. A
 * self-hosted family *after* a system one only draws what that system font
 * lacks, which varies by machine, so it cannot be counted on.
 */
export function deterministicPrefix(families, selfHosted) {
  const out = [];
  for (const family of families) {
    if (!selfHosted.has(family)) break;
    out.push(family);
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Census: codepoints the package can render
 * ------------------------------------------------------------------ */

/**
 * HTML entities, decoded the way JSX and MDX render them. TypeScript keeps
 * `&rarr;` verbatim in `JsxText.text`, so without this a character written as an
 * entity never enters the census. The named table is the set this codebase
 * writes plus the common punctuation; an unknown name is reported rather than
 * guessed, so the table can never silently under-read.
 */
const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0', times: '\u00d7', divide: '\u00f7',
  rarr: '\u2192', larr: '\u2190', uarr: '\u2191', darr: '\u2193', harr: '\u2194', mdash: '\u2014',
  ndash: '\u2013', hellip: '\u2026', lsquo: '\u2018', rsquo: '\u2019', ldquo: '\u201c', rdquo: '\u201d',
  laquo: '\u00ab', raquo: '\u00bb', middot: '\u00b7', bull: '\u2022', deg: '\u00b0', plusmn: '\u00b1',
  minus: '\u2212', copy: '\u00a9', reg: '\u00ae', trade: '\u2122', check: '\u2713', cross: '\u2717',
};

/** Decode `&name;`, `&#123;` and `&#x7b;`. Unknown names are returned in `unknown`. */
export function decodeEntities(text) {
  const unknown = [];
  const decoded = text.replace(/&(#[xX][0-9a-fA-F]+|#[0-9]+|[a-zA-Z][a-zA-Z0-9]*);/g, (whole, body) => {
    if (body[0] === '#') {
      const cp = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      if (cp <= 0x10ffff && !(cp >= 0xd800 && cp <= 0xdfff)) return String.fromCodePoint(cp);
      unknown.push(whole);
      return whole;
    }
    if (body in NAMED) return NAMED[body];
    unknown.push(whole);
    return whole;
  });
  return { decoded, unknown };
}

/** Plain ASCII is covered by every face here and is not the question. */
export const isInteresting = (cp) => cp > 0x7e;

/**
 * Codepoints in rendered text of one TS/TSX file: string literals, template
 * literal text and JSX text, via the TypeScript scanner-backed AST so comments
 * are excluded and escapes like `'✓'` are read as the character.
 */
export function tsCodepoints(ts, fileName, source) {
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true,
    fileName.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const hits = [];
  const unknownEntities = [];
  const lineOf = (node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
  const record = (node, raw, entities = false) => {
    let text = raw;
    if (entities) {
      const { decoded, unknown } = decodeEntities(raw);
      text = decoded;
      for (const entity of unknown) unknownEntities.push({ entity, line: lineOf(node) });
    }
    for (const ch of text) {
      const cp = ch.codePointAt(0);
      if (isInteresting(cp)) hits.push({ cp, line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1 });
    }
  };
  const visit = (node) => {
    const k = ts.SyntaxKind;
    switch (node.kind) {
      case k.JsxText:
        record(node, node.text, true);
        break;
      case k.StringLiteral:
        // A JSX attribute string is HTML-ish: `title="&rarr;"` renders an arrow.
        record(node, node.text, node.parent?.kind === k.JsxAttribute);
        break;
      case k.NoSubstitutionTemplateLiteral:
      case k.TemplateHead:
      case k.TemplateMiddle:
      case k.TemplateTail:
        record(node, node.text);
        break;
      default:
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  hits.unknownEntities = unknownEntities;
  return hits;
}

/**
 * Codepoints in an MDX file's rendered text: every line except ESM
 * `import`/`export` lines and `{/* … *\/}` comments. Code fences stay in —
 * they render, in the mono stack.
 */
export function mdxCodepoints(source) {
  const hits = [];
  const unknownEntities = [];
  let fence = null;
  let comment = false;
  source.split('\n').forEach((raw, i) => {
    const marker = raw.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (marker && !comment) {
      if (!fence) {
        fence = marker[1];
        return;
      }
      if (marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) {
        fence = null;
        return;
      }
    }
    let line = raw;
    if (!fence) {
      // Strip MDX comments only in prose. A comment shown in a code fence is text.
      line = '';
      let offset = 0;
      while (offset < raw.length) {
        const end = raw.indexOf(comment ? '*/}' : '{/*', offset);
        if (end < 0) {
          if (!comment) line += raw.slice(offset);
          break;
        }
        if (!comment) line += raw.slice(offset, end);
        comment = !comment;
        offset = end + 3;
      }
      if (/^\s*(import|export)\s/.test(line)) return;
    }
    // Fenced code renders entity spellings literally, unlike the MDX body.
    const { decoded, unknown } = fence ? { decoded: line, unknown: [] } : decodeEntities(line);
    for (const entity of unknown) unknownEntities.push({ entity, line: i + 1 });
    for (const ch of decoded) {
      const cp = ch.codePointAt(0);
      if (isInteresting(cp)) hits.push({ cp, line: i + 1 });
    }
  });
  hits.unknownEntities = unknownEntities;
  return hits;
}

/**
 * Font stacks written outside the role tokens. The census proves every glyph is
 * in the four `--ds-font-*` stacks; that proof is only about rendering if text
 * actually uses them. A component writing `'"IBM Plex Mono", monospace'` itself
 * inherits none of the symbol faces, and two of the three literal stacks this
 * gate first found named families nothing declares (`"Inter"`, `"Space
 * Grotesk"` — the shipped builds are the `Variable` ones), so that text was in
 * the system sans outright.
 *
 * Reported: any TS/TSX string that reads as a stack (`var(--font-*`, or a quoted
 * family followed by a generic keyword), a CSS `font-family` outside
 * `@font-face` that is not a role variable or `inherit`, and Tailwind's arbitrary
 * `font-[…]`.
 */
const LOOKS_LIKE_STACK = /var\(--font-[\w-]+|["'][^"']+["']\s*,\s*(?:sans-serif|serif|monospace|system-ui|cursive)\b/;
const ROLE_ONLY = /^\s*(?:var\(--ds-font-[a-z]+\)|inherit)\s*(?:!important)?\s*$/;

export function tsStackBypasses(ts, fileName, source) {
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true,
    fileName.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const out = [];
  const visit = (node) => {
    const k = ts.SyntaxKind;
    if (node.kind === k.StringLiteral || node.kind === k.NoSubstitutionTemplateLiteral) {
      const text = node.text;
      if (LOOKS_LIKE_STACK.test(text) || /(?:^|\s)font-\[/.test(text)) {
        out.push({ line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1, text });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

export function cssStackBypasses(source) {
  const out = [];
  const text = source
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/@font-face\s*\{[^}]*\}/g, (m) => m.replace(/[^\n]/g, ' '));
  text.split('\n').forEach((line, i) => {
    for (const [, value] of line.matchAll(/(?<![-\w])font-family:\s*([^;}]+)/g)) {
      if (!ROLE_ONLY.test(value)) out.push({ line: i + 1, text: value.trim() });
    }
  });
  return out;
}

/** Codepoints generated by CSS `content:` — literal characters and `\2713` escapes. */
export function cssContentCodepoints(source) {
  const hits = [];
  const text = source.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  const declarations = /(?<![-\w])content\s*:\s*((?:"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|[^;}"'])*)/g;
  for (const declaration of text.matchAll(declarations)) {
    const valueOffset = declaration.index + declaration[0].indexOf(declaration[1]);
    for (const literal of declaration[1].matchAll(/(["'])((?:\\[\s\S]|(?!\1)[^\\])*)\1/g)) {
      const value = literal[2];
      const line = text.slice(0, valueOffset + literal.index).split('\n').length;
      const decoded = value.replace(/\\([0-9a-fA-F]{1,6})\s?/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
      for (const ch of decoded) {
        const cp = ch.codePointAt(0);
        if (isInteresting(cp)) hits.push({ cp, line });
      }
    }
  }
  return hits;
}

export const hex = (cp) => `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
