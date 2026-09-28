import { describe, expect, it } from 'vitest';
import {
  PRODUCTION_ENVIRONMENT,
  assessProductionDeployment,
  selectProductionDeployment,
} from './release-train-deployment.mjs';

const MAIN = 'e2746d2aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const OLD = '157cf3dbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

const deployment = (environment, over = {}) => ({
  id: 1,
  environment,
  sha: MAIN,
  created_at: '2026-09-23T10:00:00Z',
  ...over,
});

const withStatus = (d, state) => ({ ...d, latestStatus: { state } });

describe('selectProductionDeployment', () => {
  /**
   * The incident this module exists for. The other Vercel project's build of
   * `main`, reporting success, was read as the site being healthy while the
   * storybook project had not deployed for days.
   */
  it('ignores another project’s production deployment', () => {
    const deployments = [
      deployment('Production – design-system', { id: 2 }),
      deployment('Preview – design-system-storybook', { id: 3 }),
    ];

    expect(selectProductionDeployment(deployments)).toBeNull();
  });

  it('picks the site’s own deployment out of a mixed list', () => {
    const deployments = [
      deployment('Production – design-system', { id: 2 }),
      deployment(PRODUCTION_ENVIRONMENT, { id: 7, sha: OLD }),
    ];

    expect(selectProductionDeployment(deployments)?.id).toBe(7);
  });

  it('matches the environment exactly, not by substring', () => {
    const deployments = [deployment(`${PRODUCTION_ENVIRONMENT}-v2`)];

    expect(selectProductionDeployment(deployments)).toBeNull();
  });

  it('takes the newest when there are several', () => {
    const deployments = [
      deployment(PRODUCTION_ENVIRONMENT, { id: 1, created_at: '2026-09-21T08:00:00Z' }),
      deployment(PRODUCTION_ENVIRONMENT, { id: 2, created_at: '2026-09-25T13:25:09Z' }),
      deployment(PRODUCTION_ENVIRONMENT, { id: 3, created_at: '2026-09-23T10:10:52Z' }),
    ];

    expect(selectProductionDeployment(deployments)?.id).toBe(2);
  });

  it('returns null for an empty or unreadable list', () => {
    expect(selectProductionDeployment([])).toBeNull();
    expect(selectProductionDeployment(null)).toBeNull();
  });
});

describe('assessProductionDeployment', () => {
  it('treats a missing deployment as needing one, not as silence', () => {
    const verdict = assessProductionDeployment(null, MAIN);

    expect(verdict).toMatchObject({
      missing: true,
      outdated: true,
      failed: false,
      pending: false,
    });
    expect(verdict.detail).toBe(`${PRODUCTION_ENVIRONMENT}: no deployment found`);
  });

  it('reports a failed deployment', () => {
    const d = withStatus(deployment(PRODUCTION_ENVIRONMENT), 'failure');

    expect(assessProductionDeployment(d, MAIN)).toMatchObject({
      failed: true,
      pending: false,
      missing: false,
    });
    expect(
      assessProductionDeployment(withStatus(d, 'error'), MAIN).failed,
    ).toBe(true);
  });

  it('holds on a deployment in progress', () => {
    const d = withStatus(deployment(PRODUCTION_ENVIRONMENT), 'in_progress');

    expect(assessProductionDeployment(d, MAIN)).toMatchObject({
      pending: true,
      failed: false,
    });
  });

  it('reports a successful deployment of an older commit as outdated', () => {
    const d = withStatus(deployment(PRODUCTION_ENVIRONMENT, { sha: OLD }), 'success');

    const verdict = assessProductionDeployment(d, MAIN);
    expect(verdict).toMatchObject({ outdated: true, failed: false, missing: false });
    expect(verdict.detail).toBe(`${PRODUCTION_ENVIRONMENT}: [157cf3d] success`);
  });

  it('reports a successful deployment of main as current', () => {
    const d = withStatus(deployment(PRODUCTION_ENVIRONMENT), 'success');

    expect(assessProductionDeployment(d, MAIN)).toMatchObject({
      outdated: false,
      failed: false,
      pending: false,
      missing: false,
    });
  });
});
