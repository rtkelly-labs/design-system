# 📄 @rtkelly-labs/design-system-report

Render a `.tsx` file to **one self-contained `.html` file** — markup and every
byte of CSS it needs, inlined. No build step, nothing to serve, styled by
[`@rtkelly-labs/design-system`](../design-system).

```bash
pnpm add -D @rtkelly-labs/design-system @rtkelly-labs/design-system-report esbuild tailwindcss
npx ds-report audit.tsx --theme white              # → audit.html
npx ds-report audit.tsx --theme midnight,sketch    # both rungs, one render
```

```tsx
// audit.tsx — the whole contract is a default export
import { ReportDocument, ReportSection, StatCard, NoteBlock } from '@rtkelly-labs/design-system';

export default function Report() {
  return (
    <ReportDocument
      title="Dependency Audit"
      subtitle="Three packages are held back; one is now unblocked."
      meta={[{ label: 'Generated', value: '2026-08-19' }]}
    >
      <ReportSection title="Summary">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard title="Packages" value={42} />
          <StatCard title="Outdated" value={3} accent="warning" />
          <StatCard title="Vulnerable" value={0} accent="success" />
        </div>
        <NoteBlock>Bump `tsup` once its dts worker stops injecting `baseUrl`.</NoteBlock>
      </ReportSection>
    </ReportDocument>
  );
}
```

## Why the CSS is minimal

Tailwind normally scans source text and has to over-approximate. This pipeline
**renders first**, reads the class attributes out of the finished HTML, and
compiles exactly those — so the stylesheet is both minimal and complete, with no
safelist and no scanner. A typical report is ~50kB all-in.

## Checked before it renders

**Typechecked** with your own TypeScript, resolved from the report's directory —
esbuild strips types without reading them, so without this a wrong prop is not an
error but a report with `[object Object]` in it. Adds about 850ms.

**Linted** against the design system's own rules. Colours must address roles — a
hex literal renders identically on `midnight` and on `sketch`, so those four rules
block. Two more warn: values that change between runs (`new Date()`,
`Math.random()`) and behaviour that cannot run (`onClick`, `useState`) in a
document with no client JS.

| Flag | |
|---|---|
| `-o, --output <file>` | Default: the input with an `.html` extension. |
| `-t, --theme <rungs>` | Comma-separated: `midnight` · `sketch`. Default `sketch`. |
| `--title <text>` | Document `<title>`. Default: the input's filename. |
| `--offline` | Drop the webfont import. Type falls back to the system stacks. |
| `--strict` | Treat lint warnings as errors. Use this in CI. |
| `--no-lint` | Skip the lint, for a file you did not write. |
| `--no-typecheck` | Skip the type check. It is on by default. |

Several inputs or several levels in one invocation share the expensive work: the
whole ladder from one file takes 603ms against 2402ms for four separate runs.

## Peers

`@rtkelly-labs/design-system`, `react`, `react-dom`, `esbuild` and `tailwindcss` are
required. `typescript` and `@tailwindcss/typography` are optional — without the
first the report is not typechecked, without the second the prose layer is
skipped; the CLI says so in both cases rather than failing.

The design system is resolved **from the report's own directory**, so a report
renders against the copy its project installed.

## More

`dist/templates/template.tsx` is what you copy; `dist/templates/sample.tsx` is
the full worked example — verdict-first layout, collapsible `<details>` sections
that need no script, a chart with no charting library, a designed empty state.
[`docs/reports.md`](./docs/reports.md) is the reference: report design and its
sources, the determinism and speed numbers, and which components render inert
without client JS.

`renderReport()` and `renderReports()` are exported for calling the pipeline from
code.

MIT © Ryan Kelly
