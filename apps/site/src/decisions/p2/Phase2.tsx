import type { ReactNode } from 'react';
import { CvdFilters } from './CvdFilters';
import { D6Option } from './D6';
import { D7Option } from './D7';
import { D8Option } from './D8';
import { D9Option } from './D9';
import { D10Option } from './D10';
import { BEST6, BEST8 } from './series';

interface Opt {
  /** Key the scene code switches on. */
  opt: string;
  id: string;
  name: string;
  rationale: string;
  evidence: string;
}

interface P2Decision {
  id: string;
  title: string;
  finding: string;
  note?: ReactNode;
  options: Opt[];
  render: (o: Opt) => ReactNode;
}

const CTRL = (dec: string, name: string, rationale: string): Opt => ({
  opt: 'CUR',
  id: `${dec}-CURRENT`,
  name,
  rationale,
  evidence: 'Control row; no change.',
});

export const PHASE2: P2Decision[] = [
  {
    id: 'D6',
    title: 'Selected, hover and cursor states',
    finding:
      'Hover and selected share bg-surface-raised, which is 1.09:1 on midnight and 1.11:1 on sketch. A selected row cannot be told from a hovered one, and neither from rest (roll-up row 5; INB-02, INB-04).',
    note: (
      <>
        Hover and cursor are drawn as labelled rows, since a static board has no pointer. The table is a plain table:
        DataTable exposes only className on the table, with no per-row class or style hook, so its rows cannot carry an
        option's fill or edge. Hover is supplemental under WCAG 1.4.11; selected and cursor are the ones that must reach 3:1.
      </>
    ),
    options: [
      CTRL('D6', 'Current (ships today)', 'Selected and hover are both a raised fill. The cursor is a 2px accent-secondary outline.'),
      {
        opt: 'D6-A',
        id: 'D6-A',
        name: 'Edge for selected, outline for cursor',
        rationale: 'Selected is a 4px inset accent-primary left edge; hover is a raised fill; cursor is a 2px accent-secondary outline.',
        evidence: 'docs/theming.md "Selection State" (fill or 4px edge, never surface against surface); INB-02.',
      },
      {
        opt: 'D6-B',
        id: 'D6-B',
        name: 'Opaque tint, glyph cursor',
        rationale:
          'Selected is an opaque accent-primary tint with ink text, mixed in until it is at least 3:1 against base and raised; hover is an edge-default inset outline; cursor is a > glyph in the gutter.',
        evidence: 'WCAG 1.4.11 (3:1 for a state indicator); glyph survives greyscale and print. INB-02, AUD-F11.',
      },
      {
        opt: 'D6-C',
        id: 'D6-C',
        name: 'Solid fill for selected',
        rationale: 'Selected is a solid accent-primary fill with inverse text; hover is a raised fill; cursor is a 4px edge in edge-strong.',
        evidence: 'docs/theming.md "Selection State" (accent fill clears 3:1 on both levels); CodeTabs is the worked example.',
      },
    ],
    render: (o) => <D6Option {...o} />,
  },
  {
    id: 'D7',
    title: 'Skeleton fill',
    finding: 'The skeleton is surface.sunken on surface.base, 1.03:1 on midnight. A loading list reads as an empty one (roll-up row 5; INB-04, AUD-F11).',
    note: 'Rows with a card use a raised surface, as Card does; the measured rows say which ground each number is against.',
    options: [
      CTRL('D7', 'Current (ships today)', 'A sunken block with no border.'),
      {
        opt: 'D7-A',
        id: 'D7-A',
        name: 'Raised fill, edge border',
        rationale: 'A raised fill with a 2px edge-default border. The border carries the shape; the fill is incidental.',
        evidence: 'WCAG 1.4.11 (the boundary is what must reach 3:1); AUD-F11.',
      },
      {
        opt: 'D7-B',
        id: 'D7-B',
        name: 'Diagonal hatch',
        rationale: 'A // hatch in text-muted on sunken: 2px strokes every 6px. Reads as a placeholder, not as missing content.',
        evidence: 'Hatch is the technical-drawing idiom DESIGN.md already uses for non-content; INB-04.',
      },
      {
        opt: 'D7-C',
        id: 'D7-C',
        name: 'Block characters',
        rationale: 'A run of the light-shade block character in text-muted, mono. The most in-language, and survives print.',
        evidence: 'DESIGN.md bracket and box-drawing language. The package mono font is latin-only, so this glyph may be drawn by a fallback font rather than the package one.',
      },
    ],
    render: (o) => <D7Option {...o} />,
  },
  {
    id: 'D8',
    title: 'Tints for calendar events and stacked blocks',
    finding:
      'Events use a /15 alpha, so a block shows the text of whatever sits under it, and the quiet role on its own tint fails AA (4.38:1 at 16%). The package has no opaque tint role (roll-up row 6; CAL-F02, CAL-F09, ED-F02).',
    note: 'Editor selection, find and diff bands stay translucent, because VS Code requires it. They are D10, not this decision. Mixes are in OKLab and use surface.base as the ground, and the control composites its 15% alpha over the same ground.',
    options: [
      CTRL('D8', 'Current (15% alpha)', 'color-mix(in oklab, role 15%, transparent). Overlapping events show through each other.'),
      {
        opt: 'D8-A',
        id: 'D8-A',
        name: 'Solid 12% tint',
        rationale: 'The tint is 12% of the role mixed into surface.base, opaque. Calmest; text reads best, the fill identifies least.',
        evidence: 'MDN color-mix(); WCAG 1.4.3; CAL-F02 (measured tint-vs-raised dE 0.075 to 0.142).',
      },
      {
        opt: 'D8-B',
        id: 'D8-B',
        name: 'Solid 20% tint',
        rationale: 'The tint is 20% of the role mixed into surface.base, opaque. Stronger identity; less room for the role colour as text.',
        evidence: 'WCAG 1.4.3; CAL-F09 (role ink on its tint is the limiting pair).',
      },
      {
        opt: 'D8-C',
        id: 'D8-C',
        name: 'No fill, role edge',
        rationale: 'No tint. A 4px role edge with ink text on a raised surface. Overlaps stay legible because nothing is see-through.',
        evidence: 'docs/theming.md "Selection State" (edge, not surface); CAL-F02 (the 4px edge does the identifying).',
      },
    ],
    render: (o) => <D8Option {...o} />,
  },
  {
    id: 'D9',
    title: 'Series palette for categorical colour',
    finding:
      'The 8 roles give 5 distinct colours, and on sketch accent.secondary equals intent.success (dE 0.000). Calendars and chart series need 6 to 12 colours that stay apart for colour-blind readers (roll-up row 4; CAL-F01, ED-F01).',
    note: (
      <>
        The two hue subsets were found by trying every combination of the 10 declared hues and keeping the one with the
        largest worst-level minimum pairwise OKLab dE on normal vision. CVD was not optimised, only measured. The 6 set is{' '}
        {BEST6.join(', ')}; the 8 set is {BEST8.join(', ')}. dE here is Euclidean OKLab on the 0..1 L scale the docs use
        (the gate in DESIGN.md is 0.04). The colour-blind views are an SVG feColorMatrix filter in linear RGB using the
        Machado 2009 matrices, the same matrices the printed numbers use. Neither the maths nor the filter is a package
        helper. The charts use the first 6 members of each set.
      </>
    ),
    options: [
      CTRL('D9', 'Current (8 roles, colour only)', 'The 8 accent and intent roles, in role order, with no glyphs.'),
      {
        opt: 'D9-A',
        id: 'D9-A',
        name: '6 hue series with glyphs',
        rationale: 'A series role group of 6, drawn from the declared hues for maximum separation on both levels, each with a shape and a letter.',
        evidence: 'WCAG 1.4.1 (colour is not the only channel); Okabe and Ito; Carbon data-vis palettes.',
      },
      {
        opt: 'D9-B',
        id: 'D9-B',
        name: '8 hue series, colour only',
        rationale: 'A series role group of 8 from the declared hues, accepting lower separation. Colour only, so the cost is visible.',
        evidence: 'Calendar apps need 8 to 12 colours (CAL-F01); Google offers 24.',
      },
      {
        opt: 'D9-C',
        id: 'D9-C',
        name: 'Keep roles, add shape and letter',
        rationale: 'No new tokens. The 8 roles stay, and a shape plus a letter code carries the difference the colours do not.',
        evidence: 'WCAG 1.4.1; smallest change to the package; CAL-F01 (the 0.04 gate does not cover role aliases).',
      },
    ],
    render: (o) => <D9Option {...o} />,
  },
  {
    id: 'D10',
    title: 'Syntax and editor roles',
    finding:
      'There is no syntax or editor role group, so a role-only consumer has 4 hues. Alpha bands fail AA on sketch, where the hues have about 0.02:1 of headroom (roll-up rows 4 and 6; ED-F01, ED-F02; issues 148 and 80).',
    note: (
      <>
        Each option shows the same bands, as per-level eight-digit hex literals of one role at one alpha, laid over
        surface.sunken. Sketch uses lower alphas than midnight. The grid composites every token over every band and flags
        anything under 4.5:1; the last row is the largest alpha at which every token of that option passes, so the owner
        can see how much room each option leaves. Diff bands use the success and danger intents, which on sketch have
        equal luminance (ED-F03); that finding is not part of this decision, so the +/- column carries the difference.
      </>
    ),
    options: [
      CTRL('D10', 'Current (4 hues, no channels)', 'Keyword accent.tertiary bold, string success, number warning, function accent.primary, type bold ink. Everything else is a text tone.'),
      {
        opt: 'D10-A',
        id: 'D10-A',
        name: '8 syntax roles on the hues',
        rationale: 'Keyword, string, number, function, type and constant take a declared hue each; comment and punctuation take text tones. Colour is the only channel.',
        evidence: 'ED-F01 (VS Code themes use 8 to 12 token colours); issue 148.',
      },
      {
        opt: 'D10-B',
        id: 'D10-B',
        name: '6 roles plus non-colour channels',
        rationale: 'Keyword, string, number, function, type and comment. Keyword is bold, comment italic, type underlined, so a greyscale or paper render still separates them.',
        evidence: 'WCAG 1.4.1; levels.ts INK_WEIGHT note (weight does work colour cannot on light grounds); PT-02.',
      },
      {
        opt: 'D10-C',
        id: 'D10-C',
        name: 'Today\'s 4 hues plus channels',
        rationale: 'No new hues. The four distinct roles stay, and the channels from D10-B (bold keyword, italic comment, underlined type) do the rest.',
        evidence: 'ED-F01 (only 4 role hues are distinct on both levels); smallest change to the package.',
      },
    ],
    render: (o) => <D10Option {...o} />,
  },
];

