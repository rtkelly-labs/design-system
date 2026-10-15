# Accessibility preferences: how others do it

Researched 2026-10-15 for decision D9. The model it led to is ADR 0007, which cites section D below.

## Headline findings
- No product we could verify ships "glyphs only when asked". GitHub is the only one with real CVD modes, and it does them as separate themes (palette swaps), chosen in account settings. Apple is the one platform with an OS-level "differentiate without colour" signal. The web has no equivalent.
- OS-driven signals plus an in-app override is the dominant pattern: GitHub, Discord and Teams all do it.
- WCAG 1.4.1 does not forbid opt-in cues in the text of the criterion, but it only permits them through the "conforming alternate version" route. That route is fragile for a default-colour-only chart (see D).

## (A) Comparison

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
| Apple platforms | Increase Contrast, Reduce Motion, Differentiate Without Color are OS settings that apps read | "Differentiate Without Color" is an OS signal that tells the app to add shapes/glyphs. The closest precedent for opt-in glyphs. | OS, per device | Apps are expected to honour it | https://developer.apple.com/tutorials/data/documentation/appkit/nsworkspace/accessibilitydisplayshoulddifferentiatewithoutcolor.md ; https://developer.apple.com/help/app-store-connect/manage-app-accessibility/differentiate-without-color-alone-evaluation-criteria (search snippets) |
| Adobe Spectrum | Light and dark themes only | No setting. Guidance: don't use colour alone; pair with a label or icon; two-tone pairs "not colour vision deficiency safe". | n/a | n/a | https://spectrum.adobe.com/page/color-system/ |
| GOV.UK | No user-selectable themes | n/a. Cue-alongside-colour guidance not on that page. | n/a | n/a | https://design-system.service.gov.uk/styles/colour/ |
| Shopify Polaris, Fluent 2, BBC GEL, Google Workspace/Material beyond contrast | NOT VERIFIED. The Polaris fetch failed, BBC is blocked to the fetcher, and Fluent 2 returned no results. | n/a | n/a | n/a | n/a |

## (B) Platform media features

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

## (D) WCAG 1.4.1: opt-in glyphs

- SC text: "Color is not used as the only visual means of conveying information, indicating an action, prompting a response, or distinguishing a visual element." Understanding doc: "This criterion requires a visible alternative to color."
- The Understanding page is silent on default-versus-selectable. It never uses the word "mechanism" in this context.
- So the answer depends on the general conformance rules, per the Understanding Conformance page. CR1: "or a conforming alternate version is provided." Definition requires the alternate to be reachable "from the non-conforming page via an accessibility-supported mechanism". And: "Setting user preferences within the content to produce a conforming version is an acceptable mechanism for reaching another version as long as the method used to set the preferences is accessibility supported."
- Verdict: opt-in glyphs are technically compatible only via that alternate-version route. In practice it is fragile.
  - The default view must be treated as the non-conforming page, and the preference control itself must be keyboard and screen-reader accessible and findable.
  - A CVD user who has never opened the menu gets a page that fails 1.4.1 on first view.
  - Color-vision-deficient users don't generally know to look.
- Safe design: make something non-colour always present for each categorical distinction (direct label, legend text naming the series, or a data table; note "legend with labels" counts as text), and make glyphs a redundancy. If a chart distinguishes series only by hue by default and relies on the toggle, treat it as a 1.4.1 failure risk. This is an interpretation, not a W3C statement.
- Not verified: the glossary text of "conforming alternate version" in WCAG 2.2 itself; taken from the Understanding page.

## Sources (accessed 2026-10-15)
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

## Not verified
- Primer's method for CVD themes (swap vs. patterns) and its attribute names beyond a page fragment. Primer repo's raw override file returned 404.
- Whether GitHub's accessibility settings sync to the account.
- Per-browser versions for `prefers-reduced-transparency`, `inverted-colors`, `prefers-reduced-data`.
- Material 3 contrast ratios, Fluent 2 and Polaris token models, BBC GEL, Google Workspace, Gmail (official).
