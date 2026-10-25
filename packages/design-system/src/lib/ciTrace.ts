/**
 * CI runs as traces: a GitHub Actions run in, `TraceSpanInput`s out.
 *
 * A workflow run already is a trace. The run is the root span, each job a
 * child, each step a grandchild, and the time a job sat in the queue before a
 * runner took it is a span of its own. Read that way, `TraceWaterfall` answers
 * the questions a slow or red pipeline raises: which job gated the run (the
 * critical path), where the minutes went (self time), and what failed first.
 *
 * The input is the REST API's own shape — `GET /repos/{o}/{r}/actions/runs/{id}`
 * and `.../runs/{id}/jobs` — trimmed to the fields read here, so a caller can
 * pass `gh api` output straight through. Nothing here fetches.
 *
 * ## Time
 *
 * GitHub stamps to the second, as ISO strings. They become epoch milliseconds
 * here and nowhere else. A job or step with no `completed_at` is in flight,
 * and is drawn to the caller's `now` like any open span.
 */

import type { TraceAttributeValue, TraceSpanInput, TraceSpanStatus } from './trace';

/** A step inside a job, as `.../runs/{id}/jobs` lists it. */
export interface GitHubActionsStep {
  name: string;
  number: number;
  status: string;
  conclusion: string | null;
  started_at: string | null;
  completed_at: string | null;
}

/** A job, as `.../runs/{id}/jobs` lists it. */
export interface GitHubActionsJob {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  created_at?: string | null;
  started_at: string | null;
  completed_at: string | null;
  runner_name?: string | null;
  labels?: string[];
  html_url?: string | null;
  steps?: GitHubActionsStep[];
}

/** A workflow run, as `.../actions/runs/{id}` returns it. */
export interface GitHubActionsRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  created_at?: string | null;
  run_started_at?: string | null;
  updated_at?: string | null;
  html_url?: string | null;
  head_branch?: string | null;
  head_sha?: string | null;
  event?: string | null;
  run_attempt?: number;
  display_title?: string | null;
}

export interface GitHubRunTraceOptions {
  /** Add a `queued` span before each job that waited for a runner. Defaults to true. */
  queue?: boolean;
  /** Include steps under their jobs. Defaults to true. */
  steps?: boolean;
  /** Service name for the run span. Defaults to `github-actions`. */
  service?: string;
}

/** Conclusions that read as failures. `cancelled` counts: the run did not do its job. */
const FAILED = new Set(['failure', 'timed_out', 'cancelled', 'startup_failure', 'action_required']);

/** GitHub's conclusion as a span status. Skipped and neutral record nothing, so `unset`. */
export function ciConclusionStatus(conclusion: string | null | undefined): TraceSpanStatus {
  if (!conclusion) return 'unset';
  if (FAILED.has(conclusion)) return 'error';
  return conclusion === 'success' ? 'ok' : 'unset';
}

function ms(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function compact(attributes: Record<string, TraceAttributeValue | null | undefined>): Record<string, TraceAttributeValue> {
  const out: Record<string, TraceAttributeValue> = {};
  for (const [key, value] of Object.entries(attributes)) if (value !== null && value !== undefined && value !== '') out[key] = value;
  return out;
}

/**
 * One workflow run and its jobs as spans: run → (queued) → job → step.
 *
 * Skipped jobs are kept, as zero-length spans with `ci.conclusion: skipped`:
 * a gate that never ran is part of the answer to "why is this red". A job
 * GitHub never started has no time to draw and is dropped.
 */
export function githubRunToSpans(
  run: GitHubActionsRun,
  jobs: readonly GitHubActionsJob[],
  options: GitHubRunTraceOptions = {},
): TraceSpanInput[] {
  const { queue = true, steps = true, service = 'github-actions' } = options;
  const runId = `run-${run.id}`;
  const jobStarts = jobs.map((job) => ms(job.started_at)).filter((value): value is number => value !== undefined);
  const runStart = ms(run.run_started_at) ?? ms(run.created_at) ?? (jobStarts.length ? Math.min(...jobStarts) : 0);
  const done = run.status === 'completed';
  const jobEnds = jobs.map((job) => ms(job.completed_at)).filter((value): value is number => value !== undefined);
  // `updated_at` moves on re-runs and annotations; the last job to finish is when the run did.
  const runEnd = done ? (jobEnds.length ? Math.max(...jobEnds) : ms(run.updated_at)) : undefined;

  const spans: TraceSpanInput[] = [
    {
      id: runId,
      name: run.display_title ? `${run.name} · ${run.display_title}` : run.name,
      service,
      kind: 'server',
      start: runStart,
      end: runEnd,
      status: done ? ciConclusionStatus(run.conclusion) : 'unset',
      attributes: compact({
        'ci.provider': 'github-actions',
        'ci.run.id': run.id,
        'ci.run.attempt': run.run_attempt,
        'ci.event': run.event,
        'ci.conclusion': run.conclusion,
        'vcs.ref': run.head_branch,
        'vcs.revision': run.head_sha,
        url: run.html_url,
      }),
    },
  ];

  for (const job of jobs) {
    const start = ms(job.started_at);
    if (start === undefined) continue;
    const jobId = `job-${job.id}`;
    const runner = job.labels?.join(', ') || job.runner_name || 'runner';
    // A skipped job reports a completion before its start; draw it as an instant.
    const completed = ms(job.completed_at);
    const end = completed === undefined ? undefined : Math.max(start, completed);
    const queued = ms(job.created_at);

    if (queue && queued !== undefined && start - queued >= 1000) {
      spans.push({ id: `${jobId}-queue`, parentId: runId, name: `queued · ${job.name}`, service: 'queue', kind: 'internal', start: queued, end: start, attributes: { 'ci.queue.ms': start - queued } });
    }
    spans.push({
      id: jobId,
      parentId: runId,
      name: job.name,
      service: runner,
      kind: 'internal',
      start,
      end,
      status: job.status === 'completed' ? ciConclusionStatus(job.conclusion) : 'unset',
      attributes: compact({ 'ci.job.id': job.id, 'ci.conclusion': job.conclusion, 'ci.runner.name': job.runner_name, url: job.html_url }),
    });

    if (!steps) continue;
    for (const step of job.steps ?? []) {
      const stepStart = ms(step.started_at);
      if (stepStart === undefined) continue;
      const stepCompleted = ms(step.completed_at);
      spans.push({
        id: `${jobId}-step-${step.number}`,
        parentId: jobId,
        name: step.name,
        service: runner,
        kind: 'internal',
        start: stepStart,
        end: stepCompleted === undefined ? undefined : Math.max(stepStart, stepCompleted),
        status: step.status === 'completed' ? ciConclusionStatus(step.conclusion) : 'unset',
        attributes: compact({ 'ci.step.number': step.number, 'ci.conclusion': step.conclusion }),
      });
    }
  }
  return spans;
}
