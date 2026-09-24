import { createContext, useContext } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export type ToastOptions = {
  type?: ToastType;
  traceId?: string | null;
};

export type ToastApi = {
  show: (message: string, options?: ToastOptions) => void;
};

export const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) {
    throw new Error('useToast нужно вызывать внутри ToastProvider');
  }
  return api;
}
