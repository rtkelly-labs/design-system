'use client';

import { getThemeInitScript } from '@/ds';

/**
 * The flash guard, rendered from a client component.
 *
 * It belongs in the root layout's `<head>`, which is a Server Component — and a
 * Server Component cannot import `getThemeInitScript` from the package, because
 * importing anything from the package in the server graph fails the build (see
 * `src/ds.ts`, issue 305). A client component is still rendered to HTML on the server, so
 * the `<script>` lands in the static document and runs before first paint,
 * which is the only thing it is for. It does nothing on the client.
 */
export function ThemeInitScript() {
  return (
    <script
      // Same default as the ThemeProvider in `Providers`, or the first paint
      // and the markup disagree.
      dangerouslySetInnerHTML={{ __html: getThemeInitScript({ defaultLevel: 'midnight' }) }}
    />
  );
}
