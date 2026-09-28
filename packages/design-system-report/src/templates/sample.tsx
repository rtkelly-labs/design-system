/**
 * The worked example, and the regression fixture.
 *
 * `template.tsx` is what you copy to start a report. **This** is what you read
 * to see what a report can do: it exercises every path the generator has to keep
 * working, so a change that breaks one of them breaks a test rather than a
 * report someone is writing six months from now.
 *
 * `src/report/render.test.ts` renders it and asserts on the output;
 * `components-reports-reportdocument--sample` screenshots it. Adding a component to the
 * report vocabulary means adding it here.
 *
 * ============================================================================
 * What makes a generated report worth reading, and where each idea is below
 * ============================================================================
 *
 * These are the patterns the report generators people actually keep — Lighthouse,
 * coverage output, pytest-html — converge on, and none of them needs JavaScript:
 *
 *   1. **The verdict comes first.** A reader learns the outcome before the
 *      evidence. `<Verdict>` below is one line above everything else.
 *   2. **Numbers before prose.** A stat row is scannable in about two seconds;
 *      a paragraph saying the same thing is not.
 *   3. **Provenance is part of the report.** When, from what commit, under what
 *      configuration — the `meta` strip. A report that cannot be traced back to
 *      its inputs cannot be trusted or reproduced.
 *   4. **Progressive disclosure, not omission.** Detail belongs in the document,
 *      folded away. `<ReportDetails>` is `<details>`, so it works with no script.
 *   5. **Severity never rides on colour alone.** Every badge carries a word, and
 *      the disclosure marker is `[+]`/`[-]` text, so the report survives
 *      greyscale printing and a reader who cannot distinguish the hues.
 *   6. **Sections are addressable.** `ReportSection` derives an `id` from its
 *      title; the contents list links to them. A URL beats "see the third
 *      section down".
 *   7. **The zero case is designed.** "Nothing found" has to look deliberate,
 *      not like a rendering failure. See the Advisories section.
 *
 * Everything here is a fixed value. That is rule 1 of writing a report for this
 * pipeline and the linter enforces it: no `new Date()`, no `Math.random()`, so
 * rendering twice produces the same bytes and "did anything change" is a diff.
 */

import {
  Badge,
  Card,
  DataTable,
  Divider,
  NoteBlock,
  ReportDetails,
  ReportDocument,
  ReportSection,
  StatCard,
  Tag,
  accentVar,
  type AccentToken,
} from '@rtkelly13/design-system';

/* ── data ──────────────────────────────────────────────────────────────────
   Passed in as props in a real report; inline here so the fixture is fixed. */

const CHECKS = [
  { check: 'tokens:check', status: 'pass', ms: 210, detail: 'theme.css matches levels.ts' },
  { check: 'check:contrast', status: 'pass', ms: 90, detail: 'all 200 role pairs clear AA' },
  { check: 'check:tokens', status: 'pass', ms: 60, detail: '200 findings, budget 200' },
  { check: 'check:css', status: 'fail', ms: 55, detail: '328 declarations, budget 320' },
  { check: 'typecheck', status: 'pass', ms: 4100, detail: 'strict, no errors' },
  { check: 'test:visual', status: 'skip', ms: 0, detail: 'Linux CI only' },
] as const;

type Check = (typeof CHECKS)[number];

const STATUS_ACCENT: Record<Check['status'], AccentToken> = {
  pass: 'success',
  fail: 'danger',
  skip: 'quiet',
};

const COVERAGE = [
  { area: 'src/lib', percent: 94 },
  { area: 'src/hooks', percent: 88 },
  { area: 'src/report', percent: 71 },
  { area: 'src/components', percent: 12 },
];

/* ── local pieces ──────────────────────────────────────────────────────────
   A report is allowed its own small components. These two are the shapes every
   report wants and the system does not have a primitive for. */

/**
 * The headline outcome, above everything else.
 *
 * The word carries the meaning; the colour only reinforces it. Read this aloud
 * over the phone and it still works, which is the test.
 */
function Verdict({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`flex items-center gap-4 border-4 p-5 shadow-hard-md ${
        ok ? 'border-intent-success' : 'border-intent-danger'
      }`}
    >
      <span
        className={`font-display text-2xl font-bold uppercase tracking-tight ${
          ok ? 'text-intent-success' : 'text-intent-danger'
        }`}
      >
        {ok ? 'Passed' : 'Failed'}
      </span>
      <span className="font-mono text-sm text-content-secondary">{children}</span>
    </div>
  );
}

/**
 * A bar, drawn with a div and a width.
 *
 * A report usually wants one chart and no charting library. The colour comes
 * from `accentVar()` because the role is decided at runtime — the counterpart
 * rule to `accentTextClass()`, and the reason a literal hex would be both a lint
 * error and wrong on half the ladder.
 */
function Bar({ percent, accent }: { percent: number; accent: AccentToken }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-4 flex-1 border-2 border-edge-strong bg-surface-sunken"
        role="img"
        aria-label={`${percent} percent`}
      >
        <div
          className="h-full"
          style={{ width: `${percent}%`, backgroundColor: accentVar(accent) }}
        />
      </div>
      <span className="w-12 text-right font-mono text-sm tabular-nums text-content-secondary">
        {percent}%
      </span>
    </div>
  );
}

