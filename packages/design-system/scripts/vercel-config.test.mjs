import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { headersFor, matchingRules } from '../../../scripts/vercel-headers.mjs';

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

// The deployment is Storybook at `/` and the applied site under `/site`,
// assembled by `scripts/assemble-deploy.mjs` (docs/hosting.md, "The applied
// site, embedded"). The header rules are read through the same matcher the
// local server uses, so a rule that works here serves the same way there.
describe('vercel.json — the embedded site', () => {
  const cache = (pathname) => headersFor(config, pathname)['cache-control'];

  it('builds and serves the assembled directory, not storybook-static', () => {
    expect(config.buildCommand).toBe('pnpm build:deploy');
    const assemble = readFileSync(path.join(ROOT, 'scripts/assemble-deploy.mjs'), 'utf8');
    expect(assemble).toContain(`path.join(ROOT, '${config.outputDirectory}')`);
  });

  it('installs the site and, through it, the package', () => {
    expect(config.installCommand).toMatch(/--filter @rtkelly13\/design-system-site\.\.\.(\s|$)/);
  });

  // Next writes content hashes into everything under `_next/static/`.
  it.each(['/site/_next/static/chunks/0a1b2c3d4e5f.js', '/site/_next/static/media/font.p.woff2'])(
    'marks %s immutable',
    (pathname) => {
      expect(cache(pathname)).toBe('public, max-age=31536000, immutable');
    },
  );

  // HTML and the RSC payloads keep their names across builds, so a year of
  // `immutable` would pin a reader to whichever build they loaded first.
  it.each([
    '/site',
    '/site/index.html',
    '/site/docs/components/button/index.html',
    '/site/docs/components/button/__next._tree.txt',
    '/index.html',
    '/iframe.html',
  ])('does not mark %s immutable', (pathname) => {
    expect(cache(pathname) ?? '').not.toMatch(/immutable/);
  });

  it('never has two rules setting the same header on one path', () => {
    const paths = ['/site/_next/static/chunks/a.js', '/site/index.html', '/assets/a.js', '/index.json', '/sb-manager/runtime.js'];
    for (const pathname of paths) {
      const keys = matchingRules(config, pathname).flatMap((rule) => rule.headers.map((h) => h.key.toLowerCase()));
      expect(new Set(keys).size, pathname).toBe(keys.length);
    }
  });
});
