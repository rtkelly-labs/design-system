/**
 * Storybook and the site are one deployment: Storybook at `/`, this site under
 * the `/site` basePath (docs/hosting.md, "The applied site, embedded"). So a
 * Storybook link is root-relative and works unchanged on the production domain,
 * `preview`, every `slot/N` domain and a local serve of the assembled output.
 *
 * `next dev` serves only this site, with nothing at `/`, so in development the
 * links point at the production Storybook instead of at a 404.
 */
const STORYBOOK_ORIGIN = process.env.NODE_ENV === 'development' ? 'https://design-system.ryankelly.dev' : '';

/**
 * A Storybook URL for a manager path such as `/docs/foundations-button--docs`.
 *
 * Always carries `?path=`, never a bare `/`: the site's own home is `/` too,
 * and `isStorybookHref` has to tell the two apart.
 */
export const storybookUrl = (path: string) => `${STORYBOOK_ORIGIN}/?path=${path}`;

/** Storybook's front page, the Introduction guide. */
export const STORYBOOK_URL = storybookUrl('/docs/guides-introduction--docs');

/**
 * True for a root-relative Storybook link. `next/link` would prefix it with
 * the basePath and route it inside this app, where it does not exist, so
 * `RouterLink` renders these as plain anchors.
 */
export const isStorybookHref = (href: string) => href.startsWith('/?');

export const REPO_URL = 'https://github.com/rtkelly13/design-system';
