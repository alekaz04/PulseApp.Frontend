import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { User } from 'oidc-client-ts';
import { useCallback, useState } from 'react';
import { AuthProvider } from 'react-oidc-context';
import { Outlet, useNavigate } from 'react-router';
import { ToastProvider } from '../../shared/ui/ToastProvider';
import { getUserManager } from './userManager';

type AuthState = { returnTo?: string };

/**
 * Корень чанка кабинета: вход, серверное состояние и тосты. Страница подписки сюда не входит.
 */
export default function AuthLayout() {
  const navigate = useNavigate();
  const [userManager] = useState(getUserManager);
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } }),
  );

  const onSigninCallback = useCallback(
    (user: User | undefined) => {
      const returnTo = (user?.state as AuthState | undefined)?.returnTo;
      navigate(returnTo && returnTo.startsWith('/app') ? returnTo : '/app', { replace: true });
    },
    [navigate],
  );

  return (
    <AuthProvider userManager={userManager} onSigninCallback={onSigninCallback}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <Outlet />
        </ToastProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}
