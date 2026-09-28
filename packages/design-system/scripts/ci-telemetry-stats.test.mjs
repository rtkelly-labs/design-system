import { describe, expect, it } from 'vitest';
import { quantile, summariseHistory, summarisePlaywright, summariseVitest } from './ci-telemetry-stats.mjs';

const at = (s) => new Date(Date.UTC(2026, 8, 1, 0, 0, s)).toISOString();

const job = (name, start, end, steps = [], created = start) => ({
  name,
  created_at: at(created),
  started_at: at(start),
  completed_at: at(end),
  steps: steps.map(([step, from, to, conclusion = 'success']) => ({
    name: step,
    started_at: at(from),
    completed_at: at(to),
    conclusion,
  })),
});

const run = (id, offset, over = {}) => ({
  id,
  event: 'pull_request',
  conclusion: 'success',
  created_at: at(offset),
  jobs: [
    job('lint', offset + 2, offset + 32, [['Lint', offset + 2, offset + 22]], offset),
    job('visual', offset + 1, offset + 181, [['A11y', offset + 40, offset + 180]], offset),
    job('ci', offset + 182, offset + 185, [], offset + 181),
  ],
  ...over,
});

describe('quantile', () => {
  it('is nearest-rank and ignores non-numbers', () => {
    expect(quantile([3, null, 1, 2], 0.5)).toBe(2);
    expect(quantile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.9)).toBe(9);
    expect(quantile([], 0.5)).toBeNaN();
  });
});

describe('summariseHistory', () => {
  it('times successful runs only, and counts every conclusion', () => {
    const summary = summariseHistory([
      run(1, 0),
      run(2, 1000),
      // A cancelled run stops early; letting it in would drag the medians down.
      run(3, 2000, { conclusion: 'cancelled', jobs: [job('visual', 2000, 2005)] }),
    ]);

    expect(summary.conclusions).toEqual({ success: 2, cancelled: 1 });
    expect(summary.successful).toBe(2);
    expect(summary.wall.p50).toBe(185);
    expect(summary.jobs.find((j) => j.job === 'visual')).toMatchObject({ p50: 180, queueP50: 1 });
  });

  it('names the critical path without the aggregate that always finishes last', () => {
    const summary = summariseHistory([run(1, 0), run(2, 1000)]);
    expect(summary.criticalPath).toEqual({ visual: 2 });
  });

  it('rounds each job up to a whole runner minute, separately', () => {
    // lint 30s → 1, visual 180s → 3, ci 3s → 1.
    expect(summariseHistory([run(1, 0)]).runnerMinutes.p50).toBe(5);
  });

  it('reports a step as a share of its job, and how it moved between halves', () => {
    const older = run(1, 0);
    const newer = run(2, 1000);
    newer.jobs[1].steps[0].completed_at = at(1000 + 200); // 160s, up from 140s
    const a11y = summariseHistory([newer, older]).steps.find((s) => s.step === 'A11y');

    expect(a11y.trend).toBe(20);
    expect(a11y.shareOfJob).toBeCloseTo(a11y.p50 / 180);
  });

  it('leaves skipped steps out rather than timing them at zero', () => {
    const r = run(1, 0);
    r.jobs[0].steps.push({ name: 'Title', started_at: at(2), completed_at: at(2), conclusion: 'skipped' });
    expect(summariseHistory([r]).steps.map((s) => s.step)).not.toContain('Title');
  });
});

describe('summarisePlaywright', () => {
  const report = {
    config: { workers: 2 },
    stats: { duration: 10_000 },
    suites: [
      {
        title: 'a11y.spec.ts',
        file: 'a11y.spec.ts',
        specs: [],
        suites: [
          {
            title: 'Accessibility',
            file: 'a11y.spec.ts',
            specs: [
              {
                title: 'button — midnight',
                tests: [
                  { projectName: 'chromium', status: 'expected', results: [{ duration: 4000, retry: 0 }] },
                  {
                    projectName: 'mobile',
                    status: 'flaky',
                    results: [
                      { duration: 6000, retry: 0 },
                      { duration: 3000, retry: 1 },
                    ],
                  },
                ],
              },
              { title: 'card — sketch', tests: [{ projectName: 'mobile', status: 'skipped', results: [] }] },
            ],
          },
        ],
      },
    ],
  };

  it('counts every attempt as time spent, and reports a pass on retry as flaky', () => {
    const summary = summarisePlaywright(report);

    expect(summary).toMatchObject({ tests: 3, ran: 2, skipped: 1, failed: 0, busyMs: 13_000 });
    expect(summary.flaky).toEqual([{ title: 'Accessibility › button — midnight', project: 'mobile' }]);
    expect(summary.slowest[0]).toMatchObject({ project: 'mobile', attempts: 2, total: 9000 });
    expect(summary.projects).toEqual({ chromium: { tests: 1, ms: 4000 }, mobile: { tests: 1, ms: 9000 } });
  });

  it('measures worker utilisation against the wall clock', () => {
    expect(summarisePlaywright(report).efficiency).toBeCloseTo(13_000 / 20_000);
  });
});

describe('summariseVitest', () => {
  it('ranks files by wall clock', () => {
    const summary = summariseVitest({
      numTotalTests: 3,
      numFailedTests: 0,
      testResults: [
        { name: '/a.test.ts', startTime: 0, endTime: 100, assertionResults: [{}] },
        { name: '/b.test.ts', startTime: 0, endTime: 900, assertionResults: [{}, {}] },
      ],
    });
    expect(summary.slowest.map((f) => f.file)).toEqual(['/b.test.ts', '/a.test.ts']);
    expect(summary.busyMs).toBe(1000);
  });
});
