import tseslint from 'typescript-eslint';
import tailwindcss from 'eslint-plugin-tailwindcss';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

import { authoredClasses } from './scripts/authored-classes.mjs';
import { noColourLiterals } from './scripts/eslint-token-rule.mjs';

/**
 * Lint config. Two rules, answering the two ways a class can be wrong: a colour
 * named by its value instead of its role, and a class that names nothing at all.
 * `src/lint.test.ts` pins both, and pins this configuration — most of what can
 * break here is a setting, not rule logic.
 *
 * ## Why this exists next to `pnpm check:tokens`
 *
 * They are not duplicates, they answer different questions. `check:tokens`
 * answers *how much debt is left* — one number, in CI, after you have pushed.
 * This answers *where, and what should it be instead* — in the editor, before
 * the code is written. The second is what actually stops new violations, since
 * the first only ever says no once the work is done.
 *
 * Both read `scripts/token-rules.mjs`, so there is one definition of what counts
 * and the two cannot drift apart.
 *
 * ## Why a local rule rather than `no-restricted-syntax`
 *
 * `no-restricted-syntax` can match a string literal against a regex, so the four
 * patterns could have been inlined as selectors. That means serialising each
 * regex into an esquery selector string and keeping the escaping right — and it
 * loses the `fix` text, which is the half of the message worth reading. A rule
 * that applies the regexes directly reports `bg-zinc-900` *and* what to use
 * instead, and it reports every occurrence in a string rather than the first.
 *
 * ## Scope is load-bearing — read before widening it
 *
 * Only `src/components/**` and `src/stories/**`, matching `check:tokens`.
 *
 * `src/theme/levels.ts` is deliberately *not* linted, and must not be. Ladder
 * rule 4 says every level colour is a literal, precisely so `check:contrast`
 * can audit all 200 role pairs without a browser. Point this rule at it and it
 * reports the design as the bug — and the obvious way to silence it is to
 * delete the thing that makes the ladder auditable. Same for
 * `scripts/build-tokens.mjs`, which writes those literals out.
 *
 * `src/lib/accentClasses.ts` is exempt for the opposite reason: it has to spell
 * class names out in full because Tailwind's scanner reads source text, and a
 * template literal would generate no CSS at all.
 */

export default tseslint.config(
  {
    // Build output, reports and coverage are not source.
    ignores: [
      'dist/**',
      'storybook-static/**',
      'playwright-report/**',
      'walkthrough-report/**',
      'test-results/**',
      'coverage/**',
      'temp/**',
    ],
  },
  {
    name: 'design-system/tokens',
    files: ['src/components/**/*.{ts,tsx}', 'src/stories/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'design-system': { rules: { 'no-colour-literals': noColourLiterals } } },
    rules: { 'design-system/no-colour-literals': 'error' },
  },
  {
    /**
     * Does this class exist at all?
     *
     * The rule above catches a colour named wrongly. This catches the other
     * failure, and the more expensive one: a class that names *nothing*.
     * `focus:border-brutalist-green`, `brutalist-card-panel`,
     * `.sketch .ascii-divider::after` and `bracket-glyph` were all of this kind —
     * dead on the day they were written, surviving every review that read them as
     * intentional, because Tailwind does not care. An unknown utility emits no
     * CSS, exits 0 and warns about nothing.
     *
     * `no-custom-classname` only knows Tailwind's own classes, which on its own
     * makes it unusable here — it flags `docs-toc-link`, a real rule in
     * `prose.css`, exactly as loudly as a dead one. The whitelist is therefore
     * *derived* from the stylesheets rather than hand-written, which turns the
     * question from "is this a Tailwind class" into "does this class exist", and
     * leaves nothing to maintain: a docs-chrome class migrated into a `recipe`
     * leaves `prose.css`, leaves the derived list, and starts being rejected.
     */
    name: 'design-system/classnames',
    files: ['src/components/**/*.{ts,tsx}', 'src/stories/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { tailwindcss },
    settings: {
      tailwindcss: {
        // Singular `src/style.css` is the plugin's default and does not exist here.
        cssConfigPath: 'src/styles.css',
        // `recipe` is this repo's name for `tv`. Without it the plugin never looks
        // inside a recipe — which is where most class strings live.
        functions: ['classnames', 'clsx', 'cn', 'cva', 'tv', 'recipe', 'twMerge'],
      },
    },
    rules: {
      'tailwindcss/no-custom-classname': ['error', { whitelist: authoredClasses() }],
    },
  },

  /**
   * The general-purpose ruleset, as **warnings**.
   *
   * PR #58 tried to land this as errors together with the fixes it demands, and
   * failed its own `lint` job on a long run of `no-explicit-any` it had not got
   * to. It never merged. #149 is the correction: land the rules first, green,
   * then spend the count down.
   *
   * `pnpm check:lint-budget` is the ratchet — it counts these warnings and fails
   * if the number rises, which is the same shape `check:css`, `check:deps` and
   * `check:fonts` use, and what `check:tokens` used until it reached zero.
   * Warnings rather than errors so `pnpm lint` stays honest about the two rules
   * that *are* at zero: a colour named by value, and a class naming nothing.
   *
   * `react-hooks` still ships its recommended set eslintrc-shaped, with a
   * `plugins: ['react-hooks']` array that flat config rejects. Register the
   * plugin object and reuse its rule list, so the set stays whatever the plugin
   * says it is rather than a copy that drifts.
   */
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y, '@typescript-eslint': tseslint.plugin },
    rules: {
      ...Object.fromEntries(
        Object.entries(reactHooks.configs.recommended.rules ?? {}).map(([rule]) => [rule, 'warn']),
      ),
      ...Object.fromEntries(
        Object.entries(jsxA11y.flatConfigs?.recommended?.rules ?? {}).map(([rule]) => [rule, 'warn']),
      ),
      '@typescript-eslint/no-explicit-any': 'warn',

      /*
       * `region` is allowed to carry a `tabIndex`, because here the two
       * accessibility tools disagree and axe is right.
       *
       * A `<pre>` that scrolls horizontally cannot be scrolled by keyboard at
       * all unless it is focusable — axe's `scrollable-region-focusable`, and a
       * real trap rather than a technicality. `jsx-a11y` objects to a `tabIndex`
       * on a non-interactive element, which is correct as a general rule and
       * wrong for a scroll container. The WAI remedy is exactly what is written:
       * `tabindex="0"` plus `role="region"` and an accessible name, so the thing
       * a keyboard user lands on announces what it is.
       */
      'jsx-a11y/no-noninteractive-tabindex': ['warn', { roles: ['region', 'tabpanel'] }],
    },
  },
);
