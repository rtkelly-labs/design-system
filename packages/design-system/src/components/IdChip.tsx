'use client';

import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { recipe } from '../lib/recipe';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { SiteLink } from './LinkProvider';
import { Tooltip } from './Tooltip';
import { truncateId } from '../lib/ids';

export interface IdChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children' | 'onCopy'> {
  /** The identifier — a trace id, span id or request id. Copied, linked and announced in full. */
  value: string;
  /** What kind of id it is, shown before it in small caps: `trace`, `span`, `req`. */
  label?: string;
  /** How many leading characters to show before `…`. Default `8`; `0` shows the whole id. */
  truncate?: number;
  /** Makes the id a link — to the trace page, say. The copy button stays separate. */
  href?: string;
  /** Show the copy button. Default `true`. */
  copyable?: boolean;
  /** Called after a copy attempt, with whether it succeeded. */
  onCopy?: (value: string, ok: boolean) => void;
}

const idChip = recipe({
  slots: {
    root: 'inline-flex max-w-full items-stretch border border-edge-default bg-surface-sunken font-mono text-xs leading-tight text-content-primary',
    label: 'flex items-center border-r border-edge-default px-1 text-[0.625rem] uppercase tracking-wider text-content-muted',
    value: 'flex items-center whitespace-nowrap px-1 py-0.5 tabular-nums',
    link: 'text-accent-primary underline decoration-dotted underline-offset-2 hover:decoration-solid',
    copy:
      'flex cursor-pointer items-center border-l border-edge-default px-1 text-content-secondary hover:bg-surface-raised hover:text-content-primary',
    copied: 'text-intent-success',
    failed: 'text-intent-danger',
  },
});


/**
 * A compact, monospace identifier — trace, span or request id — sized for a
 * table cell or a log row: the first eight characters and `…`, with the full
 * value in the accessible name and a tooltip, and a button that copies it.
 *
 * With `href` the id is a link (through `LinkProvider`, so an app's router
 * handles it); the copy button stays a separate control beside it, so copying
 * never navigates. After a copy the button reads `Copied` for two seconds,
 * announced as a status.
 */
export const IdChip = forwardRef<HTMLSpanElement, IdChipProps>(function IdChip(
  { value, label, truncate = 8, href, copyable = true, onCopy, className, ...props },
  ref,
) {
  const styles = idChip();
  const { copied, failed, copy } = useCopyToClipboard();
  const shown = truncateId(value, truncate);
  const name = label ? `${label} ${value}` : value;
  const kind = label ? `${label} ID` : 'ID';

  const text = (
    <>
      <span aria-hidden="true">{shown}</span>
      <span className="sr-only">{name}</span>
    </>
  );

  const id = href ? (
    <SiteLink href={href} data-slot="id-chip-value" className={styles.value({ class: styles.link() })}>
      {text}
    </SiteLink>
  ) : (
    <span data-slot="id-chip-value" className={styles.value()}>
      {text}
    </span>
  );

  return (
    <span ref={ref} data-slot="id-chip" {...props} className={styles.root({ className })}>
      {label ? (
        <span aria-hidden="true" data-slot="id-chip-label" className={styles.label()}>
          {label}
        </span>
      ) : null}
      {shown === value ? id : <Tooltip content={value}>{id}</Tooltip>}
      {copyable ? (
        <button
          type="button"
          data-slot="id-chip-copy"
          aria-label={`Copy ${kind} ${value}`}
          onClick={async () => {
            const ok = await copy(value);
            onCopy?.(value, ok);
          }}
          className={styles.copy()}
        >
          <span aria-hidden="true" className={copied ? styles.copied() : failed ? styles.failed() : undefined}>
            {copied ? '✓ Copied' : failed ? '✕ Failed' : '⧉'}
          </span>
        </button>
      ) : null}
      {copyable ? (
        <span role="status" className="sr-only">
          {copied ? 'Copied' : failed ? 'Copy failed' : ''}
        </span>
      ) : null}
    </span>
  );
});

IdChip.displayName = 'IdChip';
