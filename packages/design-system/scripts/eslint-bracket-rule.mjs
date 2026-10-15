/**
 * The local rule: a bracketed label is `<BracketText>`, never typed by hand.
 *
 * `[ PAGE ]` written out has three faults `BracketText` does not: a line can
 * break between a bracket and its word (G03), a screen reader announces the
 * brackets as part of the name ("left bracket, Delete domain"), and a copy of
 * the label carries them. The first fix tried was a no-break space at 88 call
 * sites, which the next hand-typed label undoes. This rule makes the component
 * the only way to write one.
 *
 * Only text a reader sees is checked: JSX text, and strings or templates that
 * are a JSX child or attribute value (directly, or through a conditional).
 * Code samples held in plain strings — `const xs = [ 1, 2 ]` — are not labels.
 *
 * The site imports this file too (`apps/site/eslint.config.mjs`), so the
 * package and its one real consumer are held to the same rule.
 */

/** `[`, a space of any kind, the label, a space, `]`. */
export const HAND_BRACKET = /\[(?:\s| |&nbsp;)[^\]\n]*?(?:\s| |&nbsp;)\]/;

const MESSAGE = 'Bracket a label with <BracketText>, not by hand: hand-typed brackets can strand on a line, are read aloud, and are copied.';

/** Is this string expression rendered as JSX text or an attribute value? */
function inJsx(node) {
  let at = node.parent;
  while (at && (at.type === 'ConditionalExpression' || at.type === 'LogicalExpression' || at.type === 'TemplateLiteral')) at = at.parent;
  return at?.type === 'JSXExpressionContainer' || at?.type === 'JSXAttribute';
}

export const noHandBrackets = {
  meta: {
    type: 'problem',
    docs: { description: MESSAGE },
    schema: [],
  },
  create(context) {
    const check = (node, text) => {
      if (text && HAND_BRACKET.test(text)) context.report({ node, message: MESSAGE });
    };
    // `[ {title} ]` is three children, so an element's children are read as one
    // string, each expression or nested element standing in as `x`.
    // SVG `<text>` is exempt: a `<span>` is not valid inside it, and SVG text does not wrap.
    const SVG_TEXT = new Set(['text', 'tspan']);
    const children = (node) => {
      if (SVG_TEXT.has(node.openingElement?.name?.name)) return;
      check(node, node.children.map((c) => (c.type === 'JSXText' ? c.raw : 'x')).join(''));
    };
    return {
      JSXElement: children,
      JSXFragment: children,
      Literal(node) {
        if (typeof node.value === 'string' && inJsx(node)) check(node, node.value);
      },
      // The quasis of `[ ${n} RESULTS ]` are joined around a stand-in,
      // so a label split by an interpolation is still seen whole.
      TemplateLiteral(node) {
        if (inJsx(node)) check(node, node.quasis.map((q) => q.value.cooked ?? q.value.raw).join('x'));
      },
    };
  },
};
