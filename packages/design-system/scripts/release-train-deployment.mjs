/**
 * Which deployment tells the train whether the site is healthy.
 *
 * A pure function with a test, for the same reason as
 * `release-train-checks.mjs`: the train's failure mode is a green run that did
 * nothing, and this was the third way it found to be one.
 *
 * The repository has two Vercel projects, and both post GitHub deployments:
 *
 *   - `Production – design-system`, a different project, which deploys `main`;
 *   - `Production – design-system-storybook`, the project
 *     design-system.ryankelly.dev serves, built from `production`.
 *
 * The train used to read the latest deployment of every environment whose name
 * *contained* `production`, among the last 15 of any kind. On 23 September the
 * storybook project had not deployed for days and its deployments had fallen
 * out of that window behind previews, so the only production deployment left
 * was the other project's build of `main`, reporting success. The train
 * printed that and called the site healthy while it served an old build.
 *
 * So the environment is matched **exactly**, the caller asks the API for that
 * environment rather than a window, and "no deployment" is a reason to deploy,
 * never silence.
 */

/** The GitHub deployment environment Vercel posts for the site's project. */
export const PRODUCTION_ENVIRONMENT = 'Production – design-system-storybook';

/**
 * The newest deployment of exactly `environment`, or `null`.
 *
 * The caller already filters with `?environment=`; matching again here is what
 * keeps another project out if that filter is ever dropped or ignored.
 *
 * @param deployments  the array from the repository deployments API
 * @param environment  defaults to {@link PRODUCTION_ENVIRONMENT}
 */
export function selectProductionDeployment(
  deployments,
  { environment = PRODUCTION_ENVIRONMENT } = {},
) {
  const matching = (deployments || []).filter(
    (d) => d.environment === environment,
  );
  if (matching.length === 0) return null;
  return matching.reduce((newest, d) =>
    Date.parse(d.created_at) > Date.parse(newest.created_at) ? d : newest,
  );
}

/**
 * Reduce the selected deployment to the train's decision inputs.
 *
 * @param deployment  from {@link selectProductionDeployment}, carrying the
 *                    newest status as `latestStatus`; `null` when there is none
 * @param sourceSha   the head of `main`
 * @param environment the name to report, defaults to {@link PRODUCTION_ENVIRONMENT}
 */
export function assessProductionDeployment(
  deployment,
  sourceSha,
  { environment = PRODUCTION_ENVIRONMENT } = {},
) {
  if (!deployment) {
    return {
      missing: true,
      failed: false,
      pending: false,
      outdated: true,
      detail: `${environment}: no deployment found`,
    };
  }

  const state = deployment.latestStatus?.state || 'unknown';
  const sha = deployment.sha || 'unknown';

  return {
    missing: false,
    failed: ['failure', 'error'].includes(state),
    pending: ['pending', 'in_progress', 'queued'].includes(state),
    outdated: sha !== sourceSha,
    detail: `${environment}: [${sha.slice(0, 7)}] ${state}`,
  };
}
