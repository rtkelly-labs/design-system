import { describe, expect, it } from 'vitest';
import { selectGatingChecks, summariseChecks } from './release-train-checks.mjs';

const RUN = '35634057428';
const url = (runId, jobId) =>
  `https://github.com/rtkelly13/design-system/actions/runs/${runId}/job/${jobId}`;

const check = (name, over = {}) => ({
  name,
  status: 'completed',
  conclusion: 'success',
  html_url: url('1', '1'),
  ...over,
});

describe('selectGatingChecks', () => {
  /**
   * The deadlock this module exists for. The train's own job is named
   * `Assess & Release`, not `release-train`, so a name-based exclusion missed
   * it and every run held on itself with all other checks green.
   */
  it('excludes the train’s own run by id, whatever the job is called', () => {
    const runs = [
      check('Assess & Release', {
        status: 'in_progress',
        conclusion: null,
        html_url: url(RUN, '106446994836'),
      }),
      check('ci'),
    ];

    const gating = selectGatingChecks(runs, { selfRunId: RUN });

    expect(gating.map((c) => c.name)).toEqual(['ci']);
    expect(summariseChecks(gating)).toMatchObject({
      ciPending: false,
      ciFailed: false,
    });
  });

  it('excludes it even when the job is renamed', () => {
    const runs = [
      check('Something Else Entirely', {
        status: 'in_progress',
        conclusion: null,
        html_url: url(RUN, '9'),
      }),
    ];

    expect(selectGatingChecks(runs, { selfRunId: RUN })).toEqual([]);
  });

  it('keeps another run of the same workflow — only this run is excluded', () => {
    const runs = [
      check('Assess & Release', {
        status: 'in_progress',
        conclusion: null,
        html_url: url('99999', '1'),
      }),
    ];

    expect(selectGatingChecks(runs, { selfRunId: RUN })).toHaveLength(1);
  });

  it('excludes the observers, which watch the deployment rather than the code', () => {
    const runs = [
      check('deployment-drift', { conclusion: 'failure' }),
      check('backup-main'),
      check('ci'),
    ];

    expect(selectGatingChecks(runs, { selfRunId: RUN }).map((c) => c.name)).toEqual(['ci']);
  });

  it('still gates on real checks', () => {
    const runs = [check('visual', { conclusion: 'failure' }), check('ci')];

    const summary = summariseChecks(selectGatingChecks(runs, { selfRunId: RUN }));
    expect(summary.ciFailed).toBe(true);
    expect(summary.ciSummary).toBe('failed (visual)');
  });

  it('falls back to names alone when there is no run id', () => {
    const runs = [check('deployment-drift'), check('ci')];

    expect(selectGatingChecks(runs).map((c) => c.name)).toEqual(['ci']);
  });
});

describe('summariseChecks', () => {
  it('reports a failure over a still-running check', () => {
    const summary = summariseChecks([
      check('visual', { conclusion: 'failure' }),
      check('lint', { status: 'in_progress', conclusion: null }),
    ]);

    expect(summary).toMatchObject({ ciFailed: true, ciPending: false });
  });

  it('holds while a check is queued', () => {
    const summary = summariseChecks([check('lint', { status: 'queued', conclusion: null })]);

    expect(summary).toMatchObject({ ciPending: true, ciFailed: false });
  });

  it('reports unknown when nothing gates', () => {
    expect(summariseChecks([])).toMatchObject({ ciSummary: 'unknown' });
  });
});
