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
 * `check:tokens`); a consumer's code is not that debt.
 *
 * An exception has two possible homes. By default it is written at the site,
 * `ds-allow-type: <reason>`, printed, and failed without a reason. A consumer
 * that wants every exception to pass a reviewer instead passes
 * `--no-inline-exceptions` and `--exceptions-file`: the marker then fails, and
 * the only way past a finding is an entry in one file that code review owns.
 * An entry that no longer excuses anything fails too, so the file cannot
 * quietly accumulate.
 *
 *   ds-lint web                                   every rule over web/
 *   ds-lint --only type web/app.css               one family
 *   ds-lint --exceptions web                      also print every exception
 *   ds-lint --no-inline-exceptions \
 *           --exceptions-file ds-exceptions.json web
 *
 * The exceptions file is a JSON array of `{ "file", "match", "reason" }`, where
 * `file` is the path ds-lint prints and `match` is the text it prints for the
 * finding. Line numbers are left out on purpose: they move with every edit.
 */

import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
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

/** One entry of an exceptions file. */
export interface FileException {
  file: string;
  match: string;
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

/**
 * Split findings into those an exceptions file excuses and those it does not,
 * and name every entry that is malformed or excuses nothing.
 */
export function applyExceptionsFile(
  findings: readonly LintFinding[],
  entries: readonly FileException[],
): { remaining: LintFinding[]; excused: LintFinding[]; problems: string[] } {
  const problems: string[] = [];
  const used = new Set<number>();
  const remaining: LintFinding[] = [];
  const excused: LintFinding[] = [];
  for (const finding of findings) {
    const at = entries.findIndex((e) => e.file === finding.file && e.match.trim() === finding.match.trim());
    if (at < 0) remaining.push(finding);
    else {
      used.add(at);
      excused.push(finding);
    }
  }
  entries.forEach((entry, index) => {
    const where = `exception ${index + 1} (${entry.file ?? '?'}: ${entry.match ?? '?'})`;
    if (typeof entry.file !== 'string' || typeof entry.match !== 'string') {
      problems.push(`${where} needs a "file" and a "match".`);
    } else if (typeof entry.reason !== 'string' || !entry.reason.trim()) {
      problems.push(`${where} needs a reason.`);
    } else if (!used.has(index)) {
      problems.push(`${where} excuses nothing any more: delete it.`);
    }
  });
  return { remaining, excused, problems };
}

function readExceptionsFile(file: string): FileException[] {
  if (!existsSync(file)) throw new Error(`--exceptions-file: ${file} does not exist.`);
  const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'));
  if (!Array.isArray(parsed)) throw new Error(`--exceptions-file: ${file} must hold a JSON array.`);
  return parsed as FileException[];
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

const USAGE = [
  'Usage: ds-lint [--only type|tokens] [--exceptions] [--no-inline-exceptions] [--exceptions-file <json>] <file-or-dir>...',
  "Runs the design system's published type and colour rules at budget zero.",
];

/** The command. Returns the exit code rather than exiting, so it can be tested. */
export function main(argv: readonly string[], log = console.log, error = console.error): number {
  const targets: string[] = [];
  let families: RuleFamily[] = ['type', 'tokens'];
  let showExceptions = false;
  let inlineAllowed = true;
  let exceptionsFile: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--only') families = parseFamilies(argv[++i]);
    else if (arg.startsWith('--only=')) families = parseFamilies(arg.slice('--only='.length));
    else if (arg === '--exceptions') showExceptions = true;
    else if (arg === '--no-inline-exceptions') inlineAllowed = false;
    else if (arg === '--exceptions-file') exceptionsFile = argv[++i];
    else if (arg.startsWith('--exceptions-file=')) exceptionsFile = arg.slice('--exceptions-file='.length);
    else if (arg === '--help' || arg === '-h') {
      for (const line of USAGE) log(line);
      return 0;
    } else targets.push(arg);
  }
  if (targets.length === 0) {
    error('ds-lint: name at least one file or directory.');
    return 2;
  }
  if (exceptionsFile === '') {
    error('ds-lint: --exceptions-file needs a path.');
    return 2;
  }

  let findings: LintFinding[] = [];
  const inline: LintException[] = [];
  for (const target of targets) {
    for (const file of collect(target)) {
      const rel = path.relative(process.cwd(), file).split(path.sep).join('/');
      const result = lintSource(rel, readFileSync(file, 'utf8'), families);
      findings.push(...result.findings);
      inline.push(...result.exceptions);
    }
  }

  let fileProblems: string[] = [];
  let excused: LintFinding[] = [];
  if (exceptionsFile !== undefined) {
    const applied = applyExceptionsFile(findings, readExceptionsFile(exceptionsFile));
    findings = applied.remaining;
    excused = applied.excused;
    fileProblems = applied.problems.map((p) => `${exceptionsFile}: ${p}`);
  }

  // With inline exceptions off, the marker itself is the failure: removing it
  // brings back the finding it hid, which then needs a step or a file entry.
  const refused = inlineAllowed ? inline.filter((e) => !e.reason) : inline;

  for (const f of findings) error(`${f.file}:${f.line}  ${f.match}  [${f.family}/${f.ruleId}]\n    ${f.fix}`);
  for (const e of refused) {
    error(
      inlineAllowed
        ? `${e.file}:${e.line}  ds-allow-type: needs a reason after the colon.`
        : `${e.file}:${e.line}  ds-allow-type: is not accepted here. Use a step of the scale${
            exceptionsFile ? `, or record the site in ${exceptionsFile} for review` : ''
          }.`,
    );
  }
  for (const p of fileProblems) error(p);

  if (showExceptions && (inline.length || excused.length)) {
    log('Exceptions:');
    for (const e of inline) log(`  ${e.file}:${e.line}  ${e.reason || '(no reason given)'}`);
    for (const f of excused) log(`  ${f.file}:${f.line}  ${f.match}  (${exceptionsFile})`);
  }

  if (findings.length || refused.length || fileProblems.length) {
    error(
      `\n${findings.length} finding(s), ${refused.length} refused inline exception(s), ${fileProblems.length} exceptions-file problem(s). Budget is zero.`,
    );
    error('Type is addressed by step and colour by role: see DESIGN.md §7 of @rtkelly-labs/design-system.');
    return 1;
  }
  log(`ds-lint: clean (${families.join(', ')}), ${inline.length + excused.length} exception(s).`);
  return 0;
}

// A package manager runs a bin through a symlink or a shim, so compare real paths.
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  process.exitCode = main(process.argv.slice(2));
}
