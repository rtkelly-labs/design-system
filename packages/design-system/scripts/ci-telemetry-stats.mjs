/**
 * The arithmetic behind `ci-telemetry.mjs`, kept free of I/O so it can be
 * tested the way `release-train-checks.mjs` is.
 *
 * Two questions, one per input:
 *
 *   - **Where does a CI run spend its time?** `summariseHistory` reads the
 *     jobs-and-steps payload GitHub already records for every run. Nothing new
 *     has to be emitted to answer it — the timings were always there, they
 *     were just never read. `docs/ci.md` said `visual` took 60s when its
 *     median was over five minutes.
 *   - **Inside a step, which tests?** A step is the finest grain GitHub keeps,
 *     and `Run Accessibility Tests` is one step of several hundred tests.
 *     `summarisePlaywright` and `summariseVitest` read the JSON reports those
 *     runners write in CI, so the slow step can be broken down to its rows.
 *
 * Every figure is a median or a p90 over runs, never a mean: one runner that
 * stalls on apt for four minutes moves a mean and does not move a median.
 */

/** The p-th quantile by nearest rank, over non-null numbers. NaN when empty. */
export function quantile(values, p) {
  const sorted = values.filter((v) => typeof v === 'number' && Number.isFinite(v)).sort((a, b) => a - b);
  if (!sorted.length) return Number.NaN;
  return sorted[Math.min(sorted.length - 1, Math.round(p * (sorted.length - 1)))];
}

const seconds = (from, to) => (from && to ? (Date.parse(to) - Date.parse(from)) / 1000 : null);

const median = (values) => quantile(values, 0.5);

/**
 * Summarise a workflow's recent runs.
 *
 * `runs` is `[{ id, event, conclusion, created_at, jobs }]`, where `jobs` is
 * the `jobs` array of `GET /actions/runs/{id}/jobs`, verbatim.
 *
 * Timings are taken from successful runs only. A cancelled run stops at an
 * arbitrary step and a failed one stops at the failing step, so either would
 * pull every later step's figures towards zero. Conclusions are counted over
 * all runs, because a cancellation rate *is* a cost: each one is a runner that
 * worked on a commit nobody kept.
 *
 * `aggregate` names the job that only reports the others' verdict (`ci`). It
 * finishes last by construction, so it is left out of the critical path.
 */
export function summariseHistory(runs, { aggregate = 'ci' } = {}) {
  const conclusions = {};
  for (const run of runs) conclusions[run.conclusion ?? 'unknown'] = (conclusions[run.conclusion ?? 'unknown'] ?? 0) + 1;

  const ok = runs
    .filter((run) => run.conclusion === 'success' && run.jobs?.length)
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));

  const wall = [];
  const runnerMinutes = [];
  const criticalPath = {};
  const jobs = new Map();
  const steps = new Map();

  ok.forEach((run, index) => {
    // Chronological half, for the trend column. The older half is the
    // baseline; a step whose median grew between them is growing with the
    // codebase rather than varying with the runner.
    const half = index < ok.length / 2 ? 'older' : 'newer';
    const created = Math.min(...run.jobs.map((job) => Date.parse(job.created_at)));
    const completed = Math.max(...run.jobs.map((job) => Date.parse(job.completed_at)));
    wall.push((completed - created) / 1000);

    // GitHub rounds every job up to a whole minute, separately.
    runnerMinutes.push(
      run.jobs.reduce((sum, job) => sum + Math.ceil((seconds(job.started_at, job.completed_at) ?? 0) / 60), 0),
    );

    const work = run.jobs.filter((job) => job.name !== aggregate);
    if (work.length) {
      const last = work.reduce((a, b) => (Date.parse(b.completed_at) > Date.parse(a.completed_at) ? b : a));
      criticalPath[last.name] = (criticalPath[last.name] ?? 0) + 1;
    }

    for (const job of run.jobs) {
      const entry = jobs.get(job.name) ?? { run: [], queue: [] };
      entry.run.push(seconds(job.started_at, job.completed_at));
      entry.queue.push(seconds(job.created_at, job.started_at));
      jobs.set(job.name, entry);

      for (const step of job.steps ?? []) {
        if (step.conclusion === 'skipped') continue;
        const key = `${job.name}\u0000${step.name}`;
        const row = steps.get(key) ?? { job: job.name, step: step.name, all: [], older: [], newer: [] };
        const took = seconds(step.started_at, step.completed_at);
        row.all.push(took);
        row[half].push(took);
        steps.set(key, row);
      }
    }
  });

  const jobRows = [...jobs].map(([name, { run, queue }]) => ({
    job: name,
    samples: run.length,
    p50: median(run),
    p90: quantile(run, 0.9),
    queueP50: median(queue),
    queueP90: quantile(queue, 0.9),
  }));

  const jobMedian = new Map(jobRows.map((row) => [row.job, row.p50]));
  const stepRows = [...steps.values()]
    .map((row) => {
      const p50 = median(row.all);
      const older = median(row.older);
      const newer = median(row.newer);
      return {
        job: row.job,
        step: row.step,
        samples: row.all.length,
        p50,
        p90: quantile(row.all, 0.9),
        shareOfJob: jobMedian.get(row.job) ? p50 / jobMedian.get(row.job) : Number.NaN,
        trend: Number.isFinite(older) && Number.isFinite(newer) ? newer - older : Number.NaN,
      };
    })
    .sort((a, b) => b.p50 - a.p50);

  return {
    runs: runs.length,
    successful: ok.length,
    conclusions,
    wall: { p50: median(wall), p90: quantile(wall, 0.9) },
    runnerMinutes: { p50: median(runnerMinutes), p90: quantile(runnerMinutes, 0.9) },
    criticalPath,
    jobs: jobRows.sort((a, b) => b.p50 - a.p50),
    steps: stepRows,
  };
}

