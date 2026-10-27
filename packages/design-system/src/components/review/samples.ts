/**
 * Sample data for the review pages: one real comparison, trimmed.
 *
 * Parquet.SourceGenerator's derived outputs for one pull request, compared with its merge base
 * 216f6fc — complexity metrics, duplication clusters and the call graph. The figures are the
 * ones that comparison reported. The source diff and the review conversation around it are
 * written for the sample, and say so.
 *
 * Plain `.ts` with `createElement` rather than JSX: this is data, not a component, and the
 * component gates read every `.tsx` under `components/` as one.
 *
 * Exported so a consumer can render either page whole, and so the stories and the applied site
 * read one copy instead of two.
 */

import { createElement } from 'react';
import { StatusMark } from './StatusMark';
import { parseUnifiedDiff, type DiffHunk } from './diff';
import type { PullRequestData } from './PullRequestPage';
import type { ReviewReportData } from './ReviewReportPage';

export const SAMPLE_BASELINE_COMMIT = '216f6fc28cec75077f5b8fa90cd3d7055e81db7b';

export const SAMPLE_DUPLICATION_HUNKS: DiffHunk[] = parseUnifiedDiff(`@@ -5,7 +5,7 @@
 # Method ids are RELATIVE-PATH:Type.Method. No line numbers: a refactor that
 # moves code without changing overlap must not change this report.
 # Emitted/generated code is out of scope by design.
-# totals: clusters=63 duplicated-tokens=8418
+# totals: clusters=63 duplicated-tokens=8398
 K | span=173 copies=2 | ParquetLegacyIncrementalGenerator.Initialize | ParquetIncrementalGenerator.Initialize
 K | span=147 copies=2 | CodeEmitter.EmitPropertyAssignments | CodeEmitter.EmitPropertyAssignmentsIndexed
@@ -28,7 +28,6 @@ K | span=70 copies=2
 K | span=69 copies=2 | CodeEmitter.EmitReadBufferSequentialArrayAsync | CodeEmitter.EmitReadStreamAsync
 K | span=67 copies=2 | VectorizedColumnTransforms.Widen | VectorizedColumnTransforms.Widen
-K | span=67 copies=2 | SchemaComponent.EmitSchema | CompoundSchema.EmitSchema
 K | span=63 copies=2 | VectorizedColumnTransforms.MultiplyScale | VectorizedColumnTransforms.MultiplyScale
@@ -39,6 +38,7 @@ K | span=60 copies=2
 K | span=58 copies=2 | VectorizedColumnTransforms.MultiplyScale | VectorizedColumnTransforms.Widen
+K | span=57 copies=2 | SchemaComponent.EmitSchema | CompoundSchema.EmitSchema
 K | span=55 copies=2 | VectorizedColumnTransforms.ConvertEpochMicrosecondsToTicks | VectorizedColumnTransforms.Narrow
`);

export const SAMPLE_METRICS_HUNKS: DiffHunk[] = parseUnifiedDiff(`@@ -5,7 +5,7 @@
 # MI maintainability index 0-100 (higher is better), CC cyclomatic complexity,
 # CL class coupling, DIT depth of inheritance, SLOC source lines, ELOC executable lines.
 # Ordinal-sorted, so two reports diff cleanly.
-A:Parquet.SourceGenerator | MI=76 CC=1328 CL=155 DIT=1 SLOC=13950 ELOC=4631
+A:Parquet.SourceGenerator | MI=76 CC=1346 CL=155 DIT=1 SLOC=14021 ELOC=4642
@@ -200,11 +200,12 @@
 M:SchemaComponent.EmitResolveSchemaField(StringBuilder, bool, bool) | MI=31 CC=2 CL=1 SLOC=196 ELOC=115
-M:SchemaComponent.EmitSchema(StringBuilder, TargetClassModel) | MI=62 CC=3 CL=4 SLOC=23 ELOC=9
+M:SchemaComponent.EmitSchema(StringBuilder, TargetClassModel, bool) | MI=60 CC=3 CL=4 SLOC=27 ELOC=10
 M:SchemaComponent.EmitStaticFields(StringBuilder, TargetClassModel) | MI=81 CC=2 CL=4 SLOC=12 ELOC=2
-M:SchemaComponent.GetFieldCreationExpression(PropertyModel) | MI=73 CC=5 CL=4 SLOC=46 ELOC=2
+M:SchemaComponent.GetFieldConstructorExpression(PropertyModel) | MI=72 CC=8 CL=4 SLOC=55 ELOC=2
+M:SchemaComponent.GetFieldCreationExpression(PropertyModel, bool) | MI=78 CC=3 CL=2 SLOC=15 ELOC=2
 M:SchemaComponent.PathText(string, bool) | MI=95 CC=2 CL=0 SLOC=9 ELOC=1
@@ -427,8 +432,9 @@
-M:TargetParser.ReadColumnOptions(ISymbol) | MI=47 CC=21 CL=7 SLOC=75 ELOC=21
+M:TargetParser.ReadColumnOptions(ISymbol) | MI=45 CC=24 CL=8 SLOC=78 ELOC=23
+M:TargetParser.ReadTimestampAdjustedToUtc(ISymbol) | MI=69 CC=5 CL=5 SLOC=22 ELOC=5
 M:TargetParser.ReadTimestampUnit(ISymbol) | MI=74 CC=4 CL=4 SLOC=18 ELOC=4
`);

