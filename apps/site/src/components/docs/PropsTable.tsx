import { Badge, Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/ds';
import { componentDoc } from '@/lib/docs-data';
import { Inline } from './Inline';

/**
 * A component's props, exactly as react-docgen-typescript reads them from the
 * package source — the same extractor and options Storybook's props table
 * uses. Nothing here is typed by hand, so a renamed prop or a new JSDoc shows
 * up on the next build.
 *
 * The first paragraph of each description is shown; the rest (this package
 * writes long rationale into its JSDoc) folds behind a disclosure.
 */
export function PropsTable({ name }: { name: string }) {
  const doc = componentDoc(name);
  if (doc.props.length === 0) {
    return <p>{name} takes no documented props of its own.</p>;
  }
  return (
    <div className="not-prose my-6">
      <Table label={`${name} props`}>
        <TableCaption className="sr-only">{name} props</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>PROP</TableHead>
            <TableHead>TYPE</TableHead>
            <TableHead>DEFAULT</TableHead>
            <TableHead>DESCRIPTION</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {doc.props.map((prop) => {
            const [first, ...rest] = prop.description.split(/\n\s*\n/);
            return (
              <TableRow key={prop.name}>
                <TableHead scope="row" className="align-top whitespace-nowrap">
                  <code className="font-mono text-sm text-accent-primary">{prop.name}</code>
                  {prop.required ? (
                    <span className="ml-2 align-middle">
                      <Badge accent="warning">REQUIRED</Badge>
                    </span>
                  ) : null}
                </TableHead>
                <TableCell className="align-top">
                  <code className="font-mono text-xs break-words text-content-secondary">{prop.type}</code>
                </TableCell>
                <TableCell className="align-top">
                  {prop.defaultValue ? (
                    <code className="font-mono text-xs">{prop.defaultValue}</code>
                  ) : (
                    <span className="text-content-muted" aria-label="none">
                      —
                    </span>
                  )}
                </TableCell>
                <TableCell className="min-w-64 align-top font-sans text-sm normal-case">
                  {first ? <Inline text={first.replace(/\s+/g, ' ')} /> : <span className="text-content-muted">—</span>}
                  {rest.length ? (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-mono text-xs uppercase text-content-muted">More</summary>
                      {rest.map((para, i) => (
                        <p key={i} className="mt-2">
                          <Inline text={para.replace(/\s+/g, ' ')} />
                        </p>
                      ))}
                    </details>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
