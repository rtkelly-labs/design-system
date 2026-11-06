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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const listing = process.argv.includes('--list');
const problems = [];
const census = [];

const read = (rel) => readFileSync(path.join(ROOT, rel), 'utf8');
const lines = (rel) => read(rel).split('\n');
const note = (section, ok, text) => census.push({ section, ok, text });

/** Every file under `.github` that can carry a `uses:` or a job. */
function workflowFiles() {
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(path.join(ROOT, dir))) {
      const rel = path.join(dir, entry);
      if (statSync(path.join(ROOT, rel)).isDirectory()) walk(rel);
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
    'deployment-drift.yml on pushes to `main` and on a daily schedule, which is ' +
    'where the answer exists. Making it a PR gate would make it a gate that is ' +
    'always red, and a gate that is always red gets deleted.',
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
  const missing = ran.filter((s) => !stated.includes(s));
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
  const missing = [...runsInCi].filter((s) => !rule6.includes(s));
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
    for (const entry of readdirSync(path.join(ROOT, dir))) {
      const rel = path.join(dir, entry);
      if (statSync(path.join(ROOT, rel)).isDirectory()) walk(rel);
      else if (/\.md$/.test(entry)) found.push(rel);
    }
  };
  walk('docs');
  return [...found, ...WORKFLOWS].filter((file) => {
    try { statSync(path.join(ROOT, file)); return true; } catch { return false; }
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

const SCRIPT_FILES = readdirSync(path.join(ROOT, 'scripts')).filter((f) => /\.mjs$/.test(f));
const scriptBodies = SCRIPT_FILES.map((f) => read(path.join('scripts', f)));
const configFiles = ['eslint.config.mjs', 'tsup.config.ts', 'vitest.config.mts', 'playwright.config.ts', 'knip.json']
  .filter((f) => { try { statSync(path.join(ROOT, f)); return true; } catch { return false; } })
  .map((f) => read(f));
const proseBodies = PROSE.map((f) => read(f));

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

/* ------------------------------------------------------------------ */

if (listing) {
  const sections = ['pins', 'ceilings', 'uploads', 'roster', 'names', 'scripts', 'rules', 'citations'];
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
