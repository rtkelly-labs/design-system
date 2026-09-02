import React, {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type DetailedHTMLProps,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ModalVariant = 'default' | 'cyan' | 'pink' | 'yellow' | 'destructive' | 'terminal';

export interface ModalContextValue {
  isOpen: boolean;
  onClose: () => void;
  titleId: string;
  descriptionId: string;
  variant: ModalVariant;
  size: ModalSize;
  closeOnEscape: boolean;
  closeOnOverlayClick: boolean;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function useModalRootContext(): ModalContextValue {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('Modal compound components must be used within a <Modal> container.');
  }
  return context;
}

// ----------------------------------------------------------------------
// Modal Root Props
// ----------------------------------------------------------------------

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Convenience title for simple usage (when not using compound Modal.Header) */
  title?: string;
  /** Convenience subtitle for simple usage */
  subtitle?: string;
  /** Convenience footer for simple usage (when not using compound Modal.Footer) */
  footer?: ReactNode;
  size?: ModalSize;
  variant?: ModalVariant;
  role?: 'dialog' | 'alertdialog';
  ariaLabel?: string;
  ariaDescribedBy?: string;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  portal?: boolean;
  container?: HTMLElement | null;
  className?: string;
  overlayClassName?: string;
  preventScroll?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
}

// ----------------------------------------------------------------------
// Helpers for Focus Trapping & Elements
// ----------------------------------------------------------------------

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  footer,
  size = 'md',
  variant = 'default',
  role = 'dialog',
  ariaLabel,
  ariaDescribedBy,
  closeOnEscape = true,
  closeOnOverlayClick = true,
  showCloseButton = true,
  portal = true,
  container,
  className = '',
  overlayClassName = '',
  preventScroll = true,
  initialFocusRef,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const generatedTitleId = useId();
  const generatedDescId = useId();
  const titleId = title ? generatedTitleId : generatedTitleId;
  const descriptionId = ariaDescribedBy || generatedDescId;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Body Scroll Locking
  useEffect(() => {
    if (!isOpen || !preventScroll || typeof document === 'undefined') return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, preventScroll]);

  // Focus Management & Trapping
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    previousActiveElementRef.current = document.activeElement as HTMLElement;

    const focusTimer = setTimeout(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else if (dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          dialogRef.current.focus();
        }
      }
    }, 20);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter((el) => el.offsetParent !== null);

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || document.activeElement === dialogRef.current) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, closeOnEscape, onClose, initialFocusRef]);

  if (!isOpen) return null;

  const sizeClasses: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] w-full min-h-[85vh] h-[90vh]',
  };

  const variantBorderShadowClasses: Record<ModalVariant, string> = {
    default: 'border-2 md:border-4 border-white shadow-hard-lg',
    cyan: 'border-2 md:border-4 border-brutalist-cyan shadow-hard-cyan',
    pink: 'border-2 md:border-4 border-brutalist-pink shadow-hard-pink',
    yellow: 'border-2 md:border-4 border-brutalist-yellow shadow-hard-yellow',
    destructive: 'border-2 md:border-4 border-red-500 shadow-hard-pink',
    terminal: 'border-2 md:border-4 border-brutalist-neonGreen shadow-hard-lg',
  };

  const isCompoundUsage = !title && !footer;

  const modalNode = (
    <ModalContext.Provider
      value={{
        isOpen,
        onClose,
        titleId,
        descriptionId,
        variant,
        size,
        closeOnEscape,
        closeOnOverlayClick,
      }}
    >
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn ${overlayClassName}`.trim()}
        onClick={(e) => {
          if (closeOnOverlayClick && e.target === e.currentTarget) {
            onClose();
          }
        }}
        data-testid="modal-backdrop"
      >
        <div
          ref={dialogRef}
          role={role}
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={ariaDescribedBy ? descriptionId : undefined}
          aria-label={ariaLabel}
          tabIndex={-1}
          className={`w-full ${sizeClasses[size]} bg-zinc-950 text-white ${variantBorderShadowClasses[variant]} font-mono flex flex-col focus:outline-none animate-modal-in ${className}`.trim()}
          data-testid="modal-container"
        >
          {isCompoundUsage ? (
            children
          ) : (
            <>
              {/* Legacy / Simple Header */}
              {title && (
                <ModalHeader
                  title={title}
                  subtitle={subtitle}
                  showCloseButton={showCloseButton}
                  onClose={onClose}
                  variant={variant}
                />
              )}

              {/* Legacy / Simple Body */}
              <ModalBody>{children}</ModalBody>

              {/* Legacy / Simple Footer */}
              {footer !== undefined ? (
                footer && <ModalFooter>{footer}</ModalFooter>
              ) : (
                <ModalFooter>
                  <Button
                    onClick={onClose}
                    variant={variant === 'pink' || variant === 'destructive' ? 'pink' : 'cyan'}
                    bracketed
                    size="sm"
                  >
                    CLOSE
                  </Button>
                </ModalFooter>
              )}
            </>
          )}
        </div>
      </div>
    </ModalContext.Provider>
  );

  if (!portal || !mounted || typeof document === 'undefined') {
    return modalNode;
  }

  const targetContainer = container || document.body;
  return createPortal(modalNode, targetContainer);
}

// ----------------------------------------------------------------------
// Compound Subcomponents
// ----------------------------------------------------------------------

export interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  badge?: ReactNode;
  showCloseButton?: boolean;
  onClose?: () => void;
  variant?: ModalVariant;
  bracketed?: boolean;
  children?: ReactNode;
}

export function ModalHeader({
  title,
  subtitle,
  badge,
  showCloseButton = true,
  onClose,
  variant,
  bracketed = true,
  children,
  className = '',
  ...props
}: ModalHeaderProps) {
  let contextClose: (() => void) | undefined;
  let contextVariant: ModalVariant = 'default';
  let titleId: string | undefined;

  try {
    const ctx = useModalRootContext();
    contextClose = ctx.onClose;
    contextVariant = ctx.variant;
    titleId = ctx.titleId;
  } catch {
    // Rendered outside of context fallback
  }

  const activeClose = onClose || contextClose;
  const activeVariant = variant || contextVariant;

  const headerBorderClasses: Record<ModalVariant, string> = {
    default: 'border-b-2 border-white bg-black',
    cyan: 'border-b-2 border-brutalist-cyan bg-black',
    pink: 'border-b-2 border-brutalist-pink bg-black',
    yellow: 'border-b-2 border-brutalist-yellow bg-black',
    destructive: 'border-b-2 border-red-500 bg-red-950/30',
    terminal: 'border-b-2 border-brutalist-neonGreen bg-black',
  };

  const titleAccentClasses: Record<ModalVariant, string> = {
    default: 'text-white',
    cyan: 'text-brutalist-cyan',
    pink: 'text-brutalist-pink',
    yellow: 'text-brutalist-yellow',
    destructive: 'text-red-400',
    terminal: 'text-brutalist-neonGreen',
  };

  return (
    <div
      className={`flex items-start justify-between px-5 py-4 ${headerBorderClasses[activeVariant]} ${className}`.trim()}
      {...props}
    >
      <div className="flex-1 pr-4">
        {children ? (
          children
        ) : (
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              {title && (
                <h3
                  id={titleId}
                  className={`font-display text-lg sm:text-xl font-bold uppercase tracking-wider ${titleAccentClasses[activeVariant]}`}
                >
                  {bracketed ? `[ ${title} ]` : title}
                </h3>
              )}
              {badge && <div>{badge}</div>}
            </div>
            {subtitle && (
              <p className="font-mono text-xs text-zinc-400 mt-1">&gt; {subtitle}</p>
            )}
          </div>
        )}
      </div>

      {showCloseButton && activeClose && (
        <ModalCloseButton onClick={activeClose} variant={activeVariant} />
      )}
    </div>
  );
}

export interface ModalTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  bracketed?: boolean;
  variant?: ModalVariant;
  children: ReactNode;
}

export function ModalTitle({
  bracketed = true,
  variant,
  children,
  className = '',
  ...props
}: ModalTitleProps) {
  let contextVariant: ModalVariant = 'default';
  let titleId: string | undefined;

  try {
    const ctx = useModalRootContext();
    contextVariant = ctx.variant;
    titleId = ctx.titleId;
  } catch {
    // fallback
  }

  const activeVariant = variant || contextVariant;

  const titleAccentClasses: Record<ModalVariant, string> = {
    default: 'text-white',
    cyan: 'text-brutalist-cyan',
    pink: 'text-brutalist-pink',
    yellow: 'text-brutalist-yellow',
    destructive: 'text-red-400',
    terminal: 'text-brutalist-neonGreen',
  };

  return (
    <h3
      id={titleId}
      className={`font-display text-lg sm:text-xl font-bold uppercase tracking-wider ${titleAccentClasses[activeVariant]} ${className}`.trim()}
      {...props}
    >
      {bracketed ? (
        <span className="inline-flex items-center gap-1.5">
          <span className="select-none text-zinc-500">[</span>
          <span>{children}</span>
          <span className="select-none text-zinc-500">]</span>
        </span>
      ) : (
        children
      )}
    </h3>
  );
}

export interface ModalDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export function ModalDescription({ children, className = '', ...props }: ModalDescriptionProps) {
  let descriptionId: string | undefined;
  try {
    const ctx = useModalRootContext();
    descriptionId = ctx.descriptionId;
  } catch {
    // fallback
  }

  return (
    <p
      id={descriptionId}
      className={`font-mono text-xs sm:text-sm text-zinc-400 leading-relaxed ${className}`.trim()}
      {...props}
    >
      {children}
    </p>
  );
}

export interface ModalBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function ModalBody({ children, className = '', ...props }: ModalBodyProps) {
  return (
    <div
      className={`p-5 sm:p-6 text-white text-sm leading-relaxed font-sans overflow-y-auto max-h-[70vh] ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}

export interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'right' | 'between' | 'center';
  children: ReactNode;
}

export function ModalFooter({
  align = 'right',
  children,
  className = '',
  ...props
}: ModalFooterProps) {
  let contextVariant: ModalVariant = 'default';
  try {
    const ctx = useModalRootContext();
    contextVariant = ctx.variant;
  } catch {
    // fallback
  }

  const borderFooterClasses: Record<ModalVariant, string> = {
    default: 'border-t-2 border-white bg-black',
    cyan: 'border-t-2 border-brutalist-cyan bg-black',
    pink: 'border-t-2 border-brutalist-pink bg-black',
    yellow: 'border-t-2 border-brutalist-yellow bg-black',
    destructive: 'border-t-2 border-red-500 bg-red-950/20',
    terminal: 'border-t-2 border-brutalist-neonGreen bg-black',
  };

  const alignClasses: Record<'left' | 'right' | 'between' | 'center', string> = {
    left: 'justify-start',
    right: 'justify-end',
    between: 'justify-between',
    center: 'justify-center',
  };

  return (
    <div
      className={`px-5 py-4 flex items-center gap-3 flex-wrap ${borderFooterClasses[contextVariant]} ${alignClasses[align]} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}

export interface ModalCloseButtonProps
  extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
  variant?: ModalVariant;
}

export function ModalCloseButton({
  variant = 'default',
  className = '',
  onClick,
  ...props
}: ModalCloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-white hover:text-black hover:bg-brutalist-pink font-mono font-bold text-sm px-2.5 py-1 border-2 border-white bg-zinc-900 transition-colors focus:outline-none focus:ring-2 focus:ring-brutalist-cyan cursor-pointer ${className}`.trim()}
      aria-label="Close dialog"
      data-testid="modal-close-button"
      {...props}
    >
      ✕
    </button>
  );
}

// ----------------------------------------------------------------------
// Attach Compound Subcomponents to Modal
// ----------------------------------------------------------------------

Modal.Header = ModalHeader;
Modal.Title = ModalTitle;
Modal.Description = ModalDescription;
Modal.Body = ModalBody;
Modal.Content = ModalBody;
Modal.Footer = ModalFooter;
Modal.CloseButton = ModalCloseButton;

export default Modal;
