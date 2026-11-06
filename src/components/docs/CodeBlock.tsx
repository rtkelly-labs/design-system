import { createContext, useCallback, useContext, useRef } from 'react';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { Check, Copy } from 'lucide-react';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { cn } from '../../lib/recipe';

export interface CodeBlockProps extends HTMLAttributes<HTMLPreElement> {
  children: ReactNode;
  /** Filename or caption shown in the header bar. */
  title?: string;
  /** Language tag shown on the right of the header bar. */
  language?: string;
  /** Hide the copy button (e.g. for output-only samples). */
  copyable?: boolean;
  /**
   * Sit flush under a control that draws the top edge — a {@link CodeTabs}
   * strip. Drops the block's own top margin and top rule so the seam between
   * strip and block is one 2px line rather than two stacked ones. Defaults to
   * whatever the nearest {@link CodeBlockAttachment} says, so a fenced block
   * inside a tab panel attaches without the author knowing the prop exists.
   */
  attached?: boolean;
}

/**
 * Tells every `CodeBlock` underneath that it is sitting inside a control that
 * already draws its top edge. Provided by `CodeTabs`; read by `CodeBlock`.
 */
export const CodeBlockAttachment = createContext(false);

/**
 * `.docs-codeblock` is still plain CSS in `prose.css`, and plain CSS is
 * unlayered — it beats every Tailwind utility regardless of source order, so
 * `mt-0 border-t-0` on the wrapper would do nothing. Until the block migrates
 * to a `recipe`, the override has to be inline. Delete this with the migration.
 */
const ATTACHED_STYLE: CSSProperties = { marginTop: 0, borderTopWidth: 0 };

/**
 * Fenced code block with a copy button and an optional filename bar.
 *
 * The copy ref sits on the `<pre>` rather than the outer wrapper so the
 * button's own label never ends up in the clipboard — an easy thing to get
 * wrong when the control is rendered inside the measured element.
 *
 * The button is always in the DOM (revealed on hover/focus via CSS) instead of
 * being conditionally rendered on hover: a mount-on-hover button cannot be
 * reached by keyboard at all.
 */
export function CodeBlock({
  children,
  title,
  language,
  copyable = true,
  attached,
  className = '',
  ...rest
}: CodeBlockProps) {
  const attachedByContext = useContext(CodeBlockAttachment);
  const isAttached = attached ?? attachedByContext;
  const preRef = useRef<HTMLPreElement>(null);
  const { copied, copy } = useCopyToClipboard();

  const onCopy = useCallback(() => {
    const text = preRef.current?.innerText ?? '';
    if (text) void copy(text);
  }, [copy]);

  return (
    <div
      className={cn('docs-codeblock', className)}
      style={isAttached ? ATTACHED_STYLE : undefined}
      data-attached={isAttached ? 'true' : undefined}
    >
      {(title || language) && (
        <div className="docs-codeblock-bar">
          {title && <span className="docs-codeblock-title">{title}</span>}
          {language && <span className="docs-codeblock-lang">{language}</span>}
        </div>
      )}

      <div className="docs-codeblock-body">
        {copyable && (
          <button
            type="button"
            onClick={onCopy}
            className="docs-codeblock-copy"
            data-copied={copied ? 'true' : undefined}
            aria-label={copied ? 'Copied' : 'Copy code'}
            title={copied ? 'Copied!' : 'Copy code'}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        )}
        {/*
          `tabIndex={0}` because the block scrolls horizontally at narrow widths
          (`prose.css` gives it `overflow-x: auto`). A scrollable region that
          cannot be focused cannot be scrolled by keyboard at all — axe's
          `scrollable-region-focusable`, and a real trap rather than a technicality:
          the content is simply unreachable without a pointer.
        */}
        <pre ref={preRef} tabIndex={0} role="region" aria-label={title ?? 'Code'} {...rest}>
          {children}
        </pre>
      </div>
    </div>
  );
}
