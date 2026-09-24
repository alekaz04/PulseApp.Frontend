import { useEffect, useRef, type ReactNode } from 'react';
import { useAuth } from 'react-oidc-context';
import { useLocation } from 'react-router';
import { ErrorState } from '../../shared/ui/ErrorState';
import { FullPageSpinner } from '../../shared/ui/Spinner';

export function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const location = useLocation();
  const started = useRef(false);
  const needsLogin = !auth.isLoading && !auth.isAuthenticated && !auth.activeNavigator && !auth.error;

  useEffect(() => {
    if (needsLogin && !started.current) {
      started.current = true;
      void auth.signinRedirect({ state: { returnTo: location.pathname + location.search } });
    }
  }, [needsLogin, auth, location.pathname, location.search]);

  if (auth.error) {
    return <ErrorState message="Не удалось проверить вход" onRetry={() => void auth.signinRedirect()} />;
  }
  if (auth.isAuthenticated) {
    return <>{children}</>;
  }
  return <FullPageSpinner label="Проверяем вход…" />;
}
