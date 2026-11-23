#!/usr/bin/env node
/**
 * `ds-lint`: the published rules, run by a consumer over its own sources.
 *
 * ADR 0008: a consumer does not copy this system's rules, it runs them. A copy
 * is a rule that silently stops matching the original, which is how rig's token
 * gate came to check no type at all. So the rules ship in the package and this
 * command runs them, and a consumer's CI wires the command rather than a list of
 * regular expressions. Bumping the package is how a consumer learns of a new rule.
 *
 * Budget zero, always. This repository ratchets its own debt (`check:type`,
 * `check:tokens`); a consumer's code is not that debt. An exception is written at
 * the site with `ds-allow-type: <reason>`, is printed, and fails without a reason.
 *
 *   ds-lint web                       every rule over web/
 *   ds-lint --only type web/app.css   one family
 *   ds-lint --exceptions web          also print every exception
 */

import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { TOKEN_RULES, scanTokenRules } from '../lib/tokenRules.ts';
import { TYPE_RULES, scanTypeRules, typeExceptions } from '../lib/typeRules.ts';

export type RuleFamily = 'type' | 'tokens';

export interface LintFinding {
  file: string;
  line: number;
  family: RuleFamily;
  ruleId: string;
  match: string;
  fix: string;
}

export interface LintException {
  file: string;
  line: number;
  reason: string;
}

const FIXES: Record<string, string> = Object.fromEntries(
  [...TYPE_RULES, ...TOKEN_RULES].map((rule) => [rule.id, rule.fix]),
);

/** Files a rule can be broken in. Markup and styles, not data. */
export const LINTED = /\.(?:[cm]?[jt]sx?|css|html|mdx?)$/;

/** Never a consumer's own source. */
const SKIPPED_DIRS = new Set(['node_modules', 'dist', 'build', 'out', 'coverage', '.git', '.next', 'temp']);

/** Every finding and exception in one file's source. */
export function lintSource(
  file: string,
  source: string,
  families: readonly RuleFamily[] = ['type', 'tokens'],
): { findings: LintFinding[]; exceptions: LintException[] } {
  const findings: LintFinding[] = [];
  if (families.includes('type')) {
    for (const f of scanTypeRules(source)) {
      findings.push({ file, line: f.line, family: 'type', ruleId: f.ruleId, match: f.match, fix: FIXES[f.ruleId] });
    }
  }
  if (families.includes('tokens')) {
    for (const f of scanTokenRules(source)) {
      findings.push({ file, line: f.line, family: 'tokens', ruleId: f.ruleId, match: f.match, fix: FIXES[f.ruleId] });
    }
  }
  const exceptions = families.includes('type')
    ? typeExceptions(source).map((e) => ({ file, ...e }))
    : [];
  return { findings, exceptions };
}

function collect(target: string): string[] {
  const stat = statSync(target);
  if (stat.isFile()) return [target];
  return readdirSync(target).flatMap((name) => {
    if (SKIPPED_DIRS.has(name)) return [];
    const full = path.join(target, name);
    return statSync(full).isDirectory() ? collect(full) : LINTED.test(name) ? [full] : [];
  });
}

function parseFamilies(value: string | undefined): RuleFamily[] {
  const known: RuleFamily[] = ['type', 'tokens'];
  const asked = (value ?? '').split(',').filter(Boolean);
  const unknown = asked.filter((name) => !known.includes(name as RuleFamily));
  if (unknown.length || asked.length === 0) {
    throw new Error(`--only takes ${known.join(' or ')}, comma-separated; got "${value ?? ''}".`);
  }
  return asked as RuleFamily[];
}

/** The command. Returns the exit code rather than exiting, so it can be tested. */
export function main(argv: readonly string[], log = console.log, error = console.error): number {
  const targets: string[] = [];
  let families: RuleFamily[] = ['type', 'tokens'];
  let showExceptions = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--only') families = parseFamilies(argv[++i]);
    else if (arg.startsWith('--only=')) families = parseFamilies(arg.slice('--only='.length));
    else if (arg === '--exceptions') showExceptions = true;
    else if (arg === '--help' || arg === '-h') {
      log('Usage: ds-lint [--only type|tokens] [--exceptions] <file-or-dir>...');
      log('Runs the design system\'s published type and colour rules at budget zero.');
      return 0;
    } else targets.push(arg);
  }
  if (targets.length === 0) {
    error('ds-lint: name at least one file or directory.');
    return 2;
  }

  const findings: LintFinding[] = [];
  const exceptions: LintException[] = [];
  for (const target of targets) {
    for (const file of collect(target)) {
      const rel = path.relative(process.cwd(), file).split(path.sep).join('/');
      const result = lintSource(rel, readFileSync(file, 'utf8'), families);
      findings.push(...result.findings);
      exceptions.push(...result.exceptions);
    }
  }
  const unexplained = exceptions.filter((e) => !e.reason);

  for (const f of findings) error(`${f.file}:${f.line}  ${f.match}  [${f.family}/${f.ruleId}]\n    ${f.fix}`);
  for (const e of unexplained) error(`${e.file}:${e.line}  ds-allow-type: needs a reason after the colon.`);
  if (showExceptions && exceptions.length) {
    log('Exceptions:');
    for (const e of exceptions) log(`  ${e.file}:${e.line}  ${e.reason || '(no reason given)'}`);
  }

  if (findings.length || unexplained.length) {
    error(`\n${findings.length} finding(s), ${unexplained.length} unexplained exception(s). Budget is zero.`);
    error('Type is addressed by step and colour by role: see DESIGN.md §7 of @rtkelly-labs/design-system.');
    return 1;
  }
  log(`ds-lint: clean (${families.join(', ')}), ${exceptions.length} exception(s).`);
  return 0;
}

// A package manager runs a bin through a symlink or a shim, so compare real paths.
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  process.exitCode = main(process.argv.slice(2));
}
