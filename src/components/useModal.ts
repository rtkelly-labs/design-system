import { useState, useCallback, useId } from 'react';

export interface UseModalOptions<T = any> {
  defaultOpen?: boolean;
  defaultData?: T | null;
  onOpen?: (data?: T) => void;
  onClose?: () => void;
}

export interface UseModalReturn<T = any> {
  isOpen: boolean;
  data: T | null;
  open: (payload?: T) => void;
  close: () => void;
  toggle: (payload?: T) => void;
  setData: (data: T | null | ((prev: T | null) => T | null)) => void;
  modalProps: {
    isOpen: boolean;
    onClose: () => void;
  };
}

/**
 * Hook for managing local modal state, payload data, and open/close handlers.
 */
export function useModal<T = any>(options: UseModalOptions<T> = {}): UseModalReturn<T> {
  const { defaultOpen = false, defaultData = null, onOpen, onClose } = options;
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);
  const [data, setData] = useState<T | null>(defaultData);

  const open = useCallback(
    (payload?: T) => {
      if (payload !== undefined) {
        setData(payload);
      }
      setIsOpen(true);
      onOpen?.(payload);
    },
    [onOpen]
  );

  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  const toggle = useCallback(
    (payload?: T) => {
      setIsOpen((prev) => {
        const next = !prev;
        if (next) {
          if (payload !== undefined) setData(payload);
          onOpen?.(payload);
        } else {
          onClose?.();
        }
        return next;
      });
    },
    [onOpen, onClose]
  );

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
    setData,
    modalProps: {
      isOpen,
      onClose: close,
    },
  };
}

export default useModal;
