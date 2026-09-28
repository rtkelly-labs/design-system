/**
 * Which check runs get a vote on whether the train departs.
 *
 * A pure function with a test, rather than a filter inline in the train,
 * because the train's failure mode is silence: it reports `SKIP`, exits 0, and
 * looks like a healthy run that simply had nothing to do. Both deadlocks found
 * so far were of exactly that shape, and neither was visible without reading
 * the log of a green job.
 */

/**
 * Checks that observe the deployment rather than gate the code.
 *
 * `deployment-drift` is the one that matters, and it deadlocks without this:
 * it fails precisely *because* production is behind main, which is the
 * condition promoting would fix. Left in the blocking set, the first train to
 * find the site stale refuses to depart, the site stays stale, and every
 * subsequent train refuses for the same reason. Verified on 2026-09-21 against
 * a nine-day-old production.
 *
 * `backup-main` is housekeeping and says nothing about whether `main` is fit
 * to deploy.
 */
const OBSERVERS = ['backup-main', 'deployment-drift'];

/**
 * The train's own run, excluded by **run id** rather than by name.
 *
 * This is the second deadlock, and it is why matching on a name is not enough.
 * A check run's `name` is the *job* name, not the workflow's: this workflow is
 * `Release Train` but its check reports as `Assess & Release`, so the
 * `'release-train'` and `'release train'` entries that used to sit in
 * `OBSERVERS` matched nothing. The train therefore saw itself listed as an
 * in-progress check on every single run and held — permanently, on every
 * schedule, with every other check green:
 *
 *     CI Status:  in progress (Assess & Release)
 *     Decision:   ⏸️ SKIP
 *
 * A job rename would silently restore that, so the exclusion keys off
 * `GITHUB_RUN_ID`, which is the one identifier that cannot drift from the run
 * actually executing this code.
 */
function runIdOf(check) {
  const url = check.html_url || check.details_url || '';
  const match = url.match(/\/actions\/runs\/(\d+)\b/);
  return match ? match[1] : null;
}

/**
 * @param checkRuns  the `check_runs` array from the commit's check-runs API
 * @param selfRunId  `GITHUB_RUN_ID`; omit outside Actions and only names are used
 * @returns the checks whose state should gate the release
 */
export function selectGatingChecks(checkRuns, { selfRunId } = {}) {
  return (checkRuns || []).filter((check) => {
    const name = (check.name || '').toLowerCase();
    if (OBSERVERS.some((observer) => name.includes(observer))) return false;
    if (selfRunId && runIdOf(check) === String(selfRunId)) return false;
    return true;
  });
}

/**
 * Reduce the gating checks to the train's decision inputs.
 *
 * Order matters: a failure outranks a pending check, because a run still in
 * progress alongside a failed one is not a reason to wait and see.
 */
export function summariseChecks(gating) {
  const inProgress = gating.filter(
    (c) => c.status === 'in_progress' || c.status === 'queued',
  );
  const failed = gating.filter(
    (c) =>
      c.status === 'completed' &&
      ['failure', 'timed_out', 'cancelled'].includes(c.conclusion),
  );
  const successful = gating.filter(
    (c) => c.status === 'completed' && c.conclusion === 'success',
  );

  if (failed.length > 0) {
    return {
      ciFailed: true,
      ciPending: false,
      ciSummary: `failed (${failed.map((c) => c.name).join(', ')})`,
    };
  }
  if (inProgress.length > 0) {
    return {
      ciFailed: false,
      ciPending: true,
      ciSummary: `in progress (${inProgress.map((c) => c.name).join(', ')})`,
    };
  }
  if (successful.length > 0) {
    return {
      ciFailed: false,
      ciPending: false,
      ciSummary: `passed (${successful.length} checks)`,
    };
  }
  return { ciFailed: false, ciPending: false, ciSummary: 'unknown' };
}
