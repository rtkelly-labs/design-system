import { parseUnifiedDiff, type ChangeIndexGroup } from '../../components/review';

/**
 * A real review: Parquet.SourceGenerator's derived outputs for one pull request against its
 * merge base, 216f6fc. Trimmed to a few hunks so the stories stay readable.
 */
export const DUPLICATION_DIFF = parseUnifiedDiff(`@@ -5,7 +5,7 @@
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

export const CALLGRAPH_DIFF = parseUnifiedDiff(`@@ -5,7 +5,7 @@
-# stats: nodes=311 edges=529 call-sites=4141 unresolved=3462
+# stats: nodes=313 edges=530 call-sites=4147 unresolved=3466
@@ -105,7 +105,6 @@
 E:CodeEmitter.EmitResolveSchemaField/(StringBuilder) | SchemaComponent.EmitResolveSchemaField/(StringBuilder,bool,bool)
-E:CodeEmitter.EmitSchema/(StringBuilder,TargetClassModel) | SchemaComponent.EmitSchema/(StringBuilder,TargetClassModel)
 E:CodeEmitter.EmitSchemaHelpers/(StringBuilder) | SchemaComponent.EmitStaticFields/(StringBuilder,TargetClassModel)
`);

export const CHANGE_GROUPS: ChangeIndexGroup[] = [
  { title: 'Duplication', files: [{ path: 'metrics/duplication.txt', added: 2, removed: 2 }] },
  {
    title: 'Hand-written code metrics',
    files: [
      { path: 'metrics/Parquet.SourceGenerator.Attributes.metrics.txt', added: 10, removed: 4 },
      { path: 'metrics/Parquet.SourceGenerator.Legacy.metrics.txt', added: 26, removed: 17 },
      { path: 'metrics/Parquet.SourceGenerator.metrics.txt', added: 23, removed: 14 },
    ],
  },
  {
    title: 'Call graph',
    files: [
      { path: 'callgraph/Parquet.SourceGenerator.Legacy.callgraph.txt', added: 8, removed: 5 },
      { path: 'callgraph/Parquet.SourceGenerator.callgraph.txt', added: 7, removed: 6 },
      { path: 'callgraph/callgraph.md', added: 1, removed: 2 },
    ],
  },
];

export const BASELINE_COMMIT = '216f6fc28cec75077f5b8fa90cd3d7055e81db7b';
