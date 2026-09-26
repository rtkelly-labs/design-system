/**
 * Serve a static directory the way the Vercel project serves the deployment,
 * so the assembled output can be checked locally before anything deploys.
 *
 *   node scripts/serve-deploy.mjs [dir] [--port 3200] [--mount /site]
 *
 * `dir` defaults to `deploy-output/` (what `pnpm build:deploy` writes).
 * `--mount` serves `dir` under a prefix instead of at `/`, which is how
 * `apps/site`'s `pnpm start` serves its bare `out/` at the `/site` basePath.
 *
 * What it reproduces from `vercel.json`, because each one changes whether a
 * URL resolves:
 *
 * - `cleanUrls: false` — no extension is stripped or added. `/iframe.html` is a
 *   file; `/site/docs` is a directory and serves its `index.html`.
 * - `trailingSlash: false` — `/site/docs/` answers 308 to `/site/docs`.
 * - `headers` — applied through the same matcher the config test uses. A path
 *   no rule matches gets Vercel's static default,
 *   `public, max-age=0, must-revalidate`.
 *
 * No dependency: `serve` must not enter the lockfile (apps/site/AGENTS.md,
 * rule 6), and this is small enough not to need it.
 */

import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { headersFor } from './vercel-headers.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const at = args.indexOf(name);
  if (at === -1) return fallback;
  const value = args[at + 1];
  args.splice(at, 2);
  return value;
};
const port = Number(flag('--port', process.env.PORT ?? '3200'));
const mount = (flag('--mount', '') ?? '').replace(/\/$/, '');
const dir = path.resolve(args[0] ?? path.join(ROOT, 'deploy-output'));

if (!existsSync(dir)) {
  console.error(`${dir} does not exist. Run \`pnpm build:deploy\` first.`);
  process.exit(1);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

const DEFAULT_CACHE = 'public, max-age=0, must-revalidate';

function resolveFile(pathname) {
  if (mount) {
    if (pathname !== mount && !pathname.startsWith(`${mount}/`)) return null;
    pathname = pathname.slice(mount.length) || '/';
  }
  const target = path.join(dir, pathname);
  if (!target.startsWith(dir)) return null;
  if (!existsSync(target)) return null;
  const stat = statSync(target);
  if (stat.isFile()) return target;
  const index = path.join(target, 'index.html');
  return existsSync(index) ? index : null;
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }

  if (pathname.length > 1 && pathname.endsWith('/')) {
    res.writeHead(308, { location: pathname.replace(/\/+$/, '') + url.search }).end();
    log(req, 308);
    return;
  }

  const file = resolveFile(pathname);
  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('404: Not found');
    log(req, 404);
    return;
  }

  const headers = {
    'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream',
    'cache-control': DEFAULT_CACHE,
    ...headersFor(config, pathname),
  };
  res.writeHead(200, headers);
  if (req.method === 'HEAD') res.end();
  else createReadStream(file).pipe(res);
  log(req, 200);
});

function log(req, status) {
  if (process.env.SERVE_DEPLOY_QUIET) return;
  console.log(`${status} ${req.method} ${req.url}`);
}

server.listen(port, () => {
  console.log(`Serving ${path.relative(ROOT, dir) || dir} at http://localhost:${port}${mount || ''}/`);
});
