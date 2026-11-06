/**
 * The package's own colour rules, held against this site at budget zero.
 *
 * `scanTokenRules` is published so that a consumer can hold itself to the
 * rule the package holds itself to: no hex literals, no raw palette (hue)
 * classes, no legacy aliases, no `dark:` variant standing in for a level. The
 * site is the first consumer to use it on a real codebase. Colour here is
 * addressed by role or it fails the build.
 *
 *   node scripts/check-tokens.mjs
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOKEN_RULES, scanTokenRules } from '@rtkelly13/design-system';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');
const SKIP = new Set(['generated']);

function walk(dir, found = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, found);
    else if (/\.(tsx?|css)$/.test(entry)) found.push(full);
  }
  return found;
}

const files = walk(SRC);
const findings = files.flatMap((file) =>
  scanTokenRules(readFileSync(file, 'utf8')).map((f) => ({ ...f, file: path.relative(SRC, file) })),
);

if (findings.length) {
  const fixes = Object.fromEntries(TOKEN_RULES.map((r) => [r.id, r.fix]));
  console.error(`\nColour addressed by something other than a role (${findings.length}):\n`);
  for (const f of findings) console.error(`  src/${f.file}:${f.line}  ${f.match}  → ${fixes[f.ruleId]}`);
  process.exit(1);
}
console.log(`Tokens OK: ${files.length} files, 0 colour call sites outside the role vocabulary.`);
