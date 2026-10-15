import type { NerdIconName } from '@rtkelly13/design-system';

/**
 * Phase 1 decision board: scaffolding, deleted once the owner has picked.
 * Every option has a stable ID; the evidence strings are taken from the
 * "Evidence" section of packages/design-system/docs/applied-evaluation.md.
 */

export type Role = 'plain' | 'primary' | 'quiet' | 'secondary' | 'cancel' | 'danger' | 'dangerFinal';
export type BtnSize = 'xs' | 'sm' | 'md';

export interface Slot {
  role: Role;
  label: string;
  size?: BtnSize;
  icon?: NerdIconName;
  aria?: string;
}

export interface DecisionOption {
  id: string;
  name: string;
  rationale: string;
  evidence: string;
}

export interface Decision {
  id: string;
  title: string;
  finding: string;
  options: DecisionOption[];
}

export const DECISIONS: Decision[] = [
  {
    id: 'D1',
    title: 'Low-emphasis button (quiet)',
    finding:
      'Button has one weight: loud. Row actions outweigh the data they act on (roll-up row 2; K-1, INB-05, SET-14, CAL-F03, AUD-F14).',
    options: [
      {
        id: 'D1-A',
        name: 'Outline, shadow on hover',
        rationale: '2px edge-default border, transparent fill, no shadow. Hover moves the border to accent-primary and raises the hard shadow.',
        evidence: 'Carbon Button: ghost is the least prominent weight.',
      },
      {
        id: 'D1-B',
        name: 'Bracketed text',
        rationale: 'Text-only in ink, wrapped in [ ACTION ] brackets, underline on hover. Lightest option; no box at all.',
        evidence: 'Primer Button: the invisible variant. DESIGN.md: bracketed labels.',
      },
      {
        id: 'D1-C',
        name: 'Outline, small shadow',
        rationale: '2px border plus a permanent 2px hard shadow, quieter than the default 4px. Keeps the press affordance at rest.',
        evidence: 'DESIGN.md offset-shadow idiom; AUD-F03 (shadows at 2/3/4/6/8px today).',
      },
    ],
  },
  {
    id: 'D2',
    title: 'Secondary button',
    finding:
      'Secondary is a solid ink block, louder than primary (roll-up row 2; INB-05, AUD-F14).',
    options: [
      {
        id: 'D2-A',
        name: 'Keep: solid inverse fill',
        rationale: 'The control. Ink-coloured fill with inverse text.',
        evidence: 'Row 2: "secondary is an ink block louder than primary".',
      },
      {
        id: 'D2-B',
        name: 'Edge-strong outline + shadow',
        rationale: 'Transparent fill, edge-strong border, ink text, 4px hard shadow in edge-strong. Reads as a button without a fill.',
        evidence: 'GOV.UK Button: one default button per page. Carbon Button: one primary per screen.',
      },
      {
        id: 'D2-C',
        name: 'Accent-secondary outline + shadow',
        rationale: 'Outline, text and shadow all in accent-secondary. Keeps a hue cue but no fill.',
        evidence: 'Carbon Button; row 3 caution: accent-secondary equals intent-success on sketch (CAL-F01).',
      },
    ],
  },
  {
    id: 'D3',
    title: 'Danger intent',
    finding:
      'Button has no danger intent; tertiary reads as danger on sketch, and decorative pink equals error pink on midnight (roll-up row 3; K-2, K-3, SET-01, INB-05, CAL-F03).',
    options: [
      {
        id: 'D3-A',
        name: 'Solid everywhere',
        rationale: 'Solid intent-danger fill, inverse text, hard shadow, on every destructive action.',
        evidence: 'Primer Button: danger "used sparingly" (this option uses it a lot). WCAG 1.4.1: colour is not the only cue.',
      },
      {
        id: 'D3-B',
        name: 'Outline, fill on hover/focus',
        rationale: 'Intent-danger outline and text. The fill arrives only on hover or focus, so a page of danger actions stays calm.',
        evidence: 'Primer Button (sparing use). Carbon Modal (danger modal).',
      },
      {
        id: 'D3-C',
        name: 'Two weights',
        rationale: 'Outline danger for non-final actions (ARCHIVE, TRANSFER); solid danger only for the final confirm (DELETE REPOSITORY).',
        evidence: 'Carbon Modal: danger modal confirm. Primer Button: sparing use.',
      },
    ],
  },
  {
    id: 'D4',
    title: 'Small sizes',
    finding:
      'Density floor: sm Button is 40-44px, so dense rows cannot fit. Several targets already fall under 24px (roll-up rows 18 and 23; AUD-F25/F26/F27, PT-06/07/10, AUD-G17).',
    options: [
      {
        id: 'D4-A',
        name: 'xs 28px, icon 32x32',
        rationale: 'Text xs is 28px tall, icon-only is 32x32. Densest; clears WCAG 2.5.8 (24x24) with 4px to spare.',
        evidence: 'WCAG 2.5.8 AA (24x24). Carbon Data table row sizes 24-64px.',
      },
      {
        id: 'D4-B',
        name: 'xs 32px, icon 40x40',
        rationale: 'Text xs is 32px tall, icon-only is 40x40. Easier on touch; fewer rows per screen.',
        evidence: 'WCAG 2.5.8 and 2.5.5 (44px is AAA). Row 18: sm is 40px, Gmail rows ~28-30px.',
      },
    ],
  },
  {
    id: 'D5',
    title: 'Midnight on paper',
    finding:
      'Nothing prints well. With backgrounds off (the browser default) midnight prints at 1.0-3.3:1 on white and every fill vanishes (roll-up row 1; K-9, INB-11, SET-13, PT-02/03/04). Sheets below simulate paper on screen; no @media print is used.',
    options: [
      {
        id: 'D5-A',
        name: 'Midnight exact',
        rationale: 'A full dark sheet. This is what PR 360 print-color-adjust: exact gives today. Looks right, costs the most ink.',
        evidence: 'MDN print-color-adjust (exact keeps backgrounds).',
      },
      {
        id: 'D5-B',
        name: 'Sketch roles, fills kept',
        rationale: 'The sheet switches to sketch roles. Accents and fills are kept, so tags and buttons still read as filled.',
        evidence: 'WCAG 1.4.3 contrast; row 1 fix: re-point roles to sketch ink-on-paper.',
      },
      {
        id: 'D5-C',
        name: 'Sketch roles, fills as outlines',
        rationale: 'Sketch roles, and every fill becomes an outline. Ink-saving and survives backgrounds-off.',
        evidence: 'MDN print-color-adjust (default economy drops backgrounds). Row 1.',
      },
    ],
  },
];

