'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Switch, useOptionalToast } from '@rtkelly-labs/design-system';

/**
 * Pieces the settings examples share. None of these exist in the package; each
 * is recorded as a gap in the evaluation findings (SAVE-BAR, COPY, SETTING-ROW).
 */

/** A section heading with a lede, the unit a long settings page is cut into. */
export function SectionHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="flex flex-col gap-1 border-b-2 border-edge-strong pb-3">
      <h2 className="m-0 font-display text-2xl font-bold uppercase text-content-primary">{title}</h2>
      {children ? <p className="m-0 font-sans text-sm text-content-secondary">{children}</p> : null}
    </header>
  );
}

/** A switch on its own row, with the helper line beneath it. */
export function SettingRow({
  id,
  label,
  helperText,
  checked,
  onCheckedChange,
  disabled,
}: {
  id: string;
  label: string;
  helperText: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="border-b border-edge-subtle py-3 last:border-b-0">
      <Switch
        id={id}
        label={label}
        helperText={helperText}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}

/**
 * Pinned to the bottom of the viewport while a form differs from what was
 * saved. A status region, so "3 unsaved changes" is announced when it appears.
 */
export function SaveBar({
  dirtyCount,
  onDiscard,
  saving,
}: {
  dirtyCount: number;
  onDiscard: () => void;
  saving?: boolean;
}) {
  return (
    <div
      className="sticky bottom-0 z-10 mt-8 flex flex-wrap items-center gap-3 border-t-2 border-edge-strong bg-surface-raised px-4 py-3 shadow-hard-sm"
      data-dirty={dirtyCount > 0}
    >
      <p role="status" className="m-0 mr-auto font-mono text-sm text-content-secondary">
        {dirtyCount > 0 ? `> ${dirtyCount} unsaved ${dirtyCount === 1 ? 'change' : 'changes'}` : '> all changes saved'}
      </p>
      <Button appearance="raised" type="button" variant="inverse" size="sm" onClick={onDiscard} disabled={dirtyCount === 0 || saving}>
        DISCARD
      </Button>
      <Button appearance="raised" type="submit" variant="primary" size="sm" bracketed disabled={dirtyCount === 0 || saving}>
        {saving ? 'SAVING' : 'SAVE CHANGES'}
      </Button>
    </div>
  );
}

/**
 * Copies `value`, then says so in a status region. The clipboard is reached
 * from the click handler only, which is the one place the browser permits it.
 */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const toast = useOptionalToast();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current !== null) clearTimeout(timer.current);
  }, []);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast?.show({ intent: 'success', title: 'Copied to clipboard', timeout: 2500 });
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      toast?.show({ intent: 'warning', title: 'Copy blocked', description: 'Select the value and copy it by hand.' });
    }
  }
  return (
    <Button appearance="raised" type="button" size="sm" variant="secondary" onClick={copy} aria-label={`Copy ${label}`}>
      {copied ? 'COPIED' : 'COPY'}
    </Button>
  );
}
