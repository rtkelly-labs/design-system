RESEARCH: accessibility preferences, how others do it (accessed 2026-10-15; read-only, nothing edited)

Headline findings
- No product I could verify ships "glyphs only when asked". GitHub is the only one with real CVD modes, and it does them as separate themes (palette swaps), chosen in account settings. Apple is the one platform with an OS-level "differentiate without colour" signal. The web has no equivalent.
- OS-driven signals plus an in-app override is the dominant pattern: GitHub, Discord and Teams all do it.
- WCAG 1.4.1 does not forbid opt-in cues in the text of the criterion, but it only permits them through the "conforming alternate version" route. That route is fragile for a default-colour-only chart (see D).

LOCAL CONTEXT (read)
- Theme today: `ThemeProvider` holds a Level, applies `data-theme` on `documentElement`, and persists to `localStorage` key `ds-theme-level`.
- It falls back to `prefers-color-scheme` via `SYSTEM_LEVEL`. `getThemeInitScript()` sets the attribute pre-paint, with a try/catch around storage. It lives in its own non-`'use client'` module so server layouts can call it.
- The provider trusts the attribute the init script already set, which avoids a hydration mismatch.
- ADR 0004: Level = colour, selected at runtime by `data-theme`. Medium = geometry and time, selected at build time. "No token varies on both."
- Consequence for a11y prefs: they are neither axis. Motion and density fit Medium's territory but need runtime selection. CVD and contrast are colour but orthogonal to Level. So a third, runtime "Preference" axis is needed, or ADR 0004 needs an amendment.
- `theme.css:260` already has `@media (prefers-reduced-motion: reduce)`.
- `decisions.md` rows D1–D5 are visible. D3 cites WCAG 1.4.1 (danger vs. same-hue sibling). I did not read D6–D8 content, only the `D6–D10.tsx` filenames in `apps/site/src/decisions/p2/`. D9 is `D9.tsx`, whose `Mark` renders a shape SVG plus a letter beside a colour swatch.

(A) COMPARISON TABLE

