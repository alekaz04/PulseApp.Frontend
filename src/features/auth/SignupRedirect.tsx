import { useEffect, useRef } from 'react';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router';
import { FullPageSpinner } from '../../shared/ui/Spinner';

export default function SignupRedirect() {
  const auth = useAuth();
  const navigate = useNavigate();
  const started = useRef(false);

  useEffect(() => {
    if (started.current || auth.isLoading) {
      return;
    }
    started.current = true;
    if (auth.isAuthenticated) {
      navigate('/app', { replace: true });
      return;
    }
    // prompt=create открывает в Keycloak сразу форму регистрации
    void auth.signinRedirect({ prompt: 'create', state: { returnTo: '/app' } });
  }, [auth, navigate]);

  return <FullPageSpinner label="Открываем регистрацию…" />;
}
