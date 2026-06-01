import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type ToastVariant = 'default' | 'success' | 'error';

interface ToastMessage {
  id: number;
  text: string;
  variant: ToastVariant;
}

export interface ToastContextValue {
  show: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<ToastMessage[]>([]);

  const show = useCallback((message: string, variant: ToastVariant = 'default') => {
    const id = Date.now();
    setQueue((prev) => [...prev, { id, text: message, variant }]);

    window.setTimeout(() => {
      setQueue((prev) => prev.filter((item) => item.id !== id));
    }, 2600);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({ show }),
    [show],
  );

  const current = queue[0] ?? null;

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={`toast ${current ? 'show' : ''} ${current?.variant ?? 'default'}`}
        role="status"
        aria-live="polite"
      >
        {current?.text ?? ''}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
