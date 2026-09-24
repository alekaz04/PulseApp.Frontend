import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from 'react-oidc-context';
import { Outlet } from 'react-router';
import { ToastProvider } from '../../shared/ui/ToastProvider';
import { getUserManager } from './userManager';

/**
 * Корень чанка кабинета: вход, серверное состояние и тосты. Страница подписки сюда не входит.
 * После входа на returnTo переводит CallbackPage.
 */
export default function AuthLayout() {
  const [userManager] = useState(getUserManager);
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } }),
  );

  return (
    <AuthProvider userManager={userManager}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <Outlet />
        </ToastProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}
