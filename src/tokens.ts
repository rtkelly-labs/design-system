/**
 * The pre-ladder token surface.
 *
 * @deprecated Use the semantic API instead — `semanticTokens`, `accentVar()`,
 * `surfaceVar()`, `textVar()`, `borderVar()` from `lib/theme`, or the
 * `--ds-*` custom properties directly. Everything here resolves through the
 * compatibility aliases emitted by `theme.css`, so it still renders correctly on
 * all four levels, but the names describe hues rather than roles and the
 * aliases are removed once the components stop using them.
 */

import type { ThemeLevel } from './theme/levels';


/**
 * @deprecated Renamed to {@link ThemeLevel}. The ladder replaced the old
 * `dark | dim | sketch` set: `dark` is now `midnight`, `sketch` is now
 * `bright`, and `white` is new.
 */
export type BrutalistTheme = ThemeLevel;
