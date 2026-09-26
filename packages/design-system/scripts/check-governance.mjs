/**
 * Do the repository's own rules still hold?
 *
 * Every other gate in this repo audits the design system. This one audits the
 * gates, because the rules that govern them are written in prose and prose does
 * not fail CI. Three of them had quietly stopped being true:
 *
 *   - **Rule 14 (pinned action SHAs) was violated at 24 of 25 sites.** A `MUST`
 *     in `AGENTS.md` since the day it was written, honoured in exactly one
 *     workflow. Nothing in the repo had ever looked.
 *   - **The gate roster drifted in three places at once.** `docs/ci.md`'s table
 *     omitted `check:tokens`, `ansi:check` and `check:api`; `docs/workflow.md`
 *     rule 6 — the list introduced with "all of these run on every PR" — omitted
 *     four of thirteen. `#144` had just corrected the same class of error one
 *     layer down, in a figure rather than a list.
 *   - **`rule N` citations pointed at the wrong rules.** Nine sites cite
 *     "AGENTS.md rule 9" meaning the timeout ceiling. Rule 9 of `AGENTS.md` was
 *     *Publishing*; the ceiling was rule 9 of `docs/workflow.md`. The two lists
 *     had diverged to eleven rules and nine, and every citation silently
 *     re-pointed as they did.
 *
 * `check:docs` gates the figures in prose against the source. This is the same
 * question asked of the rules: a rule that names a gate, a number or another
 * rule is an assertion about the repository, and this is where it is checked.
 *
 * ## What this does not do
 *
 * It checks that a rule's *references* resolve — that the action is pinned, the
 * gate is wired, the script exists, the cited rule number is the rule the other
 * file numbers the same way. It cannot check that a rule's prose still describes
 * what the workflow does; that needs the sentence understood rather than
 * matched. So `--list` prints what is covered, and the boundary is inspectable
 * rather than assumed — the same contract `check:docs` keeps.
 *
 * Every exemption below carries a reason and is itself checked: an entry that
 * stops being needed is reported, so these cannot become a place to silence the
 * gate.
 *
 *   node scripts/check-governance.mjs           fail if a rule no longer holds
 *   node scripts/check-governance.mjs --list    show every site that was checked
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { REPO_ROOT } from './repo-root.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/*
 * Workflows belong to the repository, not to this package: one `.github/`
 * drives every package under `packages/`. The rosters this cross-checks —
 * AGENTS.md, docs/ci.md, docs/workflow.md, package.json — are this package's,
 * so the two roots are both needed and are deliberately not the same constant.
 */
const GITHUB_ROOT = REPO_ROOT;

/**
 * Resolve a repo-relative path against whichever root owns it.
 *
 * One function rather than two constants at eight call sites: the rule is
 * "`.github` belongs to the repository, everything else to the package", and a
 * rule stated once cannot be applied inconsistently.
 */
const at = (rel) => path.join(rel === '.github' || rel.startsWith('.github/') ? GITHUB_ROOT : ROOT, rel);
const listing = process.argv.includes('--list');
const problems = [];
const census = [];

const read = (rel) => readFileSync(at(rel), 'utf8');
const lines = (rel) => read(rel).split('\n');
const note = (section, ok, text) => census.push({ section, ok, text });

/** Every file under `.github` that can carry a `uses:` or a job. */
function workflowFiles() {
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(at(dir))) {
      const rel = path.join(dir, entry);
      if (statSync(at(rel)).isDirectory()) walk(rel);
      else if (/\.ya?ml$/.test(entry)) found.push(rel);
    }
  };
  walk('.github');
  return found.sort();
}

const WORKFLOWS = workflowFiles();

/* ------------------------------------------------------------------ *
 * Rule 14 — every third-party action is pinned to a 40-character SHA.
 *
 * A mutable tag is a promise that someone else's future commit will run
 * with this repo's `GITHUB_TOKEN`. `backup-main.yml` pinned; nine other
 * files did not, which is the shape an unenforced MUST always takes.
 *
 * The trailing `# vX.Y.Z` comment is required too, not decoration: a bare
 * SHA is unreviewable, and "bump the action" becomes archaeology.
 * ------------------------------------------------------------------ */

const SHA = /^[0-9a-f]{40}$/;
/**
 * Pinned third-party action SHAs.
 * owner/repo -> expected 40-character commit SHA.
 */
const PINNED_ACTIONS = new Map([
  ['amannn/action-semantic-pull-request', '0723387faaf9b38adef4775cd42cfd5155ed6017'],
]);

/** owner/repo -> the one SHA this repo pins it to. Split-brain is a finding. */
const pinnedTo = new Map();

