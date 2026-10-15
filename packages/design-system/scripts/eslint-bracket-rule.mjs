/**
 * The local rule: a bracketed label is `<BracketText>`, never typed by hand.
 *
 * `[ PAGE ]` written out has three faults `BracketText` does not: a line can
 * break between a bracket and its word (G03), a screen reader announces the
 * brackets as part of the name ("left bracket, Delete domain"), and a copy of
 * the label carries them. The first fix tried was a no-break space at 88 call
 * sites, which the next hand-typed label undoes. This rule makes the component
 * the only way to write one, and `eslint --fix` converts what it finds.
 *
 * ## What counts as a hand-typed label
 *
 * `[`, one or more whitespace characters of **any** kind, a label, more
 * whitespace, `]`. Whitespace is judged on what the text *means*, so a plain
 * space, a tab or newline, U+00A0, the Unicode spaces (U+2000–U+200A, U+202F,
 * U+205F, U+3000), the zero-width characters (U+200B–U+200D, U+2060, U+FEFF),
 * and every spelling of them — `&nbsp;`, `&#160;`, `&#xA0;`, `' '`,
 * `'\xa0'`, `'\u{a0}'` — are the same thing. `[x]`, with none, is not a label.
 *
 * Only text a reader sees is checked: JSX text, and strings or templates that
 * are a JSX child or attribute value (directly, or through `?:` and `&&`).
 * Code samples held in plain strings — `const xs = [ 1, 2 ]` — are not labels.
 * SVG `<text>` is exempt: a `<span>` is not valid inside it, and it never wraps.
 *
 * ## What the fix does, deterministically
 *
 * - JSX text: `[&nbsp;{title}&nbsp;]` → `<BracketText>{title}</BracketText>`.
 *   Each label in a run is converted on its own; the text around it is kept.
 * - A string or template in child position, including a branch of `?:` or the
 *   right of `&&`: `'[ A ]'` → `<BracketText>A</BracketText>`, in place.
 * - The `BracketText` import is added, or merged into an existing import from
 *   the same module. `eslint --fix` re-runs until nothing changes, so the
 *   import lands on the first pass and every label on the next.
 *
 * An attribute value (`title="[ X ]"`) is reported and not fixed: whether that
 * prop takes a node is a type question, so it is a person's call.
 *
 * Inside `<BracketText>` itself, a child that brings its own brackets
 * (`<BracketText>[ X ]</BracketText>` renders `[ [ X ] ]`) or pads itself with
 * whitespace on the same line is reported, and fixed by stripping both.
 *
 * Option `{ module }`: where `BracketText` is imported from. A bare specifier is
 * used as written; an absolute path is made relative to each linted file.
 *
 * The site imports this file too (`apps/site/eslint.config.mjs`), so the
 * package and its one real consumer are held to the same rule.
 */

import path from 'node:path';

/** Every whitespace character, including the zero-width ones `\s` leaves out. */
const WS = '[\\s\\u200b-\\u200d\\u2060\\ufeff]';
const allWs = (s) => new RegExp(`^${WS}*$`).test(s);

/** A whitespace character as it can be *written*: in JSX text (entities) or in a JS string (escapes). */
const JSX_WS = `(?:${WS}|&[A-Za-z][A-Za-z0-9]*;|&#(?:[xX][0-9a-fA-F]+|\\d+);)`;
const JS_WS = `(?:${WS}|\\\\(?:u[0-9a-fA-F]{4}|u\\{[0-9a-fA-F]+\\}|x[0-9a-fA-F]{2}|[tnrvf]))`;

