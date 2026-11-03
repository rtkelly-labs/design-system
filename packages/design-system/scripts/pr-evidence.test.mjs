import { describe, expect, it } from 'vitest';
import { MARKER, order, pairsFromResults, renderComment, renderFailures } from './pr-evidence.mjs';

describe('pairsFromResults', () => {
  it('groups Playwright output by snapshot name, and an actual with no expected is a new story', () => {
    const pairs = pairsFromResults([
      'test-results/a/button-default-expected.png',
      'test-results/a/button-default-actual.png',
      'test-results/a/button-default-diff.png',
      'test-results/b/review-page-mobile-actual.png',
      'test-results/b/trace.zip',
    ]);
    expect(pairs).toEqual([
      {
        name: 'button-default',
        expected: 'test-results/a/button-default-expected.png',
        actual: 'test-results/a/button-default-actual.png',
        diff: 'test-results/a/button-default-diff.png',
      },
      { name: 'review-page-mobile', actual: 'test-results/b/review-page-mobile-actual.png' },
    ]);
  });
});

describe('renderFailures', () => {
  it('keeps errors that are not pixel comparisons, so a story that would not render is reported', () => {
    const report = {
      suites: [
        {
          title: 'visual.spec.ts',
          specs: [
            { title: 'a', tests: [{ projectName: 'chromium', results: [{ errors: [{ message: 'Screenshot comparison failed' }] }] }] },
            { title: 'b', tests: [{ projectName: 'mobile', results: [{ errors: [{ message: '\u001b[31mTimeout\u001b[39m waiting\nstack' }] }] }] },
          ],
        },
      ],
    };
    expect(renderFailures(report)).toEqual([{ title: 'mobile › b', message: 'Timeout waiting' }]);
  });

  it('keeps top-level errors, where a run that never started records them', () => {
    const report = { errors: [{ message: 'Error: Process from config.webServer exited early.\nstack' }], suites: [] };
    expect(renderFailures(report)).toEqual([{ title: 'run', message: 'Error: Process from config.webServer exited early.' }]);
  });
});

describe('order', () => {
  it('puts mobile captures first, since review happens on a phone', () => {
    expect(order(['card', 'appshell-mobile', 'badge'])).toEqual(['appshell-mobile', 'badge', 'card']);
  });
});

describe('renderComment', () => {
  const base = { base: 'aaaaaaaaaa', head: 'bbbbbbbbbb', baseRef: 'main', status: 'rendered', total: 195, failures: [] };

  it('carries the marker the workflow finds it by, and says so when nothing moved', () => {
    const body = renderComment({ ...base, changed: [], added: [] }, { raw: 'https://raw' });
    expect(body.startsWith(MARKER)).toBe(true);
    expect(body).toContain('No asserted story renders differently');
  });

  it('shows the first few open and keeps the comment bounded when everything moved', () => {
    const changed = Array.from({ length: 200 }, (_, i) => `story-${String(i).padStart(3, '0')}`);
    const body = renderComment({ ...base, changed, added: [] }, { raw: 'https://raw' });
    expect(body.match(/^#### /gm)).toHaveLength(6);
    expect(body).toContain('160 more, names only');
    expect(body.length).toBeLessThan(65_536);
  });

  it('says the build failed rather than that nothing changed', () => {
    const body = renderComment({ ...base, status: 'build-failed', changed: [], added: [] }, { raw: '' });
    expect(body).toContain('Storybook did not build');
  });

  it('gives no all-clear when nothing was compared', () => {
    const failures = [{ title: 'run', message: 'webServer exited early' }];
    const body = renderComment({ ...base, total: 0, changed: [], added: [], failures }, { raw: '' });
    expect(body).not.toContain('No asserted story renders differently');
    expect(body).toContain('compared nothing');
  });
});