for (const file of WORKFLOWS) {
  lines(file).forEach((line, i) => {
    const match = /^\s*(?:-\s+)?uses:\s*(\S+)\s*(?:#\s*(.*?)\s*)?$/.exec(line);
    if (!match) return;
    const [, spec, comment] = match;
    const at = `${file}:${i + 1}`;

    // A local composite action is this repository's own tree, already gated by
    // everything else here. There is no third party and no SHA to pin.
    if (spec.startsWith('./')) {
      note('pins', true, `${at} — ${spec} (local, no pin required)`);
      return;
    }

    const [action, ref] = [spec.slice(0, spec.lastIndexOf('@')), spec.slice(spec.lastIndexOf('@') + 1)];
    if (!SHA.test(ref)) {
      problems.push(
        `${at}: \`${spec}\` is pinned to a mutable ref. AGENTS.md rule 14 ` +
          `requires a 40-character commit SHA with the version in a trailing ` +
          `comment: \`uses: ${action}@<sha> # ${ref}\`. Resolve it with ` +
          `\`gh api repos/${action}/git/ref/tags/${ref} --jq .object.sha\`.`,
      );
      return;
    }
    if (!comment) {
      problems.push(
        `${at}: \`${action}\` is pinned but names no version. Add the tag the ` +
          `SHA came from as a trailing comment — a bare SHA cannot be reviewed ` +
          `or bumped without archaeology.`,
      );
      return;
    }

    const already = pinnedTo.get(action);
    if (already && already.ref !== ref) {
      problems.push(
        `${at}: \`${action}\` is pinned to ${ref} (${comment}) here and to ` +
          `${already.ref} (${already.comment}) at ${already.at}. One action, one ` +
          `SHA — two means a bump landed in some workflows and not the rest, ` +
          `which is how the pinned one goes stale unnoticed.`,
      );
    } else if (!already) {
      pinnedTo.set(action, { ref, comment, at });
    }

    const expectedSha = PINNED_ACTIONS.get(action);
    if (expectedSha && ref !== expectedSha) {
      problems.push(
        `${at}: \`${action}\` is pinned to ${ref} (${comment}), but PINNED_ACTIONS expects ${expectedSha}.`,
      );
    }
    note('pins', true, `${at} — ${action}@${ref.slice(0, 7)} (${comment})`);
  });
}

/* ------------------------------------------------------------------ *
 * Rule 9 — every job carries a ceiling, and no upload step uses
 * `if: always()`.
 *
 * Both halves are that rule's own words. A job with no `timeout-minutes`
 * inherits six hours and reports `cancelled` — a red mark naming no step,
 * which is how `main` went red on `dafbc1f`. And `always()` on an upload
 * fires on cancellation too, so paired with `if-no-files-found: error` it
 * turns every cancelled run into a failing step.
 * ------------------------------------------------------------------ */

/** Jobs and their steps, by indentation. No YAML dependency for eight regexes. */
function jobsOf(file) {
  const src = lines(file);
  const jobs = [];
  let inJobs = false;
  let current = null;
  src.forEach((line, i) => {
    if (/^jobs:\s*$/.test(line)) { inJobs = true; return; }
    if (!inJobs) return;
    if (/^\S/.test(line) && line.trim()) { inJobs = false; return; }
    const header = /^ {2}([A-Za-z_][\w-]*):\s*$/.exec(line);
    if (header) {
      current = { id: header[1], file, line: i + 1, body: [] };
      jobs.push(current);
      return;
    }
    if (current) current.body.push({ text: line, line: i + 1 });
  });
  return jobs;
}

const ALL_JOBS = WORKFLOWS.flatMap(jobsOf);

for (const job of ALL_JOBS) {
  const hasCeiling = job.body.some(({ text }) => /^\s{4}timeout-minutes:\s*\d+/.test(text));
  if (!hasCeiling) {
    problems.push(
      `${job.file}:${job.line}: job \`${job.id}\` declares no \`timeout-minutes\`. ` +
        `AGENTS.md rule 9: a job without one inherits GitHub's six-hour default, ` +
        `and a run killed there reports \`cancelled\` — naming no step.`,
    );
  }
  note('ceilings', hasCeiling, `${job.file}:${job.line} — ${job.id}`);

  // An upload step is `uses: actions/upload-artifact`; its `if:` is the nearest
  // one above it within the same step, so walk back to the step boundary.
  job.body.forEach(({ text }, index) => {
    if (!/uses:\s*actions\/upload-artifact/.test(text)) return;
    let condition = null;
    for (let k = index; k >= 0; k--) {
      const line = job.body[k].text;
      const found = /^\s*(?:-\s+)?if:\s*(.+?)\s*$/.exec(line);
      if (found) { condition = found[1]; break; }
      if (/^\s{6}-\s/.test(line) && k !== index) break; // previous step
    }
    const at = `${job.file}:${job.body[index].line}`;
    if (condition && /\balways\(\)/.test(condition)) {
      problems.push(
        `${at}: upload step runs on \`${condition}\`. AGENTS.md rule 9: ` +
          `\`always()\` fires on cancellation as well as failure, so with ` +
          `\`if-no-files-found: error\` every cancelled run reports a failing ` +
          `step. Write \`if: success() || failure()\`.`,
      );
    }
    note('uploads', !(condition && /\balways\(\)/.test(condition)), `${at} — if: ${condition ?? '(none)'}`);
  });
}

/* ------------------------------------------------------------------ *
 * Rule 6 — the gate roster, in the four places that state it.
 *
 * `ci.yml` is the only one of the four that executes. The other three are
 * copies, and all three had drifted: two rows of `docs/ci.md`'s table and
 * four entries of `docs/workflow.md` rule 6. A gate that exists and is
 * wired nowhere is the more dangerous direction — `tokens:design:check`
 * shipped a staleness check for the DTCG export and ran in no workflow at
 * all, so the export could go stale in a published package with every
 * check green.
 * ------------------------------------------------------------------ */

const pkg = JSON.parse(read('package.json'));
const scripts = Object.keys(pkg.scripts);

/** What each job in `ci.yml` actually runs, in order. */
const ciJobs = new Map(
  jobsOf('.github/workflows/ci.yml').map((job) => [
    job.id,
    job.body
      .map(({ text }) => /^\s*run:\s*pnpm\s+([\w:-]+)\s*$/.exec(text)?.[1])
      .filter(Boolean),
  ]),
);
const runsInCi = new Set([...ciJobs.values()].flat());
/** Anything run anywhere under `.github`, for the "is it wired at all" test. */
const runsAnywhere = new Set(
  WORKFLOWS.flatMap((file) =>
    lines(file)
      .map((line) => /^\s*run:\s*pnpm\s+([\w:-]+)\s*$/.exec(line)?.[1])
      .filter(Boolean),
  ),
);

/**
 * Gates deliberately not wired into a workflow, each with the reason. An entry
 * that becomes wired, or names a script that no longer exists, is reported —
 * which is what stops this being the place a gate goes to die.
 */
const UNGATED = {
  'check:deployed':
    'Compares the live Storybook with this build, so on a pull request it can only ' +
    'be red: the deployment cannot contain the commit under review. It runs in ' +
    'deployment-drift.yml against the `production` branch after each release train and on a ' +
    'daily schedule, which is ' +
    'where the answer exists. Making it a PR gate would make it a gate that is ' +
    'always red, and a gate that is always red gets deleted.',
};

/**
 * Infrastructure and security guards that run before design-system gates.
 * They enforce cold-build / protocol safety rather than design system
 * properties, so they are exempt from the design system gate rosters in
 * documentation — but they must run *before* the step they guard, which is
 * what the setup action's step order is checked for below.
 */
const INFRA_GUARDS = {
  'check:lockfile':
    'Fast install-free lockfile protocol guard to prevent cold build failures. ' +
    'Runs inside .github/actions/setup ahead of `pnpm install --frozen-lockfile`, ' +
    'so a lockfile the install cannot resolve still produces an actionable failure.',
};

/** A gate is a script that decides something. `:list`/`:report` only print. */
const isGate = (name) =>
  (name.startsWith('check:') || name.endsWith(':check')) &&
  !name.endsWith(':list') &&
  !name.endsWith(':report');

for (const name of scripts.filter(isGate)) {
  if (runsAnywhere.has(name)) {
    note('roster', true, `${name} — wired`);
    continue;
  }
  if (name in UNGATED) {
    note('roster', true, `${name} — exempt: ${UNGATED[name]}`);
    continue;
  }
  if (name in INFRA_GUARDS) {
    note('roster', true, `${name} — exempt: infra guard, wired by the setup action`);
    continue;
  }
  problems.push(
    `\`pnpm ${name}\` is a gate that no workflow runs. Add it to the \`gates\` ` +
      `job of ci.yml — per docs/ci.md, new gates go there or in \`unit\`, never ` +
      `\`visual\` — or add it to UNGATED in this script with the reason it is ` +
      `not enforced. A gate nothing runs reads as coverage and is not.`,
  );
  note('roster', false, `${name} — WIRED NOWHERE`);
}

for (const [name, why] of Object.entries(UNGATED)) {
  const script = name.split(' ')[0];
  if (!scripts.includes(script)) {
    problems.push(`UNGATED names \`${script}\`, which is not a package.json script. Remove the entry.`);
  } else if (runsAnywhere.has(script) && script === name) {
    problems.push(`UNGATED says \`${script}\` is unenforced (${why}), but a workflow runs it. Remove the entry.`);
  }
}

const setupSteps = read('.github/actions/setup/action.yml');

for (const [name, why] of Object.entries(INFRA_GUARDS)) {
  const script = name.split(' ')[0];
  if (!scripts.includes(script)) {
    problems.push(`INFRA_GUARDS names \`${script}\`, which is not a package.json script. Remove the entry.`);
    continue;
  }
  // A guard whose whole point is to precede `pnpm install` is worthless after
  // it — so the invariant is positional: the guard's script file must appear
  // in the setup action ahead of the install line, not merely somewhere.
  const file = /([\w./-]+\.mjs)/.exec(pkg.scripts[script])?.[1];
  const guardAt = file ? setupSteps.indexOf(file) : -1;
  // The actual step, not the prose: action.yml comments discuss `pnpm install`
  // too, and a first-occurrence match would land in the header.
  const installAt = /run:\s*pnpm install/.exec(setupSteps)?.index ?? -1;
  if (guardAt === -1 || installAt === -1 || guardAt > installAt) {
    problems.push(
      `INFRA_GUARDS says \`${script}\` runs before the install it guards (${why}), ` +
        `but .github/actions/setup/action.yml does not invoke ${file ?? script} ahead of \`pnpm install\`.`,
    );
  }
}

/**
 * A `:list` or `:report` flavour is the census of a gate, so it is exempt only
 * while that gate is itself enforced. Otherwise `check:x:list` becomes the way
 * `check:x` looks present without being run.
 */
for (const name of scripts.filter((n) => /:(list|report)$/.test(n))) {
  const base = name.replace(/:(list|report)$/, '');
  const gate = scripts.includes(base) ? base : null;
  if (gate && isGate(gate) && !runsAnywhere.has(gate) && !(gate in UNGATED)) {
    problems.push(
      `\`${name}\` prints the census of \`${gate}\`, which no workflow runs. ` +
        `The reporter is not the gate.`,
    );
  }
}

/** The roster as `docs/ci.md`'s table states it, row by row. */
const ciTable = new Map();
for (const line of lines('docs/ci.md')) {
  const row = /^\|\s*`([a-z-]+)`\s*\|\s*(.+?)\s*\|[^|]*\|[^|]*\|\s*$/.exec(line);
  if (!row) continue;
  if (!ciJobs.has(row[1])) continue;
  ciTable.set(row[1], [...row[2].matchAll(/`([\w:-]+)`/g)].map((m) => m[1]));
}

for (const [job, ran] of ciJobs) {
  const stated = ciTable.get(job);
  if (!stated) {
    problems.push(
      `docs/ci.md's job table has no row for \`${job}\`, which ci.yml defines. ` +
        `The table is the roster a reader trusts; a missing row hides a whole job.`,
    );
    continue;
  }
  const missing = ran.filter((s) => !stated.includes(s) && !(s in INFRA_GUARDS));
  const phantom = stated.filter((s) => !ran.includes(s) && scripts.includes(s));
  if (missing.length) {
    problems.push(
      `docs/ci.md's \`${job}\` row omits ${missing.map((s) => `\`${s}\``).join(', ')} — ` +
        `run by that job in ci.yml. This is the drift #144 fixed one layer down: ` +
        `a list that stops matching what runs.`,
    );
  }
  if (phantom.length) {
    problems.push(
      `docs/ci.md's \`${job}\` row claims ${phantom.map((s) => `\`${s}\``).join(', ')}, ` +
        `which that job does not run.`,
    );
  }
  note('roster', !missing.length && !phantom.length, `docs/ci.md \`${job}\` row — ${stated.length} stated, ${ran.length} run`);
}

