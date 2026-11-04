import { Card, ReportDocument } from '@rtkelly-labs/design-system';

export default function Report() {
  return (
    <ReportDocument title="Bad" meta={[{ label: 'Now', value: new Date().toISOString() }]}>
      <Card className="bg-zinc-900 text-cyan-400">
        <p style={{ color: '#22d3ee' }} onClick={() => alert('hi')}>Clicky</p>
      </Card>
    </ReportDocument>
  );
}
