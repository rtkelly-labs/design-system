/**
 * The `data-slot` contract, as data and as the one scanner every layer shares.
 *
 * Every standalone component root and every composition part carries a stable, kebab-case
 * `data-slot`: the kebab-case of its export name (`SiteFooter` -> `site-footer`, `TabsList` ->
 * `tabs-list`), with sub-elements named `<root>-<part>` (`site-footer-body`). A slot name is a
 * quasi-public contract; see AGENTS.md. Three layers enforce it, from the cheapest up:
 *
 *   1. `scripts/check-slots.mjs` (`pnpm check:slots`, no build, runs first in CI): reads the
 *      source and fails on any exported component whose returned root has no `data-slot` and no
 *      entry below.
 *   2. `src/slots/slots.test.tsx`: renders every component through its stories (or a fixture) and
 *      checks the markup, the naming rule, uniqueness, and that the committed inventory is current.
 *   3. `api/slots.txt`: the committed inventory, so adding, renaming or removing a slot is a
 *      reviewable diff, the way `api/index.d.ts` is for types.
 *
 * ALIASES is the typed exemption list, and a ratchet: an entry that is no longer needed fails.
 * Adding to it is a design decision, not a way to make a check pass.
 *
 * Kinds
 *   shared-frame   the root is a frame several components share (`FieldFrame`, `GroupFrame`); the
 *                  component is identified by `slot` or `family`, which is on a descendant.
 *   delegate       a thin wrapper that renders another component and so carries its slot.
 *   no-dom-root    the component renders no element of its own (a Base UI Root, a Provider); its
 *                  popup or content carries the `family`.
 *   legacy-name    the slot predates the rule and is kept: renaming it breaks consumers.
 *   data-carrier   an MDX item (`Path`, `Event`) or a fragment that the parent reads as data; it
 *                  renders no element.
 *
 * Fields: `slot` the exact slot expected in a render; `family` a prefix, any slot starting with
 * `${family}` or equal to it; neither means no DOM is expected (data-carrier).
 */

/** @typedef {'shared-frame'|'delegate'|'no-dom-root'|'legacy-name'|'data-carrier'} AliasKind */
/** @type {Record<string, {kind: AliasKind, reason: string, slot?: string, family?: string}>} */
export const ALIASES = {
  AsciiDivider: { kind: 'delegate', slot: 'divider', reason: 'Deprecated alias; renders Divider.' },
  BarChart: { kind: 'legacy-name', slot: 'barchart', reason: 'Predates the rule; consumers and visual tests target "barchart".' },
  DataTable: { kind: 'delegate', family: 'table', reason: 'Renders Table (or a paginated / virtual-scroll wrapper); its elements are table-*, datatable-paginated and table-virtual-scroll.' },
  Legend: { kind: 'legacy-name', slot: 'fieldset-legend', reason: 'The legend of Fieldset; named for its parent before the rule.' },
  Fieldset: { kind: 'shared-frame', slot: 'fieldset', reason: 'Rendered by GroupFrame, which RadioGroup shares; the slot comes from the frame.' },
  RadioGroup: { kind: 'shared-frame', family: 'radio', reason: 'Rendered by GroupFrame (shared with Fieldset); its items are radio and radio-indicator.' },
  Input: { kind: 'shared-frame', slot: 'field-control', reason: 'FieldFrame owns the wrapper; the control is shared by Input, TextArea and Select triggers.' },
  TextArea: { kind: 'shared-frame', slot: 'field-control', reason: 'As Input.' },
  Select: { kind: 'shared-frame', family: 'select', reason: 'FieldFrame owns the wrapper; the trigger, popup and items are select-*.' },
  MobileNav: { kind: 'no-dom-root', family: 'mobile-nav', reason: 'Renders a trigger Button and a Drawer; the trigger is mobile-nav-trigger.' },
  GitHubIcon: { kind: 'delegate', slot: 'social-icon', reason: 'Renders SocialIcon.' },
  LinkedInIcon: { kind: 'delegate', slot: 'social-icon', reason: 'Renders SocialIcon.' },
  BlueskyIcon: { kind: 'delegate', slot: 'social-icon', reason: 'Renders SocialIcon.' },
  XIcon: { kind: 'delegate', slot: 'social-icon', reason: 'Renders SocialIcon.' },
  MailIcon: { kind: 'delegate', slot: 'social-icon', reason: 'Renders SocialIcon.' },
  NotFoundPage: { kind: 'delegate', slot: 'status-page', reason: 'StatusPage with the 404 copy; its test pins the root as status-page.' },
  ServerErrorPage: { kind: 'delegate', slot: 'status-page', reason: 'StatusPage with the 500 copy.' },
  LoremIpsumPost: { kind: 'delegate', slot: 'blog-post', reason: 'A fixture post; renders BlogPost.' },
  CodeTabs: { kind: 'delegate', slot: 'tabs', reason: 'Renders Tabs, so the root is tabs and its parts are tabs-*.' },
  ResponsiveChartContainer: { kind: 'data-carrier', reason: 'A re-export of visx ParentSize, not an element of ours.' },
  CodeBlockAttachment: { kind: 'data-carrier', reason: 'A context object CodeTabs provides to CodeBlock; renders nothing.' },
  Path: { kind: 'data-carrier', reason: 'An MDX item FlowDiagram reads as data.' },
  Event: { kind: 'data-carrier', reason: 'An MDX item Timeline reads as data.' },
  Line: { kind: 'data-carrier', reason: 'An MDX item ChangeSummary reads as data.' },
  Slope: { kind: 'data-carrier', reason: 'An MDX item BeforeAfter reads as data.' },
  Node: { kind: 'data-carrier', reason: 'An MDX item TreeDiagram reads as data.' },
  Step: { kind: 'data-carrier', reason: 'An MDX item Steps reads as data.' },
  CodeTab: { kind: 'data-carrier', reason: 'A fragment CodeTabs reads as data; it renders no element of its own.' },
};

/** `SiteFooter` -> `site-footer`, `GitHubIcon` -> `git-hub-icon`, `XIcon` -> `x-icon`. */
export const kebab = (name) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();

/** The slot a component is expected to carry on its own element. */
export const expectedSlot = (name) => ALIASES[name]?.slot ?? kebab(name);

export const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
