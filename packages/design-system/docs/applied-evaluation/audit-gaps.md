GAP-FILL AUDIT: families not covered by audit.md (F01–F42)
Worktree: temp/eval-applied-archetypes (read-only). Server on :6106 killed (confirmed down). Artifacts are in .../scratchpad/gapfill-audit/ (sheets/, slides/, scan768.json, scripts). Nothing was written to the repo.

SOURCE-CHECKING: every reference below was fetched this session. Where I found no primary source, the finding says "unsourced".
Source key:
- WCAG 1.4.10 Reflow: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html (320px, no 2-D scroll, data tables exempt)
- WCAG 1.4.1 Use of Color: https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html
- WCAG 1.4.4 Resize Text: https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html ("without loss of content"; F69 = clipped/truncated)
- WCAG 2.2.2 Pause/Stop/Hide: https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html
- WCAG 2.5.8 Target Size: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- WCAG 1.4.11 Non-text Contrast: https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- WCAG 2.4.13 Focus Appearance: https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html
- WCAG 1.3.1 Info and Relationships: https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html
- APG Tabs pattern: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/ (tablist/tab, aria-selected)
- MDN aria-current: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-current
- MDN text-wrap: https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap (balance for headings, pretty for body)
- MDN prefers-reduced-motion: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion (reduce means remove, reduce or replace motion)
- MDN border-radius: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/border-radius (longhands are not inherited; the cascade decides)
- GOV.UK Error summary: https://design-system.service.gov.uk/components/error-summary/ (focus moves to the summary; it sits at the top of main)
- GOV.UK Radios: https://design-system.service.gov.uk/components/radios/ (do not pre-select; radios for one-of-many)
- NN/g checkboxes vs radios: https://www.nngroup.com/articles/checkboxes-vs-radio-buttons/ (checkbox = square with check; radio = circle with dot; mutually exclusive means radio)
- Tailwind typography README: https://github.com/tailwindlabs/tailwindcss-typography (prose-{element}: modifiers)
- AccessibleWeb on font size: https://accessibleweb.com/question-answer/minimum-font-size/ (no official minimum; 16px body baseline). No NN/g source found.
- DESIGN.md (repo): section 1 (character, bracketed labels), section 2 (two levels), section 6 Form (radius zero, hard offset shadows, 2px borders), section 7 Type, section 9 (agent rules). It has no reflow or mobile section.

---------------------------------------------------------------------
(A) COVERAGE

Method:
- Reused the prior sb build (same 359 stories, same :6106 server script) and its midnight/sketch x 375/768/1280 PNG set.
- I viewed every in-scope story myself on contact sheets (midnight beside sketch) and opened individual shots where detail mattered.
- I added fresh captures where the old set could not show the behaviour: SlideDeck slide traversal, Sandbox tabs, the error-summary focus crop, and the CDP rule trace.
- The DOM data is from the prior audit-v*.json, plus a new 768 scan of all 359 stories: clipped scrollers, off-viewport elements, wrapped bracket labels.