export const SAMPLE_CALLGRAPH_HUNKS: DiffHunk[] = parseUnifiedDiff(`@@ -5,7 +5,7 @@
-# stats: nodes=311 edges=529 call-sites=4141 unresolved=3462
+# stats: nodes=313 edges=530 call-sites=4147 unresolved=3466
@@ -105,7 +105,6 @@
 E:CodeEmitter.EmitResolveSchemaField/(StringBuilder) | SchemaComponent.EmitResolveSchemaField/(StringBuilder,bool,bool)
-E:CodeEmitter.EmitSchema/(StringBuilder,TargetClassModel) | SchemaComponent.EmitSchema/(StringBuilder,TargetClassModel)
 E:CodeEmitter.EmitSchemaHelpers/(StringBuilder) | SchemaComponent.EmitStaticFields/(StringBuilder,TargetClassModel)
`);

const lower = 'lower-is-better' as const;
const higher = 'higher-is-better' as const;

export const DEFAULT_REVIEW_REPORT: ReviewReportData = {
  title: 'Parquet.SourceGenerator review',
  subtitle: 'Derived outputs for the FieldId and AdjustedToUtc change, compared with the merge base.',
  meta: [
    { label: 'Document', value: 'Delta · candidate vs merge-base' },
    { label: 'Comparator', value: 'text.normalized@1 · complexity.v1' },
    { label: 'Delta', value: 'changed' },
    { label: 'Policy', value: 'none applied' },
  ],
  outcome: 'none',
  verdict: 'Delta only. No Assessment was supplied, so nothing below is a pass or a fail.',
  verdictContext: 'Run the policy step to get an outcome. The comparison stays the same either way.',
  provenance: [
    { label: 'Subject', value: 'Parquet.SourceGenerator', note: 'candidate · pull request head' },
    { label: 'Baseline role', value: 'merge-base', note: 'what did this change?' },
    { label: 'Baseline commit', value: SAMPLE_BASELINE_COMMIT },
    { label: 'Source store', value: 'CI artifact', note: 'derived-baseline-216f6fc · run 39335334212' },
    { label: 'Trust', value: createElement(StatusMark, { vocabulary: 'trust', status: 'candidate' }), note: 'no promotion record, so it cannot gate' },
    { label: 'Manifest digest', value: createElement(StatusMark, { vocabulary: 'evidence', status: 'unavailable', label: 'not recorded' }) },
  ],
  figures: [
    { label: 'Derived files', value: '7', note: '+77 −50 lines' },
    { label: 'Source files', value: '10', note: '+242 −7 lines' },
    { label: 'Members added', value: '30', note: '6 removed · 29 changed' },
    { label: 'Test methods', value: '+4', note: 'counted by [Fact] and [Theory]' },
  ],
  measurements: [
    {
      caption: 'Hand-written code · complexity.v1',
      identityLabel: 'Assembly',
      columns: [
        { label: 'Maintainability', direction: higher },
        { label: 'Complexity', direction: lower },
        { label: 'Coupling', direction: lower },
        { label: 'Executable lines' },
      ],
      rows: [
        { identity: '…Attributes', values: [{ before: 88, after: 88 }, { before: 194, after: 198 }, { before: 33, after: 33 }, { before: 231, after: 233 }] },
        { identity: '…Legacy', values: [{ before: 79, after: 79 }, { before: 650, after: 668 }, { before: 132, after: 132 }, { before: 1936, after: 1947 }] },
        { identity: 'Parquet.SourceGenerator', values: [{ before: 76, after: 76 }, { before: 1328, after: 1346 }, { before: 155, after: 155 }, { before: 4631, after: 4642 }] },
      ],
    },
    {
      caption: 'Duplication and call graph',
      identityLabel: 'Measure',
      columns: [{ label: 'Value' }],
      rows: [
        { identity: 'Duplicated tokens', values: [{ before: 8418, after: 8398, direction: lower }] },
        { identity: 'Call-graph nodes', values: [{ before: 311, after: 313 }] },
        { identity: 'Call-graph edges', values: [{ before: 529, after: 530 }] },
      ],
    },
  ],
  records: {
    caption: 'Methods by stable id · complexity.v1',
    identityLabel: 'Member',
    columns: [
      { label: 'CC', direction: lower },
      { label: 'SLOC' },
    ],
    rows: [
      { identity: 'SchemaComponent.EmitSchema(StringBuilder, TargetClassModel, bool)', change: 'changed', values: [{ before: 3, after: 3 }, { before: 23, after: 27 }] },
      { identity: 'SchemaComponent.GetFieldCreationExpression(PropertyModel, bool)', change: 'changed', values: [{ before: 5, after: 3 }, { before: 46, after: 15 }] },
      { identity: 'SchemaComponent.GetFieldConstructorExpression(PropertyModel)', change: 'added', values: [{ after: 8 }, { after: 55 }] },
      { identity: 'TargetParser.ReadColumnOptions(ISymbol)', change: 'changed', values: [{ before: 21, after: 24 }, { before: 75, after: 78 }] },
      { identity: 'TargetParser.ReadTimestampAdjustedToUtc(ISymbol)', change: 'added', values: [{ after: 5 }, { after: 22 }] },
    ],
  },
  caveats: [
    {
      title: 'Methodology · call-graph coverage',
      body: 'Only 16% of call sites resolve in the main generator (681 of 4,147). An edge that disappears, such as CodeEmitter.EmitSchema → SchemaComponent.EmitSchema after EmitSchema gained a bool parameter, is more likely a resolution miss than a removed call.',
    },
  ],
  files: [
    { title: 'Duplication', files: [{ path: 'metrics/duplication.txt', hunks: SAMPLE_DUPLICATION_HUNKS }] },
    { title: 'Hand-written code metrics', files: [{ path: 'metrics/Parquet.SourceGenerator.metrics.txt', hunks: SAMPLE_METRICS_HUNKS }] },
    { title: 'Call graph', files: [{ path: 'callgraph/Parquet.SourceGenerator.callgraph.txt', hunks: SAMPLE_CALLGRAPH_HUNKS }] },
  ],
};