| Product / system | Preferences offered | CVD approach | Where stored | OS-signal handling | Source |
|---|---|---|---|---|---|
| GitHub | Theme mode (single / follow system with day + night theme); high contrast; light + dark colorblind themes (the 2022 changelog names Protanopia & Deuteranopia and Tritanopia variants, beta then); link underlines; hovercards off; character-key shortcuts off; command-palette shortcut; autoplay animated images (Sync / Enabled / Disabled); "Increase contrast" toggle | Separate themes (palette swaps). Per the Primer primitives README, variants are override files containing only changed tokens on top of light and dark: `light-colorblind`, `dark-colorblind`, `light-tritanopia`, `dark-tritanopia`, `*-high-contrast`. Method (swap vs. patterns) not stated by GitHub, unverified. | Not stated in docs. Settings > Appearance / Accessibility, so account-scoped in practice (unverified). Signed-out users get a sliders icon in the nav. | "Follow system" for light/dark; animation default "follows your OS reduced-motion setting" | https://docs.github.com/en/get-started/accessibility/managing-your-theme-settings ; https://docs.github.com/en/account-and-profile/how-tos/account-settings/managing-accessibility-settings ; https://github.blog/changelog/2022-04-19-protanopia-deuteranopia-colorblind-themes-beta/ ; https://github.com/primer/primitives |
| Primer (GitHub DS) | Light, dark, dark-dimmed, high-contrast, colorblind and tritanopia variants (9 theme CSS files). React: `colorMode` day / night / auto; `dayScheme` / `nightScheme`; `preventSSRMismatch` | Per-variant token overrides | n/a (library) | `auto` syncs with OS | https://primer.style/product/getting-started/react/theming/ ; https://github.com/primer/primitives |
| Discord | Saturation slider (lowers colour intensity, can include role colours); reduced motion; Windows high-contrast support | No CVD mode found. The saturation slider is a colour-sensitivity aid, not CVD. | Not stated | Reduced motion: default syncs with computer; a separate toggle forces it inside Discord regardless of OS | https://discord.com/blog/improving-app-accessibility-a11y-updates ; https://support.discord.com/hc/en-us/articles/1500010454681-Accessibility-Settings-Tab (search snippet only) |
| Slack | Reduced motion, animation preference, zoom, contrast, text size (mobile), Simplified Layout Mode | No CVD mode found | Not stated | Not stated | https://slack.com/intl/en-ie/accessibility |
| Microsoft Teams | Theme: Follow OS / Light / Dark / High Contrast | None found | Not stated | "Follow operating system theme" | https://support.microsoft.com/en-au/office/customize-the-appearance-in-microsoft-teams-free-51f24f07-1209-4f9d-8788-c0da4d98aede (search snippet) |
| Atlassian / Jira | Theme: Light / Dark / "Match browser" (auto). Tokens expose `data-color-mode`. | None found. Docs use a hypothetical `high-contrast-light` theme as an example, not shipped. | Profile setting | `auto` = match browser | https://developer.atlassian.com/cloud/jira/platform/connect-theming/ ; https://atlassian.design/components/tokens/all-tokens (light and dark value columns only) |
| Figma | "Enhanced contrast" toggle, works in light and dark | None found | Not stated | Not stated | https://www.figma.com/blog/introducing-screenreader-and-accessibility-features/ (search snippet) |
| Linear | Dark / light / system; custom themes | None found | Per platform, not synced ("update the theme on each platform individually") | System option | https://linear.app/docs/custom-themes (search snippet) |
| VS Code | High Contrast color theme; `editor.accessibilitySupport` on / off / auto; `accessibility.signals.*` | No built-in CVD theme. Page recommends marketplace themes and `workbench.colorCustomizations`. | User `settings.json` | `accessibilitySupport: auto` detects a screen reader via the platform; signals "may be enabled automatically when a screen reader is attached" | https://code.visualstudio.com/docs/configure/accessibility/accessibility |
| Gmail | High-contrast themes in the themes gallery | None found | Account | Not stated | Third-party sources only, unverified (csun.edu/universal-design-center/gmail) |
| Material 3 / Android | Three contrast levels (standard / medium / high) | None | OS user setting (Android 14 slider) | Reads the OS contrast setting | Secondary sources only, unverified: https://9to5google.com/2023/04/07/android-14-material-you-contrast/ ; m3.material.io fetch returned title only |
| Apple platforms | Increase Contrast, Reduce Motion, Differentiate Without Color are OS settings that apps read | "Differentiate Without Color" is an OS signal that tells the app to add shapes/glyphs. This is the closest precedent to your idea. | OS, per device | Apps are expected to honour it | https://developer.apple.com/tutorials/data/documentation/appkit/nsworkspace/accessibilitydisplayshoulddifferentiatewithoutcolor.md ; https://developer.apple.com/help/app-store-connect/manage-app-accessibility/differentiate-without-color-alone-evaluation-criteria (search snippets) |
| Adobe Spectrum | Light and dark themes only (per the page I fetched) | No setting. Guidance: don't use colour alone; pair with a label or icon; two-tone pairs "not colour vision deficiency safe". | n/a | n/a | https://spectrum.adobe.com/page/color-system/ |
| GOV.UK | No user-selectable themes (nothing in the page I fetched) | n/a. Cue-alongside-colour guidance not on that page. | n/a | n/a | https://design-system.service.gov.uk/styles/colour/ |
| Shopify Polaris, Fluent 2, BBC GEL, Google Workspace/Material beyond contrast | NOT VERIFIED. The Polaris fetch failed, BBC is blocked to the fetcher, and Fluent 2 returned no results. | n/a | n/a | n/a | n/a |

(B) PLATFORM MEDIA FEATURES (MDN, Baseline status)

| Feature | Values | Status | Note |
|---|---|---|---|
| `prefers-color-scheme` | light, dark | Baseline Widely available (Jan 2020) | https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme |
| `prefers-reduced-motion` | no-preference, reduce | Baseline Widely available (Jan 2020) | https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion |
| `prefers-contrast` | no-preference, more, less, custom | Baseline Widely available (May 2022) | `custom` matches the forced-colors palette. https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast |
| `forced-colors` | none, active | Baseline Widely available (Sep 2022) | Overrides `color`, `background-color`, borders, SVG fill and stroke; `box-shadow` forced to none. MDN: don't build a separate design, make small legibility tweaks only. https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors |
| `prefers-reduced-transparency` | no-preference, reduce | Limited availability, experimental | Per-browser versions not read, unverified. https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-transparency |
| `inverted-colors` | none, inverted | Limited availability | Per-browser versions not read, unverified. https://developer.mozilla.org/en-US/docs/Web/CSS/@media/inverted-colors |
| `prefers-reduced-data` | no-preference, reduce | Limited availability, experimental. MDN page contradicts itself ("not supported by any user agent"); treat as unsupported. | https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-data |

