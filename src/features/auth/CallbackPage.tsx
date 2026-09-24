import { useAuth } from 'react-oidc-context';
import { Navigate } from 'react-router';
import { ErrorState } from '../../shared/ui/ErrorState';
import { FullPageSpinner } from '../../shared/ui/Spinner';

/**
 * Ответ Keycloak обрабатывает AuthProvider (AuthLayout), а после успеха сам переходит на returnTo.
 * Здесь — только ожидание и ошибка.
 */
export default function CallbackPage() {
  const auth = useAuth();

  if (auth.error) {
    return <ErrorState message="Не удалось войти" onRetry={() => void auth.signinRedirect()} />;
  }
  if (!auth.isLoading && !auth.activeNavigator) {
    return <Navigate to="/app" replace />;
  }
  return <FullPageSpinner label="Входим…" />;
}
