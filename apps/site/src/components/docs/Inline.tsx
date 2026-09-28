import { Fragment } from 'react';

/**
 * The one piece of markup page metadata may carry: `backticks` become
 * `<code>`. Descriptions stay plain strings, so the search index can read them
 * without rendering anything.
 */
export function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/g).map((part, i) =>
        part.startsWith('`') && part.endsWith('`') ? (
          <code key={i}>{part.slice(1, -1)}</code>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
