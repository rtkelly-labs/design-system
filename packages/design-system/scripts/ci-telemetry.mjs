#!/usr/bin/env node
/**
 * CI telemetry: where the minutes go, measured instead of remembered.
 *
 *   pnpm ci:history                 recent runs of ci.yml and the walkthrough
 *   pnpm ci:history --runs 30 --workflow ci.yml --json
 *   node scripts/ci-telemetry.mjs tests --playwright visual=telemetry/visual.json ...
 *
 * `history` reads what GitHub already records for every run — job and step
 * start and finish times — through `gh api`, and reports medians, p90s, queue
 * time, runner minutes, the critical path and a trend per step. It needs no
 * change to any workflow, so it covers every run ever made, not only the ones
 * after telemetry landed.
 *
 * `tests` runs inside CI, after the suites. It reads the JSON reports the
 * Playwright and Vitest configs write when `CI` is set, appends a breakdown to
 * the job summary, and writes one combined file for the telemetry artifact.
 * It goes one level below the step, which is the finest grain GitHub keeps.
 *
 * Neither is a gate, and `tests` exits 0 on a missing or unreadable report:
 * telemetry that can fail a build becomes a reason to delete it.
 */

import { execFile } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { PACKAGE_ROOT } from './repo-root.mjs';
import {
  renderHistory,
  renderPlaywright,
  renderVitest,
  summariseHistory,
  summarisePlaywright,
  summariseVitest,
} from './ci-telemetry-stats.mjs';

const run = promisify(execFile);
const [command, ...rest] = process.argv.slice(2);

/** `--flag value` pairs, repeatable; bare flags are `true`. */
function parse(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, '');
    const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    (opts[key] ??= []).push(value);
  }
  return opts;
}

async function gh(endpoint) {
  const { stdout } = await run('gh', ['api', endpoint], { maxBuffer: 64 * 1024 * 1024 });
  return JSON.parse(stdout);
}

/** Run `fn` over `items`, `limit` at a time, keeping order. */
async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

async function history(opts) {
  const repo =
    opts.repo?.[0] ??
    process.env.GITHUB_REPOSITORY ??
    (await run('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner'])).stdout.trim();
  const count = Math.min(Number(opts.runs?.[0] ?? 50), 100);
  const workflows = opts.workflow ?? ['ci.yml', 'storybook-walkthrough.yml'];
  const branch = opts.branch?.[0];

  const report = {};
  for (const workflow of workflows) {
    const query = `per_page=${count}&status=completed${branch ? `&branch=${encodeURIComponent(branch)}` : ''}`;
    const { workflow_runs: listed } = await gh(`repos/${repo}/actions/workflows/${workflow}/runs?${query}`);
    const runs = await pool(listed, 8, async (r) => ({
      id: r.id,
      event: r.event,
      conclusion: r.conclusion,
      created_at: r.created_at,
      jobs: r.conclusion === 'success' ? (await gh(`repos/${repo}/actions/runs/${r.id}/jobs?per_page=100`)).jobs : [],
    }));
    report[workflow] = summariseHistory(runs);
  }

  if (opts.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }
  console.log(`# CI history — ${repo}${branch ? ` @ ${branch}` : ''}\n`);
  for (const [workflow, summary] of Object.entries(report)) console.log(`${renderHistory(workflow, summary)}\n`);
}

/** `name=path` pairs; a report that is absent is noted, not fatal. */
function reports(pairs = []) {
  return pairs.flatMap((pair) => {
    const [name, file] = String(pair).split('=');
    const at = path.resolve(PACKAGE_ROOT, file);
    if (!existsSync(at)) {
      console.log(`ci-telemetry: no ${name} report at ${file} — the suite did not run, or did not reach its reporter.`);
      return [];
    }
    try {
      return [{ name, report: JSON.parse(readFileSync(at, 'utf8')) }];
    } catch (error) {
      console.log(`ci-telemetry: could not read ${file}: ${error.message}`);
      return [];
    }
  });
}

function tests(opts) {
  const sections = [];
  const combined = { sha: process.env.GITHUB_SHA, job: process.env.GITHUB_JOB, playwright: {}, vitest: {} };

  for (const { name, report } of reports(opts.playwright)) {
    const summary = summarisePlaywright(report);
    combined.playwright[name] = summary;
    sections.push(renderPlaywright(name, summary));
  }
  for (const { name, report } of reports(opts.vitest)) {
    const summary = summariseVitest(report);
    for (const row of summary.slowest) row.file = path.relative(PACKAGE_ROOT, row.file);
    combined.vitest[name] = summary;
    sections.push(renderVitest(name, summary));
  }
  // Cache results arrive as `--cache name=<cache-hit output>`. `actions/cache`
  // has three answers, not two: 'true' is an exact key match, 'false' is a
  // partial restore through `restore-keys`, and '' is nothing restored at all.
  const CACHE = { true: 'hit', false: 'partial' };
  const caches = (opts.cache ?? []).map((pair) => {
    const [name, output = ''] = String(pair).split('=');
    return [name, CACHE[output] ?? 'miss'];
  });
  if (caches.length) {
    combined.caches = Object.fromEntries(caches);
    sections.push(`### Caches\n\n${caches.map(([name, state]) => `- \`${name}\`: ${state}`).join('\n')}`);
  }

  if (!sections.length) return;
  const markdown = `## Telemetry\n\n${sections.join('\n\n')}\n`;
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
  else console.log(markdown);

  const out = path.resolve(PACKAGE_ROOT, opts.out?.[0] ?? 'telemetry/summary.json');
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(combined, null, 2)}\n`);
}

const opts = parse(rest);
if (command === 'history') {
  await history(opts);
} else if (command === 'tests') {
  try {
    tests(opts);
  } catch (error) {
    // Never the reason a build is red.
    console.log(`::warning::ci-telemetry failed and was skipped: ${error.stack ?? error}`);
  }
} else {
  console.error('usage: ci-telemetry.mjs history [--workflow ci.yml] [--runs 50] [--branch main] [--json]\n' +
    '       ci-telemetry.mjs tests [--playwright name=file] [--vitest name=file] [--cache name=hit] [--out file]');
  process.exit(2);
}
