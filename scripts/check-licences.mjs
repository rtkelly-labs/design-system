/**
 * Does every shipped package still carry the licence it carried last time?
 *
 * `check:deps` asks whether a dependency is *justified* — every entry in
 * `package.json` has a `kind` and a `why`. It does not ask what any of them is
 * licensed under, and nothing else did either.
 *
 * That mattered the moment `@base-ui/react` arrived: nine packages entered the
 * shipped scope in one commit. #105 resolved them by hand and found them all
 * MIT, which is the right answer and the wrong mechanism — the next bump that
 * changes one is silent, and a licence change in a transitive dependency is
 * exactly the kind of thing nobody is watching for.
 *
 * ## Default-deny, by construction
 *
 * The baseline lists every shipped package and the licence it had when it was
 * recorded. A package that is not in the baseline fails, whatever its licence
 * says — so a new dependency cannot arrive unrecorded, which is the failure mode
 * rather than any particular licence being wrong.
 *
 * ## Scope is the shipped set, not the repo
 *
 * `--prod` only: `dependencies` and what they pull in. A devDependency is not
 * redistributed, and the rule that matters is depend-versus-vendor — see
 * `docs/reference-material.md`, which covers the other half, the artwork that is
 * deliberately kept out of the tree.
 *
 *   node scripts/check-licences.mjs            verify
 *   node scripts/check-licences.mjs --list     print the table
 *   node scripts/check-licences.mjs --update   rewrite the baseline
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = path.join(ROOT, 'licenses.baseline.json');

/** Licences the shipped set may use. Everything here is a deliberate decision. */
const ALLOWED = {
  MIT: 'Permissive, no attribution burden at runtime.',
  ISC: 'Functionally MIT; the OSI treats them as equivalent.',
  'OFL-1.1': 'The SIL Open Font Licence — fonts only, and self-hosting is what it is for.',
  'Apache-2.0':
    'Permissive with a patent grant. Depending on it is not redistributing it, and this repo has depended on TypeScript under exactly these terms since day one.',
  '0BSD': 'Public-domain-equivalent; no conditions at all.',
  Unlicense: 'Public-domain-equivalent dedication; no conditions at all.',
  'MIT and ISC': 'Permissive dual-licence combining MIT and ISC.',
  BSD: 'Permissive.',
  'BSD-2-Clause': 'Permissive.',
  'BSD-3-Clause': 'Permissive.',
};

function current() {
  const raw = execFileSync('pnpm', ['--silent', 'licenses', 'list', '--prod', '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  const byLicence = JSON.parse(raw);
  const out = {};
  for (const [licence, pkgs] of Object.entries(byLicence)) {
    for (const pkg of pkgs) out[pkg.name] = licence;
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

const now = current();

if (process.argv.includes('--update')) {
  writeFileSync(BASELINE, `${JSON.stringify(now, null, 2)}\n`);
  console.log(`Baseline updated — ${Object.keys(now).length} shipped packages.`);
  console.log('Commit licenses.baseline.json; the diff is the licence change under review.');
  process.exit(0);
}

let baseline;
try {
  baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));
} catch {
  console.error(`No ${path.basename(BASELINE)}. Run \`pnpm licences:update\` and commit it.`);
  process.exit(1);
}

if (process.argv.includes('--list')) {
  for (const [name, licence] of Object.entries(now)) {
    console.log(`  ${licence.padEnd(14)} ${name}`);
  }
  console.log('');
}

const problems = [];

for (const [name, licence] of Object.entries(now)) {
  if (!(name in baseline)) {
    problems.push(
      `${name} is shipped and not in the baseline (it reports ${licence}). A dependency cannot arrive unrecorded.`,
    );
  } else if (baseline[name] !== licence) {
    problems.push(`${name} changed licence: ${baseline[name]} -> ${licence}.`);
  }
  if (!(licence in ALLOWED)) {
    problems.push(`${name} is ${licence}, which is not in the allowlist.`);
  }
}

for (const name of Object.keys(baseline)) {
  if (!(name in now)) {
    problems.push(`${name} is in the baseline and no longer shipped. Run \`pnpm licences:update\`.`);
  }
}

console.log(
  `Licences OK — ${Object.keys(now).length} shipped packages, ${new Set(Object.values(now)).size} distinct licences.`,
);

if (problems.length) {
  console.error(`\nLicence check failed — ${problems.length} problem(s):\n`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error(
    '\nIf the change is intended, run `pnpm licences:update` and commit the baseline —\n' +
      'the diff is the licence change under review.',
  );
  process.exit(1);
}
