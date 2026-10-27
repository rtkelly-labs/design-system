import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { diffAnchor } from './diff';
import { ReviewReportPage } from './ReviewReportPage';
import { DEFAULT_REVIEW_REPORT } from './samples';

describe('ReviewReportPage', () => {
  it('leads with the verdict, then provenance, then the detail', () => {
    const { container } = render(<ReviewReportPage report={DEFAULT_REVIEW_REPORT} />);
    const order = ['verdict-band', 'provenance-strip', 'review-report-figures', 'change-index'].map((slot) => container.querySelector(`[data-slot="${slot}"]`)!);
    for (let i = 1; i < order.length; i++) {
      expect(order[i - 1]!.compareDocumentPosition(order[i]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    expect(screen.getByRole('status').getAttribute('data-outcome')).toBe('none');
  });

  it('draws every changed file and opens only the largest', () => {
    const { container } = render(<ReviewReportPage report={DEFAULT_REVIEW_REPORT} />);
    const files = [...container.querySelectorAll('details[data-slot="diff-view"]')] as HTMLDetailsElement[];
    expect(files).toHaveLength(3);
    expect(files.filter((f) => f.open).map((f) => f.id)).toEqual([diffAnchor('metrics/Parquet.SourceGenerator.metrics.txt')]);
  });

  it('marks a move against a column direction', () => {
    render(<ReviewReportPage report={DEFAULT_REVIEW_REPORT} />);
    const table = screen.getByRole('table', { name: 'Hand-written code · complexity.v1' });
    expect(within(table).getAllByText(/against the preferred direction/).length).toBe(3);
  });

  it('omits sections it has no data for', () => {
    render(<ReviewReportPage report={{ ...DEFAULT_REVIEW_REPORT, measurements: undefined, records: undefined, figures: undefined }} />);
    expect(screen.queryByRole('heading', { name: 'Measured drift' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Records by identity' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Changed files' })).toBeTruthy();
  });

  it('keeps the caveats when there are no measurements', () => {
    const caveats = [{ title: 'Methodology', body: 'Counts are per assembly.' }];
    render(<ReviewReportPage report={{ ...DEFAULT_REVIEW_REPORT, measurements: undefined, caveats }} />);
    expect(screen.queryByRole('heading', { name: 'Measured drift' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Caveats' })).toBeTruthy();
    expect(screen.getByText('Counts are per assembly.')).toBeTruthy();
  });
});
