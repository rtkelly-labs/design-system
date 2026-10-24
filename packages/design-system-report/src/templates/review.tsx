/**
 * A review report, the document a comparison tool emits for a pull request. Copy it, replace
 * the data with your own comparison, render it:
 *
 *   ds-report review.tsx --theme midnight,sketch
 *
 * `DEFAULT_REVIEW_REPORT` is a real comparison to start from: Parquet.SourceGenerator's derived
 * outputs against their merge base. Replace it field by field — the shape is `ReviewReportData`,
 * and `parseUnifiedDiff` turns `git diff` output into the hunks each file needs.
 *
 * Every part is static-safe: the files fold as `<details>` and the index links are anchors, so
 * the output needs no script and opens straight from a CI artifact.
 *
 * This file is shipped as a reference and is not imported by the package.
 */

import { DEFAULT_REVIEW_REPORT, ReviewReportPage, type ReviewReportData } from '@rtkelly-labs/design-system';

const report: ReviewReportData = DEFAULT_REVIEW_REPORT;

export default function Review() {
  return <ReviewReportPage report={report} />;
}
