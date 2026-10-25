/**
 * Fixture for `render.test.ts`. Kept deliberately small, and deliberately real:
 * it imports the package by name so the test exercises the alias the renderer
 * installs, and it uses one arbitrary value so the candidate extraction is
 * tested against the case a text scanner is worst at.
 */

import { ReportDocument } from '@rtkelly-labs/design-system';

export default function Fixture() {
  return (
    <ReportDocument title="Fixture" meta={[{ label: 'Kind', value: 'test' }]}>
      <p className="text-[0.8125rem] text-content-secondary">Body copy.</p>
    </ReportDocument>
  );
}