/* ── the report ────────────────────────────────────────────────────────── */

const SECTIONS = ['Summary', 'Checks', 'Coverage', 'Advisories', 'Reproducing'];

export default function Report() {
  const failed = CHECKS.filter((c) => c.status === 'fail');

  return (
    <ReportDocument
      title="Quality Gate"
      subtitle="Every gated check on this branch, what failed, and what the failure is asking for."
      meta={[
        { label: 'Generated', value: '2026-08-19 15:42 UTC' },
        { label: 'Commit', value: <code>acf0345</code> },
        { label: 'Branch', value: 'main' },
        { label: 'Duration', value: '4.5s' },
      ]}
    >
      <Verdict ok={failed.length === 0}>
        {failed.length} of {CHECKS.length} checks failing — {failed.map((c) => c.check).join(', ')}
      </Verdict>

      {/* Contents. Worth it past about four sections, and free: every
          ReportSection already has an id derived from its title. */}
      <nav aria-label="Contents" className="flex flex-wrap gap-2 print:hidden">
        {SECTIONS.map((section) => (
          <Tag key={section} text={section} href={`#${section.toLowerCase()}`} accent="quiet" />
        ))}
      </nav>

      <ReportSection title="Summary">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <StatCard title="Checks" value={CHECKS.length} />
          <StatCard title="Passing" value={4} accent="success" change="+1" changeType="positive" />
          <StatCard title="Failing" value={1} accent="danger" subtitle="check:css" />
          <StatCard title="Skipped" value={1} accent="quiet" subtitle="Linux CI only" />
        </div>
        <NoteBlock type="warning" title="Ratchet, not a cliff">
          `check:css` fails on any rise. Lower the budget as you migrate a component; never raise
          it to make the build green.
        </NoteBlock>
      </ReportSection>

      <ReportSection title="Checks">
        <DataTable
          columns={[
            { header: 'Check', accessor: 'check' },
            {
              header: 'Status',
              accessor: (row: Check) => (
                <Badge accent={STATUS_ACCENT[row.status]}>{row.status}</Badge>
              ),
            },
            {
              header: 'Time',
              accessor: (row: Check) => (
                <span className="tabular-nums">{row.ms ? `${row.ms}ms` : '—'}</span>
              ),
              className: 'text-right',
            },
            { header: 'Detail', accessor: 'detail' },
          ]}
          data={[...CHECKS]}
          keyExtractor={(row) => row.check}
        />

        {/* The failure, in full, folded away. This is the pattern that makes a
            long report readable: nothing is omitted, nothing is in the way. */}
        <ReportDetails summary="check:css — full output" note="8 lines" open>
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-content-secondary">
            {`Styling in CSS — declarations on classes this repo authors

  prose.css   328 declarations   budget 320   OVER by 8

  .docs-sidebar        62
  .docs-toc            48
  .docs-pager          31

Migrate one component per PR with \`recipe\`, then lower the budget line.`}
          </pre>
        </ReportDetails>

        <ReportDetails summary="Environment" note="4 values">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 font-mono text-sm">
            {[
              ['node', 'v22.22.2'],
              ['pnpm', '10.33.0'],
              ['os', 'linux x64'],
              ['ci', 'github-actions'],
            ].map(([key, value]) => (
              <div key={key} className="contents">
                <dt className="text-content-muted">{key}</dt>
                <dd className="text-content-secondary">{value}</dd>
              </div>
            ))}
          </dl>
        </ReportDetails>
      </ReportSection>

      <ReportSection title="Coverage">
        <Card>
          <div className="flex flex-col gap-3">
            {COVERAGE.map((row) => (
              <div key={row.area} className="flex items-center gap-4">
                <span className="w-36 shrink-0 font-mono text-sm text-content-secondary">
                  {row.area}
                </span>
                <Bar
                  percent={row.percent}
                  accent={row.percent >= 80 ? 'success' : row.percent >= 50 ? 'warning' : 'danger'}
                />
              </div>
            ))}
          </div>
        </Card>
      </ReportSection>

      <ReportSection title="Advisories">
        {/* The zero case, designed. An empty region that says nothing at all
            reads as a broken report rather than a clean one. */}
        <DataTable
          columns={[
            { header: 'Package', accessor: 'package' },
            { header: 'Severity', accessor: 'severity' },
          ]}
          data={[] as { package: string; severity: string }[]}
          keyExtractor={(_row, index) => index}
          emptyText="No advisories. 24 packages audited."
        />
      </ReportSection>

      <Divider />

      <ReportSection title="Reproducing">
        <Card>
          <p className="mb-3 text-content-secondary">
            Everything above comes from one command. The failing check is the only one that needs a
            code change.
          </p>
          <pre className="overflow-x-auto border-2 border-edge-subtle bg-surface-sunken p-4 font-mono text-sm text-content-primary">
            {`pnpm install --frozen-lockfile
pnpm check:css --list   # the 8 declarations over budget`}
          </pre>
        </Card>
      </ReportSection>
    </ReportDocument>
  );
}