/** Rule 6 of `docs/workflow.md` — "all of these run on every PR". */
const rule6 = (() => {
  const src = lines('docs/workflow.md');
  const start = src.findIndex((line) => /^6\.\s+\*\*Required Checks\*\*/.test(line));
  if (start === -1) return null;
  const collected = [];
  for (let i = start; i < src.length; i++) {
    if (i > start && /^7\.\s/.test(src[i])) break;
    for (const [, name] of src[i].matchAll(/`pnpm ([\w:-]+)`/g)) collected.push(name);
  }
  return collected;
})();

if (rule6 === null) {
  problems.push(`docs/workflow.md has no rule 6 "Required Checks" — the roster this gate reads.`);
} else {
  const missing = [...runsInCi].filter((s) => !rule6.includes(s) && !(s in INFRA_GUARDS));
  if (missing.length) {
    problems.push(
      `docs/workflow.md rule 6 lists what "all runs on every PR" and omits ` +
        `${missing.map((s) => `\`${s}\``).join(', ')}. ci.yml runs them.`,
    );
  }
  const phantom = rule6.filter((s) => !runsInCi.has(s));
  if (phantom.length) {
    problems.push(
      `docs/workflow.md rule 6 claims ${phantom.map((s) => `\`${s}\``).join(', ')} ` +
        `run on every PR. ci.yml does not run them.`,
    );
  }
  note('roster', !missing.length && !phantom.length, `docs/workflow.md rule 6 — ${rule6.length} stated, ${runsInCi.size} run`);
}

/* ------------------------------------------------------------------ *
 * A named script exists.
 *
 * `check:licenses` was cited in a ci.yml comment as a gate "in flight" and
 * in docs/reference-material.md as one that "has nothing to see". It has
 * never existed. A gate named in prose reads as a gate that runs.
 * ------------------------------------------------------------------ */

/** pnpm's own verbs, which are not this package's scripts. */
const PNPM_BUILTINS = new Set([
  'install', 'add', 'remove', 'update', 'exec', 'dlx', 'run', 'link', 'unlink',
  'why', 'pack', 'publish', 'audit', 'outdated', 'approve-builds', 'ls', 'store',
  'view', 'info', 'licenses', 'dedupe', 'prune', 'rebuild', 'setup', 'patch',
]);

/**
 * Commands this repo has *designed* and not built, which prose may therefore
 * name. Each entry says where the design lives, because that is the difference
 * between a plan and a phantom: `check:separation` is specified in
 * `docs/theme-taxonomy.md`'s gate table with an issue number against it, while
 * `check:licenses` was named in two places as a gate that runs and had never
 * existed anywhere.
 *
 * An entry that becomes a real script is reported, so this cannot quietly
 * become the list of gates that were never built.
 */
const PLANNED = {
  'check:separation': 'OKLab ΔE separation gate — #76, specified in docs/theme-taxonomy.md § 5 and docs/palette-provenance.md',
  evidence: 'Piece 1 of the evidence pipeline — designed, not built, in docs/evidence-pipeline.md',
};
/** The namespaces this package's scripts use, so `foo:bar` in prose is ignored. */
const NAMESPACES = new Set(scripts.map((s) => s.split(':')[0]));

function proseFiles() {
  const found = ['AGENTS.md', 'README.md', 'DESIGN.md', 'CONTEXT.md', 'CHANGELOG.md'];
  const walk = (dir) => {
    for (const entry of readdirSync(at(dir))) {
      const rel = path.join(dir, entry);
      if (statSync(at(rel)).isDirectory()) walk(rel);
      else if (/\.md$/.test(entry)) found.push(rel);
    }
  };
  walk('docs');
  return [...found, ...WORKFLOWS].filter((file) => {
    try { statSync(at(file)); return true; } catch { return false; }
  });
}

const PROSE = proseFiles();

for (const file of PROSE) {
  lines(file).forEach((line, i) => {
    const at = `${file}:${i + 1}`;
    for (const [, name] of line.matchAll(/`pnpm ([\w:-]+)[^`]*`/g)) {
      if (PNPM_BUILTINS.has(name) || scripts.includes(name)) continue;
      if (name in PLANNED) { note('names', true, `${at} — ${name} (planned: ${PLANNED[name]})`); continue; }
      problems.push(
        `${at}: names \`pnpm ${name}\`, which is not a script in package.json. ` +
          `Either add the script or stop naming it — prose that names a gate ` +
          `reads as a gate that runs.`,
      );
    }
    for (const [, name] of line.matchAll(/`([a-z][\w-]*:[\w:-]+)`/g)) {
      if (!NAMESPACES.has(name.split(':')[0])) continue;
      if (scripts.includes(name)) continue;
      if (name in PLANNED) { note('names', true, `${at} — ${name} (planned: ${PLANNED[name]})`); continue; }
      problems.push(
        `${at}: names \`${name}\`, which looks like one of this package's ` +
          `scripts (namespace \`${name.split(':')[0]}\`) and does not exist.`,
      );
    }
  });
}

