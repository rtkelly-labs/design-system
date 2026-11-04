/**
 * The rules that say a colour must be addressed as a role.
 *
 * These live here, in one place, because two very different things enforce them:
 *
 *   - `scripts/check-tokens.mjs` runs them over `src/components` and
 *     `src/stories` as a **ratchet**. Those files carry pre-existing debt, so
 *     each rule has a budget and CI fails only when a number rises.
 *   - `@rtkelly-labs/design-system-report`'s linter runs them over a report's TSX
 *     at **budget zero**. A
 *     report is new code written today; there is no debt to grandfather, and a
 *     hex literal in one renders identically on `midnight` and on `white`, which
 *     is the whole failure the ladder exists to prevent.
 *
 * The check script imports this `.ts` file directly — Node strips the types.
 * That is worth preserving: the previous arrangement had the rules written out
 * in a script, so anything else wanting them had to copy the regexes, and a copy
 * is a rule that silently stops matching the original.
 */

export interface TokenRule {
  id: 'hex' | 'rawPalette' | 'legacyAlias' | 'darkVariant';
  label: string;
  /** Global, so callers must use `match`/`matchAll`, which reset `lastIndex`. */
  pattern: RegExp;
  fix: string;
}

export const TOKEN_RULES: readonly TokenRule[] = [
  {
    id: 'hex',
    label: 'Hex literals',
    pattern: /#[0-9a-fA-F]{3,8}\b/g,
    fix: 'Use a --ds-* token or a semantic utility (bg-surface-raised, text-accent-primary).',
  },
  {
    id: 'rawPalette',
    label: 'Literal Tailwind palette utilities',
    pattern:
      /\b(?:bg|text|border|divide|placeholder|ring|from|to|via)-(?:white|black|zinc|gray|slate|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d{2,3})?(?:\/\d{1,3})?\b/g,
    fix: 'Use the semantic utilities: bg-surface-*, text-content-*, border-edge-*, text-intent-*.',
  },
  {
    id: 'legacyAlias',
    label: 'Legacy brutalist-* colour aliases',
    // `brutalist-card` / `-btn` / `-badge` are component classes in styles.css,
    // already written against roles — they are not colour names and stay.
    pattern: /\bbrutalist-(?:cyan|neonCyan|pink|yellow|neonGreen|green|cyberOrange|darkBg|shadow-color)\b/g,
    fix: 'Use accent-*/intent-* utilities or --ds-* tokens. Blocks removing the compat block in theme.css.',
  },
  {
    id: 'darkVariant',
    label: 'dark: colour variants',
    pattern: /\bdark:(?:bg|text|border|divide|placeholder|ring|from|to|via)-/g,
    fix: 'Tokens switch on their own. dark: is only for non-colour utilities, and means "midnight or dim" now.',
  },
];

export interface Finding<Id extends string = string> {
  ruleId: Id;
  line: number;
  match: string;
  /** The trimmed source line, for pointing at the offence. */
  text: string;
}

/**
 * Line-by-line rule matching, shared by the ratchet and the report linter.
 *
 * Comment lines are skipped, and that is not a loophole being left open: this
 * very file, `AGENTS.md`'s examples and the rules' own `fix` strings all name
 * the forbidden patterns in prose. Without the skip the checker's first finding
 * would be itself.
 *
 * Matching against the *trimmed* line rather than the raw one is safe because no
 * rule can match leading whitespace, and it means the reported `text` is what
 * gets printed under the finding.
 */
export function scanRules<Id extends string>(
  source: string,
  rules: readonly { id: Id; pattern: RegExp }[],
): Finding<Id>[] {
  const findings: Finding<Id>[] = [];
  source.split('\n').forEach((line, index) => {
    const text = line.trim();
    if (text.startsWith('*') || text.startsWith('//') || text.startsWith('/*')) return;
    for (const rule of rules) {
      for (const match of text.match(rule.pattern) ?? []) {
        findings.push({ ruleId: rule.id, line: index + 1, match, text });
      }
    }
  });
  return findings;
}

/** Every colour-instead-of-role violation in one file's source. */
export function scanTokenRules(source: string): Finding<TokenRule['id']>[] {
  return scanRules(source, TOKEN_RULES);
}
