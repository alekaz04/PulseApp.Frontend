import { useAuth } from 'react-oidc-context';
import { Navigate } from 'react-router';
import { ErrorState } from '../../shared/ui/ErrorState';
import { FullPageSpinner } from '../../shared/ui/Spinner';
import { safeReturnTo } from './returnTo';

/**
 * Ответ Keycloak обрабатывает AuthProvider (AuthLayout). Переход на returnTo делаем здесь, когда вход
 * завершён: навигация из onSigninCallback проигрывает гонку с обновлением состояния AuthProvider.
 */
export default function CallbackPage() {
  const auth = useAuth();

  if (auth.error) {
    return (
      <ErrorState
        message="Не удалось войти"
        onRetry={() => void auth.signinRedirect({ state: { returnTo: '/app' } })}
      />
    );
  }
  if (!auth.isLoading && !auth.activeNavigator) {
    return <Navigate to={safeReturnTo(auth.user?.state)} replace />;
  }
  return <FullPageSpinner label="Входим…" />;
}