/** The Phase 2 picks, from docs/applied-evaluation/decisions.md. */
const P2_PICKS: Record<string, string> = {
  D6: 'D6-B (multi-select) + D6-C (single current)',
  D7: 'D7-B',
  D8: 'D8-B midnight, D8-A sketch',
  D9: 'preference axis',
  D10: 'D10-C base; round 2 below',
};

function Section({ d }: { d: P2Decision }) {
  return (
    <details className="border-2 border-edge-default">
      <summary className="flex cursor-pointer flex-wrap items-baseline gap-x-3 gap-y-1 bg-surface-raised p-3 font-mono text-sm">
        <span className="font-bold text-accent-primary">{d.id}</span>
        <span className="text-content-primary">{d.title}</span>
        <span className="border-2 border-edge-default px-1.5 text-[11px] font-bold uppercase text-content-secondary">
          decided: {P2_PICKS[d.id]}
        </span>
      </summary>
      <div className="p-3 sm:p-4">
        <SectionBody d={d} />
      </div>
    </details>
  );
}

function SectionBody({ d }: { d: P2Decision }) {
  return (
    <section id={d.id} aria-labelledby={`${d.id}-h`} className="flex scroll-mt-20 flex-col gap-5 border-t-4 border-double border-edge-strong pt-8">
      <header className="flex flex-col gap-2">
        <p className="m-0 font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent-primary">{`[ ${d.id} ]`}</p>
        <h2 id={`${d.id}-h`} className="m-0 font-display text-3xl font-extrabold uppercase text-content-primary sm:text-4xl">
          {d.title}
        </h2>
        <p className="m-0 max-w-3xl text-content-secondary">{d.finding}</p>
        {d.note && <p className="m-0 max-w-3xl border-2 border-edge-default bg-surface-raised p-3 font-mono text-xs text-content-secondary">{d.note}</p>}
      </header>
      {d.options.map((o) => (
        <div key={o.id}>{d.render(o)}</div>
      ))}
    </section>
  );
}

