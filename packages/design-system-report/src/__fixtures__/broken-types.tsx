import { StatCard, ReportDocument } from '@rtkelly-labs/design-system';

export default function Report() {
  return (
    <ReportDocument title="Broken">
      <StatCard title="Count" value={{ nope: true }} accent="not-a-role" />
      {undeclared}
    </ReportDocument>
  );
}