for (const [name, why] of Object.entries(PLANNED)) {
  if (scripts.includes(name)) {
    problems.push(
      `PLANNED says \`${name}\` is designed and not built (${why}), and ` +
        `package.json now defines it. Remove the entry — a built gate does not ` +
        `need permission to be mentioned.`,
    );
  }
}

/* ------------------------------------------------------------------ *
 * Every script in `scripts/` is reachable by something.
 *
 * `capture_storybook_screenshots.mjs` sat here with a hardcoded
 * `/Users/ryankelly/.gemini/...` output path, referenced by no package
 * script, no workflow and no document, superseded by `pnpm walkthrough`.
 * knip cannot catch it: `knip.json` lists `scripts/*.mjs` as entry points,
 * which is correct — several are — and an entry point is unused by
 * definition. So the question has to be asked here, where an exemption can
 * carry a reason, exactly as `check:deps` does for packages.
 *
 * Reachable means one of three things: a package.json script runs it, a
 * sibling imports it, or a document tells a human to run it. Nothing else
 * is reachable, whatever it does.
 * ------------------------------------------------------------------ */

const ALL_MJS = readdirSync(at('scripts')).filter((f) => /\.mjs$/.test(f));

/*
 * `*.test.mjs` is a test, not a script.
 *
 * The two rules below ask of every script "is it kebab-case" and "does
 * anything reach it", and a test file answers neither the way a script does:
 * its name carries a `.test.` segment by convention, and nothing imports it
 * because the runner collects it by glob.
 *
 * Exempting it outright would create the hole this section exists to close —
 * a file nobody runs, sitting in a directory full of gates — so the exemption
 * is paid for below by asserting the runner really does collect it.
 */