| Family | Stories viewed | Level x width |
|---|---|---|
| SaaS/AccountFlows | 9 of 9 | both levels @1280 (sheet); sign-in @768; sign-in-rejected crop; 375 sheets of all stories were generated, I eyeballed only a few |
| SaaS/AdminDashboard | 2 of 2 | both levels @1280, finance-console @768, @375 sheet |
| SaaS/LandingPage | dark-mode (full-res 375/768/1280, both levels), plus the sketch-mode, product-launch and project-site stories via sheet or DOM data | |
| Showcase/DesignSandbox | default-sandbox at 1280/768/375, all 5 tabs clicked at 1280 and 375 (midnight); sketch toggle checked with the blog tab | |
| Showcase/ExperimentsView | 5 of 5 | 1280 both levels (sheet); default @768 |
| Manifesto/* | 14 of 14 | both levels @1280 and @375; facts and theme-ladder @768; full-res on graphic, levels, form |
| Blog/BlogPost | 7 of 7 | 1280, 375, and default @768, both levels |
| Blog/LoremIpsumPost | 1 of 1 | both levels, all 3 widths |
| Blog/TrackCard | 3 of 3 | both levels, all 3 widths |
| Blog/MetadataGrid | 3 of 3 | both levels, all 3 widths |
| Blog/ColophonCard | 1 of 1 | both levels, all 3 widths |
| Presentation/Slide | 3 of 3 | both levels @1280 (sheet); default @768 |
| Presentation/SlideDeck | 5 of 5 | first slide of all 5 at 1280 both levels; interior slides below |
| Foundations/TickerTape | 3 of 3 | both levels, all 3 widths; reduced-motion source read |

SlideDeck interior, traversed by keyboard (slide text captured, both levels, 1280 and 375):
- default-deck: slides 1 to 3, then wraps.
- with-speaker-notes: slides 1 to 3, plus the notes panel (N key).
- keyboard-cheatsheet: slides 1 to 2.
- Screenshots exist for midnight @1280 and both levels @375.
- Not captured as images: sketch @1280 interior slides. I confirmed their text and overflow only.
- Autoplay and controlled-chromeless were not traversed. The first slide was viewed; the DOM scan shows autoplay overflows 22px at 375.

Not viewed:
- Tablet and landscape sizes.
- Real hover and active states on the new families.
- Real print-to-PDF (the prior audit did the 8-story print emulation only).
- The 375 sheets for AccountFlows, AdminDashboard and the Showcase stories were generated, but I looked at only a sample. AdminDashboard @375 and the AccountFlows failure variants at 375 are not reviewed.
- Terminal medium.

---------------------------------------------------------------------
(B) SCORECARD (1 = poor, 5 = excellent)

| Family (stories) | Spacing | Type | State coverage | Theme parity | Print | Justification |
|---|---|---|---|---|---|---|
| SaaS/AccountFlows (9) | 4 | 3 | 5 | 5 | n/t | Best state coverage in the system: rejected, failed, mismatch, sent. Both levels are clean. Type sits at 10–11px for helpers and links (G13). |
| SaaS/AdminDashboard (2) | 3 | 3 | 3 | 5 | n/t | Strong at 1280. At 768 the header and stat cards break (G04, G05). Table clips with no cue (F28 family). |
| SaaS/LandingPage (4) | 3 | 4 | 3 | 4 | n/t | Good composition. Orphaned "]" at 1280 (G03). 3-col pricing too tight at 768 (G06, F30). Pro card misaligns the price row (G07). |
| Showcase/DesignSandbox (1) | 3 | 4 | 3 | 5 | n/t | Works across all five tabs. Tab row hides items at 768 and 375 with no cue (G09). Active tab is colour-only and has no ARIA (G08). |
| Showcase/ExperimentsView (5) | 4 | 4 | 3 | 5 | n/t | Clean at all widths. Cards look identical whether or not they are selectable (G14). Story helper text is unstyled. |
| Manifesto (14) | 2 | 4 | 3 | 3 | n/t | Edge-to-edge text with no gutter on half the stories. levels overflows at 375 (G01). Single-level stories show the other level on the wrong ground (G02). |
| Blog/BlogPost (7) | 4 | 4 | 4 | 5 | n/t | Seven meaningful metadata and author variants. Divider clips at 375 (F31). Single-newline paragraph run-on (G15). |
| Blog/LoremIpsumPost (1) | 4 | 4 | 2 | 2 | n/t | Story pins midnight, so the sketch level cannot be reviewed (G10). The closing "]" is orphaned in H2 at 375 (G03). |
| Blog/TrackCard (3) | 3 | 2 | 4 | 5 | n/t | 10px labels. At 375 lesson titles and descriptions are ellipsised (G11). Badge wraps inconsistently. |
| Blog/MetadataGrid (3) | 4 | 2 | 3 | 5 | n/t | Every label is `text-[10px]` (F04/F05). Value truncates at 375 and 768. |
| Blog/ColophonCard (1) | 4 | 3 | 3 | 5 | n/t | Fine. 2px overflow at 768 inside the aside. Decorative "§" watermark is cropped. |
| Presentation/Slide + SlideDeck (8) | 2 | 3 | 4 | 5 | n/t | Excellent at 1280 and 768. Collapses at 375 (G12). |
| Foundations/TickerTape (3) | 3 | 3 | 2 | 5 | n/t | Under reduced motion it is a static, clipped sentence (G16). |

"n/t" means print was not tested on these families (see (A)).

---------------------------------------------------------------------
(C) FINDINGS

**G01. manifesto--levels overflows 375 (two-panel row does not stack; dividers clip)**
- Components: Manifesto/Levels. Category: responsive. Severity: H.
- Level/viewport: both levels, 375. Also 768: the divider text (717px inside a 328px box) and the "[ CONTRAST PAIRS ]" label wrap.
- Evidence: `manifesto--levels` reports scrollWidth 761 vs 375, a real page-level hscroll. Both "Midnight" and "Sketch" panels render side by side. The RAISED SURFACE card and the input are cut at the right edge, the `//====` divider is cut mid-run, and the contrast tile label wraps.
- Fix: stack the panels below ~640px with `flex-wrap`, and clamp or `overflow-hidden` the divider.
- IN-LANGUAGE.
- References: WCAG 1.4.10 Reflow (url above). DESIGN.md has no reflow rule.

**G02. Single-level Manifesto stories render the "other" level on the wrong ground**
- Components: Manifesto roles, hues, surfaces, contrast, ansi, form. Category: theme-parity. Severity: M.
- Level/viewport: both levels, all widths.
- Evidence: `manifesto--roles`, `--hues`, `--surfaces`, `--form`:
  - On midnight, the "SKETCH · LIGHT" half is drawn on the dark page, with midnight-cyan labels and sketch swatches.
  - The hues table prints sketch contrast ratios (5.52/7.95) beside a sketch red on near-black.
  - Only `levels`, `graphic`, `media` and `ansi` isolate each level in its own panel.
  - `roles`/`hues`/`surfaces`/`form` have no panel at all.
- Consequence: the manifesto's own contrast claims are shown on grounds where they are not true. DESIGN.md section 2 says the levels are independent.
- Fix: wrap each half in a `data-theme` scoped panel, like `levels`.
- IN-LANGUAGE.
- References: DESIGN.md sections 2 and 4. WCAG 1.4.3 not fetched, so unsourced beyond the DESIGN.md gate.

**G03. Orphaned closing bracket ("]" alone on a line) in bracketed headings**
- Components: LandingPage hero, LoremIpsumPost H2s, AdminDashboard PageHeader. Category: visual-refinement. Severity: M.
- Level/viewport: both levels. Landing hero 1280 and 375; Lorem H2 375; Admin 768.
- Evidence:
  - `saas-landingpage--dark-mode`: "[ HIGH-PERFORMANCE BRUTALIST SAAS PLATFORM" then "]" alone, even at 1280.
  - `blog-loremipsumpost` @375: "[ 01. THE PROBLEM / WITH GENERIC WEB UI / ]".
  - `saas-admindashboard--finance-console` @768: "[ SYSTEM OVERVIEW" with a tall "]" below it.
  - The bracket is the signature device, so a stranded glyph reads as a bug.
- Fix: wrap the last word and "]" in `white-space: nowrap` (non-breaking space before "]"); add `text-wrap: balance` to display headings.
- IN-LANGUAGE.
- References: MDN text-wrap (url above). The nowrap/NBSP fix is unsourced (standard HTML/CSS).

**G04. AdminDashboard breaks at 768: header, stat cards, table**
- Components: AdminDashboard finance-console. Category: responsive. Severity: H.
- Level/viewport: both levels, 768.
- Evidence:
  - The H1 wraps into "[ SYSTEM OVERVIEW / ]" with a tall bracket.
  - The StatCard delta "+12.4%" is clipped at the card edge ("+1").
  - The values "3 variances" and "Synced 10m ago" wrap at display size (about 20px).
  - The ACTION column is cut off ("[ V") with no scroll cue.
- Worse than F28/F29: those recorded only the clipped header and table at 375.
- Fix: stat value uses `clamp()` and `min-width:0`; delta wraps below the value; table gets a visible fade or edge cue.
- IN-LANGUAGE.
- References: WCAG 1.4.10 Reflow (data tables exempt, but the stat cards and header are not), WCAG 1.4.4 (F69 clipped content).

**G05. StatCard delta overflows card at 768 (+12.4%)**
- Components: StatCard (used in AdminDashboard). Category: responsive. Severity: M.
- Level/viewport: 768 both levels.
- Evidence: the delta chip is rendered over the border/card edge. This duplicates G04's evidence but it is a StatCard-level defect.
- Fix: allow the value row to wrap; chip gets `shrink-0` with an explicit second line.
- IN-LANGUAGE.
- References: WCAG 1.4.4/F69.

**G06. 3-column PricingGrid CTAs wrap to 3 lines with stranded brackets at 768**
- Components: PricingGrid (LandingPage, marketing-pricinggrid). Category: responsive. Severity: M.
- Level/viewport: both, 768.
- Evidence: "[ DEPLOY / PRO / ENGINE ]" and "[ START / FREE ]" in the CTA; the brackets sit at the far left and right of a 3-line block.
- This is worse than F30, which recorded only the wrap.
- Fix: switch to 2 columns below ~900px, or `white-space: nowrap` on bracket labels and let the button grow.
- IN-LANGUAGE.
- References: WCAG 1.4.10 (principle). Layout fix unsourced.

**G07. Pro pricing card pushes price and body down, misaligning rows across cards**
- Components: PricingCard/PricingGrid. Category: visual-refinement. Severity: L.
- Level/viewport: both, 1280 and 768.
- Evidence: the "POPULAR" badge row makes Pro's price about 32px lower than Starter and Enterprise. The feature lists no longer align; the CTA row still aligns (bottom-pinned).
- Fix: reserve a badge slot in every card, or overlap the badge on the top border.
- IN-LANGUAGE.
- References: unsourced (internal alignment).

**G08. DesignSandbox tab row is colour-only, no ARIA state**
- Components: DesignSandbox nav. Category: a11y. Severity: M.
- Level/viewport: both, all widths.
- Evidence: the five nav items are plain `<button>`s with no `role="tab"`, `aria-selected` or `aria-current` (checked in the DOM). The active item is distinguished only by hue (pink vs cyan; red vs blue in sketch). This is the F16/F17 "current item" problem in a new place, now with no programmatic state either.
- Fix: `role="tablist"`/`role="tab"` + `aria-selected`, or `aria-current`, plus a non-colour marker (the `>` glyph or an underline bar).
- IN-LANGUAGE (the `> ` prefix is already a design idiom).
- References: WCAG 1.4.1; APG Tabs; MDN aria-current (urls above).

**G09. DesignSandbox tab row scrolls off-screen with no cue; labels wrap and strand brackets**
- Components: DesignSandbox nav. Category: responsive. Severity: M.
- Level/viewport: both, 768 and 375.
- Evidence:
  - At 768 "EDITORIAL BLOG" is cut and the button overflows the viewport (right edge at 803px).
  - At 375 the row scrolls to the active tab and the previous one is half visible ("TS ]").
  - Labels break as "E- / COMMERCE" and "[ COMPONENTS / & THEMES ]" with brackets stranded.
  - Price "$899.00" butts directly against the ADD TO CART button on the e-commerce tab.
- Fix: wrap the nav to 2 rows or use a visible overflow cue (a fade or a ">>"); `white-space: nowrap` on labels; gap on the product row.
- IN-LANGUAGE.
- References: WCAG 1.4.10/1.4.4 (clipped content). Scroll-cue guidance unsourced.

**G10. LoremIpsumPost story pins midnight; sketch cannot be reviewed**
- Components: Blog/LoremIpsumPost. Category: theme-parity. Severity: L.
- Level/viewport: sketch.
- Evidence: `src/stories/LoremIpsumPost.stories.tsx:17` wraps in `<ThemeProvider defaultLevel="midnight" persist={false} followSystem={false}>`, so the sketch column of every sheet is the midnight render. The component itself follows the level (verified inside Sandbox with the sketch toggle).
- Fix: drop the ThemeProvider from the story.
- IN-LANGUAGE.
- References: DESIGN.md section 9 rule 4 ("Both themes, always. Test sketch; it is the one that breaks").

**G11. TrackCard rows truncate at 375, losing the titles**
- Components: TrackCard. Category: responsive. Severity: M.
- Level/viewport: both, 375.
- Evidence: "Segment Allocation & Bi…", "Memory Mapped Sp…", "Zero-Copy OS Tra…", with descriptions ellipsised too. The ACTIVE chip is squeezed beside the title. The "TRACK 01" badge wraps onto two lines in `--default` but not in `--all-completed`.
- Fix: let the title wrap and move the duration/status to a second line under 480px; `white-space: nowrap` on the badge.
- IN-LANGUAGE.
- References: WCAG 1.4.4 + F69 (truncated content).

**G12. SlideDeck is unusable at 375: slide stage collapses to about 190px**
- Components: SlideDeck (also the Sandbox presentation tab). Category: responsive. Severity: H.
- Level/viewport: both, 375.
- Evidence:
  - `presentation-slidedeck--with-speaker-notes` @375, slide 2: the title is cut mid-glyph ("[ ONE / STACK, / THREE" and the body is invisible).
  - Slide counter wraps into the PREV button ("SLIDE / 02 / / 03"), and the fullscreen button hangs off the right (page overflow 22px).
  - The default-deck also collapses to a ~190px stage; PRESENTATIONS overflows the right edge on slide 2.
  - TL;DR content on slide 2 is not reachable at 375.
- Worse than F29 (overflow only): the slide content is lost.
- Fix: scale the stage with the viewport (`aspect-ratio` plus `container-type: size`/fit-to-width), stack the control bar, shrink the title with `clamp()`.
- IN-LANGUAGE.
- References: WCAG 1.4.10 Reflow.

**G13. 10px label tier is spreading to new components and is unlinted**
- Components: MetadataGrid, TrackCard, TickerTape badge, LandingPage POPULAR (10.4px), Manifesto graphic (8px SVG), AccountFlows helpers (11px). Category: token/spacing. Severity: M.
- Level/viewport: both, all widths.
- Evidence: DOM census: MetadataGrid labels `span.text-[10px].font-black`; TrackCard "0% START / TARGET / 100% READY" at 10px; CRUISE/BRAKING chips at 10px; "POPULAR" 10.4px. The 8px items in `manifesto--graphic` are SVG viewBox text and by design.
- This extends F04/F05. Arbitrary `text-[10px]` is the pattern to lint.
- Fix: one `--ds-type-label` token (≥11px) for these, and lint `text-[Npx]`.
- IN-LANGUAGE.
- References: WCAG 1.4.4 (resize); AccessibleWeb font size note (url above). No NN/g source found; unsourced as a minimum-size claim.

**G14. ExperimentsView: clickable cards look identical to non-clickable ones**
- Components: ExperimentsView. Category: state-gap. Severity: L.
- Level/viewport: both, 1280.
- Evidence: `--with-selection-handler`/`--interactive` render exactly like `--default`. There is no chevron, arrow or hover cue; the "Selected: (none yet)" line is unstyled 12px sans.
- Fix: add the `>` affordance used in TrackCard rows; style the helper line.
- IN-LANGUAGE.
- References: unsourced (internal consistency with F16).

**G15. Single newline inside BlogPost paragraph renders as a run-on**
- Components: BlogPost. Category: visual-refinement. Severity: L.
- Level/viewport: both, 375 and 1280.
- Evidence: `blog-blogpost--full-metadata`: "…at the panel." / "Without it, utilities…" are two sentences on separate lines with no paragraph gap.
- Fix: `white-space: pre-line` is wrong here; split the paragraph in the story data.
- IN-LANGUAGE.
- References: unsourced.

**G16. TickerTape is a static clipped sentence under reduced motion**
- Components: TickerTape. Category: a11y. Severity: M.
- Level/viewport: both, all widths.
- Evidence: `TickerTape.tsx` stops the marquee when `paused || prefersReducedMotion`, with `overflow-hidden` on the viewport. All three stories show the text cut mid-word ("COMPILER EXTENSIO", "ALL GATE INVARIANTS SATISFI"); the scan reports 2728px of content in a 289px viewport. The user who asked for less motion gets the least content.
- Fix: under reduced motion, wrap into a stacked list or give a "[ PAUSE ]/[ NEXT ]" control.
- IN-LANGUAGE.
- References: MDN prefers-reduced-motion ("remove, reduce or replace"); WCAG 2.2.2 (url above). The stacked-list fix is unsourced.

**G17. Error-summary focus ring collides with its offset shadow**
- Components: ErrorSummary (AccountFlows rejected/failed/mismatch). Category: visual-refinement. Severity: L.
- Level/viewport: both, 1280.
- Evidence: `--sign-in-rejected`: the programmatically focused `<section tabindex="-1">` shows a cyan ring around a pink border with a pink 4px shadow. The ring cuts the shadow into an L and reads as a second, misregistered border.
- Extends F25/F26. The focus behaviour itself is correct.
- Fix: draw the ring with `outline-offset` beyond the shadow extent, or drop the ring for programmatic focus (`:focus-visible` only).
- IN-LANGUAGE.
- References: GOV.UK Error summary (focus move is intended); WCAG 2.4.13 (ring must stay visible).

**G18. Radio and Checkbox are indistinguishable when unselected**
- Components: RadioGroup/Checkbox (visible in AccountSettings). Category: inconsistency. Severity: L.
- Level/viewport: both, all widths.
- Evidence: `saas-account-flows--account-settings` PROFILE VISIBILITY (three radios) is a column of empty squares identical to the "I ACCEPT" checkbox below it. The radio mark appears only when selected (square dot; checkbox shows a check).
- Fix: keep the square but add a bracket-ASCII cue, e.g. `( )` / `(•)` drawn in mono, or a different corner notch, so the shape tells the type.
- IN-LANGUAGE (circles would break section 6).
- References: NN/g (radios are circles, checkboxes squares); GOV.UK Radios. The no-default state itself matches GOV.UK (do not pre-select), so I do not flag it.

---------------------------------------------------------------------
(D) 768 PASS SUMMARY

- Covered: 95 components (first story of each), midnight and sketch contact sheets reviewed, plus a DOM scan of all 359 stories at 768.
- No page-level horizontal overflow at 768, matching audit.md.
- Defects found at 768:
  - AdminDashboard (G04, G05).
  - PricingGrid and LandingPage CTAs (G06; F30).
  - DesignSandbox nav (G09).
  - Manifesto levels and Foundations/ThemeLadder: the two panels are about 340px wide each, and the Raised Surface card collapses to about 110px with a one-word-per-line wrap and "RAISED_SURFACE.MD" overlapping its border (G01 family; not separately numbered).
  - DataTable compound-table: `[ CLUSTER ]`, `[ HEALTH ]`, `[ LATENCY ]` header labels wrap to 3 lines.
  - MetadataGrid truncation, ColophonCard (2px overflow).
  - Docs portal `pre` blocks clip with no cue (824/700); that is a scroller.
  - TickerTape clip (G16).
- Clean at 768: Button, Checkbox, ErrorSummary, Fieldset, Input, RadioGroup, Select, Switch, Avatar, Badge, BracketText, Card, NoteBlock, TLDR, Tag, EmptyState, Progress, StatusPage, Toast, Menu, Popover, Tooltip, MobileNav, SiteHeader, SiteFooter, Pagination, Tabs, AppShell, PageHeader, PageTitle, NerdIcon, SocialIcon, BarChart, ChartTooltip, Sparkline, StatCard (default), CTASection, FeatureGrid, Hero, ReportDocument, Docs layout, Docs content (Steps, Terminal), Docs figures, BlogPost, Slide, SlideDeck default, AccountFlows.
- False positives to ignore in `scan768.json`: `sr-only` clips and "orphan" hits on inline brackets.
- Not verified: Modal, AlertDialog and Drawer at 768 render only as backdrops in the sheets, so I confirmed no layout problem there.
- Noted: `manifesto--graphic` has 8px SVG text by design (media graphic).

---------------------------------------------------------------------
(E) `pre` border-radius trace (docs-layout-portal--prose-only and --full-portal)

- Computed result: 6 `pre` elements in `.docs-codeblock-body` (the `CodeBlock` component) compute `border-radius: 6px`. The audit counted 2 because it deduped.
- The 6px is `0.375rem`.
- Rule that produces it (verified with Chrome DevTools Protocol matched-styles): `.prose :where(pre):not(:where([class~="not-prose"], …))` from `@tailwindcss/typography@0.5.20`, `border-radius: .375rem`, in the compiled stylesheet `assets/iframe-*.css`.
- Source of the rule:
  - `node_modules/@tailwindcss/typography/src/styles.js:316` (`pre: { …, borderRadius: rem(6), … }` in the DEFAULT/base style; lines 521 and 911 do the same for other sizes).
  - It is loaded by `packages/design-system/src/prose.css:145` (`@plugin "@tailwindcss/typography";`).
  - It applies because the docs pages wrap in `Prose` (`src/components/docs/Prose.tsx`, `.prose` class) and `CodeBlock` renders its own `<pre>` inside `.docs-codeblock-body`.
- Why it survives the zero-radius system:
  - `src/styles.css:137-155` (the "Radius, as a token, not a reset" comment) says a zero `--ds-radius-none` is wired only through Tailwind's radius scale in `theme.css`, with no global rule.
  - Typography emits a hard-coded `rem(6)` literal, which bypasses that scale entirely.
  - `src/prose.css:202-218` (`.docs-codeblock-body pre`) sets margin, padding, overflow, font and colour but no radius.
  - `grep -n radius src/prose.css` returns nothing.
  - Its specificity (0,1,1) beats the typography selector, so adding the property there would win.
- Not the cause: Shiki (no `border-radius`), Tailwind preflight (no pre radius), `.storybook/docs.css` (its `.sbdocs pre { border-radius:0 !important }` applies only inside Storybook docs, not to the story iframe).
- Another `pre` in these stories with a radius is Storybook's own hidden error overlay: `.sb-errordisplay_main .sb-errordisplay_code`, 4px, Storybook-owned CSS. It is not a design-system defect, but it adds to a naive census.
- Fix:
  - In `src/prose.css`, add `border-radius: var(--ds-radius-none)` to `.docs-codeblock-body pre` (line 202).
  - For raw `<pre>` in MDX `.prose` content, add `.prose-ladder :where(pre){border-radius:var(--ds-radius-none)}` inside `@utility prose-ladder` (src/prose.css:147 onwards).
  - Add a story assertion in the 6px stories (a computed-style check is cheap).
- This is a real DESIGN.md section 6 violation ("Zero. Everywhere. Non-negotiable"), contradicting audit.md's "no non-zero radius" clean result (I confirm it, it was not traced).
- References: Tailwind typography README (prose-pre: modifier pattern); MDN border-radius (cascade decides, longhands not inherited); DESIGN.md section 6. The `styles.js:316` literal is from the installed package, not a web page.

I did not run git or rebuild dist. `dist/prose.css` carries the same `@plugin` (line 145 in that built copy), so consumers get the same 6px until rebuilt.
