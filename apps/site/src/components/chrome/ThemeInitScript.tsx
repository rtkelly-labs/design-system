import { getThemeInitScript } from '@rtkelly13/design-system';

/** The theme flash guard runs before first paint, rendered on the server. */
export function ThemeInitScript() {
  return (
    <script
      // Same default as the ThemeProvider in `Providers`, or the first paint
      // and the markup disagree.
      dangerouslySetInnerHTML={{ __html: getThemeInitScript({ defaultLevel: 'midnight' }) }}
    />
  );
}
