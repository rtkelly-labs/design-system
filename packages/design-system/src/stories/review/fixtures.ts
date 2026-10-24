import type { ChangeIndexGroup } from '../../components/review';

/**
 * The review stories' data. The hunks are the package's own samples, so a story and the applied
 * site draw the same comparison; only the index groups, which no sample needs, are written here.
 */
export {
  SAMPLE_BASELINE_COMMIT as BASELINE_COMMIT,
  SAMPLE_CALLGRAPH_HUNKS as CALLGRAPH_DIFF,
  SAMPLE_DUPLICATION_HUNKS as DUPLICATION_DIFF,
} from '../../components/review/samples';

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
