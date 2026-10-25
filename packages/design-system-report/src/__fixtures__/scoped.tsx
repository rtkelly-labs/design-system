/**
 * Fixture: a differently-themed panel inside a report.
 *
 * `dim` is chosen deliberately — it is neither the document's level (`white`)
 * nor ThemeProvider's own default, so the assertion cannot pass by accident if
 * the prop stops being read. An earlier version of this fixture used a `level`
 * prop that does not exist; React dropped it silently and the panel rendered the
 * default, which looked exactly like success.
 */
import { Card, ReportDocument, ThemeProvider } from '@rtkelly-labs/design-system';

export default function Report() {
  return (
    <ReportDocument title="Scoped">
      <ThemeProvider defaultLevel="sketch" scoped persist={false}>
        <Card>
          <p className="text-content-secondary">A dim panel inside a white report.</p>
        </Card>
      </ThemeProvider>
    </ReportDocument>
  );
}
