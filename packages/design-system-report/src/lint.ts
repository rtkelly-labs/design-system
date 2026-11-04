/**
 * The design system's own rules, applied to a report's TSX before it renders.
 *
 * A report written outside this repo is otherwise unchecked: no ESLint config
 * exists, `pnpm check:tokens` only ever scans `src/components` and
 * `src/stories`, and esbuild strips types without reading them. So the file most
 * likely to be written by an agent in a hurry was the one file nothing looked at.
 *
 * Two families of rule, and the split is deliberate:
 *
 *   - **Errors** are the token rules from `src/lib/tokenRules.ts`, at budget
 *     **zero**. Those files carry pre-existing debt and are ratcheted; a report
 *     written today has none, and a hex literal in one renders identically on
 *     `midnight` and on `sketch` — exactly the failure the ladder exists to
 *     prevent. Blocking is right.
 *   - **Warnings** are the two ways a report can be *valid* React and still
 *     wrong as a static document: it renders no client JS, and it should produce
 *     the same bytes twice. Neither is always a mistake, so neither blocks —
 *     `--strict` promotes them for CI.
 */

import { TOKEN_RULES, scanRules, type TokenRule } from '@rtkelly-labs/design-system';

interface StaticRule {
  id: 'nondeterministic' | 'inert';
  label: string;
  pattern: RegExp;
  fix: string;
}

const STATIC_RULES: readonly StaticRule[] = [
  {
    id: 'nondeterministic',
    label: 'Value that changes between runs',
    /**
     * `new Date()` with no argument only — `new Date('2026-08-19')` is a fixed
     * point in time and is exactly the right way to write a report's date.
     */
    pattern: /\bnew Date\(\s*\)|\bDate\.now\(|\bMath\.random\(|\bperformance\.now\(|\brandomUUID\(/g,
    fix: 'Pass the value in as a prop, or write it as a literal. A report that differs on every run cannot be diffed to answer "did anything change".',
  },
  {
    id: 'inert',
    label: 'Behaviour that will not run',
    /**
     * `onClick={...}`, `onChange={...}` and the state hooks. `useMemo` and
     * `useId` are fine: both do their work during the render that we capture.
     *
     * Two details are load-bearing, and both were found by running this rule
     * over the package's own components and not believing the result. Rules
     * match a *trimmed* line, so the handler pattern must anchor on a word
     * boundary rather than whitespace — `onClick={` is at index 0 of any line
     * that starts with it, which is most of them. And a hook can be called with
     * an explicit type argument, so `useState<Record<string, boolean>>({})` has
     * no `(` after the name at all.
     */
    pattern:
      /\bon[A-Z]\w+=\{|\b(?:useState|useEffect|useLayoutEffect|useReducer)\s*[(<]/g,
    fix: 'The output is static HTML with no client JS. Put the information in the document instead of behind a control — <details> gives collapsible sections with no script at all.',
  },
];

export type Severity = 'error' | 'warning';

export interface ReportProblem {
  severity: Severity;
  rule: TokenRule['id'] | StaticRule['id'];
  label: string;
  line: number;
  match: string;
  text: string;
  fix: string;
}

const LABELS = new Map<string, { label: string; fix: string }>(
  [...TOKEN_RULES, ...STATIC_RULES].map((rule) => [rule.id, { label: rule.label, fix: rule.fix }]),
);

/** Every problem in a report's source, worst first and then in file order. */
export function lintReport(source: string): ReportProblem[] {
  const of = (severity: Severity, rules: readonly { id: string; pattern: RegExp }[]) =>
    scanRules(source, rules).map((finding): ReportProblem => {
      const rule = LABELS.get(finding.ruleId);
      return {
        severity,
        rule: finding.ruleId as ReportProblem['rule'],
        label: rule?.label ?? finding.ruleId,
        fix: rule?.fix ?? '',
        line: finding.line,
        match: finding.match,
        text: finding.text,
      };
    });

  return [...of('error', TOKEN_RULES), ...of('warning', STATIC_RULES)].sort(
    (a, b) =>
      Number(b.severity === 'error') - Number(a.severity === 'error') || a.line - b.line,
  );
}

/**
 * Problems as text, grouped by rule so a report with forty hex literals reports
 * one rule and its fix rather than forty copies of the same advice.
 */
export function formatProblems(file: string, problems: readonly ReportProblem[]): string {
  const byRule = new Map<string, ReportProblem[]>();
  for (const problem of problems) {
    byRule.set(problem.rule, [...(byRule.get(problem.rule) ?? []), problem]);
  }

  const blocks: string[] = [];
  for (const [, group] of byRule) {
    const first = group[0] as ReportProblem;
    blocks.push(
      `  ${first.severity === 'error' ? 'error' : 'warn '}  ${first.label} (${group.length})\n` +
        group.map((p) => `         ${file}:${p.line}  ${p.match}`).join('\n') +
        `\n         → ${first.fix}`,
    );
  }
  return blocks.join('\n\n');
}
