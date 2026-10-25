import { describe, expect, it } from 'vitest';
import { buildTrace } from './trace';
import { ciConclusionStatus, githubRunToSpans, type GitHubActionsJob, type GitHubActionsRun } from './ciTrace';

const run: GitHubActionsRun = { id: 1, name: 'CI', status: 'completed', conclusion: 'failure', run_started_at: '2026-10-24T08:46:57Z', updated_at: '2026-10-24T09:30:00Z', head_branch: 'main', head_sha: 'abc' };

const jobs: GitHubActionsJob[] = [
  {
    id: 10, name: 'build', status: 'completed', conclusion: 'success', created_at: '2026-10-24T08:46:57Z', started_at: '2026-10-24T08:47:00Z', completed_at: '2026-10-24T08:48:00Z', labels: ['ubuntu-latest'],
    steps: [
      { name: 'checkout', number: 1, status: 'completed', conclusion: 'success', started_at: '2026-10-24T08:47:00Z', completed_at: '2026-10-24T08:47:05Z' },
      { name: 'compile', number: 2, status: 'completed', conclusion: 'success', started_at: '2026-10-24T08:47:05Z', completed_at: '2026-10-24T08:48:00Z' },
    ],
  },
  { id: 11, name: 'visual', status: 'completed', conclusion: 'failure', created_at: '2026-10-24T08:46:57Z', started_at: '2026-10-24T08:46:58Z', completed_at: '2026-10-24T08:50:00Z', steps: [] },
  { id: 12, name: 'verdict', status: 'completed', conclusion: 'skipped', started_at: '2026-10-24T08:50:02Z', completed_at: '2026-10-24T08:50:01Z', steps: [] },
  { id: 13, name: 'never', status: 'queued', conclusion: null, started_at: null, completed_at: null },
];

describe('githubRunToSpans', () => {
  const spans = githubRunToSpans(run, jobs);
  const byId = new Map(spans.map((span) => [span.id, span]));

  it('nests run → job → step', () => {
    expect(byId.get('job-10')?.parentId).toBe('run-1');
    expect(byId.get('job-10-step-2')?.parentId).toBe('job-10');
  });

  it('ends the run at its last job, not at updated_at', () => {
    expect(byId.get('run-1')?.end).toBe(Date.parse('2026-10-24T08:50:01Z'));
  });

  it('adds a queue span only for a wait of a second or more', () => {
    expect(byId.get('job-10-queue')?.end).toBe(Date.parse('2026-10-24T08:47:00Z'));
    expect(byId.has('job-11-queue')).toBe(true);
    expect(githubRunToSpans(run, jobs, { queue: false }).some((span) => span.id.endsWith('-queue'))).toBe(false);
  });

  it('keeps a skipped job as an instant and drops a job that never started', () => {
    const skipped = byId.get('job-12');
    expect(skipped?.end).toBe(skipped?.start);
    expect(skipped?.attributes?.['ci.conclusion']).toBe('skipped');
    expect(byId.has('job-13')).toBe(false);
  });

  it('maps conclusions to statuses, and leaves a running job open', () => {
    expect(byId.get('job-11')?.status).toBe('error');
    expect(byId.get('job-10')?.status).toBe('ok');
    expect(ciConclusionStatus('skipped')).toBe('unset');
    expect(ciConclusionStatus('cancelled')).toBe('error');
    const live = githubRunToSpans({ ...run, status: 'in_progress', conclusion: null }, [{ ...jobs[1]!, status: 'in_progress', conclusion: null, completed_at: null }]);
    expect(live.find((span) => span.id === 'run-1')?.end).toBeUndefined();
    expect(buildTrace(live, { now: Date.parse('2026-10-24T08:52:00Z') }).inFlightCount).toBe(2);
  });

  it('puts the failing shard on the critical path when it is the long pole', () => {
    const model = buildTrace(spans);
    expect(model.criticalPath).toContain('job-11');
    expect(model.errorCount).toBeGreaterThan(0);
  });
});
