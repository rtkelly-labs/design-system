/**
 * Components the compendium has not got a plate for, each with a typed reason. A ratchet, not an
 * exemption list: it may only shrink (compendium.test.ts pins the ceiling), and a new export never
 * belongs here, it needs a plate. The reason says what a plate would need, so the owner can triage.
 *
 *   overlay-inert       Renders through a Base UI Portal, which mounts only on the client:
 *                       renderToStaticMarkup yields the trigger and nothing else, even with the
 *                       open / defaultOpen / isOpen prop set. Needs a client-rendered snapshot
 *                       (jsdom or the browser) or a portal-less static mode in the design system.
 *   taller-than-sheet   Measures taller than one A4 sheet even for a single rung at report width.
 *                       Needs a plate that may flow over several sheets, or a smaller story.
 *   needs-data-fixture  Not renderable meaningfully without fixture data nobody has written.
 *   app-shell           A full application frame; shows nothing a plate can contain.
 */
export type BacklogKind = 'overlay-inert' | 'taller-than-sheet' | 'needs-data-fixture' | 'app-shell';

export const BACKLOG: Readonly<Record<string, { kind: BacklogKind; reason: string }>> = {
  AlertDialog: { kind: 'overlay-inert', reason: 'Base UI AlertDialog.Portal renders nothing in a static render; the Destructive story markup is empty.' },
  Drawer: { kind: 'overlay-inert', reason: 'Base UI Dialog.Portal renders nothing in a static render; FromTheRight and FromTheLeft markup is empty.' },
  Menu: { kind: 'overlay-inert', reason: 'Has defaultOpen, but Menu.Portal renders nothing statically; only the trigger is emitted.' },
  Modal: { kind: 'overlay-inert', reason: 'Dialog.Portal renders nothing statically even with isOpen; the Open story markup is empty.' },
  Popover: { kind: 'overlay-inert', reason: 'Has open/defaultOpen, but Popover.Portal renders nothing statically; the trigger shows aria-expanded=false.' },
  Tooltip: { kind: 'overlay-inert', reason: 'Has open/defaultOpen, but Tooltip.Portal renders nothing statically; only the trigger is emitted.' },
  DocsLayout: { kind: 'taller-than-sheet', reason: 'Full docs page frame (sidebar, header, article, TOC); about 320mm per rung.' },
  ExperimentsView: { kind: 'taller-than-sheet', reason: 'The experiments catalogue; about 250mm per rung, just over a sheet. A smaller catalogue story would fit.' },
  FileChangeTree: { kind: 'taller-than-sheet', reason: 'Three-column change tree wraps to about 330mm per rung at report width.' },
  LoremIpsumPost: { kind: 'taller-than-sheet', reason: 'A whole blog post; about 600mm per rung.' },
  SaasLandingPage: { kind: 'taller-than-sheet', reason: 'A whole landing page; about 530mm per rung.' },
};