/**
 * Flatten a Playwright JSON report into one row per test, per project.
 *
 * `duration` is the final attempt's; `total` sums every attempt, which is what
 * the runner actually spent. A test that passed on retry reports `flaky` — the
 * signal a green run otherwise hides.
 */
export function summarisePlaywright(report, { top = 15 } = {}) {
  const rows = [];
  const walk = (suite, trail) => {
    const here = suite.title && suite.title !== suite.file ? [...trail, suite.title] : trail;
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const results = test.results ?? [];
        rows.push({
          title: [...here, spec.title].join(' › '),
          file: spec.file ?? suite.file,
          project: test.projectName,
          status: test.status,
          attempts: results.length,
          duration: results.at(-1)?.duration ?? 0,
          total: results.reduce((sum, r) => sum + (r.duration ?? 0), 0),
        });
      }
    }
    for (const child of suite.suites ?? []) walk(child, here);
  };
  for (const suite of report.suites ?? []) walk(suite, []);

  const ran = rows.filter((row) => row.status !== 'skipped');
  const workers = report.config?.metadata?.actualWorkers ?? report.config?.workers ?? 1;
  const wallMs = report.stats?.duration ?? 0;
  const busyMs = ran.reduce((sum, row) => sum + row.total, 0);

  const projects = {};
  for (const row of ran) {
    const p = (projects[row.project] ??= { tests: 0, ms: 0 });
    p.tests += 1;
    p.ms += row.total;
  }

  return {
    tests: rows.length,
    ran: ran.length,
    skipped: rows.length - ran.length,
    flaky: rows.filter((row) => row.status === 'flaky').map(({ title, project }) => ({ title, project })),
    failed: rows.filter((row) => row.status === 'unexpected').length,
    workers,
    wallMs,
    busyMs,
    // Of the worker-time available, the share spent inside a test. The rest is
    // worker start-up, the web server, and a tail where one slow test runs
    // while the other workers sit idle.
    efficiency: wallMs && workers ? busyMs / (wallMs * workers) : Number.NaN,
    meanMs: ran.length ? busyMs / ran.length : Number.NaN,
    p50Ms: median(ran.map((row) => row.duration)),
    p90Ms: quantile(ran.map((row) => row.duration), 0.9),
    projects,
    slowest: [...ran].sort((a, b) => b.total - a.total).slice(0, top),
  };
}

/**
 * The same for a Vitest JSON report, one row per test file.
 *
 * A file's wall clock is its `endTime - startTime`, which excludes transform
 * and environment set-up — those are in the default reporter's `Duration`
 * line. What this answers is narrower: which files are slow to *run*.
 */
export function summariseVitest(report, { top = 10 } = {}) {
  const files = (report.testResults ?? []).map((file) => ({
    file: file.name,
    tests: file.assertionResults?.length ?? 0,
    ms: (file.endTime ?? 0) - (file.startTime ?? 0),
  }));
  return {
    files: files.length,
    tests: report.numTotalTests ?? files.reduce((sum, f) => sum + f.tests, 0),
    failed: report.numFailedTests ?? 0,
    busyMs: files.reduce((sum, f) => sum + f.ms, 0),
    slowest: files.sort((a, b) => b.ms - a.ms).slice(0, top),
  };
}

