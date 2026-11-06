import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseCopyToClipboardResult {
  /** True for `resetAfter` ms following a successful copy. */
  copied: boolean;
  /** True if the last attempt threw — permissions, insecure context, no API. */
  failed: boolean;
  copy: (value: string) => Promise<boolean>;
}

/**
 * Clipboard write with transient "copied" feedback.
 *
 * Falls back to a hidden `<textarea>` + `document.execCommand('copy')` when the
 * async Clipboard API is unavailable. That matters more than it looks: the API
 * requires a secure context, so a docs site opened over plain `http://` on a
 * LAN address — exactly how you'd preview a static build — has no
 * `navigator.clipboard` at all, and the copy-link affordance would silently do
 * nothing.
 */
export function useCopyToClipboard(resetAfter = 2000): UseCopyToClipboardResult {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const copy = useCallback(
    async (value: string): Promise<boolean> => {
      const ok = await writeToClipboard(value);

      setCopied(ok);
      setFailed(!ok);

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setCopied(false);
        setFailed(false);
      }, resetAfter);

      return ok;
    },
    [resetAfter],
  );

  return { copied, failed, copy };
}

async function writeToClipboard(value: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall through to the execCommand path.
    }
  }

  if (typeof document === 'undefined') return false;

  try {
    const el = document.createElement('textarea');
    el.value = value;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.top = '-9999px';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}