/** A source change written for the sample: the parser half of the FieldId work. */
const PARSER_HUNKS: DiffHunk[] = parseUnifiedDiff(`@@ -212,14 +212,17 @@ internal static ColumnOptions ReadColumnOptions(ISymbol symbol)
         var attribute = FindAttribute(symbol, ColumnAttributeNames, ColumnAttributeNamespaces);
         if (attribute is null) return ColumnOptions.Default;
         var name = ReadNamedString(attribute, "Name");
         var order = ReadNamedInt(attribute, "Order") ?? int.MaxValue;
+        var fieldId = ReadNamedInt(attribute, "FieldId");
+        if (fieldId is < 0) throw new InvalidFieldIdException(symbol, fieldId.Value);
         var deduplicate = ReadNamedBool(attribute, "Deduplicate");
         var encoding = ReadEncoding(attribute);
         var required = ReadNamedBool(attribute, "Required");
-        return new ColumnOptions(name, order, deduplicate, encoding, required);
+        return new ColumnOptions(name, order, deduplicate, encoding, required, fieldId);
     }
`);
PARSER_HUNKS[0]!.lines[5]!.comments = [
  {
    author: 'diffra',
    meta: 'complexity.v1 · bot',
    body: 'ReadColumnOptions: cyclomatic complexity 21 → 24 (+3), against the preferred direction. No policy applied, so this is a measurement, not a finding.',
  },
  {
    author: 'marlow',
    meta: 'suggestion',
    body: 'Could the range check live in ColumnOptions instead? Then the Legacy path gets it for free.',
  },
];

