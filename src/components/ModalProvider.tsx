import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Modal, type ModalSize, type ModalVariant } from './Modal';
import { Button } from './Button';

export interface ConfirmOptions {
  title?: string;
  message: ReactNode;
  subtitle?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ModalVariant;
  size?: ModalSize;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
}

export interface DynamicModalOptions {
  title?: string;
  subtitle?: string;
  size?: ModalSize;
  variant?: ModalVariant;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  footer?: ReactNode;
  onClose?: () => void;
}

export interface DynamicModalItem {
  id: string;
  content: ReactNode | ((helpers: { close: () => void }) => ReactNode);
  options?: DynamicModalOptions;
}

interface ConfirmModalState extends ConfirmOptions {
  id: string;
  resolve: (value: boolean) => void;
}

export interface ModalContextType {
  openModal: (
    id: string,
    content: ReactNode | ((helpers: { close: () => void }) => ReactNode),
    options?: DynamicModalOptions
  ) => void;
  closeModal: (id?: string) => void;
  closeAllModals: () => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (message: ReactNode, title?: string, options?: Partial<ConfirmOptions>) => Promise<void>;
}

const ModalGlobalContext = createContext<ModalContextType | null>(null);

export function useModalContext(): ModalContextType {
  const context = useContext(ModalGlobalContext);
  if (!context) {
    throw new Error('useModalContext must be used within a <ModalProvider>.');
  }
  return context;
}

/**
 * Convenient shorthand hook for alert & confirm dialogues.
 */
export function useConfirm() {
  const { confirm, alert } = useModalContext();
  return { confirm, alert };
}

export interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [dynamicModals, setDynamicModals] = useState<DynamicModalItem[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmModalState | null>(null);

  const openModal = useCallback(
    (
      id: string,
      content: ReactNode | ((helpers: { close: () => void }) => ReactNode),
      options?: DynamicModalOptions
    ) => {
      setDynamicModals((prev) => {
        const filtered = prev.filter((m) => m.id !== id);
        return [...filtered, { id, content, options }];
      });
    },
    []
  );

  const closeModal = useCallback((id?: string) => {
    setDynamicModals((prev) => {
      if (!id) {
        // Pop top modal if no ID provided
        const last = prev[prev.length - 1];
        last?.options?.onClose?.();
        return prev.slice(0, -1);
      }
      const target = prev.find((m) => m.id === id);
      target?.options?.onClose?.();
      return prev.filter((m) => m.id !== id);
    });
  }, []);

  const closeAllModals = useCallback(() => {
    setDynamicModals((prev) => {
      prev.forEach((m) => m.options?.onClose?.());
      return [];
    });
    if (confirmDialog) {
      confirmDialog.resolve(false);
      setConfirmDialog(null);
    }
  }, [confirmDialog]);

  const confirm = useCallback(
    (options: ConfirmOptions): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        setConfirmDialog({
          id: `confirm-${Date.now()}`,
          resolve,
          ...options,
        });
      });
    },
    []
  );

  const alert = useCallback(
    (message: ReactNode, title = 'ALERT', options: Partial<ConfirmOptions> = {}): Promise<void> => {
      return new Promise<void>((resolve) => {
        setConfirmDialog({
          id: `alert-${Date.now()}`,
          title,
          message,
          confirmText: options.confirmText || 'OK',
          cancelText: undefined, // No cancel button for alert
          variant: options.variant || 'cyan',
          size: options.size || 'sm',
          closeOnEscape: options.closeOnEscape ?? true,
          closeOnOverlayClick: options.closeOnOverlayClick ?? true,
          resolve: () => resolve(),
        });
      });
    },
    []
  );

  const contextValue = useMemo(
    () => ({
      openModal,
      closeModal,
      closeAllModals,
      confirm,
      alert,
    }),
    [openModal, closeModal, closeAllModals, confirm, alert]
  );

  return (
    <ModalGlobalContext.Provider value={contextValue}>
      {children}

      {/* Render Dynamic Stack Modals */}
      {dynamicModals.map((item) => {
        const handleClose = () => closeModal(item.id);
        const contentNode =
          typeof item.content === 'function'
            ? item.content({ close: handleClose })
            : item.content;

        return (
          <Modal
            key={item.id}
            isOpen={true}
            onClose={handleClose}
            title={item.options?.title}
            subtitle={item.options?.subtitle}
            size={item.options?.size || 'md'}
            variant={item.options?.variant || 'default'}
            closeOnEscape={item.options?.closeOnEscape ?? true}
            closeOnOverlayClick={item.options?.closeOnOverlayClick ?? true}
            footer={item.options?.footer}
          >
            {contentNode}
          </Modal>
        );
      })}

      {/* Render Confirm / Alert Modal */}
      {confirmDialog && (
        <Modal
          isOpen={true}
          onClose={() => {
            confirmDialog.resolve(false);
            setConfirmDialog(null);
          }}
          title={confirmDialog.title || 'CONFIRMATION'}
          subtitle={confirmDialog.subtitle}
          size={confirmDialog.size || 'sm'}
          variant={confirmDialog.variant || 'destructive'}
          role="alertdialog"
          closeOnEscape={confirmDialog.closeOnEscape ?? true}
          closeOnOverlayClick={confirmDialog.closeOnOverlayClick ?? true}
          footer={
            <div className="flex items-center gap-3 w-full justify-end">
              {confirmDialog.cancelText !== undefined && (
                <Button
                  variant="white"
                  size="sm"
                  bracketed
                  onClick={() => {
                    confirmDialog.resolve(false);
                    setConfirmDialog(null);
                  }}
                  data-testid="modal-cancel-btn"
                >
                  {confirmDialog.cancelText || 'CANCEL'}
                </Button>
              )}
              <Button
                variant={
                  confirmDialog.variant === 'destructive' || confirmDialog.variant === 'pink'
                    ? 'pink'
                    : 'cyan'
                }
                size="sm"
                bracketed
                onClick={() => {
                  confirmDialog.resolve(true);
                  setConfirmDialog(null);
                }}
                data-testid="modal-confirm-btn"
              >
                {confirmDialog.confirmText || 'CONFIRM'}
              </Button>
            </div>
          }
        >
          <div className="py-2">{confirmDialog.message}</div>
        </Modal>
      )}
    </ModalGlobalContext.Provider>
  );
}

export default ModalProvider;
