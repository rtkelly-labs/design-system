import { getA11yInitScript } from '@rtkelly13/design-system';

/**
 * The accessibility-preference guard, run before first paint beside the theme's:
 * a stored choice or an OS signal is already an attribute when the page is first
 * drawn, so nothing flashes and then corrects itself. Rendered on the server.
 */
export function A11yInitScript() {
  return <script dangerouslySetInnerHTML={{ __html: getA11yInitScript() }} />;
}