No CVD or "differentiate without colour" media query exists. CSSWG discussion:
- csswg-drafts #7406 ("prefers shapes over colours", 2022): open, labels a11y-tracker and mediaqueries-5, no resolution. Tab Atkins (who is colourblind) said it would be useful. cookiecrook objected to the "shapes" name, since non-shape cues also work, and tied it to WCAG's "don't rely on colour alone". lukewarlow opposed per-deficiency values on fingerprinting grounds, and WebKit's support for new media features depends on ongoing privacy discussions (#3488). https://github.com/w3c/csswg-drafts/issues/7406
- #10335 (`color-vision-adjustment`, May 2024): open. The only recorded action is the `mediaqueries-5` label added 2024-10-15. https://github.com/w3c/csswg-drafts/issues/10335
- Neither is in a spec. The privacy and fingerprinting objection is the blocker, so don't wait for it.

(C) RECOMMENDED MODEL

Principle: three tiers.
1. Always-on, non-colour cues. These carry the information, so WCAG holds regardless of settings: direct labels or a legend that names each series, and a data table or tooltip text.
2. Opt-in redundancy (the glyph overlay).
3. Honouring OS signals by default.

This is my synthesis, not something any source prescribes.

Axes. Introduce a runtime Preference axis, orthogonal to Level, as additional data attributes on `documentElement`. Do not add extra Levels. Primer's combined list (nine theme files, each a light/dark crossed with variant) is the failure mode to avoid: it multiplies authored sets by variants. An axis of overrides applies to both Levels, consistent with ADR 0003's "independently authored" Levels as long as each preference is expressed as deltas.

