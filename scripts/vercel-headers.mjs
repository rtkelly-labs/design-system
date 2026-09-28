/**
 * The subset of Vercel's `headers` matching this repo's `vercel.json` uses,
 * shared by the local server (`serve-deploy.mjs`) and the config test
 * (`packages/design-system/scripts/vercel-config.test.mjs`).
 *
 * Vercel matches `source` with path-to-regexp. Every source here is a literal
 * path, optionally ending in the `(.*)` wildcard, so that is all this
 * understands — and it throws on anything else rather than quietly reading a
 * pattern differently from Vercel. Extend it when `vercel.json` needs more.
 */

const SUPPORTED = /^\/[\w./-]*(\(\.\*\))?$/;

/** A `RegExp` for one `headers[].source`. */
export function sourcePattern(source) {
  if (!SUPPORTED.test(source)) {
    throw new Error(
      `vercel.json header source ${JSON.stringify(source)} uses path-to-regexp syntax ` +
        'scripts/vercel-headers.mjs does not implement. Extend the matcher before relying on it.',
    );
  }
  const literal = source.replace(/\(\.\*\)$/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${literal}${source.endsWith('(.*)') ? '.*' : ''}$`);
}

/** Every header rule in `config` whose source matches `pathname`, in file order. */
export function matchingRules(config, pathname) {
  return (config.headers ?? []).filter((rule) => sourcePattern(rule.source).test(pathname));
}

/**
 * The headers Vercel would add to a static response for `pathname`, keys
 * lower-cased. A later rule overrides an earlier one on the same key; the
 * config test keeps any path from being matched by two rules that set the same
 * key, so nothing here depends on that ordering.
 */
export function headersFor(config, pathname) {
  const out = {};
  for (const rule of matchingRules(config, pathname)) {
    for (const { key, value } of rule.headers) out[key.toLowerCase()] = value;
  }
  return out;
}