const SCRIPT_TEST_FILES = ALL_MJS.filter((f) => /\.test\.mjs$/.test(f));
const SCRIPT_FILES = ALL_MJS.filter((f) => !/\.test\.mjs$/.test(f));
const scriptBodies = SCRIPT_FILES.map((f) => read(path.join('scripts', f)));
const configFiles = ['eslint.config.mjs', 'tsup.config.ts', 'vitest.config.mts', 'playwright.config.ts', 'knip.json']
  .filter((f) => { try { statSync(at(f)); return true; } catch { return false; } })
  .map((f) => read(f));
const proseBodies = PROSE.map((f) => read(f));

if (SCRIPT_TEST_FILES.length > 0) {
  const vitestConfig = read('vitest.config.mts');
  if (!vitestConfig.includes("scripts/**/*.test.mjs")) {
    problems.push(
      `scripts/ contains ${SCRIPT_TEST_FILES.join(', ')}, but vitest.config.mts ` +
        `does not include 'scripts/**/*.test.mjs'. A test the runner never ` +
        `collects is the unreachable file this section exists to catch, and it ` +
        `is worse than no test because it reads as coverage.`,
    );
  } else {
    note('scripts', true, `${SCRIPT_TEST_FILES.length} script test(s) — collected by vitest`);
  }
}

for (const file of SCRIPT_FILES) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*\.mjs$/.test(file)) {
    problems.push(
      `scripts/${file} is not kebab-case. Every other script in here is, and a ` +
        `filename is the first thing a reader matches against a pnpm script name.`,
    );
  }

  const runByScript = Object.values(pkg.scripts).some((command) => command.includes(`scripts/${file}`));
  const importedBySibling = scriptBodies.some((body, i) => SCRIPT_FILES[i] !== file && body.includes(`./${file}`));
  const usedByConfig = configFiles.some((body) => body.includes(`scripts/${file}`) || body.includes(`./${file}`));
  const documented = proseBodies.some((body) => body.includes(`scripts/${file}`));

  if (runByScript || importedBySibling || usedByConfig) {
    note('scripts', true, `scripts/${file} — invoked`);
  } else if (documented) {
    note('scripts', true, `scripts/${file} — run by hand, documented in prose`);
  } else {
    problems.push(
      `scripts/${file} is run by no package.json script, imported by nothing, ` +
        `read by no config, and named in no document. Delete it, or document ` +
        `how and why it is run by hand — an unreachable script in a repo full ` +
        `of gates reads as one of them.`,
    );
    note('scripts', false, `scripts/${file} — UNREACHABLE`);
  }
}

