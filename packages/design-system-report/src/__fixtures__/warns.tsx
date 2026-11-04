/** Fixture: no colour errors, but both static-output warnings. */
import { Card, ReportDocument } from '@rtkelly-labs/design-system';

export default function Report() {
  return (
    <ReportDocument title="Warns" meta={[{ label: 'Now', value: new Date().toISOString() }]}>
      <Card>
        <p className="text-content-secondary" onClick={() => undefined}>
          Inert.
        </p>
      </Card>
    </ReportDocument>
  );
}