/** A Slot with defaults. */
const s = (role: Role, label: string, size: BtnSize = 'sm', extra: Partial<Slot> = {}): Slot => ({ role, label, size, ...extra });
const prev = (role: Role, size: BtnSize = 'sm'): Slot => s(role, '<', size, { icon: 'chevron-left', aria: 'Previous month' });
const next = (role: Role, size: BtnSize = 'sm'): Slot => s(role, '>', size, { icon: 'chevron-right', aria: 'Next month' });

export interface SceneCfg {
  bulk: { archive: Slot; markRead: Slot; clear: Slot };
  danger: { archive: Slot; transfer: Slot; del: Slot };
  modal: { cancel: Slot; confirm: Slot };
  table: { reveal: Slot; copy: Slot; roll: Slot };
  cal: { today: Slot; prev: Slot; next: Slot; options: Slot; add: Slot };
  kanban: { menu: Slot; add: Slot };
}

const primary = (label: string): Slot => s('primary', label, 'sm');

/** Which role each in-context button takes, per decision. */
export const CFG: Record<string, SceneCfg> = {
  D1: {
    bulk: { archive: s('quiet', 'ARCHIVE'), markRead: s('quiet', 'MARK READ'), clear: s('quiet', 'CLEAR') },
    danger: { archive: s('quiet', 'ARCHIVE', 'md'), transfer: s('quiet', 'TRANSFER', 'md'), del: s('plain', 'DELETE', 'md') },
    modal: { cancel: s('quiet', 'CANCEL', 'md'), confirm: s('plain', 'DELETE REPOSITORY', 'md') },
    table: { reveal: s('quiet', 'REVEAL'), copy: s('quiet', 'COPY'), roll: s('quiet', 'ROLL') },
    cal: { today: s('quiet', 'TODAY'), prev: prev('quiet'), next: next('quiet'), options: s('quiet', 'OPTIONS'), add: primary('NEW EVENT') },
    kanban: { menu: s('quiet', '...', 'sm', { aria: 'Card actions' }), add: s('quiet', '+', 'sm', { aria: 'Add card' }) },
  },
  D2: {
    bulk: { archive: s('secondary', 'ARCHIVE'), markRead: s('secondary', 'MARK READ'), clear: s('plain', 'CLEAR') },
    danger: { archive: s('secondary', 'ARCHIVE', 'md'), transfer: s('secondary', 'TRANSFER', 'md'), del: s('plain', 'DELETE', 'md') },
    modal: { cancel: s('secondary', 'CANCEL', 'md'), confirm: s('plain', 'DELETE REPOSITORY', 'md') },
    table: { reveal: s('secondary', 'REVEAL'), copy: s('secondary', 'COPY'), roll: s('secondary', 'ROLL') },
    cal: { today: s('secondary', 'TODAY'), prev: prev('secondary'), next: next('secondary'), options: s('secondary', 'OPTIONS'), add: primary('NEW EVENT') },
    kanban: { menu: s('secondary', '...', 'sm', { aria: 'Card actions' }), add: s('secondary', '+', 'sm', { aria: 'Add card' }) },
  },
  D3: {
    bulk: { archive: s('danger', 'ARCHIVE'), markRead: s('plain', 'MARK READ'), clear: s('plain', 'CLEAR') },
    danger: { archive: s('danger', 'ARCHIVE', 'md'), transfer: s('danger', 'TRANSFER', 'md'), del: s('dangerFinal', 'DELETE', 'md') },
    modal: { cancel: s('cancel', 'CANCEL', 'md'), confirm: s('dangerFinal', 'DELETE REPOSITORY', 'md') },
    table: { reveal: s('plain', 'REVEAL'), copy: s('plain', 'COPY'), roll: s('danger', 'ROLL') },
    cal: { today: s('plain', 'TODAY'), prev: prev('plain'), next: next('plain'), options: s('plain', 'OPTIONS'), add: primary('NEW EVENT') },
    kanban: { menu: s('plain', '...', 'sm', { aria: 'Card actions' }), add: s('plain', '+', 'sm', { aria: 'Add card' }) },
  },
  D4: {
    bulk: { archive: s('plain', 'ARCHIVE', 'xs'), markRead: s('plain', 'MARK READ', 'xs'), clear: s('plain', 'CLEAR', 'xs') },
    danger: { archive: s('plain', 'ARCHIVE', 'xs'), transfer: s('plain', 'TRANSFER', 'xs'), del: s('plain', 'DELETE', 'xs') },
    modal: { cancel: s('plain', 'CANCEL', 'md'), confirm: s('plain', 'DELETE REPOSITORY', 'md') },
    table: {
      reveal: s('plain', 'REVEAL', 'xs'),
      copy: s('plain', 'COPY', 'xs', { icon: 'copy', aria: 'Copy key' }),
      roll: s('plain', 'ROLL', 'xs', { icon: 'refresh', aria: 'Roll key' }),
    },
    cal: {
      today: s('plain', 'TODAY', 'xs'),
      prev: prev('plain', 'xs'),
      next: next('plain', 'xs'),
      options: s('plain', 'OPTIONS', 'xs'),
      add: primary('NEW EVENT'),
    },
    kanban: {
      menu: s('plain', '...', 'xs', { icon: 'chevron-down', aria: 'Card actions' }),
      add: s('plain', '+', 'xs', { icon: 'plus', aria: 'Add card' }),
    },
  },
};

/** Scenes a decision does not touch. D3 has no danger action in a calendar toolbar or kanban footer. */
export const SKIP: Record<string, ('cal' | 'kanban')[]> = { D3: ['cal', 'kanban'] };

export const ROWS = [
  { id: 'ISS-1042', from: 'AK', title: 'Focus ring clipped inside overflow-x containers', tag: 'a11y', when: 'Oct 12' },
  { id: 'ISS-1038', from: 'BO', title: 'Tabs: typeahead on the tablist', tag: 'api', when: 'Oct 11' },
  { id: 'ISS-1031', from: 'CJ', title: 'Menu popup flips under the sticky header', tag: 'bug', when: 'Oct 09' },
] as const;

export const KEYS = [
  { name: 'ci-deploy', scope: 'deploy:write', used: 'Oct 12' },
  { name: 'docs-preview', scope: 'read', used: 'Oct 09' },
  { name: 'ops-readonly', scope: 'read', used: 'Sep 30' },
] as const;
