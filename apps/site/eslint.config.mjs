import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
// A dev-only reach into the workspace package, like the colour scanner but unpublished: lint is not consumer code.
import { noHandBrackets } from '../../packages/design-system/scripts/eslint-bracket-rule.mjs';

/**
 * The site's lint: the same general-purpose rulesets the package ratchets
 * (`react-hooks`, `jsx-a11y`, typescript-eslint's recommended set), at zero —
 * a new site starts clean rather than inheriting a budget. The colour rules are
 * `check:tokens`, which runs the package's own published scanner. Bracketed
 * labels go through `<BracketText>`, held by the package's own lint rule.
 */
export default tseslint.config(
  { ignores: ['.next/**', 'out/**', 'src/generated/**', 'next-env.d.ts'] },
  {
    files: ['src/**/*.{ts,tsx}', 'scripts/**/*.{mts,mjs}'],
    extends: [tseslint.configs.recommended],
    plugins: { 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y, brackets: { rules: { 'no-hand-brackets': noHandBrackets } } },
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      'brackets/no-hand-brackets': 'error',
    },
  },
);
