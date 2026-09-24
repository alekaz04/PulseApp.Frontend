import { act, render, screen } from '@testing-library/react';
import type { UserManager } from 'oidc-client-ts';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AuthLayout from './AuthLayout';
import CallbackPage from './CallbackPage';
import { RequireAuth } from './RequireAuth';

// Настоящий AuthProvider (внутри AuthLayout) с фейковым UserManager: ловит гонки, которые не видны при моке useAuth
const fake = vi.hoisted(() => ({ manager: null as unknown }));
vi.mock('./userManager', () => ({ getUserManager: () => fake.manager }));

type FakeUser = { access_token: string; expired: boolean; profile: object; state?: unknown };

function fakeUserManager(user: FakeUser | null) {
  let renewErrorHandler: ((error: Error) => void) | null = null;
  const noop = () => undefined;
  const manager = {
    settings: {},
    events: {
      addUserLoaded: noop,
      removeUserLoaded: noop,
      addUserUnloaded: noop,
      removeUserUnloaded: noop,
      addUserSignedOut: noop,
      removeUserSignedOut: noop,
      addSilentRenewError: (handler: (error: Error) => void) => {
        renewErrorHandler = handler;
      },
      removeSilentRenewError: noop,
    },
    signinCallback: vi.fn(async () => user),
    getUser: vi.fn(async () => user),
    signinRedirect: vi.fn(async () => undefined),
  };
  fake.manager = manager as unknown as UserManager;
  return {
    manager,
    fireSilentRenewError: (error: Error) => renewErrorHandler?.(error),
  };
}

function renderApp(path: string) {
  // AuthProvider проверяет параметры входа по window.location, а не по адресу роутера
  window.history.replaceState({}, '', path);
  const router = createMemoryRouter(
    [
      {
        element: <AuthLayout />,
        children: [
          { path: '/auth/callback', element: <CallbackPage /> },
          { path: '/app', element: <p>кабинет</p> },
          {
            path: '/app/invite',
            element: (
              <RequireAuth>
                <p>страница ссылки</p>
              </RequireAuth>
            ),
          },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

// Data-роутер при навигации создаёт Request с AbortSignal из jsdom, а Request из Node такой signal не принимает
const NativeRequest = globalThis.Request;
class RequestWithoutJsdomSignal extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init ? { ...init, signal: undefined } : init);
  }
}

beforeEach(() => {
  vi.stubGlobal('Request', RequestWithoutJsdomSignal);
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState({}, '', '/');
});

describe('вход с настоящим AuthProvider', () => {
  it('после входа возвращает на страницу, с которой ушли в Keycloak', async () => {
    fakeUserManager({ access_token: 't', expired: false, profile: {}, state: { returnTo: '/app/invite' } });

    const router = renderApp('/auth/callback?code=abc&state=xyz');

    expect(await screen.findByText('страница ссылки')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/app/invite');
  });

  it('returnTo вне кабинета игнорируется', async () => {
    fakeUserManager({ access_token: 't', expired: false, profile: {}, state: { returnTo: 'https://evil.example' } });

    renderApp('/auth/callback?code=abc&state=xyz');

    expect(await screen.findByText('кабинет')).toBeInTheDocument();
  });

  it('сбой фонового обновления токена не закрывает открытую страницу кабинета', async () => {
    const { fireSilentRenewError } = fakeUserManager({ access_token: 't', expired: false, profile: {} });
    renderApp('/app/invite');
    expect(await screen.findByText('страница ссылки')).toBeInTheDocument();

    act(() => fireSilentRenewError(new Error('network')));

    expect(screen.getByText('страница ссылки')).toBeInTheDocument();
    expect(screen.queryByText('Не удалось проверить вход')).not.toBeInTheDocument();
  });
});