/* ------------------------------------------------------------------ *
 * `rule N` resolves to the same rule in both files.
 *
 * AGENTS.md carries the statements, docs/workflow.md the reasoning — its
 * own words. That only holds while they number the same rules the same
 * way, and they had drifted to eleven and nine, silently re-pointing every
 * citation. Nine sites cite "AGENTS.md rule 9" for the timeout ceiling;
 * rule 9 of AGENTS.md was Publishing.
 * ------------------------------------------------------------------ */

/** Numbered rules in the conventions section, as `number -> **title**`. */
function rulesOf(file, heading) {
  const src = lines(file);
  const start = src.findIndex((line) => heading.test(line));
  const rules = new Map();
  if (start === -1) return rules;
  for (let i = start + 1; i < src.length; i++) {
    if (/^##\s/.test(src[i])) break;
    const match = /^(\d+)\.\s+\*\*(.+?)\*\*/.exec(src[i]);
    if (match) rules.set(Number(match[1]), match[2].trim());
  }
  return rules;
}

const AGENT_RULES = rulesOf('AGENTS.md', /^##\s.*Repository Conventions/);
const WORKFLOW_RULES = rulesOf('docs/workflow.md', /^##\s.*Repository Conventions/);
const normalise = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

if (AGENT_RULES.size === 0) problems.push('AGENTS.md declares no numbered conventions — this gate reads that list.');
if (WORKFLOW_RULES.size === 0) problems.push('docs/workflow.md declares no numbered conventions — this gate reads that list.');

for (const [number, title] of AGENT_RULES) {
  const counterpart = WORKFLOW_RULES.get(number);
  if (!counterpart) {
    problems.push(
      `AGENTS.md rule ${number} (**${title}**) has no rule ${number} in ` +
        `docs/workflow.md. AGENTS.md says the reasoning lives there, so every ` +
        `rule needs an entry under the same number — otherwise a \`rule N\` ` +
        `citation resolves differently depending on which file you open.`,
    );
    continue;
  }
  const [a, b] = [normalise(title), normalise(counterpart)];
  if (!a.startsWith(b) && !b.startsWith(a)) {
    problems.push(
      `Rule ${number} is **${title}** in AGENTS.md and **${counterpart}** in ` +
        `docs/workflow.md. The numbering has diverged, which re-points every ` +
        `\`rule ${number}\` citation in the repo.`,
    );
  }
  note('rules', true, `rule ${number} — ${title}`);
}

for (const number of WORKFLOW_RULES.keys()) {
  if (!AGENT_RULES.has(number)) {
    problems.push(
      `docs/workflow.md rule ${number} (**${WORKFLOW_RULES.get(number)}**) has no ` +
        `statement in AGENTS.md. Reasoning without a rule is a rule nobody reads.`,
    );
  }
}

const highest = Math.max(0, ...AGENT_RULES.keys(), ...WORKFLOW_RULES.keys());
for (const file of PROSE) {
  lines(file).forEach((line, i) => {
    for (const [, number] of line.matchAll(/\brule (\d+)\b/gi)) {
      const cited = Number(number);
      const at = `${file}:${i + 1}`;
      // A rule number cited inside the rule lists themselves is the rule, not a
      // citation of one; and `docs/theme-taxonomy.md` cites an ADR's rule 4,
      // which is a different numbering entirely and says so on the line.
      if (/ADR|adr\//.test(line)) continue;
      if (cited > highest || !AGENT_RULES.has(cited)) {
        problems.push(
          `${at}: cites \`rule ${cited}\`, and no such rule exists ` +
            `(the conventions run 1-${highest}).`,
        );
        continue;
      }
      note('citations', true, `${at} — rule ${cited} (${AGENT_RULES.get(cited)})`);
    }
  });
}

/* ------------------------------------------------------------------ *
 * Rules 5 and 9 — the render environment is one pinned image.
 *
 * A baseline is a claim about pixels in one environment, so every job that
 * renders — the gated suites, the snapshot writer, the walkthrough — runs in
 * the same official Playwright image, named by digest, at the version the
 * lockfile pins. Nothing installs a browser at run time: the image carries it.
 * Each of those is checked, because each has been wrong somewhere before — a
 * `playwright install` outside the image is a second Chromium, a tag without
 * a digest is a render environment someone else can move, and an image a
 * version behind the lockfile fails every test with a missing executable.
 *
 * A cache key built from `render-inputs.mjs` must name the digest too: that
 * hash covers every tracked file, and the image is the one input none records.
 * ------------------------------------------------------------------ */

const RENDER_IMAGE = /^mcr\.microsoft\.com\/playwright:v(\d+\.\d+\.\d+)-noble@sha256:([0-9a-f]{64})$/;
const RENDERS = /^\s*(?:-\s+)?run:.*(?:pnpm\s+(?:test:visual|test:a11y|walkthrough)\b|playwright\s+test)/;
const lockedPlaywright = /^ {2}'@playwright\/test@(\d+\.\d+\.\d+)':/m.exec(
  readFileSync(path.join(GITHUB_ROOT, 'pnpm-lock.yaml'), 'utf8'),
)?.[1];
const images = new Map();

for (const job of ALL_JOBS) {
  const at = `${job.file}:${job.line}`;
  const texts = job.body.map(({ text }) => text);
  if (texts.some((text) => /install-playwright|playwright\s+install/.test(text))) {
    problems.push(
      `${at}: job \`${job.id}\` installs a browser. Rule 9: jobs that render run in the ` +
        `pinned Playwright image, which carries Chromium; a second install is a second Chromium.`,
    );
  }
  if (!texts.some((text) => RENDERS.test(text))) continue;

  const c = texts.findIndex((text) => /^ {4}container:\s*$/.test(text));
  const image = c < 0 ? null : /^ {6}image:\s*(\S+)\s*$/.exec(texts[c + 1] ?? '')?.[1];
  const options = c < 0 ? '' : /^ {6}options:\s*(.+)$/.exec(texts[c + 2] ?? '')?.[1] ?? '';
  const parsed = image && RENDER_IMAGE.exec(image);
  if (!parsed) {
    problems.push(
      `${at}: job \`${job.id}\` renders but does not run in the pinned image. Declare ` +
        `\`container: image: mcr.microsoft.com/playwright:v<version>-noble@sha256:<digest>\` — ` +
        `rule 5: a baseline is only comparable with one written in the same environment.`,
    );
    note('render', false, `${at} — ${job.id}: ${image ?? 'no container'}`);
    continue;
  }
  if (parsed[1] !== lockedPlaywright) {
    problems.push(
      `${at}: job \`${job.id}\` runs Playwright image v${parsed[1]}, and the lockfile pins ` +
        `@playwright/test ${lockedPlaywright}. The image's Chromium is the lockfile's only at ` +
        `the same version — bump both together.`,
    );
  }
  if (!/--ipc=host/.test(options)) {
    problems.push(`${at}: job \`${job.id}\` needs \`options: --ipc=host\` — Chromium renders into /dev/shm, 64MB by default.`);
  }
  images.set(image, [...(images.get(image) ?? []), `${job.file} ${job.id}`]);
  for (const text of texts) {
    if (/render-inputs\.mjs/.test(text) && /key=/.test(text) && !text.includes(parsed[2])) {
      problems.push(
        `${at}: job \`${job.id}\` builds a cache key from render-inputs.mjs without the image ` +
          `digest. The hash covers tracked files; the image is the one input none records.`,
      );
    }
  }
  note('render', true, `${at} — ${job.id}: v${parsed[1]} @ ${parsed[2].slice(0, 12)}`);
}
if (images.size > 1) {
  problems.push(
    `Jobs render in ${images.size} different images: ` +
      [...images].map(([image, jobs]) => `${image} (${jobs.join(', ')})`).join('; ') +
      `. One image, or baselines written by one job are checked in another environment.`,
  );
}

/* ------------------------------------------------------------------ *
 * Rule 6's one exception — a reused `visual` verdict — held to its shape.
 *
 * A gate that can be skipped is a gate that can be skipped by accident, and
 * the roster above only checks that a command is *written* in a job. So the
 * exception is pinned here instead: only `visual` reads the verdict, only a
 * pull request looks it up (so `main` always runs in full), and the key is the
 * input hash plus the runner image — the one input no tracked file records.
 * ------------------------------------------------------------------ */

for (const job of jobsOf('.github/workflows/ci.yml')) {
  const body = job.body.map(({ text }) => text).join('\n');
  const readsVerdict = /steps\.verdict\./.test(body);
  if (readsVerdict && job.id !== 'visual') {
    problems.push(
      `ci.yml job \`${job.id}\` reads \`steps.verdict\`. Rule 6 allows a reused ` +
        `verdict for the \`visual\` job only; every other gate runs on every PR.`,
    );
  }
  if (job.id !== 'visual') continue;
  const lookup = /- name: Previous Verdict\n\s+id: verdict\n\s+if: github\.event_name == 'pull_request'\n/.test(body);
  // The hash is taken on its own line and shape-checked before the key is
  // written: inlined as `$(...)` inside `echo`, a failing script yields a key
  // with no hash, which every later pull request would match.
  const key =
    /inputs="\$\(node scripts\/render-inputs\.mjs\)"/.test(body) &&
    /\[\[ "\$\{inputs\}" =~ \^\[0-9a-f\]\{64\}\$ \]\]/.test(body) &&
    /key=visual-verdict-\$\{ImageOS\}-\$\{ImageVersion\}-\$\{inputs\}/.test(body) &&
    /set -euo pipefail/.test(body);
  if (readsVerdict && !lookup) {
    problems.push(
      'ci.yml `visual`: the `Previous Verdict` lookup must be `if: github.event_name == ' +
        "'pull_request'`. A push to `main` has to run in full — it is what checks the key.",
    );
  }
  if (readsVerdict && !key) {
    problems.push(
      'ci.yml `visual`: the verdict key must be `visual-verdict-${ImageOS}-${ImageVersion}-${inputs}`, ' +
        'with `inputs` taken from `node scripts/render-inputs.mjs` on its own line under `set -euo pipefail` ' +
        'and checked to be a 64-hex hash. Without the image a new runner reuses an old verdict; without ' +
        'the check a failing script keys every PR to the same verdict.',
    );
  }
  note('verdict', !readsVerdict || (lookup && key), `ci.yml visual — ${readsVerdict ? 'reuses a verdict; PR-only lookup, keyed on inputs and image' : 'no verdict reuse'}`);
}

/*
 * Who may *record* the verdict. `visual` is sharded, so a leg reaching its
 * last step means only that its own slice passed — a marker saved there would
 * claim a verdict the other legs had not reached. So `visual` must not save
 * it; the job that does must `need` it and run only on its success, which for
 * a matrix is every leg succeeding. And if `visual` reuses a verdict, some job
 * has to record one, or the reuse is dead code that reads as a feature.
 */
{
  /*
   * The lines of each step in a job body, split at `      - ` — a linear scan.
   * These used to be one regex per question with a nested lazy quantifier over
   * whitespace-and-line, which backtracked catastrophically: a download step
   * whose `pattern:` did not match spun `check:governance` at 100% CPU for
   * sixteen minutes. A gate that can hang on malformed input is a gate that
   * waits out its job ceiling and reports `cancelled`.
   */
  const stepsOf = (body) => {
    const out = [];
    for (const line of body.split('\n')) {
      if (/^ {6}- /.test(line)) out.push([]);
      if (out.length) out.at(-1).push(line.trim());
    }
    return out;
  };
  const stepUses = (step, action) => step.some((l) => l.replace(/^- /, '').startsWith(`uses: ${action}@`));
  const stepHas = (step, re) => step.some((l) => re.test(l));
  const ciJobsFull = jobsOf('.github/workflows/ci.yml').map((job) => ({
    id: job.id,
    body: job.body.map(({ text }) => text).join('\n'),
  }));
  // A job saves the verdict when it has a cache-save step keyed on the
  // verdict key: `visual`'s own step output, or the one it exports.
  const saves = (body) =>
    stepsOf(body).some(
      (step) =>
        stepUses(step, 'actions/cache/save') &&
        stepHas(step, /^key:\s*\$\{\{\s*(?:needs\.visual\.outputs\.key|steps\.inputs\.outputs\.key)\s*\}\}$/),
    );
  const visual = ciJobsFull.find((job) => job.id === 'visual');
  const recorders = ciJobsFull.filter((job) => job.id !== 'visual' && saves(job.body));
  if (visual && saves(visual.body)) {
    problems.push(
      'ci.yml `visual` saves the verdict itself. It is sharded, so one leg finishing says ' +
        'nothing about the others — record it in a job that `needs: [visual]`.',
    );
  }
  for (const job of recorders) {
    const needs = /^\s{4}needs:\s*\[?[^\n]*\bvisual\b/m.test(job.body);
    const gated = /^\s{4}if:[^\n]*needs\.visual\.result == 'success'/m.test(job.body);
    if (!needs || !gated) {
      problems.push(
        `ci.yml \`${job.id}\` saves the visual verdict but ${!needs ? 'does not `need` visual' : ''}` +
          `${!needs && !gated ? ' and ' : ''}${!gated ? "is not gated on `needs.visual.result == 'success'`" : ''}. ` +
          'A verdict recorded before every shard passed is a verdict nobody earned.',
      );
    }
    // The job's outputs carry one leg's key. During an image rollout the legs
    // can compute different keys, or one can hit while another misses, so the
    // recorder must compare every leg's decision and save only on agreement.
    const collects = stepsOf(job.body).some(
      (step) => stepUses(step, 'actions/download-artifact') && stepHas(step, /^pattern:\s*verdict-key-\*$/),
    );
    const compares = /- name: Agreed Key\n\s+id: agreed\n/.test(job.body);
    const saveGated = /- name: Save Verdict\n\s+if: steps\.agreed\.outputs\.ok == 'true'\n/.test(job.body);
    const published = visual && /name:\s*verdict-key-\$\{\{\s*matrix\.shard\s*\}\}/.test(visual.body);
    if (!collects || !compares || !saveGated || !published) {
      problems.push(
        `ci.yml \`${job.id}\` saves the visual verdict without confirming every shard agreed on it ` +
          `(${[!published && 'visual uploads no `verdict-key-${{ matrix.shard }}`', !collects && 'no download of `verdict-key-*`',
            !compares && 'no `Agreed Key` step (id: agreed)', !saveGated && "`Save Verdict` not gated on `steps.agreed.outputs.ok == 'true'`"]
            .filter(Boolean).join('; ')}). A job output holds one leg's key; legs on different runner images disagree.`,
      );
    }
    note('verdict', needs && gated && collects && compares && saveGated && published, `ci.yml ${job.id} — records the verdict after every visual shard, only when all legs agree`);
  }
  if (visual && /steps\.verdict\./.test(visual.body) && !recorders.length) {
    problems.push(
      'ci.yml `visual` looks a verdict up, but no job records one — the reuse can never hit.',
    );
  }
}

/* ------------------------------------------------------------------ */

if (listing) {
  const sections = ['pins', 'ceilings', 'uploads', 'roster', 'names', 'scripts', 'rules', 'citations', 'render', 'verdict'];
  for (const section of sections) {
    const rows = census.filter((row) => row.section === section);
    if (!rows.length) continue;
    console.log(`\n${section.toUpperCase()} — ${rows.length} site${rows.length === 1 ? '' : 's'}`);
    for (const row of rows) console.log(`  ${row.ok ? '[ OK ]' : '[FAIL]'} ${row.text}`);
  }
  console.log('');
}

if (problems.length) {
  console.error(`\nGovernance problems (${problems.length}):\n`);
  for (const problem of problems) console.error(`  - ${problem}\n`);
  process.exit(1);
}

console.log(
  `Governance OK — ${pinnedTo.size} actions pinned across ${WORKFLOWS.length} workflow files, ` +
    `${ALL_JOBS.length} jobs with ceilings, ${runsInCi.size} gates wired and stated in both rosters, ` +
    `${SCRIPT_FILES.length} scripts reachable, ` +
    `${AGENT_RULES.size} rules numbered alike in AGENTS.md and docs/workflow.md.`,
);