| Axis | Attribute / values | Default from OS | Effect | Decisions touched |
|---|---|---|---|---|
| `motion` | `data-a11y-motion="reduce"` or absent | `prefers-reduced-motion` | Already wired in `theme.css` via media query. Add attribute selector parity so a user override can force reduce even when the OS says nothing (Discord's pattern), and also force no-preference. | None of D1–D9, the motion tokens (ADR 0004 Medium) |
| `contrast` | `data-a11y-contrast="more"` or absent | `prefers-contrast: more`; `forced-colors` handled by the browser, not by you | Switch role tokens to stronger tints and edges, e.g. D2's `edge-strong`, D3's intent colours. Delta-only overrides, as Primer does (Primer's own files are only the changed tokens). | D1, D2, D3 (borders and fills), D9 (stronger tints) |
| `colour-vision` | `data-a11y-cvd="patterns"` or absent. Start with one value, not per-deficiency. | No OS signal on the web (see B). Optionally seed from `prefers-contrast: more`/`forced-colors` (inferred, not a CVD signal), unverified as a default. | Show glyphs and letters on categorical marks; add icons beside danger/success intent; optionally swap series hues for a CVD-safe set. | D9 (glyphs), D3 (danger is a hue-only distinction), D6–D8 unknown |
| `link-underline` | `data-a11y-links="underline"` | none | Always underline inline links (GitHub and Discord expose this; a 1.4.1 aid) | none visible in D1–D9 |
| `text-size` / `density` | not recommended now | none | GitHub, Discord, Slack expose these, but they belong on ADR 0004's Medium axis (geometry) and need a deliberate decision before runtime selection is allowed there. | Medium axis, none of D1–D9 |

Why one `patterns` value instead of protan / deutan / tritan. Per-deficiency values add authoring cost (GitHub ships two CVD themes per polarity), and glyphs help every CVD type. Palette swaps can be added later as `data-a11y-cvd="swap"`. The CSSWG #7406 thread shows the privacy case for not exposing the type to the site.

Provider and init script, mirroring ThemeProvider:
- `A11yPreferencesProvider`, `useA11yPreferences()` returning `{ motion, contrast, cvd, links, set(axis, value), reset() }`, and `getA11yInitScript({ followSystem })`.
- Keep the init script in its own non-`'use client'` module, like `themeInitScript.ts`, so server layouts can call it.
- One `localStorage` key holding JSON (e.g. `ds-a11y`), parsed in try/catch.
- Resolve before paint: stored value, else OS media query, else absent. Set only the attributes that are active (absent = default), so CSS can be `[data-a11y-cvd="patterns"] ...` with no flash.
- Provider reconciles after hydration from the attributes, as `ThemeProvider` does, and takes `persist` and `scoped` props.
- Tri-state per axis in the UI and API: `system` (default) | `on` | `off`, so users can override the OS in either direction. GitHub's animated-image setting (Sync / Enabled / Disabled) and Discord's reduced-motion toggle are the precedents.
- Do not put the preference into the Level or its class list.

Persistence: per-device `localStorage` by default, because the design system has no account concept. Expose an `onChange` hook or a pluggable `storage` adapter so account-backed sites (GitHub-style) can sync. Linear stores per platform and does not sync, so per-device alone is an accepted precedent.

Menu UI: an "Accessibility" popover or menu placed beside the theme picker, with one tri-state row per axis, plus a "reset to system" action. GitHub puts these under Settings > Accessibility, but a design system's menu next to the picker keeps it one click away on sites without settings pages. Placement preference is a product call.

Testing: add a walkthrough/contrast matrix dimension for `{Level} x {contrast: on/off} x {cvd: on/off}` per the existing "contrast gate" pattern (my suggestion; I did not inspect the gate script).

(D) WCAG 1.4.1 VERDICT: opt-in glyphs

- SC text: "Color is not used as the only visual means of conveying information, indicating an action, prompting a response, or distinguishing a visual element." Understanding doc: "This criterion requires a visible alternative to color."
- The Understanding page is silent on default-versus-selectable. It never uses the word "mechanism" in this context.
- So the answer depends on the general conformance rules, per the Understanding Conformance page. CR1: "or a conforming alternate version is provided." Definition requires the alternate to be reachable "from the non-conforming page via an accessibility-supported mechanism". And: "Setting user preferences within the content to produce a conforming version is an acceptable mechanism for reaching another version as long as the method used to set the preferences is accessibility supported."
- Verdict: opt-in glyphs are technically compatible only via that alternate-version route. In practice it is fragile.
  - The default view must be treated as the non-conforming page, and the preference control itself must be keyboard and screen-reader accessible and findable.
  - A CVD user who has never opened the menu gets a page that fails 1.4.1 on first view.
  - Color-vision-deficient users don't generally know to look.
- Safe design: make something non-colour always present for each categorical distinction (direct label, legend text naming the series, or a data table; note "legend with labels" counts as text), and make glyphs a redundancy. If a chart distinguishes series only by hue by default and relies on the toggle, treat it as a 1.4.1 failure risk. This is my interpretation of the sources above, not a W3C statement.
- Not verified: the glossary text of "conforming alternate version" in WCAG 2.2 itself; I got it via the Understanding page.

BIBLIOGRAPHY (all accessed 2026-10-15)
- https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html
- https://www.w3.org/WAI/WCAG22/Understanding/conformance
- https://www.w3.org/TR/WCAG22/ (glossary text not retrieved)
- https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme ; /prefers-reduced-motion ; /prefers-contrast ; /forced-colors ; /prefers-reduced-transparency ; /inverted-colors ; /prefers-reduced-data
- https://github.com/w3c/csswg-drafts/issues/7406 ; https://github.com/w3c/csswg-drafts/issues/10335 ; https://lists.w3.org/Archives/Public/public-css-archive/2024May/0335.html
- https://docs.github.com/en/get-started/accessibility/managing-your-theme-settings
- https://docs.github.com/en/account-and-profile/how-tos/account-settings/managing-accessibility-settings
- https://github.blog/changelog/2022-04-19-protanopia-deuteranopia-colorblind-themes-beta/ ; https://github.blog/changelog/2022-04-19-tritanopia-colorblind-theme-beta
- https://github.com/primer/primitives ; https://primer.style/product/getting-started/react/theming/ ; https://primer.style/product/getting-started/react/theme-reference/ ; https://primer.style/foundations/color/overview
- https://discord.com/blog/improving-app-accessibility-a11y-updates
- https://slack.com/intl/en-ie/accessibility
- https://developer.atlassian.com/cloud/jira/platform/connect-theming/ ; https://atlassian.design/components/tokens/all-tokens
- https://code.visualstudio.com/docs/configure/accessibility/accessibility
- https://spectrum.adobe.com/page/color-system/
- https://design-system.service.gov.uk/styles/colour/
- Search-snippet-only (unverified): Teams, Figma, Linear, Gmail, Material 3 contrast, Apple Differentiate Without Color URLs listed in table A.

NOT FOUND / UNVERIFIED
- Primer's method for CVD themes (swap vs. patterns) and its attribute names beyond a page fragment. Primer repo's raw override file returned 404.
- Whether GitHub's accessibility settings sync to the account.
- Per-browser versions for `prefers-reduced-transparency`, `inverted-colors`, `prefers-reduced-data`.
- Material 3 contrast ratios, Fluent 2 and Polaris token models, BBC GEL, Google Workspace, Gmail (official).
- D6–D8 content and the contrast gate script (not read).