const ATTRIBUTE_HUNKS: DiffHunk[] = parseUnifiedDiff(`@@ -41,6 +41,15 @@ public sealed class ParquetColumnAttribute : Attribute
     /// <summary>Overrides the column's dictionary and encoding choice.</summary>
     public ParquetColumnEncoding Encoding { get; set; }

+    /// <summary>
+    /// The Parquet field id written to the schema, for readers that resolve columns
+    /// by id rather than by name. Unset writes no id.
+    /// </summary>
+    public int FieldId
+    {
+        get => _fieldId ?? -1;
+        set => _fieldId = value;
+    }
     /// <summary>The column name. Defaults to the property name.</summary>
     public string? Name { get; set; }
`);
ATTRIBUTE_HUNKS[0]!.lines[7]!.comments = [
  {
    author: 'kestrel',
    meta: 'question',
    body: 'Returning -1 for "unset" leaks into the public API. Would a nullable int read better here?',
  },
];

export const DEFAULT_PULL_REQUEST: PullRequestData = {
  repository: 'rtkelly-labs/Parquet.SourceGenerator',
  number: 412,
  title: 'feat(schema): FieldId and AdjustedToUtc on column attributes',
  state: 'open',
  author: 'rtkelly13',
  base: 'main',
  head: 'feat/field-id',
  opened: 'opened 23 Oct 2026',
  labels: ['schema', 'public-api'],
  description: [
    'Adds FieldId to ParquetColumnAttribute and AdjustedToUtc to ParquetTimestampAttribute, and threads both through PropertyModel and TargetParser so the emitted schema writes them.',
    'Shipped API grows by four members. Generated golden files are unchanged for models that set neither property.',
  ],
  reviewers: [
    { name: 'kestrel', state: 'changes-requested' },
    { name: 'marlow', state: 'commented' },
    { name: 'diffra', state: 'commented' },
    { name: 'tamsin', state: 'pending' },
  ],
  checks: [
    { name: 'ci / build-and-test', status: 'pass', summary: '1,317 tests, 0 failed', duration: '6m 12s' },
    { name: 'ci / golden-files', status: 'pass', summary: '42 golden files unchanged', duration: '1m 48s' },
    { name: 'api / shipped-surface', status: 'needs-review', summary: '4 members added to PublicAPI.Unshipped.txt', duration: '34s' },
    { name: 'diffra / derived-outputs', status: 'none', summary: 'Delta only: 7 derived files changed, no policy applied', duration: '2m 03s' },
    { name: 'coverage / patch', status: 'warn', summary: '81% of changed lines covered, below the 85% target', duration: '58s' },
    { name: 'docs / link-check', status: 'inconclusive', label: 'pending', summary: 'Queued behind 3 runs' },
  ],
  verdict: {
    outcome: 'none',
    title: 'Diffra compared 7 derived files with the merge base. No policy was applied.',
    context: 'Complexity rose by 18 in two assemblies and duplicated tokens fell by 20.',
  },
  conversation: [
    { author: 'diffra', meta: 'bot · 4 minutes after opening', body: 'Derived outputs changed: +77 −50 across 7 files. The baseline is a CI artifact with no promotion record, so this comparison cannot gate.' },
    { author: 'kestrel', meta: 'requested changes', body: 'The FieldId sentinel needs another look before this goes in. Comments are inline.' },
  ],
  files: [
    { path: 'src/Parquet.SourceGenerator/Parser/TargetParser.cs', hunks: PARSER_HUNKS },
    { path: 'src/Parquet.SourceGenerator.Attributes/ParquetColumnAttribute.cs', hunks: ATTRIBUTE_HUNKS },
    { path: 'metrics/Parquet.SourceGenerator.metrics.txt', hunks: SAMPLE_METRICS_HUNKS },
  ],
};
