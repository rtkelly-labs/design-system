/**
 * The local rule: address a colour by its role, not by its value.
 *
 * Lives here rather than inline in `eslint.config.mjs` so it can be imported by
 * `src/lint.test.ts` — a lint rule with no test is a rule you find out about the
 * day it silently stops matching, and this one is the whole enforcement now that
 * the counting ratchet is gone.
 */

import { TOKEN_RULES } from './token-rules.mjs';

export const noColourLiterals = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Address a colour by its role, not by its value. See AGENTS.md § Semantic Theming.',
    },
    schema: [],
  },
  create(context) {
    /** Report every match in a string, not just the first. */
    function check(node, text) {
      if (!text) return;
      for (const rule of TOKEN_RULES) {
        // A fresh regex per pass: the shared ones carry /g, so lastIndex would
        // otherwise leak between files and silently skip matches.
        const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
        let match;
        while ((match = pattern.exec(text)) !== null) {
          context.report({
            node,
            message: `${rule.label}: \`${match[0]}\`. ${rule.fix}`,
          });
          if (match[0] === '') pattern.lastIndex += 1;
        }
      }
    }

    return {
      // String literals, including JSX attribute values.
      Literal(node) {
        if (typeof node.value === 'string') check(node, node.value);
      },
      // Template literals are where composed class strings live, so skipping
      // them would exempt exactly the code most likely to be wrong.
      TemplateElement(node) {
        check(node, node.value?.cooked ?? node.value?.raw);
      },
    };
  },
};
