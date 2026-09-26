/**
 * Build everything the Vercel project serves and assemble it into one
 * directory: Storybook at the root, the applied site under `site/`.
 *
 *   node scripts/assemble-deploy.mjs              build all three, then assemble
 *   node scripts/assemble-deploy.mjs --no-build   assemble what is already built
 *
 * This is `vercel.json`'s `buildCommand` (as `pnpm build:deploy`), and
 * `deploy-output/` is its `outputDirectory`. See
 * packages/design-system/docs/hosting.md, "The applied site, embedded".
 *
 * It writes a directory of its own rather than copying the site into
 * `storybook-static/`, because CI and the gates read
 * `storybook-static/index.json` as the catalogue, and a Storybook build
 * directory that also holds a Next export is not the thing they think it is.
 *
 * The checks at the end are the failures a misconfigured basePath produces
 * silently: HTML that is served but asks for `/_next/...` at the root, or for
 * a chunk the export never wrote. Either renders a blank page with a 200.
 */

import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STORYBOOK = path.join(ROOT, 'packages/design-system/storybook-static');
const SITE = path.join(ROOT, 'apps/site/out');
const OUT = path.join(ROOT, 'deploy-output');
const BASE = 'site';

const run = (...args) => {
  console.log(`\n$ pnpm ${args.join(' ')}`);
  execFileSync('pnpm', args, { cwd: ROOT, stdio: 'inherit' });
};

if (!process.argv.includes('--no-build')) {
  // The site resolves the package through its exports map, so `dist/` first.
  run('--filter', '@rtkelly13/design-system', 'build');
  run('--filter', '@rtkelly13/design-system', 'build-storybook');
  run('--filter', '@rtkelly13/design-system-site', 'build');
}

const fail = (message) => {
  console.error(`\nassemble-deploy: ${message}`);
  process.exit(1);
};

if (!existsSync(path.join(STORYBOOK, 'index.json'))) fail(`no ${path.relative(ROOT, STORYBOOK)}/index.json — Storybook is not built.`);
if (!existsSync(path.join(SITE, 'index.html'))) fail(`no ${path.relative(ROOT, SITE)}/index.html — the site is not built.`);
if (existsSync(path.join(STORYBOOK, BASE))) {
  fail(`Storybook's output already has a \`${BASE}/\` entry, which the site would overwrite.`);
}

rmSync(OUT, { recursive: true, force: true });
cpSync(STORYBOOK, OUT, { recursive: true });
cpSync(SITE, path.join(OUT, BASE), { recursive: true });

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

const pages = walk(path.join(OUT, BASE)).filter((file) => file.endsWith('.html'));
const problems = [];
const assets = new Set();
for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  const rel = path.relative(OUT, page);
  if (/(?:src|href)="\/_next\//.test(html)) problems.push(`${rel} loads /_next/ from the root — basePath is not applied`);
  for (const [, asset] of html.matchAll(/(?:src|href)="(\/site\/_next\/[^"?#]+)/g)) assets.add(asset);
}
for (const asset of assets) {
  if (!existsSync(path.join(OUT, asset))) problems.push(`${asset} is referenced and was not exported`);
}
if (!pages.length) problems.push(`no HTML under ${BASE}/`);
if (problems.length) fail(`the assembled site would not load:\n  ${problems.join('\n  ')}`);

console.log(
  `\nAssembled ${path.relative(ROOT, OUT)}/: Storybook at /, the site at /${BASE}/ ` +
    `(${pages.length} pages, ${assets.size} referenced assets, all present).`,
);
