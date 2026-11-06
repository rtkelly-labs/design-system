import type { ReactNode } from 'react';
import { ThemeProvider } from '../../components/ThemeProvider';

/**
 * The integration story, as data — so the page cannot describe one thing and
 * mount another.
 *
 * That is the whole point of this file. `README.md` carried the same snippet as
 * a fenced block nobody rendered, and it drifted until it named a prop that does
 * not exist (`defaultTheme`) and a level that was never on the ladder (`dark`) —
 * #73. A portal built the same way rots the same way.
 *
 * So `LEVEL` below is the single origin. The live preview calls
 * {@link MountedApp}, the page prints `MOUNT_SOURCE`, and `integration.test.tsx`
 * asserts the printed string names the same level the preview actually mounts.
 * The moment those two can disagree is the moment the page starts lying.
 */
export const LEVEL = 'midnight' as const;

/** Step 1 — the stylesheet, once, wherever your app boots. */
export const STYLES_SOURCE = `import '@rtkelly13/design-system/styles.css';`;

/**
 * Step 2 — the provider. Printed on the page *and* parsed by the test that keeps
 * it honest, which is why the level appears as a literal rather than an
 * interpolation.
 */
export const MOUNT_SOURCE = `import { ThemeProvider } from '@rtkelly13/design-system';

export function App() {
  return (
    <ThemeProvider defaultLevel="${LEVEL}">
      <YourApp />
    </ThemeProvider>
  );
}`;

/**
 * Step 3 — the flash guard. Without it the first painted frame uses the default
 * level and the second uses the stored one, which reads as the page changing its
 * mind.
 */
export const INIT_SOURCE = `import { getThemeInitScript } from '@rtkelly13/design-system';

// In your document <head>, before any stylesheet:
<script dangerouslySetInnerHTML={{ __html: getThemeInitScript('${LEVEL}') }} />`;

/**
 * Step 4 — the `@source` directive. Load-bearing rather than optional: Tailwind
 * v4 does not scan `node_modules`, so without it every utility this package's
 * components name is absent from the generated CSS and they render unstyled.
 */
export const TAILWIND_SOURCE = `@import 'tailwindcss';
@source '../node_modules/@rtkelly13/design-system/dist';`;

/**
 * The live preview for step 2.
 *
 * `scoped` and `persist={false}` because this is an embedded demo inside a page
 * that already has a level: it themes its own subtree and must not write to the
 * host's storage. `defaultLevel` is the same constant the printed source names.
 */
export function MountedApp({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider defaultLevel={LEVEL} scoped persist={false} followSystem={false}>
      {children}
    </ThemeProvider>
  );
}
