# Settings & forms suite: evaluation findings

Note: writing FINDINGS.md was refused by the harness ("subagents should return findings as text"), so this message is the whole report. Evidence is in /private/tmp/claude-501/-Users-ryankelly-code-personal/bf919a17-fd46-452f-9827-41b743b650ae/scratchpad/settings/ (m-* midnight, s-* sketch, print-*.pdf).

Archetype: GitHub repository settings + Stripe developer settings.

## (A) What was built

All files are under /Users/ryankelly/code/personal/design-system/temp/eval-applied-archetypes/apps/site/src/examples/settings/. There are no other repo writes.

| File | What |
|---|---|
| repository-settings.tsx | Full-page suite (default export). AppShell + AppSidebarNav rail (General / Features & merging / Keys & webhooks / Danger zone). One lifted form state spans General and Features. Uses Fieldset, Input, TextArea with counter, Select, RadioGroup with per-option helper, Switch rows, Checkbox group with a group-level error, NoteBlock, ErrorSummary (`key={attempt}` refocus), a dirty-count save bar, and Toast on save. |
| api-keys.tsx | Stripe-shaped developer settings, also exported as `ApiKeys`. Tabs (API keys / Webhooks); Table with masked key, reveal, copy, and roll via AlertDialog; create-key form with ErrorSummary. |
| danger-zone.tsx | GitHub-shaped danger zone, also exported as `DangerZone`. Archive, transfer and delete; delete is gated by typing the name, using the AlertDialog `footer` slot. |
| parts.tsx | Hand-rolled helpers the package lacks: SaveBar, CopyButton, SettingRow, SectionHead. Each maps to a finding below. |

Registry lines for apps/site/src/examples/index.ts (I did not edit it):
```ts
import SettingsApiKeys from './settings/api-keys';
import SettingsDangerZone from './settings/danger-zone';
import SettingsRepositorySettings from './settings/repository-settings';
// in EXAMPLES:
  'settings/api-keys.tsx': SettingsApiKeys,
  'settings/danger-zone.tsx': SettingsDangerZone,
  'settings/repository-settings.tsx': SettingsRepositorySettings,
```
parts.tsx is deliberately not registered. repository-settings.tsx is a whole bordered AppShell page (min-h 640), so it suits a sample page (`src/samples`) better than a component-page figure.

Gates:
- `check:tokens` reports 0 offenders.
- `eslint --max-warnings 0 src/examples/settings` is clean, including jsx-a11y.
- `tsc --noEmit` has no errors in examples/settings. The 2 remaining errors come from `src/generated`, which is not generated yet (not in my files).
- I added no dependencies and import only from `@rtkelly13/design-system`.
- All data is literal; dates are written as strings.

Test harness: I could not mount a route without editing index.ts or src/app. I ran a scratch Next app outside the repo (scratchpad/settings/harness). It symlinks apps/site/node_modules and src/examples, uses basePath /site on port 3103, and wraps the page in the same ThemeProvider, ToastProvider and styles.css. Nothing for it exists in the tree. The dev server died once mid-run and I restarted it. Harness-only axe hits (document title, h1, duplicate `<main>`) are excluded below.

## (B) Per-format results

