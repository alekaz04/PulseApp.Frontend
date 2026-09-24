import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import styles from './Toast.module.css';
import { ToastContext, type ToastOptions, type ToastType } from './toastContext';

export const TOAST_TIMEOUT_MS = 4000;

type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
  traceId: string | null;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const show = useCallback((message: string, options: ToastOptions = {}) => {
    const id = nextId.current;
    nextId.current += 1;
    setItems((prev) => [...prev, { id, message, type: options.type ?? 'info', traceId: options.traceId ?? null }]);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.container}>
        {items.map((item) => (
          <Toast key={item.id} item={item} onClose={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ item, onClose }: { item: ToastItem; onClose: (id: number) => void }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onClose(item.id), TOAST_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [item.id, onClose]);

  return (
    <div className={`${styles.toast} ${styles[item.type] ?? ''}`} role={item.type === 'error' ? 'alert' : 'status'}>
      <div className={styles.body}>
        <p>{item.message}</p>
        {item.traceId && <p className={styles.trace}>{`Код: ${item.traceId}`}</p>}
      </div>
      <button type="button" className={styles.close} onClick={() => onClose(item.id)} aria-label="Закрыть уведомление">
        ×
      </button>
    </div>
  );
}