/** The Phase 2 sections under the #phase-2 anchor. */
export function Phase2() {
  return (
    <section id="phase-2" aria-labelledby="phase-2-h" className="flex scroll-mt-20 flex-col gap-10">
      <CvdFilters />
      <header className="flex flex-col gap-3">
        <p className="m-0 font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent-primary">[ PHASE 2 · SCAFFOLDING ]</p>
        <h2 id="phase-2-h" className="m-0 font-display text-4xl font-extrabold uppercase text-content-primary sm:text-5xl">
          Phase 2
        </h2>
        <p className="m-0 max-w-3xl text-lg text-content-secondary">
          Selection and hover states, skeletons, tints, the series palette and the syntax roles. Decided and collapsed by
          default; open a section to see the options as they were shown, with measured numbers beside each. Colours the
          package has no role for are computed here from its exported level data and set as custom properties on the panel.
        </p>
        <nav aria-label="Phase 2 decisions" className="border-2 border-edge-strong bg-surface-raised p-3 shadow-hard-md">
          <ul className="m-0 flex list-none flex-col gap-2 p-0 font-mono text-sm">
            {PHASE2.map((d) => (
              <li key={d.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <a href={`#${d.id}`} className="font-bold text-accent-primary">{d.id}</a>
                <span className="text-content-primary">{d.title}</span>
                <span className="flex flex-wrap gap-x-2 text-xs">
                  {d.options.map((o) => (
                    <a key={o.id} href={`#${o.id}`} className="text-content-secondary">{o.id}</a>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      {PHASE2.map((d) => (
        <Section key={d.id} d={d} />
      ))}
    </section>
  );
}
