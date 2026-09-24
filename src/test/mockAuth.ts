import { useAuth, type AuthContextProps } from 'react-oidc-context';
import { vi } from 'vitest';

/**
 * Подменяет useAuth. В тестовом файле нужен vi.mock('react-oidc-context', () => ({ useAuth: vi.fn() })).
 */
export function mockAuth(partial: Partial<AuthContextProps> = {}) {
  const auth = {
    isLoading: false,
    isAuthenticated: false,
    activeNavigator: undefined,
    error: undefined,
    user: null,
    signinRedirect: vi.fn(async () => undefined),
    signoutRedirect: vi.fn(async () => undefined),
    ...partial,
  };
  vi.mocked(useAuth).mockReturnValue(auth as unknown as AuthContextProps);
  return auth;
}