const s = (value) => (Number.isFinite(value) ? `${Math.round(value)}s` : '—');
const ms = (value) => (Number.isFinite(value) ? `${(value / 1000).toFixed(1)}s` : '—');
const pct = (value) => (Number.isFinite(value) ? `${Math.round(value * 100)}%` : '—');
const signed = (value) => (Number.isFinite(value) ? `${value > 0 ? '+' : ''}${Math.round(value)}s` : '—');
const cell = (text) => String(text).replaceAll('|', '\\|');

/** Markdown for `summariseHistory`, steps shorter than `floor` seconds omitted. */
export function renderHistory(name, summary, { floor = 2 } = {}) {
  const { conclusions, wall, runnerMinutes, criticalPath, jobs, steps } = summary;
  const out = [
    `## ${name}`,
    '',
    `${summary.runs} runs, ${summary.successful} successful. Conclusions: ` +
      Object.entries(conclusions).map(([k, v]) => `${k} ${v}`).join(', ') + '.',
    '',
    `Wall clock p50 **${s(wall.p50)}**, p90 ${s(wall.p90)}. ` +
      `Runner minutes per run p50 ${runnerMinutes.p50}, p90 ${runnerMinutes.p90} (each job rounded up).`,
    '',
  ];
  const paths = Object.entries(criticalPath).sort((a, b) => b[1] - a[1]);
  if (paths.length) {
    out.push(`Critical path — the job that finished last: ${paths.map(([job, n]) => `\`${job}\` ${n}/${summary.successful}`).join(', ')}.`, '');
  }
  out.push('| Job | p50 | p90 | queue p50 | queue p90 |', '|---|--:|--:|--:|--:|');
  for (const job of jobs) out.push(`| \`${cell(job.job)}\` | ${s(job.p50)} | ${s(job.p90)} | ${s(job.queueP50)} | ${s(job.queueP90)} |`);
  out.push('', '| Job | Step | p50 | p90 | share of job | trend (newer − older half) |', '|---|---|--:|--:|--:|--:|');
  for (const step of steps.filter((row) => row.p50 >= floor)) {
    out.push(`| \`${cell(step.job)}\` | ${cell(step.step)} | ${s(step.p50)} | ${s(step.p90)} | ${pct(step.shareOfJob)} | ${signed(step.trend)} |`);
  }
  return out.join('\n');
}

/** Markdown for `summarisePlaywright`. */
export function renderPlaywright(name, summary) {
  const out = [
    `### ${name}`,
    '',
    `${summary.ran} tests ran (${summary.skipped} skipped, ${summary.failed} failed, ${summary.flaky.length} flaky) ` +
      `in ${ms(summary.wallMs)} on ${summary.workers} workers. ` +
      `Test time ${ms(summary.busyMs)}; worker utilisation **${pct(summary.efficiency)}**. ` +
      `Per test p50 ${ms(summary.p50Ms)}, p90 ${ms(summary.p90Ms)}.`,
    '',
    '| Project | Tests | Test time |',
    '|---|--:|--:|',
    ...Object.entries(summary.projects).map(([project, p]) => `| ${cell(project)} | ${p.tests} | ${ms(p.ms)} |`),
    '',
    '| Slowest | Project | Attempts | Time |',
    '|---|---|--:|--:|',
    ...summary.slowest.map((row) => `| ${cell(row.title)} | ${cell(row.project)} | ${row.attempts} | ${ms(row.total)} |`),
  ];
  if (summary.flaky.length) {
    out.push('', '**Passed on retry:**', ...summary.flaky.map((row) => `- ${row.title} (${row.project})`));
  }
  return out.join('\n');
}

/** Markdown for `summariseVitest`. */
export function renderVitest(name, summary) {
  return [
    `### ${name}`,
    '',
    `${summary.tests} tests in ${summary.files} files, ${summary.failed} failed. ` +
      `Summed file time ${ms(summary.busyMs)}, excluding transform and environment set-up.`,
    '',
    '| Slowest file | Tests | Time |',
    '|---|--:|--:|',
    ...summary.slowest.map((row) => `| ${cell(row.file)} | ${row.tests} | ${ms(row.ms)} |`),
  ].join('\n');
}