const NAMED = {
  nbsp: ' ', ensp: ' ', emsp: ' ', emsp13: ' ', emsp14: ' ', numsp: ' ',
  puncsp: ' ', thinsp: ' ', hairsp: ' ', MediumSpace: ' ', NoBreak: '⁠',
  ZeroWidthSpace: '​', NegativeThinSpace: '​', NegativeMediumSpace: '​',
  NegativeThickSpace: '​', NegativeVeryThinSpace: '​', Tab: '\t', NewLine: '\n',
};
/** What JSX text means: entities decoded. An unknown named entity stays as written, so it is not whitespace. */
export const decodeJsx = (s) =>
  s.replace(/&(?:#[xX]([0-9a-fA-F]+)|#(\d+)|([A-Za-z][A-Za-z0-9]*));/g, (m, h, d, n) =>
    h ? String.fromCodePoint(parseInt(h, 16)) : d ? String.fromCodePoint(Number(d)) : (NAMED[n] ?? m),
  );
/** What a JS string body means: escapes decoded. */
const decodeJs = (s) =>
  s.replace(/\\(?:u\{([0-9a-fA-F]+)\}|u([0-9a-fA-F]{4})|x([0-9a-fA-F]{2})|([tnrvf]))/g, (_, cp, u, x, c) =>
    c ? { t: '\t', n: '\n', r: '\r', v: '\v', f: '\f' }[c] : String.fromCodePoint(parseInt(cp ?? u ?? x, 16)),
  );

/**
 * Find hand-typed labels in `written` text, where `spelling` is how one
 * whitespace character can be written and `decode` says what it means.
 * Returns each label's span and its inner span, as offsets into `written`.
 */
export function findLabels(written, spelling = JSX_WS, decode = decodeJsx) {
  const found = [];
  const re = new RegExp(`\\[((?:${spelling})+)([^\\[\\]]*?)((?:${spelling})+)\\]`, 'g');
  for (let m; (m = re.exec(written)); ) {
    const [whole, open, label, close] = m;
    if (!allWs(decode(open)) || !allWs(decode(close)) || allWs(decode(label))) {
      re.lastIndex = m.index + 1; // not a label here; a later `[` may start one
      continue;
    }
    const inner = m.index + 1 + open.length;
    found.push({ start: m.index, end: m.index + whole.length, inner: [inner, inner + label.length] });
  }
  return found;
}

const MESSAGE = 'Bracket a label with <BracketText>, not by hand: hand-typed brackets can strand on a line, are read aloud, and are copied.';
const INNER = 'Inside <BracketText>, write the label alone: it draws its own brackets and spacing.';
const SVG_TEXT = new Set(['text', 'tspan']);
/** A stand-in for a non-text child in the view of an element's children. */
const HOLE = '\u0000';

export const noHandBrackets = {
  meta: {
    type: 'problem',
    fixable: 'code',
    docs: { description: MESSAGE },
    schema: [{ type: 'object', properties: { module: { type: 'string' } }, additionalProperties: false }],
  },
  create(context) {
    const source = context.sourceCode;
    const filename = path.resolve(context.filename);
    const module = context.options[0]?.module ?? '@rtkelly13/design-system';
    const local = path.isAbsolute(module);
    // BracketText.tsx is where the brackets are drawn; it is the one file that may.
    if (local && filename.replace(/\.tsx?$/, '') === module.replace(/\.tsx?$/, '')) return {};

    const specifier = () => {
      if (!local) return module;
      const rel = path.relative(path.dirname(filename), module).replace(/\\/g, '/').replace(/\.tsx?$/, '');
      return rel.startsWith('.') ? rel : `./${rel}`;
    };

    /** Make `BracketText` importable here, unless it already is. */
    function importFix(fixer) {
      const body = source.ast.body;
      const imports = body.filter((n) => n.type === 'ImportDeclaration');
      if (imports.some((d) => d.importKind !== 'type' && d.specifiers.some((s) => s.local.name === 'BracketText'))) return null;
      const spec = specifier();
      const same = imports.find(
        (d) => d.source.value === spec && d.importKind !== 'type' && d.specifiers.some((s) => s.type === 'ImportSpecifier'),
      );
      if (same) {
        const last = same.specifiers.filter((s) => s.type === 'ImportSpecifier').at(-1);
        // One specifier per line stays one per line.
        if (last.loc.start.line === same.loc.start.line) return fixer.insertTextAfter(last, ', BracketText');
        const indent = source.lines[last.loc.start.line - 1].match(/^\s*/)[0];
        return fixer.insertTextAfter(last, `,\n${indent}BracketText`);
      }
      const line = `import { BracketText } from '${spec}';`;
      if (imports.length) return fixer.insertTextAfter(imports.at(-1), `\n${line}`);
      const directives = body.filter((n) => n.type === 'ExpressionStatement' && n.directive);
      return directives.length ? fixer.insertTextAfter(directives.at(-1), `\n${line}`) : fixer.insertTextBeforeRange([0, 0], `${line}\n`);
    }

    function report(node, range, replacement) {
      context.report({
        node,
        loc: { start: source.getLocFromIndex(range[0]), end: source.getLocFromIndex(range[1]) },
        message: MESSAGE,
        fix: (fixer) => [importFix(fixer), fixer.replaceTextRange(range, replacement)].filter(Boolean),
      });
    }

    /** JSX text, read across children: `[ {title} ]` is three children and one label. */
    function checkChildren(node) {
      const name = node.openingElement?.name?.name;
      if (SVG_TEXT.has(name)) return;
      if (name === 'BracketText') return checkInside(node);
      if (!node.children.length) return;

      let view = '';
      const from = []; // view index -> source start
      const to = []; // view index -> source end
      for (const c of node.children) {
        if (c.type === 'JSXText') {
          for (let i = 0; i < c.raw.length; i++) from.push(c.range[0] + i), to.push(c.range[0] + i + 1);
          view += c.raw;
        } else {
          from.push(c.range[0]), to.push(c.range[1]);
          view += HOLE;
        }
      }
      for (const label of findLabels(view)) {
        const range = [from[label.start], to[label.end - 1]];
        const inner = [from[label.inner[0]], to[label.inner[1] - 1]];
        report(node, range, `<BracketText>${source.text.slice(...inner)}</BracketText>`);
      }
    }

    /** `<BracketText>[ X ]</BracketText>` or `<BracketText>&nbsp;X </BracketText>`. */
    function checkInside(node) {
      const kids = node.children;
      if (!kids.length) return;
      const first = kids[0];
      const last = kids.at(-1);
      const text = (c) => (c?.type === 'JSXText' ? c.raw : '');
      // A run that contains a line break is JSX layout and is dropped when rendered; only same-line whitespace is padding.
      const lead = (re) => re.exec(text(first))?.[0] ?? '';
      const trail = (re) => re.exec(text(last))?.[0] ?? '';
      const openBr = lead(new RegExp(`^(?:${JSX_WS})*\\[(?:${JSX_WS})*`));
      const closeBr = trail(new RegExp(`(?:${JSX_WS})*\\](?:${JSX_WS})*$`));
      const bracketed = openBr && closeBr && !(first === last && openBr.length + closeBr.length > text(first).length);
      const padLead = lead(new RegExp(`^(?:${JSX_WS})+`));
      const padTrail = trail(new RegExp(`(?:${JSX_WS})+$`));
      const pad = (run) => run && !/[\n\r]/.test(run) && allWs(decodeJsx(run));
      const cutLead = bracketed ? openBr.length : pad(padLead) ? padLead.length : 0;
      const cutTrail = bracketed ? closeBr.length : pad(padTrail) ? padTrail.length : 0;
      if (!cutLead && !cutTrail) return;
      if (first === last && cutLead + cutTrail >= text(first).length) return; // nothing would be left
      context.report({
        node,
        message: INNER,
        fix: (fixer) =>
          [
            cutLead && fixer.removeRange([first.range[0], first.range[0] + cutLead]),
            cutTrail && fixer.removeRange([last.range[1] - cutTrail, last.range[1]]),
          ].filter(Boolean),
      });
    }

    /** A string or template: where does it render, and can it be replaced by an element there? */
    function checkString(node) {
      const value = node.type === 'Literal' ? node.value : node.quasis.map((q) => q.value.cooked ?? q.value.raw).join(HOLE);
      if (!findLabels(value, WS, (s) => s).length) return;
      let at = node;
      let replaceable = true;
      while (at.parent.type === 'ConditionalExpression' || at.parent.type === 'LogicalExpression' || at.parent.type === 'TemplateLiteral') {
        const p = at.parent;
        if (p.type === 'ConditionalExpression' && p.test === at) replaceable = false;
        if (p.type === 'LogicalExpression' && (p.left === at || p.operator !== '&&')) replaceable = false;
        if (p.type === 'TemplateLiteral') replaceable = false;
        at = p;
      }
      const host = at.parent;
      if (host.type !== 'JSXExpressionContainer' && host.type !== 'JSXAttribute') return;
      const inChild = host.type === 'JSXExpressionContainer' && host.parent.type !== 'JSXAttribute';

      // The whole string must be one label, so the replacement is exactly that label.
      const body = source.text.slice(node.range[0] + 1, node.range[1] - 1);
      const whole = findLabels(body, JS_WS, decodeJs).find((l) => l.start === 0 && l.end === body.length);
      if (!inChild || !replaceable || !whole) return context.report({ node, message: MESSAGE });

      const label = body.slice(...whole.inner);
      let child;
      // `[ ${title} ]` leaves a template that is only `${title}`: write the expression itself.
      const only = node.type === 'TemplateLiteral' && /^\$\{([^`]*)\}$/.exec(label);
      if (only && node.expressions.length === 1) child = `{${only[1]}}`;
      else if (node.type === 'TemplateLiteral') child = `{\`${label}\`}`;
      else if (/^[^{}<>&\\'"]*$/.test(label) && label.trim() === label) child = label;
      else child = `{${node.raw[0]}${label}${node.raw[0]}}`;
      // A string that is the whole container is replaced with the container; one inside an expression, in place.
      const range = at === node && host.expression === node ? host.range : node.range;
      report(node, range, `<BracketText>${child}</BracketText>`);
    }

    return {
      JSXElement: checkChildren,
      JSXFragment: checkChildren,
      Literal(node) {
        if (typeof node.value === 'string') checkString(node);
      },
      TemplateLiteral: checkString,
    };
  },
};
