import type { Metadata } from 'next';
import { CodeTab, CodeTabs, NoteBlock } from '@/ds';
import { Article, Heading } from '@/components/docs/Article';
import { Code } from '@/components/docs/Code';
import { installation as article } from '@/content/articles';

export const metadata: Metadata = { title: article.title, description: article.lede };

const ISSUE_RSC = 'https://github.com/rtkelly13/design-system/issues/305';

export default function InstallationPage() {
  return (
    <Article article={article}>
      <Heading article={article} id="install" />
      <p>
        The package is on the public npm registry, with no registry configuration needed. It styles through Tailwind CSS
        v4, so install Tailwind as well. <code>@tailwindcss/typography</code> is optional and only needed for{' '}
        <code>prose.css</code>, which <code>styles.css</code> includes.
      </p>
      <CodeTabs group="pkg">
        <CodeTab label="pnpm">
          <Code lang="bash" code={'pnpm add @rtkelly13/design-system\npnpm add -D tailwindcss @tailwindcss/postcss @tailwindcss/typography'} />
        </CodeTab>
        <CodeTab label="npm">
          <Code lang="bash" code={'npm install @rtkelly13/design-system\nnpm install -D tailwindcss @tailwindcss/postcss @tailwindcss/typography'} />
        </CodeTab>
        <CodeTab label="yarn">
          <Code lang="bash" code={'yarn add @rtkelly13/design-system\nyarn add -D tailwindcss @tailwindcss/postcss @tailwindcss/typography'} />
        </CodeTab>
      </CodeTabs>
      <p>
        Peer requirements: React 18 or 19, and Tailwind v4. The interaction layer is <code>@base-ui/react</code>, installed as
        a dependency. Do not add a second focus-management library alongside it.
      </p>

      <Heading article={article} id="stylesheet" />
      <p>
        Import one stylesheet from your CSS entry point. <code>styles.css</code> brings in Tailwind, the generated{' '}
        <code>theme.css</code> tokens, the prose layer, the self-hosted fonts and the global resets.
      </p>
      <Code lang="css" title="app/globals.css" code={'@import "@rtkelly13/design-system/styles.css";'} />
      <Code lang="tsx" title="postcss.config.mjs" code={"export default {\n  plugins: { '@tailwindcss/postcss': {} },\n};"} />
      <p>
        To bring your own resets and fonts, compose the tokens alone instead. Do not import both.
      </p>
      <Code lang="css" title="app/globals.css" code={'@import "tailwindcss";\n@import "@rtkelly13/design-system/theme.css";'} />
      <p>
        <code>theme.css</code> carries an <code>@source</code> directive for the compiled components. Tailwind v4 skips{' '}
        <code>node_modules</code> when it detects content, so without that directive none of the utilities the components
        use would be generated.
      </p>

      <Heading article={article} id="provider" />
      <p>
        <code>ThemeProvider</code> owns the level (<code>midnight</code> or <code>sketch</code>). It sets{' '}
        <code>data-theme</code> on the document, and every role token resolves from that. Mount it once, near the root, in a
        client component.
      </p>
      <Code
        title="app/providers.tsx"
        code={`'use client';

import { ThemeProvider } from '@rtkelly13/design-system';

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider defaultLevel="midnight">{children}</ThemeProvider>;
}`}
      />

      <Heading article={article} id="flash" />
      <p>
        React cannot choose the level before first paint. By the time it hydrates, the page has already been painted in the
        default. <code>getThemeInitScript()</code> returns a small inline script that reads the stored choice (or the OS
        preference) and sets <code>data-theme</code> before anything paints. Pass it the same <code>defaultLevel</code> as
        the provider.
      </p>
      <Code
        title="app/theme-init-script.tsx"
        code={`'use client';

import { getThemeInitScript } from '@rtkelly13/design-system';

export function ThemeInitScript() {
  return <script dangerouslySetInnerHTML={{ __html: getThemeInitScript({ defaultLevel: 'midnight' }) }} />;
}`}
      />
      <Code
        title="app/layout.tsx"
        code={`import './globals.css';
import { Providers } from './providers';
import { ThemeInitScript } from './theme-init-script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="midnight" suppressHydrationWarning>
      <head>
        <ThemeInitScript />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}`}
      />
      <p>
        <code>suppressHydrationWarning</code> is needed because the script may change <code>data-theme</code> before
        React hydrates. The script is in a client component only because of the limitation described next. It is still
        rendered into the static HTML, so it runs before paint.
      </p>

      <Heading article={article} id="nextjs" />
      <p>
        This site is a Next.js App Router application, statically exported. It proves the package in Server Components
        with client islands. Two things need setting up.
      </p>

      <Heading article={article} id="client-boundary" />
      <NoteBlock type="warning" title="KNOWN LIMITATION">
        Today the package cannot be imported from a Server Component. It ships one bundle with no{' '}
        <code>&quot;use client&quot;</code> directive, and that bundle calls <code>createContext</code> at module scope. Any
        import from a Server Component fails the build with{' '}
        <em>“You&apos;re importing a module that depends on createContext into a React Server Component module”</em>. This
        includes a stateless <code>Card</code> and a pure function like <code>getThemeInitScript</code>. Tracked in{' '}
        <a href={ISSUE_RSC}>issue 305</a>.
      </NoteBlock>
      <p>
        Until that is fixed, add one client boundary of your own and import the package only through it. Next.js rejects{' '}
        <code>export *</code> from a client boundary, so list the names:
      </p>
      <Code
        title="src/ds.ts"
        code={`'use client';

export { Button, Card, Modal, DataTable, Prose, CodeBlock } from '@rtkelly13/design-system';
export type { ButtonVariant, Column } from '@rtkelly13/design-system';`}
      />
      <p>
        Server Components can then render any of those. They become client references, so props must be serialisable
        (no event handlers from a Server Component), and a pure helper imported through this file cannot be called on the
        server. Client components (any file starting with <code>&apos;use client&apos;</code>) can import from the package
        directly, as every example on this site does.
      </p>

      <Heading article={article} id="router-links" />
      <p>
        The site chrome (<code>SiteHeader</code>, <code>SiteNav</code>, <code>DocsSidebar</code>, <code>DocPager</code>)
        renders links through one adapter. Give it <code>next/link</code> and a current-page test built from the router, and
        navigation becomes client-side, with <code>aria-current=&quot;page&quot;</code> following the route:
      </p>
      <Code
        title="app/providers.tsx"
        code={`'use client';

import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { forwardRef } from 'react';
import { LinkProvider, ThemeProvider, type LinkComponentProps } from '@rtkelly13/design-system';

const RouterLink = forwardRef<HTMLAnchorElement, LinkComponentProps>(function RouterLink({ href, ...rest }, ref) {
  return <NextLink ref={ref} href={href} {...rest} />;
});

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <ThemeProvider defaultLevel="midnight">
      <LinkProvider component={RouterLink} isCurrent={(href) => href === pathname}>
        {children}
      </LinkProvider>
    </ThemeProvider>
  );
}`}
      />

      <Heading article={article} id="first-component" />
      <p>
        With the stylesheet and the providers in place, components need no further setup. Colour is addressed by role
        (<code>bg-surface-raised</code>, <code>text-intent-danger</code>) and never by hue, so your own utilities follow the
        level too.
      </p>
      <Code
        title="app/deploy-button.tsx"
        code={`'use client';

import { Button } from '@rtkelly13/design-system';

export function DeployButton() {
  return (
    <div className="border-2 border-edge-strong bg-surface-raised p-6 shadow-hard-md">
      <p className="mb-4 font-mono text-sm text-content-secondary">&gt; billing-api 3f9c2e1 is ready</p>
      <Button variant="primary" bracketed onClick={() => console.log('deploy')}>
        DEPLOY
      </Button>
    </div>
  );
}`}
      />
    </Article>
  );
}