| Format | Result | Notes |
|---|---|---|
| Midnight, 1280 | Pass, good | Dense and readable, with strong label/field rhythm. Issues: SET-03, 07, 08, 12, 14. |
| Sketch, 1280 | Pass, good | The better long-form reading surface. Sketch accents go red/green/blue and expose SET-01. |
| 768 | Forms pass; table degrades | Rail collapses to a hamburger drawer. The actions column stacks to 3 buttons per row. |
| 375 | Forms pass; **Table fails (SET-04)** | Fields, switches, checkboxes, radios and helper text are fine. The save bar wraps to 2 rows. The drawer works and marks the current item with `aria-current`. |
| Keyboard | Pass | Tab order is rail, fields, radio group (one stop, arrow keys inside), controls, then save. A failed save moves focus to the ErrorSummary section. Clicking its link focuses the first control in the target (worked for the group error). AlertDialog: focus moves in, Tab cycles inside, Escape closes, and focus returns to the opener. A plain confirm dialog focuses the safe button (KEEP IT). Save is disabled while the form is pristine, so Enter cannot submit an untouched form. |
| axe-core 4.13 | 0 violations | Run on 4 sections x 2 themes, plus the roll dialog and a revealed key. Disabled buttons are exempt from contrast; I measured them at 6.10:1 (midnight) and 5.03:1 (sketch). |
| prefers-reduced-motion | Pass, one leftover | Switch resolves `transition-property: none`. `.app-sidebar-toggle` keeps `transition: 0.2s all` (SET-17). |
| Print / PDF | Weak (SET-13) | There is no `@media print` outside ReportDocument. Midnight prints a full dark page. The mobile top bar with hamburger, the save bar and disabled buttons all print. The nav rail does not, so a printed page has no section list. The shell frame breaks across pages and leaves a mostly empty page 2. Controls print as bordered boxes with their values; switch on/off and the checkbox X survive because colours are forced. Tabs print only the active panel. |
| Terminal | Not applicable to forms | terminal/* and src/theme/ansi.ts are 16-slot colour themes (iTerm, Windows Terminal, Alacritty, Ghostty), not a widget renderer. A settings form cannot be expressed in them. A TUI could borrow the red/green/yellow slots for danger/success/warning, brightBlack for helper text, and the `[ LABEL ]` and `> hint` conventions. Slots are hue-based, so the accent-versus-intent collision in SET-01 would be invisible there. |

Copy (clipboard) could not be verified in headless Chrome. The permission was denied, so I saw only the fallback toast ("Copy blocked / Select the value and copy it by hand."), which works.

## (C) Findings

**SET-01. No danger intent on Button; destructive actions borrow an accent.**
- Category: component-gap. Severity: high. Both themes, all viewports.
- Evidence: m-1280-danger.png, s-1280-danger.png, s-375-drawer.png.
  - The only route to a "dangerous" button is `variant="tertiary"`, which is an accent.
  - In sketch, tertiary is red. The mobile drawer CLOSE, the hamburger and the table's ROLL all look destructive.
  - In midnight, tertiary is pink, which matches ErrorSummary's intent.danger, so decorative and meaningful look the same.
  - In the danger zone, ARCHIVE, TRANSFER and DELETE have identical weight.
- Fix: add `intent="danger"` (and warning/success) to Button, drawn from the intent roles. Add a lower-emphasis form for non-final rows.
- In-language: yes (solid intent fill, hard shadow, bracketed).

**SET-02. AlertDialog cannot gate or pend its confirm; type-to-confirm needs a full footer override.**
- Category: component-gap. Severity: high. Both themes.
- Evidence: m-1280-dialog.png.
  - AlertDialogProps has confirmLabel, cancelLabel and footer, but no confirmDisabled, confirmPending or confirmIntent.
  - My replacement footer reimplemented the default layout badly. The buttons wrap ("KEEP / IT", "DELETE MEDIA- / TRANSCODER") at the dialog width.
  - This is GitHub's signature interaction.
- Fix: add confirmDisabled, confirmPending and confirmIntent. Give `footer` a layout wrapper or render slot.
- In-language: yes.

**SET-03. No dirty-state save bar or unsaved-changes pattern.**
- Category: component-gap. Severity: medium. Both themes.
- Evidence: SaveBar in parts.tsx is hand-rolled (sticky, `role=status`, disabled until dirty). There is no leave-page guard primitive (beforeunload, section switch). I kept state lifted so section switching preserves edits.
- Fix: a FormActions/SaveBar component that is sticky, has a dirty-count slot and discard + save buttons, and announces on appear. Document the guard pattern.
- In-language: yes.

**SET-04. Table has no responsive mode; actions are unreachable at 375.**
- Category: component-gap. Severity: high. Both themes, 375 (cramped at 768).
- Evidence: m-375-keys.png.
  - The key column wraps one character per line (`pk_` / `liv` / `e_5`).
  - "LAST USED" is clipped.
  - The whole actions column (REVEAL/COPY/ROLL) is off-screen and reachable only by horizontal scroll inside the table.
  - For a table whose point is its row actions, this is a functional failure.
  - Neither Table nor DataTable has a stacked appearance or a sticky action column.
- Fix: `Table responsive="stack"` (label-value rows below a breakpoint) or a documented row-card recipe. Make the scroll container keyboard-focusable and labelled.
- In-language: yes.

**SET-05. No copy button, masked value, or Input addon/trailing-action slot.**
- Category: component-gap. Severity: medium.
- Evidence: CopyButton in parts.tsx and api-keys.tsx are hand-built (clipboard call, COPIED state, toast).
  - Input has no prefix/suffix/endAction. A "https://" prefix, an "rtk /" owner prefix, or a copy button inside the field (GitHub clone URL, Stripe key field) is impossible, so I used a table plus `<code>`.
  - There is no masked-secret primitive with reveal/hide, aria-pressed or auto-rehide.
- Fix: add CopyButton (with an aria-live state), SecretValue (mask/reveal), and Input startAdornment/endAdornment.
- In-language: yes (`[ COPY ]` becomes `[ COPIED ]`).

**SET-06. Field text is string-only and always uppercased; nothing marks optional/required.**
- Category: component-gap / original-does-better. Severity: medium. Both themes.
- Evidence: m-1280-dialog.png.
  - The label "TYPE RTK/MEDIA-TRANSCODER TO CONFIRM" shows the case-sensitive value in uppercase, which contradicts the "Case sensitive" helper.
  - label, helperText, legend and error are all `string`, so no inline `<code>`, links ("Learn more") or key hints.
  - `required` renders no marker, so I typed "(optional)" into labels by hand.
- Fix: accept ReactNode for label and helper. Add an escape from uppercase for as-typed values. Ship a `requirement="optional|required"` label affordance.
- In-language: yes.

**SET-07. Group errors and hints sit under the last control; members don't show invalid.**
- Category: component-gap / visual-refinement. Severity: medium. Both themes.
- Evidence: m-1280-merge-error.png.
  - The Fieldset error "Allow at least one way to merge a pull request" prints after "Delete head branches after merge" and reads as that checkbox's error.
  - The checkboxes keep neutral borders and the legend is not marked.
  - The group helper "At least one method must stay on" has the same placement problem. Fieldset has no description slot under the legend.
  - `aria-describedby` on the fieldset is correct.
- Fix: render the group helper under the legend and the error directly beneath it, with an intent rule on the fieldset edge. Propagate `data-invalid` to child controls.
- In-language: yes.

**SET-08. An error replaces the helper text, so the character counter vanishes.**
- Category: component-gap. Severity: low/medium. Both themes.
- Evidence: m-1280-error.png. The description shows "67 of 120 characters" until it goes over 120. Then only the error shows and the user can no longer see by how much. The original shows both. helperText and error are mutually exclusive in fieldFrame.
- Fix: render both (error first) or add a counter slot.
- In-language: yes.

**SET-09. NoteBlock type="warning" is drawn as danger.**
- Category: visual-refinement (semantic). Severity: medium. Both themes.
- Evidence: NoteBlock.tsx maps `warning` to intent.danger and `important` to intent.warning. My first render (m-1280-general-full.png) was pink, indistinguishable from the ErrorSummary. I switched the example to `important`, the only way to get the warning (yellow) intent. There is no danger or success type under those names.
- Fix: align type names with intents (`warning` to warning, add `danger`); keep `important` as an alias.
- In-language: yes.

**SET-10. Radio is square and differs from Checkbox only by its inner mark.**
- Category: a11y / visual-refinement. Severity: medium. Both themes.
- Evidence: m-1280-general.png and s-1280-general.png (VISIBILITY block). Unchecked radios and unchecked checkboxes are identical empty squares. A selected radio is a filled inner square; a selected checkbox is an X. Round radios are out of language, but the square shape removes the single-choice cue.
- Fix: a distinct glyph, `( )` / `(•)` in mono against `[ ]` / `[X]`, or a diamond mark.
- In-language: yes (glyph-based, no rounding).

**SET-11. ThemeProvider loses the stored level under React StrictMode (dev only).**
- Category: component-gap (bug). Severity: low, but the site sets `reactStrictMode: true`. Both themes.
- Evidence: with StrictMode on, setting `localStorage['ds-theme-level']='sketch'` and reloading came back `midnight` and rewrote storage. With it off, it persisted. The persist effect writes the default before the reconcile effect re-reads the attribute, and the second strict pass reads the overwritten attribute. This cost me two screenshot passes.
- Fix: read storage once into a ref before the first persist effect, or skip persisting until reconciled.
- In-language: n/a.

**SET-12. AppShell rail height is viewport-sized, not content-sized or sticky.**
- Category: visual-refinement. Severity: medium. Both themes, 1280.
- Evidence: m-1280-toast.png (scrolled) and m-1280-features.png. The rail divider ends about 935px down while the content continues, leaving an unframed left column. Settings pages are long forms, so this is the common case. Caveat: the full-page capture may exaggerate it, and I did not separately verify sticky behaviour when scrolling.
- Fix: make AppSidebar `position: sticky; top: 0; height: 100svh`, or stretch it, as the shell default.
- In-language: yes.

**SET-13. No print stylesheet for application surfaces.**
- Category: token/spacing (print). Severity: medium. Both themes, print.
- Evidence: print-midnight-general.pdf and print-sketch-keys.pdf. Midnight prints a full dark page. Chrome that is meaningless on paper (hamburger, save bar, toast region, disabled buttons) prints. The nav rail is hidden at print width, so there is no section list. The shell border straddles the page break. Only ReportDocument has print rules.
- Fix: add `@media print` in styles.css that:
  - switches to the sketch token set;
  - hides the sidebar toggle, sticky bars and the toast viewport;
  - un-sticks elements and sets `break-inside: avoid` on fieldsets and rows;
  - expands the nav as a heading list.
- In-language: yes (sketch is the drafting-table theme).

**SET-14. No low-emphasis button; row actions are heavy.**
- Category: visual-refinement / component-gap. Severity: medium. Both themes.
- Evidence: m-1280-keys.png. Three solid shadowed buttons per row (white REVEAL, yellow COPY, pink ROLL) outweigh the data they act on and wrap to 2-3 lines in a "compact" table. Button offers primary/secondary/tertiary/inverse/default and `sm`; there is no ghost, link or icon-only form.
- Fix: add `variant="quiet"` (border only, no fill or shadow until hover) and an icon button. Make Table `density="compact"` reduce button chrome.
- In-language: yes.

**SET-15. Toast viewport collides with sticky bars and cannot be moved.**
- Category: visual-refinement. Severity: medium. Both themes.
- Evidence: m-1280-toast.png. "SETTINGS SAVED" lands on DISCARD and SAVE CHANGES right after the user presses save. ToastProviderProps has no placement or offset.
- Fix: add a `placement` prop, or a CSS variable for the bottom inset.
- In-language: yes.

**SET-16. Legend and field label have nearly the same weight.**
- Category: visual-refinement. Severity: low/medium. Both themes.
- Evidence: m-1280-general.png. The legend "REPOSITORY" sits directly above the label "REPOSITORY NAME", both 12px bold mono uppercase muted. Grouping is hard to scan in long forms, and the fieldset has no rule or box, so sections are separated only by gap.
- Fix: a larger display-face legend with a hard rule, or an optional boxed fieldset.
- In-language: yes.

**SET-17. Small items.**
- Category: token/spacing / a11y. Severity: low.
- `.app-sidebar-toggle` keeps `transition: 0.2s all` under prefers-reduced-motion.
- Disabled Save/Discard pass contrast (6.10 / 5.03), but the disabled border is `edge-subtle` on the ground, so the control reads as a text label rather than a button. Keep the edge-default border and drop the fill.
- The Table actions header needs an AT name (I used `sr-only`). Three identical REVEAL buttons are ambiguous without a per-row aria-label (added in the example).

**SET-18. Capabilities the originals have that the package lacks (no fix proposed).**
- Category: original-does-better. Severity: medium as a set.
- Inline-edit rows with per-row "saved" confirmation (GitHub).
- Settings search.
- A leave-page guard (see SET-03).
- A one-time secret reveal modal after create (Stripe).
- A test/live mode banner.
- A scoped-permission picker. `Checkbox` has `indeterminate` but there is no CheckboxGroup with parent state.
- Select with search or groups.
- Per-row action menus in DataTable (not tried).

**What worked and should be kept**
- ErrorSummary with `key={attempt}`: focus reliably lands on the summary on every failed submit, and its links focus the right control. Best-in-class for this archetype.
- Switch with `helperText` makes a complete feature row with no custom markup; Checkbox helper text works the same way.
- AlertDialog focus management: trap, Escape, return-focus and a safe default focus all behave.
- Select (non-native) and RadioGroup are keyboard-complete. The radio group is a single Tab stop.
- Both themes are axe-clean. Sketch is the better surface for long forms.
