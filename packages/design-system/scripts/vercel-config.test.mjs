import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// `vercel.json` lives at the repository root and is read by Vercel, not by
// anything here, so nothing else exercises it. Both assertions below are
// failures that already happened: #288 added `production` and took
// `ignoreCommand` to 279 characters, and Vercel rejected the config outright —
// every deployment of both projects failed, previews of `main` included, with
// only "Deployment failed" to say why.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const config = JSON.parse(readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));

// Vercel's documented ceiling for `ignoreCommand`.
const IGNORE_COMMAND_MAX = 256;

// Exit 1 builds, exit 0 skips: Vercel's convention, inverted from the usual one.
function decides(ref, message = 'chore: an ordinary commit') {
  try {
    execFileSync('bash', ['-c', config.ignoreCommand], {
      env: { ...process.env, VERCEL_GIT_COMMIT_REF: ref, VERCEL_GIT_COMMIT_MESSAGE: message },
      stdio: 'ignore',
    });
    return 'skip';
  } catch (error) {
    if (error.status === 1) return 'build';
    throw error;
  }
}

describe('vercel.json', () => {
  it(`keeps ignoreCommand within Vercel's ${IGNORE_COMMAND_MAX}-character limit`, () => {
    expect(config.ignoreCommand.length).toBeLessThanOrEqual(IGNORE_COMMAND_MAX);
  });

  // `production` is the release train's pointer and the branch the domain
  // serves; leaving it out of either gate is how the train moved the pointer
  // and deployed nothing.
  it.each(['main', 'production', 'preview', 'slot/3'])('creates and builds %s', (ref) => {
    expect(config.git.deploymentEnabled[ref] ?? config.git.deploymentEnabled['slot/*']).toBe(true);
    expect(decides(ref)).toBe('build');
  });

  it.each(['feat/x', 'mainline', 'slot/x'])('skips %s', (ref) => {
    expect(decides(ref)).toBe('skip');
  });

  it('builds any branch whose commit asks for it', () => {
    expect(decides('feat/x', 'docs: try this [storybook]')).toBe('build');
  });
});
