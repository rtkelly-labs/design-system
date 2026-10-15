import type { Metadata } from 'next';
import { Article, Heading } from '@/components/docs/Article';
import {
  ANCHOR,
  CheckList,
  CodeFrame,
  LevelPair,
  NO_GUTTER,
  NumbersDisclosure,
  RoleList,
  SpecimenLegend,
  SurfacesStrip,
  TerminalFrame,
  seg,
} from '@/components/specimen';
import { CONTRACT_ANSI, contractLook } from '@/components/specimen/contract';
import { fallbackScope } from '@/components/specimen/contract-fallback';
import { ShikiSnippet } from '@/components/specimen/ShikiSnippet';
import { codeSyntax as article } from '@/content/articles';
import { alphaTable, bandTables, codeSyntaxChecks, metricsTable, roleTable } from '@/content/foundations/code-syntax';
import {
  CSS_SEGS,
  CSS_TITLE,
  FRAME_STATUS,
  FRAME_TITLE,
  LEGEND_FULL,
  LEGEND_NOTES,
  ROLES,
  SHIKI_SOURCE,
  SHIKI_TITLE,
  TRANSCRIPT,
  TRANSCRIPT_LABEL,
  frameRows,
} from '@/data/code-syntax';

export const metadata: Metadata = { title: article.title, description: article.lede };

/** Each specimen block sits outside the prose scope, so `prose` does not restyle its tables, lists and code. */
const BLOCK = `not-prose ${ANCHOR} my-6 flex flex-col gap-5`;

const CSS_ROWS = CSS_SEGS.map((segs, i) => seg(i + 1, ...segs));

export default function CodeSyntaxPage() {
  const rows = frameRows();
  const { checks, details } = codeSyntaxChecks();
  return (
    <Article article={article}>
      <Heading article={article} id="theme" />
      <p>
        One theme, on both levels, built from the roles the system already has. The token colours are the level's own accents,
        so midnight reads cyan, yellow and pink and sketch reads its own blue, green and red. The frame below is an editor
        with a search open, a selection, a current line, a bracket pair, three diagnostics and a diff, all at once.
      </p>
      <div className={BLOCK}>
        <LevelPair scope={fallbackScope} columns="2xl">
          {() => <CodeFrame look={contractLook} rows={rows} title={FRAME_TITLE} status={FRAME_STATUS} />}
        </LevelPair>
      </div>

      <Heading article={article} id="legend" />
      <p>
        Each highlight on its own line, so you can tell one from another. Errors, warnings and info are told apart by the
        shape of the underline and the mark in the gutter first, and by colour second.
      </p>
      <div className={BLOCK}>
        <SpecimenLegend items={LEGEND_FULL} look={() => contractLook} notes={LEGEND_NOTES} title="Legend" idPrefix="legend" scope={fallbackScope} />
      </div>

      <Heading article={article} id="structure" />
      <p>One job per role. Nothing competes with the selection, and nothing relies on colour alone.</p>
      <div className={BLOCK}>
        <RoleList roles={ROLES} title="Roles" />
        <NumbersDisclosure title="Role to variable, per level" tables={[roleTable(), alphaTable()]} />
      </div>

      <Heading article={article} id="checks" />
      <p>
        Computed from the exported level data and the package's <code>contrastRatio</code> and <code>composite</code>, not
        typed in. A change to a level's accents moves them.
      </p>
      <div className={BLOCK}>
        <CheckList checks={checks} />
        <NumbersDisclosure tables={[...bandTables(), ...details]} />
      </div>

      <Heading article={article} id="surfaces" />
      <p>
        The same roles on the other places code appears: what a <code>CodeBlock</code> prints, a terminal transcript with
        its eight ANSI slots mapped to the same roles, and a snippet highlighted by Shiki at build time inside the package's
        own <code>CodeBlock</code>.
      </p>
      <div className={BLOCK}>
        <SurfacesStrip
          scope={fallbackScope}
          columns="2xl"
          surfaces={[
            { label: 'CodeBlock-style, CSS', render: () => <CodeFrame look={contractLook} rows={CSS_ROWS} geo={NO_GUTTER} title={CSS_TITLE} /> },
            {
              label: 'Terminal-style, ANSI slots',
              render: () => <TerminalFrame ground={contractLook.ground} ink={contractLook.ink} slots={CONTRACT_ANSI} lines={TRANSCRIPT} label={TRANSCRIPT_LABEL} />,
            },
            { label: 'Shiki in the package CodeBlock, TypeScript', render: () => <ShikiSnippet code={SHIKI_SOURCE} title={SHIKI_TITLE} /> },
          ]}
        />
      </div>

      <Heading article={article} id="metrics" />
      <p>
        14px type on a 21px line, a tab is 2 columns, and the gutter is a 2ch mark column, 3ch of line numbers and a 2ch diff
        bar. Every fill and border is drawn as a layer on the row, so a border sits clear of the glyphs and never moves the
        text or changes a row's height.
      </p>
      <div className={BLOCK}>
        <NumbersDisclosure title="Type metrics" tables={[metricsTable()]} />
      </div>
    </Article>
  );
}
